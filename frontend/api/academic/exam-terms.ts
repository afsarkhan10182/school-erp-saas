import { createApiInstance, apiCall } from '~/utils/api';

export interface ExamTerm {
  id: string;
  name: string;
  code: string;
  description?: string;
  start_date: string;
  end_date: string;
  academic_year: string;
  is_active: boolean;
  school_id: string;
  branch_id?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  exams_count?: number;
  status?: 'upcoming' | 'active' | 'completed' | 'cancelled';
}

export interface ExamTermFilters {
  academic_year?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateExamTermData {
  // Only 2 essential fields
  branch_id: string;
  name: string;
}

export interface UpdateExamTermData extends Partial<CreateExamTermData> {
  id: string;
}

export const examTermApi = {
  // Get all exam terms with optional filters
  async getAll(
    filters: ExamTermFilters = {}
  ): Promise<{ data: ExamTerm[]; total: number; page: number; limit: number }> {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/exam-terms?${queryString}` : '/exam-terms';

    return await apiCall('get', endpoint);
  },

  // Get a single exam term by ID
  async getById(id: string): Promise<ExamTerm> {
    const response = await apiCall('get', `/exam-terms/${id}`);
    return response.data;
  },

  // Create a new exam term
  async create(data: CreateExamTermData): Promise<any> {
    const response = await apiCall('post', '/exam-terms', data);
    return response; // Return full response to check success flag
  },

  // Update an existing exam term
  async update(id: string, data: Partial<CreateExamTermData>): Promise<any> {
    const response = await apiCall('put', `/exam-terms/${id}`, data);
    return response; // Return full response to check success flag
  },

  // Delete an exam term
  async delete(id: string): Promise<any> {
    const response = await apiCall('delete', `/exam-terms/${id}`);
    return response; // Return full response to check success flag
  },

  // Get exam terms by academic year
  async getByAcademicYear(academicYear: string): Promise<ExamTerm[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('academic_year', academicYear);

    const endpoint = `/exam-terms?${queryParams.toString()}`;
    const response = await apiCall('get', endpoint);
    return response.data;
  },

  // Get current active exam term
  async getCurrent(): Promise<ExamTerm | null> {
    try {
      const response = await apiCall('get', '/exam-terms/current');
      return response.data;
    } catch (error) {
      return null;
    }
  }
};
