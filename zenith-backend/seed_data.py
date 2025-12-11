"""
Sample Data Seeder Script
Run this to populate database with sample data for testing
"""
import asyncio
from datetime import datetime, timedelta
from app.database import mongodb
from app.services import (
    event_service,
    placement_service,
    company_package_service,
    interview_question_service,
    internship_service,
    skill_roadmap_service,
    club_service,
    scholarship_service,
    student_service
)


async def seed_events():
    """Seed sample events"""
    events = [
        {
            "title": "Google Campus Recruitment Drive",
            "description": "Google is hiring for SDE positions. Eligibility: CGPA > 7.5",
            "event_type": "placement",
            "date": datetime.now() + timedelta(days=15),
            "venue": "Main Auditorium",
            "organizer": "Placement Cell",
            "registration_link": "https://example.com/register",
            "is_active": True
        },
        {
            "title": "AWS Cloud Workshop",
            "description": "Hands-on workshop on AWS services and cloud architecture",
            "event_type": "workshop",
            "date": datetime.now() + timedelta(days=7),
            "venue": "Computer Lab 3",
            "organizer": "Technical Club",
            "is_active": True
        },
        {
            "title": "Annual Tech Fest 2025",
            "description": "3-day technical festival with coding competitions, hackathons, and tech talks",
            "event_type": "technical",
            "date": datetime.now() + timedelta(days=30),
            "venue": "Campus Ground",
            "organizer": "Student Council",
            "is_active": True
        }
    ]
    
    for event in events:
        await event_service.create(event)
    print("✅ Seeded 3 events")


async def seed_placements():
    """Seed sample placement statistics"""
    placements = [
        {
            "academic_year": "2023-2024",
            "department": "CSE",
            "total_students": 120,
            "students_placed": 102,
            "students_higher_studies": 10,
            "average_package": 8.5,
            "highest_package": 45.0,
            "lowest_package": 4.5,
            "companies_visited": 45
        },
        {
            "academic_year": "2023-2024",
            "department": "IT",
            "total_students": 60,
            "students_placed": 55,
            "students_higher_studies": 3,
            "average_package": 7.8,
            "highest_package": 32.0,
            "lowest_package": 4.0,
            "companies_visited": 35
        },
        {
            "academic_year": "2023-2024",
            "department": "ECE",
            "total_students": 80,
            "students_placed": 65,
            "students_higher_studies": 8,
            "average_package": 6.5,
            "highest_package": 18.0,
            "lowest_package": 3.5,
            "companies_visited": 28
        }
    ]
    
    for placement in placements:
        await placement_service.create(placement)
    print("✅ Seeded 3 placement records")


async def seed_companies():
    """Seed sample company packages"""
    companies = [
        {
            "company_name": "Google",
            "academic_year": "2023-2024",
            "package_offered": 45.0,
            "role": "Software Engineer",
            "job_location": "Bangalore",
            "departments_allowed": ["CSE", "IT"],
            "selection_process": ["Online Test", "Technical Interview", "HR Round"],
            "students_selected": 3,
            "cgpa_criteria": 8.0
        },
        {
            "company_name": "Microsoft",
            "academic_year": "2023-2024",
            "package_offered": 42.0,
            "role": "SDE-1",
            "job_location": "Hyderabad",
            "departments_allowed": ["CSE", "IT"],
            "selection_process": ["Coding Round", "Technical Interview", "Managerial Round"],
            "students_selected": 5,
            "cgpa_criteria": 7.5
        },
        {
            "company_name": "Amazon",
            "academic_year": "2023-2024",
            "package_offered": 38.0,
            "role": "SDE-1",
            "job_location": "Bangalore",
            "departments_allowed": ["CSE", "IT", "ECE"],
            "selection_process": ["Online Assessment", "Technical Interview", "Bar Raiser"],
            "students_selected": 8,
            "cgpa_criteria": 7.0
        }
    ]
    
    for company in companies:
        await company_package_service.create(company)
    print("✅ Seeded 3 company packages")


async def seed_interview_questions():
    """Seed sample interview questions"""
    questions = [
        {
            "company_name": "Google",
            "role": "Software Engineer",
            "question_category": "Technical",
            "question": "Implement LRU Cache with O(1) time complexity for both get and put operations",
            "answer": "Use HashMap + Doubly Linked List. HashMap for O(1) lookup, DLL for maintaining order.",
            "difficulty_level": "Hard",
            "asked_year": 2024
        },
        {
            "company_name": "Microsoft",
            "role": "SDE-1",
            "question_category": "Technical",
            "question": "Find the longest palindromic substring in a given string",
            "answer": "Use dynamic programming or expand around center approach.",
            "difficulty_level": "Medium",
            "asked_year": 2024
        },
        {
            "company_name": "Amazon",
            "role": "SDE-1",
            "question_category": "Behavioral",
            "question": "Tell me about a time when you had a conflict with a team member",
            "answer": "Use STAR method: Situation, Task, Action, Result",
            "difficulty_level": "Medium",
            "asked_year": 2024
        }
    ]
    
    for question in questions:
        await interview_question_service.create(question)
    print("✅ Seeded 3 interview questions")


