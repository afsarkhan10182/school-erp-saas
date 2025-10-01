import { apiCall } from '~/utils/api';

export interface ClassTeacher {
  id: string;
  class_id: string;
  section_id?: string;
  teacher_id: string;
  academic_year: string;
  school_id: string;
  branch_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  class?: {
    id: string;
    name: string;
    code: string;
  };
  section?: {
    id: string;
    name: string;
  };
  teacher?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface ClassTeacherFilters {
  class_id?: string;
  section_id?: string;
  academic_year?: string;
  branch_id?: string;
  page?: number;
  limit?: number;
}

export interface CreateClassTeacherData {
  class_id: string;
  section_id?: string;
  stream_id?: string;
  teacher_id: string;
  academic_year: string;
  branch_id: string;
}

export interface UpdateClassTeacherData {
  class_id?: string;
  section_id?: string;
  stream_id?: string;
  teacher_id?: string;
  academic_year?: string;
  branch_id?: string;
}

export interface ClassTeachersResponse {
  success: boolean;
  data: {
    classTeachers: ClassTeacher[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message: string;
}

export interface ClassTeacherResponse {
  success: boolean;
  data: {
    allocation: ClassTeacher;
  };
  message: string;
}

export const ClassTeachers = {
  getAll: async (filters: ClassTeacherFilters = {}) => {
    return apiCall('get', '/class-teachers', { params: filters });
  },

  getById: async (id: string) => {
    return apiCall('get', `/class-teachers/${id}`);
  },

  create: async (data: CreateClassTeacherData) => {
    return apiCall('post', '/class-teachers', data);
  },

  update: async (id: string, data: UpdateClassTeacherData) => {
    return apiCall('put', `/class-teachers/${id}`, data);
  },

  delete: async (id: string) => {
    return apiCall('delete', `/class-teachers/${id}`);
  }
};
