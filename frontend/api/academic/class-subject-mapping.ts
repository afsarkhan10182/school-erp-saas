import { apiCall } from '~/utils/api';

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

export const classSubjectMappingApi = {
  // Get all class-subject mappings with pagination and filtering
  getAll: async (filters: ClassSubjectMappingFilters = {}) => {
    return apiCall('get', '/class-subject-mappings', { params: filters });
  },

  // Get class-subject mapping by ID
  getById: async (id: string) => {
    return apiCall('get', `/class-subject-mappings/${id}`);
  },

  // Create class-subject mapping
  create: async (data: CreateClassSubjectMappingData) => {
    return apiCall('post', '/class-subject-mappings', data);
  },

  // Update class-subject mapping
  update: async (id: string, data: UpdateClassSubjectMappingData) => {
    return apiCall('put', `/class-subject-mappings/${id}`, data);
  },

  // Delete class-subject mapping
  delete: async (id: string) => {
    return apiCall('delete', `/class-subject-mappings/${id}`);
  },

  // Get subjects for a specific class
  getSubjectsByClass: async (classId: string, academicYear?: string) => {
    const params = academicYear ? { academic_year: academicYear } : {};
    return apiCall('get', `/class-subject-mappings/class/${classId}`, { params });
  },

  // Get classes for a specific subject
  getClassesBySubject: async (subjectId: string, academicYear?: string) => {
    const params = academicYear ? { academic_year: academicYear } : {};
    return apiCall('get', `/class-subject-mappings/subject/${subjectId}`, { params });
  }
};

export default classSubjectMappingApi;
