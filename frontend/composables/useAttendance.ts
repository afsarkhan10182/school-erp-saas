import { ref, reactive, readonly } from 'vue';
import { Attendance } from '~/api/students/attendance';
import { Students } from '~/api/students';
import { useToast } from '~/composables/useToast';
import { useAuthStore } from '~/stores/auth';

interface AttendanceSession {
  id: string;
  date: string;
  attendance_type: 'daily';
  status: 'draft' | 'published';
  class_id: string;
  section_id?: string;
  school_id?: string;
  branch_id?: string;
  academic_year?: string;
  remarks?: string;
}

interface AttendanceRecord {
  student_id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
  arrival_time?: string;
}

interface AttendanceFilters {
  date_from?: string;
  date_to?: string;
  class_id?: string;
  section_id?: string;
  status?: 'draft' | 'published';
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
}

/**
 * Composable for managing attendance operations
 * Centralizes all attendance-related business logic
 * Follows common reusable patterns for data fetching and state management
 */
export const useAttendance = () => {
  const { showToast } = useToast();
  const auth = useAuthStore();

  // State management - centralized and reactive
  const sessions = ref<AttendanceSession[]>([]);
  const currentSession = ref<AttendanceSession | null>(null);
  const students = ref<any[]>([]);
  const attendanceRecords = ref<Record<string, AttendanceRecord>>({});
  const loading = ref(false);
  const saving = ref(false);
  const error = ref<string | null>(null);

  const pagination = reactive<PaginationData>({
    page: 1,
    limit: 10,
    total: 0
  });

  /**
   * Load attendance sessions with filters
   * Uses consistent error handling and loading patterns
   */
  const loadSessions = async (filters: AttendanceFilters = {}) => {
    try {
      loading.value = true;
      error.value = null;

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };

      const response = await Attendance.listSessions(params);

      if (response.success && response.data) {
        sessions.value = response.data.items || response.data || [];
        pagination.total = response.data.pagination?.total || sessions.value.length;
      } else {
        sessions.value = [];
        pagination.total = 0;
      }
    } catch (err: any) {
      error.value = 'Failed to load attendance sessions';
      sessions.value = [];
      pagination.total = 0;

      // Only show toast for server errors, not for empty results
      if (err?.response?.status >= 500) {
        const msg =
          err?.response?.data?.message || err?.message || 'Failed to load attendance sessions';
        showToast(msg, 'error');
      }
    } finally {
      loading.value = false;
    }
  };

  /**
   * Create or get existing attendance session
   * Uses consistent API patterns and error handling
   */
  const createSession = async (sessionData: {
    date: string;
    attendance_type: 'daily';
    class_id: string;
    section_id?: string;
    school_id?: string;
    branch_id?: string;
    academic_year?: string;
  }) => {
    try {
      loading.value = true;
      error.value = null;

      const payload = {
        ...sessionData,
        // Use auth context as fallback only if not provided in sessionData
        school_id: sessionData.school_id || auth.currentSchool?.id,
        branch_id: sessionData.branch_id || auth.currentBranch?.id
      };

      const response = await Attendance.upsertSession(payload);

      if (response.success && response.data) {
        currentSession.value = response.data;
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create session');
      }
    } catch (err: any) {
      error.value = 'Failed to create session';
      const msg = err?.response?.data?.message || err?.message || 'Failed to create session';
      showToast(msg, 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Load students for a class/section
   * Uses consistent API patterns and initializes attendance records
   */
  const loadStudents = async (
    classId: string,
    sectionId?: string,
    page: number = 1,
    limit: number = 10
  ) => {
    try {
      loading.value = true;
      error.value = null;

      const params: any = {
        page: page,
        limit: limit,
        class_id: classId
      };

      if (sectionId) {
        params.section_id = sectionId;
      }

      const response = await Students.getAll(params);

      if (response.success && response.data) {
        const data = Array.isArray(response.data) ? response.data : response.data.items || [];
        students.value = data;

        // Update pagination info
        pagination.page = response.pagination?.current_page || page;
        pagination.total = response.pagination?.total_count || data.length;
        pagination.limit = response.pagination?.limit || limit;

        // Initialize attendance records for new students only (preserve existing data)
        data.forEach((student: any) => {
          if (!attendanceRecords.value[student.id]) {
            attendanceRecords.value[student.id] = {
              student_id: student.id,
              status: 'present',
              remarks: ''
            };
          }
        });

        return data;
      } else {
        students.value = [];
        attendanceRecords.value = {};
        pagination.page = 1;
        pagination.total = 0;
        pagination.limit = limit;
        return [];
      }
    } catch (err: any) {
      error.value = 'Failed to load students';
      students.value = [];
      attendanceRecords.value = {};
      pagination.page = 1;
      pagination.total = 0;
      pagination.limit = limit;

      // Only show toast for server errors, not for empty results
      if (err?.response?.status >= 500) {
        const msg = err?.response?.data?.message || err?.message || 'Failed to load students';
        showToast(msg, 'error');
      }
    } finally {
      loading.value = false;
    }
  };

  /**
   * Save attendance records
   * Uses consistent validation and error handling
   */
  const saveAttendance = async (
    sessionId: string,
    records: AttendanceRecord[],
    publish: boolean = false
  ) => {
    try {
      saving.value = true;
      error.value = null;

      // Validate inputs
      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      if (!records || records.length === 0) {
        throw new Error('No attendance records to save');
      }

      // Validate records
      const validStatuses = ['present', 'absent', 'late', 'excused'];
      const invalidRecords = records.filter(r => !validStatuses.includes(r.status));
      if (invalidRecords.length > 0) {
        throw new Error('Please ensure all students have valid attendance status');
      }

      const response = await Attendance.saveRecords({
        session_id: sessionId,
        records,
        publish
      });

      if (response.success) {
        const message = publish ? 'Attendance published successfully' : 'Draft saved successfully';
        showToast(message, 'success');
        return response;
      } else {
        throw new Error(response.message || 'Failed to save attendance');
      }
    } catch (err: any) {
      error.value = 'Failed to save attendance';
      const msg = err?.response?.data?.message || err?.message || 'Failed to save attendance';
      showToast(msg, 'error');
      throw err;
    } finally {
      saving.value = false;
    }
  };

  /**
   * Get session details with records
   * Uses consistent API patterns and error handling
   */
  const getSessionDetails = async (sessionId: string) => {
    try {
      loading.value = true;
      error.value = null;

      const response = await Attendance.getSession(sessionId);

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to load session details');
      }
    } catch (err: any) {
      error.value = 'Failed to load session details';
      const msg = err?.response?.data?.message || err?.message || 'Failed to load session details';
      showToast(msg, 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Update attendance record for a student
   */
  const updateStudentRecord = (studentId: string, updates: Partial<AttendanceRecord>) => {
    if (attendanceRecords.value[studentId]) {
      attendanceRecords.value[studentId] = {
        ...attendanceRecords.value[studentId],
        ...updates
      };
    }
  };

  /**
   * Reset all state
   */
  const resetState = () => {
    sessions.value = [];
    currentSession.value = null;
    students.value = [];
    attendanceRecords.value = {};
    error.value = null;
    pagination.page = 1;
    pagination.total = 0;
  };

  /**
   * Set pagination page
   */
  const setPage = (page: number) => {
    pagination.page = page;
  };

  /**
   * Get attendance statistics
   */
  const getAttendanceStats = computed(() => {
    const records = Object.values(attendanceRecords.value);
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const excused = records.filter(r => r.status === 'excused').length;

    return {
      total,
      present,
      absent,
      late,
      excused,
      presentPercentage: total > 0 ? Math.round((present / total) * 100) : 0
    };
  });

  /**
   * Check if attendance has changes
   */
  const hasChanges = computed(() => {
    return Object.keys(attendanceRecords.value).length > 0;
  });

  /**
   * Get filtered students based on search and status
   */
  const getFilteredStudents = (searchQuery: string = '', statusFilter: string = '') => {
    return students.value.filter(student => {
      const matchesSearch =
        !searchQuery ||
        student.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.roll_number?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        !statusFilter || attendanceRecords.value[student.id]?.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  };

  // Analytics state
  const analytics = ref<any>(null);
  const analyticsLoading = ref(false);

  /**
   * Load attendance analytics
   */
  const loadAnalytics = async (filters: any = {}) => {
    try {
      analyticsLoading.value = true;
      error.value = null;

      const response = await Attendance.getAnalytics(filters);

      if (response.success && response.data) {
        analytics.value = response.data;
        return response.data;
      } else {
        // If this_month returns no data, try last_month as fallback
        if (filters.period === 'this_month') {
          const fallbackFilters = { ...filters, period: 'last_month' };
          const fallbackResponse = await Attendance.getAnalytics(fallbackFilters);

          if (fallbackResponse.success && fallbackResponse.data) {
            analytics.value = fallbackResponse.data;
            return fallbackResponse.data;
          }
        }

        throw new Error(response.message || 'Failed to load analytics');
      }
    } catch (err: any) {
      error.value = 'Failed to load analytics';
      const msg = err?.response?.data?.message || err?.message || 'Failed to load analytics';
      showToast(msg, 'error');
      throw err;
    } finally {
      analyticsLoading.value = false;
    }
  };

  /**
   * Export analytics data
   */
  const exportAnalytics = async (filters: any = {}) => {
    try {
      analyticsLoading.value = true;
      error.value = null;

      const response = await Attendance.exportAnalytics({ ...filters, format: 'xlsx' });

      if (response.data) {
        // Create download link for blob response
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute(
          'download',
          `attendance-analytics-${new Date().toISOString().split('T')[0]}.xlsx`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        showToast('Analytics exported successfully', 'success');
        return response;
      } else {
        throw new Error('No data received from export');
      }
    } catch (err: any) {
      error.value = 'Failed to export analytics';
      const msg = err?.response?.data?.message || err?.message || 'Failed to export analytics';
      showToast(msg, 'error');
      throw err;
    } finally {
      analyticsLoading.value = false;
    }
  };

  return {
    // State
    sessions: readonly(sessions),
    currentSession: readonly(currentSession),
    students,
    attendanceRecords,
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    pagination,

    // Analytics state
    analytics,
    analyticsLoading: readonly(analyticsLoading),

    // Computed
    getAttendanceStats,
    hasChanges,

    // Methods
    loadSessions,
    createSession,
    loadStudents,
    saveAttendance,
    getSessionDetails,
    updateStudentRecord,
    getFilteredStudents,
    resetState,
    setPage,

    // Analytics methods
    loadAnalytics,
    exportAnalytics
  };
};
