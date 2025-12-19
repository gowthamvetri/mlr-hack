"""
Configuration module for MLRIT Chatbot
Handles all environment variables and app settings
"""
from pydantic_settings import BaseSettings
from typing import Optional, List
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # MongoDB Configuration
    MONGODB_URI: str
    MONGODB_DB_NAME: str = "mlrit_chatbot"
    
    # Pinecone Configuration
    PINECONE_API_KEY: str
    PINECONE_INDEX_NAME: str = "mlrit"
    PINECONE_HOST: str
    PINECONE_ENVIRONMENT: str = "us-east-1"
    
    # LLM Provider Configuration
    LLM_PROVIDER: str = "local_lmstudio"  # local_lmstudio, openai, gemini, or groq
    LM_STUDIO_BASE_URL: str = "http://127.0.0.1:1234/v1"
    LM_STUDIO_MODEL: str = "google/gemma-3-12b"
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    
    # Embedding Configuration
    EMBEDDING_MODEL: str = "text-embedding-nomic-embed-text"
    EMBEDDING_DIMENSION: int = 768
    EMBEDDING_BASE_URL: str = "http://127.0.0.1:1234/v1"
    
    # Application Configuration
    APP_NAME: str = "MLRIT Smart Campus & Placement Assistant"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    
    # CORS Configuration
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:8000"
    
    # API Configuration
    API_V1_PREFIX: str = "/api/v1"
    
    # RAG Configuration
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    TOP_K_RESULTS: int = 5
    
    # PDF Configuration
    PDF_OUTPUT_DIR: str = "generated_reports"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Allow extra env variables without causing validation errors
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Convert comma-separated origins to list"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    @property
    def llm_api_key(self) -> str:
        """Get the appropriate LLM API key based on provider"""
        if self.LLM_PROVIDER == "openai":
            return self.OPENAI_API_KEY or ""
        elif self.LLM_PROVIDER == "gemini":
            return self.GEMINI_API_KEY or ""
        return ""


@lru_cache()
def get_settings() -> Settings:
    """
    Create cached settings instance
    This ensures we only load env vars once
    """
    return Settings()


# Global settings instance
settings = get_settings()
