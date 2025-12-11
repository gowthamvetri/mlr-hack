"""
Pydantic schemas for all modules
Defines request/response models with validation
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# ==================== ENUMS ====================

class Department(str, Enum):
    CSE = "CSE"
    IT = "IT"
    ECE = "ECE"
    EEE = "EEE"
    MECH = "MECH"
    CIVIL = "CIVIL"


class EventType(str, Enum):
    PLACEMENT = "placement"
    TECHNICAL = "technical"
    CULTURAL = "cultural"
    SPORTS = "sports"
    WORKSHOP = "workshop"
    HACKATHON = "hackathon"


class PlacementStatus(str, Enum):
    PLACED = "placed"
    NOT_PLACED = "not_placed"
    HIGHER_STUDIES = "higher_studies"


# ==================== BASE SCHEMAS ====================

class BaseSchema(BaseModel):
    """Base schema with common fields"""
    id: Optional[str] = Field(None, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


# ==================== 1. EVENTS ====================

class EventBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    event_type: EventType
    date: datetime
    venue: str
    organizer: str
    registration_link: Optional[str] = None
    is_active: bool = True


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[EventType] = None
    date: Optional[datetime] = None
    venue: Optional[str] = None
    organizer: Optional[str] = None
    registration_link: Optional[str] = None
    is_active: Optional[bool] = None


class EventResponse(EventBase, BaseSchema):
    pass


# ==================== 2. PLACEMENTS ====================

class PlacementBase(BaseModel):
    academic_year: str = Field(..., pattern=r"^\d{4}-\d{4}$")  # e.g., "2023-2024"
    department: Department
    total_students: int = Field(..., gt=0)
    students_placed: int = Field(..., ge=0)
    students_higher_studies: int = Field(..., ge=0)
    average_package: float = Field(..., gt=0)
    highest_package: float = Field(..., gt=0)
    lowest_package: float = Field(..., gt=0)
    companies_visited: int = Field(..., ge=0)


class PlacementCreate(PlacementBase):
    pass


class PlacementUpdate(BaseModel):
    academic_year: Optional[str] = None
    department: Optional[Department] = None
    total_students: Optional[int] = None
    students_placed: Optional[int] = None
    students_higher_studies: Optional[int] = None
    average_package: Optional[float] = None
    highest_package: Optional[float] = None
    lowest_package: Optional[float] = None
    companies_visited: Optional[int] = None


class PlacementResponse(PlacementBase, BaseSchema):
    placement_percentage: float = 0.0


# ==================== 3. COMPANY PACKAGES ====================

class CompanyPackageBase(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=200)
    academic_year: str = Field(..., pattern=r"^\d{4}-\d{4}$")
    package_offered: float = Field(..., gt=0)
    role: str
    job_location: str
    departments_allowed: List[Department]
    selection_process: List[str]
    students_selected: int = Field(..., ge=0)
    cgpa_criteria: Optional[float] = Field(None, ge=0, le=10)


class CompanyPackageCreate(CompanyPackageBase):
    pass


class CompanyPackageUpdate(BaseModel):
    company_name: Optional[str] = None
    academic_year: Optional[str] = None
    package_offered: Optional[float] = None
    role: Optional[str] = None
    job_location: Optional[str] = None
    departments_allowed: Optional[List[Department]] = None
    selection_process: Optional[List[str]] = None
    students_selected: Optional[int] = None
    cgpa_criteria: Optional[float] = None


class CompanyPackageResponse(CompanyPackageBase, BaseSchema):
    pass


# ==================== 4. INTERVIEW QUESTIONS ====================

class InterviewQuestionBase(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=200)
    role: str
    question_category: str  # Technical, HR, Aptitude, etc.
    question: str = Field(..., min_length=1)
    answer: Optional[str] = None
    difficulty_level: str = Field(..., pattern=r"^(Easy|Medium|Hard)$")
    asked_year: int = Field(..., ge=2000, le=2100)


class InterviewQuestionCreate(InterviewQuestionBase):
    pass


class InterviewQuestionUpdate(BaseModel):
    company_name: Optional[str] = None
    role: Optional[str] = None
    question_category: Optional[str] = None
    question: Optional[str] = None
    answer: Optional[str] = None
    difficulty_level: Optional[str] = None
    asked_year: Optional[int] = None


class InterviewQuestionResponse(InterviewQuestionBase, BaseSchema):
    pass


# ==================== 5. INTERNSHIPS ====================

class InternshipBase(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=200)
    role: str
    duration: str  # e.g., "2 months", "6 months"
    stipend: Optional[float] = Field(None, ge=0)
    location: str
    application_deadline: datetime
    requirements: List[str]
    application_link: str
    is_active: bool = True


class InternshipCreate(InternshipBase):
    pass


class InternshipUpdate(BaseModel):
    company_name: Optional[str] = None
    role: Optional[str] = None
    duration: Optional[str] = None
    stipend: Optional[float] = None
    location: Optional[str] = None
    application_deadline: Optional[datetime] = None
    requirements: Optional[List[str]] = None
    application_link: Optional[str] = None
    is_active: Optional[bool] = None


class InternshipResponse(InternshipBase, BaseSchema):
    pass


# ==================== 6. SKILL ROADMAPS ====================

class SkillRoadmapBase(BaseModel):
    department: Department
    role_title: str  # e.g., "Full Stack Developer", "Data Scientist"
    description: str
    duration: str  # e.g., "6 months"
    phases: List[Dict[str, Any]]  # [{phase: "1", title: "Basics", skills: [], duration: "1 month"}]
    recommended_resources: List[Dict[str, str]]  # [{name: "Course Name", link: "url"}]
    projects: List[str]
    certifications: List[str]


class SkillRoadmapCreate(SkillRoadmapBase):
    pass


class SkillRoadmapUpdate(BaseModel):
    department: Optional[Department] = None
    role_title: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[str] = None
    phases: Optional[List[Dict[str, Any]]] = None
    recommended_resources: Optional[List[Dict[str, str]]] = None
    projects: Optional[List[str]] = None
    certifications: Optional[List[str]] = None


class SkillRoadmapResponse(SkillRoadmapBase, BaseSchema):
    pass


# ==================== 7. RESUME GUIDES ====================

class ResumeGuideBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    category: str  # Resume Writing, Cover Letter, LinkedIn, etc.
    content: str
    tips: List[str]
    dos: List[str]
    donts: List[str]
    sample_templates: Optional[List[str]] = None


class ResumeGuideCreate(ResumeGuideBase):
    pass


class ResumeGuideUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    content: Optional[str] = None
    tips: Optional[List[str]] = None
    dos: Optional[List[str]] = None
    donts: Optional[List[str]] = None
    sample_templates: Optional[List[str]] = None


class ResumeGuideResponse(ResumeGuideBase, BaseSchema):
    pass


# ==================== 8. CLUBS ====================

class ClubBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    category: str  # Technical, Cultural, Sports, etc.
    description: str
    faculty_coordinator: str
    student_coordinator: str
    contact_email: EmailStr
    activities: List[str]
    achievements: List[str]
    membership_open: bool = True


class ClubCreate(ClubBase):
    pass


class ClubUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    faculty_coordinator: Optional[str] = None
    student_coordinator: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    activities: Optional[List[str]] = None
    achievements: Optional[List[str]] = None
    membership_open: Optional[bool] = None


class ClubResponse(ClubBase, BaseSchema):
    pass


# ==================== 9. SCHOLARSHIPS ====================

class ScholarshipBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    provider: str
    amount: float = Field(..., gt=0)
    eligibility: List[str]
    application_deadline: datetime
    application_link: str
    category: str  # Merit-based, Need-based, Government, etc.
    description: str
    is_active: bool = True


class ScholarshipCreate(ScholarshipBase):
    pass


class ScholarshipUpdate(BaseModel):
    name: Optional[str] = None
    provider: Optional[str] = None
    amount: Optional[float] = None
    eligibility: Optional[List[str]] = None
    application_deadline: Optional[datetime] = None
    application_link: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ScholarshipResponse(ScholarshipBase, BaseSchema):
    pass


# ==================== 10. STUDENTS ====================

class StudentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    roll_number: str = Field(..., min_length=1, max_length=50)
    department: Department
    email: EmailStr
    phone: str = Field(..., pattern=r"^\+?[0-9]{10,15}$")
    cgpa: float = Field(..., ge=0, le=10)
    skills: List[str]
    certifications: List[str] = []
    internships_completed: List[str] = []
    projects: List[Dict[str, str]] = []  # [{title: "", description: "", link: ""}]
    placement_status: PlacementStatus = PlacementStatus.NOT_PLACED


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    roll_number: Optional[str] = None
    department: Optional[Department] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    cgpa: Optional[float] = None
    skills: Optional[List[str]] = None
    certifications: Optional[List[str]] = None
    internships_completed: Optional[List[str]] = None
    projects: Optional[List[Dict[str, str]]] = None
    placement_status: Optional[PlacementStatus] = None


class StudentResponse(StudentBase, BaseSchema):
    pass


# ==================== STUDENT REPORTS ====================

class StudentReportBase(BaseModel):
    student_id: str
    student_name: str
    department: Department
    cgpa: float
    skills: List[str]
    certifications: List[str]
    internships: List[str]
    strengths: List[str]
    weaknesses: List[str]
    recommended_roles: List[str]
    placement_probability: float = Field(..., ge=0, le=100)
    recommended_roadmap: str
    ai_insights: str


class StudentReportCreate(BaseModel):
    student_id: str


class StudentReportResponse(StudentReportBase, BaseSchema):
    pdf_path: Optional[str] = None


# ==================== CHAT & RAG ====================

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1)
    conversation_id: Optional[str] = None
    use_rag: bool = True
    conversation_history: List[ChatMessage] = []


class ChatResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]] = []
    images: List[Dict[str, str]] = []  # List of image URLs with labels
    category: Optional[str] = None  # Detected category
    conversation_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ==================== PAGINATION ====================

class PaginationParams(BaseModel):
    skip: int = Field(0, ge=0)
    limit: int = Field(10, ge=1, le=100)


class PaginatedResponse(BaseModel):
    total: int
    skip: int
    limit: int
    data: List[Any]
