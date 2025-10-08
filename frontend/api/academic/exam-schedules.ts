import { apiCall } from '~/utils/api';

export interface ExamSchedule {
  id: string;
  exam_id: string;
  exam_date: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  exam_hall_id?: string;
  invigilator_id?: string;
  additional_invigilators?: string[];
  status_id: string;
  seating_arrangement?: any;
  special_instructions?: string;
  is_rescheduled: boolean;
  rescheduled_reason?: string;
  original_date?: string;
  is_active: boolean;
  branch_id: string;
  school_id: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  // Relations
  exam?: {
    id: string;
    name: string;
    exam_type_id: string;
    class_id: string;
    subject_id?: string;
    max_marks: number;
    weightage: number;
  };
  exam_hall?: {
    id: string;
    name: string;
    code: string;
    capacity: number;
  };
  invigilator?: {
    id: string;
    name: string;
    email: string;
  };
  status?: {
    id: string;
    name: string;
    code: string;
    color?: string;
  };
}

export interface ExamScheduleFilters {
  page?: number;
  limit?: number;
  exam_id?: string;
  branch_id?: string;
  school_id?: string;
  exam_date?: string;
  status_id?: string;
  exam_hall_id?: string;
  invigilator_id?: string;
  is_active?: boolean;
}

export interface CreateExamScheduleData {
  exam_id: string;
  exam_date: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  exam_hall_id?: string;
  invigilator_id?: string;
  additional_invigilators?: string[];
  status_id: string;
  seating_arrangement?: any;
  special_instructions?: string;
  branch_id: string;
  school_id: string;
}

export interface UpdateExamScheduleData extends Partial<CreateExamScheduleData> {
  id: string;
}

export const examScheduleApi = {
  // Get all exam schedules
  getAll: (filters?: ExamScheduleFilters) =>
    apiCall<{ schedules: ExamSchedule[]; total: number; page: number; limit: number }>(
      'GET',
      '/exam-schedules',
      { params: filters }
    ),

  // Get exam schedule by ID
  getById: (id: string) => apiCall<{ schedule: ExamSchedule }>('GET', `/exam-schedules/${id}`),

  // Get schedules for a specific exam
  getByExam: (examId: string) =>
    apiCall<{ schedules: ExamSchedule[] }>('GET', `/exam-schedules/exam/${examId}`),

  // Create new exam schedule
  create: (data: CreateExamScheduleData) =>
    apiCall<{ schedule: ExamSchedule }>('POST', '/exam-schedules', data),

  // Update exam schedule
  update: (data: UpdateExamScheduleData) =>
    apiCall<{ schedule: ExamSchedule }>('PUT', `/exam-schedules/${data.id}`, data),

  // Delete exam schedule
  delete: (id: string) => apiCall<{ message: string }>('DELETE', `/exam-schedules/${id}`)
};
