/**
 * Exam Scheduling Algorithm Service
 * JavaScript port from Python scheduling algorithm
 * 
 * Features:
 * - Constraint-based scheduling (gap requirements)
 * - Heavy subjects: 1 full day gap
 * - Non-major subjects: half-day gap
 * - One exam per department per day
 * - Holiday/weekend exclusion
 */

const Subject = require('../models/Subject');
const User = require('../models/User');

// Session times
const SESSIONS = {
    FN: { start: '09:00', end: '12:00', name: 'Forenoon' },
    AN: { start: '14:00', end: '17:00', name: 'Afternoon' }
};

// Internal exam session
const INTERNAL_SESSION = { start: '08:30', end: '10:00' };

/**
 * Generate available dates excluding weekends and holidays
 */
const generateAvailableDates = (startDate, endDate, holidays = []) => {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    const holidaySet = new Set(holidays.map(h =>
        new Date(h).toISOString().split('T')[0]
    ));

    while (current <= end) {
        const dayOfWeek = current.getDay();
        const dateStr = current.toISOString().split('T')[0];

        // Exclude weekends (0 = Sunday, 6 = Saturday) and holidays
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateStr)) {
            dates.push(new Date(current));
        }

        current.setDate(current.getDate() + 1);
    }

    return dates;
};

/**
 * Get minimum gap in days based on subject type
 * Heavy subjects: 1 full day (next FN or later)
 * Non-major: half-day (different session same day or next day)
 */
const getMinGap = (subjectType, examType) => {
    if (examType === 'Internal') {
        return 0; // No gap constraints for internal exams
    }

    return subjectType === 'HEAVY' ? 1 : 0.5;
};

/**
 * Check if a slot respects gap constraints
 */
const respectsGapConstraint = (lastExam, currentDate, currentSession, subjectType, examType) => {
    if (!lastExam || examType === 'Internal') {
        return true;
    }

    const lastDate = new Date(lastExam.date);
    const currDate = new Date(currentDate);

    // Calculate days difference
    const daysDiff = Math.floor((currDate - lastDate) / (1000 * 60 * 60 * 24));

    if (subjectType === 'HEAVY') {
        // Heavy subjects need at least 1 full day gap
        if (daysDiff < 1) return false;
        if (daysDiff === 1 && lastExam.session === 'AN') {
            // If last was AN, next must be AN or later
            return currentSession === 'AN';
        }
        return true;
    } else {
        // Non-major needs half-day gap
        if (daysDiff === 0) {
            // Same day - must be different session
            return lastExam.session !== currentSession;
        }
        return true;
    }
};

/**
 * Main scheduling algorithm
 */
