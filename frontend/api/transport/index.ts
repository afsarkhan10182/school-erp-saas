import { apiCall } from '~/utils/api';

export interface TransportParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: string;
  school_id?: string;
  branch_id?: string;
  [key: string]: any;
}

export const TransportVehicles = {
  getAll: async (params?: TransportParams) => apiCall('get', '/transport/vehicles', { params }),
  getById: async (id: string) => apiCall('get', `/transport/vehicles/${id}`),
  create: async (data: any) => apiCall('post', '/transport/vehicles', data),
  update: async (id: string, data: any) => apiCall('put', `/transport/vehicles/${id}`, data),
  delete: async (id: string) => apiCall('delete', `/transport/vehicles/${id}`),
};

export const TransportRoutes = {
  getAll: async (params?: TransportParams) => apiCall('get', '/transport/routes', { params }),
  getById: async (id: string) => apiCall('get', `/transport/routes/${id}`),
  create: async (data: any) => apiCall('post', '/transport/routes', data),
  update: async (id: string, data: any) => apiCall('put', `/transport/routes/${id}`, data),
  delete: async (id: string) => apiCall('delete', `/transport/routes/${id}`),
};

export const TransportAllocations = {
  getAll: async (params?: TransportParams) => apiCall('get', '/transport/allocations', { params }),
  getById: async (id: string) => apiCall('get', `/transport/allocations/${id}`),
  create: async (data: any) => apiCall('post', '/transport/allocations', data),
  update: async (id: string, data: any) => apiCall('put', `/transport/allocations/${id}`, data),
  delete: async (id: string) => apiCall('delete', `/transport/allocations/${id}`),
};
