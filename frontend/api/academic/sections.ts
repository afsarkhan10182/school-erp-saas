import { apiCall } from '~/utils/api';

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
    return apiCall('get', '/sections', { params });
  },

  getById: async (id: string) => {
    return apiCall('get', `/sections/${id}`);
  },

  create: async (sectionData: SectionData) => {
    return apiCall('post', '/sections', sectionData);
  },

  update: async (id: string, sectionData: SectionData) => {
    return apiCall('put', `/sections/${id}`, sectionData);
  },

  delete: async (id: string) => {
    return apiCall('delete', `/sections/${id}`);
  },

  getDropdown: async (params?: string) => {
    return apiCall('get', `/sections/dropdown${params ? `?${params}` : ''}`);
  }
};
