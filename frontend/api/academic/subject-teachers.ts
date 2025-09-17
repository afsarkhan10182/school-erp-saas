import { apiCall } from '~/utils/api';

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
    return apiCall('get', '/subject-teachers', { params: filters });
  },

  // Get subject-teacher assignment by ID
  getById: async (id: string) => {
    return apiCall('get', `/subject-teachers/${id}`);
  },

  // Create subject-teacher assignment
  create: async (data: Partial<SubjectTeacher>) => {
    return apiCall('post', '/subject-teachers', data);
  },

  // Update subject-teacher assignment
  update: async (id: string, data: Partial<SubjectTeacher>) => {
    return apiCall('put', `/subject-teachers/${id}`, data);
  },

  // Delete subject-teacher assignment
  delete: async (id: string) => {
    return apiCall('delete', `/subject-teachers/${id}`);
  },

  // Get assignments by subject
  getBySubject: async (subjectId: string, params?: { academic_year?: string }) => {
    return apiCall('get', `/subject-teachers/subject/${subjectId}`, { params });
  },

  // Get assignments by teacher
  getByTeacher: async (teacherId: string, params?: { academic_year?: string }) => {
    return apiCall('get', `/subject-teachers/teacher/${teacherId}`, { params });
  },

  // Get teacher workload data
  getWorkload: async (filters: SubjectTeacherFilters = {}) => {
    return apiCall('get', '/subject-teachers/workload', { params: filters });
  }
};

export default subjectTeacherApi;
