import { apiCall } from '~/utils/api';

export const DynamicEntities = {
  list: (entity: string, params?: any) => apiCall('get', `/entities/${entity}`, { params }),
  create: (entity: string, data: any) => apiCall('post', `/entities/${entity}`, data),
  update: (entity: string, id: string, data: any) =>
    apiCall('put', `/entities/${entity}/${id}`, data),
  remove: (entity: string, id: string) => apiCall('delete', `/entities/${entity}/${id}`),
  action: (entity: string, id: string, action: string) =>
    apiCall('post', `/entities/${entity}/${id}/${action}`),
  bulk: (entity: string, items: any[]) =>
    apiCall('post', `/entities/${entity}/bulk`, { items }),
  reports: (type: string, params?: any) =>
    apiCall('get', `/entities/reports/${type}`, { params }),
  bulkEditStudents: (data: { student_ids?: string[]; updates?: any; students?: Array<{ id: string; updates: any }> }) =>
    apiCall('post', '/entities/students/bulk-edit', data),
  transferStudents: (data: { student_ids: string[]; to_branch_id: string }) =>
    apiCall('post', '/entities/students/transfer', data),
  idCard: (studentId: string, kind = 'id') =>
    apiCall('get', `/entities/cards/${studentId}`, { params: { kind } }),
  createStudentLogin: (studentId: string, data: { email?: string; password?: string }) =>
    apiCall('post', `/entities/students/${studentId}/create-login`, data),
  setParentAuthentication: (id: string, enabled: boolean) =>
    apiCall('put', `/entities/parents/${id}/authentication`, { enabled }),
  createParentLogin: (id: string, data: { email?: string; password?: string }) =>
    apiCall('post', `/entities/parents/${id}/create-login`, data)
};

export const PublicAdmission = {
  classes: (schoolCode: string) => apiCall('get', `/public/entities/admissions/${schoolCode}/classes`),
  apply: (schoolCode: string, data: any) =>
    apiCall('post', `/public/entities/admissions/${schoolCode}`, data)
};

export const Portal = {
  dashboard: () => apiCall('get', '/portal/dashboard')
};
