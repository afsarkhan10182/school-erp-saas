import { apiCall } from '~/utils/api';

export const Promotions = {
  getStudents: async (params: { class_id: string; section_id?: string; branch_id?: string; school_id?: string }) => {
    return apiCall('get', '/student-promotions/students', { params });
  },
  promote: async (data: {
    from_class_id: string;
    from_section_id?: string;
    to_class_id: string;
    to_section_id?: string;
    to_academic_year: string;
    branch_id?: string;
    school_id?: string;
    students: Array<{ student_id: string; action: 'promote' | 'repeat' }>;
  }) => {
    return apiCall('post', '/student-promotions', data);
  }
};

export const StudentCategories = {
  getAll: async (params?: { school_id?: string; branch_id?: string }) =>
    apiCall('get', '/student-categories', { params }),
  create: async (data: { name: string; description?: string; school_id?: string; branch_id?: string }) =>
    apiCall('post', '/student-categories', data),
  update: async (id: string, data: any) => apiCall('put', `/student-categories/${id}`, data),
  remove: async (id: string) => apiCall('delete', `/student-categories/${id}`)
};

export const Parents = {
  getAll: async (params?: { branch_id?: string }) => apiCall('get', '/parents', { params }),
  create: async (data: any) => apiCall('post', '/parents', data),
  update: async (id: string, data: any) => apiCall('put', `/parents/${id}`, data)
};

export const FeeFines = {
  getAll: async (params?: { branch_id?: string }) => apiCall('get', '/fee-fines', { params }),
  create: async (data: any) => apiCall('post', '/fee-fines', data),
  update: async (id: string, data: any) => apiCall('put', `/fee-fines/${id}`, data),
  remove: async (id: string) => apiCall('delete', `/fee-fines/${id}`)
};

export const Homeworks = {
  getAll: async (params?: { class_id?: string; branch_id?: string }) => apiCall('get', '/homeworks', { params }),
  create: async (data: any) => apiCall('post', '/homeworks', data),
  update: async (id: string, data: any) => apiCall('put', `/homeworks/${id}`, data),
  remove: async (id: string) => apiCall('delete', `/homeworks/${id}`)
};

export const Library = {
  getBooks: async (params?: { branch_id?: string }) => apiCall('get', '/library/books', { params }),
  createBook: async (data: any) => apiCall('post', '/library/books', data),
  updateBook: async (id: string, data: any) => apiCall('put', `/library/books/${id}`, data),
  importBooks: async (data: FormData) => apiCall('post', '/library/books/import', data),
  getIssues: async (params?: { status?: string; branch_id?: string }) => apiCall('get', '/library/issues', { params }),
  issueBook: async (data: any) => apiCall('post', '/library/issues', data),
  returnBook: async (id: string) => apiCall('post', `/library/issues/${id}/return`)
};
