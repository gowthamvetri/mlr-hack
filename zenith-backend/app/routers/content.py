"""
Content Management Router
Handles chatbot content CRUD operations with Pinecone vector database
Reads existing content directly from Pinecone, stores new content to both Pinecone and MongoDB
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging
from datetime import datetime
import uuid

from app.rag.indexer import indexer
from app.rag.embeddings import vector_store, embedding_service
from app.database import pinecone_db, mongodb

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/content", tags=["Content Management"])


# Pydantic models
class LinkItem(BaseModel):
    name: str
    type: str  # linkedin, email, phone, website
    value: str


class ContentCreate(BaseModel):
    title: str
    text: str
    links: Optional[List[LinkItem]] = []
    namespace: Optional[str] = "chatbot"


class ContentUpdate(BaseModel):
    title: Optional[str] = None
    text: Optional[str] = None
    links: Optional[List[LinkItem]] = None


# MongoDB collection for content metadata
CONTENT_COLLECTION = "chatbot_content"


async def get_content_collection():
    """Get MongoDB collection for content metadata"""
    db = mongodb.get_database()
    if db is None:
        return None
    return db[CONTENT_COLLECTION]


def get_all_namespaces():
    """Get all namespaces from Pinecone index"""
    try:
        index = pinecone_db.get_index()
        stats = index.describe_index_stats()
        namespaces = list(stats.get('namespaces', {}).keys())
        return namespaces if namespaces else ['']  # '' is default namespace
    except Exception as e:
        logger.error(f"Error getting namespaces: {e}")
        return []


def fetch_pinecone_vectors_by_namespace(namespace: str = "", limit: int = 100):
    """
    Fetch vectors from Pinecone namespace using query with a neutral vector.
    This approach works reliably across Pinecone SDK versions.
    Returns list of vector records with metadata.
    """
    try:
        index = pinecone_db.get_index()
        
        # Get index stats to know the dimension
        stats = index.describe_index_stats()
        dimension = stats.get('dimension', 768)
        
        # Create a neutral query vector (zeros work for cosine similarity)
        # This will return vectors based on their stored values
        neutral_vector = [0.0] * dimension
        
        # Alternative: Use a random vector for more diverse results
        import random
        random_vector = [random.uniform(-0.1, 0.1) for _ in range(dimension)]
        
        # Query to get vectors with metadata
        query_response = index.query(
            vector=random_vector,
            namespace=namespace,
            top_k=min(limit, 10000),  # Pinecone max is 10000
            include_metadata=True,
            include_values=False  # Don't need the actual embedding values
        )
        
        vectors = []
        if query_response and hasattr(query_response, 'matches'):
            for match in query_response.matches:
                metadata = match.metadata if hasattr(match, 'metadata') and match.metadata else {}
                vectors.append({
                    'id': match.id,
                    'namespace': namespace,
                    'text': metadata.get('text', ''),
                    'title': metadata.get('title', metadata.get('category', metadata.get('source', 'Unknown'))),
                    'category': metadata.get('category', ''),
                    'source': metadata.get('source', ''),
                    'score': match.score if hasattr(match, 'score') else 0,
                    'metadata': metadata
                })
        
        logger.info(f"📦 Fetched {len(vectors)} vectors from namespace '{namespace or 'default'}'")
        return vectors
        
    except Exception as e:
        logger.error(f"Error fetching vectors from namespace '{namespace}': {e}")
        import traceback
        traceback.print_exc()
        return []


def group_vectors_by_source(vectors: List[Dict]) -> List[Dict]:
    """Group vectors by their source/title to show as logical content items"""
    groups = {}
    
    for vec in vectors:
        # Create group key from source or title
        source = vec.get('source', vec.get('title', 'Unknown'))
        category = vec.get('category', '')
        group_key = f"{category}_{source}" if category else source
        
        if group_key not in groups:
            groups[group_key] = {
                'id': vec['id'],  # Use first vector ID as group ID
                'title': vec.get('title') or category or source,
                'namespace': vec.get('namespace', ''),
                'category': category,
                'source': source,
                'chunks': [],
                'chunk_count': 0,
                'text_preview': ''
            }
        
        groups[group_key]['chunks'].append(vec)
        groups[group_key]['chunk_count'] += 1
        
        # Build text preview from first few chunks
        if vec.get('text') and len(groups[group_key]['text_preview']) < 500:
            groups[group_key]['text_preview'] += vec.get('text', '') + ' '
    
    # Convert to list and clean up
    result = []
    for key, group in groups.items():
        group['text_preview'] = group['text_preview'][:500].strip()
        if group['text_preview'] and len(group['text_preview']) >= 500:
            group['text_preview'] += '...'
        del group['chunks']  # Don't send all chunks to frontend
        result.append(group)
    
    return result


@router.get("")
async def list_content():
    """
    List all indexed chatbot content directly from Pinecone.
    Returns individual vectors with their text content.
    """
    try:
        all_content = []
        
        # Get all namespaces
        namespaces = get_all_namespaces()
        logger.info(f"📋 Found namespaces: {namespaces}")
        
        for namespace in namespaces:
            vectors = fetch_pinecone_vectors_by_namespace(namespace, limit=500)
            
            # Return each vector as an individual item
            for vec in vectors:
                text = vec.get('text', '')
                all_content.append({
                    'id': vec['id'],
                    'title': vec.get('title') or vec.get('category') or vec.get('source', 'Unknown'),
                    'namespace': namespace or 'default',
                    'category': vec.get('category', ''),
                    'source': vec.get('source', ''),
                    'text': text,  # Full text for expansion
                    'text_preview': text[:150] + '...' if len(text) > 150 else text,  # Short preview
                    'chunk_count': 1,  # Each is one chunk
                    'metadata': vec.get('metadata', {})
                })
        
        # Sort by title/category for better organization
        all_content.sort(key=lambda x: (x.get('namespace', ''), x.get('title', '')))
        
        logger.info(f"✅ Listed {len(all_content)} individual vectors")
        
        return {
            "success": True,
            "content": all_content,
            "total": len(all_content),
            "total_vectors": len(all_content),
            "namespaces": namespaces
        }
        
    except Exception as e:
        logger.error(f"Error listing content: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def add_content(request: ContentCreate):
    """
    Add new content to the chatbot knowledge base
    """
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text content is required")
        
        if not request.title.strip():
            raise HTTPException(status_code=400, detail="Title is required")
        
        # Prepare metadata for Pinecone
        metadata = {
            "category": request.title.lower().replace(" ", "_"),
            "source": f"admin_input_{request.title}",
            "type": "chatbot_content",
            "title": request.title,
        }
        
        # Add links to metadata if provided
        if request.links:
            links_text = []
            for link in request.links:
                links_text.append(f"{link.name}: {link.type} - {link.value}")
            metadata["links"] = links_text
            
            # Append links info to text for better RAG retrieval
            enhanced_text = request.text + "\n\nContact Information:\n" + "\n".join(links_text)
        else:
            enhanced_text = request.text
        
        # Index to Pinecone
        namespace = request.namespace or "chatbot"
        result = await indexer.index_text(
            text=enhanced_text,
            metadata=metadata,
            namespace=namespace
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("message", "Failed to index content"))
        
        # Also store metadata in MongoDB for easy management
        collection = await get_content_collection()
        if collection is not None:
            doc = {
                "title": request.title,
                "text": request.text,
                "links": [link.dict() for link in (request.links or [])],
                "namespace": namespace,
                "chunks": result.get("chunks", 0),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            insert_result = await collection.insert_one(doc)
            doc_id = str(insert_result.inserted_id)
        else:
            doc_id = str(uuid.uuid4())
        
        logger.info(f"✅ Added content: {request.title} ({result.get('chunks', 0)} chunks)")
        
        return {
            "success": True,
            "message": f"Content indexed successfully with {result.get('chunks', 0)} chunks",
            "id": doc_id,
            "chunks": result.get("chunks", 0),
            "namespace": namespace
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding content: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{vector_id}")
async def delete_content(vector_id: str, namespace: str = ""):
    """
    Delete specific content by vector ID from Pinecone
    """
    try:
        index = pinecone_db.get_index()
        
        # Delete from Pinecone
        index.delete(ids=[vector_id], namespace=namespace)
        
        logger.info(f"✅ Deleted vector: {vector_id} from namespace: {namespace or 'default'}")
        
        return {
            "success": True,
            "message": "Content deleted successfully"
        }
        
    except Exception as e:
        logger.error(f"Error deleting content: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/namespace/{namespace}")
async def delete_namespace_content(namespace: str):
    """
    Delete all content from a specific namespace
    """
    try:
        index = pinecone_db.get_index()
        
        # Delete all vectors in namespace
        index.delete(delete_all=True, namespace=namespace)
        
        logger.info(f"✅ Cleared namespace: {namespace}")
        
        return {
            "success": True,
            "message": f"Cleared all content from namespace '{namespace}'"
        }
        
    except Exception as e:
        logger.error(f"Error clearing namespace: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/clear/all")
async def clear_all_content():
    """
    Clear all chatbot content from all namespaces in Pinecone
    """
    try:
        index = pinecone_db.get_index()
        namespaces = get_all_namespaces()
        
        cleared_count = 0
        for namespace in namespaces:
            try:
                index.delete(delete_all=True, namespace=namespace)
                cleared_count += 1
                logger.info(f"✅ Cleared namespace: {namespace}")
            except Exception as e:
                logger.warning(f"Could not clear namespace {namespace}: {e}")
        
        # Also clear MongoDB collection
        collection = await get_content_collection()
        if collection is not None:
            await collection.delete_many({})
        
        logger.info(f"✅ Cleared all content from {cleared_count} namespaces")
        
        return {
            "success": True,
            "message": f"Cleared all content from {cleared_count} namespaces",
            "cleared_namespaces": cleared_count
        }
        
    except Exception as e:
        logger.error(f"Error clearing content: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_content_stats():
    """
    Get content statistics directly from Pinecone
    """
    try:
        index = pinecone_db.get_index()
        stats = index.describe_index_stats()
        
        namespaces_info = stats.get('namespaces', {})
        total_vectors = stats.get('total_vector_count', 0)
        
        namespace_list = []
        for ns_name, ns_data in namespaces_info.items():
            namespace_list.append({
                'name': ns_name or 'default',
                'vector_count': ns_data.get('vector_count', 0)
            })
        
        return {
            "success": True,
            "total_entries": len(namespace_list),
            "total_chunks": total_vectors,
            "namespaces": namespace_list,
            "dimension": stats.get('dimension', 768)
        }
        
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/namespaces")
async def list_namespaces():
    """
    List all Pinecone namespaces with their vector counts
    """
    try:
        index = pinecone_db.get_index()
        stats = index.describe_index_stats()
        
        namespaces_info = stats.get('namespaces', {})
        
        result = []
        for ns_name, ns_data in namespaces_info.items():
            result.append({
                'name': ns_name or 'default',
                'vector_count': ns_data.get('vector_count', 0)
            })
        
        return {
            "success": True,
            "namespaces": result,
            "total_vectors": stats.get('total_vector_count', 0)
        }
        
    except Exception as e:
        logger.error(f"Error listing namespaces: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search/{query}")
async def search_content(query: str, namespace: str = ""):
    """
    Search Pinecone for content matching a query.
    Useful for verifying what data exists.
    """
    try:
        # Search across all namespaces if none specified
        if not namespace:
            namespaces = get_all_namespaces()
        else:
            namespaces = [namespace]
        
        all_results = []
        
        for ns in namespaces:
            try:
                results = await vector_store.search(
                    query=query,
                    namespace=ns,
                    top_k=10
                )
                
                for result in results:
                    result['namespace'] = ns
                    all_results.append(result)
            except Exception as e:
                logger.warning(f"Error searching namespace {ns}: {e}")
        
        # Sort by score
        all_results.sort(key=lambda x: x.get('score', 0), reverse=True)
        
        return {
            "success": True,
            "query": query,
            "results": all_results[:20],  # Top 20
            "total_found": len(all_results)
        }
        
    except Exception as e:
        logger.error(f"Error searching content: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Export router
content_router = router
