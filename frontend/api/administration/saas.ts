import { createApiInstance, apiCall } from '~/utils/api';

export interface SaasParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  subscription_plan?: string;
  id?: string;
  is_active?: boolean;
}

export const Saas = {
  getSchoolsWithSubscriptions: async (params?: SaasParams) => {
    return apiCall('get', '/subscriptions/schools', { params });
  },

  getSchoolWithSubscription: async (id: string) => {
    return apiCall('get', `/subscriptions/schools/${id}`);
  },

  getPlans: async (params?: SaasParams) => {
    return apiCall('get', '/subscriptions/plans', { params });
  },

  // Get available modules for plan creation
  getAvailableModules: async () => {
    return apiCall('get', '/subscriptions/available-modules');
  },

  // Active plans for school/branch admins (limited fields)
  getActivePlansForSchools: async () => {
    return apiCall('get', '/subscriptions/plans/active');
  },

  getPlanById: async (id: string) => {
    return apiCall('get', `/subscriptions/plans/${id}`);
  },

  createPlan: async (planData: any) => {
    return apiCall('post', '/subscriptions/plans', planData);
  },

  updatePlan: async (id: string, planData: any) => {
    return apiCall('put', `/subscriptions/plans/${id}`, planData);
  },

  deletePlan: async (id: string) => {
    return apiCall('delete', `/subscriptions/plans/${id}`);
  },

  createSchoolWithSubscription: async (schoolData: FormData) => {
    const api = createApiInstance();
    const response = await api.post('/subscriptions/schools', schoolData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  updateSchoolSubscription: async (schoolId: string, schoolData: FormData) => {
    const api = createApiInstance();
    const response = await api.put(`/subscriptions/schools/${schoolId}`, schoolData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getSchoolTransactions: async (
    schoolId: string,
    params?: { page?: number; limit?: number; payment_status?: string; payment_method?: string }
  ) => {
    return apiCall('get', `/subscriptions/schools/${schoolId}/transactions`, { params });
  },

  getMyTransactions: async (params?: {
    page?: number;
    limit?: number;
    payment_status?: string;
    payment_method?: string;
  }) => {
    return apiCall('get', '/subscriptions/my-transactions', { params });
  },

  createManualTransaction: async (transactionData: any) => {
    return apiCall(
      'post',
      `/subscriptions/schools/${transactionData.school_id}/transactions`,
      transactionData
    );
  },

  getSubscriptionStats: async () => {
    return apiCall('get', '/subscriptions/stats');
  },

  getUsage: async () => {
    return apiCall('get', '/subscriptions/usage');
  },

  suspendSchool: async (schoolId: string) => {
    return apiCall('patch', `/schools/${schoolId}/suspend`);
  },

  reactivateSchool: async (schoolId: string) => {
    return apiCall('patch', `/schools/${schoolId}/reactivate`);
  },

  // Renewal Requests
  getRenewalRequests: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    school_id?: string;
    request_type?: string;
  }) => {
    return apiCall('get', '/subscriptions/renewal-requests', { params });
  },

  createRenewalRequest: async (requestData: any) => {
    return apiCall('post', '/subscriptions/renewal-requests', requestData);
  },

  reviewRenewalRequest: async (requestId: string, reviewData: any) => {
    return apiCall('put', `/subscriptions/renewal-requests/${requestId}/review`, reviewData);
  },

  // School admin: list own school's renewal requests
  getSchoolRenewalRequests: async (params?: { page?: number; limit?: number; status?: string }) => {
    return apiCall('get', '/subscriptions/school/renewal-requests', { params });
  },

  checkAllStatuses: async () => {
    return apiCall('post', '/subscriptions/check-all-statuses');
  },

  // Simple module toggle
  toggleSchoolModule: async (schoolId: string, moduleCode: string, enabled: boolean) => {
    return apiCall('post', `/subscriptions/schools/${schoolId}/toggle-module`, {
      module_code: moduleCode,
      enabled: enabled
    });
  },

  getAvailableModulesForSchool: async (schoolId: string) => {
    return apiCall('get', `/subscriptions/schools/${schoolId}/available-modules`);
  }
};
