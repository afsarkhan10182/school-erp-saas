import { createApiInstance, apiCall } from '~/utils/api';

export interface Term {
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

export interface TermFilters {
  school_id?: string;
  branch_id?: string;
  academic_year?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateTermData {
  // CodeIgniter Style - Only 2 essential fields
  branch_id: string;
  name: string;
}

export interface UpdateTermData extends Partial<CreateTermData> {
  id: string;
}

export const termApi = {
  // Get all terms with optional filters
  async getAll(
    filters: TermFilters = {}
  ): Promise<{ data: Term[]; total: number; page: number; limit: number }> {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/terms?${queryString}` : '/terms';

    return await apiCall('get', endpoint);
  },

  // Get a single term by ID
  async getById(id: string): Promise<Term> {
    const response = await apiCall('get', `/terms/${id}`);
    return response.data;
  },

  // Create a new term
  async create(data: CreateTermData): Promise<Term> {
    const response = await apiCall('post', '/terms', data);
    return response.data;
  },

  // Update an existing term
  async update(id: string, data: Partial<CreateTermData>): Promise<Term> {
    const response = await apiCall('put', `/terms/${id}`, data);
    return response.data;
  },

  // Delete a term
  async delete(id: string): Promise<void> {
    await apiCall('delete', `/terms/${id}`);
  },

  // Get terms by academic year
  async getByAcademicYear(
    academicYear: string,
    schoolId: string,
    branchId?: string
  ): Promise<Term[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('academic_year', academicYear);
    queryParams.append('school_id', schoolId);
    if (branchId) {
      queryParams.append('branch_id', branchId);
    }

    const endpoint = `/terms?${queryParams.toString()}`;
    const response = await apiCall('get', endpoint);
    return response.data;
  },

  // Get current active term
  async getCurrent(schoolId: string, branchId?: string): Promise<Term | null> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('school_id', schoolId);
      if (branchId) {
        queryParams.append('branch_id', branchId);
      }

      const endpoint = `/terms/current?${queryParams.toString()}`;
      const response = await apiCall('get', endpoint);
      return response.data;
    } catch (error) {
      return null;
    }
  }
};
