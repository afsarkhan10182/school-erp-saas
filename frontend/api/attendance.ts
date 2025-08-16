import { createApiInstance } from '~/utils/api';
import type { ApiResponse, PaginatedResponse } from '~/types';

export const attendanceApi = {
  upsertSession: async (data: {
    date: string;
    attendance_type?: 'daily' | 'period';
    period_number?: number | null;
    academic_year?: string | null;
    class_id: string;
    section_id?: string | null;
    stream_id?: string | null;
    remarks?: string | null;
  }) => {
    const api = createApiInstance();
    const response = await api.post<ApiResponse<any>>('/attendance/session', data);
    return response.data;
  },

  saveRecords: async (data: {
    session_id: string;
    records: Array<{ student_id: string; status: 'present' | 'absent' | 'late' | 'excused'; remarks?: string }>;
    publish?: boolean;
  }) => {
    const api = createApiInstance();
    const response = await api.post<ApiResponse<any>>('/attendance/records', data);
    return response.data;
  },

  getSession: async (id: string) => {
    const api = createApiInstance();
    const response = await api.get<ApiResponse<any>>(`/attendance/sessions/${id}`);
    return response.data;
  },

  listSessions: async (params?: { page?: number; limit?: number; date_from?: string; date_to?: string; class_id?: string; section_id?: string; status?: 'draft' | 'published' }) => {
    const api = createApiInstance();
    const response = await api.get<PaginatedResponse<any>>('/attendance/sessions', { params });
    return response.data;
  },

  getReport: async (params: { report_type?: 'daily' | 'monthly'; date?: string; month?: number; year?: number; class_id?: string; section_id?: string; student_id?: string }) => {
    const api = createApiInstance();
    const response = await api.get<ApiResponse<any>>('/attendance/reports', { params });
    return response.data;
  },

  bulkImport: async (rows: any[]) => {
    const api = createApiInstance();
    const response = await api.post<ApiResponse<any>>('/attendance/bulk-import', { rows });
    return response.data;
  },
};

export default attendanceApi;


