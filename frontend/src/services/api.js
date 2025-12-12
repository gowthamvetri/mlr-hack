import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logout } from '../store/slices/authSlice';
import { showErrorToast } from '../store/slices/uiSlice';

// Base URL from environment
const baseUrl = import.meta.env.VITE_API || '/api';

// Custom base query with auth header and error handling
const baseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers) => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const { token } = JSON.parse(userInfo);
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
      } catch {
        // Invalid JSON in storage
      }
    }
    return headers;
  },
});

// Wrapper to handle 401 errors globally
const baseQueryWithReauth = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);

  if (result.error) {
    const { status, data } = result.error;

    // Handle 401 Unauthorized - logout user
    if (status === 401) {
      api.dispatch(logout());
      api.dispatch(showErrorToast('Session expired. Please login again.'));
      // Redirect will be handled by ProtectedRoute
    }

    // Parse error message
    const errorMessage = data?.message || data?.error || getErrorMessage(status);
    result.error.message = errorMessage;
  }

  return result;
};

// Error message helper
const getErrorMessage = (status) => {
  const messages = {
    400: 'Bad request. Please check your input.',
    401: 'Unauthorized. Please login again.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'Conflict. This resource already exists.',
    422: 'Validation error. Please check your input.',
    500: 'Server error. Please try again later.',
  };
  return messages[status] || 'An unexpected error occurred.';
};

