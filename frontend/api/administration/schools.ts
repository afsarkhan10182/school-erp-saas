import { createApiInstance } from '~/utils/api';

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
    const api = createApiInstance();
    const response = await api.get('/schools', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const api = createApiInstance();
    const response = await api.get(`/schools/${id}`);
    return response.data;
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
    const api = createApiInstance();
    const response = await api.delete(`/schools/${id}`);
    return response.data;
  },

  // Module management (Super Admin controls, School Admin view-only)
  getModules: async (id: string) => {
    const api = createApiInstance();
    const response = await api.get(`/schools/${id}/modules`);
    return response.data;
  },

  updateModules: async (id: string, modules: string[], subscriptionPlan?: string) => {
    const api = createApiInstance();
    const response = await api.put(`/schools/${id}/modules`, { 
      modules, 
      subscription_plan: subscriptionPlan 
    });
    return response.data;
  },

  // Subscription plans
  getSubscriptionPlans: async () => {
    const api = createApiInstance();
    const response = await api.get('/schools/subscription-plans');
    return response.data;
  },

  requestUpgrade: async (schoolId: string, requestedPlan: string, reason: string) => {
    const api = createApiInstance();
    const response = await api.post(`/schools/${schoolId}/request-upgrade`, {
      requested_plan: requestedPlan,
      reason
    });
    return response.data;
  }
};
