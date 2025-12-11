"""
MLRIT Smart Campus & Placement Assistant
Main FastAPI Application
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import sys

from app.config import settings
from app.database import mongodb, pinecone_db

# Import all routers
from app.routers import (
    events_router, placements_router, companies_router,
    interviews_router, internships_router, roadmaps_router,
    guides_router, clubs_router, scholarships_router, students_router
)
from app.routers.chat import chat_router, pdf_router
from app.routers.documents import documents_router
from app.routers.admin import router as admin_router
from app.routers.images import router as images_router

# Configure logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


# Lifespan context manager for startup and shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan events for FastAPI
    Handles startup and shutdown
    """
    # Startup
    logger.info("🚀 Starting MLRIT Chatbot Application...")
    
    try:
        # Connect to MongoDB
        await mongodb.connect()
        logger.info("✅ MongoDB connected")
        
        # Connect to Pinecone
        pinecone_db.connect()
        logger.info("✅ Pinecone connected")
        
        logger.info("✅ Application startup complete")
    except Exception as e:
        logger.error(f"❌ Startup failed: {str(e)}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    await mongodb.disconnect()
    logger.info("Disconnected from MongoDB")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    🎓 **MLRIT Smart Campus & Placement Assistant**
    
    A comprehensive RAG-powered chatbot backend for:
    - Campus Events & Activities
    - Placement Statistics & Company Details
    - Interview Questions & Preparation
    - Internship Opportunities
    - Skill Development Roadmaps
    - Resume & Career Guidance
    - Student Clubs & Activities
    - Scholarships & Government Schemes
    - AI-Powered Student Career Reports
    
    **Tech Stack:**
    - FastAPI (Python)
    - MongoDB Atlas
    - Pinecone Vector Database
    - OpenAI/Gemini LLM
    - ReportLab PDF Generation
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    debug=settings.DEBUG
)


# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Handle all unhandled exceptions"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc) if settings.DEBUG else "An error occurred"
        }
    )


# Health check endpoint
@app.get("/", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "message": "MLRIT Chatbot API is running successfully! 🚀"
    }


@app.get("/health", tags=["Health"])
async def detailed_health():
    """Detailed health check with database connectivity"""
    try:
        # Check MongoDB
        db = mongodb.get_database()
        await db.command('ping')
        mongo_status = "connected"
    except Exception as e:
        mongo_status = f"error: {str(e)}"
    
    try:
        # Check Pinecone
        index = pinecone_db.get_index()
        pinecone_status = "connected"
    except Exception as e:
        pinecone_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "databases": {
            "mongodb": mongo_status,
            "pinecone": pinecone_status
        },
        "llm_provider": settings.LLM_PROVIDER
    }


# Register all routers
app.include_router(events_router, prefix=settings.API_V1_PREFIX)
app.include_router(placements_router, prefix=settings.API_V1_PREFIX)
app.include_router(companies_router, prefix=settings.API_V1_PREFIX)
app.include_router(interviews_router, prefix=settings.API_V1_PREFIX)
app.include_router(internships_router, prefix=settings.API_V1_PREFIX)
app.include_router(roadmaps_router, prefix=settings.API_V1_PREFIX)
app.include_router(guides_router, prefix=settings.API_V1_PREFIX)
app.include_router(clubs_router, prefix=settings.API_V1_PREFIX)
app.include_router(scholarships_router, prefix=settings.API_V1_PREFIX)
app.include_router(students_router, prefix=settings.API_V1_PREFIX)
app.include_router(chat_router, prefix=settings.API_V1_PREFIX)
app.include_router(pdf_router, prefix=settings.API_V1_PREFIX)
app.include_router(documents_router, prefix=settings.API_V1_PREFIX)
app.include_router(admin_router)  # Admin content management
app.include_router(images_router)  # Image serving


# Log all registered routes
logger.info("📋 Registered API Endpoints:")
for route in app.routes:
    if hasattr(route, "methods") and hasattr(route, "path"):
        for method in route.methods:
            logger.info(f"  {method:7s} {route.path}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
