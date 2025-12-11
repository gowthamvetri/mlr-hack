"""
Image Storage Service
Handle image uploads, storage, and retrieval for MLRIT chatbot
"""
from typing import List, Dict, Optional
from pathlib import Path
from fastapi import UploadFile
import logging
from datetime import datetime
import hashlib
from PIL import Image
import io
from app.models.image import ImageMetadata
from app.database import mongodb

logger = logging.getLogger(__name__)


class ImageStorageService:
    """Service for managing image storage - supports dynamic categories"""
    
    def __init__(self, base_dir: str = "uploads/images"):
        """
        Initialize image storage service
        
        Args:
            base_dir: Base directory for image storage
        """
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"📁 Image storage initialized: {self.base_dir}")
    
    def _ensure_category_dir(self, category: str) -> Path:
        """
        Ensure category directory exists, create if needed
        
        Args:
            category: Category name
            
        Returns:
            Path to category directory
        """
        category_dir = self.base_dir / category
        category_dir.mkdir(parents=True, exist_ok=True)
        return category_dir
    
    async def save_image(
        self,
        file: UploadFile,
        category: str,
        label: str,
        description: Optional[str] = None,
        source: str = "manual_upload"
    ) -> ImageMetadata:
        """
        Save uploaded image and store metadata
        
        Args:
            file: Uploaded image file
            category: Image category
            label: Image label (e.g., "chairman", "principal")
            description: Optional image description
            source: Source of image (PDF name or "manual_upload")
            
        Returns:
            ImageMetadata object
        """
        try:
            # Sanitize category name (no validation - allow any category)
            category = category.strip().lower().replace(' ', '_')
            
            # Read image bytes
            image_bytes = await file.read()
            
            # Validate it's an actual image
            try:
                image = Image.open(io.BytesIO(image_bytes))
                width, height = image.size
                img_format = image.format.lower() if image.format else "unknown"
            except Exception as e:
                raise ValueError(f"Invalid image file: {e}")
            
            # Generate unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            hash_suffix = hashlib.md5(image_bytes).hexdigest()[:8]
            file_ext = Path(file.filename).suffix or f".{img_format}"
            filename = f"{label}_{timestamp}_{hash_suffix}{file_ext}"
            
            # Ensure category directory exists and save
            category_dir = self._ensure_category_dir(category)
            file_path = category_dir / filename
            
            with open(file_path, "wb") as f:
                f.write(image_bytes)
            
            # Create metadata
            metadata = ImageMetadata(
                filename=filename,
                category=category,
                label=label,
                relative_path=f"{category}/{filename}",
                width=width,
                height=height,
                format=img_format,
                source=source,
                description=description
            )
            
            # Store metadata in MongoDB
            if mongodb.client:
                await mongodb.db.images.insert_one(metadata.dict())
                logger.info(f"✅ Saved image metadata to MongoDB: {label}")
            
            logger.info(f"✅ Saved image: {filename} ({width}x{height}px) | Category: {category} | Label: {label}")
            
            return metadata
            
        except Exception as e:
            logger.error(f"❌ Error saving image: {e}")
            raise
    
    async def get_images_by_category(self, category: str) -> List[ImageMetadata]:
        """
        Get all images for a specific category
        
        Args:
            category: Category name
            
        Returns:
            List of ImageMetadata objects
        """
        try:
            if not mongodb.client:
                logger.warning("MongoDB not available")
                return []
            
            cursor = mongodb.db.images.find({"category": category})
            images = []
            
            async for doc in cursor:
                doc.pop("_id", None)  # Remove MongoDB _id
                images.append(ImageMetadata(**doc))
            
            return images
            
        except Exception as e:
            logger.error(f"❌ Error retrieving images: {e}")
            return []
    
    async def get_image_by_label(self, label: str, category: Optional[str] = None) -> Optional[ImageMetadata]:
        """
        Get image by label (optionally within a category)
        
        Args:
            label: Image label (e.g., "chairman")
            category: Optional category to narrow search
            
        Returns:
            ImageMetadata object or None
        """
        try:
            if not mongodb.client:
                logger.warning("MongoDB not available")
                return None
            
            query = {"label": label}
            if category:
                query["category"] = category
            
            # Get most recent image with this label
            doc = await mongodb.db.images.find_one(
                query,
                sort=[("uploaded_at", -1)]
            )
            
            if doc:
                doc.pop("_id", None)
                return ImageMetadata(**doc)
            
            return None
            
        except Exception as e:
            logger.error(f"❌ Error retrieving image by label: {e}")
            return None
    
    async def search_images(self, query: str) -> List[ImageMetadata]:
        """
        Search images by label, description, or category
        
        Args:
            query: Search query
            
        Returns:
            List of matching ImageMetadata objects
        """
        try:
            if not mongodb.client:
                logger.warning("MongoDB not available")
                return []
            
            # Search in label, description, and category fields
            search_query = {
                "$or": [
                    {"label": {"$regex": query, "$options": "i"}},
                    {"description": {"$regex": query, "$options": "i"}},
                    {"category": {"$regex": query, "$options": "i"}}
                ]
            }
            
            cursor = mongodb.db.images.find(search_query)
            images = []
            
            async for doc in cursor:
                doc.pop("_id", None)
                images.append(ImageMetadata(**doc))
            
            return images
            
        except Exception as e:
            logger.error(f"❌ Error searching images: {e}")
            return []
    
    def get_image_url(self, relative_path: str, base_url: str = "http://localhost:8000") -> str:
        """
        Get full URL for an image
        
        Args:
            relative_path: Relative path (e.g., "management/chairman_20231210_abc123.jpg")
            base_url: Base URL of the API
            
        Returns:
            Full image URL
        """
        return f"{base_url}/api/v1/images/{relative_path}"


# Global instance
image_storage = ImageStorageService()
