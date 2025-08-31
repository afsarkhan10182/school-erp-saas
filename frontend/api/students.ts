import { createApiInstance } from '~/utils/api';
import type { ApiResponse, PaginatedResponse } from '~/types';

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
}

export interface StudentFilters {
  page?: number;
  limit?: number;
  search?: string;
  class_id?: string;
  section_id?: string;
  status?: string;
}

export const Student = {
  // Get all students with pagination and filtering
  getAll: async (filters: StudentFilters = {}) => {
    const api = createApiInstance();
    const response = await api.get<PaginatedResponse<Student>>('/students', { params: filters });
    return response.data;
  },

  // Get student by ID
  getById: async (id: string) => {
    const api = createApiInstance();
    const response = await api.get<ApiResponse<Student>>(`/students/${id}`);
    return response.data;
  }
};

export default Student;
