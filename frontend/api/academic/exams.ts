import { createApiInstance } from '~/utils/api';
import type { ApiResponse, PaginatedResponse } from '~/types';

export interface Exam {
  id: string;
  name: string;
  exam_type: 'unit_test' | 'mid_term' | 'final' | 'semester' | 'annual' | 'mock_test';
  weightage: number;
  max_marks: number;
  exam_date: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  academic_year: string;
  status: 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  instructions?: string;
  class_id: string;
  section_id?: string;
  subject_id?: string;
  school_id: string;
  branch_id: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  class?: { id: string; name: string; code: string };
  section?: { id: string; name: string };
  subject?: { id: string; name: string; code: string };
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
    const api = createApiInstance();
    try {
      const response = await api.post<ApiResponse<Exam>>('/exams', data);
      return response.data;
    } catch (error) {
      console.error('Exam API create error:', error);
      throw error;
    }
  },

  // Get all exams with pagination and filtering
  getAll: async (filters: ExamFilters = {}) => {
    const api = createApiInstance();
    const response = await api.get<PaginatedResponse<Exam>>('/exams', { params: filters });
    return response.data;
  },

  // Get exam by ID
  getById: async (id: string) => {
    const api = createApiInstance();
    const response = await api.get<ApiResponse<Exam>>(`/exams/${id}`);
    return response.data;
  },

  // Update exam
  update: async (id: string, data: Partial<Exam>) => {
    const api = createApiInstance();
    const response = await api.put<ApiResponse<Exam>>(`/exams/${id}`, data);
    return response.data;
  },

  // Delete exam
  delete: async (id: string) => {
    const api = createApiInstance();
    const response = await api.delete<ApiResponse<{ message: string }>>(`/exams/${id}`);
    return response.data;
  },

  // Get exam statistics
  getStats: async (params?: { academic_year?: string; date_from?: string; date_to?: string }) => {
    const api = createApiInstance();
    const response = await api.get<ApiResponse<any>>('/exams/stats', { params });
    return response.data;
  },

  // Bulk create exam results
  bulkCreateResults: async (examId: string, results: ExamResultData[]) => {
    const api = createApiInstance();
    const response = await api.post<ApiResponse<{ message: string; results_count: number }>>(
      `/exams/${examId}/results`,
      { results }
    );
    return response.data;
  },

  // Get exam results
  getResults: async (examId: string) => {
    const api = createApiInstance();
    const response = await api.get<
      ApiResponse<{
        exam: Exam;
        results: ExamResult[];
        summary: {
          total_students: number;
          present_students: number;
          absent_students: number;
          average_percentage: number;
          highest_percentage: number;
          lowest_percentage: number;
          grade_distribution: Record<string, number>;
        };
      }>
    >(`/exams/${examId}/results`);
    return response.data;
  },

  // Update single exam result
  updateResult: async (resultId: string, data: Partial<ExamResult>) => {
    const api = createApiInstance();
    const response = await api.put<ApiResponse<{ message: string; result: ExamResult }>>(
      `/exams/results/${resultId}`,
      data
    );
    return response.data;
  },

  // Export exam results
  exportResults: async (examId: string, format: string = 'pdf') => {
    const api = createApiInstance();
    const response = await api.get<ApiResponse<any>>(`/exams/${examId}/results/export`, {
      params: { format }
    });
    return response.data;
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
    const api = createApiInstance();
    const response = await api.get<PaginatedResponse<ExamResult>>(
      `/exams/student/${studentId}/history`,
      { params }
    );
    return response.data;
  },

  // Calculate grade based on percentage
  calculateGrade: async (percentage: number) => {
    const api = createApiInstance();
    const response = await api.get<
      ApiResponse<{ grade: string; grade_points?: number; is_passing: boolean }>
    >('/exams/calculate-grade', { params: { percentage } });
    return response.data;
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
      params,
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
    const api = createApiInstance();
    const response = await api.put(`/exams/${examId}/results/bulk`, { results });
    return response.data;
  },

  // Optimized exam results methods
  processBulkResultsOptimized: async (examId: string, results: ExamResultData[]) => {
    const api = createApiInstance();
    const response = await api.post(`/exams/${examId}/results/bulk-optimized`, { results });
    return response.data;
  },

  getExamStatistics: async (examId: string) => {
    const api = createApiInstance();
    const response = await api.get(`/exams/${examId}/results/statistics`);
    return response.data;
  },

  getResultAnalytics: async (examId: string, period?: string) => {
    const api = createApiInstance();
    const response = await api.get(`/exams/${examId}/results/analytics`, {
      params: { period }
    });
    return response.data;
  },

  getClassPerformance: async (examId: string, classId: string) => {
    const api = createApiInstance();
    const response = await api.get(`/exams/${examId}/results/class/${classId}/performance`);
    return response.data;
  },

  getStudentPerformanceHistory: async (studentId: string, academicYear: string) => {
    const api = createApiInstance();
    const response = await api.get(`/students/${studentId}/performance-history`, {
      params: { academic_year: academicYear }
    });
    return response.data;
  }
};

export default examApi;
