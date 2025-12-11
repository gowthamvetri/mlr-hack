"""
All API Routers
Complete CRUD endpoints for all 10 modules
"""
from fastapi import APIRouter, HTTPException, Query, File, UploadFile
from typing import List, Optional
from app.schemas import *
from app.services import *

# Create routers for each module
events_router = APIRouter(prefix="/events", tags=["Events"])
placements_router = APIRouter(prefix="/placements", tags=["Placements"])
companies_router = APIRouter(prefix="/companies", tags=["Company Packages"])
interviews_router = APIRouter(prefix="/interviews", tags=["Interview Questions"])
internships_router = APIRouter(prefix="/internships", tags=["Internships"])
roadmaps_router = APIRouter(prefix="/roadmaps", tags=["Skill Roadmaps"])
guides_router = APIRouter(prefix="/guides", tags=["Resume Guides"])
clubs_router = APIRouter(prefix="/clubs", tags=["Clubs"])
scholarships_router = APIRouter(prefix="/scholarships", tags=["Scholarships"])
students_router = APIRouter(prefix="/students", tags=["Students"])
reports_router = APIRouter(prefix="/reports", tags=["Student Reports"])


# ==================== EVENTS ENDPOINTS ====================

@events_router.post("/", response_model=EventResponse, status_code=201)
async def create_event(event: EventCreate):
    """Create new event"""
    result = await event_service.create(event.model_dump())
    return result

@events_router.get("/", response_model=PaginatedResponse)
async def get_events(skip: int = 0, limit: int = 10):
    """Get all events"""
    events = await event_service.get_all(skip=skip, limit=limit)
    total = await event_service.count()
    return {"total": total, "skip": skip, "limit": limit, "data": events}

@events_router.get("/upcoming", response_model=List[EventResponse])
async def get_upcoming_events(limit: int = 10):
    """Get upcoming events"""
    return await event_service.get_upcoming_events(limit=limit)

@events_router.get("/{event_id}", response_model=EventResponse)
async def get_event(event_id: str):
    """Get event by ID"""
    event = await event_service.get_by_id(event_id)
    if not event:
        raise HTTPException(404, "Event not found")
    return event

@events_router.put("/{event_id}", response_model=EventResponse)
async def update_event(event_id: str, event: EventUpdate):
    """Update event"""
    result = await event_service.update(event_id, event.model_dump(exclude_unset=True))
    if not result:
        raise HTTPException(404, "Event not found")
    return result

@events_router.delete("/{event_id}")
async def delete_event(event_id: str):
    """Delete event"""
    success = await event_service.delete(event_id)
    if not success:
        raise HTTPException(404, "Event not found")
    return {"message": "Event deleted"}


# ==================== PLACEMENTS ENDPOINTS ====================

@placements_router.post("/", response_model=PlacementResponse, status_code=201)
async def create_placement(placement: PlacementCreate):
    """Create placement record"""
    result = await placement_service.create(placement.model_dump())
    return result

@placements_router.get("/", response_model=PaginatedResponse)
async def get_placements(skip: int = 0, limit: int = 10):
    """Get all placements"""
    placements = await placement_service.get_all(skip=skip, limit=limit)
    total = await placement_service.count()
    return {"total": total, "skip": skip, "limit": limit, "data": placements}

@placements_router.get("/year/{year}", response_model=List[PlacementResponse])
async def get_placements_by_year(year: str):
    """Get placements by year"""
    return await placement_service.get_year_wise_stats(year)

@placements_router.get("/{placement_id}", response_model=PlacementResponse)
async def get_placement(placement_id: str):
    """Get placement by ID"""
    placement = await placement_service.get_by_id(placement_id)
    if not placement:
        raise HTTPException(404, "Placement record not found")
    return placement

@placements_router.put("/{placement_id}", response_model=PlacementResponse)
async def update_placement(placement_id: str, placement: PlacementUpdate):
    """Update placement"""
    result = await placement_service.update(placement_id, placement.model_dump(exclude_unset=True))
    if not result:
        raise HTTPException(404, "Placement not found")
    return result

@placements_router.delete("/{placement_id}")
async def delete_placement(placement_id: str):
    """Delete placement"""
    success = await placement_service.delete(placement_id)
    if not success:
        raise HTTPException(404, "Placement not found")
    return {"message": "Placement deleted"}


# ==================== COMPANY PACKAGES ENDPOINTS ====================

@companies_router.post("/", response_model=CompanyPackageResponse, status_code=201)
async def create_company_package(package: CompanyPackageCreate):
    """Create company package"""
    result = await company_package_service.create(package.model_dump())
    return result

