import { ref, reactive, readonly } from "vue";
import { Attendance } from "~/api/students/attendance";
import { Students } from "~/api/students/students";
import { useToast } from "~/composables/useToast";
import { useAuthStore } from "~/stores/auth";

interface AttendanceSession {
  id: string;
  date: string;
  attendance_type: "daily";
  status: "draft" | "published";
  class_id: string;
  section_id?: string;
  school_id?: string;
  branch_id?: string;
  academic_year?: string;
  remarks?: string;
}

interface AttendanceRecord {
  student_id: string;
  status: "present" | "absent" | "late" | "excused";
  remarks?: string;
  arrival_time?: string;
}

interface AttendanceFilters {
  date_from?: string;
  date_to?: string;
  class_id?: string;
  section_id?: string;
  status?: "draft" | "published";
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
}

/**
 * Composable for managing attendance operations
 * Centralizes all attendance-related business logic
 */
export const useAttendance = () => {
  const { showError, showSuccess } = useToast();
  const auth = useAuthStore();

  // State management
  const sessions = ref<AttendanceSession[]>([]);
  const currentSession = ref<AttendanceSession | null>(null);
  const students = ref<any[]>([]);
  const attendanceRecords = ref<Record<string, AttendanceRecord>>({});
  const loading = ref(false);
  const saving = ref(false);
  const error = ref<string | null>(null);

  const pagination = reactive<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
  });

  /**
   * Load attendance sessions with filters
   */
  const loadSessions = async (filters: AttendanceFilters = {}) => {
    try {
      loading.value = true;
      error.value = null;

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      const response = (await Attendance.listSessions(params)) as any;
      const data = response.data || [];
      const total = response.pagination?.total || data.length;

      sessions.value = data;
      pagination.total = total;
    } catch (err: any) {
      error.value = "Failed to load attendance sessions";
      console.error("Load sessions error:", err);
      // Only show toast for unexpected errors, not for normal data loading
      if (err?.response?.status !== 404) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load attendance sessions";
        showError(msg);
      }
    } finally {
      loading.value = false;
    }
  };

  /**
   * Create or get existing attendance session
   */
  const createSession = async (sessionData: {
    date: string;
    attendance_type: "daily";
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
        branch_id: sessionData.branch_id || auth.currentBranch?.id,
      };

      const response = await Attendance.upsertSession(payload);

      // Handle different response structures
      let sessionResult = null;
      if (response && response.success && response.data) {
        sessionResult = response.data;
      } else if (response && response.data) {
        sessionResult = response.data;
      } else if (response) {
        sessionResult = response;
      } else {
        throw new Error("Invalid response from server");
      }

      if (!sessionResult || !sessionResult.id) {
        throw new Error("Session created but missing ID");
      }

      currentSession.value = sessionResult;
      return sessionResult;
    } catch (err: any) {
      error.value = "Failed to create session";
      console.error("Create session error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create session";
      showError(msg);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Load students for a class/section
   */
  const loadStudents = async (classId: string, sectionId?: string) => {
    try {
      loading.value = true;
      error.value = null;

      const params: any = {
        page: 1,
        limit: 1000,
        class_id: classId,
      };

      if (sectionId) {
        params.section_id = sectionId;
      }

      const response = (await Students.getAll(params)) as any;
      const data = response.data || [];

      students.value = data;

      // Initialize attendance records for all students
      attendanceRecords.value = {};
      data.forEach((student: any) => {
        attendanceRecords.value[student.id] = {
          student_id: student.id,
          status: "present",
          remarks: "",
        };
      });

      return data;
    } catch (err: any) {
      error.value = "Failed to load students";
      console.error("Load students error:", err);
      // Only show toast for server errors, not for empty results
      if (err?.response?.status >= 500) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load students";
        showError(msg);
      }
    } finally {
      loading.value = false;
    }
  };

  /**
   * Save attendance records
   */
  const saveAttendance = async (
    sessionId: string,
    records: AttendanceRecord[],
    publish: boolean = false
  ) => {
    try {
      saving.value = true;
      error.value = null;

      if (!sessionId) {
        throw new Error("Session ID is required");
      }

      if (!records || records.length === 0) {
        throw new Error("No attendance records to save");
      }

      // Validate records
      const validStatuses = ["present", "absent", "late", "excused"];
      const invalidRecords = records.filter(
        (r) => !validStatuses.includes(r.status)
      );
      if (invalidRecords.length > 0) {
        throw new Error(
          "Please ensure all students have valid attendance status"
        );
      }

      const response = await Attendance.saveRecords({
        session_id: sessionId,
        records,
        publish,
      });

      const message = publish
        ? "Attendance published successfully"
        : "Draft saved successfully";
      showSuccess(message);

      return response;
    } catch (err: any) {
      error.value = "Failed to save attendance";
      console.error("Save attendance error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save attendance";
      showError(msg);
      throw err;
    } finally {
      saving.value = false;
    }
  };

  /**
   * Get session details with records
   */
  const getSessionDetails = async (sessionId: string) => {
    try {
      loading.value = true;
      error.value = null;

      const response = await Attendance.getSession(sessionId);
      return response.data;
    } catch (err: any) {
      error.value = "Failed to load session details";
      console.error("Get session details error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load session details";
      showError(msg);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Update attendance record for a student
   */
  const updateStudentRecord = (
    studentId: string,
    updates: Partial<AttendanceRecord>
  ) => {
    if (attendanceRecords.value[studentId]) {
      attendanceRecords.value[studentId] = {
        ...attendanceRecords.value[studentId],
        ...updates,
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

  return {
    // State
    sessions: readonly(sessions),
    currentSession: readonly(currentSession),
    students: readonly(students),
    attendanceRecords,
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    pagination,

    // Methods
    loadSessions,
    createSession,
    loadStudents,
    saveAttendance,
    getSessionDetails,
    updateStudentRecord,
    resetState,
    setPage,
  };
};
