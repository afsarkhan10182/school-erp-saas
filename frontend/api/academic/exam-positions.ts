import { createApiInstance, apiCall } from '~/utils/api';

export interface StudentForPosition {
  id: string;
  name: string;
  roll_number: string;
  class?: { name: string };
  section?: { name: string };
  total_marks?: number;
  percentage?: number;
  grade?: string;
  position: number;
  teacher_comment?: string;
  principal_comment?: string;
  is_absent?: boolean;
  is_passed?: boolean;
}

export interface PositionFilters {
  exam_id: string;
  class_id: string;
  section_id?: string;
  school_id?: string;
  branch_id?: string;
}

export interface CalculatePositionsData {
  exam_id: string;
  class_id: string;
  school_id: string;
  branch_id: string;
  section_id?: string;
  calculation_method: 'total_marks' | 'percentage' | 'grade_points';
  tie_breaking_method: 'average' | 'first' | 'manual';
  include_absent: boolean;
}

export interface SavePositionsData {
  exam_id: string;
  class_id: string;
  school_id: string;
  branch_id: string;
  positions: Array<{
    student_id: string;
    position: number;
    teacher_comment?: string;
    principal_comment?: string;
  }>;
}

export const examPositionsApi = {
  // Get students for position management
  getStudents: async (filters: PositionFilters) => {
    return apiCall('get', '/exam-positions/students', { params: filters });
  },

  // Calculate positions automatically
  calculate: async (data: CalculatePositionsData) => {
    return apiCall('post', '/exam-positions/calculate', data);
  },

  // Save positions
  save: async (data: SavePositionsData) => {
    return apiCall('post', '/exam-positions/save', data);
  },

  // Get position statistics
  getStats: async (examId: string, classId: string) => {
    return apiCall('get', `/exam-positions/stats`, {
      params: { exam_id: examId, class_id: classId }
    });
  }
};
