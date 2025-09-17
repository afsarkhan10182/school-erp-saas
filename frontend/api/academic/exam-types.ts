import { apiCall } from '~/utils/api';

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
    return apiCall('get', '/exam-types', { params: filters });
  },

  // Get exam type by ID
  getById: async (id: string) => {
    return apiCall('get', `/exam-types/${id}`);
  },

  // Create exam type
  create: async (data: Partial<ExamType>) => {
    return apiCall('post', '/exam-types', data);
  },

  // Update exam type
  update: async (id: string, data: Partial<ExamType>) => {
    return apiCall('put', `/exam-types/${id}`, data);
  },

  // Delete exam type
  delete: async (id: string) => {
    return apiCall('delete', `/exam-types/${id}`);
  },

  // Get exam types for dropdown/select
  getForDropdown: async (params?: { school_id?: string; is_active?: string }) => {
    return apiCall('get', '/exam-types/dropdown', { params });
  },

  // Get active exam types
  getActive: async (params?: { school_id?: string }) => {
    return apiCall('get', '/exam-types/active', { params });
  }
};

export default examTypeApi;
