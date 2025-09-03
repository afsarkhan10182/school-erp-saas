import { createApiInstance } from '~/utils/api';

export interface FeeTypeParams {
  page?: number;
  limit?: number;
  category?: string;
}

export interface FeeTypeData {
  name: string;
  code: string;
  category: string;
  description?: string;
  is_active?: boolean;
}

export const FeeTypes = {
  getAll: async (params?: FeeTypeParams) => {
    const api = createApiInstance();
    const response = await api.get('/fee-types', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const api = createApiInstance();
    const response = await api.get(`/fee-types/${id}`);
    return response.data;
  },

  create: async (feeTypeData: FeeTypeData) => {
    const api = createApiInstance();
    const response = await api.post('/fee-types', feeTypeData);
    return response.data;
  },

  update: async (id: string, feeTypeData: FeeTypeData) => {
    const api = createApiInstance();
    const response = await api.put(`/fee-types/${id}`, feeTypeData);
    return response.data;
  },

  delete: async (id: string) => {
    const api = createApiInstance();
    const response = await api.delete(`/fee-types/${id}`);
    return response.data;
  }
};