@companies_router.get("/", response_model=PaginatedResponse)
async def get_company_packages(skip: int = 0, limit: int = 10):
    """Get all company packages"""
    packages = await company_package_service.get_all(skip=skip, limit=limit)
    total = await company_package_service.count()
    return {"total": total, "skip": skip, "limit": limit, "data": packages}

@companies_router.get("/top", response_model=List[CompanyPackageResponse])
async def get_top_packages(limit: int = 10):
    """Get top packages"""
    return await company_package_service.get_top_packages(limit=limit)

@companies_router.get("/company/{company_name}", response_model=List[CompanyPackageResponse])
async def get_company_packages_by_name(company_name: str):
    """Get packages by company name"""
    return await company_package_service.get_by_company(company_name)

@companies_router.get("/{package_id}", response_model=CompanyPackageResponse)
async def get_company_package(package_id: str):
    """Get package by ID"""
    package = await company_package_service.get_by_id(package_id)
    if not package:
        raise HTTPException(404, "Package not found")
    return package

@companies_router.put("/{package_id}", response_model=CompanyPackageResponse)
async def update_company_package(package_id: str, package: CompanyPackageUpdate):
    """Update company package"""
    result = await company_package_service.update(package_id, package.model_dump(exclude_unset=True))
    if not result:
        raise HTTPException(404, "Package not found")
    return result

@companies_router.delete("/{package_id}")
async def delete_company_package(package_id: str):
    """Delete company package"""
    success = await company_package_service.delete(package_id)
    if not success:
        raise HTTPException(404, "Package not found")
    return {"message": "Package deleted"}


# ==================== INTERVIEW QUESTIONS ENDPOINTS ====================

@interviews_router.post("/", response_model=InterviewQuestionResponse, status_code=201)
async def create_interview_question(question: InterviewQuestionCreate):
    """Create interview question"""
    result = await interview_question_service.create(question.model_dump())
    return result

@interviews_router.get("/", response_model=PaginatedResponse)
async def get_interview_questions(skip: int = 0, limit: int = 10):
    """Get all interview questions"""
    questions = await interview_question_service.get_all(skip=skip, limit=limit)
    total = await interview_question_service.count()
    return {"total": total, "skip": skip, "limit": limit, "data": questions}

@interviews_router.get("/company/{company_name}", response_model=List[InterviewQuestionResponse])
async def get_questions_by_company(company_name: str):
    """Get questions by company"""
    return await interview_question_service.get_by_company(company_name)

@interviews_router.get("/category/{category}", response_model=List[InterviewQuestionResponse])
async def get_questions_by_category(category: str):
    """Get questions by category"""
    return await interview_question_service.get_by_category(category)

@interviews_router.get("/{question_id}", response_model=InterviewQuestionResponse)
async def get_interview_question(question_id: str):
    """Get question by ID"""
    question = await interview_question_service.get_by_id(question_id)
    if not question:
        raise HTTPException(404, "Question not found")
    return question

@interviews_router.put("/{question_id}", response_model=InterviewQuestionResponse)
async def update_interview_question(question_id: str, question: InterviewQuestionUpdate):
    """Update interview question"""
    result = await interview_question_service.update(question_id, question.model_dump(exclude_unset=True))
    if not result:
        raise HTTPException(404, "Question not found")
    return result

@interviews_router.delete("/{question_id}")
async def delete_interview_question(question_id: str):
    """Delete interview question"""
    success = await interview_question_service.delete(question_id)
    if not success:
        raise HTTPException(404, "Question not found")
    return {"message": "Question deleted"}


# ==================== INTERNSHIPS ENDPOINTS ====================

@internships_router.post("/", response_model=InternshipResponse, status_code=201)
async def create_internship(internship: InternshipCreate):
    """Create internship"""
    result = await internship_service.create(internship.model_dump())
    return result

@internships_router.get("/", response_model=PaginatedResponse)
async def get_internships(skip: int = 0, limit: int = 10):
    """Get all internships"""
    internships = await internship_service.get_all(skip=skip, limit=limit)
    total = await internship_service.count()
    return {"total": total, "skip": skip, "limit": limit, "data": internships}

@internships_router.get("/active", response_model=List[InternshipResponse])
async def get_active_internships():
    """Get active internships"""
    return await internship_service.get_active_internships()

@internships_router.get("/{internship_id}", response_model=InternshipResponse)
async def get_internship(internship_id: str):
    """Get internship by ID"""
    internship = await internship_service.get_by_id(internship_id)
    if not internship:
        raise HTTPException(404, "Internship not found")
    return internship

