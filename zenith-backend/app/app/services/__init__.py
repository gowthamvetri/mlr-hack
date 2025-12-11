"""
Service classes for all 10 modules
Each service handles business logic and database operations
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.services.base import BaseCRUDService
from app.database import Collections


# ==================== 1. EVENTS SERVICE ====================

class EventService(BaseCRUDService):
    """Service for event management"""
    
    def __init__(self):
        super().__init__(Collections.EVENTS)
    
    async def get_upcoming_events(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get upcoming events"""
        query = {
            "date": {"$gte": datetime.utcnow()},
            "is_active": True
        }
        cursor = self.collection.find(query).sort("date", 1).limit(limit)
        docs = await cursor.to_list(length=limit)
        from app.models import serialize_doc
        return [serialize_doc(doc) for doc in docs]
    
    async def get_events_by_type(self, event_type: str) -> List[Dict[str, Any]]:
        """Get events by type"""
        return await self.search({"event_type": event_type})


# ==================== 2. PLACEMENTS SERVICE ====================

class PlacementService(BaseCRUDService):
    """Service for placement statistics"""
    
    def __init__(self):
        super().__init__(Collections.PLACEMENTS)
    
    async def get_by_year_and_dept(self, year: str, department: str) -> Optional[Dict[str, Any]]:
        """Get placement stats by year and department"""
        docs = await self.search({"academic_year": year, "department": department})
        return docs[0] if docs else None
    
    async def get_year_wise_stats(self, year: str) -> List[Dict[str, Any]]:
        """Get all department stats for a year"""
        return await self.search({"academic_year": year})
    
    async def calculate_placement_percentage(self, doc: Dict[str, Any]) -> float:
        """Calculate placement percentage"""
        total = doc.get("total_students", 0)
        placed = doc.get("students_placed", 0)
        return (placed / total * 100) if total > 0 else 0.0


# ==================== 3. COMPANY PACKAGES SERVICE ====================

