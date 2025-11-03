import { apiCall } from '~/utils/api';

export interface Branch {
  id: string;
  name: string;
  code?: string;
}

export interface ExamHall {
  id: string;
  name: string;
  capacity: number;
  is_active: boolean;
  school_id: string;
  branch_id?: string; // Optional now
  branch?: Branch; // Include branch data from API
  created_by?: string;
  updated_by?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExamHallFilters {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
  school_id?: string;
  branch_id?: string;
}

export const examHallApi = {
  // Get all exam halls
  getAll: async (filters: ExamHallFilters = {}) => {
    return apiCall('get', '/exam-halls', { params: filters });
  },

  // Get exam hall by ID
  getById: async (id: string) => {
    return apiCall('get', `/exam-halls/${id}`);
  },

  // Create new exam hall
  create: async (data: any) => {
    return apiCall('post', '/exam-halls', data);
  },

  // Update exam hall
  update: async (data: any) => {
    return apiCall('put', `/exam-halls/${data.id}`, data);
  },

  // Delete exam hall
  delete: async (id: string) => {
    return apiCall('delete', `/exam-halls/${id}`);
  },

  // Get halls for dropdown
  getDropdown: async () => {
    return apiCall('get', '/exam-halls/dropdown');
  }
};
