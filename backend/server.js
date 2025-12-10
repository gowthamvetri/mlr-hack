const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./src/config/db');

dotenv.config();

connectDB();

const app = express();
console.log('Frontend URL:', process.env.FRONTEND_URL);
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
  ],
}));
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/exams', require('./src/routes/examRoutes'));
app.use('/api/events', require('./src/routes/eventRoutes'));
app.use('/api/seating', require('./src/routes/seatingRoutes'));
app.use('/api/subjects', require('./src/routes/subjectRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));
app.use('/api/calendar', require('./src/routes/calendarRoutes'));
app.use('/api/study-progress', require('./src/routes/studyRoutes'));
app.use('/api/rooms', require('./src/routes/roomRoutes'));
app.use('/api/clubs', require('./src/routes/clubRoutes'));
app.use('/api/analytics', require('./src/routes/analyticsRoutes'));
app.use('/api/departments', require('./src/routes/departmentRoutes'));
app.use('/api/courses', require('./src/routes/courseRoutes'));
app.use('/api/faculty', require('./src/routes/facultyRoutes'));
app.use('/api/placements', require('./src/routes/placementRoutes'));
app.use('/api/student-progress', require('./src/routes/studentProgressRoutes'));
app.use('/api/activities', require('./src/routes/activityRoutes'));
app.use('/api/career-approvals', require('./src/routes/careerApprovalRoutes'));
app.use('/api/registration-requests', require('./src/routes/registrationRequestRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
