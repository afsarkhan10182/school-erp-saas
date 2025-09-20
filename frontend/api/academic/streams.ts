import { apiCall } from '~/utils/api';

export interface StreamParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: string;
  class_id?: string;
  branch_id?: string;
}

export interface StreamData {
  name: string;
  code: string;
  description?: string;
  class_id: string;
  school_id: string;
  branch_id?: string;
  is_active?: boolean;
}

export const Streams = {
  getAll: async (params?: StreamParams) => {
    return apiCall('get', '/streams', { params });
  },

  getById: async (id: string) => {
    return apiCall('get', `/streams/${id}`);
  },

  create: async (streamData: StreamData) => {
    return apiCall('post', '/streams', streamData);
  },

  update: async (id: string, streamData: StreamData) => {
    return apiCall('put', `/streams/${id}`, streamData);
  },

  delete: async (id: string) => {
    return apiCall('delete', `/streams/${id}`);
  },

  // Get streams for dropdown/select
  getForDropdown: async (params?: {
    school_id?: string;
    branch_id?: string;
    class_id?: string;
  }) => {
    return apiCall('get', '/streams/dropdown', { params });
  }
};
