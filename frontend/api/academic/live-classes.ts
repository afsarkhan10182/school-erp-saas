import { apiCall, createApiInstance } from '~/utils/api';

export const LiveClasses = {
  list: (params?: Record<string, string | number>) => apiCall('get', '/live-classes', { params }),
  create: (data: Record<string, unknown>) => apiCall('post', '/live-classes', data),
  update: (id: string, data: Record<string, unknown>) =>
    apiCall('put', `/live-classes/${id}`, data),
  cancel: (id: string) => apiCall('patch', `/live-classes/${id}/cancel`),
  attendance: (id: string) => apiCall('get', `/live-classes/${id}/attendance`),
  updateAttendance: (id: string, studentId: string, data: Record<string, unknown>) =>
    apiCall('patch', `/live-classes/${id}/attendance/${studentId}`, data),
  exportAttendance: (id: string) =>
    createApiInstance().get(`/live-classes/${id}/attendance/export.csv`, { responseType: 'blob' })
};