class CompanyPackageService(BaseCRUDService):
    """Service for company package details"""
    
    def __init__(self):
        super().__init__(Collections.COMPANY_PACKAGES)
    
    async def get_by_company(self, company_name: str) -> List[Dict[str, Any]]:
        """Get packages by company name"""
        return await self.search({"company_name": {"$regex": company_name, "$options": "i"}})
    
    async def get_top_packages(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top packages"""
        cursor = self.collection.find({}).sort("package_offered", -1).limit(limit)
        docs = await cursor.to_list(length=limit)
        from app.models import serialize_doc
        return [serialize_doc(doc) for doc in docs]
    
    async def get_by_year(self, year: str) -> List[Dict[str, Any]]:
        """Get packages by academic year"""
        return await self.search({"academic_year": year})


# ==================== 4. INTERVIEW QUESTIONS SERVICE ====================

class InterviewQuestionService(BaseCRUDService):
    """Service for interview questions"""
    
    def __init__(self):
        super().__init__(Collections.INTERVIEW_QUESTIONS)
    
    async def get_by_company(self, company_name: str) -> List[Dict[str, Any]]:
        """Get questions by company"""
        return await self.search({"company_name": {"$regex": company_name, "$options": "i"}})
    
    async def get_by_category(self, category: str) -> List[Dict[str, Any]]:
        """Get questions by category"""
        return await self.search({"question_category": category})
    
    async def get_by_difficulty(self, difficulty: str) -> List[Dict[str, Any]]:
        """Get questions by difficulty"""
        return await self.search({"difficulty_level": difficulty})


# ==================== 5. INTERNSHIPS SERVICE ====================

class InternshipService(BaseCRUDService):
    """Service for internship opportunities"""
    
    def __init__(self):
        super().__init__(Collections.INTERNSHIPS)
    
    async def get_active_internships(self) -> List[Dict[str, Any]]:
        """Get active internships"""
        query = {
            "is_active": True,
            "application_deadline": {"$gte": datetime.utcnow()}
        }
        cursor = self.collection.find(query).sort("application_deadline", 1)
        docs = await cursor.to_list(length=None)
        from app.models import serialize_doc
        return [serialize_doc(doc) for doc in docs]
    
    async def get_by_company(self, company_name: str) -> List[Dict[str, Any]]:
        """Get internships by company"""
        return await self.search({"company_name": {"$regex": company_name, "$options": "i"}})


# ==================== 6. SKILL ROADMAPS SERVICE ====================

class SkillRoadmapService(BaseCRUDService):
    """Service for skill roadmaps"""
    
    def __init__(self):
        super().__init__(Collections.SKILL_ROADMAPS)
    
    async def get_by_department(self, department: str) -> List[Dict[str, Any]]:
        """Get roadmaps by department"""
        return await self.search({"department": department})
    
    async def get_by_role(self, role: str) -> List[Dict[str, Any]]:
        """Get roadmap by role title"""
        return await self.search({"role_title": {"$regex": role, "$options": "i"}})


# ==================== 7. RESUME GUIDES SERVICE ====================

class ResumeGuideService(BaseCRUDService):
    """Service for resume and placement guides"""
    
    def __init__(self):
        super().__init__(Collections.RESUME_GUIDES)
    
    async def get_by_category(self, category: str) -> List[Dict[str, Any]]:
        """Get guides by category"""
        return await self.search({"category": category})


# ==================== 8. CLUBS SERVICE ====================

class ClubService(BaseCRUDService):
    """Service for clubs and activities"""
    
    def __init__(self):
        super().__init__(Collections.CLUBS)
    
    async def get_by_category(self, category: str) -> List[Dict[str, Any]]:
        """Get clubs by category"""
        return await self.search({"category": category})
    
    async def get_open_memberships(self) -> List[Dict[str, Any]]:
        """Get clubs with open membership"""
        return await self.search({"membership_open": True})


# ==================== 9. SCHOLARSHIPS SERVICE ====================

class ScholarshipService(BaseCRUDService):
    """Service for scholarships"""
    
    def __init__(self):
        super().__init__(Collections.SCHOLARSHIPS)
    
    async def get_active_scholarships(self) -> List[Dict[str, Any]]:
        """Get active scholarships"""
        query = {
            "is_active": True,
            "application_deadline": {"$gte": datetime.utcnow()}
        }
        cursor = self.collection.find(query).sort("application_deadline", 1)
        docs = await cursor.to_list(length=None)
        from app.models import serialize_doc
        return [serialize_doc(doc) for doc in docs]
    
    async def get_by_category(self, category: str) -> List[Dict[str, Any]]:
        """Get scholarships by category"""
        return await self.search({"category": category})


# ==================== 10. STUDENTS SERVICE ====================

class StudentService(BaseCRUDService):
    """Service for student management"""
    
    def __init__(self):
        super().__init__(Collections.STUDENTS)
    
    async def get_by_roll_number(self, roll_number: str) -> Optional[Dict[str, Any]]:
        """Get student by roll number"""
        docs = await self.search({"roll_number": roll_number})
        return docs[0] if docs else None
    
    async def get_by_department(self, department: str) -> List[Dict[str, Any]]:
        """Get students by department"""
        return await self.search({"department": department})
    
    async def get_by_placement_status(self, status: str) -> List[Dict[str, Any]]:
        """Get students by placement status"""
        return await self.search({"placement_status": status})


# ==================== STUDENT REPORTS SERVICE ====================

class StudentReportService(BaseCRUDService):
    """Service for student career reports"""
    
    def __init__(self):
        super().__init__(Collections.STUDENT_REPORTS)
    
    async def get_by_student_id(self, student_id: str) -> Optional[Dict[str, Any]]:
        """Get report by student ID"""
        docs = await self.search({"student_id": student_id})
        return docs[0] if docs else None


# ==================== SERVICE INSTANCES ====================

event_service = EventService()
placement_service = PlacementService()
company_package_service = CompanyPackageService()
interview_question_service = InterviewQuestionService()
internship_service = InternshipService()
skill_roadmap_service = SkillRoadmapService()
resume_guide_service = ResumeGuideService()
club_service = ClubService()
scholarship_service = ScholarshipService()
student_service = StudentService()
student_report_service = StudentReportService()
