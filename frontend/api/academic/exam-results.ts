import { apiCall } from '~/utils/api';

export const examResultApi = {
  // Get results by exam ID
  getByExamId: async (examId: string, filters: any = {}) => {
    const params = new URLSearchParams();
    if (filters.class_id) params.append('class_id', filters.class_id);
    if (filters.section_id) params.append('section_id', filters.section_id);
    if (filters.subject_id) params.append('subject_id', filters.subject_id);
    if (filters.grade) params.append('grade', filters.grade);

    return apiCall('get', `/exams/${examId}/results?${params.toString()}`);
  },

  // Create bulk results
  createBulk: async (examId: string, data: any) => {
    return apiCall('post', `/exams/${examId}/results/bulk`, data);
  },

  // Calculate grades for an exam
  calculateGrades: async (examId: string) => {
    return apiCall('post', `/exam-results/exams/${examId}/calculate-grades`);
  },

  // Export results
  export: async (examId: string, format: string = 'csv') => {
    return apiCall('get', `/exams/${examId}/results/export?format=${format}`);
  },

  // Get single result
  getById: async (resultId: string) => {
    return apiCall('get', `/exam-results/${resultId}`);
  },

  // Update result
  update: async (resultId: string, data: any) => {
    return apiCall('put', `/exam-results/${resultId}`, data);
  },

  // Delete result
  delete: async (resultId: string) => {
    return apiCall('delete', `/exam-results/${resultId}`);
  }
};
