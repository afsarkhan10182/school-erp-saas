import { apiCall } from '~/utils/api';

export const examPositionApi = {
  // Get positions by exam ID
  getByExamId: async (examId: string, filters: any = {}) => {
    const params = new URLSearchParams();
    if (filters.class_id) params.append('class_id', filters.class_id);
    if (filters.section_id) params.append('section_id', filters.section_id);
    if (filters.subject_id) params.append('subject_id', filters.subject_id);

    return apiCall('get', `/exams/${examId}/positions?${params.toString()}`);
  },

  // Calculate positions for an exam
  calculatePositions: async (examId: string) => {
    return apiCall('post', `/exams/${examId}/calculate-positions`);
  },

  // Export positions
  exportPositions: async (examId: string, filters: any = {}) => {
    const params = new URLSearchParams();
    if (filters.class_id) params.append('class_id', filters.class_id);
    if (filters.section_id) params.append('section_id', filters.section_id);
    if (filters.subject_id) params.append('subject_id', filters.subject_id);

    return apiCall('get', `/exams/${examId}/positions/export?${params.toString()}`);
  },

  // Get single position
  getById: async (positionId: string) => {
    return apiCall('get', `/exam-positions/${positionId}`);
  },

  // Update position
  update: async (positionId: string, data: any) => {
    return apiCall('put', `/exam-positions/${positionId}`, data);
  },

  // Delete position
  delete: async (positionId: string) => {
    return apiCall('delete', `/exam-positions/${positionId}`);
  }
};
