import { createApiInstance, apiCall } from '~/utils/api';

export interface ExamSchedule {
  id: string;
  exam_id: string;
  class_id: string;
  section_id?: string;
  hall_id: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  duration: number;
  theory_marks?: number;
  practical_marks?: number;
  viva_marks?: number;
  assignment_marks?: number;
  total_marks?: number;
  pass_marks?: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  school_id: string;
  branch_id: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  exam?: {
    id: string;
    name: string;
    examType?: {
      id: string;
      name: string;
    };
  };
  class?: {
    id: string;
    name: string;
  };
  section?: {
    id: string;
    name: string;
  };
  subject?: {
    id: string;
    name: string;
    code?: string;
  };
  hall?: {
    id: string;
    name: string;
    capacity: number;
  };
  examHall?: {
    id: string;
    name: string;
    capacity: number;
  };
}

export interface ExamScheduleFilters {
  school_id?: string;
  branch_id?: string;
  exam_id?: string;
  class_id?: string;
  section_id?: string;
  hall_id?: string;
  exam_date?: string;
  from_date?: string;
  to_date?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface CreateExamScheduleData {
  exam_id: string;
  class_id: string;
  section_id?: string;
  hall_id: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  duration: number;
  theory_marks?: number;
  practical_marks?: number;
  viva_marks?: number;
  assignment_marks?: number;
  total_marks?: number;
  pass_marks?: number;
  school_id: string;
  branch_id: string;
}

export interface QuickScheduleData {
  exam_id: string;
  class_ids: string[];
  section_ids?: string[];
  starting_date: string;
  starting_time: string;
  duration_minutes: number;
  exam_hall_id?: string;
  mark_distribution?: {
    theory_marks: number;
    practical_marks: number;
    viva_marks: number;
    assignment_marks: number;
  };
  total_marks?: number;
  pass_marks?: number;
  school_id: string;
  branch_id: string;
}

export interface QuickScheduleResult {
  created_schedules: ExamSchedule[];
  errors: string[];
  success_count: number;
  error_count: number;
}

export interface UpdateExamScheduleData extends Partial<CreateExamScheduleData> {
  id: string;
}

export const examScheduleApi = {
  // Get all exam schedules with optional filters
  async getAll(
    filters: ExamScheduleFilters = {}
  ): Promise<{ schedules?: ExamSchedule[]; data?: ExamSchedule[]; pagination?: { page: number; limit: number; total: number; totalPages: number } }> {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/exam-schedules?${queryString}` : '/exam-schedules';

    return await apiCall('get', endpoint);
  },

  // Get a single exam schedule by ID
  async getById(id: string): Promise<ExamSchedule> {
    const response = await apiCall('get', `/exam-schedules/${id}`);
    return response.data;
  },

  // Create a new exam schedule
  async create(data: CreateExamScheduleData): Promise<ExamSchedule> {
    const response = await apiCall('post', '/exam-schedules', data);
    return response.data;
  },

  // Update an existing exam schedule
  async update(id: string, data: Partial<CreateExamScheduleData>): Promise<ExamSchedule> {
    const response = await apiCall('put', `/exam-schedules/${id}`, data);
    return response.data;
  },

  // Delete an exam schedule
  async delete(id: string): Promise<void> {
    await apiCall('delete', `/exam-schedules/${id}`);
  },

  // Get schedules by exam
  async getByExam(examId: string, schoolId: string, branchId?: string): Promise<ExamSchedule[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('exam_id', examId);
    queryParams.append('school_id', schoolId);
    if (branchId) {
      queryParams.append('branch_id', branchId);
    }

    const endpoint = `/exam-schedules?${queryParams.toString()}`;
    const response = await apiCall('get', endpoint);
    return response.data;
  },

  // Get schedules by class
  async getByClass(classId: string, schoolId: string, branchId?: string): Promise<ExamSchedule[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('class_id', classId);
    queryParams.append('school_id', schoolId);
    if (branchId) {
      queryParams.append('branch_id', branchId);
    }

    const endpoint = `/exam-schedules?${queryParams.toString()}`;
    const response = await apiCall('get', endpoint);
    return response.data;
  },

  // Get schedules by date range
  async getByDateRange(
    fromDate: string,
    toDate: string,
    schoolId: string,
    branchId?: string
  ): Promise<ExamSchedule[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('from_date', fromDate);
    queryParams.append('to_date', toDate);
    queryParams.append('school_id', schoolId);
    if (branchId) {
      queryParams.append('branch_id', branchId);
    }

    const endpoint = `/exam-schedules?${queryParams.toString()}`;
    const response = await apiCall('get', endpoint);
    return response.data;
  },

  // Check for schedule conflicts
  async checkConflicts(data: {
    hall_id: string;
    exam_date: string;
    start_time: string;
    end_time: string;
    exclude_id?: string;
  }): Promise<{ hasConflict: boolean; conflictingSchedules: ExamSchedule[] }> {
    const response = await apiCall('post', '/exam-schedules/check-conflicts', data);
    return response.data;
  },

  // Bulk create schedules
  async bulkCreate(
    schedules: CreateExamScheduleData[]
  ): Promise<{ 
    created_schedules?: ExamSchedule[]; 
    created?: ExamSchedule[];
    errors?: Array<{ schedule: any; error: string }>;
    success_count: number; 
    error_count: number;
  }> {
    const response = await apiCall('post', '/exam-schedules/bulk', { schedules });
    return response.data || response;
  },

  // Update schedule status
  async updateStatus(id: string, status: string): Promise<ExamSchedule> {
    const response = await apiCall('patch', `/exam-schedules/${id}/status`, { status });
    return response.data;
  },

  // Quick schedule creation ()
  async createQuickSchedule(data: QuickScheduleData): Promise<QuickScheduleResult> {
    const response = await apiCall('post', '/exam-schedules/quick', data);
    return response.data;
  }
};
