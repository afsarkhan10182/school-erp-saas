import { createApiInstance } from '~/utils/api';
import type { ApiResponse, PaginatedResponse } from '~/types';

export interface ExamType {
  id: string;
  name: string;
  code: string;
  description?: string;
  weightage: number;
  is_active: boolean;
  sort_order: number;
  school_id?: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExamTypeFilters {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: string;
  school_id?: string;
}

export const examTypeApi = {
  // Get all exam types with pagination and filtering
  getAll: async (filters: ExamTypeFilters = {}) => {
    const api = createApiInstance();
    const response = await api.get<PaginatedResponse<ExamType>>('/exam-types', { params: filters });
    return response.data;
  },

  // Get exam type by ID
  getById: async (id: string) => {
    const api = createApiInstance();
    const response = await api.get<ApiResponse<ExamType>>(`/exam-types/${id}`);
    return response.data;
  },

  // Create exam type
  create: async (data: Partial<ExamType>) => {
    const api = createApiInstance();
    const response = await api.post<ApiResponse<ExamType>>('/exam-types', data);
    return response.data;
  },

  // Update exam type
  update: async (id: string, data: Partial<ExamType>) => {
    const api = createApiInstance();
    const response = await api.put<ApiResponse<ExamType>>(`/exam-types/${id}`, data);
    return response.data;
  },

  // Delete exam type
  delete: async (id: string) => {
    const api = createApiInstance();
    const response = await api.delete<ApiResponse<{ message: string }>>(`/exam-types/${id}`);
    return response.data;
  },

  // Get exam types for dropdown/select
  getForDropdown: async (params?: { school_id?: string; is_active?: string }) => {
    const api = createApiInstance();
    const response = await api.get<ApiResponse<ExamType[]>>('/exam-types/dropdown', { params });
    return response.data;
  },

  // Get active exam types
  getActive: async (params?: { school_id?: string }) => {
    const api = createApiInstance();
    const response = await api.get<ApiResponse<ExamType[]>>('/exam-types/active', { params });
    return response.data;
  }
};

export default examTypeApi;
