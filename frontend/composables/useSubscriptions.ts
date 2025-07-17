import { ref } from 'vue';
import { useCookie } from 'nuxt/app';
import apiClient from '~/utils/api';

export function useSubscriptions() {
  const schools = ref([]);
  const plans = ref<any[]>([]);
  const transactions = ref([]);
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
        error.value = response.message || 'Failed to create school with subscription.';
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

  return {
    schools,
    plans,
    transactions,
    loading,
    error,
    fetchSchoolsWithSubscriptions,
    fetchPlans,
    createPlan,
    updatePlan,
    deletePlan,
    createSchoolWithSubscription,
    updateSchoolSubscription,
    fetchSchoolTransactions,
    createManualTransaction,
    fetchSubscriptionStats,
    suspendSchool,
    reactivateSchool
  };
} 