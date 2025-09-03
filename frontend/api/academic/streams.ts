import { createApiInstance } from '~/utils/api';

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
    const api = createApiInstance();
    const response = await api.get('/streams', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const api = createApiInstance();
    const response = await api.get(`/streams/${id}`);
    return response.data;
  },

  create: async (streamData: StreamData) => {
    const api = createApiInstance();
    const response = await api.post('/streams', streamData);
    return response.data;
  },

  update: async (id: string, streamData: StreamData) => {
    const api = createApiInstance();
    const response = await api.put(`/streams/${id}`, streamData);
    return response.data;
  },

  delete: async (id: string) => {
    const api = createApiInstance();
    const response = await api.delete(`/streams/${id}`);
    return response.data;
  },

  // Get streams for dropdown/select
  getForDropdown: async (params?: { school_id?: string; branch_id?: string; class_id?: string }) => {
    const api = createApiInstance();
    const response = await api.get('/streams/dropdown', { params });
    return response.data;
  }
}; 