import { createApiInstance } from '~/utils/api';
import type { ApiResponse, PaginatedResponse } from '~/types';

export interface SubjectTeacher {
  id: string;
  subject_id: string;
  teacher_id: string;
  class_id?: string;
  section_id?: string;
  is_primary: boolean;
  academic_year: string;
  school_id: string;
  branch_id: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  subject?: {
    id: string;
    name: string;
    code: string;
  };
  teacher?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  class?: {
    id: string;
    name: string;
    code: string;
  };
  section?: {
    id: string;
    name: string;
  };
}

export interface SubjectTeacherFilters {
  page?: number;
  limit?: number;
  subject_id?: string;
  teacher_id?: string;
  class_id?: string;
  section_id?: string;
  academic_year?: string;
  branch_id?: string;
}

export const subjectTeacherApi = {
  // Get all subject-teacher assignments with pagination and filtering
  getAll: async (filters: SubjectTeacherFilters = {}) => {
    const api = createApiInstance();
    const response = await api.get<PaginatedResponse<SubjectTeacher>>('/subject-teachers', { params: filters });
    return response.data;
  },

  // Get subject-teacher assignment by ID
  getById: async (id: string) => {
    const api = createApiInstance();
    const response = await api.get<ApiResponse<SubjectTeacher>>(`/subject-teachers/${id}`);
    return response.data;
  },

  // Create subject-teacher assignment
  create: async (data: Partial<SubjectTeacher>) => {
    const api = createApiInstance();
    const response = await api.post<ApiResponse<SubjectTeacher>>('/subject-teachers', data);
    return response.data;
  },

  // Update subject-teacher assignment
  update: async (id: string, data: Partial<SubjectTeacher>) => {
    const api = createApiInstance();
    const response = await api.put<ApiResponse<SubjectTeacher>>(`/subject-teachers/${id}`, data);
    return response.data;
  },

  // Delete subject-teacher assignment
  delete: async (id: string) => {
    const api = createApiInstance();
    const response = await api.delete<ApiResponse<{ message: string }>>(`/subject-teachers/${id}`);
    return response.data;
  },

  // Get assignments by subject
  getBySubject: async (subjectId: string, params?: { academic_year?: string }) => {
    const api = createApiInstance();
    const response = await api.get<ApiResponse<SubjectTeacher[]>>(`/subject-teachers/subject/${subjectId}`, { params });
    return response.data;
  },

  // Get assignments by teacher
  getByTeacher: async (teacherId: string, params?: { academic_year?: string }) => {
    const api = createApiInstance();
    const response = await api.get<ApiResponse<SubjectTeacher[]>>(`/subject-teachers/teacher/${teacherId}`, { params });
    return response.data;
  },

  // Get teacher workload data
  getWorkload: async (filters: SubjectTeacherFilters = {}) => {
    const api = createApiInstance();
    const response = await api.get<ApiResponse<{ workload: any[], stats: any }>>('/subject-teachers/workload', { params: filters });
    return response.data;
  }
};

export default subjectTeacherApi;
