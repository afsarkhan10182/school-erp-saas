import { apiCall } from '~/utils/api';

export const ParentTeacherMeetings = {
  list: (params?: Record<string, string>) => apiCall('get', '/ptm', { params }),
  create: (data: Record<string, any>) => apiCall('post', '/ptm', data),
  recordAttendance: (id: string, attendees: Array<Record<string, any>>) =>
    apiCall('put', `/ptm/${id}/attendance`, { attendees }),
  updateStatus: (id: string, status: 'completed' | 'cancelled') =>
    apiCall('patch', `/ptm/${id}/status`, { status })
};
