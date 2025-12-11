"""
RAG Chat Service
Combines vector search with LLM to answer questions
"""
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime
from app.rag.embeddings import vector_store
from app.rag.llm import llm_service
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
        use_rag: bool = True
    ) -> Dict[str, Any]:
        """
        Answer user question using pure retrieval - just fetch and display matching content
        
        Args:
            question: User question
            conversation_id: Optional conversation ID for tracking
            use_rag: Whether to use RAG (vector search) or direct LLM
        
        Returns:
            Dict with answer, sources, and metadata
        """
        try:
            # Generate conversation ID if not provided
            if not conversation_id:
                conversation_id = str(uuid.uuid4())
            
            if use_rag:
                # Pure Retrieval: Search -> Return matching content
                sources = await self._retrieve_relevant_context(question)
                
                logger.info(f"🔍 Retrieved {len(sources)} sources from database")
                if sources:
                    for i, src in enumerate(sources[:3]):  # Log first 3
                        logger.info(f"  Source {i+1}: score={src.get('score', 0):.3f}, namespace={src.get('namespace', 'N/A')}, text_len={len(src.get('text', ''))}")
                
                if not sources:
                    # No relevant context found in database
                    answer = "I couldn't find any relevant information in the MLRIT knowledge base. Please try rephrasing your question or ask about:\n• Campus Events & Activities\n• Placement Statistics & Companies\n• Interview Experiences\n• Internship Opportunities\n• Student Clubs & Scholarships\n• Skill Development Programs"
                    return {
                        "answer": answer,
                        "sources": [],
                        "conversation_id": conversation_id,
                        "timestamp": datetime.utcnow(),
                        "used_rag": True
                    }
                
                # Build answer directly from retrieved sources (no LLM generation)
                answer_parts = []
                answer_parts.append(f"� Found {len(sources)} relevant document(s) in the database:\n")
                
                for i, source in enumerate(sources[:5], 1):  # Show top 5 results
                    text = source.get("text", "").strip()
                    score = source.get("score", 0)
                    namespace = source.get("namespace", "general")
                    
                    # Format as a card/section
                    answer_parts.append(f"\n📄 **Result {i}** (Relevance: {score*100:.1f}% | Category: {namespace})")
                    answer_parts.append(f"{text}\n")
                    answer_parts.append("─" * 50)
                
                answer = "\n".join(answer_parts)
                
                logger.info(f"✅ Returning {len(sources)} sources directly to user")
                
                return {
                    "answer": answer,
                    "sources": sources,
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
    
    async def _retrieve_relevant_context(self, question: str) -> List[Dict[str, Any]]:
        """
        Retrieve relevant context from all namespaces
        
        Args:
            question: User question
        
        Returns:
            List of relevant documents with scores
        """
        all_results = []
        
        # Define namespaces to search
        namespaces = [
            Namespaces.EVENTS,
            Namespaces.PLACEMENTS,
            Namespaces.INTERVIEWS,
            Namespaces.INTERNSHIPS,
            Namespaces.SKILLS,
            Namespaces.RESUME_GUIDES,
            Namespaces.CLUBS,
            Namespaces.SCHOLARSHIPS
        ]
        
        # Search each namespace
        for namespace in namespaces:
            try:
                results = await self.vector_store.search(
                    query=question,
                    namespace=namespace,
                    top_k=2  # Get top 2 from each namespace
                )
                
                # Add namespace to results
                for result in results:
                    result["namespace"] = namespace
                    all_results.append(result)
            
            except Exception as e:
                logger.warning(f"Error searching namespace {namespace}: {str(e)}")
                continue
        
        # Sort by score (highest first) and take top K
        all_results.sort(key=lambda x: x["score"], reverse=True)
        return all_results[:self.top_k]
    
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
