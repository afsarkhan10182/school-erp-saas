import { createApiInstance } from '~/utils/api';

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
    const api = createApiInstance();
    const response = await api.get('/academic-years', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const api = createApiInstance();
    const response = await api.get(`/academic-years/${id}`);
    return response.data;
  },

  create: async (academicYearData: AcademicYearData) => {
    const api = createApiInstance();
    const response = await api.post('/academic-years', academicYearData);
    return response.data;
  },

  update: async (id: string, academicYearData: AcademicYearData) => {
    const api = createApiInstance();
    const response = await api.put(`/academic-years/${id}`, academicYearData);
    return response.data;
  },

  delete: async (id: string) => {
    const api = createApiInstance();
    const response = await api.delete(`/academic-years/${id}`);
    return response.data;
  },

  getDropdown: async (params?: string) => {
    const api = createApiInstance();
    const response = await api.get(`/academic-years/dropdown${params ? `?${params}` : ''}`);
    return response.data;
  },

  getCurrent: async (params?: string) => {
    const api = createApiInstance();
    const response = await api.get(`/academic-years/current${params ? `?${params}` : ''}`);
    return response.data;
  },

  setCurrent: async (id: string) => {
    const api = createApiInstance();
    const response = await api.post(`/academic-years/${id}/set-current`);
    return response.data;
  },

  syncSchools: async () => {
    const api = createApiInstance();
    const response = await api.post('/academic-years/sync-schools');
    return response.data;
  }
};
