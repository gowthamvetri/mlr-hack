"""
Admin Content Management Router
Handle admin uploads of text and images for MLRIT chatbot
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from typing import List, Optional
import logging
from pathlib import Path

from app.services.image_service import image_storage
from app.models.image import ContentUploadRequest, ContentUploadResponse
from app.rag.indexer import indexer
from app.rag.pdf_processor import pdf_processor

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])


@router.post("/upload-content", response_model=ContentUploadResponse)
async def upload_content(
    category: str = Form(..., description="Content category"),
    text_content: Optional[str] = Form(None, description="Text content to index"),
    images: List[UploadFile] = File(default=[], description="Images to upload"),
    image_labels: List[str] = Form(default=[], description="Labels for each image"),
    image_descriptions: List[str] = Form(default=[], description="Descriptions for each image")
):
    """
    Upload content (text + images) for a specific category
    
    Admin endpoint to add new content to the chatbot knowledge base.
    
    Categories: management, events, sports, about, academics, placements, clubs, scholarships
    
    Examples:
    - Category: "management", Image Label: "chairman", Text: "Dr. John Doe is the chairman..."
    - Category: "events", Image Label: "techfest_2024", Text: "Annual TechFest 2024..."
    """
    try:
        # Sanitize category name
        category = category.strip().lower().replace(' ', '_')
        
        if not category:
            raise HTTPException(status_code=400, detail="Category name is required")
        
        logger.info(f"📥 Admin content upload | Category: {category}")
        
        result = ContentUploadResponse(
            success=False,
            message="Processing..."
        )
        
        # Process text content
        if text_content and text_content.strip():
            try:
                # Index text with category metadata
                await indexer.index_text(
                    text=text_content,
                    metadata={
                        "category": category,
                        "source": "admin_upload",
                        "type": "text"
                    }
                )
                result.indexed_text = True
                result.text_chunks = len(text_content) // 500  # Approximate chunks
                logger.info(f"✅ Indexed text content: {len(text_content)} characters")
            except Exception as e:
                logger.error(f"❌ Error indexing text: {e}")
                raise HTTPException(status_code=500, detail=f"Error indexing text: {str(e)}")
        
        # Process images
        if images:
            if len(image_labels) != len(images):
                raise HTTPException(
                    status_code=400,
                    detail="Number of image labels must match number of images"
                )
            
            # Pad descriptions if not enough provided
            while len(image_descriptions) < len(images):
                image_descriptions.append(None)
            
            for idx, (image, label) in enumerate(zip(images, image_labels)):
                try:
                    description = image_descriptions[idx] if idx < len(image_descriptions) else None
                    
                    # Save image and metadata
                    metadata = await image_storage.save_image(
                        file=image,
                        category=category,
                        label=label.strip(),
                        description=description,
                        source="admin_upload"
                    )
                    
                    # Get image URL
                    image_url = image_storage.get_image_url(metadata.relative_path)
                    result.image_urls.append(image_url)
                    result.images_saved += 1
                    
                    logger.info(f"✅ Saved image {idx+1}/{len(images)}: {label}")
                    
                except Exception as e:
                    logger.error(f"❌ Error saving image {idx+1}: {e}")
                    raise HTTPException(status_code=500, detail=f"Error saving image: {str(e)}")
        
        result.success = True
        result.message = f"Successfully uploaded content to category '{category}'"
        
        logger.info(f"✅ Upload complete: {result.text_chunks} text chunks, {result.images_saved} images")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in content upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-pdf", response_model=ContentUploadResponse)
async def upload_pdf(
    file: UploadFile = File(..., description="PDF file to process"),
    category: str = Form(..., description="Content category"),
    extract_images: bool = Form(True, description="Extract images from PDF"),
    image_label_prefix: Optional[str] = Form(None, description="Prefix for image labels")
):
    """
    Upload and process a PDF file
    
    Extracts text and images from PDF, indexes text, and saves images with metadata.
    """
    try:
        logger.info(f"📄 Admin PDF upload | Category: {category} | File: {file.filename}")
        
        # Validate file type
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Save uploaded PDF temporarily
        temp_dir = Path("uploads/temp")
        temp_dir.mkdir(parents=True, exist_ok=True)
        temp_pdf = temp_dir / file.filename
        
        with open(temp_pdf, "wb") as f:
            f.write(await file.read())
        
        # Process PDF
        pdf_result = pdf_processor.process_pdf(
            pdf_path=str(temp_pdf),
            category=category,
            extract_images=extract_images
        )
        
        result = ContentUploadResponse(
            success=False,
            message="Processing PDF..."
        )
        
        # Index extracted text
        if pdf_result["text"]:
            try:
                await indexer.index_text(
                    text=pdf_result["text"],
                    metadata={
                        "category": category,
                        "source": file.filename,
                        "type": "pdf"
                    }
                )
                result.indexed_text = True
                result.text_chunks = len(pdf_result["text"]) // 500
                logger.info(f"✅ Indexed PDF text: {len(pdf_result['text'])} characters")
            except Exception as e:
                logger.error(f"❌ Error indexing PDF text: {e}")
        
        # Save extracted images to database
        label_prefix = image_label_prefix or file.filename.replace('.pdf', '')
        
        for img_data in pdf_result["images"]:
            try:
                from app.models.image import ImageMetadata
                
                # Create metadata object
                metadata = ImageMetadata(
                    filename=img_data["filename"],
                    category=category,
                    label=f"{label_prefix}_page{img_data['page_num']}",
                    relative_path=img_data["relative_path"],
                    width=img_data["width"],
                    height=img_data["height"],
                    format=img_data["format"],
                    source=file.filename,
                    page_num=img_data["page_num"]
                )
                
                # Save to database
                from app.database import mongodb
                if mongodb.client:
                    await mongodb.db.images.insert_one(metadata.dict())
                
                image_url = image_storage.get_image_url(img_data["relative_path"])
                result.image_urls.append(image_url)
                result.images_saved += 1
                
            except Exception as e:
                logger.warning(f"⚠️ Could not save image metadata: {e}")
        
        # Clean up temp file
        temp_pdf.unlink()
        
        result.success = True
        result.message = f"Successfully processed PDF: {file.filename}"
        
        logger.info(f"✅ PDF processing complete: {result.text_chunks} chunks, {result.images_saved} images")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error processing PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories")
async def get_categories():
    """
    Get list of all categories currently in use
    (Admin can create any category, no predefined list)
    """
    from app.database import mongodb
    
    try:
        categories = []
        
        if mongodb.client:
            # Get unique categories from images collection
            categories = await mongodb.db.images.distinct("category")
        
        return {
            "message": "Categories are dynamic - admin can create any category name",
            "existing_categories": sorted(categories) if categories else [],
            "examples": [
                "chairman", "principal", "events", "sports", "campus",
                "faculty", "departments", "facilities", "achievements"
            ]
        }
    
    except Exception as e:
        return {
            "message": "Categories are dynamic - admin can create any category name",
            "existing_categories": [],
            "examples": [
                "chairman", "principal", "events", "sports", "campus",
                "faculty", "departments", "facilities", "achievements"
            ]
        }


@router.get("/images/{category}")
async def get_category_images(category: str):
    """Get all images for a specific category"""
    try:
        images = await image_storage.get_images_by_category(category)
        
        return {
            "category": category,
            "count": len(images),
            "images": [
                {
                    "label": img.label,
                    "url": image_storage.get_image_url(img.relative_path),
                    "description": img.description,
                    "uploaded_at": img.uploaded_at
                }
                for img in images
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
