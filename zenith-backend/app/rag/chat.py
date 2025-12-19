"""
RAG Chat Service
Combines vector search with LLM to answer questions
"""
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime
from app.rag.embeddings import vector_store
from app.rag.llm import llm_service
from app.rag.intent_handler import intent_handler
from app.config import settings
from app.database import Namespaces
import logging

logger = logging.getLogger(__name__)


class RAGChatService:
    """Service for RAG-based chat"""
    
    def __init__(self):
        self.vector_store = vector_store
        self.llm = llm_service
        self.top_k = settings.TOP_K_RESULTS
    
    async def answer_question(
        self,
        question: str,
        conversation_id: Optional[str] = None,
        use_rag: bool = True,
        conversation_history: List[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Answer user question using retrieval + Gemini formatting with conversation memory
        
        Args:
            question: User question
            conversation_id: Optional conversation ID for tracking
            use_rag: Whether to use RAG (vector search) or direct LLM
            conversation_history: Previous messages for context
        
        Returns:
            Dict with answer, sources, and metadata
        """
        try:
            # Generate conversation ID if not provided
            if not conversation_id:
                conversation_id = str(uuid.uuid4())
            
            # ============================================
            # STEP 0: Check for simple intents (greetings, farewells, etc.)
            # This handles common phrases WITHOUT calling LLM/RAG
            # ============================================
            was_handled, instant_response = intent_handler.handle_message(question)
            
            if was_handled:
                logger.info(f"✅ Intent handled locally - no LLM/RAG needed")
                return {
                    "answer": instant_response,
                    "sources": [],
                    "images": [],
                    "category": "greeting",
                    "conversation_id": conversation_id,
                    "timestamp": datetime.utcnow(),
                    "used_rag": False,
                    "handled_locally": True
                }
            
            if use_rag:
                # Step 1: Detect category using LLM
                detected_category = self.llm.detect_category(question)
                logger.info(f"🎯 Detected category: {detected_category}")
                
                # Step 2: Retrieval + Formatting: Search DB → Format with LLM
                sources = await self._retrieve_relevant_context(question, category=detected_category)
                
                logger.info(f"🔍 Retrieved {len(sources)} sources from database")
                if sources:
                    for i, src in enumerate(sources[:3]):  # Log first 3
                        logger.info(f"  Source {i+1}: score={src.get('score', 0):.3f}, namespace={src.get('namespace', 'N/A')}, text_len={len(src.get('text', ''))}")
                
                # Step 3: Retrieve associated images based on category and query
                images = await self._retrieve_relevant_images(question, detected_category)
                logger.info(f"🖼️ Found {len(images)} relevant images")
                
                if not sources:
                    # No relevant context found in database - simple message
                    answer = "I don't have that information in my knowledge base."
                    return {
                        "answer": answer,
                        "sources": [],
                        "images": images,
                        "category": detected_category,
                        "conversation_id": conversation_id,
                        "timestamp": datetime.utcnow(),
                        "used_rag": True
                    }
                
                # Extract raw text from retrieved sources
                context_chunks = [source["text"] for source in sources[:5]]  # Top 5 results
                
                # Use Gemini to format the retrieved content nicely
                logger.info(f"📝 Formatting {len(context_chunks)} retrieved documents with Gemini (with conversation context)")
                answer = self.llm.format_retrieved_content(
                    question=question,
                    retrieved_texts=context_chunks,
                    sources_metadata=sources[:5],
                    conversation_history=conversation_history or []
                )
                
                logger.info(f"✅ Formatted response ready")
                
                return {
                    "answer": answer,
                    "sources": sources,
                    "images": images,
                    "category": detected_category,
                    "conversation_id": conversation_id,
                    "timestamp": datetime.utcnow(),
                    "used_rag": True
                }
            
            else:
                # Direct LLM without RAG (fallback)
                answer = self.llm.generate_response(
                    prompt=question,
                    temperature=0.7
                )
                
                return {
                    "answer": answer,
                    "sources": [],
                    "conversation_id": conversation_id,
                    "timestamp": datetime.utcnow(),
                    "used_rag": False
                }
        
        except Exception as e:
            logger.error(f"Error answering question: {str(e)}")
            raise
    
    async def _retrieve_relevant_context(self, question: str, category: str = None) -> List[Dict[str, Any]]:
        """
        Retrieve relevant context from Pinecone.
        ALWAYS searches 'chatbot' and 'total' namespaces (where admin content lives)
        PLUS any category-specific namespace.
        
        Args:
            question: User question
            category: Detected category to search
        
        Returns:
            List of relevant documents with scores
        """
        all_results = []
        
        # CRITICAL: Always include these namespaces where admin-uploaded content lives
        primary_namespaces = ["chatbot", "total", ""]  # "" is default namespace
        
        # Build list of namespaces to search
        namespaces_to_search = set(primary_namespaces)
        
        # Also add detected category if it's not a general one
        if category and category not in ["general", "greeting", "query"]:
            namespaces_to_search.add(category)
        
        # Get all available namespaces from Pinecone for comprehensive search
        try:
            stats = self.vector_store.index.describe_index_stats()
            available_namespaces = list(stats.get('namespaces', {}).keys())
            logger.info(f"📊 Available namespaces in Pinecone: {available_namespaces}")
            
            # For comprehensive search, include all namespaces
            namespaces_to_search.update(available_namespaces)
        except Exception as e:
            logger.warning(f"⚠️ Could not get namespaces: {e}")
        
        # Remove empty strings duplicates and sort
        namespaces = sorted(list(namespaces_to_search))
        logger.info(f"🔍 Searching namespaces: {namespaces} for question: '{question[:50]}...'")
        
        # Search each namespace
        for namespace in namespaces:
            try:
                results = await self.vector_store.search(
                    query=question,
                    namespace=namespace,
                    top_k=10  # Get more results per namespace for better coverage
                )
                
                # Add namespace to results and filter by minimum score
                for result in results:
                    result["namespace"] = namespace
                    # Lower threshold to 0.15 to handle typos and variations
                    if result.get("score", 0) >= 0.15:
                        all_results.append(result)
            
            except Exception as e:
                logger.warning(f"⚠️ Error searching namespace {namespace}: {str(e)}")
                continue
        
        # Sort by score (highest first) and take top K
        all_results.sort(key=lambda x: x.get("score", 0), reverse=True)
        
        top_results = all_results[:self.top_k]
        
        if top_results:
            logger.info(f"✅ Found {len(all_results)} total results, returning top {len(top_results)}")
            for i, r in enumerate(top_results[:3]):
                logger.info(f"  Top {i+1}: score={r.get('score', 0):.3f}, ns={r.get('namespace')}, text='{r.get('text', '')[:80]}...'")
        else:
            logger.warning(f"⚠️ No results found for query: '{question}'")
        
        return top_results
    
    async def _retrieve_relevant_images(self, question: str, category: str) -> List[Dict[str, str]]:
        """
        Retrieve relevant images based on question and category
        
        Args:
            question: User question
            category: Detected category
            
        Returns:
            List of image URLs with labels
        """
        from app.services.image_service import image_storage
        
        try:
            images = []
            
            # Get images from the detected category
            category_images = await image_storage.get_images_by_category(category)
            
            if category_images:
                # Search for specific labels mentioned in question
                question_lower = question.lower()
                
                # Common keywords for image matching
                keywords = {
                    "chairman": ["chairman", "chair"],
                    "principal": ["principal", "head"],
                    "director": ["director"],
                    "hod": ["hod", "head of department"],
                    "event": ["event", "festival", "function"],
                    "sports": ["sports", "team", "match", "tournament"],
                    "campus": ["campus", "building", "infrastructure"],
                    "club": ["club"],
                }
                
                # Try to match specific labels
                for img in category_images[:5]:  # Limit to top 5 images
                    label_lower = img.label.lower()
                    
                    # Check if label or any keyword appears in question
                    if label_lower in question_lower:
                        images.append({
                            "url": image_storage.get_image_url(img.relative_path),
                            "label": img.label,
                            "description": img.description or "",
                            "category": img.category
                        })
                    else:
                        # Check keywords
                        for keyword, synonyms in keywords.items():
                            if any(syn in question_lower for syn in synonyms) and keyword in label_lower:
                                images.append({
                                    "url": image_storage.get_image_url(img.relative_path),
                                    "label": img.label,
                                    "description": img.description or "",
                                    "category": img.category
                                })
                                break
                
                # If no specific match, return first image from category
                if not images and category_images:
                    img = category_images[0]
                    images.append({
                        "url": image_storage.get_image_url(img.relative_path),
                        "label": img.label,
                        "description": img.description or "",
                        "category": img.category
                    })
            
            return images
            
        except Exception as e:
            logger.error(f"❌ Error retrieving images: {e}")
            return []
    
    async def index_document(
        self,
        text: str,
        metadata: Dict[str, Any],
        namespace: str = "default",
        chunk_size: int = 1000,
        chunk_overlap: int = 200
    ) -> List[str]:
        """
        Index a document into vector store (with chunking)
        
        Args:
            text: Document text
            metadata: Metadata to attach
            namespace: Pinecone namespace
            chunk_size: Size of text chunks
            chunk_overlap: Overlap between chunks
        
        Returns:
            List of document IDs
        """
        from app.rag.embeddings import text_chunker
        
        # Chunk text
        chunks = text_chunker.chunk_text(text, chunk_size, chunk_overlap)
        
        # Prepare metadata for each chunk
        metadatas = []
        for i, chunk in enumerate(chunks):
            chunk_metadata = metadata.copy()
            chunk_metadata["chunk_index"] = i
            chunk_metadata["total_chunks"] = len(chunks)
            metadatas.append(chunk_metadata)
        
        # Upsert to vector store
        doc_ids = await self.vector_store.upsert_texts(
            texts=chunks,
            metadatas=metadatas,
            namespace=namespace
        )
        
        logger.info(f"Indexed document with {len(chunks)} chunks into namespace {namespace}")
        return doc_ids


# Global instance
rag_chat_service = RAGChatService()
