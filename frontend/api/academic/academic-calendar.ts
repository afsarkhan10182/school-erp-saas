import { createApiInstance } from '~/utils/api';

export interface AcademicCalendarEvent {
  id: string;
  date: string;
  day_type: 'working' | 'holiday' | 'weekend' | 'exam' | 'event';
  description?: string;
  academic_year: string;
  school_id: string;
  branch_id: string;
  created_at: string;
  updated_at: string;
}

export interface AcademicCalendarFilters {
  academic_year?: string;
  day_type?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface CreateCalendarEventData {
  date: string;
  day_type: 'working' | 'holiday' | 'weekend' | 'exam' | 'event';
  description?: string;
  academic_year: string;
}

export interface UpdateCalendarEventData extends Partial<CreateCalendarEventData> {}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const AcademicCalendar = {
  // Get all calendar events with filtering and pagination
  async getAll(
    filters: AcademicCalendarFilters = {}
  ): Promise<{ data: { events: AcademicCalendarEvent[] } }> {
    const api = createApiInstance();
    const params = new URLSearchParams();

    if (filters.academic_year) params.append('academic_year', filters.academic_year);
    if (filters.day_type) params.append('day_type', filters.day_type);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/academic-calendar?${params.toString()}`);
    return response.data;
  },

  // Get calendar event by ID
  async getById(id: string): Promise<{ data: { event: AcademicCalendarEvent } }> {
    const api = createApiInstance();
    const response = await api.get(`/academic-calendar/${id}`);
    return response.data;
  },

  // Create new calendar event
  async create(data: CreateCalendarEventData): Promise<{ data: { event: AcademicCalendarEvent } }> {
    const api = createApiInstance();
    const response = await api.post('/academic-calendar', data);
    return response.data;
  },

  // Update calendar event
  async update(
    id: string,
    data: UpdateCalendarEventData
  ): Promise<{ data: { event: AcademicCalendarEvent } }> {
    const api = createApiInstance();
    const response = await api.put(`/academic-calendar/${id}`, data);
    return response.data;
  },

  // Delete calendar event
  async delete(id: string): Promise<{ message: string }> {
    const api = createApiInstance();
    const response = await api.delete(`/academic-calendar/${id}`);
    return response.data;
  },

  // Check if a date is a working day
  async checkWorkingDay(params: { date: string; academic_year?: string }): Promise<{
    data: { isWorkingDay: boolean; dayType: string; description?: string };
  }> {
    const api = createApiInstance();
    const queryParams = new URLSearchParams();
    queryParams.append('date', params.date);
    if (params.academic_year) {
      queryParams.append('academic_year', params.academic_year);
    }
    const response = await api.get(
      `/academic-calendar/check-working-day?${queryParams.toString()}`
    );
    return response.data;
  },

  // Bulk create calendar events
  async bulkCreate(
    events: CreateCalendarEventData[]
  ): Promise<{ data: { events: AcademicCalendarEvent[] } }> {
    const api = createApiInstance();
    const response = await api.post('/academic-calendar/bulk', { events });
    return response.data;
  }
};
