import { createApiInstance } from '~/utils/api';

export interface ClassSubjectMapping {
  id: string;
  name: string;
  code: string;
  description?: string;
  class_id: string;
  academic_year: string;
  total_credit_hours: number;
  is_active: boolean;
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
  subjects?: Array<{
    id: string;
    name: string;
    code: string;
    category: string;
    credit_hours: number;
    SubjectGroupSubject?: {
      sort_order: number;
      is_required: boolean;
      weightage: number;
    };
  }>;
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

export interface ClassSubjectMappingFilters {
  page?: number;
  limit?: number;
  class_id?: string;
  subject_id?: string;
  academic_year?: string;
  search?: string;
}

export interface CreateClassSubjectMappingData {
  name: string;
  code: string;
  description?: string;
  class_id: string;
  academic_year: string;
  subject_ids?: string[];
  total_credit_hours?: number;
}

export interface UpdateClassSubjectMappingData extends Partial<CreateClassSubjectMappingData> {}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: {
    mappings: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export const classSubjectMappingApi = {
  // Get all class-subject mappings with pagination and filtering
  getAll: async (filters: ClassSubjectMappingFilters = {}) => {
    const api = createApiInstance();
    const response = await api.get<PaginatedResponse<ClassSubjectMapping>>(
      '/class-subject-mappings',
      { params: filters }
    );
    return response.data;
  },

  // Get class-subject mapping by ID
  getById: async (id: string) => {
    const api = createApiInstance();
    const response = await api.get<ApiResponse<{ mapping: ClassSubjectMapping }>>(
      `/class-subject-mappings/${id}`
    );
    return response.data;
  },

  // Create class-subject mapping
  create: async (data: CreateClassSubjectMappingData) => {
    const api = createApiInstance();
    const response = await api.post<ApiResponse<{ mapping: ClassSubjectMapping }>>(
      '/class-subject-mappings',
      data
    );
    return response.data;
  },

  // Update class-subject mapping
  update: async (id: string, data: UpdateClassSubjectMappingData) => {
    const api = createApiInstance();
    const response = await api.put<ApiResponse<{ mapping: ClassSubjectMapping }>>(
      `/class-subject-mappings/${id}`,
      data
    );
    return response.data;
  },

  // Delete class-subject mapping
  delete: async (id: string) => {
    const api = createApiInstance();
    const response = await api.delete<ApiResponse<{ message: string }>>(
      `/class-subject-mappings/${id}`
    );
    return response.data;
  },

  // Get subjects for a specific class
  getSubjectsByClass: async (classId: string, academicYear?: string) => {
    const api = createApiInstance();
    const params = academicYear ? { academic_year: academicYear } : {};
    const response = await api.get<ApiResponse<{ mappings: ClassSubjectMapping[] }>>(
      `/class-subject-mappings/class/${classId}`,
      { params }
    );
    return response.data;
  },

  // Get classes for a specific subject
  getClassesBySubject: async (subjectId: string, academicYear?: string) => {
    const api = createApiInstance();
    const params = academicYear ? { academic_year: academicYear } : {};
    const response = await api.get<ApiResponse<{ mappings: any[] }>>(
      `/class-subject-mappings/subject/${subjectId}`,
      { params }
    );
    return response.data;
  }
};

export default classSubjectMappingApi;
