import { apiCall } from '~/utils/api';

export interface Timetable {
  id: string;
  name: string;
  description?: string;
  academic_year: string;
  class_id: string;
  section_id?: string;
  school_id: string;
  branch_id?: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  class?: {
    id: string;
    name: string;
    code: string;
  };
  section?: {
    id: string;
    name: string;
  };
  slots?: TimetableSlot[];
}

export interface TimetableSlot {
  id: string;
  timetable_id: string;
  day_of_week: number; // Changed to numeric (1-7) to match backend
  period_number: number;
  start_time: string;
  end_time: string;
  subject_id?: string;
  teacher_id?: string;
  room_number?: string;
  slot_type: 'regular' | 'break' | 'lunch' | 'assembly' | 'free' | 'exam';
  is_active: boolean;
  notes?: string;
  subject?: {
    id: string;
    name: string;
    code: string;
  };
  teacher?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface CreateTimetableData {
  name: string;
  description?: string;
  academic_year: string;
  class_id: string;
  section_id?: string;
  is_active?: boolean;
  is_default?: boolean;
}

export interface UpdateTimetableData extends Partial<CreateTimetableData> {
  id: string;
}

export interface CreateTimetableSlotData {
  timetable_id: string;
  day_of_week: number; // Changed to numeric (1-7) to match backend
  period_number: number;
  start_time: string;
  end_time: string;
  subject_id?: string;
  teacher_id?: string;
  room_number?: string;
  slot_type?: string;
  notes?: string;
}

export interface UpdateTimetableSlotData extends Partial<CreateTimetableSlotData> {
  id: string;
}

export interface TimetableFilters {
  page?: number;
  limit?: number;
  search?: string;
  class_id?: string;
  section_id?: string;
  academic_year?: string;
  is_active?: boolean;
}

// Response interfaces
export interface TimetableResponse {
  success: boolean;
  data: Timetable;
  message?: string;
}

export interface TimetablesResponse {
  success: boolean;
  data: {
    timetables: Timetable[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message?: string;
}

export interface TimetableSlotResponse {
  success: boolean;
  data: TimetableSlot;
  message?: string;
}

// Timetable API object
export const Timetables = {
  // Get all timetables (Admin only)
  getAll: async (filters: TimetableFilters = {}) => {
    return apiCall('get', '/timetables', { params: filters });
  },

  // Get timetable by ID
  getById: async (id: string) => {
    return apiCall('get', `/timetables/${id}`);
  },

  // Create new timetable
  create: async (data: CreateTimetableData) => {
    return apiCall('post', '/timetables', data);
  },

  // Update timetable
  update: async (id: string, data: Partial<CreateTimetableData>) => {
    return apiCall('put', `/timetables/${id}`, data);
  },

  // Delete timetable
  delete: async (id: string) => {
    return apiCall('delete', `/timetables/${id}`);
  },

  // Get my timetable (Teacher/Admin)
  getMyTimetable: async (academic_year?: string) => {
    const params = academic_year ? { academic_year } : {};
    return apiCall('get', '/timetables/my-timetable', { params });
  },

  // Get teacher timetable
  getTeacherTimetable: async (teacherId: string, academic_year?: string) => {
    const params = academic_year ? { academic_year } : {};
    return apiCall('get', `/timetables/teacher/${teacherId}`, { params });
  },

  // Get all teacher timetables
  getAllTeacherTimetables: async (filters: TimetableFilters = {}) => {
    return apiCall('get', '/timetables/teachers/all', { params: filters });
  },

  // Get timetable for specific class and section
  getTimetableForClass: async (
    classId: string,
    sectionId: string,
    filters: { academic_year?: string } = {}
  ) => {
    return apiCall('get', `/timetables/class/${classId}/section/${sectionId}`, { params: filters });
  },

  // Timetable Slots CRUD
  createSlot: async (data: CreateTimetableSlotData) => {
    return apiCall('post', `/timetables/${data.timetable_id}/slots`, data);
  },

  updateSlot: async (
    timetableId: string,
    slotId: string,
    data: Partial<CreateTimetableSlotData>
  ) => {
    return apiCall('put', `/timetables/${timetableId}/slots/${slotId}`, data);
  },

  deleteSlot: async (timetableId: string, slotId: string) => {
    return apiCall('delete', `/timetables/${timetableId}/slots/${slotId}`);
  },

  // Get slots for a specific day
  getSlotsForDay: async (timetableId: string, dayOfWeek: number) => {
    return apiCall('get', `/timetables/${timetableId}/slots/day/${dayOfWeek}`);
  },

  // Get all slots for a timetable
  getTimetableSlots: async (timetableId: string) => {
    return apiCall('get', `/timetables/${timetableId}/slots`);
  }
};
