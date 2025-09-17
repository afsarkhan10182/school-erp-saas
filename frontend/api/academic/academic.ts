import { apiCall } from '~/utils/api';

export interface AcademicParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  class_id?: string;
  academic_year?: string;
}

export const Academic = {
  // Classes
  getClasses: async (params?: AcademicParams) => {
    return apiCall('get', '/classes', { params });
  },

  // Sections
  getSections: async (params?: AcademicParams) => {
    return apiCall('get', '/sections', { params });
  },

  // Subjects
  getSubjects: async (params?: AcademicParams) => {
    return apiCall('get', '/subjects', { params });
  },

  // Timetables
  getMyTimetable: async (params?: AcademicParams) => {
    return apiCall('get', '/timetables/my-timetable', { params });
  },

  // Academic Settings
  getSettings: async () => {
    return apiCall('get', '/settings/academic');
  }
};
