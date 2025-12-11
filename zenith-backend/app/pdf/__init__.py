"""
PDF module initialization
"""
from app.pdf.generators import (
    events_pdf_generator,
    placements_pdf_generator,
    company_packages_pdf_generator,
    student_report_pdf_generator
)

__all__ = [
    "events_pdf_generator",
    "placements_pdf_generator",
    "company_packages_pdf_generator",
    "student_report_pdf_generator"
]