async def seed_internships():
    """Seed sample internships"""
    internships = [
        {
            "company_name": "Google Summer of Code",
            "role": "Open Source Contributor",
            "duration": "3 months",
            "stipend": 75000.0,
            "location": "Remote",
            "application_deadline": datetime.now() + timedelta(days=45),
            "requirements": ["Git", "Open Source Experience", "Programming Skills"],
            "application_link": "https://summerofcode.withgoogle.com",
            "is_active": True
        },
        {
            "company_name": "Microsoft",
            "role": "Software Engineering Intern",
            "duration": "2 months",
            "stipend": 50000.0,
            "location": "Hyderabad",
            "application_deadline": datetime.now() + timedelta(days=30),
            "requirements": ["DSA", "C++/Java", "Problem Solving"],
            "application_link": "https://careers.microsoft.com/students",
            "is_active": True
        }
    ]
    
    for internship in internships:
        await internship_service.create(internship)
    print("✅ Seeded 2 internships")


async def seed_clubs():
    """Seed sample clubs"""
    clubs = [
        {
            "name": "Coding Club",
            "category": "Technical",
            "description": "Learn competitive programming, participate in hackathons, and improve coding skills",
            "faculty_coordinator": "Dr. Rajesh Kumar",
            "student_coordinator": "Arjun Sharma",
            "contact_email": "codingclub@mlrit.ac.in",
            "activities": ["Coding Contests", "Hackathons", "Tech Talks", "Workshops"],
            "achievements": ["Won Smart India Hackathon 2023", "30+ members placed in top companies"],
            "membership_open": True
        },
        {
            "name": "AI/ML Club",
            "category": "Technical",
            "description": "Explore artificial intelligence and machine learning through projects and research",
            "faculty_coordinator": "Dr. Priya Reddy",
            "student_coordinator": "Sneha Patel",
            "contact_email": "aimlclub@mlrit.ac.in",
            "activities": ["ML Projects", "Research Papers", "Kaggle Competitions", "Guest Lectures"],
            "achievements": ["Published 5 research papers", "Won 2 Kaggle competitions"],
            "membership_open": True
        }
    ]
    
    for club in clubs:
        await club_service.create(club)
    print("✅ Seeded 2 clubs")


async def seed_scholarships():
    """Seed sample scholarships"""
    scholarships = [
        {
            "name": "National Scholarship Portal",
            "provider": "Government of India",
            "amount": 50000.0,
            "eligibility": ["Indian Citizen", "Family Income < 6 LPA", "Minimum 60% marks"],
            "application_deadline": datetime.now() + timedelta(days=60),
            "application_link": "https://scholarships.gov.in",
            "category": "Merit-based",
            "description": "Central government scholarship for meritorious students from economically weaker sections",
            "is_active": True
        },
        {
            "name": "Post-Matric Scholarship (SC/ST)",
            "provider": "Telangana Government",
            "amount": 35000.0,
            "eligibility": ["SC/ST Category", "Family Income < 2.5 LPA", "Regular Student"],
            "application_deadline": datetime.now() + timedelta(days=50),
            "application_link": "https://telanganaepass.cgg.gov.in",
            "category": "Government",
            "description": "State government scholarship for SC/ST students pursuing higher education",
            "is_active": True
        }
    ]
    
    for scholarship in scholarships:
        await scholarship_service.create(scholarship)
    print("✅ Seeded 2 scholarships")


async def seed_students():
    """Seed sample students"""
    students = [
        {
            "name": "Rahul Verma",
            "roll_number": "20XJ1A0501",
            "department": "CSE",
            "email": "rahul.verma@mlrit.ac.in",
            "phone": "+919876543210",
            "cgpa": 8.5,
            "skills": ["Python", "Java", "React", "Node.js", "MongoDB"],
            "certifications": ["AWS Certified Developer", "Google Cloud Associate"],
            "internships_completed": ["Microsoft Summer Intern"],
            "projects": [
                {"title": "E-commerce Platform", "description": "Full-stack MERN application", "link": "github.com/rahul/ecommerce"},
                {"title": "ML Image Classifier", "description": "CNN-based image classification", "link": "github.com/rahul/ml-classifier"}
            ],
            "placement_status": "not_placed"
        }
    ]
    
    for student in students:
        await student_service.create(student)
    print("✅ Seeded 1 student")


async def main():
    """Main seeder function"""
    print("🌱 Starting database seeding...")
    
    # Connect to MongoDB
    await mongodb.connect()
    
    # Seed all data
    await seed_events()
    await seed_placements()
    await seed_companies()
    await seed_interview_questions()
    await seed_internships()
    await seed_clubs()
    await seed_scholarships()
    await seed_students()
    
    # Disconnect
    await mongodb.disconnect()
    
    print("✅ Database seeding complete!")


if __name__ == "__main__":
    asyncio.run(main())
