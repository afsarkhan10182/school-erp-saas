import { apiCall } from '~/utils/api';

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
    return apiCall('get', '/exam-statuses', { params: filters });
  },

  // Get exam status by ID
  getById: async (id: string) => {
    return apiCall('get', `/exam-statuses/${id}`);
  },

  // Create exam status
  create: async (data: Partial<ExamStatus>) => {
    return apiCall('post', '/exam-statuses', data);
  },

  // Update exam status
  update: async (id: string, data: Partial<ExamStatus>) => {
    return apiCall('put', `/exam-statuses/${id}`, data);
  },

  // Delete exam status
  delete: async (id: string) => {
    return apiCall('delete', `/exam-statuses/${id}`);
  },

  // Get exam statuses for dropdown/select
  getForDropdown: async (params?: { school_id?: string; is_active?: string }) => {
    return apiCall('get', '/exam-statuses/dropdown', { params });
  },

  // Get active exam statuses
  getActive: async (params?: { school_id?: string }) => {
    return apiCall('get', '/exam-statuses/active', { params });
  }
};

export default examStatusApi;
