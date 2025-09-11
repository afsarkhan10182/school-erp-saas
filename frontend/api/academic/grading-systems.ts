import { createApiInstance } from '~/utils/api';
import type { ApiResponse, PaginatedResponse } from '~/types';

export interface GradeScale {
  id?: string;
  grade: string;
  min_percentage: number;
  max_percentage: number;
  grade_points?: number;
  description?: string;
  is_passing?: boolean;
  sort_order?: number;
}

export interface GradingSystem {
  id: string;
  name: string;
  code: string;
  description?: string;
  grade_type: 'letter' | 'number' | 'percentage' | 'custom';
  passing_percentage: number;
  max_grade_points?: number;
  is_active: boolean;
  is_default: boolean;
  school_id: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  gradeScales?: GradeScale[];
}

export interface GradingSystemFilters {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
}

export interface CreateGradingSystemData {
  name: string;
  code: string;
  description?: string;
  grade_type?: 'letter' | 'number' | 'percentage' | 'custom';
  passing_percentage?: number;
  max_grade_points?: number;
  is_active?: boolean;
  is_default?: boolean;
  gradeScales: GradeScale[];
}

export interface UpdateGradingSystemData extends Partial<CreateGradingSystemData> {
  id: string;
}

export const gradingSystemApi = {
  // Get all grading systems
  getAll: async (filters: GradingSystemFilters = {}) => {
    const api = createApiInstance();
    const response = await api.get<PaginatedResponse<GradingSystem>>('/grading-systems', {
      params: filters
    });
    return response.data;
  },

  // Get grading system by ID
  getById: async (id: string) => {
    const api = createApiInstance();
    const response = await api.get<ApiResponse<GradingSystem>>(`/grading-systems/${id}`);
    return response.data;
  },

  // Get default grading system
  getDefault: async () => {
    const api = createApiInstance();
    const response = await api.get<ApiResponse<GradingSystem>>('/grading-systems/default');
    return response.data;
  },

  // Create grading system
  create: async (data: CreateGradingSystemData) => {
    const api = createApiInstance();
    const response = await api.post<ApiResponse<GradingSystem>>('/grading-systems', data);
    return response.data;
  },

  // Update grading system
  update: async (id: string, data: Partial<CreateGradingSystemData>) => {
    const api = createApiInstance();
    const response = await api.put<ApiResponse<GradingSystem>>(`/grading-systems/${id}`, data);
    return response.data;
  },

  // Delete grading system
  delete: async (id: string) => {
    const api = createApiInstance();
    const response = await api.delete<ApiResponse<{ message: string }>>(`/grading-systems/${id}`);
    return response.data;
  },

  // Set default grading system
  setDefault: async (id: string) => {
    const api = createApiInstance();
    const response = await api.put<ApiResponse<GradingSystem>>(
      `/grading-systems/${id}/set-default`
    );
    return response.data;
  },

  // Test grade calculation
  testCalculation: async (percentage: number) => {
    const api = createApiInstance();
    const response = await api.get<
      ApiResponse<{ grade: string; grade_points?: number; is_passing: boolean }>
    >('/grading-systems/test-calculation', { params: { percentage } });
    return response.data;
  }
};

export default gradingSystemApi;
