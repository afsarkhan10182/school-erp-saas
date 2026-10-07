import { apiCall } from '~/utils/api';

export const AccountingTransactions = {
  getAll: async (params?: any) => apiCall('get', '/accounting/transactions', { params }),
  getById: async (id: string) => apiCall('get', `/accounting/transactions/${id}`),
  create: async (data: any) => apiCall('post', '/accounting/transactions', data),
  update: async (id: string, data: any) => apiCall('put', `/accounting/transactions/${id}`, data),
  delete: async (id: string) => apiCall('delete', `/accounting/transactions/${id}`),
};
