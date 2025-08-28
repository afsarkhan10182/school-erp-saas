import { ref } from 'vue';
import { useCookie } from 'nuxt/app';
import apiClient from '~/utils/api';

export function useSubscriptions() {
  const schools = ref([]);
  const plans = ref<any[]>([]);
  const transactions = ref([]);
  const pagination = ref({ page: 1, limit: 10, total: 0, pages: 0 });
  const loading = ref(false);
  const error = ref('');

  // Get schools with subscription details
  const fetchSchoolsWithSubscriptions = async (params = {}) => {
    loading.value = true;
    error.value = '';
    try {
      const response = await apiClient.subscriptions.getSchoolsWithSubscriptions(params);

      if (response.success) {
        schools.value = response.data.schools || [];
        return response;
      } else {
        error.value = response.message || 'Failed to fetch schools.';
        return null;
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Network error.';
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Get single school with subscription details
  const getSchoolWithSubscription = async (id: string) => {
    loading.value = true;
    error.value = '';
    try {
      const response = await apiClient.subscriptions.getSchoolWithSubscription(id);
      if (response.success) {
        return response.data;
      } else {
        error.value = response.message || 'Failed to fetch school.';
        return null;
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Network error.';
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Get all subscription plans
  const fetchPlans = async (params = {}) => {
    loading.value = true;
    error.value = '';
    try {
      const response = await apiClient.subscriptions.getPlans(params);
      if (response.success) {
        plans.value = response.data.plans || [];
        return response;
      } else {
        error.value = response.message || 'Failed to fetch plans.';
        return null;
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Network error.';
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Get available modules
  const fetchAvailableModules = async () => {
    loading.value = true;
    error.value = '';
    try {
      const response = await apiClient.subscriptions.getAvailableModules();
      if (response.success) {
        return response.data;
      } else {
        error.value = response.message || 'Failed to fetch available modules.';
        return null;
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Network error.';
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Get single subscription plan by ID
  const getPlanById = async (id: string) => {
    loading.value = true;
    error.value = '';
    try {
      const response = await apiClient.subscriptions.getPlanById(id);
      if (response.success) {
        return response.data;
      } else {
        error.value = response.message || 'Failed to fetch plan.';
        return null;
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Network error.';
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Create subscription plan
  const createPlan = async (planData: any) => {
    loading.value = true;
    error.value = '';
    try {
      const response = await apiClient.subscriptions.createPlan(planData);
      if (!response.success) {
        error.value = response.message || 'Failed to create plan.';
        return null;
      }
      return response.data;
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Network error.';
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Update subscription plan
  const updatePlan = async (id: string, planData: any) => {
    loading.value = true;
    error.value = '';
    try {
      const response = await apiClient.subscriptions.updatePlan(id, planData);
      if (!response.success) {
        error.value = response.message || 'Failed to update plan.';
        return null;
      }
      return response.data;
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Network error.';
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Delete subscription plan
  const deletePlan = async (id: string) => {
    loading.value = true;
    error.value = '';
    try {
      const response = await apiClient.subscriptions.deletePlan(id);
      if (!response.success) {
        error.value = response.message || 'Failed to delete plan.';
        return false;
      }
      return true;
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Network error.';
      return false;
    } finally {
      loading.value = false;
    }
  };

  // Create school with subscription
  const createSchoolWithSubscription = async (formData: FormData) => {
    loading.value = true;
    error.value = '';
    try {
      const response = await apiClient.subscriptions.createSchoolWithSubscription(formData);
      
      if (!response.success) {
        // Create an error object that mimics axios error structure
        const apiError = new Error(response.message || 'Failed to create school with subscription.');
        (apiError as any).response = {
          data: response,
          status: 400
        };
        throw apiError;
      }
      return response.data;
    } catch (e: any) {
      // Let the component handle the error details
      throw e;
    } finally {
      loading.value = false;
    }
  };

  // Update school subscription
  const updateSchoolSubscription = async (schoolId: string, formData: FormData) => {
    loading.value = true;
    error.value = '';
    try {
      const response = await apiClient.subscriptions.updateSchoolSubscription(schoolId, formData);
      if (!response.success) {
        error.value = response.message || 'Failed to update school subscription.';
        return null;
      }
      return response.data;
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Network error.';
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Get school transactions
  const fetchSchoolTransactions = async (schoolId: string, params = {}) => {
    loading.value = true;
    error.value = '';
    try {
      const response = await apiClient.subscriptions.getSchoolTransactions(schoolId, params);
      if (response.success) {
        transactions.value = response.data.transactions || [];
        pagination.value = response.data.pagination || { page: 1, limit: 10, total: transactions.value.length, pages: 1 };
        return response;
      } else {
        error.value = response.message || 'Failed to fetch transactions.';
        return null;
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Network error.';
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Create manual transaction
  const createManualTransaction = async (transactionData: any) => {
    loading.value = true;
    error.value = '';
    try {
      const response = await apiClient.subscriptions.createManualTransaction(transactionData);
      if (!response.success) {
        error.value = response.message || 'Failed to create transaction.';
        return null;
      }
      return response.data;
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Network error.';
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Get subscription statistics
  const fetchSubscriptionStats = async () => {
    loading.value = true;
    error.value = '';
    try {
      const response = await apiClient.subscriptions.getSubscriptionStats();
      if (response.success) {
        return response.data;
      } else {
        error.value = response.message || 'Failed to fetch statistics.';
        return null;
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Network error.';
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Suspend a school
  const suspendSchool = async (schoolId: string) => {
    loading.value = true;
    error.value = '';
    try {
      const response = await apiClient.subscriptions.suspendSchool(schoolId);
      if (!response.success) {
        error.value = response.message || 'Failed to suspend school.';
        return null;
      }
      return response.data;
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Network error.';
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Reactivate a school
  const reactivateSchool = async (schoolId: string) => {
    loading.value = true;
    error.value = '';
    try {
      const response = await apiClient.subscriptions.reactivateSchool(schoolId);
      if (!response.success) {
        error.value = response.message || 'Failed to reactivate school.';
        return null;
      }
      return response.data;
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Network error.';
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Get renewal requests (for super admin)
  const fetchRenewalRequests = async (params = {}) => {
    loading.value = true;
    error.value = '';
    try {
      const response = await apiClient.subscriptions.getRenewalRequests(params);
      if (response.success) {
        return response.data;
      } else {
        error.value = response.message || 'Failed to fetch renewal requests.';
        return null;
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Network error.';
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Create renewal request (for school admins)
  const createRenewalRequest = async (requestData: any) => {
    loading.value = true;
    error.value = '';
    try {
      const response = await apiClient.subscriptions.createRenewalRequest(requestData);
      if (response.success) {
        return response.data;
      } else {
        error.value = response.message || 'Failed to create renewal request.';
        return null;
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Network error.';
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Review renewal request (for super admin)
  const reviewRenewalRequest = async (requestId: string, reviewData: any) => {
    loading.value = true;
    error.value = '';
    try {
      const response = await apiClient.subscriptions.reviewRenewalRequest(requestId, reviewData);
      if (response.success) {
        return response.data;
      } else {
        error.value = response.message || 'Failed to review renewal request.';
        return null;
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Network error.';
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Get school renewal requests (for school/branch admins)
  const fetchSchoolRenewalRequests = async (params = {}) => {
    loading.value = true;
    error.value = '';
    try {
      const response = await apiClient.subscriptions.getSchoolRenewalRequests(params);
      if (response.success) {
        return response.data;
      } else {
        error.value = response.message || 'Failed to fetch renewal requests.';
        return null;
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Network error.';
      return null;
    } finally {
      loading.value = false;
    }
  };

  const checkAndUpdateAllStatuses = async () => {
    try {
      const response = await apiClient.subscriptions.checkAllStatuses();
      return response.data;
    } catch (error) {
      console.error('Error checking subscription statuses:', error);
      throw error;
    }
  };

  return {
    schools,
    plans,
    transactions,
    pagination,
    loading,
    error,
    fetchSchoolsWithSubscriptions,
    getSchoolWithSubscription,
    fetchPlans,
    fetchAvailableModules,
    getPlanById,
    createPlan,
    updatePlan,
    deletePlan,
    createSchoolWithSubscription,
    updateSchoolSubscription,
    fetchSchoolTransactions,
    createManualTransaction,
    fetchSubscriptionStats,
    suspendSchool,
    reactivateSchool,
    fetchRenewalRequests,
    createRenewalRequest,
    reviewRenewalRequest,
    fetchSchoolRenewalRequests,
    checkAndUpdateAllStatuses
  };
} 