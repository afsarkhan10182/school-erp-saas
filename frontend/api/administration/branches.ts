import { createApiInstance, apiCall } from '~/utils/api';

export interface BranchParams {
  page?: number;
  limit?: number;
  school_id?: string;
  status?: string;
}

export interface BranchData {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  phone: string;
  email: string;
  school_id: string;
  status?: string;
}

export const Branches = {
  getAll: async (params?: BranchParams) => {
    return apiCall('get', '/branches', { params });
  },

  getBySchool: async (schoolId: string, params?: { page?: number; limit?: number }) => {
    return apiCall('get', `/branches/school/${schoolId}`, { params });
  },

  getById: async (id: string) => {
    return apiCall('get', `/branches/${id}`);
  },

  create: async (branchData: BranchData | FormData) => {
    const api = createApiInstance();
    const response = await api.post('/branches', branchData, {
      headers: branchData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
    });
    return response.data;
  },

  update: async (id: string, branchData: BranchData | FormData) => {
    const api = createApiInstance();
    const response = await api.put(`/branches/${id}`, branchData, {
      headers: branchData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
    });
    return response.data;
  },

  delete: async (id: string) => {
    return apiCall('delete', `/branches/${id}`);
  },

  // Get branches for dropdown/select
  getForDropdown: async (params?: { school_id?: string; status?: string }) => {
    return apiCall('get', '/branches/dropdown', { params });
  }
};
