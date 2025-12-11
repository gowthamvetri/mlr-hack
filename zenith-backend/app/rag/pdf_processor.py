"""
PDF Processor - Extract text and images from PDFs
Supports MLRIT chatbot content ingestion
"""
from typing import List, Dict, Tuple
import PyPDF2
import fitz  # PyMuPDF for image extraction
from pathlib import Path
import logging
import io
from PIL import Image
import hashlib
from datetime import datetime

logger = logging.getLogger(__name__)


class PDFProcessor:
    """Process PDFs to extract text and images for MLRIT chatbot"""
    
    def __init__(self, image_output_dir: str = "uploads/images"):
        """
        Initialize PDF processor
        
        Args:
            image_output_dir: Directory to save extracted images
        """
        self.image_output_dir = Path(image_output_dir)
        self.image_output_dir.mkdir(parents=True, exist_ok=True)
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """
        Extract all text from PDF file
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            Extracted text as string
        """
        try:
            text_content = []
            
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                
                logger.info(f"📄 Extracting text from PDF: {pdf_path} ({len(pdf_reader.pages)} pages)")
                
                for page_num, page in enumerate(pdf_reader.pages, 1):
                    text = page.extract_text()
                    if text.strip():
                        text_content.append(text)
                        logger.debug(f"  Page {page_num}: {len(text)} characters")
            
            full_text = "\n\n".join(text_content)
            logger.info(f"✅ Extracted {len(full_text)} characters from PDF")
            
            return full_text
            
        except Exception as e:
            logger.error(f"❌ Error extracting text from PDF: {e}")
            raise
    
    def extract_images_from_pdf(
        self, 
        pdf_path: str, 
        category: str = "general",
        min_width: int = 100,
        min_height: int = 100
    ) -> List[Dict[str, str]]:
        """
        Extract images from PDF file
        
        Args:
            pdf_path: Path to PDF file
            category: Category folder to save images in
            min_width: Minimum image width to extract (filters small icons)
            min_height: Minimum image height to extract
            
        Returns:
            List of dicts with image metadata: {filename, path, page_num, size}
        """
        try:
            extracted_images = []
            
            # Open PDF with PyMuPDF
            pdf_document = fitz.open(pdf_path)
            
            logger.info(f"🖼️ Extracting images from PDF: {pdf_path} ({pdf_document.page_count} pages)")
            
            # Create category subdirectory
            category_dir = self.image_output_dir / category
            category_dir.mkdir(parents=True, exist_ok=True)
            
            for page_num in range(pdf_document.page_count):
                page = pdf_document[page_num]
                image_list = page.get_images(full=True)
                
                for img_index, img_info in enumerate(image_list):
                    try:
                        # Get image XREF (reference)
                        xref = img_info[0]
                        
                        # Extract image bytes
                        base_image = pdf_document.extract_image(xref)
                        image_bytes = base_image["image"]
                        image_ext = base_image["ext"]
                        
                        # Load image to check dimensions
                        image = Image.open(io.BytesIO(image_bytes))
                        width, height = image.size
                        
                        # Filter small images (likely icons/logos)
                        if width < min_width or height < min_height:
                            logger.debug(f"  Skipping small image: {width}x{height}px")
                            continue
                        
                        # Generate unique filename
                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                        hash_suffix = hashlib.md5(image_bytes).hexdigest()[:8]
                        filename = f"{category}_page{page_num+1}_img{img_index+1}_{timestamp}_{hash_suffix}.{image_ext}"
                        
                        # Save image
                        image_path = category_dir / filename
                        with open(image_path, "wb") as img_file:
                            img_file.write(image_bytes)
                        
                        extracted_images.append({
                            "filename": filename,
                            "path": str(image_path),
                            "relative_path": f"{category}/{filename}",
                            "page_num": page_num + 1,
                            "size": f"{width}x{height}",
                            "width": width,
                            "height": height,
                            "format": image_ext,
                            "category": category
                        })
                        
                        logger.info(f"  ✅ Saved image: {filename} ({width}x{height}px)")
                    
                    except Exception as e:
                        logger.warning(f"  ⚠️ Could not extract image {img_index+1} from page {page_num+1}: {e}")
                        continue
            
            pdf_document.close()
            
            logger.info(f"✅ Extracted {len(extracted_images)} images from PDF")
            return extracted_images
            
        except Exception as e:
            logger.error(f"❌ Error extracting images from PDF: {e}")
            raise
    
    def process_pdf(
        self, 
        pdf_path: str, 
        category: str = "general",
        extract_images: bool = True
    ) -> Dict:
        """
        Process PDF to extract both text and images
        
        Args:
            pdf_path: Path to PDF file
            category: Content category (management, events, sports, etc.)
            extract_images: Whether to extract images
            
        Returns:
            Dict with text and images: {text: str, images: List[Dict]}
        """
        logger.info(f"🚀 Processing PDF: {pdf_path} | Category: {category}")
        
        result = {
            "text": "",
            "images": [],
            "category": category,
            "source_file": Path(pdf_path).name,
            "processed_at": datetime.now().isoformat()
        }
        
        try:
            # Extract text
            result["text"] = self.extract_text_from_pdf(pdf_path)
            
            # Extract images if requested
            if extract_images:
                result["images"] = self.extract_images_from_pdf(
                    pdf_path, 
                    category=category
                )
            
            logger.info(f"✅ PDF processing complete: {len(result['text'])} chars, {len(result['images'])} images")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Error processing PDF: {e}")
            raise


# Global instance
pdf_processor = PDFProcessor()
