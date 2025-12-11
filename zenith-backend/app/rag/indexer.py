"""
Content Indexer - Index text content with embeddings to Pinecone
Supports category-based metadata for MLRIT chatbot
"""
from typing import List, Dict, Optional
import logging
from datetime import datetime

from app.rag.embeddings import embedding_service
from app.database import pinecone_db

logger = logging.getLogger(__name__)


class ContentIndexer:
    """Service for indexing text content to Pinecone vector database"""
    
    def __init__(self, chunk_size: int = 300, chunk_overlap: int = 50):
        """
        Initialize content indexer
        
        Args:
            chunk_size: Number of characters per chunk (reduced to 300 for better granularity)
            chunk_overlap: Overlap between chunks
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def chunk_text(self, text: str) -> List[str]:
        """
        Split text into semantic chunks (smaller, focused chunks)
        
        Args:
            text: Text to chunk
            
        Returns:
            List of text chunks
        """
        if not text or not text.strip():
            return []
        
        chunks = []
        text = text.strip()
        
        # Split by sections (Page markers, headers, or double newlines)
        sections = []
        
        # Try splitting by "Page X —" markers first
        if "Page " in text and "—" in text:
            import re
            parts = re.split(r'Page \d+ —[^\n]*\n', text)
            sections = [p.strip() for p in parts if p.strip()]
        else:
            # Split by double newlines (paragraphs)
            sections = [p.strip() for p in text.split('\n\n') if p.strip()]
        
        # Create smaller semantic chunks
        current_chunk = ""
        
        for section in sections:
            section = section.strip()
            if not section:
                continue
            
            # If section itself is too long, split it further
            if len(section) > self.chunk_size:
                # Split long sections by sentences
                sentences = section.replace('. ', '.|').split('|')
                for sent in sentences:
                    sent = sent.strip()
                    if not sent:
                        continue
                    
                    if len(current_chunk) + len(sent) > self.chunk_size and current_chunk:
                        chunks.append(current_chunk.strip())
                        current_chunk = sent
                    else:
                        current_chunk = current_chunk + " " + sent if current_chunk else sent
            else:
                # Add section to current chunk
                if len(current_chunk) + len(section) > self.chunk_size and current_chunk:
                    chunks.append(current_chunk.strip())
                    current_chunk = section
                else:
                    current_chunk = current_chunk + "\n\n" + section if current_chunk else section
        
        # Add remaining chunk
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        logger.info(f"📝 Chunked text: {len(text)} chars → {len(chunks)} chunks (semantic chunks)")
        return chunks
    
    async def index_text(
        self,
        text: str,
        metadata: Dict = None,
        namespace: str = None
    ) -> Dict:
        """
        Index text content to Pinecone
        
        Args:
            text: Text content to index
            metadata: Additional metadata (category, source, etc.)
            namespace: Pinecone namespace (derived from category if not provided)
            
        Returns:
            Dict with indexing results
        """
        try:
            if not text or not text.strip():
                return {"success": False, "message": "Empty text provided"}
            
            # Prepare metadata
            meta = metadata or {}
            category = meta.get("category", "general")
            
            # Use category as namespace if not provided
            if not namespace:
                namespace = category
            
            logger.info(f"🚀 Indexing text to namespace '{namespace}' | Category: {category}")
            
            # Chunk text
            chunks = self.chunk_text(text)
            
            if not chunks:
                return {"success": False, "message": "No chunks created from text"}
            
            # Generate embeddings for each chunk
            vectors = []
            
            for idx, chunk in enumerate(chunks):
                try:
                    # Get embedding
                    embedding = embedding_service.generate_embedding(chunk)
                    
                    # Create vector ID
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    vector_id = f"{category}_{timestamp}_{idx}"
                    
                    # Prepare metadata for this chunk
                    chunk_meta = {
                        **meta,
                        "text": chunk,
                        "chunk_index": idx,
                        "total_chunks": len(chunks),
                        "indexed_at": datetime.now().isoformat(),
                        "namespace": namespace
                    }
                    
                    vectors.append({
                        "id": vector_id,
                        "values": embedding,
                        "metadata": chunk_meta
                    })
                    
                except Exception as e:
                    logger.error(f"❌ Error creating embedding for chunk {idx}: {e}")
                    continue
            
            if not vectors:
                return {"success": False, "message": "Failed to create embeddings"}
            
            # Upsert to Pinecone
            pinecone_db.index.upsert(vectors=vectors, namespace=namespace)
            
            logger.info(f"✅ Indexed {len(vectors)} vectors to namespace '{namespace}'")
            
            return {
                "success": True,
                "message": f"Indexed {len(vectors)} text chunks",
                "chunks": len(vectors),
                "namespace": namespace,
                "category": category
            }
            
        except Exception as e:
            logger.error(f"❌ Error indexing text: {e}")
            return {"success": False, "message": str(e)}
    
    async def index_document(
        self,
        text: str,
        category: str,
        source: str,
        additional_metadata: Dict = None
    ) -> Dict:
        """
        Index a document with category and source metadata
        
        Args:
            text: Document text
            category: Content category
            source: Source name (filename, URL, etc.)
            additional_metadata: Optional additional metadata
            
        Returns:
            Dict with indexing results
        """
        metadata = {
            "category": category,
            "source": source,
            "type": "document",
            **(additional_metadata or {})
        }
        
        return await self.index_text(text=text, metadata=metadata, namespace=category)


# Global instance
indexer = ContentIndexer()
