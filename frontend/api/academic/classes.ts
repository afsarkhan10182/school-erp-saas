import { apiCall } from '~/utils/api';

export interface ClassParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: string;
  school_id?: string;
  branch_id?: string;
}

export interface ClassData {
  name: string;
  code: string;
  description?: string;
  school_id: string;
  branch_id?: string;
  is_active?: boolean;
}

export const Classes = {
  getAll: async (params?: ClassParams) => {
    return apiCall('get', '/classes', { params });
  },

  getById: async (id: string) => {
    return apiCall('get', `/classes/${id}`);
  },

  create: async (classData: ClassData) => {
    return apiCall('post', '/classes', classData);
  },

  update: async (id: string, classData: ClassData) => {
    return apiCall('put', `/classes/${id}`, classData);
  },

  delete: async (id: string) => {
    return apiCall('delete', `/classes/${id}`);
  },

  getDropdown: async (params?: string) => {
    return apiCall('get', `/classes/dropdown${params ? `?${params}` : ''}`);
  },

  getStats: async () => {
    return apiCall('get', '/classes/stats');
  }
};
