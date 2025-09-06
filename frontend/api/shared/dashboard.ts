import { createApiInstance } from '~/utils/api';

export interface DashboardParams {
  branch_id?: string;
  new_students_days?: number;
  academic_year?: string;
  limit?: number;
  months?: number;
}

export const Dashboard = {
  getStats: async (params?: DashboardParams) => {
    const api = createApiInstance();
    const response = await api.get('/dashboard/stats', { params });
    return response.data;
  },

  getFeeCollectionSummary: async (params?: DashboardParams) => {
    const api = createApiInstance();
    const response = await api.get('/dashboard/fee-collection-summary', { params });
    return response.data;
  },

  getRecentActivities: async (params?: DashboardParams) => {
    const api = createApiInstance();
    const response = await api.get('/dashboard/recent-activities', { params });
    return response.data;
  },

  getStudentsChartData: async (params?: DashboardParams) => {
    const api = createApiInstance();
    const response = await api.get('/dashboard/students-chart', { params });
    return response.data;
  },

  getFeesChartData: async (params?: DashboardParams) => {
    const api = createApiInstance();
    const response = await api.get('/dashboard/fees-chart', { params });
    return response.data;
  },

  getStudentDistributionData: async (params?: DashboardParams) => {
    const api = createApiInstance();
    const response = await api.get('/dashboard/student-distribution', { params });
    return response.data;
  },

  getFeeTrendData: async (params?: DashboardParams) => {
    const api = createApiInstance();
    const response = await api.get('/dashboard/fee-trend', { params });
    return response.data;
  },

  getAcademicYearMonths: async () => {
    const api = createApiInstance();
    const response = await api.get('/dashboard/academic-year-months');
    return response.data;
  }
};
