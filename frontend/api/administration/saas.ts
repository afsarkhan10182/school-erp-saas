import { createApiInstance } from '~/utils/api';

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
    const api = createApiInstance();
    const response = await api.get('/subscriptions/schools', { params });
    return response.data;
  },

  getSchoolWithSubscription: async (id: string) => {
    const api = createApiInstance();
    const response = await api.get(`/subscriptions/schools/${id}`);
    return response.data;
  },

  getPlans: async (params?: SaasParams) => {
    const api = createApiInstance();
    const response = await api.get('/subscriptions/plans', { params });
    return response.data;
  },

  // Get available modules for plan creation
  getAvailableModules: async () => {
    const api = createApiInstance();
    const response = await api.get('/subscriptions/available-modules');
    return response.data;
  },

  // Active plans for school/branch admins (limited fields)
  getActivePlansForSchools: async () => {
    const api = createApiInstance();
    const response = await api.get('/subscriptions/plans/active');
    return response.data;
  },

  getPlanById: async (id: string) => {
    const api = createApiInstance();
    const response = await api.get(`/subscriptions/plans/${id}`);
    return response.data;
  },

  createPlan: async (planData: any) => {
    const api = createApiInstance();
    const response = await api.post('/subscriptions/plans', planData);
    return response.data;
  },

  updatePlan: async (id: string, planData: any) => {
    const api = createApiInstance();
    const response = await api.put(`/subscriptions/plans/${id}`, planData);
    return response.data;
  },

  deletePlan: async (id: string) => {
    const api = createApiInstance();
    const response = await api.delete(`/subscriptions/plans/${id}`);
    return response.data;
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
    const api = createApiInstance();
    const response = await api.get(`/subscriptions/schools/${schoolId}/transactions`, { params });
    return response.data;
  },

  getMyTransactions: async (params?: {
    page?: number;
    limit?: number;
    payment_status?: string;
    payment_method?: string;
  }) => {
    const api = createApiInstance();
    const response = await api.get('/subscriptions/my-transactions', { params });
    return response.data;
  },

  createManualTransaction: async (transactionData: any) => {
    const api = createApiInstance();
    const response = await api.post(
      `/subscriptions/schools/${transactionData.school_id}/transactions`,
      transactionData
    );
    return response.data;
  },

  getSubscriptionStats: async () => {
    const api = createApiInstance();
    const response = await api.get('/subscriptions/stats');
    return response.data;
  },

  getUsage: async () => {
    const api = createApiInstance();
    const response = await api.get('/subscriptions/usage');
    return response.data;
  },

  suspendSchool: async (schoolId: string) => {
    const api = createApiInstance();
    const response = await api.patch(`/schools/${schoolId}/suspend`);
    return response.data;
  },

  reactivateSchool: async (schoolId: string) => {
    const api = createApiInstance();
    const response = await api.patch(`/schools/${schoolId}/reactivate`);
    return response.data;
  },

  // Renewal Requests
  getRenewalRequests: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    school_id?: string;
    request_type?: string;
  }) => {
    const api = createApiInstance();
    const response = await api.get('/subscriptions/renewal-requests', { params });
    return response.data;
  },

  createRenewalRequest: async (requestData: any) => {
    const api = createApiInstance();
    const response = await api.post('/subscriptions/renewal-requests', requestData);
    return response.data;
  },

  reviewRenewalRequest: async (requestId: string, reviewData: any) => {
    const api = createApiInstance();
    const response = await api.put(
      `/subscriptions/renewal-requests/${requestId}/review`,
      reviewData
    );
    return response.data;
  },

  // School admin: list own school's renewal requests
  getSchoolRenewalRequests: async (params?: { page?: number; limit?: number; status?: string }) => {
    const api = createApiInstance();
    const response = await api.get('/subscriptions/school/renewal-requests', { params });
    return response.data;
  },

  checkAllStatuses: async () => {
    const api = createApiInstance();
    const response = await api.post('/subscriptions/check-all-statuses');
    return response.data;
  },

  // Simple module toggle
  toggleSchoolModule: async (schoolId: string, moduleCode: string, enabled: boolean) => {
    const api = createApiInstance();
    const response = await api.post(`/subscriptions/schools/${schoolId}/toggle-module`, {
      module_code: moduleCode,
      enabled: enabled
    });
    return response.data;
  },

  getAvailableModulesForSchool: async (schoolId: string) => {
    const api = createApiInstance();
    const response = await api.get(`/subscriptions/schools/${schoolId}/available-modules`);
    return response.data;
  }
};
