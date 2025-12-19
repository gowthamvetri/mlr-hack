import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingOverlay from './components/LoadingOverlay';
import GlobalToast from './components/GlobalToast';

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      <p className="text-gray-600 text-sm font-medium">Loading...</p>
    </div>
  </div>
);

// Lazy load all pages for optimal code splitting
// Auth & Public Pages
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const DepartmentPage = lazy(() => import('./pages/DepartmentPage'));
const PlacementsPage = lazy(() => import('./pages/PlacementsPage'));

// Dashboard Pages
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const SeatingManagerDashboard = lazy(() => import('./pages/SeatingManagerDashboard'));
const ClubCoordinatorDashboard = lazy(() => import('./pages/ClubCoordinatorDashboard'));

// Student Pages
const StudentExams = lazy(() => import('./pages/student/StudentExams'));
const StudentStudy = lazy(() => import('./pages/student/StudentStudy'));
const StudentCalendar = lazy(() => import('./pages/student/StudentCalendar'));
const StudentCourses = lazy(() => import('./pages/student/StudentCourses'));
const StudentCareer = lazy(() => import('./pages/student/StudentCareer'));
const StudentProfile = lazy(() => import('./pages/student/StudentProfile'));
const StudentCalculators = lazy(() => import('./pages/student/StudentCalculators'));
const StudentAITwin = lazy(() => import('./pages/student/StudentAITwin'));
const StudentHallTickets = lazy(() => import('./pages/student/StudentHallTickets'));

