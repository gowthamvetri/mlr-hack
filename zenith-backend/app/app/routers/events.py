"""
Events Router
Handles all event-related API endpoints
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List
from app.schemas import (
    EventCreate, EventUpdate, EventResponse, PaginatedResponse
)
from app.services import event_service

router = APIRouter(prefix="/events", tags=["Events"])


@router.post("/", response_model=EventResponse, status_code=201)
async def create_event(event: EventCreate):
    """Create a new event"""
    try:
        result = await event_service.create(event.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=PaginatedResponse)
async def get_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100)
):
    """Get all events with pagination"""
    try:
        events = await event_service.get_all(skip=skip, limit=limit)
        total = await event_service.count()
        return {
            "total": total,
            "skip": skip,
            "limit": limit,
            "data": events
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/upcoming", response_model=List[EventResponse])
async def get_upcoming_events(limit: int = Query(10, ge=1, le=50)):
    """Get upcoming events"""
    try:
        events = await event_service.get_upcoming_events(limit=limit)
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/type/{event_type}", response_model=List[EventResponse])
async def get_events_by_type(event_type: str):
    """Get events by type"""
    try:
        events = await event_service.get_events_by_type(event_type)
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(event_id: str):
    """Get event by ID"""
    try:
        event = await event_service.get_by_id(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        return event
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(event_id: str, event: EventUpdate):
    """Update event"""
    try:
        result = await event_service.update(event_id, event.model_dump(exclude_unset=True))
        if not result:
            raise HTTPException(status_code=404, detail="Event not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{event_id}")
async def delete_event(event_id: str):
    """Delete event"""
    try:
        success = await event_service.delete(event_id)
        if not success:
            raise HTTPException(status_code=404, detail="Event not found")
        return {"message": "Event deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
