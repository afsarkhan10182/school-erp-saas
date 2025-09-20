import { apiCall } from '~/utils/api';

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
    return apiCall('get', '/fee-structures', { params });
  },

  getWithContext: async (params?: { payment_model?: string; page?: number; limit?: number }) => {
    return apiCall('get', '/fee-structures/with-context', { params });
  },

  getById: async (id: string) => {
    return apiCall('get', `/fee-structures/${id}`);
  },

  create: async (data: FeeStructureData) => {
    return apiCall('post', '/fee-structures', data);
  },

  update: async (id: string, data: FeeStructureData) => {
    return apiCall('put', `/fee-structures/${id}`, data);
  },

  delete: async (id: string) => {
    return apiCall('delete', `/fee-structures/${id}`);
  },

  // New clone functionality
  clone: async (id: string, cloneData: any) => {
    return apiCall('post', `/fee-structures/${id}/clone`, cloneData);
  }
};
