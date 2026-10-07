import { apiCall } from '~/utils/api';

export const InventorySuppliers = {
  getAll: async (params?: any) => apiCall('get', '/inventory/suppliers', { params }),
  getById: async (id: string) => apiCall('get', `/inventory/suppliers/${id}`),
  create: async (data: any) => apiCall('post', '/inventory/suppliers', data),
  update: async (id: string, data: any) => apiCall('put', `/inventory/suppliers/${id}`, data),
  delete: async (id: string) => apiCall('delete', `/inventory/suppliers/${id}`),
};
