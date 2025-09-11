import { createApiInstance } from '~/utils/api';

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
    const api = createApiInstance();
    const response = await api.get('/branches', { params });
    return response.data;
  },

  getBySchool: async (schoolId: string, params?: { page?: number; limit?: number }) => {
    const api = createApiInstance();
    const response = await api.get(`/branches/school/${schoolId}`, { params });
    return response.data;
  },

  getById: async (id: string) => {
    const api = createApiInstance();
    const response = await api.get(`/branches/${id}`);
    return response.data;
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
    const api = createApiInstance();
    const response = await api.delete(`/branches/${id}`);
    return response.data;
  },

  // Get branches for dropdown/select
  getForDropdown: async (params?: { school_id?: string; status?: string }) => {
    const api = createApiInstance();
    const response = await api.get('/branches/dropdown', { params });
    return response.data;
  }
};
