import { apiCall } from '~/utils/api';

export interface Term {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  academic_year_id: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  school_id: string;
  branch_id?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  academicYear?: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
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
}

export interface TermFilters {
  page?: number;
  limit?: number;
  academic_year_id?: string;
  status?: string;
  search?: string;
}

export interface CreateTermData {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  academic_year_id: string;
  status?: 'upcoming' | 'active' | 'completed' | 'cancelled';
}

export interface UpdateTermData extends Partial<CreateTermData> {}

export const termApi = {
  // Get all terms with pagination and filtering
  getAll: async (filters: TermFilters = {}) => {
    return apiCall('get', '/terms', { params: filters });
  },

  // Get term by ID
  getById: async (id: string) => {
    return apiCall('get', `/terms/${id}`);
  },

  // Create term
  create: async (data: CreateTermData) => {
    return apiCall('post', '/terms', data);
  },

  // Update term
  update: async (id: string, data: UpdateTermData) => {
    return apiCall('put', `/terms/${id}`, data);
  },

  // Delete term
  delete: async (id: string) => {
    return apiCall('delete', `/terms/${id}`);
  },

  // Get current active term
  getCurrent: async (academicYearId?: string) => {
    const params = academicYearId ? { academic_year_id: academicYearId } : {};
    return apiCall('get', '/terms/current', { params });
  },

  // Get terms for a specific academic year
  getByAcademicYear: async (academicYearId: string) => {
    return apiCall('get', `/terms/academic-year/${academicYearId}`);
  }
};

export default termApi;
