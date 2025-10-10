import { apiCall } from '~/utils/api';

export const examReportApi = {
  // Get generated reports by exam ID
  getByExamId: async (examId: string) => {
    return apiCall('get', `/exams/${examId}/reports`);
  },

  // Preview report
  preview: async (examId: string, config: any) => {
    return apiCall('post', `/exams/${examId}/reports/preview`, config);
  },

  // Generate report
  generate: async (examId: string, config: any) => {
    return apiCall('post', `/exams/${examId}/reports/generate`, config);
  },

  // Download report
  download: async (reportId: string) => {
    return apiCall('get', `/exam-reports/${reportId}/download`);
  },

  // Delete report
  delete: async (reportId: string) => {
    return apiCall('delete', `/exam-reports/${reportId}`);
  },

  // Get single report
  getById: async (reportId: string) => {
    return apiCall('get', `/exam-reports/${reportId}`);
  }
};
