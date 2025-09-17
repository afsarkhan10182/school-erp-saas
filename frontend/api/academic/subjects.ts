import { apiCall } from '~/utils/api';

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  category: 'core' | 'elective' | 'extra_curricular' | 'language' | 'science' | 'arts' | 'commerce';
  credit_hours: number;
  is_active: boolean;
  class_id?: string;
  school_id: string;
  branch_id?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  class?: {
    id: string;
    name: string;
    code: string;
  };
  school?: {
    id: string;
    name: string;
    code: string;
  };
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  createdBy?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  updatedBy?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface SubjectFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  is_active?: string;
  class_id?: string;
  school_id?: string;
  branch_id?: string;
  sort_by?: string;
  sort_order?: string;
}

export interface SubjectStats {
  total: number;
  active: number;
  inactive: number;
  byCategory: Array<{
    category: string;
    count: number;
  }>;
}

export const subjectApi = {
  // Create subject
  create: async (data: Partial<Subject>) => {
    return apiCall('post', '/subjects', data);
  },

  // Get all subjects with pagination and filtering
  getAll: async (filters: SubjectFilters = {}) => {
    return apiCall('get', '/subjects', { params: filters });
  },

  // Get subject by ID
  getById: async (id: string) => {
    return apiCall('get', `/subjects/${id}`);
  },

  // Update subject
  update: async (id: string, data: Partial<Subject>) => {
    return apiCall('put', `/subjects/${id}`, data);
  },

  // Delete subject
  delete: async (id: string) => {
    return apiCall('delete', `/subjects/${id}`);
  },

  // Get subjects for dropdown
  getForDropdown: async (filters?: {
    class_id?: string;
    branch_id?: string;
    category?: string;
  }) => {
    return apiCall('get', '/subjects/dropdown', { params: filters });
  },

  // Get subject statistics
  getStats: async () => {
    return apiCall('get', '/subjects/stats');
  }
};
