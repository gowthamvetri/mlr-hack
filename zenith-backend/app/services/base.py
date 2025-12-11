"""
Base CRUD service class
Provides common database operations for all modules
"""
from typing import Optional, List, Dict, Any, Type
from motor.motor_asyncio import AsyncIOMotorCollection
from bson import ObjectId
from app.database import mongodb
from app.models import serialize_doc, prepare_create_doc, prepare_update_doc


class BaseCRUDService:
    """Base class for CRUD operations"""
    
    def __init__(self, collection_name: str):
        self.collection_name = collection_name
    
    @property
    def collection(self) -> AsyncIOMotorCollection:
        """Get collection instance"""
        db = mongodb.get_database()
        return db[self.collection_name]
    
    async def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new document"""
        doc = prepare_create_doc(data)
        result = await self.collection.insert_one(doc)
        doc["_id"] = str(result.inserted_id)
        return serialize_doc(doc)
    
    async def get_by_id(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get document by ID"""
        doc = await self.collection.find_one({"_id": ObjectId(doc_id)})
        return serialize_doc(doc) if doc else None
    
    async def get_all(
        self, 
        skip: int = 0, 
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Get all documents with pagination"""
        query = filters or {}
        cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
        docs = await cursor.to_list(length=limit)
        return [serialize_doc(doc) for doc in docs]
    
    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """Count documents"""
        query = filters or {}
        return await self.collection.count_documents(query)
    
    async def update(self, doc_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update document by ID"""
        update_doc = prepare_update_doc(data)
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(doc_id)},
            update_doc,
            return_document=True
        )
        return serialize_doc(result) if result else None
    
    async def delete(self, doc_id: str) -> bool:
        """Delete document by ID"""
        result = await self.collection.delete_one({"_id": ObjectId(doc_id)})
        return result.deleted_count > 0
    
    async def search(
        self, 
        query: Dict[str, Any], 
        skip: int = 0, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Search documents with custom query"""
        cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
        docs = await cursor.to_list(length=limit)
        return [serialize_doc(doc) for doc in docs]
