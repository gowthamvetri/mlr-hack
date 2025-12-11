"""
Chat and Report Generation Router
Handles RAG-based chat and PDF report generation
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from typing import Dict, Any
from app.schemas import ChatRequest, ChatResponse, StudentReportCreate
from app.rag.chat import rag_chat_service
from app.services import student_service, student_report_service
from app.pdf.generators import (
    events_pdf_generator,
    placements_pdf_generator,
    company_packages_pdf_generator,
    student_report_pdf_generator
)
from app.rag.llm import llm_service
import os

chat_router = APIRouter(prefix="/chat", tags=["Chat & RAG"])
pdf_router = APIRouter(prefix="/pdf", tags=["PDF Reports"])


# ==================== CHAT ENDPOINTS ====================

@chat_router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat with RAG-powered assistant
    
    Searches vector database for relevant context and generates answer
    """
    try:
        result = await rag_chat_service.answer_question(
            question=request.question,
            conversation_id=request.conversation_id,
            use_rag=request.use_rag,
            conversation_history=[msg.dict() for msg in request.conversation_history]
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")


# ==================== STUDENT REPORT GENERATION ====================

@pdf_router.post("/student-report/{student_id}")
async def generate_student_report(student_id: str):
    """
    Generate personalized AI-powered student career report
    
    Analyzes student data and creates PDF with:
    - Strengths & Weaknesses
    - Recommended roles
    - Placement probability
    - Learning roadmap
    """
    try:
        # Get student data
        student = await student_service.get_by_id(student_id)
        if not student:
            raise HTTPException(404, "Student not found")
        
        # Generate AI insights
        report_data = await _generate_ai_student_report(student)
        
        # Save report to database
        saved_report = await student_report_service.create(report_data)
        
        # Generate PDF
        pdf_path = student_report_pdf_generator.generate(report_data)
        
        # Update report with PDF path
        await student_report_service.update(
            saved_report["_id"],
            {"pdf_path": pdf_path}
        )
        
        return {
            "message": "Report generated successfully",
            "report_id": saved_report["_id"],
            "pdf_path": pdf_path,
            "report_data": report_data
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error generating report: {str(e)}")


@pdf_router.get("/download/{filename}")
async def download_pdf(filename: str):
    """Download generated PDF report"""
    from app.config import settings
    filepath = os.path.join(settings.PDF_OUTPUT_DIR, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(404, "PDF file not found")
    
    return FileResponse(
        filepath,
        media_type="application/pdf",
        filename=filename
    )


# ==================== HELPER FUNCTIONS ====================

async def _generate_ai_student_report(student: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate AI-powered student report using LLM
    
    Args:
        student: Student data dict
    
    Returns:
        Complete report data dict
    """
    # Build prompt for LLM
    prompt = f"""
You are an expert career counselor analyzing a student's profile for placement preparation.

Student Profile:
- Name: {student.get('name')}
- Department: {student.get('department')}
- CGPA: {student.get('cgpa')}
- Skills: {', '.join(student.get('skills', []))}
- Certifications: {', '.join(student.get('certifications', []))}
- Internships: {', '.join(student.get('internships_completed', []))}
- Projects: {len(student.get('projects', []))}

Based on this profile, provide:

1. STRENGTHS (3-5 points): What are this student's key strengths?
2. WEAKNESSES (3-5 points): What areas need improvement?
3. RECOMMENDED ROLES (3-5 roles): Best-fit job roles for this student
4. PLACEMENT PROBABILITY (0-100%): Realistic estimate based on profile
5. RECOMMENDED ROADMAP (detailed paragraph): Step-by-step learning plan for next 6 months
6. AI INSIGHTS (detailed paragraph): Overall assessment and career advice

Format your response as JSON:
{{
    "strengths": ["strength1", "strength2", ...],
    "weaknesses": ["weakness1", "weakness2", ...],
    "recommended_roles": ["role1", "role2", ...],
    "placement_probability": 75.5,
    "recommended_roadmap": "detailed roadmap text...",
    "ai_insights": "detailed insights text..."
}}
"""
    
    # Generate AI response
    ai_response = llm_service.generate_response(
        prompt=prompt,
        temperature=0.5,
        max_tokens=1500
    )
    
    # Parse JSON response
    import json
    try:
        ai_data = json.loads(ai_response)
    except:
        # Fallback if LLM doesn't return valid JSON
        ai_data = {
            "strengths": ["Strong academic performance", "Good technical skills"],
            "weaknesses": ["Limited work experience", "Need more certifications"],
            "recommended_roles": ["Software Engineer", "Data Analyst"],
            "placement_probability": 70.0,
            "recommended_roadmap": "Focus on building projects and gaining internship experience.",
            "ai_insights": "Good potential with room for improvement through focused skill development."
        }
    
    # Build complete report
    report_data = {
        "student_id": student.get("_id"),
        "student_name": student.get("name"),
        "department": student.get("department"),
        "cgpa": student.get("cgpa"),
        "skills": student.get("skills", []),
        "certifications": student.get("certifications", []),
        "internships": student.get("internships_completed", []),
        "strengths": ai_data.get("strengths", []),
        "weaknesses": ai_data.get("weaknesses", []),
        "recommended_roles": ai_data.get("recommended_roles", []),
        "placement_probability": ai_data.get("placement_probability", 0.0),
        "recommended_roadmap": ai_data.get("recommended_roadmap", ""),
        "ai_insights": ai_data.get("ai_insights", "")
    }
    
    return report_data


# Export routers
__all__ = ["chat_router", "pdf_router"]