// RTK Query API
export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User', 'Users', 'Profile',
    'Exam', 'Exams', 'HallTicket',
    'Event', 'Events',
    'Course', 'Courses', 'CourseMaterial',
    'Department', 'Departments',
    'Placement', 'Placements',
    'Faculty',
    'Room', 'Rooms',
    'Notification', 'Notifications',
    'Calendar',
    'Subject', 'Subjects',
    'Club', 'ClubStats',
    'CareerApproval', 'CareerApprovals',
    'StudentProgress', 'Skills', 'Streak',
    'Staff', 'Attendance', 'Fees',
    'Analytics',
    'PlacementPage',
  ],
  endpoints: (builder) => ({
    // ============= AUTH =============
    login: builder.mutation({
      query: (credentials) => ({
        url: 'users/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: 'users/register',
        method: 'POST',
        body: userData,
      }),
    }),

    // ============= USER PROFILE =============
    getProfile: builder.query({
      query: () => 'users/profile',
      providesTags: ['Profile'],
    }),
    updateProfile: builder.mutation({
      query: (data) => ({
        url: 'users/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Profile'],
    }),

    // ============= USERS (Admin) =============
    getUsers: builder.query({
      query: (params) => ({
        url: 'users',
        params,
      }),
      providesTags: (result) =>
        result
          ? [...result.map(({ _id }) => ({ type: 'User', id: _id })), 'Users']
          : ['Users'],
    }),
    getUserById: builder.query({
      query: (id) => `users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Users'],
    }),
    createUser: builder.mutation({
      query: (userData) => ({
        url: 'users',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['Users'],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id }, 'Users'],
    }),

    // ============= EXAMS =============
    getExams: builder.query({
      query: () => 'exams',
      providesTags: ['Exams'],
    }),
    getStudentExams: builder.query({
      query: () => 'exams/student',
      providesTags: ['Exams'],
    }),
    createExam: builder.mutation({
      query: (examData) => ({
        url: 'exams',
        method: 'POST',
        body: examData,
      }),
      invalidatesTags: ['Exams'],
    }),
    createExamSchedule: builder.mutation({
      query: (scheduleData) => ({
        url: 'exams/schedule',
        method: 'POST',
        body: scheduleData,
      }),
      invalidatesTags: ['Exams'],
    }),
    getHallTicket: builder.query({
      query: (examId) => `exams/${examId}/hall-ticket`,
      providesTags: (result, error, examId) => [{ type: 'HallTicket', id: examId }],
    }),
    getSemesterHallTicket: builder.query({
      query: (params) => ({
        url: 'exams/semester-hall-ticket',
        params,
      }),
      providesTags: ['HallTicket'],
    }),
    generateHallTicket: builder.mutation({
      query: (id) => ({
        url: `exams/${id}/generate-hall-ticket`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'HallTicket', id }, 'Exams'],
    }),
    generateBatchHallTickets: builder.mutation({
      query: (data) => ({
        url: 'exams/generate-hall-tickets-batch',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Exams', 'HallTicket'],
    }),
    checkStudentEligibility: builder.query({
      query: (studentId) => `exams/check-eligibility/${studentId}`,
    }),

    // ============= EVENTS =============
    getEvents: builder.query({
      query: (status) => `events${status ? `?status=${status}` : ''}`,
      providesTags: ['Events'],
    }),
    createEvent: builder.mutation({
      query: (eventData) => ({
        url: 'events',
        method: 'POST',
        body: eventData,
      }),
      invalidatesTags: ['Events'],
    }),
    updateEventStatus: builder.mutation({
      query: ({ id, ...statusData }) => ({
        url: `events/${id}/status`,
        method: 'PUT',
        body: statusData,
      }),
      invalidatesTags: ['Events'],
    }),

    // ============= COURSES =============
    getCourses: builder.query({
      query: (params) => ({
        url: 'courses',
        params,
      }),
      providesTags: (result) =>
        result
          ? [...result.map(({ _id }) => ({ type: 'Course', id: _id })), 'Courses']
          : ['Courses'],
    }),
    getCourseById: builder.query({
      query: (id) => `courses/${id}`,
      providesTags: (result, error, id) => [{ type: 'Course', id }],
    }),
    createCourse: builder.mutation({
      query: (data) => ({
        url: 'courses',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Courses'],
    }),
    updateCourse: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `courses/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Course', id }, 'Courses'],
    }),
    deleteCourse: builder.mutation({
      query: (id) => ({
        url: `courses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Courses'],
    }),
    enrollInCourse: builder.mutation({
      query: (id) => ({
        url: `courses/${id}/enroll`,
        method: 'POST',
      }),
      invalidatesTags: ['Courses'],
    }),
    getCourseStats: builder.query({
      query: () => 'courses/stats',
      providesTags: ['Courses'],
    }),
    getCourseMaterials: builder.query({
      query: (id) => `courses/${id}/materials`,
      providesTags: (result, error, id) => [{ type: 'CourseMaterial', id }],
    }),
    getMyEnrolledCourses: builder.query({
      query: () => 'courses/my-enrolled',
      providesTags: ['Courses'],
    }),
    getMyTaughtCourses: builder.query({
      query: () => 'courses/my-taught',
      providesTags: ['Courses'],
    }),
    deleteCourseMaterial: builder.mutation({
      query: ({ courseId, materialId }) => ({
        url: `courses/${courseId}/materials/${materialId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { courseId }) => [{ type: 'CourseMaterial', id: courseId }],
    }),

    // ============= DEPARTMENTS =============
    getDepartments: builder.query({
      query: () => 'departments',
      providesTags: ['Departments'],
    }),
    getDepartmentById: builder.query({
      query: (id) => `departments/${id}`,
      providesTags: (result, error, id) => [{ type: 'Department', id }],
    }),
    createDepartment: builder.mutation({
      query: (data) => ({
        url: 'departments',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Departments'],
    }),
    updateDepartment: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `departments/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Department', id }, 'Departments'],
    }),
    deleteDepartment: builder.mutation({
      query: (id) => ({
        url: `departments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Departments'],
    }),
    getDepartmentStats: builder.query({
      query: () => 'departments/stats',
      providesTags: ['Departments'],
    }),

    // ============= PLACEMENTS =============
    getPlacements: builder.query({
      query: (params) => ({
        url: 'placements',
        params,
      }),
      providesTags: ['Placements'],
    }),
    getPlacementById: builder.query({
      query: (id) => `placements/${id}`,
      providesTags: (result, error, id) => [{ type: 'Placement', id }],
    }),
    createPlacement: builder.mutation({
      query: (data) => ({
        url: 'placements',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Placements'],
      // Optimistic update example
      async onQueryStarted(data, { dispatch, queryFulfilled }) {
        // Optimistically add to cache
        const patchResult = dispatch(
          api.util.updateQueryData('getPlacements', undefined, (draft) => {
            draft.unshift({ ...data, _id: 'temp-' + Date.now(), isOptimistic: true });
          })
        );
        try {
          await queryFulfilled;
        } catch {
          // Rollback on error
          patchResult.undo();
        }
      },
    }),
    updatePlacement: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `placements/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Placement', id }, 'Placements'],
      // Optimistic update
      async onQueryStarted({ id, ...data }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          api.util.updateQueryData('getPlacements', undefined, (draft) => {
            const index = draft.findIndex((p) => p._id === id);
            if (index !== -1) {
              draft[index] = { ...draft[index], ...data };
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    deletePlacement: builder.mutation({
      query: (id) => ({
        url: `placements/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Placements'],
      // Optimistic delete
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          api.util.updateQueryData('getPlacements', undefined, (draft) => {
            const index = draft.findIndex((p) => p._id === id);
            if (index !== -1) {
              draft.splice(index, 1);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    applyForPlacement: builder.mutation({
      query: (id) => ({
        url: `placements/${id}/apply`,
        method: 'POST',
      }),
      invalidatesTags: ['Placements'],
    }),
    getPlacementStats: builder.query({
      query: () => 'placements/stats',
      providesTags: ['Placements'],
    }),

    // ============= FACULTY =============
    getFaculty: builder.query({
      query: (params) => ({
        url: 'faculty',
        params,
      }),
      providesTags: ['Faculty'],
    }),
    getFacultyById: builder.query({
      query: (id) => `faculty/${id}`,
      providesTags: (result, error, id) => [{ type: 'Faculty', id }],
    }),
    createFaculty: builder.mutation({
      query: (data) => ({
        url: 'faculty',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Faculty'],
    }),
    updateFaculty: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `faculty/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Faculty'],
    }),
    deleteFaculty: builder.mutation({
      query: (id) => ({
        url: `faculty/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Faculty'],
    }),
    getFacultyStats: builder.query({
      query: () => 'faculty/stats',
      providesTags: ['Faculty'],
    }),

    // ============= ROOMS (Seating) =============
    getRooms: builder.query({
      query: () => 'rooms',
      providesTags: ['Rooms'],
    }),
    addRoom: builder.mutation({
      query: (data) => ({
        url: 'rooms',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Rooms'],
    }),
    updateRoom: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `rooms/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Rooms'],
    }),
    deleteRoom: builder.mutation({
      query: (id) => ({
        url: `rooms/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Rooms'],
    }),
    allocateSeating: builder.mutation({
      query: (data) => ({
        url: 'seating/allocate',
        method: 'POST',
        body: data,
      }),
    }),
    getMySeat: builder.query({
      query: () => 'seating/my-seat',
    }),

    // ============= NOTIFICATIONS =============
    getNotifications: builder.query({
      query: () => 'notifications',
      providesTags: ['Notifications'],
    }),
    markNotificationRead: builder.mutation({
      query: (id) => ({
        url: `notifications/${id}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notifications'],
      // Optimistic update
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          api.util.updateQueryData('getNotifications', undefined, (draft) => {
            const notification = draft.find((n) => n._id === id);
            if (notification) {
              notification.read = true;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    markAllNotificationsRead: builder.mutation({
      query: () => ({
        url: 'notifications/mark-all-read',
        method: 'PUT',
      }),
      invalidatesTags: ['Notifications'],
    }),
    deleteNotification: builder.mutation({
      query: (id) => ({
        url: `notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notifications'],
    }),

    // ============= CALENDAR =============
    getCalendarEvents: builder.query({
      query: () => 'calendar',
      providesTags: ['Calendar'],
    }),
    createCalendarEvent: builder.mutation({
      query: (data) => ({
        url: 'calendar',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Calendar'],
    }),
    deleteCalendarEvent: builder.mutation({
      query: (id) => ({
        url: `calendar/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Calendar'],
    }),

    // ============= SUBJECTS =============
    getSubjects: builder.query({
      query: () => 'subjects',
      providesTags: ['Subjects'],
    }),
    createSubject: builder.mutation({
      query: (data) => ({
        url: 'subjects',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Subjects'],
    }),

    // ============= CLUBS =============
    getClubProfile: builder.query({
      query: () => 'clubs/profile',
      providesTags: ['Club'],
    }),
    updateClubProfile: builder.mutation({
      query: (data) => ({
        url: 'clubs/profile',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Club'],
    }),
    getClubStats: builder.query({
      query: () => 'clubs/stats',
      providesTags: ['ClubStats'],
    }),

    // ============= CAREER APPROVALS =============
    submitCareerApproval: builder.mutation({
      query: (data) => ({
        url: 'career-approvals/submit',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['CareerApprovals'],
    }),
    getMyApprovalRequests: builder.query({
      query: () => 'career-approvals/my-requests',
      providesTags: ['CareerApprovals'],
    }),
    getMyApprovalStatus: builder.query({
      query: () => 'career-approvals/my-status',
      providesTags: ['CareerApprovals'],
    }),
    getPendingApprovals: builder.query({
      query: () => 'career-approvals/pending',
      providesTags: ['CareerApprovals'],
    }),
    getAllApprovals: builder.query({
      query: (filters) => ({
        url: 'career-approvals/all',
        params: filters,
      }),
      providesTags: ['CareerApprovals'],
    }),
    getApprovalStats: builder.query({
      query: () => 'career-approvals/stats',
      providesTags: ['CareerApprovals'],
    }),
    approveCareerRequest: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `career-approvals/approve/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['CareerApprovals'],
    }),
    rejectCareerRequest: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `career-approvals/reject/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['CareerApprovals'],
    }),

    // ============= STUDENT PROGRESS =============
    getStreak: builder.query({
      query: () => 'student-progress/streak',
      providesTags: ['Streak'],
    }),
    updateStreak: builder.mutation({
      query: () => ({
        url: 'student-progress/streak',
        method: 'POST',
      }),
      invalidatesTags: ['Streak'],
    }),
    getSkills: builder.query({
      query: () => 'student-progress/skills',
      providesTags: ['Skills'],
    }),
    updateSkill: builder.mutation({
      query: (data) => ({
        url: 'student-progress/skills',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Skills'],
    }),
    getCareerProgress: builder.query({
      query: () => 'student-progress/career',
      providesTags: ['StudentProgress'],
    }),
    updateCareerProgress: builder.mutation({
      query: (data) => ({
        url: 'student-progress/career',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['StudentProgress'],
    }),
    getStudentDashboardStats: builder.query({
      query: () => 'student-progress/dashboard-stats',
      providesTags: ['StudentProgress'],
    }),

    // ============= STAFF =============
    getStudentsForStaff: builder.query({
      query: (params) => ({
        url: 'staff/students',
        params,
      }),
      providesTags: ['Staff'],
    }),
    getStudentByIdForStaff: builder.query({
      query: (id) => `staff/students/${id}`,
      providesTags: (result, error, id) => [{ type: 'Staff', id }],
    }),
    updateStudentAttendance: builder.mutation({
      query: ({ id, attendance }) => ({
        url: `staff/students/${id}/attendance`,
        method: 'PUT',
        body: { attendance },
      }),
      invalidatesTags: ['Staff', 'Attendance'],
    }),
    bulkUpdateAttendance: builder.mutation({
      query: (updates) => ({
        url: 'staff/students/bulk-attendance',
        method: 'PUT',
        body: { updates },
      }),
      invalidatesTags: ['Staff', 'Attendance'],
    }),
    updateStudentFeeStatus: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `staff/students/${id}/fees`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Staff', 'Fees'],
    }),
    getAttendanceSummary: builder.query({
      query: (params) => ({
        url: 'staff/attendance-summary',
        params,
      }),
      providesTags: ['Attendance'],
    }),
    getFeeSummary: builder.query({
      query: (params) => ({
        url: 'staff/fee-summary',
        params,
      }),
      providesTags: ['Fees'],
    }),
    getIneligibleStudents: builder.query({
      query: (params) => ({
        url: 'staff/ineligible-students',
        params,
      }),
      providesTags: ['Staff'],
    }),

    // ============= ANALYTICS =============
    getAdminStats: builder.query({
      query: () => 'analytics/admin',
      providesTags: ['Analytics'],
    }),
    getRecentActivities: builder.query({
      query: (limit) => `activities?limit=${limit || 10}`,
    }),
    createActivity: builder.mutation({
      query: (data) => ({
        url: 'activities',
        method: 'POST',
        body: data,
      }),
    }),

    // ============= STUDY PROGRESS =============
    getStudyProgress: builder.query({
      query: (subjectId) => `study-progress/${subjectId}`,
    }),
    toggleTopicProgress: builder.mutation({
      query: (data) => ({
        url: 'study-progress/toggle',
        method: 'POST',
        body: data,
      }),
    }),

    // ============= PLACEMENT PAGE (Admin) =============
    getAdminPlacementSlides: builder.query({
      query: () => 'placement-page/admin/slides',
      providesTags: ['PlacementPage'],
    }),
    createPlacementSlide: builder.mutation({
      query: (data) => ({
        url: 'placement-page/admin/slides',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PlacementPage'],
    }),
    updatePlacementSlide: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `placement-page/admin/slides/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['PlacementPage'],
    }),
    deletePlacementSlide: builder.mutation({
      query: (id) => ({
        url: `placement-page/admin/slides/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PlacementPage'],
    }),
    getAdminRecruiters: builder.query({
      query: () => 'placement-page/admin/recruiters',
      providesTags: ['PlacementPage'],
    }),
    createRecruiter: builder.mutation({
      query: (data) => ({
        url: 'placement-page/admin/recruiters',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PlacementPage'],
    }),
    updateRecruiter: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `placement-page/admin/recruiters/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['PlacementPage'],
    }),
    deleteRecruiter: builder.mutation({
      query: (id) => ({
        url: `placement-page/admin/recruiters/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PlacementPage'],
    }),
    getAdminTrainingContent: builder.query({
      query: () => 'placement-page/admin/training',
      providesTags: ['PlacementPage'],
    }),
    createTrainingContent: builder.mutation({
      query: (data) => ({
        url: 'placement-page/admin/training',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PlacementPage'],
    }),
    updateTrainingContent: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `placement-page/admin/training/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['PlacementPage'],
    }),
    deleteTrainingContent: builder.mutation({
      query: (id) => ({
        url: `placement-page/admin/training/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PlacementPage'],
    }),
  }),
});

// Export hooks for usage in components
export const {
  // Auth
  useLoginMutation,
  useRegisterMutation,

  // Profile
  useGetProfileQuery,
  useUpdateProfileMutation,

  // Users
  useGetUsersQuery,
  useGetUserByIdQuery,
  useDeleteUserMutation,
  useCreateUserMutation,
  useUpdateUserMutation,

  // Exams
  useGetExamsQuery,
  useGetStudentExamsQuery,
  useCreateExamMutation,
  useCreateExamScheduleMutation,
  useGetHallTicketQuery,
  useGetSemesterHallTicketQuery,
  useGenerateHallTicketMutation,
  useGenerateBatchHallTicketsMutation,
  useCheckStudentEligibilityQuery,

  // Events
  useGetEventsQuery,
  useCreateEventMutation,
  useUpdateEventStatusMutation,

  // Courses
  useGetCoursesQuery,
  useGetCourseByIdQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  useEnrollInCourseMutation,
  useGetCourseStatsQuery,
  useGetCourseMaterialsQuery,
  useGetMyEnrolledCoursesQuery,
  useGetMyTaughtCoursesQuery,
  useDeleteCourseMaterialMutation,

  // Departments
  useGetDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useGetDepartmentStatsQuery,

  // Placements
  useGetPlacementsQuery,
  useGetPlacementByIdQuery,
  useCreatePlacementMutation,
  useUpdatePlacementMutation,
  useDeletePlacementMutation,
  useApplyForPlacementMutation,
  useGetPlacementStatsQuery,

  // Faculty
  useGetFacultyQuery,
  useGetFacultyByIdQuery,
  useCreateFacultyMutation,
  useUpdateFacultyMutation,
  useDeleteFacultyMutation,
  useGetFacultyStatsQuery,

  // Rooms
  useGetRoomsQuery,
  useAddRoomMutation,
  useUpdateRoomMutation,
  useDeleteRoomMutation,
  useAllocateSeatingMutation,
  useGetMySeatQuery,

  // Notifications
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,

  // Calendar
  useGetCalendarEventsQuery,
  useCreateCalendarEventMutation,
  useDeleteCalendarEventMutation,

  // Subjects
  useGetSubjectsQuery,
  useCreateSubjectMutation,

  // Clubs
  useGetClubProfileQuery,
  useUpdateClubProfileMutation,
  useGetClubStatsQuery,

  // Career Approvals
  useSubmitCareerApprovalMutation,
  useGetMyApprovalRequestsQuery,
  useGetMyApprovalStatusQuery,
  useGetPendingApprovalsQuery,
  useGetAllApprovalsQuery,
  useGetApprovalStatsQuery,
  useApproveCareerRequestMutation,
  useRejectCareerRequestMutation,

  // Student Progress
  useGetStreakQuery,
  useUpdateStreakMutation,
  useGetSkillsQuery,
  useUpdateSkillMutation,
  useGetCareerProgressQuery,
  useUpdateCareerProgressMutation,
  useGetStudentDashboardStatsQuery,

  // Staff
  useGetStudentsForStaffQuery,
  useGetStudentByIdForStaffQuery,
  useUpdateStudentAttendanceMutation,
  useBulkUpdateAttendanceMutation,
  useUpdateStudentFeeStatusMutation,
  useGetAttendanceSummaryQuery,
  useGetFeeSummaryQuery,
  useGetIneligibleStudentsQuery,

  // Analytics
  useGetAdminStatsQuery,
  useGetRecentActivitiesQuery,
  useCreateActivityMutation,

  // Study Progress
  useGetStudyProgressQuery,
  useToggleTopicProgressMutation,

  // Placement Page
  useGetAdminPlacementSlidesQuery,
  useCreatePlacementSlideMutation,
  useUpdatePlacementSlideMutation,
  useDeletePlacementSlideMutation,
  useGetAdminRecruitersQuery,
  useCreateRecruiterMutation,
  useUpdateRecruiterMutation,
  useDeleteRecruiterMutation,
  useGetAdminTrainingContentQuery,
  useCreateTrainingContentMutation,
  useUpdateTrainingContentMutation,
  useDeleteTrainingContentMutation,
} = api;
