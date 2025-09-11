import { createApiInstance } from '~/utils/api';

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
    const api = createApiInstance();
    const response = await api.get('/classes', { params });
    return response.data;
  },

  // Sections
  getSections: async (params?: AcademicParams) => {
    const api = createApiInstance();
    const response = await api.get('/sections', { params });
    return response.data;
  },

  // Subjects
  getSubjects: async (params?: AcademicParams) => {
    const api = createApiInstance();
    const response = await api.get('/subjects', { params });
    return response.data;
  },

  // Timetables
  getMyTimetable: async (params?: AcademicParams) => {
    const api = createApiInstance();
    const response = await api.get('/timetables/my-timetable', { params });
    return response.data;
  },

  // Academic Settings
  getSettings: async () => {
    const api = createApiInstance();
    const response = await api.get('/academic/settings');
    return response.data;
  }
};
