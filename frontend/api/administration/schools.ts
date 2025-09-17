import { createApiInstance, apiCall } from '~/utils/api';

export interface SchoolParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface SchoolData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  website?: string;
  logo?: File;
  status?: string;
}

export const Schools = {
  getAll: async (params?: SchoolParams) => {
    return apiCall('get', '/schools', { params });
  },

  getById: async (id: string) => {
    return apiCall('get', `/schools/${id}`);
  },

  create: async (schoolData: FormData) => {
    const api = createApiInstance();
    const response = await api.post('/schools', schoolData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  update: async (id: string, schoolData: FormData) => {
    const api = createApiInstance();
    const response = await api.put(`/schools/${id}`, schoolData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  delete: async (id: string) => {
    return apiCall('delete', `/schools/${id}`);
  },

  // Module management (Super Admin controls, School Admin view-only)
  getModules: async (id: string) => {
    return apiCall('get', `/schools/${id}/modules`);
  },

  updateModules: async (id: string, modules: string[], subscriptionPlan?: string) => {
    return apiCall('put', `/schools/${id}/modules`, {
      modules,
      subscription_plan: subscriptionPlan
    });
  },

  // Subscription plans
  getSubscriptionPlans: async () => {
    return apiCall('get', '/schools/subscription-plans');
  },

  requestUpgrade: async (schoolId: string, requestedPlan: string, reason: string) => {
    return apiCall('post', `/schools/${schoolId}/request-upgrade`, {
      requested_plan: requestedPlan,
      reason
    });
  }
};