const scheduleExams = async ({
    year,
    examType, // 'Internal' or 'Semester'
    startDate,
    endDate,
    holidays = [],
    departments = []
}) => {
    const violations = [];
    const timetable = [];

    // Generate available dates
    const availableDates = generateAvailableDates(startDate, endDate, holidays);

    if (availableDates.length === 0) {
        return {
            success: false,
            error: 'No available dates in the given range',
            timetable: [],
            violations: [{ message: 'No available dates', severity: 'ERROR' }]
        };
    }

    // Fetch subjects for the year
    let query = { year };
    if (departments.length > 0) {
        query.department = { $in: departments };
    }

    const subjects = await Subject.find(query).sort({ subjectType: -1 }); // HEAVY first

    if (subjects.length === 0) {
        return {
            success: false,
            error: 'No subjects found for the given criteria',
            timetable: [],
            violations: [{ message: 'No subjects found', severity: 'ERROR' }]
        };
    }

    // Group subjects by department
    const subjectsByDept = {};
    subjects.forEach(sub => {
        if (!subjectsByDept[sub.department]) {
            subjectsByDept[sub.department] = [];
        }
        subjectsByDept[sub.department].push(sub);
    });

    // Track department usage per date
    const deptDateUsage = {}; // { 'DEPT_2024-01-15': true }

    // Track last exam per department for gap constraints
    const lastExamByDept = {};

    // Available slots per date
    const dateSlots = {};
    availableDates.forEach(date => {
        const dateStr = date.toISOString().split('T')[0];
        if (examType === 'Internal') {
            dateSlots[dateStr] = ['FN']; // Internal: only morning session
        } else {
            dateSlots[dateStr] = ['FN', 'AN']; // Semester: both sessions
        }
    });

    // Schedule each department's subjects
    for (const [dept, deptSubjects] of Object.entries(subjectsByDept)) {
        // Sort: HEAVY first
        deptSubjects.sort((a, b) => {
            if (a.subjectType === 'HEAVY' && b.subjectType !== 'HEAVY') return -1;
            if (a.subjectType !== 'HEAVY' && b.subjectType === 'HEAVY') return 1;
            return 0;
        });

        for (const subject of deptSubjects) {
            let scheduled = false;

            // Try to find a slot
            for (const date of availableDates) {
                const dateStr = date.toISOString().split('T')[0];
                const deptDateKey = `${dept}_${dateStr}`;

                // Check if department already has exam on this date
                if (deptDateUsage[deptDateKey]) {
                    continue;
                }

                // Get available sessions for this date
                const sessions = dateSlots[dateStr];
                if (!sessions || sessions.length === 0) continue;

                for (const session of sessions) {
                    // Check gap constraints
                    if (respectsGapConstraint(
                        lastExamByDept[dept],
                        date,
                        session,
                        subject.subjectType,
                        examType
                    )) {
                        // Schedule the exam
                        const entry = {
                            date: new Date(date),
                            session,
                            subjectCode: subject.code,
                            subjectName: subject.name,
                            department: dept,
                            subjectType: subject.subjectType
                        };

                        timetable.push(entry);

                        // Mark slot as used
                        deptDateUsage[deptDateKey] = true;
                        lastExamByDept[dept] = { date, session };

                        // Remove used session from slot
                        const sessionIdx = dateSlots[dateStr].indexOf(session);
                        if (sessionIdx > -1 && examType !== 'Internal') {
                            // For semester exams, keep both sessions available for different depts
                            // Only mark department-date combination as used
                        }

                        scheduled = true;
                        break;
                    }
                }

                if (scheduled) break;
            }

            if (!scheduled) {
                // Try to schedule anyway with constraint violation
                for (const date of availableDates) {
                    const dateStr = date.toISOString().split('T')[0];
                    const deptDateKey = `${dept}_${dateStr}`;

                    if (deptDateUsage[deptDateKey]) continue;

                    const sessions = dateSlots[dateStr];
                    if (!sessions || sessions.length === 0) continue;

                    const session = sessions[0];

                    const entry = {
                        date: new Date(date),
                        session,
                        subjectCode: subject.code,
                        subjectName: subject.name,
                        department: dept,
                        subjectType: subject.subjectType
                    };

                    timetable.push(entry);
                    deptDateUsage[deptDateKey] = true;
                    lastExamByDept[dept] = { date, session };

                    violations.push({
                        message: `Gap constraint violated for ${subject.code} (${subject.name})`,
                        severity: 'WARNING'
                    });

                    scheduled = true;
                    break;
                }
            }

            if (!scheduled) {
                violations.push({
                    message: `Could not schedule ${subject.code} (${subject.name}) - extend date range`,
                    severity: 'ERROR'
                });
            }
        }
    }

    // Sort timetable by date and session
    timetable.sort((a, b) => {
        const dateCompare = new Date(a.date) - new Date(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.session === 'FN' ? -1 : 1;
    });

    return {
        success: violations.filter(v => v.severity === 'ERROR').length === 0,
        timetable,
        violations,
        summary: {
            totalExams: timetable.length,
            datesUsed: new Set(timetable.map(t => t.date.toISOString().split('T')[0])).size,
            departments: Object.keys(subjectsByDept).length,
            constraintViolations: violations.length
        }
    };
};

/**
 * Format timetable for display
 */
const formatTimetable = (timetable) => {
    return timetable.map(entry => ({
        date: entry.date.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }),
        session: SESSIONS[entry.session]?.name || entry.session,
        subjectCode: entry.subjectCode,
        subjectName: entry.subjectName,
        department: entry.department
    }));
};

module.exports = {
    scheduleExams,
    formatTimetable,
    generateAvailableDates,
    SESSIONS
};
