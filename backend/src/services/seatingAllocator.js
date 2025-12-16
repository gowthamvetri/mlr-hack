/**
 * Seating Allocator Service
 * JavaScript port of MLR-Hackathon seating_allocation.py
 * 
 * Features:
 * - SEM exams: Linear allocation, 1 student per seat, department mixing
 * - Internal exams: 2 students per bench from different departments
 * - Ensures minimum 2 departments per hall
 * - Randomization to prevent friends sitting together
 */

const Room = require('../models/Room');
const Seating = require('../models/Seating');
const User = require('../models/User');
const Exam = require('../models/Exam');

/**
 * Check if a room is available for a given date and session
 */
const isRoomAvailable = async (roomId, date, session, excludeExamId = null) => {
    const examDate = new Date(date);
    examDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(examDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Find exams on same date with same session
    const conflictingExams = await Exam.find({
        date: { $gte: examDate, $lt: nextDay },
        session: session,
        seatingPublished: true,
        ...(excludeExamId ? { _id: { $ne: excludeExamId } } : {})
    });

    if (conflictingExams.length === 0) {
        return true;
    }

    // Check if this room is allocated for any conflicting exam
    for (const exam of conflictingExams) {
        const existingSeating = await Seating.findOne({
            exam: exam._id,
            roomNumber: roomId
        });
        if (existingSeating) {
            return false;
        }
    }

    return true;
};

/**
 * Get all available rooms for a given date and session
 */
const getAvailableRooms = async (date, session, excludeExamId = null) => {
    const allRooms = await Room.find({ isAvailable: true }).sort({ roomNumber: 1 });

    const availableRooms = [];
    for (const room of allRooms) {
        const isAvail = await isRoomAvailable(room.roomNumber, date, session, excludeExamId);
        if (isAvail) {
            availableRooms.push(room);
        }
    }

    return availableRooms;
};

/**
 * Shuffle array using Fisher-Yates algorithm
 */
const shuffleArray = (array, seed = 42) => {
    const shuffled = [...array];
    let currentIndex = shuffled.length;

    // Simple seeded random for reproducibility
    let random = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
    };

    while (currentIndex !== 0) {
        const randomIndex = Math.floor(random() * currentIndex);
        currentIndex--;
        [shuffled[currentIndex], shuffled[randomIndex]] =
            [shuffled[randomIndex], shuffled[currentIndex]];
    }

    return shuffled;
};

/**
 * Allocate seating for Semester exams (1 student per seat)
 */
const allocateSemesterExam = async (students, rooms) => {
    const allocations = [];

    // Group students by department
    const deptGroups = {};
    students.forEach(student => {
        const dept = student.department || 'Unknown';
        if (!deptGroups[dept]) {
            deptGroups[dept] = [];
        }
        deptGroups[dept].push(student);
    });

    // Shuffle each department group
    const departments = Object.keys(deptGroups);
    departments.forEach(dept => {
        deptGroups[dept] = shuffleArray(deptGroups[dept]);
    });

    // Create pointers for each department
    const deptPointers = {};
    departments.forEach(dept => {
        deptPointers[dept] = 0;
    });

    let currentRoomIdx = 0;
    let currentSeatInRoom = 1;
    let totalAllocated = 0;
    let currentRoomDepts = new Set();

    while (totalAllocated < students.length && currentRoomIdx < rooms.length) {
        const room = rooms[currentRoomIdx];

        // Find available departments
        const availableDepts = departments.filter(
            dept => deptPointers[dept] < deptGroups[dept].length
        );

        if (availableDepts.length === 0) break;

        // Ensure minimum 2 departments per room
        let selectedDept;
        if (currentRoomDepts.size < 2) {
            const unusedDepts = availableDepts.filter(d => !currentRoomDepts.has(d));
            selectedDept = unusedDepts.length > 0
                ? unusedDepts[Math.floor(Math.random() * unusedDepts.length)]
                : availableDepts[Math.floor(Math.random() * availableDepts.length)];
        } else {
            selectedDept = availableDepts[Math.floor(Math.random() * availableDepts.length)];
        }

        currentRoomDepts.add(selectedDept);

        const student = deptGroups[selectedDept][deptPointers[selectedDept]];

        allocations.push({
            student: student._id,
            roomNumber: room.roomNumber,
            seatNumber: `S-${currentSeatInRoom}`,
            floor: room.floor || '1',
            building: room.building || 'Main Block',
            department: student.department
        });

        deptPointers[selectedDept]++;
        totalAllocated++;
        currentSeatInRoom++;

        // Move to next room if current is full
        if (currentSeatInRoom > room.capacity) {
            currentRoomIdx++;
            currentSeatInRoom = 1;
            currentRoomDepts = new Set();
        }
    }

    return {
        allocations,
        summary: {
            totalAllocated,
            roomsUsed: currentRoomIdx + 1,
            departments: departments.length
        }
    };
};

/**
 * Allocate seating for Internal exams (2 students per bench)
 */
