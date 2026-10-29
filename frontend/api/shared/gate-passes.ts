import { apiCall } from '~/utils/api';

export const GatePasses = {
  list: (params?: Record<string, string | number>) => apiCall('get', '/gate-passes', { params }),
  students: (params?: Record<string, string | number>) => apiCall('get', '/gate-passes/students', { params }),
  get: (id: string) => apiCall('get', `/gate-passes/${id}`),
  create: (data: Record<string, any>) => apiCall('post', '/gate-passes', data),
  transition: (id: string, action: 'approve' | 'reject' | 'out' | 'return' | 'cancel', data?: Record<string, any>) =>
    apiCall('post', `/gate-passes/${id}/${action}`, data),
  lookup: (code: string, params?: Record<string, string>) =>
    apiCall('get', `/gate-passes/terminal/${encodeURIComponent(code)}`, { params })
};
