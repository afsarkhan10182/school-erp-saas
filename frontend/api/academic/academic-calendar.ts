import { createApiInstance } from '~/utils/api';

export interface CalendarParams {
  date: string;
  academic_year?: string;
  date_from: string;
  date_to: string;
}

export interface CalendarEntry {
  date: string;
  day_type: string;
  description?: string;
  academic_year: string;
}

export interface BulkCalendarData {
  entries: CalendarEntry[];
}

export const AcademicCalendar = {
  checkWorkingDay: async (params: { date: string; academic_year?: string }) => {
    const api = createApiInstance();
    const response = await api.get('/academic-calendar/check-working-day', { params });
    return response.data;
  },

  getCalendar: async (params: { date_from: string; date_to: string; academic_year?: string }) => {
    const api = createApiInstance();
    const response = await api.get('/academic-calendar', { params });
    return response.data;
  },

  upsertEntry: async (data: CalendarEntry) => {
    const api = createApiInstance();
    const response = await api.post('/academic-calendar', data);
    return response.data;
  },

  bulkCreate: async (data: BulkCalendarData) => {
    const api = createApiInstance();
    const response = await api.post('/academic-calendar/bulk', data);
    return response.data;
  }
};
