import { apiCall } from '~/utils/api';

export interface DashboardParams {
  school_id?: string;
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

  getNotices: async (params?: DashboardParams) => {
    return apiCall('get', '/dashboard/notices', { params });
  },

  getTodayAttendance: async (params?: DashboardParams) => {
    return apiCall('get', '/dashboard/attendance-today', { params });
  },

  getOverdueFees: async (params?: DashboardParams) => {
    return apiCall('get', '/dashboard/overdue-fees', { params });
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

  getIncomeVsExpense: async (params?: DashboardParams) => {
    return apiCall('get', '/dashboard/income-vs-expense', { params });
  },

  getWeekendAttendance: async (params?: DashboardParams) => {
    return apiCall('get', '/dashboard/weekend-attendance', { params });
  },

  getAnnualFeesSummary: async (params?: DashboardParams) => {
    return apiCall('get', '/dashboard/annual-fees-summary', { params });
  },

  getAcademicYearMonths: async () => {
    return apiCall('get', '/dashboard/academic-year-months');
  },

  getOverviewReport: async () => {
    return apiCall('get', '/dashboard/overview-report');
  }
};
