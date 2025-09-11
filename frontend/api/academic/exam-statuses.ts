import { createApiInstance } from '~/utils/api';
import type { ApiResponse, PaginatedResponse } from '~/types';

export interface ExamStatus {
  id: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
  is_active: boolean;
  sort_order: number;
  is_system: boolean;
  school_id?: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExamStatusFilters {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: string;
  school_id?: string;
}

export const examStatusApi = {
  // Get all exam statuses with pagination and filtering
  getAll: async (filters: ExamStatusFilters = {}) => {
    const api = createApiInstance();
    const response = await api.get<PaginatedResponse<ExamStatus>>('/exam-statuses', {
      params: filters
    });
    return response.data;
  },

  // Get exam status by ID
  getById: async (id: string) => {
    const api = createApiInstance();
    const response = await api.get<ApiResponse<ExamStatus>>(`/exam-statuses/${id}`);
    return response.data;
  },

  // Create exam status
  create: async (data: Partial<ExamStatus>) => {
    const api = createApiInstance();
    const response = await api.post<ApiResponse<ExamStatus>>('/exam-statuses', data);
    return response.data;
  },

  // Update exam status
  update: async (id: string, data: Partial<ExamStatus>) => {
    const api = createApiInstance();
    const response = await api.put<ApiResponse<ExamStatus>>(`/exam-statuses/${id}`, data);
    return response.data;
  },

  // Delete exam status
  delete: async (id: string) => {
    const api = createApiInstance();
    const response = await api.delete<ApiResponse<{ message: string }>>(`/exam-statuses/${id}`);
    return response.data;
  },

  // Get exam statuses for dropdown/select
  getForDropdown: async (params?: { school_id?: string; is_active?: string }) => {
    const api = createApiInstance();
    const response = await api.get<ApiResponse<ExamStatus[]>>('/exam-statuses/dropdown', {
      params
    });
    return response.data;
  },

  // Get active exam statuses
  getActive: async (params?: { school_id?: string }) => {
    const api = createApiInstance();
    const response = await api.get<ApiResponse<ExamStatus[]>>('/exam-statuses/active', { params });
    return response.data;
  }
};

export default examStatusApi;
