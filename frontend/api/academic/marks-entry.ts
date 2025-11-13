import { createApiInstance, apiCall } from '~/utils/api';

export interface StudentForMarksEntry {
  id: string;
  serial_number: number;
  name: string;
  roll_number: string;
  admission_number: string;
  category: string;
  class?: { name: string };
  section?: { name: string };
  existing_marks?: {
    theory_marks_obtained?: number;
    practical_marks_obtained?: number;
    viva_marks_obtained?: number;
    assignment_marks_obtained?: number;
    marks_obtained?: number;
    is_absent?: boolean;
  };
}

export interface MarkDistribution {
  theory_marks: number;
  practical_marks: number;
  viva_marks: number;
  assignment_marks: number;
  total_marks: number;
  pass_marks: number;
}

export interface MarksEntryFilters {
  exam_id: string;
  class_id: string;
  section_id?: string;
  subject_id?: string;
  school_id?: string;
  branch_id?: string;
}

export interface StudentMarksData {
  student_id: string;
  theory_marks_obtained?: number;
  practical_marks_obtained?: number;
  viva_marks_obtained?: number;
  assignment_marks_obtained?: number;
  is_absent?: boolean;
}

export interface SaveMarksData {
  exam_id: string;
  marks_data: StudentMarksData[];
}

export interface MarksEntrySummary {
  total_students: number;
  marks_entered: number;
  absent_students: number;
  pending: number;
}

export const marksEntryApi = {
  // Get students for marks entry
  getStudents: async (filters: MarksEntryFilters) => {
    return apiCall('get', '/marks-entry/students', { params: filters });
  },

  // Save marks for multiple students
  saveMarks: async (data: SaveMarksData) => {
    return apiCall('post', '/marks-entry/save', data);
  },

  // Get marks entry summary
  getSummary: async (filters: MarksEntryFilters) => {
    return apiCall('get', '/marks-entry/summary', { params: filters });
  }
};