@internships_router.put("/{internship_id}", response_model=InternshipResponse)
async def update_internship(internship_id: str, internship: InternshipUpdate):
    """Update internship"""
    result = await internship_service.update(internship_id, internship.model_dump(exclude_unset=True))
    if not result:
        raise HTTPException(404, "Internship not found")
    return result

@internships_router.delete("/{internship_id}")
async def delete_internship(internship_id: str):
    """Delete internship"""
    success = await internship_service.delete(internship_id)
    if not success:
        raise HTTPException(404, "Internship not found")
    return {"message": "Internship deleted"}


# ==================== SKILL ROADMAPS ENDPOINTS ====================

@roadmaps_router.post("/", response_model=SkillRoadmapResponse, status_code=201)
async def create_roadmap(roadmap: SkillRoadmapCreate):
    """Create skill roadmap"""
    result = await skill_roadmap_service.create(roadmap.model_dump())
    return result

@roadmaps_router.get("/", response_model=PaginatedResponse)
async def get_roadmaps(skip: int = 0, limit: int = 10):
    """Get all roadmaps"""
    roadmaps = await skill_roadmap_service.get_all(skip=skip, limit=limit)
    total = await skill_roadmap_service.count()
    return {"total": total, "skip": skip, "limit": limit, "data": roadmaps}

@roadmaps_router.get("/department/{department}", response_model=List[SkillRoadmapResponse])
async def get_roadmaps_by_department(department: str):
    """Get roadmaps by department"""
    return await skill_roadmap_service.get_by_department(department)

@roadmaps_router.get("/{roadmap_id}", response_model=SkillRoadmapResponse)
async def get_roadmap(roadmap_id: str):
    """Get roadmap by ID"""
    roadmap = await skill_roadmap_service.get_by_id(roadmap_id)
    if not roadmap:
        raise HTTPException(404, "Roadmap not found")
    return roadmap

@roadmaps_router.put("/{roadmap_id}", response_model=SkillRoadmapResponse)
async def update_roadmap(roadmap_id: str, roadmap: SkillRoadmapUpdate):
    """Update roadmap"""
    result = await skill_roadmap_service.update(roadmap_id, roadmap.model_dump(exclude_unset=True))
    if not result:
        raise HTTPException(404, "Roadmap not found")
    return result

@roadmaps_router.delete("/{roadmap_id}")
async def delete_roadmap(roadmap_id: str):
    """Delete roadmap"""
    success = await skill_roadmap_service.delete(roadmap_id)
    if not success:
        raise HTTPException(404, "Roadmap not found")
    return {"message": "Roadmap deleted"}


# ==================== RESUME GUIDES ENDPOINTS ====================

@guides_router.post("/", response_model=ResumeGuideResponse, status_code=201)
async def create_guide(guide: ResumeGuideCreate):
    """Create resume guide"""
    result = await resume_guide_service.create(guide.model_dump())
    return result

@guides_router.get("/", response_model=PaginatedResponse)
async def get_guides(skip: int = 0, limit: int = 10):
    """Get all guides"""
    guides = await resume_guide_service.get_all(skip=skip, limit=limit)
    total = await resume_guide_service.count()
    return {"total": total, "skip": skip, "limit": limit, "data": guides}

@guides_router.get("/{guide_id}", response_model=ResumeGuideResponse)
async def get_guide(guide_id: str):
    """Get guide by ID"""
    guide = await resume_guide_service.get_by_id(guide_id)
    if not guide:
        raise HTTPException(404, "Guide not found")
    return guide

@guides_router.put("/{guide_id}", response_model=ResumeGuideResponse)
async def update_guide(guide_id: str, guide: ResumeGuideUpdate):
    """Update guide"""
    result = await resume_guide_service.update(guide_id, guide.model_dump(exclude_unset=True))
    if not result:
        raise HTTPException(404, "Guide not found")
    return result

@guides_router.delete("/{guide_id}")
async def delete_guide(guide_id: str):
    """Delete guide"""
    success = await resume_guide_service.delete(guide_id)
    if not success:
        raise HTTPException(404, "Guide not found")
    return {"message": "Guide deleted"}


# ==================== CLUBS ENDPOINTS ====================

@clubs_router.post("/", response_model=ClubResponse, status_code=201)
async def create_club(club: ClubCreate):
    """Create club"""
    result = await club_service.create(club.model_dump())
    return result

@clubs_router.get("/", response_model=PaginatedResponse)
async def get_clubs(skip: int = 0, limit: int = 10):
    """Get all clubs"""
    clubs = await club_service.get_all(skip=skip, limit=limit)
    total = await club_service.count()
    return {"total": total, "skip": skip, "limit": limit, "data": clubs}

