import { apiCall } from '~/utils/api';

export interface AlumniParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: string;
  school_id?: string;
  branch_id?: string;
  [key: string]: any;
}

export const AlumniAPI = {
  getAll: async (params?: AlumniParams) => apiCall('get', '/alumni/directory', { params }),
  getById: async (id: string) => apiCall('get', `/alumni/directory/${id}`),
  create: async (data: any) => apiCall('post', '/alumni/directory', data),
  update: async (id: string, data: any) => apiCall('put', `/alumni/directory/${id}`, data),
  delete: async (id: string) => apiCall('delete', `/alumni/directory/${id}`),
};

export const AlumniEventsAPI = {
  getAll: async (params?: AlumniParams) => apiCall('get', '/alumni/events', { params }),
  getById: async (id: string) => apiCall('get', `/alumni/events/${id}`),
  create: async (data: any) => apiCall('post', '/alumni/events', data),
  update: async (id: string, data: any) => apiCall('put', `/alumni/events/${id}`, data),
  delete: async (id: string) => apiCall('delete', `/alumni/events/${id}`),
};
