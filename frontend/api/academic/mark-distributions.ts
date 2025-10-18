import { createApiInstance, apiCall } from '~/utils/api';

export interface MarkDistribution {
  id: string;
  name: string;
  type: 'theory_only' | 'practical_only' | 'theory_practical' | 'comprehensive';
  description?: string;
  theory_marks: number;
  practical_marks: number;
  viva_marks: number;
  assignment_marks: number;
  total_marks: number;
  pass_marks: number;
  is_active: boolean;
  school_id: string;
  branch_id: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface MarkDistributionFilters {
  school_id?: string;
  branch_id?: string;
  type?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateMarkDistributionData {
  name: string;
  type: string;
  description?: string;
  theory_marks: number;
  practical_marks: number;
  viva_marks: number;
  assignment_marks: number;
  total_marks: number;
  pass_marks: number;
  school_id: string;
  branch_id: string;
}

export interface UpdateMarkDistributionData extends Partial<CreateMarkDistributionData> {
  id: string;
}

export const markDistributionApi = {
  // Get all mark distributions with optional filters
  async getAll(
    filters: MarkDistributionFilters = {}
  ): Promise<{ data: MarkDistribution[]; total: number; page: number; limit: number }> {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/mark-distributions?${queryString}` : '/mark-distributions';

    return await apiCall('get', endpoint);
  },

  // Get a single mark distribution by ID
  async getById(id: string): Promise<MarkDistribution> {
    const response = await apiCall('get', `/mark-distributions/${id}`);
    return response.data;
  },

  // Create a new mark distribution
  async create(data: CreateMarkDistributionData): Promise<MarkDistribution> {
    const response = await apiCall('post', '/mark-distributions', data);
    return response.data;
  },

  // Update an existing mark distribution
  async update(id: string, data: Partial<CreateMarkDistributionData>): Promise<MarkDistribution> {
    const response = await apiCall('put', `/mark-distributions/${id}`, data);
    return response.data;
  },

  // Delete a mark distribution
  async delete(id: string): Promise<void> {
    await apiCall('delete', `/mark-distributions/${id}`);
  },

  // Get distributions by type
  async getByType(type: string, schoolId: string, branchId?: string): Promise<MarkDistribution[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('type', type);
    queryParams.append('school_id', schoolId);
    if (branchId) {
      queryParams.append('branch_id', branchId);
    }

    const endpoint = `/mark-distributions?${queryParams.toString()}`;
    const response = await apiCall('get', endpoint);
    return response.data;
  },

  // Get active distributions
  async getActive(schoolId: string, branchId?: string): Promise<MarkDistribution[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('is_active', 'true');
    queryParams.append('school_id', schoolId);
    if (branchId) {
      queryParams.append('branch_id', branchId);
    }

    const endpoint = `/mark-distributions?${queryParams.toString()}`;
    const response = await apiCall('get', endpoint);
    return response.data;
  },

  // Toggle active status
  async toggleActive(id: string): Promise<MarkDistribution> {
    const response = await apiCall('patch', `/mark-distributions/${id}/toggle-active`);
    return response.data;
  }
};
