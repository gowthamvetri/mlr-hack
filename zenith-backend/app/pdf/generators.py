"""
PDF Generation Services
Creates professional PDFs for all report types
"""
from typing import List, Dict, Any
from datetime import datetime
import os
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, 
    PageBreak, Image, Frame, PageTemplate
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class BasePDFGenerator:
    """Base class for PDF generation"""
    
    def __init__(self):
        self.output_dir = settings.PDF_OUTPUT_DIR
        self.styles = getSampleStyleSheet()
        self._ensure_output_dir()
        
        # Custom styles
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a237e'),
            alignment=TA_CENTER,
            spaceAfter=30
        )
        
        self.heading_style = ParagraphStyle(
            'CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#283593'),
            spaceAfter=12
        )
        
        self.subheading_style = ParagraphStyle(
            'CustomSubHeading',
            parent=self.styles['Heading3'],
            fontSize=12,
            textColor=colors.HexColor('#3f51b5'),
            spaceAfter=10
        )
    
    def _ensure_output_dir(self):
        """Create output directory if it doesn't exist"""
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
    
    def _generate_header(self):
        """Generate PDF header"""
        header = [
            Paragraph("MLRIT - Marri Laxman Reddy Institute of Technology", self.title_style),
            Paragraph("Smart Campus & Placement Assistant", self.heading_style),
            Spacer(1, 20)
        ]
        return header
    
    def _generate_footer(self, page_num: int):
        """Generate PDF footer"""
        footer_style = ParagraphStyle(
            'Footer',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.grey,
            alignment=TA_CENTER
        )
        footer_text = f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Page {page_num}"
        return Paragraph(footer_text, footer_style)


class EventsPDFGenerator(BasePDFGenerator):
    """Generate PDF for events"""
    
    def generate(self, events: List[Dict[str, Any]]) -> str:
        """Generate events report PDF"""
        filename = f"events_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        filepath = os.path.join(self.output_dir, filename)
        
        doc = SimpleDocTemplate(filepath, pagesize=A4)
        story = []
        
        # Header
        story.extend(self._generate_header())
        story.append(Paragraph("Upcoming Events Report", self.title_style))
        story.append(Spacer(1, 20))
        
        # Events table
        if events:
            for event in events:
                story.append(Paragraph(event.get("title", "N/A"), self.heading_style))
                story.append(Paragraph(f"<b>Date:</b> {event.get('date', 'N/A')}", self.styles['Normal']))
                story.append(Paragraph(f"<b>Type:</b> {event.get('event_type', 'N/A')}", self.styles['Normal']))
                story.append(Paragraph(f"<b>Venue:</b> {event.get('venue', 'N/A')}", self.styles['Normal']))
                story.append(Paragraph(f"<b>Description:</b> {event.get('description', 'N/A')}", self.styles['Normal']))
                story.append(Spacer(1, 15))
        else:
            story.append(Paragraph("No events found.", self.styles['Normal']))
        
        doc.build(story)
        logger.info(f"✅ Generated events PDF: {filepath}")
        return filepath


