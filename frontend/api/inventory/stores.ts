import { apiCall } from '~/utils/api';

export const InventoryStores = {
  getAll: async (params?: any) => apiCall('get', '/inventory/stores', { params }),
  getById: async (id: string) => apiCall('get', `/inventory/stores/${id}`),
  create: async (data: any) => apiCall('post', '/inventory/stores', data),
  update: async (id: string, data: any) => apiCall('put', `/inventory/stores/${id}`, data),
  delete: async (id: string) => apiCall('delete', `/inventory/stores/${id}`),
};
