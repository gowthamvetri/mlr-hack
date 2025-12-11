import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SeatingManagerDashboard from './pages/SeatingManagerDashboard';
import ClubCoordinatorDashboard from './pages/ClubCoordinatorDashboard';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import DepartmentPage from './pages/DepartmentPage';
import PlacementsPage from './pages/PlacementsPage';

// Student Pages
import StudentExams from './pages/student/StudentExams';
import StudentStudy from './pages/student/StudentStudy';
import StudentCalendar from './pages/student/StudentCalendar';
import StudentCourses from './pages/student/StudentCourses';
import StudentCareer from './pages/student/StudentCareer';
import StudentProfile from './pages/student/StudentProfile';

// Admin Pages
import AdminExams from './pages/admin/AdminExams';
import AdminEvents from './pages/admin/AdminEvents';
import AdminUsers from './pages/admin/AdminUsers';
import AdminStudents from './pages/admin/AdminStudents';
import AdminFaculty from './pages/admin/AdminFaculty';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminCourses from './pages/admin/AdminCourses';
import AdminPlacements from './pages/admin/AdminPlacements';
import AdminCareerApprovals from './pages/admin/AdminCareerApprovals';
import AdminRegistrationRequests from './pages/admin/AdminRegistrationRequests';
import AdminProfile from './pages/admin/AdminProfile';
import AdminPlacementPage from './pages/admin/AdminPlacementPage';

// Seating Manager Pages
import SeatingAllocate from './pages/seating/SeatingAllocate';
import SeatingRooms from './pages/seating/SeatingRooms';
import SeatingProfile from './pages/seating/SeatingProfile';

// Club Coordinator Pages
import CoordinatorEvents from './pages/coordinator/CoordinatorEvents';
import CoordinatorProfile from './pages/coordinator/CoordinatorProfile';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffAttendance from './pages/staff/StaffAttendance';
import StaffFees from './pages/staff/StaffFees';
import StaffCareerApprovals from './pages/staff/StaffCareerApprovals';
import StaffEligibility from './pages/staff/StaffEligibility';

function App() {
  return (
    <AuthProvider>
      <Router>
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
            path="/admin/faculty" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminFaculty />
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
            path="/admin/exams" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminExams />
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
            path="/admin/users" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminUsers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/career-approvals" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminCareerApprovals />
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
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
