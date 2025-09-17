import { apiCall } from '~/utils/api';

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
    return apiCall('get', '/fee-types', { params });
  },

  getById: async (id: string) => {
    return apiCall('get', `/fee-types/${id}`);
  },

  create: async (feeTypeData: FeeTypeData) => {
    return apiCall('post', '/fee-types', feeTypeData);
  },

  update: async (id: string, feeTypeData: FeeTypeData) => {
    return apiCall('put', `/fee-types/${id}`, feeTypeData);
  },

  delete: async (id: string) => {
    return apiCall('delete', `/fee-types/${id}`);
  }
};
