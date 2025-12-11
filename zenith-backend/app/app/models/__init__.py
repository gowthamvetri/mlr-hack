"""
MongoDB models and helper functions
"""
from typing import Optional, Dict, Any, List
from datetime import datetime
from bson import ObjectId


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic"""
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)
    
    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")


def serialize_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Convert MongoDB document to JSON-serializable format"""
    if doc is None:
        return None
    
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            doc[key] = str(value)
        elif isinstance(value, datetime):
            doc[key] = value.isoformat()
        elif isinstance(value, list):
            doc[key] = [serialize_doc(item) if isinstance(item, dict) else item for item in value]
    
    return doc


def prepare_create_doc(data: Dict[str, Any]) -> Dict[str, Any]:
    """Prepare document for creation in MongoDB"""
    doc = data.copy()
    doc["created_at"] = datetime.utcnow()
    doc["updated_at"] = datetime.utcnow()
    return doc


def prepare_update_doc(data: Dict[str, Any]) -> Dict[str, Any]:
    """Prepare document for update in MongoDB"""
    doc = {k: v for k, v in data.items() if v is not None}
    doc["updated_at"] = datetime.utcnow()
    return {"$set": doc}
