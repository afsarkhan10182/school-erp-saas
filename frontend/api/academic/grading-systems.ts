import { apiCall } from '~/utils/api';

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

export interface Branch {
  id: string;
  name: string;
  code?: string;
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
  branch_id?: string;
  branch?: Branch;
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
    return apiCall('get', '/grading-systems', { params: filters });
  },

  // Get grading system by ID
  getById: async (id: string) => {
    return apiCall('get', `/grading-systems/${id}`);
  },

  // Get default grading system
  getDefault: async () => {
    return apiCall('get', '/grading-systems/default');
  },

  // Create grading system
  create: async (data: CreateGradingSystemData) => {
    return apiCall('post', '/grading-systems', data);
  },

  // Update grading system
  update: async (id: string, data: Partial<CreateGradingSystemData>) => {
    return apiCall('put', `/grading-systems/${id}`, data);
  },

  // Delete grading system
  delete: async (id: string) => {
    return apiCall('delete', `/grading-systems/${id}`);
  },

  // Set default grading system
  setDefault: async (id: string) => {
    return apiCall('put', `/grading-systems/${id}/set-default`);
  },

  // Test grade calculation
  testCalculation: async (percentage: number) => {
    return apiCall('get', '/grading-systems/test-calculation', { params: { percentage } });
  }
};

export default gradingSystemApi;
