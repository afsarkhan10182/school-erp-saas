import { apiCall } from '~/utils/api';

export interface AcademicYearParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface AcademicYearData {
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  status?: string;
}

export const AcademicYears = {
  getAll: async (params?: AcademicYearParams) => {
    return apiCall('get', '/academic-years', { params });
  },

  getById: async (id: string) => {
    return apiCall('get', `/academic-years/${id}`);
  },

  create: async (academicYearData: AcademicYearData) => {
    return apiCall('post', '/academic-years', academicYearData);
  },

  update: async (id: string, academicYearData: AcademicYearData) => {
    return apiCall('put', `/academic-years/${id}`, academicYearData);
  },

  delete: async (id: string) => {
    return apiCall('delete', `/academic-years/${id}`);
  },

  getDropdown: async (params?: string) => {
    return apiCall('get', `/academic-years/dropdown${params ? `?${params}` : ''}`);
  },

  getCurrent: async (params?: string) => {
    return apiCall('get', `/academic-years/current${params ? `?${params}` : ''}`);
  },

  setCurrent: async (id: string) => {
    return apiCall('post', `/academic-years/${id}/set-current`);
  },

  syncSchools: async () => {
    return apiCall('post', '/academic-years/sync-schools');
  }
};
