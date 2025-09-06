import { createApiInstance } from '~/utils/api';

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
    const api = createApiInstance();
    const response = await api.get('/classes', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const api = createApiInstance();
    const response = await api.get(`/classes/${id}`);
    return response.data;
  },

  create: async (classData: ClassData) => {
    const api = createApiInstance();
    const response = await api.post('/classes', classData);
    return response.data;
  },

  update: async (id: string, classData: ClassData) => {
    const api = createApiInstance();
    const response = await api.put(`/classes/${id}`, classData);
    return response.data;
  },

  delete: async (id: string) => {
    const api = createApiInstance();
    const response = await api.delete(`/classes/${id}`);
    return response.data;
  },

  getDropdown: async (params?: string) => {
    const api = createApiInstance();
    const response = await api.get(`/classes/dropdown${params ? `?${params}` : ''}`);
    return response.data;
  },

  getStats: async () => {
    const api = createApiInstance();
    const response = await api.get('/classes/stats');
    return response.data;
  }
};
