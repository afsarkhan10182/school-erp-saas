import { apiCall } from '~/utils/api';

export const Syllabus = {
  list: (params: Record<string, string>) => apiCall('get', '/syllabus', { params }),
  classes: () => apiCall('get', '/syllabus/classes'),
  subjects: (params: Record<string, string>) => apiCall('get', '/syllabus/subjects', { params }),
  create: (data: Record<string, string>) => apiCall('post', '/syllabus', data)
};
