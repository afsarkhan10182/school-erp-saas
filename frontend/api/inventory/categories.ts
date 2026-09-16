import { apiCall } from '~/utils/api';

export const InventoryCategories = {
  getAll: async (params?: any) => apiCall('get', '/inventory/categories', { params }),
  getById: async (id: string) => apiCall('get', `/inventory/categories/${id}`),
  create: async (data: any) => apiCall('post', '/inventory/categories', data),
  update: async (id: string, data: any) => apiCall('put', `/inventory/categories/${id}`, data),
  delete: async (id: string) => apiCall('delete', `/inventory/categories/${id}`),
};
