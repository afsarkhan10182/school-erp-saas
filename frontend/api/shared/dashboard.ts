import { apiCall } from '~/utils/api';

export interface DashboardParams {
  branch_id?: string;
  new_students_days?: number;
  academic_year?: string;
  limit?: number;
  months?: number;
}

export const Dashboard = {
  getStats: async (params?: DashboardParams) => {
    return apiCall('get', '/dashboard/stats', { params });
  },

  getFeeCollectionSummary: async (params?: DashboardParams) => {
    return apiCall('get', '/dashboard/fee-collection-summary', { params });
  },

  getRecentActivities: async (params?: DashboardParams) => {
    return apiCall('get', '/dashboard/recent-activities', { params });
  },

  getStudentsChartData: async (params?: DashboardParams) => {
    return apiCall('get', '/dashboard/students-chart', { params });
  },

  getFeesChartData: async (params?: DashboardParams) => {
    return apiCall('get', '/dashboard/fees-chart', { params });
  },

  getStudentDistributionData: async (params?: DashboardParams) => {
    return apiCall('get', '/dashboard/student-distribution', { params });
  },

  getFeeTrendData: async (params?: DashboardParams) => {
    return apiCall('get', '/dashboard/fee-trend', { params });
  },

  getAcademicYearMonths: async () => {
    return apiCall('get', '/dashboard/academic-year-months');
  }
};
