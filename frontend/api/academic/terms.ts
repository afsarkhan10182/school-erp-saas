import { createApiInstance } from '~/utils/api';

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

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: {
    terms: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export const termApi = {
  // Get all terms with pagination and filtering
  getAll: async (filters: TermFilters = {}) => {
    const api = createApiInstance();
    const response = await api.get<PaginatedResponse<Term>>('/terms', { params: filters });
    return response.data;
  },

  // Get term by ID
  getById: async (id: string) => {
    const api = createApiInstance();
    const response = await api.get<ApiResponse<{ term: Term }>>(`/terms/${id}`);
    return response.data;
  },

  // Create term
  create: async (data: CreateTermData) => {
    const api = createApiInstance();
    const response = await api.post<ApiResponse<{ term: Term }>>('/terms', data);
    return response.data;
  },

  // Update term
  update: async (id: string, data: UpdateTermData) => {
    const api = createApiInstance();
    const response = await api.put<ApiResponse<{ term: Term }>>(`/terms/${id}`, data);
    return response.data;
  },

  // Delete term
  delete: async (id: string) => {
    const api = createApiInstance();
    const response = await api.delete<ApiResponse<{ message: string }>>(`/terms/${id}`);
    return response.data;
  },

  // Get current active term
  getCurrent: async (academicYearId?: string) => {
    const api = createApiInstance();
    const params = academicYearId ? { academic_year_id: academicYearId } : {};
    const response = await api.get<ApiResponse<{ term: Term }>>('/terms/current', { params });
    return response.data;
  },

  // Get terms for a specific academic year
  getByAcademicYear: async (academicYearId: string) => {
    const api = createApiInstance();
    const response = await api.get<ApiResponse<{ terms: Term[] }>>(
      `/terms/academic-year/${academicYearId}`
    );
    return response.data;
  }
};

export default termApi;
