import { apiCall } from '~/utils/api';

export const InventoryIssues = {
  getAll: async (params?: any) => apiCall('get', '/inventory/issues', { params }),
  getById: async (id: string) => apiCall('get', `/inventory/issues/${id}`),
  create: async (data: any) => apiCall('post', '/inventory/issues', data),
  update: async (id: string, data: any) => apiCall('put', `/inventory/issues/${id}`, data),
  delete: async (id: string) => apiCall('delete', `/inventory/issues/${id}`),
};
