"""
Database connection and initialization
Handles MongoDB Atlas and Pinecone connections
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pinecone import Pinecone, ServerlessSpec
from typing import Optional
import logging
from app.config import settings

logger = logging.getLogger(__name__)


class MongoDB:
    """MongoDB connection manager"""
    
    client: Optional[AsyncIOMotorClient] = None
    database: Optional[AsyncIOMotorDatabase] = None
    
    @classmethod
    async def connect(cls):
        """Connect to MongoDB Atlas"""
        try:
            # Workaround for Windows SSL issues with older OpenSSL
            # Note: tlsAllowInvalidCertificates is for development only
            cls.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=10000,
                socketTimeoutMS=10000,
                tlsAllowInvalidCertificates=True  # Development workaround
            )
            cls.database = cls.client[settings.MONGODB_DB_NAME]
            
            # Test connection
            await cls.client.admin.command('ping')
            logger.info("✅ Connected to MongoDB Atlas successfully")
            logger.warning("⚠️  Using tlsAllowInvalidCertificates (development only)")
            
        except Exception as e:
            logger.error(f"❌ Failed to connect to MongoDB: {str(e)}")
            logger.warning("⚠️  MongoDB unavailable - database features will not work")
            logger.warning("⚠️  Chat and LLM features will still work!")
            # Don't raise - allow app to start without MongoDB
            cls.client = None
            cls.database = None
    
    @classmethod
    async def disconnect(cls):
        """Disconnect from MongoDB"""
        if cls.client:
            cls.client.close()
            logger.info("Disconnected from MongoDB")
    
    @classmethod
    def get_database(cls) -> AsyncIOMotorDatabase:
        """Get database instance"""
        if cls.database is None:
            logger.warning("⚠️  MongoDB not available - returning None")
            return None
        return cls.database


class PineconeDB:
    """Pinecone vector database manager"""
    
    client: Optional[Pinecone] = None
    index = None
    
    @classmethod
    def connect(cls):
        """Connect to Pinecone"""
        try:
            cls.client = Pinecone(api_key=settings.PINECONE_API_KEY)
            
            # Check if index exists, create if not
            existing_indexes = [index.name for index in cls.client.list_indexes()]
            
            if settings.PINECONE_INDEX_NAME not in existing_indexes:
                logger.info(f"Creating Pinecone index: {settings.PINECONE_INDEX_NAME}")
                cls.client.create_index(
                    name=settings.PINECONE_INDEX_NAME,
                    dimension=settings.EMBEDDING_DIMENSION,
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud="aws",
                        region=settings.PINECONE_ENVIRONMENT
                    )
                )
            
            # Connect to index
            cls.index = cls.client.Index(
                name=settings.PINECONE_INDEX_NAME,
                host=settings.PINECONE_HOST
            )
            
            logger.info(f"✅ Connected to Pinecone index: {settings.PINECONE_INDEX_NAME}")
            
        except Exception as e:
            logger.error(f"❌ Failed to connect to Pinecone: {str(e)}")
            raise
    
    @classmethod
    def get_index(cls):
        """Get Pinecone index instance"""
        if cls.index is None:
            raise RuntimeError("Pinecone not initialized. Call connect() first.")
        return cls.index


# Database instances
mongodb = MongoDB()
pinecone_db = PineconeDB()


# Collection names
class Collections:
    """MongoDB collection names"""
    EVENTS = "events"
    PLACEMENTS = "placements"
    COMPANY_PACKAGES = "company_packages"
    INTERVIEW_QUESTIONS = "interview_questions"
    INTERNSHIPS = "internships"
    SKILL_ROADMAPS = "skill_roadmaps"
    RESUME_GUIDES = "resume_guides"
    CLUBS = "clubs"
    SCHOLARSHIPS = "scholarships"
    STUDENTS = "students"
    STUDENT_REPORTS = "student_reports"


# Pinecone namespaces
class Namespaces:
    """Pinecone vector namespaces"""
    EVENTS = "events"
    PLACEMENTS = "placements"
    INTERVIEWS = "interviews"
    INTERNSHIPS = "internships"
    SKILLS = "skills"
    RESUME_GUIDES = "resume_guides"
    CLUBS = "clubs"
    SCHOLARSHIPS = "scholarships"
