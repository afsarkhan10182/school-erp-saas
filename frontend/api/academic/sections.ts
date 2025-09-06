import { createApiInstance } from '~/utils/api';

export interface SectionParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: string;
  school_id?: string;
  branch_id?: string;
  class_id?: string;
}

export interface SectionData {
  name: string;
  code: string;
  description?: string;
  class_id: string;
  school_id: string;
  branch_id?: string;
  is_active?: boolean;
}

export const Sections = {
  getAll: async (params?: SectionParams) => {
    const api = createApiInstance();
    const response = await api.get('/sections', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const api = createApiInstance();
    const response = await api.get(`/sections/${id}`);
    return response.data;
  },

  create: async (sectionData: SectionData) => {
    const api = createApiInstance();
    const response = await api.post('/sections', sectionData);
    return response.data;
  },

  update: async (id: string, sectionData: SectionData) => {
    const api = createApiInstance();
    const response = await api.put(`/sections/${id}`, sectionData);
    return response.data;
  },

  delete: async (id: string) => {
    const api = createApiInstance();
    const response = await api.delete(`/sections/${id}`);
    return response.data;
  },

  getDropdown: async (params?: string) => {
    const api = createApiInstance();
    const response = await api.get(`/sections/dropdown${params ? `?${params}` : ''}`);
    return response.data;
  }
};
