import { createApiInstance, apiCall } from '~/utils/api';

export interface AttendanceSession {
  date: string;
  attendance_type?: 'daily' | 'period';
  period_number?: number | null;
  academic_year?: string | null;
  class_id: string;
  section_id?: string | null;
  stream_id?: string | null;
  remarks?: string | null;
}

export interface AttendanceRecord {
  session_id: string;
  records: Array<{
    student_id: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    remarks?: string;
  }>;
  publish?: boolean;
}

export interface AttendanceReportParams {
  report_type?: 'daily' | 'monthly';
  date?: string;
  month?: number;
  year?: number;
  class_id?: string;
  section_id?: string;
  student_id?: string;
  date_from?: string;
  date_to?: string;
  academic_year?: string;
}

export const Attendance = {
  upsertSession: async (data: AttendanceSession) => {
    return apiCall('post', '/attendance/session', data);
  },

  saveRecords: async (data: AttendanceRecord) => {
    return apiCall('post', '/attendance/records', data);
  },

  notifyAbsentees: async (sessionId: string) => {
    return apiCall('post', '/attendance/notify-absentees', { session_id: sessionId });
  },

  getSession: async (id: string) => {
    return apiCall('get', `/attendance/sessions/${id}`);
  },

  listSessions: async (params?: {
    page?: number;
    limit?: number;
    date_from?: string;
    date_to?: string;
    class_id?: string;
    section_id?: string;
    status?: 'draft' | 'published';
  }) => {
    return apiCall('get', '/attendance/sessions', { params });
  },

  getReport: async (params: AttendanceReportParams) => {
    return apiCall('get', '/attendance/reports', { params });
  },

  exportReport: async (queryString: string) => {
    const api = createApiInstance();
    const response = await api.get(`/attendance/reports/export?${queryString}`, {
      responseType: 'blob'
    });
    return response;
  },

  // Export reports
  exportPdfReport: async (queryParams: string) => {
    const api = createApiInstance();
    const response = await api.get(`/attendance/reports/export/pdf?${queryParams}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  exportExcelReport: async (queryParams: string) => {
    const api = createApiInstance();
    const response = await api.get(`/attendance/reports/export/excel?${queryParams}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Enhanced Analytics API
  getAnalytics: async (params?: {
    period?: string;
    custom_start_date?: string;
    custom_end_date?: string;
    class_id?: string;
    section_id?: string;
    academic_year?: string;
  }) => {
    return apiCall('get', '/attendance/analytics', { params });
  },

  getAnalyticsSummary: async (params?: {
    period?: string;
    class_id?: string;
    section_id?: string;
    academic_year?: string;
  }) => {
    return apiCall('get', '/attendance/analytics/summary', { params });
  },

  getAttendanceTrends: async (params?: {
    period?: string;
    custom_start_date?: string;
    custom_end_date?: string;
    class_id?: string;
    section_id?: string;
    academic_year?: string;
    group_by?: string;
  }) => {
    return apiCall('get', '/attendance/analytics/trends', { params });
  },

  getClassPerformance: async (params?: { period?: string; academic_year?: string }) => {
    return apiCall('get', '/attendance/analytics/performance/classes', { params });
  },

  getStudentPerformance: async (params?: {
    period?: string;
    class_id?: string;
    section_id?: string;
    academic_year?: string;
  }) => {
    return apiCall('get', '/attendance/analytics/performance/students', { params });
  },

  getAttendanceAlerts: async (params?: {
    period?: string;
    class_id?: string;
    section_id?: string;
    academic_year?: string;
  }) => {
    return apiCall('get', '/attendance/analytics/alerts', { params });
  },

  exportAnalytics: async (params?: {
    format?: string;
    period?: string;
    custom_start_date?: string;
    custom_end_date?: string;
    class_id?: string;
    section_id?: string;
    academic_year?: string;
  }) => {
    const api = createApiInstance();
    const response = await api.get('/attendance/analytics/export', {
      params,
      responseType: 'blob'
    });
    return response;
  },

  getDetailedReport: async (params?: {
    report_type?: string;
    date_from?: string;
    date_to?: string;
    class_id?: string;
    section_id?: string;
    student_id?: string;
    academic_year?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    return apiCall('get', '/attendance/reports/detailed', { params });
  },

  getStudentAttendanceHistory: async (
    studentId: string,
    params?: {
      period?: string;
      custom_start_date?: string;
      custom_end_date?: string;
      academic_year?: string;
    }
  ) => {
    return apiCall('get', `/attendance/student/${studentId}/history`, { params });
  }
};
