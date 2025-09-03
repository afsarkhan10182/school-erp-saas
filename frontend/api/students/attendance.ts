import { createApiInstance } from '~/utils/api';

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
  records: Array<{ student_id: string; status: 'present' | 'absent' | 'late' | 'excused'; remarks?: string }>;
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
    const api = createApiInstance();
    const response = await api.post('/attendance/session', data);
    return response.data;
  },

  saveRecords: async (data: AttendanceRecord) => {
    const api = createApiInstance();
    const response = await api.post('/attendance/records', data);
    return response.data;
  },

  getSession: async (id: string) => {
    const api = createApiInstance();
    const response = await api.get(`/attendance/sessions/${id}`);
    return response.data;
  },

  listSessions: async (params?: { page?: number; limit?: number; date_from?: string; date_to?: string; class_id?: string; section_id?: string; status?: 'draft' | 'published' }) => {
    const api = createApiInstance();
    const response = await api.get('/attendance/sessions', { params });
    return response.data;
  },

  getReport: async (params: AttendanceReportParams) => {
    const api = createApiInstance();
    const response = await api.get('/attendance/reports', { params });
    return response.data;
  },

  exportReport: async (queryString: string) => {
    const api = createApiInstance();
    const response = await api.get(`/attendance/reports/export?${queryString}`, { responseType: 'blob' });
    return response;
  },

  bulkImport: async (rows: any[]) => {
    const api = createApiInstance();
    const response = await api.post('/attendance/bulk-import', { rows });
    return response.data;
  },

  // File upload for bulk import
  uploadBulkImportFile: async (file: File) => {
    const api = createApiInstance();
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/attendance/bulk-import/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Get attendance import template
  getImportTemplate: async () => {
    const api = createApiInstance();
    const response = await api.get('/templates/attendance-import', { responseType: 'blob' });
    return response;
  },

  // Export reports
  exportPdfReport: async (queryParams: string) => {
    const api = createApiInstance();
    const response = await api.get(`/attendance/reports/export/pdf?${queryParams}`, { responseType: 'blob' });
    return response.data;
  },

  exportExcelReport: async (queryParams: string) => {
    const api = createApiInstance();
    const response = await api.get(`/attendance/reports/export/excel?${queryParams}`, { responseType: 'blob' });
    return response.data;
  }
};


