/**
 * Hall Ticket Generation Service
 * Generates professional PDF hall tickets with QR codes
 */

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '../../uploads/hall_tickets');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Generate QR code as base64 data URL
 */
const generateQRCode = async (data) => {
    try {
        const qrDataUrl = await QRCode.toDataURL(JSON.stringify(data), {
            errorCorrectionLevel: 'H',
            margin: 2,
            width: 150
        });
        return qrDataUrl;
    } catch (error) {
        console.error('QR Code generation error:', error);
        throw error;
    }
};

/**
 * Generate a single hall ticket PDF
 */
const generateHallTicketPDF = async ({
    student,
    exam,
    subjects = [],
    seating = null,
    collegeName = 'MLR Institute of Technology',
    collegeAddress = 'Dundigal, Hyderabad - 500043'
}) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Generate QR code data for attendance verification
            const qrData = {
                studentId: student._id.toString(),
                rollNumber: student.rollNumber,
                examId: exam._id.toString(),
                timestamp: Date.now()
            };

            const qrCodeDataUrl = await generateQRCode(qrData);

            // Create PDF document
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });

            // Generate filename
            const filename = `hall_ticket_${student.rollNumber}_${exam._id}_${Date.now()}.pdf`;
            const filePath = path.join(UPLOADS_DIR, filename);

            // Pipe to file
            const writeStream = fs.createWriteStream(filePath);
            doc.pipe(writeStream);

            // === HEADER ===
            doc.fontSize(18).font('Helvetica-Bold')
                .text(collegeName, { align: 'center' });

            doc.fontSize(10).font('Helvetica')
                .text(collegeAddress, { align: 'center' });

            doc.moveDown(0.5);

            // Title
            doc.fontSize(16).font('Helvetica-Bold')
                .fillColor('#DC2626')
                .text('HALL TICKET', { align: 'center' });

            doc.fontSize(12).font('Helvetica')
                .fillColor('black')
                .text(`${exam.examType} Examinations - ${exam.semester}`, { align: 'center' });

            doc.moveDown(1);

            // Draw horizontal line
            doc.strokeColor('#DC2626')
                .lineWidth(2)
                .moveTo(50, doc.y)
                .lineTo(545, doc.y)
                .stroke();

            doc.moveDown(1);

            // === STUDENT INFO + QR CODE ===
            const startY = doc.y;

            // Student details (left side)
            doc.fontSize(11).font('Helvetica-Bold');

            const leftCol = 50;
            const labelWidth = 120;

            doc.text('Roll Number:', leftCol, startY);
            doc.font('Helvetica').text(student.rollNumber, leftCol + labelWidth, startY);

            doc.font('Helvetica-Bold').text('Name:', leftCol, startY + 20);
            doc.font('Helvetica').text(student.name, leftCol + labelWidth, startY + 20);

            doc.font('Helvetica-Bold').text('Department:', leftCol, startY + 40);
            doc.font('Helvetica').text(student.department, leftCol + labelWidth, startY + 40);

            doc.font('Helvetica-Bold').text('Year:', leftCol, startY + 60);
            doc.font('Helvetica').text(`${student.year || 'N/A'}`, leftCol + labelWidth, startY + 60);

            if (seating) {
                doc.font('Helvetica-Bold').text('Hall/Room:', leftCol, startY + 80);
                doc.font('Helvetica').text(seating.roomNumber || 'TBA', leftCol + labelWidth, startY + 80);

                doc.font('Helvetica-Bold').text('Seat Number:', leftCol, startY + 100);
                doc.font('Helvetica').text(seating.seatNumber || 'TBA', leftCol + labelWidth, startY + 100);
            }

            // QR Code (right side)
            if (qrCodeDataUrl) {
                const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
                doc.image(qrBuffer, 430, startY, { width: 100 });
                doc.fontSize(8).text('Scan for attendance', 430, startY + 105, { width: 100, align: 'center' });
            }

            doc.y = startY + 130;
            doc.moveDown(1);

            // === EXAM SUBJECTS TABLE ===
            doc.strokeColor('#333')
                .lineWidth(1)
                .moveTo(50, doc.y)
                .lineTo(545, doc.y)
                .stroke();

            const tableTop = doc.y + 5;

            // Table header
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('S.No', 50, tableTop, { width: 40 });
            doc.text('Subject Code', 90, tableTop, { width: 80 });
            doc.text('Subject Name', 175, tableTop, { width: 180 });
            doc.text('Date', 360, tableTop, { width: 80 });
            doc.text('Session', 445, tableTop, { width: 100 });

            doc.strokeColor('#333')
                .moveTo(50, tableTop + 15)
                .lineTo(545, tableTop + 15)
                .stroke();

            // Table rows
            doc.font('Helvetica').fontSize(9);
            let currentY = tableTop + 20;

            subjects.forEach((subject, index) => {
                doc.text(`${index + 1}`, 50, currentY, { width: 40 });
                doc.text(subject.code || subject.courseCode, 90, currentY, { width: 80 });
                doc.text(subject.name || subject.courseName, 175, currentY, { width: 180 });

                const dateStr = subject.date
                    ? new Date(subject.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    })
                    : 'TBA';
                doc.text(dateStr, 360, currentY, { width: 80 });

                doc.text(subject.session || 'FN', 445, currentY, { width: 100 });

                currentY += 18;
            });

            // Table bottom border
            doc.strokeColor('#333')
                .moveTo(50, currentY + 5)
                .lineTo(545, currentY + 5)
                .stroke();

            doc.y = currentY + 20;
            doc.moveDown(1);

            // === INSTRUCTIONS ===
            doc.fontSize(11).font('Helvetica-Bold')
                .text('Instructions:', 50);

            doc.fontSize(9).font('Helvetica');
            const instructions = [
                '1. Report to the examination hall 30 minutes before the scheduled time.',
                '2. This hall ticket must be presented for admission along with a valid ID card.',
                '3. Electronic devices including mobile phones are strictly prohibited.',
                '4. Use only blue or black ballpoint pen for writing.',
                '5. Write your roll number clearly on every answer sheet.',
                '6. Maintain silence and decorum in the examination hall.'
            ];

            instructions.forEach(instruction => {
                doc.text(instruction, 50, doc.y + 5, { width: 495 });
            });

            doc.moveDown(2);

            // === SIGNATURES ===
            doc.y = 700; // Fixed position near bottom

            doc.fontSize(10).font('Helvetica');
            doc.text("Student's Signature", 50, doc.y);
            doc.text("Principal's Signature", 400, doc.y);

            doc.moveDown(2);

            // Footer
            doc.fontSize(8).fillColor('#666')
                .text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 50, 780);
            doc.text('This is a computer-generated document.', 50, 795);

            // Finalize PDF
            doc.end();

            writeStream.on('finish', () => {
                resolve({
                    filePath,
                    filename,
                    qrCode: qrCodeDataUrl,
                    qrData: JSON.stringify(qrData)
                });
            });

            writeStream.on('error', reject);

        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Generate bulk hall tickets for all students in an exam
 */
const generateBulkHallTickets = async (students, exam, subjects) => {
    const results = {
        generated: 0,
        failed: 0,
        errors: [],
        tickets: []
    };

    for (const student of students) {
        try {
            const result = await generateHallTicketPDF({
                student,
                exam,
                subjects
            });

            results.tickets.push({
                studentId: student._id,
                rollNumber: student.rollNumber,
                ...result
            });
            results.generated++;
        } catch (error) {
            results.failed++;
            results.errors.push({
                studentId: student._id,
                rollNumber: student.rollNumber,
                error: error.message
            });
        }
    }

    return results;
};

module.exports = {
    generateQRCode,
    generateHallTicketPDF,
    generateBulkHallTickets
};