const allocateInternalExam = async (students, rooms) => {
    const allocations = [];

    // Group students by department
    const deptGroups = {};
    students.forEach(student => {
        const dept = student.department || 'Unknown';
        if (!deptGroups[dept]) {
            deptGroups[dept] = [];
        }
        deptGroups[dept].push(student);
    });

    // Shuffle each department group
    const departments = Object.keys(deptGroups);
    departments.forEach(dept => {
        deptGroups[dept] = shuffleArray(deptGroups[dept]);
    });

    // Create pointers for each department
    const deptPointers = {};
    departments.forEach(dept => {
        deptPointers[dept] = 0;
    });

    let currentRoomIdx = 0;
    let currentBenchInRoom = 1;
    let totalAllocated = 0;
    let currentRoomDepts = new Set();

    while (totalAllocated < students.length && currentRoomIdx < rooms.length) {
        const room = rooms[currentRoomIdx];
        const roomCapacity = room.capacity; // benches, not seats

        // Find available departments
        const availableDepts = departments.filter(
            dept => deptPointers[dept] < deptGroups[dept].length
        );

        if (availableDepts.length === 0) break;

        // First student on bench
        let dept1;
        if (currentRoomDepts.size < 2) {
            const unusedDepts = availableDepts.filter(d => !currentRoomDepts.has(d));
            dept1 = unusedDepts.length > 0
                ? unusedDepts[Math.floor(Math.random() * unusedDepts.length)]
                : availableDepts[Math.floor(Math.random() * availableDepts.length)];
        } else {
            dept1 = availableDepts[Math.floor(Math.random() * availableDepts.length)];
        }

        currentRoomDepts.add(dept1);
        const student1 = deptGroups[dept1][deptPointers[dept1]];

        allocations.push({
            student: student1._id,
            roomNumber: room.roomNumber,
            seatNumber: `B-${currentBenchInRoom}-L`, // Bench-Left
            floor: room.floor || '1',
            building: room.building || 'Main Block',
            department: student1.department
        });

        deptPointers[dept1]++;
        totalAllocated++;

        // Try to add second student from different department (bench-mate)
        const availableDepts2 = departments.filter(
            dept => deptPointers[dept] < deptGroups[dept].length
        );

        if (availableDepts2.length > 0) {
            const otherDepts = availableDepts2.filter(d => d !== dept1);
            if (otherDepts.length > 0) {
                const dept2 = otherDepts[Math.floor(Math.random() * otherDepts.length)];
                currentRoomDepts.add(dept2);
                const student2 = deptGroups[dept2][deptPointers[dept2]];

                allocations.push({
                    student: student2._id,
                    roomNumber: room.roomNumber,
                    seatNumber: `B-${currentBenchInRoom}-R`, // Bench-Right
                    floor: room.floor || '1',
                    building: room.building || 'Main Block',
                    department: student2.department
                });

                deptPointers[dept2]++;
                totalAllocated++;
            }
        }

        currentBenchInRoom++;

        // Move to next room if current is full
        if (currentBenchInRoom > roomCapacity) {
            currentRoomIdx++;
            currentBenchInRoom = 1;
            currentRoomDepts = new Set();
        }
    }

    return {
        allocations,
        summary: {
            totalAllocated,
            roomsUsed: currentRoomIdx + 1,
            departments: departments.length,
            benchesUsed: allocations.filter(a => a.seatNumber.endsWith('-L')).length
        }
    };
};

/**
 * Main allocation function
 */
const allocateSeating = async ({
    examId,
    examType = 'Semester',
    date,
    session = 'FN',
    department = null,
    year = null,
    roomIds = [] // Specific rooms to use, empty = auto-select
}) => {
    // Fetch exam
    const exam = await Exam.findById(examId);
    if (!exam) {
        throw new Error('Exam not found');
    }

    // Build student query
    const studentQuery = { role: 'Student' };
    if (department) {
        studentQuery.department = department;
    } else if (exam.department) {
        studentQuery.department = exam.department;
    }
    if (year) {
        studentQuery.year = parseInt(year);
    }

    const students = await User.find(studentQuery);

    if (students.length === 0) {
        throw new Error('No students found for this exam');
    }

    // Get rooms
    let rooms;
    if (roomIds && roomIds.length > 0) {
        rooms = await Room.find({
            roomNumber: { $in: roomIds },
            isAvailable: true
        });

        if (rooms.length === 0) {
            throw new Error('None of the specified rooms exist or are available');
        }
    } else {
        // Auto-select available rooms
        rooms = await getAvailableRooms(date || exam.date, session || exam.session, examId);

        if (rooms.length === 0) {
            throw new Error('No rooms available for this date and session');
        }
    }

    // Validate room availability for time conflicts
    const examDate = new Date(date || exam.date);
    const examSession = session || exam.session || 'FN';

    for (const room of rooms) {
        const isAvail = await isRoomAvailable(room.roomNumber, examDate, examSession, examId);
        if (!isAvail) {
            throw new Error(`Room ${room.roomNumber} is already booked for another exam at this time`);
        }
    }

    // Clear existing seating for this exam
    await Seating.deleteMany({ exam: examId });

    // Allocate based on exam type
    let result;
    if (examType === 'Internal') {
        result = await allocateInternalExam(students, rooms);
    } else {
        result = await allocateSemesterExam(students, rooms);
    }

    // Add exam ID to allocations and save
    const seatingRecords = result.allocations.map(alloc => ({
        ...alloc,
        exam: examId
    }));

    await Seating.insertMany(seatingRecords);

    // Update exam status
    exam.seatingPublished = true;
    await exam.save();

    return {
        success: true,
        message: `Allocated ${result.summary.totalAllocated} students to ${result.summary.roomsUsed} rooms`,
        summary: result.summary,
        allocations: seatingRecords
    };
};

module.exports = {
    allocateSeating,
    getAvailableRooms,
    isRoomAvailable,
    allocateSemesterExam,
    allocateInternalExam
};
