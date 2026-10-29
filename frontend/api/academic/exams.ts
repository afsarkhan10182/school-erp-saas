import { createApiInstance, apiCall } from '~/utils/api';

export interface Exam {
  id: string;
  name: string;
  exam_type_id: string;
  type_id?: number;
  description?: string;
  instructions?: string;
  mark_distribution_ids?: string[];
  term_id?: string;
  academic_year?: string;
  is_active: boolean;
  publish_status?: boolean;
  result_status?: boolean;
  status?: 'draft' | 'scheduled' | 'marks_entered' | 'grades_calculated' | 'completed';
  school_id: string;
  branch_id: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  examType?: { id: string; name: string; code: string };
  term?: { id: string; name: string };
}

export interface ExamResult {
  id: string;
  marks_obtained: number;
  percentage: number;
  grade?: string;
  grade_points?: number;
  rank?: number;
  remarks?: string;
  is_absent: boolean;
  exam_id: string;
  student_id: string;
  school_id: string;
  branch_id: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
    roll_number?: string;
  };
}

export interface ExamFilters {
  page?: number;
  limit?: number;
  search?: string;
  exam_type?: string;
  status?: string;
  class_id?: string;
  section_id?: string;
  date_from?: string;
  date_to?: string;
  academic_year?: string;
  school_id?: string;
  branch_id?: string;
}

export interface ExamResultData {
  student_id: string;
  marks_obtained?: number;
  percentage?: number;
  grade?: string;
  grade_points?: number;
  rank?: number;
  remarks?: string;
  is_absent?: boolean;
}

export const examApi = {
  // Create exam
  create: async (data: Partial<Exam>) => {
    try {
      return await apiCall('post', '/exams', data);
    } catch (error) {
      throw error;
    }
  },

  // Get all exams with pagination and filtering
  getAll: async (filters: ExamFilters = {}) => {
    return apiCall('get', '/exams', { params: filters });
  },

  // Get exam by ID
  getById: async (id: string) => {
    return apiCall('get', `/exams/${id}`);
  },

  // Update exam
  update: async (id: string, data: Partial<Exam>) => {
    return apiCall('put', `/exams/${id}`, data);
  },

  // Delete exam
  delete: async (id: string) => {
    return apiCall('delete', `/exams/${id}`);
  },

  // Get exam statistics
  getStats: async (params?: { academic_year?: string; date_from?: string; date_to?: string }) => {
    return apiCall('get', '/exams/stats', { params });
  },

  // Bulk create exam results
  bulkCreateResults: async (examId: string, results: ExamResultData[]) => {
    return apiCall('post', `/exams/${examId}/results`, { results });
  },

  // Get exam results
  getResults: async (examId: string) => {
    return apiCall('get', `/exams/${examId}/results`);
  },

  // Update single exam result
  updateResult: async (resultId: string, data: Partial<ExamResult>) => {
    return apiCall('put', `/exams/results/${resultId}`, data);
  },

  // Export exam results
  exportResults: async (examId: string, format: 'csv' | 'json' = 'csv') => {
    return apiCall('get', `/exams/${examId}/results/export`, { params: { format } });
  },

  // Get student exam history
  getStudentHistory: async (
    studentId: string,
    params?: {
      page?: number;
      limit?: number;
      academic_year?: string;
      exam_type?: string;
    }
  ) => {
    return apiCall('get', `/exams/student/${studentId}/history`, { params });
  },

  // Calculate grade based on percentage
  calculateGrade: async (percentage: number) => {
    return apiCall('get', '/exams/calculate-grade', { params: { percentage } });
  },

  // Generate report card
  generateReportCard: async (
    studentId: string,
    params?: {
      academic_year?: string;
      exam_types?: string;
    }
  ) => {
    const api = createApiInstance();
    const response = await api.get(`/exams/student/${studentId}/report-card`, {
      params: { ...params, format: 'pdf' },
      responseType: 'blob'
    });
    return response;
  },

  // Bulk marks entry
  uploadMarksFile: async (examId: string, file: File) => {
    const api = createApiInstance();
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/exams/${examId}/upload-marks`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  downloadMarksTemplate: async (examId: string) => {
    const api = createApiInstance();
    const response = await api.get(`/exams/${examId}/template`, {
      responseType: 'blob'
    });
    return response;
  },

  bulkUpdateResults: async (examId: string, results: ExamResultData[]) => {
    return apiCall('put', `/exams/${examId}/results/bulk`, { results });
  },

  // Optimized exam results methods
  processBulkResultsOptimized: async (examId: string, results: ExamResultData[]) => {
    return apiCall('post', `/exams/${examId}/results/bulk-optimized`, { results });
  },

  getExamStatistics: async (examId: string) => {
    return apiCall('get', `/exams/${examId}/results/statistics`);
  },

  getResultAnalytics: async (examId: string, period?: string) => {
    return apiCall('get', `/exams/${examId}/results/analytics`, { params: { period } });
  },

  getClassPerformance: async (examId: string, classId: string) => {
    return apiCall('get', `/exams/${examId}/results/class/${classId}/performance`);
  },

  getStudentPerformanceHistory: async (studentId: string, academicYear: string) => {
    return apiCall('get', `/students/${studentId}/performance-history`, {
      params: { academic_year: academicYear }
    });
  }
};

export default examApi;
