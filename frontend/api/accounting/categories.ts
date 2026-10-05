import { apiCall } from '~/utils/api';

export const AccountingCategories = {
  getAll: async (params?: any) => apiCall('get', '/accounting/categories', { params }),
  getById: async (id: string) => apiCall('get', `/accounting/categories/${id}`),
  create: async (data: any) => apiCall('post', '/accounting/categories', data),
  update: async (id: string, data: any) => apiCall('put', `/accounting/categories/${id}`, data),
  delete: async (id: string) => apiCall('delete', `/accounting/categories/${id}`),
};
