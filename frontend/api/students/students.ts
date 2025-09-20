import { createApiInstance, apiCall } from '~/utils/api';

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  roll_number?: string;
  class_id: string;
  section_id?: string;
  school_id: string;
  branch_id: string;
  status?: string;
  gender?: string;
  admission_date?: string;
  email?: string;
  phone?: string;
  class?: {
    id: string;
    name: string;
    code: string;
  };
  section?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface StudentFilters {
  page?: number;
  limit?: number;
  search?: string;
  class_id?: string;
  section_id?: string;
  status?: string;
  school_id?: string;
  branch_id?: string;
  from_date?: string;
  to_date?: string;
  academic_year?: string;
}

export interface StudentStats {
  total: number;
  active: number;
  inactive: number;
  graduated: number;
  dropped: number;
  newThisMonth: number;
  classCount: number;
  class_distribution: Array<{ current_class: string; count: number }>;
  branch_distribution: Array<{ branch_id: string; count: number }>;
}

export const Student = {
  // Get all students with pagination and filtering
  getAll: async (filters: StudentFilters = {}) => {
    return apiCall('get', '/students', { params: filters });
  },

  // Get student by ID
  getById: async (id: string) => {
    return apiCall('get', `/students/${id}`);
  },

  // Get student report with advanced filtering
  getReport: async (filters: StudentFilters = {}) => {
    return apiCall('get', '/students/report', { params: filters });
  },

  // Get student statistics
  getStats: async (filters: StudentFilters = {}) => {
    return apiCall('get', '/students/stats', { params: filters });
  },

  // Get import template
  getImportTemplate: async (type: string) => {
    const api = createApiInstance();
    const response = await api.get(`/students/import-template/${type}`, { responseType: 'blob' });
    return response;
  },

  // Bulk import students
  bulkImport: async (formData: FormData) => {
    const api = createApiInstance();
    const response = await api.post('/students/bulk-import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Get invoice breakdown for student
  getInvoiceBreakdown: async (studentId: string, params: any) => {
    return apiCall('get', `/students/${studentId}/invoice-breakdown`, { params });
  },

  // Create student with form data (including file uploads)
  createWithFormData: async (formData: FormData) => {
    const api = createApiInstance();
    const response = await api.post('/students', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Update student with form data (including file uploads)
  updateWithFormData: async (studentId: string, formData: FormData) => {
    const api = createApiInstance();
    const response = await api.put(`/students/${studentId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

export default Student;
