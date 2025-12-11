"""
Image Management Models
Store metadata for images uploaded to MLRIT chatbot
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ImageMetadata(BaseModel):
    """Metadata for stored images"""
    filename: str = Field(..., description="Image filename")
    category: str = Field(..., description="Content category (management, events, sports, etc.)")
    label: str = Field(..., description="Image label (chairman, principal, event_name, etc.)")
    relative_path: str = Field(..., description="Relative path to image file")
    width: int = Field(..., description="Image width in pixels")
    height: int = Field(..., description="Image height in pixels")
    format: str = Field(..., description="Image format (png, jpg, etc.)")
    source: Optional[str] = Field(None, description="Source (PDF filename or 'manual_upload')")
    page_num: Optional[int] = Field(None, description="PDF page number if extracted from PDF")
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    description: Optional[str] = Field(None, description="Optional image description")


class ContentUploadRequest(BaseModel):
    """Request model for admin content upload"""
    category: str = Field(..., description="Content category")
    text_content: Optional[str] = Field(None, description="Text content to index")
    image_labels: List[str] = Field(default_factory=list, description="Labels for uploaded images")
    descriptions: List[str] = Field(default_factory=list, description="Image descriptions")


class ContentUploadResponse(BaseModel):
    """Response model for content upload"""
    success: bool
    message: str
    indexed_text: bool = False
    text_chunks: int = 0
    images_saved: int = 0
    image_urls: List[str] = Field(default_factory=list)
