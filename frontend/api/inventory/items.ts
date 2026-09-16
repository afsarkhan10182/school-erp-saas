import { apiCall } from '~/utils/api';

export const InventoryItems = {
  getAll: async (params?: any) => apiCall('get', '/inventory/items', { params }),
  getById: async (id: string) => apiCall('get', `/inventory/items/${id}`),
  create: async (data: any) => apiCall('post', '/inventory/items', data),
  update: async (id: string, data: any) => apiCall('put', `/inventory/items/${id}`, data),
  delete: async (id: string) => apiCall('delete', `/inventory/items/${id}`),
};
