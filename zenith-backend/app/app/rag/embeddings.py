"""
RAG (Retrieval-Augmented Generation) Pipeline
Handles embeddings using sentence-transformers (no LM Studio needed)
"""
from typing import List, Dict, Any, Optional
import uuid
from sentence_transformers import SentenceTransformer
from app.config import settings
from app.database import pinecone_db, Namespaces
import logging

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating embeddings using sentence-transformers"""
    
    def __init__(self):
        # Use all-mpnet-base-v2 for 768-dimensional embeddings (matches Pinecone index)
        model_name = "sentence-transformers/all-mpnet-base-v2"
        logger.info(f"🔄 Loading embedding model: {model_name} (768D)")
        self.model = SentenceTransformer(model_name)
        logger.info(f"✅ Embedding model loaded successfully")
    
    def generate_embedding(self, text: str) -> List[float]:
        """Generate 768-dimensional embedding for text"""
        try:
            embedding = self.model.encode(text, convert_to_numpy=True)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            raise
    
    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts (batched for efficiency)"""
        try:
            logger.info(f"Generating embeddings for {len(texts)} texts...")
            embeddings = self.model.encode(texts, convert_to_numpy=True, show_progress_bar=True)
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Error generating embeddings: {str(e)}")
            raise


class VectorStore:
    """Service for storing and retrieving vectors from Pinecone"""
    
    _instance = None
    _initialized = False
    
    def __init__(self):
        # Lazy initialization - only connect when first used
        self._index = None
        self.embedding_service = EmbeddingService()
    
    @property
    def index(self):
        """Lazy load Pinecone index"""
        if self._index is None:
            self._index = pinecone_db.get_index()
        return self._index
    
    async def upsert_text(
        self, 
        text: str, 
        metadata: Dict[str, Any],
        namespace: str = "default",
        doc_id: Optional[str] = None
    ) -> str:
        """
        Store text as vector in Pinecone
        
        Args:
            text: Text to embed and store
            metadata: Metadata to associate with vector
            namespace: Pinecone namespace
            doc_id: Optional document ID (generates UUID if not provided)
        
        Returns:
            Document ID
        """
        try:
            # Generate embedding
            embedding = self.embedding_service.generate_embedding(text)
            
            # Generate ID if not provided
            if not doc_id:
                doc_id = str(uuid.uuid4())
            
            # Add text to metadata
            metadata["text"] = text
            
            # Upsert to Pinecone
            self.index.upsert(
                vectors=[(doc_id, embedding, metadata)],
                namespace=namespace
            )
            
            logger.info(f"✅ Upserted vector {doc_id} to namespace {namespace}")
            return doc_id
            
        except Exception as e:
            logger.error(f"Error upserting vector: {str(e)}")
            raise
    
    async def upsert_texts(
        self,
        texts: List[str],
        metadatas: List[Dict[str, Any]],
        namespace: str = "default",
        doc_ids: Optional[List[str]] = None
    ) -> List[str]:
        """
        Store multiple texts as vectors
        
        Args:
            texts: List of texts to embed and store
            metadatas: List of metadata dicts
            namespace: Pinecone namespace
            doc_ids: Optional list of document IDs
        
        Returns:
            List of document IDs
        """
        try:
            # Generate embeddings
            embeddings = self.embedding_service.generate_embeddings(texts)
            
            # Generate IDs if not provided
            if not doc_ids:
                doc_ids = [str(uuid.uuid4()) for _ in texts]
            
            # Add texts to metadata
            for i, text in enumerate(texts):
                metadatas[i]["text"] = text
            
            # Prepare vectors for upsert
            vectors = [
                (doc_ids[i], embeddings[i], metadatas[i])
                for i in range(len(texts))
            ]
            
            # Upsert to Pinecone in batches
            batch_size = 100
            for i in range(0, len(vectors), batch_size):
                batch = vectors[i:i + batch_size]
                self.index.upsert(vectors=batch, namespace=namespace)
            
            logger.info(f"✅ Upserted {len(vectors)} vectors to namespace {namespace}")
            return doc_ids
            
        except Exception as e:
            logger.error(f"Error upserting vectors: {str(e)}")
            raise
    
    async def search(
        self,
        query: str,
        namespace: str = "default",
        top_k: int = 5,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for similar vectors
        
        Args:
            query: Query text
            namespace: Pinecone namespace to search
            top_k: Number of results to return
            filter_metadata: Optional metadata filter
        
        Returns:
            List of matching results with text and metadata
        """
        try:
            # Generate query embedding
            query_embedding = self.embedding_service.generate_embedding(query)
            
            # Search Pinecone
            results = self.index.query(
                vector=query_embedding,
                namespace=namespace,
                top_k=top_k,
                include_metadata=True,
                filter=filter_metadata
            )
            
            # Format results
            formatted_results = []
            for match in results.matches:
                text_content = match.metadata.get("text", "")
                formatted_results.append({
                    "id": match.id,
                    "score": match.score,
                    "text": text_content,
                    "metadata": {k: v for k, v in match.metadata.items() if k != "text"}
                })
                
                # Debug logging
                if formatted_results and len(formatted_results) <= 2:  # Log first 2 matches
                    logger.info(f"  Match {len(formatted_results)}: id={match.id}, score={match.score:.3f}, text_len={len(text_content)}, has_metadata={bool(match.metadata)}")
            
            logger.info(f"Found {len(formatted_results)} results in namespace {namespace}")
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error searching vectors: {str(e)}")
            raise
    
    async def delete(self, doc_ids: List[str], namespace: str = "default"):
        """Delete vectors by IDs"""
        try:
            self.index.delete(ids=doc_ids, namespace=namespace)
            logger.info(f"Deleted {len(doc_ids)} vectors from namespace {namespace}")
        except Exception as e:
            logger.error(f"Error deleting vectors: {str(e)}")
            raise
    
    async def delete_namespace(self, namespace: str):
        """Delete all vectors in a namespace"""
        try:
            self.index.delete(delete_all=True, namespace=namespace)
            logger.info(f"Deleted all vectors from namespace {namespace}")
        except Exception as e:
            logger.error(f"Error deleting namespace: {str(e)}")
            raise


class TextChunker:
    """Service for chunking text into smaller pieces"""
    
    @staticmethod
    def chunk_text(
        text: str,
        chunk_size: int = 1000,
        chunk_overlap: int = 200
    ) -> List[str]:
        """
        Split text into overlapping chunks
        
        Args:
            text: Text to chunk
            chunk_size: Size of each chunk
            chunk_overlap: Overlap between chunks
        
        Returns:
            List of text chunks
        """
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            chunks.append(chunk.strip())
            start += chunk_size - chunk_overlap
        
        return chunks


# Global instances
embedding_service = EmbeddingService()
vector_store = VectorStore()
text_chunker = TextChunker()