class PlacementsPDFGenerator(BasePDFGenerator):
    """Generate PDF for placement statistics"""
    
    def generate(self, placements: List[Dict[str, Any]]) -> str:
        """Generate placements report PDF"""
        filename = f"placements_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        filepath = os.path.join(self.output_dir, filename)
        
        doc = SimpleDocTemplate(filepath, pagesize=A4)
        story = []
        
        # Header
        story.extend(self._generate_header())
        story.append(Paragraph("Placement Statistics Report", self.title_style))
        story.append(Spacer(1, 20))
        
        # Placements table
        if placements:
            data = [['Department', 'Year', 'Total', 'Placed', '%', 'Avg Package', 'Highest']]
            
            for p in placements:
                data.append([
                    p.get('department', 'N/A'),
                    p.get('academic_year', 'N/A'),
                    str(p.get('total_students', 0)),
                    str(p.get('students_placed', 0)),
                    f"{(p.get('students_placed', 0) / p.get('total_students', 1) * 100):.1f}%",
                    f"₹{p.get('average_package', 0):.2f}L",
                    f"₹{p.get('highest_package', 0):.2f}L"
                ])
            
            table = Table(data, colWidths=[1.2*inch, 1*inch, 0.8*inch, 0.8*inch, 0.8*inch, 1.2*inch, 1.2*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#283593')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(table)
        else:
            story.append(Paragraph("No placement data found.", self.styles['Normal']))
        
        doc.build(story)
        logger.info(f"✅ Generated placements PDF: {filepath}")
        return filepath


class CompanyPackagesPDFGenerator(BasePDFGenerator):
    """Generate PDF for company packages"""
    
    def generate(self, packages: List[Dict[str, Any]]) -> str:
        """Generate company packages report PDF"""
        filename = f"company_packages_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        filepath = os.path.join(self.output_dir, filename)
        
        doc = SimpleDocTemplate(filepath, pagesize=A4)
        story = []
        
        # Header
        story.extend(self._generate_header())
        story.append(Paragraph("Company Package Details Report", self.title_style))
        story.append(Spacer(1, 20))
        
        # Packages
        if packages:
            for pkg in packages:
                story.append(Paragraph(pkg.get("company_name", "N/A"), self.heading_style))
                story.append(Paragraph(f"<b>Package:</b> ₹{pkg.get('package_offered', 0):.2f} LPA", self.styles['Normal']))
                story.append(Paragraph(f"<b>Role:</b> {pkg.get('role', 'N/A')}", self.styles['Normal']))
                story.append(Paragraph(f"<b>Location:</b> {pkg.get('job_location', 'N/A')}", self.styles['Normal']))
                story.append(Paragraph(f"<b>Students Selected:</b> {pkg.get('students_selected', 0)}", self.styles['Normal']))
                story.append(Spacer(1, 15))
        else:
            story.append(Paragraph("No package data found.", self.styles['Normal']))
        
        doc.build(story)
        logger.info(f"✅ Generated company packages PDF: {filepath}")
        return filepath


class StudentReportPDFGenerator(BasePDFGenerator):
    """Generate personalized student career report PDF"""
    
    def generate(self, report_data: Dict[str, Any]) -> str:
        """Generate personalized student report PDF"""
        student_name = report_data.get('student_name', 'Student').replace(' ', '_')
        filename = f"student_report_{student_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        filepath = os.path.join(self.output_dir, filename)
        
        doc = SimpleDocTemplate(filepath, pagesize=A4)
        story = []
        
        # Header
        story.extend(self._generate_header())
        story.append(Paragraph("Personalized Career Report", self.title_style))
        story.append(Spacer(1, 20))
        
        # Student Info
        story.append(Paragraph(f"<b>Student Name:</b> {report_data.get('student_name', 'N/A')}", self.heading_style))
        story.append(Paragraph(f"<b>Department:</b> {report_data.get('department', 'N/A')}", self.styles['Normal']))
        story.append(Paragraph(f"<b>CGPA:</b> {report_data.get('cgpa', 'N/A')}", self.styles['Normal']))
        story.append(Spacer(1, 20))
        
        # Skills
        story.append(Paragraph("Technical Skills", self.subheading_style))
        skills = ", ".join(report_data.get('skills', []))
        story.append(Paragraph(skills or "N/A", self.styles['Normal']))
        story.append(Spacer(1, 15))
        
        # Strengths
        story.append(Paragraph("Strengths", self.subheading_style))
        for strength in report_data.get('strengths', []):
            story.append(Paragraph(f"• {strength}", self.styles['Normal']))
        story.append(Spacer(1, 15))
        
        # Weaknesses
        story.append(Paragraph("Areas for Improvement", self.subheading_style))
        for weakness in report_data.get('weaknesses', []):
            story.append(Paragraph(f"• {weakness}", self.styles['Normal']))
        story.append(Spacer(1, 15))
        
        # Recommended Roles
        story.append(Paragraph("Recommended Career Roles", self.subheading_style))
        for role in report_data.get('recommended_roles', []):
            story.append(Paragraph(f"• {role}", self.styles['Normal']))
        story.append(Spacer(1, 15))
        
        # Placement Probability
        probability = report_data.get('placement_probability', 0)
        story.append(Paragraph(f"<b>Placement Probability:</b> {probability:.1f}%", self.heading_style))
        story.append(Spacer(1, 15))
        
        # AI Insights
        story.append(Paragraph("AI-Generated Insights", self.subheading_style))
        story.append(Paragraph(report_data.get('ai_insights', 'N/A'), self.styles['Normal']))
        story.append(Spacer(1, 15))
        
        # Recommended Roadmap
        story.append(Paragraph("Recommended Learning Roadmap", self.subheading_style))
        story.append(Paragraph(report_data.get('recommended_roadmap', 'N/A'), self.styles['Normal']))
        
        doc.build(story)
        logger.info(f"✅ Generated student report PDF: {filepath}")
        return filepath


# PDF Generator instances
events_pdf_generator = EventsPDFGenerator()
placements_pdf_generator = PlacementsPDFGenerator()
company_packages_pdf_generator = CompanyPackagesPDFGenerator()
student_report_pdf_generator = StudentReportPDFGenerator()