// Admin Pages
const AdminEvents = lazy(() => import('./pages/admin/AdminEvents'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminStudents = lazy(() => import('./pages/admin/AdminStudents'));
const AdminStaff = lazy(() => import('./pages/admin/AdminStaff'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminCourses = lazy(() => import('./pages/admin/AdminCourses'));
const AdminPlacements = lazy(() => import('./pages/admin/AdminPlacements'));
const AdminRegistrationRequests = lazy(() => import('./pages/admin/AdminRegistrationRequests'));
const AdminProfile = lazy(() => import('./pages/admin/AdminProfile'));
const AdminPlacementPage = lazy(() => import('./pages/admin/AdminPlacementPage'));
const AdminExternalCourses = lazy(() => import('./pages/admin/AdminExternalCourses'));
const AdminExamScheduling = lazy(() => import('./pages/admin/AdminExamScheduling'));
const AdminInvigilators = lazy(() => import('./pages/admin/AdminInvigilators'));
const AdminSubjects = lazy(() => import('./pages/admin/AdminSubjects'));
const AdminChatbotContent = lazy(() => import('./pages/admin/AdminChatbotContent'));

// Seating Manager Pages
const SeatingAllocate = lazy(() => import('./pages/seating/SeatingAllocate'));
const SeatingRooms = lazy(() => import('./pages/seating/SeatingRooms'));
const SeatingProfile = lazy(() => import('./pages/seating/SeatingProfile'));

// Club Coordinator Pages
const CoordinatorEvents = lazy(() => import('./pages/coordinator/CoordinatorEvents'));
const CoordinatorProfile = lazy(() => import('./pages/coordinator/CoordinatorProfile'));

// Staff Pages
const StaffDashboard = lazy(() => import('./pages/staff/StaffDashboard'));
const StaffAttendance = lazy(() => import('./pages/staff/StaffAttendance'));
const StaffFees = lazy(() => import('./pages/staff/StaffFees'));
const StaffCareerApprovals = lazy(() => import('./pages/staff/StaffCareerApprovals'));
const StaffEligibility = lazy(() => import('./pages/staff/StaffEligibility'));
const StaffProfile = lazy(() => import('./pages/staff/StaffProfile'));
const StaffCourses = lazy(() => import('./pages/staff/StaffCourses'));
const StaffExternalCourses = lazy(() => import('./pages/staff/StaffExternalCourses'));
const StaffInvigilation = lazy(() => import('./pages/staff/StaffInvigilation'));
const StaffRegistrationRequests = lazy(() => import('./pages/staff/StaffRegistrationRequests'));

function App() {
  return (
    <AuthProvider>
      {/* Global UI Components */}
      <LoadingOverlay />
      <GlobalToast />

      <Router>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Onboarding />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Public Pages */}
            <Route path="/departments/:slug" element={<DepartmentPage />} />
            <Route path="/placements" element={<PlacementsPage />} />

            {/* Student Routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={['Student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/exams"
              element={
                <ProtectedRoute allowedRoles={['Student']}>
                  <StudentExams />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/study"
              element={
                <ProtectedRoute allowedRoles={['Student']}>
                  <StudentStudy />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/calendar"
              element={
                <ProtectedRoute allowedRoles={['Student']}>
                  <StudentCalendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/courses"
              element={
                <ProtectedRoute allowedRoles={['Student']}>
                  <StudentCourses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/career"
              element={
                <ProtectedRoute allowedRoles={['Student']}>
                  <StudentCareer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/profile"
              element={
                <ProtectedRoute allowedRoles={['Student']}>
                  <StudentProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/calculators"
              element={
                <ProtectedRoute allowedRoles={['Student']}>
                  <StudentCalculators />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/ai-twin"
              element={
                <ProtectedRoute allowedRoles={['Student']}>
                  <StudentAITwin />
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/hall-tickets"
              element={
                <ProtectedRoute allowedRoles={['Student']}>
                  <StudentHallTickets />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminStudents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/staff"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminStaff />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/courses"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminCourses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/subjects"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminSubjects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/placements"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminPlacements />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/placement-page"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminPlacementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/external-courses"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminExternalCourses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/events"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminEvents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/chatbot-content"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminChatbotContent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/registration-requests"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminRegistrationRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/profile"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/exam-scheduling"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminExamScheduling />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/invigilators"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminInvigilators />
                </ProtectedRoute>
              }
            />

            {/* Seating Manager Routes */}
            <Route
              path="/seating-manager"
              element={
                <ProtectedRoute allowedRoles={['SeatingManager']}>
                  <SeatingManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seating-manager/allocate"
              element={
                <ProtectedRoute allowedRoles={['SeatingManager']}>
                  <SeatingAllocate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seating-manager/rooms"
              element={
                <ProtectedRoute allowedRoles={['SeatingManager']}>
                  <SeatingRooms />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seating-manager/profile"
              element={
                <ProtectedRoute allowedRoles={['SeatingManager']}>
                  <SeatingProfile />
                </ProtectedRoute>
              }
            />

            {/* Club Coordinator Routes */}
            <Route
              path="/club-coordinator"
              element={
                <ProtectedRoute allowedRoles={['ClubCoordinator']}>
                  <ClubCoordinatorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/club-coordinator/events"
              element={
                <ProtectedRoute allowedRoles={['ClubCoordinator']}>
                  <CoordinatorEvents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/club-coordinator/profile"
              element={
                <ProtectedRoute allowedRoles={['ClubCoordinator']}>
                  <CoordinatorProfile />
                </ProtectedRoute>
              }
            />

            {/* Staff Routes */}
            <Route
              path="/staff"
              element={
                <ProtectedRoute allowedRoles={['Staff']}>
                  <StaffDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/registration-requests"
              element={
                <ProtectedRoute allowedRoles={['Staff']}>
                  <StaffRegistrationRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/courses"
              element={
                <ProtectedRoute allowedRoles={['Staff', 'Faculty']}>
                  <StaffCourses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/external-courses"
              element={
                <ProtectedRoute allowedRoles={['Staff', 'Faculty']}>
                  <StaffExternalCourses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/attendance"
              element={
                <ProtectedRoute allowedRoles={['Staff']}>
                  <StaffAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/fees"
              element={
                <ProtectedRoute allowedRoles={['Staff']}>
                  <StaffFees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/career-approvals"
              element={
                <ProtectedRoute allowedRoles={['Staff']}>
                  <StaffCareerApprovals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/eligibility"
              element={
                <ProtectedRoute allowedRoles={['Staff']}>
                  <StaffEligibility />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/invigilation"
              element={
                <ProtectedRoute allowedRoles={['Staff', 'Faculty']}>
                  <StaffInvigilation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/profile"
              element={
                <ProtectedRoute allowedRoles={['Staff']}>
                  <StaffProfile />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
