import { apiCall, createApiInstance } from '~/utils/api';

export const DynamicEntities = {
  list: (entity: string, params?: any) => apiCall('get', `/entities/${entity}`, { params }),
  create: (entity: string, data: any) => apiCall('post', `/entities/${entity}`, data),
  update: (entity: string, id: string, data: any) =>
    apiCall('put', `/entities/${entity}/${id}`, data),
  remove: (entity: string, id: string) => apiCall('delete', `/entities/${entity}/${id}`),
  action: (entity: string, id: string, action: string) =>
    apiCall('post', `/entities/${entity}/${id}/${action}`),
  bulk: (entity: string, items: any[]) => apiCall('post', `/entities/${entity}/bulk`, { items }),
  reports: (type: string, params?: any) => apiCall('get', `/entities/reports/${type}`, { params }),
  bulkEditStudents: (data: {
    student_ids?: string[];
    updates?: any;
    students?: Array<{ id: string; updates: any }>;
    branch_id?: string;
  }) => apiCall('post', '/entities/students/bulk-edit', data),
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
  classes: (schoolCode: string) =>
    apiCall('get', `/public/entities/admissions/${schoolCode}/classes`),
  apply: (schoolCode: string, data: any) =>
    apiCall('post', `/public/entities/admissions/${schoolCode}`, data)
};

export const Portal = {
  dashboard: (params?: { student_id?: string }) => apiCall('get', '/portal/dashboard', { params }),
  feeInvoices: (params: { student_id: string; page?: number; limit?: number }) =>
    apiCall('get', '/portal/fees', { params }),
  libraryBooks: (params: { student_id?: string; search?: string; category?: string; page?: number; limit?: number }) =>
    apiCall('get', '/portal/library/books', { params }),
  libraryRequests: (params: { student_id?: string }) => apiCall('get', '/portal/library/requests', { params }),
  requestLibraryBook: (data: { student_id: string; book_id: string }) => apiCall('post', '/portal/library/requests', data),
  reportCardSetups: (studentId: string) =>
    apiCall('get', `/portal/students/${studentId}/report-card/setups`),
  reportCard: (studentId: string, setupId?: string) =>
    createApiInstance().get(`/portal/students/${studentId}/report-card`, {
      params: setupId ? { setup_id: setupId } : undefined,
      responseType: 'blob'
    }),
  schoolVisits: (studentId: string) =>
    apiCall('get', '/portal/visits', { params: { student_id: studentId } }),
  requestSchoolVisit: (data: {
    student_id: string;
    date: string;
    time: string;
    person_to_meet?: string;
    purpose: string;
  }) => apiCall('post', '/portal/visits', data),
  ptmMeetings: (studentId: string) =>
    apiCall('get', '/ptm/parent', { params: { student_id: studentId } }),
  submitPtmFeedback: (
    meetingId: string,
    data: { student_id: string; rating: number; feedback: string }
  ) => apiCall('post', `/ptm/${meetingId}/feedback`, data)
};

export const StudyMaterials = {
  list: (params?: { school_id?: string; branch_id?: string; class_id?: string; search?: string; page?: number; limit?: number }) =>
    apiCall('get', '/study-materials', { params }),
  create: (data: FormData) => apiCall('post', '/study-materials', data),
  remove: (id: string) => apiCall('delete', `/study-materials/${id}`),
  download: (id: string) =>
    createApiInstance().get(`/study-materials/${id}/file`, { responseType: 'blob' })
};