@clubs_router.get("/open-membership", response_model=List[ClubResponse])
async def get_open_membership_clubs():
    """Get clubs with open membership"""
    return await club_service.get_open_memberships()

@clubs_router.get("/{club_id}", response_model=ClubResponse)
async def get_club(club_id: str):
    """Get club by ID"""
    club = await club_service.get_by_id(club_id)
    if not club:
        raise HTTPException(404, "Club not found")
    return club

@clubs_router.put("/{club_id}", response_model=ClubResponse)
async def update_club(club_id: str, club: ClubUpdate):
    """Update club"""
    result = await club_service.update(club_id, club.model_dump(exclude_unset=True))
    if not result:
        raise HTTPException(404, "Club not found")
    return result

@clubs_router.delete("/{club_id}")
async def delete_club(club_id: str):
    """Delete club"""
    success = await club_service.delete(club_id)
    if not success:
        raise HTTPException(404, "Club not found")
    return {"message": "Club deleted"}


# ==================== SCHOLARSHIPS ENDPOINTS ====================

@scholarships_router.post("/", response_model=ScholarshipResponse, status_code=201)
async def create_scholarship(scholarship: ScholarshipCreate):
    """Create scholarship"""
    result = await scholarship_service.create(scholarship.model_dump())
    return result

@scholarships_router.get("/", response_model=PaginatedResponse)
async def get_scholarships(skip: int = 0, limit: int = 10):
    """Get all scholarships"""
    scholarships = await scholarship_service.get_all(skip=skip, limit=limit)
    total = await scholarship_service.count()
    return {"total": total, "skip": skip, "limit": limit, "data": scholarships}

@scholarships_router.get("/active", response_model=List[ScholarshipResponse])
async def get_active_scholarships():
    """Get active scholarships"""
    return await scholarship_service.get_active_scholarships()

@scholarships_router.get("/{scholarship_id}", response_model=ScholarshipResponse)
async def get_scholarship(scholarship_id: str):
    """Get scholarship by ID"""
    scholarship = await scholarship_service.get_by_id(scholarship_id)
    if not scholarship:
        raise HTTPException(404, "Scholarship not found")
    return scholarship

@scholarships_router.put("/{scholarship_id}", response_model=ScholarshipResponse)
async def update_scholarship(scholarship_id: str, scholarship: ScholarshipUpdate):
    """Update scholarship"""
    result = await scholarship_service.update(scholarship_id, scholarship.model_dump(exclude_unset=True))
    if not result:
        raise HTTPException(404, "Scholarship not found")
    return result

@scholarships_router.delete("/{scholarship_id}")
async def delete_scholarship(scholarship_id: str):
    """Delete scholarship"""
    success = await scholarship_service.delete(scholarship_id)
    if not success:
        raise HTTPException(404, "Scholarship not found")
    return {"message": "Scholarship deleted"}


# ==================== STUDENTS ENDPOINTS ====================

@students_router.post("/", response_model=StudentResponse, status_code=201)
async def create_student(student: StudentCreate):
    """Create student"""
    result = await student_service.create(student.model_dump())
    return result

@students_router.get("/", response_model=PaginatedResponse)
async def get_students(skip: int = 0, limit: int = 10):
    """Get all students"""
    students = await student_service.get_all(skip=skip, limit=limit)
    total = await student_service.count()
    return {"total": total, "skip": skip, "limit": limit, "data": students}

@students_router.get("/roll/{roll_number}", response_model=StudentResponse)
async def get_student_by_roll(roll_number: str):
    """Get student by roll number"""
    student = await student_service.get_by_roll_number(roll_number)
    if not student:
        raise HTTPException(404, "Student not found")
    return student

@students_router.get("/{student_id}", response_model=StudentResponse)
async def get_student(student_id: str):
    """Get student by ID"""
    student = await student_service.get_by_id(student_id)
    if not student:
        raise HTTPException(404, "Student not found")
    return student

@students_router.put("/{student_id}", response_model=StudentResponse)
async def update_student(student_id: str, student: StudentUpdate):
    """Update student"""
    result = await student_service.update(student_id, student.model_dump(exclude_unset=True))
    if not result:
        raise HTTPException(404, "Student not found")
    return result

@students_router.delete("/{student_id}")
async def delete_student(student_id: str):
    """Delete student"""
    success = await student_service.delete(student_id)
    if not success:
        raise HTTPException(404, "Student not found")
    return {"message": "Student deleted"}
