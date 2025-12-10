import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

API.interceptors.request.use((req) => {
  if (localStorage.getItem('userInfo')) {
    const token = JSON.parse(localStorage.getItem('userInfo')).token;
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const createExam = (examData) => API.post('/exams', examData);
export const createExamSchedule = (scheduleData) => API.post('/exams/schedule', scheduleData);
export const getExams = () => API.get('/exams');
export const getStudentExams = () => API.get('/exams/student');
export const getHallTicket = (examId) => API.get(`/exams/${examId}/hall-ticket`);
export const generateHallTicket = (id) => API.put(`/exams/${id}/generate-hall-ticket`);
export const generateBatchHallTickets = (data) => API.put('/exams/generate-hall-tickets-batch', data);

export const createEvent = (eventData) => API.post('/events', eventData);
export const getEvents = (status) => API.get(`/events?status=${status || ''}`);
export const updateEventStatus = (id, statusData) => API.put(`/events/${id}/status`, statusData);

export const allocateSeating = (data) => API.post('/seating/allocate', data);
export const getMySeat = () => API.get('/seating/my-seat');

export const getSubjects = () => API.get('/subjects');
export const createSubject = (data) => API.post('/subjects', data);

export const getNotifications = () => API.get('/notifications');
export const markNotificationRead = (id) => API.put(`/notifications/${id}/read`);

export const getCalendarEvents = () => API.get('/calendar');
export const createCalendarEvent = (data) => API.post('/calendar', data);
export const deleteCalendarEvent = (id) => API.delete(`/calendar/${id}`);

export const getStudyProgress = (subjectId) => API.get(`/study-progress/${subjectId}`);
export const toggleTopicProgress = (data) => API.post('/study-progress/toggle', data);

export const getRooms = () => API.get('/rooms');
export const addRoom = (data) => API.post('/rooms', data);
export const updateRoom = (id, data) => API.put(`/rooms/${id}`, data);
export const deleteRoom = (id) => API.delete(`/rooms/${id}`);

export const getClubProfile = () => API.get('/clubs/profile');
export const updateClubProfile = (data) => API.post('/clubs/profile', data);
export const getClubStats = () => API.get('/clubs/stats');

export const getAdminStats = () => API.get('/analytics/admin');

// User management
export const getUsers = (params) => API.get('/users', { params });
export const getUserById = (id) => API.get(`/users/${id}`);
export const deleteUser = (id) => API.delete(`/users/${id}`);
export const updateUser = (id, data) => API.put(`/users/${id}`, data);

// Department management
export const getDepartments = () => API.get('/departments');
export const getDepartmentById = (id) => API.get(`/departments/${id}`);
export const createDepartment = (data) => API.post('/departments', data);
export const updateDepartment = (id, data) => API.put(`/departments/${id}`, data);
export const deleteDepartment = (id) => API.delete(`/departments/${id}`);
export const getDepartmentStats = () => API.get('/departments/stats');

// Course management
export const getCourses = (params) => API.get('/courses', { params });
export const getCourseById = (id) => API.get(`/courses/${id}`);
export const createCourse = (data) => API.post('/courses', data);
export const updateCourse = (id, data) => API.put(`/courses/${id}`, data);
export const deleteCourse = (id) => API.delete(`/courses/${id}`);
export const enrollInCourse = (id) => API.post(`/courses/${id}/enroll`);
export const getCourseStats = () => API.get('/courses/stats');
export const getCourseMaterials = (id) => API.get(`/courses/${id}/materials`);
export const uploadCourseMaterial = (id, formData) => API.post(`/courses/${id}/materials`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const deleteCourseMaterial = (courseId, materialId) => API.delete(`/courses/${courseId}/materials/${materialId}`);

// Faculty management
export const getFaculty = (params) => API.get('/faculty', { params });
export const getFacultyById = (id) => API.get(`/faculty/${id}`);
export const createFaculty = (data) => API.post('/faculty', data);
export const updateFaculty = (id, data) => API.put(`/faculty/${id}`, data);
export const deleteFaculty = (id) => API.delete(`/faculty/${id}`);
export const getFacultyStats = () => API.get('/faculty/stats');

// Placement management
export const getPlacements = (params) => API.get('/placements', { params });
export const getPlacementById = (id) => API.get(`/placements/${id}`);
export const createPlacement = (data) => API.post('/placements', data);
export const updatePlacement = (id, data) => API.put(`/placements/${id}`, data);
export const deletePlacement = (id) => API.delete(`/placements/${id}`);
export const applyForPlacement = (id) => API.post(`/placements/${id}/apply`);
export const getPlacementStats = () => API.get('/placements/stats');

// Student progress (streaks, skills, career)
export const getStreak = () => API.get('/student-progress/streak');
export const updateStreak = () => API.post('/student-progress/streak');
export const getSkills = () => API.get('/student-progress/skills');
export const updateSkill = (data) => API.put('/student-progress/skills', data);
export const getCareerProgress = () => API.get('/student-progress/career');
export const updateCareerProgress = (data) => API.put('/student-progress/career', data);
export const getStudentDashboardStats = () => API.get('/student-progress/dashboard-stats');

// Activity log
export const getRecentActivities = (limit) => API.get(`/activities?limit=${limit || 10}`);
export const createActivity = (data) => API.post('/activities', data);

// Career Approval Requests
export const submitCareerApproval = (data) => API.post('/career-approvals/submit', data);
export const getMyApprovalRequests = () => API.get('/career-approvals/my-requests');
export const getMyApprovalStatus = () => API.get('/career-approvals/my-status');
export const getPendingApprovals = () => API.get('/career-approvals/pending');
export const getAllApprovals = (filters) => API.get('/career-approvals/all', { params: filters });
export const getApprovalStats = () => API.get('/career-approvals/stats');
export const approveCareerRequest = (id, data) => API.put(`/career-approvals/approve/${id}`, data);
export const rejectCareerRequest = (id, data) => API.put(`/career-approvals/reject/${id}`, data);

// User Profile
export const getProfile = () => API.get('/users/profile');
export const updateProfile = (data) => API.put('/users/profile', data);

export default API;
