import { createApiInstance } from '~/utils/api';

export interface FeeStructureParams {
  page?: number;
  limit?: number;
  academic_year?: string;
  class_id?: string;
  fee_type_id?: string;
  search?: string;
}

export interface FeeStructureData {
  name: string;
  academic_year: string;
  class_id: string;
  fee_type_id: string;
  amount: number;
  payment_model: 'monthly' | 'installment';
  description?: string;
  is_active?: boolean;
}

export const FeeStructures = {
  getAll: async (params?: FeeStructureParams) => {
    const api = createApiInstance();
    const response = await api.get('/fee-structures', { params });
    return response.data;
  },

  getWithContext: async (params?: { payment_model?: string; page?: number; limit?: number }) => {
    const api = createApiInstance();
    const response = await api.get('/fee-structures/with-context', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const api = createApiInstance();
    const response = await api.get(`/fee-structures/${id}`);
    return response.data;
  },

  create: async (data: FeeStructureData) => {
    const api = createApiInstance();
    const response = await api.post('/fee-structures', data);
    return response.data;
  },

  update: async (id: string, data: FeeStructureData) => {
    const api = createApiInstance();
    const response = await api.put(`/fee-structures/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const api = createApiInstance();
    const response = await api.delete(`/fee-structures/${id}`);
    return response.data;
  },

  // New clone functionality
  clone: async (id: string, cloneData: any) => {
    const api = createApiInstance();
    const response = await api.post(`/fee-structures/${id}/clone`, cloneData);
    return response.data;
  }
};
