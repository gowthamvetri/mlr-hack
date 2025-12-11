"""
Image Serving Router
Serve uploaded images for MLRIT chatbot
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/images", tags=["Images"])

# Base directory for images
IMAGE_BASE_DIR = Path("uploads/images")


@router.get("/{category}/{filename}")
async def serve_image(category: str, filename: str):
    """
    Serve an image file
    
    Args:
        category: Image category (management, events, sports, etc.)
        filename: Image filename
        
    Returns:
        Image file
    """
    try:
        # Construct file path
        file_path = IMAGE_BASE_DIR / category / filename
        
        # Check if file exists
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"Image not found: {category}/{filename}")
        
        # Check if it's actually a file (not a directory)
        if not file_path.is_file():
            raise HTTPException(status_code=400, detail="Invalid file path")
        
        # Return image file
        return FileResponse(
            path=str(file_path),
            media_type=f"image/{file_path.suffix.lstrip('.')}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error serving image: {e}")
        raise HTTPException(status_code=500, detail=str(e))
