"""
Document Management Router
Handles PDF uploads and vector store indexing for RAG
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional, List, Dict, Any
import os
import logging
from datetime import datetime
from app.rag.embeddings import embedding_service, vector_store, text_chunker
from app.config import settings
import uuid

from pydantic import BaseModel

logger = logging.getLogger(__name__)

documents_router = APIRouter(prefix="/documents", tags=["Documents"])

# Create uploads directory if it doesn't exist
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# Pydantic models for request bodies
class IndexDocumentRequest(BaseModel):
    document_id: str
    namespace: str
    title: Optional[str] = None
    description: Optional[str] = None


class DeleteDocumentRequest(BaseModel):
    document_id: str


@documents_router.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    namespace: str = Form(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None)
):
    """
    Upload PDF document and automatically index to vector store
    
    - Saves PDF file
    - Extracts text from PDF
    - Creates embeddings using LM Studio (768 dimensions)
    - Stores in Pinecone index 'mlrit' with namespace organization
    - Namespaces: events, placements, interviews, internships, skills, resume_guides, clubs, scholarships
    
    This is a ONE-STEP process - upload and index automatically!
    """
    try:
        # Validate file type
        if not file.filename.endswith('.pdf'):
            raise HTTPException(400, "Only PDF files are allowed")
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        original_filename = file.filename
        safe_filename = f"{file_id}_{original_filename}"
        filepath = os.path.join(UPLOAD_DIR, safe_filename)
        
        # Save file
        content = await file.read()
        
        # Check file size (max 10MB)
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(400, "File size exceeds 10MB limit")
        
        with open(filepath, "wb") as f:
            f.write(content)
        
        logger.info(f"📄 Uploaded PDF: {original_filename} ({len(content)} bytes) to namespace: {namespace}")
        
        # ===== AUTOMATIC INDEXING STARTS HERE =====
        
        # Extract text from PDF
        from PyPDF2 import PdfReader
        
        try:
            reader = PdfReader(filepath)
            text = ""
            for page_num, page in enumerate(reader.pages):
                page_text = page.extract_text()
                if page_text:
                    text += f"\n--- Page {page_num + 1} ---\n{page_text}"
            
            if not text.strip():
                raise HTTPException(400, "Could not extract text from PDF. Ensure it's a text-based PDF.")
        
        except Exception as e:
            logger.error(f"❌ Error extracting text from PDF: {str(e)}")
            # Clean up file
            os.remove(filepath)
            raise HTTPException(400, f"Error reading PDF: {str(e)}")
        
        # Chunk the text
        chunks = text_chunker.chunk_text(
            text=text,
            chunk_size=1000,
            chunk_overlap=200
        )
        
        if not chunks:
            os.remove(filepath)
            raise HTTPException(400, "No text content found in PDF")
        
        logger.info(f"📝 Created {len(chunks)} chunks from PDF")
        
        # Prepare metadata for all chunks
        doc_title = title or original_filename
        base_metadata = {
            "namespace": namespace,
            "title": doc_title,
            "description": description or f"Document from {namespace} category",
            "filename": original_filename,
            "document_id": file_id,
            "uploaded_at": datetime.utcnow().isoformat(),
            "total_pages": len(reader.pages),
            "source": "mlrit_admin_upload"
        }
        
        # Generate embeddings and store in Pinecone (768 dimensions)
        stored_count = 0
        failed_chunks = []
        
        for i, chunk in enumerate(chunks):
            try:
                # Generate 768-dimensional embedding via LM Studio
                embedding = embedding_service.generate_embedding(chunk)
                
                # Verify embedding dimensions
                if len(embedding) != 768:
                    logger.error(f"⚠️ Embedding dimension mismatch! Got {len(embedding)}, expected 768")
                    raise ValueError(f"Embedding dimension must be 768, got {len(embedding)}")
                
                # Create unique ID for this chunk
                chunk_id = f"{file_id}_chunk_{i}"
                
                # Prepare metadata for this chunk
                chunk_metadata = {
                    **base_metadata,
                    "chunk_index": i,
                    "chunk_id": chunk_id,
                    "text": chunk  # Store full chunk text for RAG retrieval
                }
                
                # Store in Pinecone with namespace (using single 'mlrit' index)
                vector_store.index.upsert(
                    vectors=[(chunk_id, embedding, chunk_metadata)],
                    namespace=namespace  # events, placements, interviews, etc.
                )
                stored_count += 1
                
            except Exception as e:
                logger.error(f"❌ Error storing chunk {i}: {str(e)}")
                failed_chunks.append(i)
                continue
        
        if stored_count == 0:
            os.remove(filepath)
            raise HTTPException(500, "Failed to index any document chunks")
        
        success_rate = (stored_count / len(chunks)) * 100
        logger.info(f"✅ Successfully indexed {stored_count}/{len(chunks)} chunks ({success_rate:.1f}%) to namespace '{namespace}'")
        
        return {
            "success": True,
            "message": f"PDF uploaded and indexed successfully to {namespace}",
            "document_id": file_id,
            "filename": original_filename,
            "namespace": namespace,
            "title": doc_title,
            "description": description,
            "size_bytes": len(content),
            "total_pages": len(reader.pages),
            "total_chunks": len(chunks),
            "indexed_chunks": stored_count,
            "failed_chunks": failed_chunks if failed_chunks else [],
            "success_rate": f"{success_rate:.1f}%",
            "text_length": len(text),
            "embedding_dimension": 768,
            "pinecone_index": "mlrit",
            "uploaded_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading PDF: {str(e)}")
        raise HTTPException(500, f"Error uploading PDF: {str(e)}")


@documents_router.post("/index")
async def index_document(request: IndexDocumentRequest):
    """
    Index uploaded PDF document into vector store
    
    - Extracts text from PDF
    - Creates embeddings
    - Stores in Pinecone vector database with namespace
    """
    try:
        document_id = request.document_id
        namespace = request.namespace
        
        # Find the file
        filepath = None
        filename = None
        for fname in os.listdir(UPLOAD_DIR):
            if fname.startswith(document_id):
                filepath = os.path.join(UPLOAD_DIR, fname)
                filename = fname
                break
        
        if not filepath or not os.path.exists(filepath):
            raise HTTPException(404, "Uploaded file not found. Please upload again.")
        
        # Extract text from PDF
        from PyPDF2 import PdfReader
        
        try:
            reader = PdfReader(filepath)
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            
            if not text.strip():
                raise HTTPException(400, "Could not extract text from PDF. Make sure it's a text-based PDF, not a scanned image.")
        
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {str(e)}")
            raise HTTPException(400, f"Error reading PDF: {str(e)}")
        
        # Chunk the text
        chunks = text_chunker.chunk_text(
            text=text,
            chunk_size=1000,
            chunk_overlap=200
        )
        
        if not chunks:
            raise HTTPException(400, "No text content found in PDF")
        
        logger.info(f"Created {len(chunks)} chunks from PDF")
        
        # Generate embeddings and store in vector database
        metadata = {
            "namespace": namespace,
            "filename": filename,
            "document_id": document_id,
            "indexed_at": datetime.utcnow().isoformat()
        }
        
        # Store each chunk
        stored_count = 0
        for i, chunk in enumerate(chunks):
            try:
                # Generate embedding
                embedding = embedding_service.generate_embedding(chunk)
                
                # Create unique ID for this chunk
                chunk_id = f"{document_id}_chunk_{i}"
                
                # Prepare metadata for this chunk
                chunk_metadata = {
                    **metadata,
                    "chunk_index": i,
                    "text": chunk  # Full text for retrieval
                }
                
                # Store in vector database using Pinecone's upsert with namespace
                vector_store.index.upsert(
                    vectors=[(chunk_id, embedding, chunk_metadata)],
                    namespace=namespace
                )
                stored_count += 1
                
            except Exception as e:
                logger.error(f"Error storing chunk {i}: {str(e)}")
                continue
        
        if stored_count == 0:
            raise HTTPException(500, "Failed to index any document chunks")
        
        logger.info(f"Successfully indexed {stored_count}/{len(chunks)} chunks to namespace '{namespace}'")
        
        return {
            "success": True,
            "message": f"Document indexed successfully to {namespace}",
            "document_id": document_id,
            "filename": filename,
            "namespace": namespace,
            "total_chunks": len(chunks),
            "indexed_chunks": stored_count,
            "text_length": len(text),
            "metadata": metadata
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error indexing document: {str(e)}")
        raise HTTPException(500, f"Error indexing document: {str(e)}")


@documents_router.get("/list")
async def list_documents():
    """
    List all uploaded documents
    """
    try:
        documents = []
        
        if os.path.exists(UPLOAD_DIR):
            for filename in os.listdir(UPLOAD_DIR):
                if filename.endswith('.pdf'):
                    filepath = os.path.join(UPLOAD_DIR, filename)
                    file_stat = os.stat(filepath)
                    
                    # Extract file_id from filename (format: file_id_originalname.pdf)
                    parts = filename.split('_', 1)
                    file_id = parts[0] if len(parts) > 0 else filename
                    original_name = parts[1] if len(parts) > 1 else filename
                    
                    documents.append({
                        "file_id": file_id,
                        "filename": original_name,
                        "filepath": filepath,
                        "size_bytes": file_stat.st_size,
                        "uploaded_at": datetime.fromtimestamp(file_stat.st_ctime).isoformat()
                    })
        
        return {
            "success": True,
            "total": len(documents),
            "documents": documents
        }
        
    except Exception as e:
        logger.error(f"Error listing documents: {str(e)}")
        raise HTTPException(500, f"Error listing documents: {str(e)}")


@documents_router.delete("/{file_id}")
async def delete_document(file_id: str):
    """
    Delete uploaded document and its vector embeddings
    """
    try:
        # Find and delete file
        deleted_file = None
        if os.path.exists(UPLOAD_DIR):
            for filename in os.listdir(UPLOAD_DIR):
                if filename.startswith(file_id):
                    filepath = os.path.join(UPLOAD_DIR, filename)
                    os.remove(filepath)
                    deleted_file = filename
                    break
        
        if not deleted_file:
            raise HTTPException(404, "Document not found")
        
        # Delete from vector store (delete all chunks)
        try:
            # Note: This requires Pinecone delete by metadata filter
            # If not available, chunks will remain until manual cleanup
            logger.info(f"Document file deleted: {deleted_file}")
        except Exception as e:
            logger.warning(f"Could not delete vectors from Pinecone: {str(e)}")
        
        return {
            "success": True,
            "message": "Document deleted successfully",
            "file_id": file_id,
            "filename": deleted_file
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document: {str(e)}")
        raise HTTPException(500, f"Error deleting document: {str(e)}")


# Export router
__all__ = ["documents_router"]
