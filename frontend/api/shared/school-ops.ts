import { apiCall } from '~/utils/api';

export const SchoolOps = {
  list: (entity: string, params?: any) => apiCall('get', `/school-ops/${entity}`, { params }),
  create: (entity: string, data: any) => apiCall('post', `/school-ops/${entity}`, data),
  update: (entity: string, id: string, data: any) =>
    apiCall('put', `/school-ops/${entity}/${id}`, data),
  remove: (entity: string, id: string) => apiCall('delete', `/school-ops/${entity}/${id}`),
  action: (entity: string, id: string, action: string) =>
    apiCall('post', `/school-ops/${entity}/${id}/${action}`),
  bulk: (entity: string, items: any[]) =>
    apiCall('post', `/school-ops/${entity}/bulk`, { items }),
  reports: (type: string, params?: any) =>
    apiCall('get', `/school-ops/reports/${type}`, { params }),
  bulkEditStudents: (data: { student_ids?: string[]; updates?: any; students?: Array<{ id: string; updates: any }> }) =>
    apiCall('post', '/school-ops/students/bulk-edit', data),
  transferStudents: (data: { student_ids: string[]; to_branch_id: string }) =>
    apiCall('post', '/school-ops/students/transfer', data),
  idCard: (studentId: string, kind = 'id') =>
    apiCall('get', `/school-ops/cards/${studentId}`, { params: { kind } }),
  createStudentLogin: (studentId: string, data: { email?: string; password?: string }) =>
    apiCall('post', `/school-ops/students/${studentId}/create-login`, data),
  setParentAuthentication: (id: string, enabled: boolean) =>
    apiCall('put', `/school-ops/parents/${id}/authentication`, { enabled }),
  createParentLogin: (id: string, data: { email?: string; password?: string }) =>
    apiCall('post', `/school-ops/parents/${id}/create-login`, data)
};

export const PublicAdmission = {
  classes: (schoolCode: string) => apiCall('get', `/public/admissions/${schoolCode}/classes`),
  apply: (schoolCode: string, data: any) =>
    apiCall('post', `/public/admissions/${schoolCode}`, data)
};

export const Portal = {
  dashboard: () => apiCall('get', '/portal/dashboard')
};
