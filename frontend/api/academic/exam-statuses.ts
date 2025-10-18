import { apiCall } from '~/utils/api';

export interface ExamStatus {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  school_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ExamStatusResponse {
  success: boolean;
  data: ExamStatus[];
  message?: string;
}

export interface ExamStatusSingleResponse {
  success: boolean;
  data: ExamStatus;
  message?: string;
}

export interface ExamStatusPaginatedResponse {
  success: boolean;
  data: {
    statuses: ExamStatus[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message?: string;
}

export const examStatusApi = {
  /**
   * Get all exam statuses with pagination and filtering
   */
  getAll: async (params: any = {}): Promise<ExamStatusPaginatedResponse> => {
    return apiCall('get', '/exam-statuses', { params });
  },

  /**
   * Get active exam statuses only
   */
  getActive: async (): Promise<ExamStatusResponse> => {
    return apiCall('get', '/exam-statuses/active');
  },

  /**
   * Get exam statuses for dropdown
   */
  getForDropdown: async (): Promise<ExamStatusResponse> => {
    return apiCall('get', '/exam-statuses/dropdown');
  },

  /**
   * Get exam status by ID
   */
  getById: async (id: string): Promise<ExamStatusSingleResponse> => {
    return apiCall('get', `/exam-statuses/${id}`);
  },

  /**
   * Create new exam status
   */
  create: async (data: Partial<ExamStatus>): Promise<ExamStatusSingleResponse> => {
    return apiCall('post', '/exam-statuses', data);
  },

  /**
   * Update exam status
   */
  update: async ({
    id,
    ...data
  }: Partial<ExamStatus> & { id: string }): Promise<ExamStatusSingleResponse> => {
    return apiCall('put', `/exam-statuses/${id}`, data);
  },

  /**
   * Delete exam status
   */
  delete: async (id: string): Promise<{ success: boolean; message?: string }> => {
    return apiCall('delete', `/exam-statuses/${id}`);
  }
};
