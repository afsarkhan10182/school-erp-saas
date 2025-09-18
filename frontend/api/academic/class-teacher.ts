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
  page?: number;
  limit?: number;
}

export interface CreateClassTeacherData {
  class_id: string;
  section_id?: string;
  teacher_id: string;
  academic_year: string;
}

export interface UpdateClassTeacherData {
  class_id?: string;
  section_id?: string;
  teacher_id?: string;
  academic_year?: string;
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

class ClassTeacherAPI {
  async getAll(filters: ClassTeacherFilters = {}): Promise<ClassTeachersResponse> {
    return apiCall('get', '/class-teachers', { params: filters });
  }

  async getById(id: string): Promise<ClassTeacherResponse> {
    return apiCall('get', `/class-teachers/${id}`);
  }

  async create(data: CreateClassTeacherData): Promise<ClassTeacherResponse> {
    return apiCall('post', '/class-teachers', data);
  }

  async update(id: string, data: UpdateClassTeacherData): Promise<ClassTeacherResponse> {
    return apiCall('put', `/class-teachers/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiCall('delete', `/class-teachers/${id}`);
  }
}

export const classTeacherApi = new ClassTeacherAPI();
