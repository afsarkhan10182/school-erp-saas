import { ref } from 'vue';
import { useCookie } from 'nuxt/app';

export function useSubscriptions() {
  const schools = ref([]);
  const plans = ref([]);
  const transactions = ref([]);
  const loading = ref(false);
  const error = ref('');

  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;

  // Get schools with subscription details
  const fetchSchoolsWithSubscriptions = async (params = {}) => {
    loading.value = true;
    error.value = '';
    try {
      const token = useCookie('auth-token').value;
      const queryString = new URLSearchParams(params).toString();
      const res = await fetch(`${apiBase}/subscriptions/schools?${queryString}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        schools.value = data.data.schools || [];
        return data.data;
      } else {
        error.value = data.message || 'Failed to fetch schools.';
        return null;
      }
    } catch (e) {
      error.value = 'Network error.';
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
      const token = localStorage.getItem('auth-token');
      const queryString = new URLSearchParams(params).toString();
      const res = await fetch(`${apiBase}/subscriptions/plans?${queryString}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        plans.value = data.data.plans || [];
        return data.data;
      } else {
        error.value = data.message || 'Failed to fetch plans.';
        return null;
      }
    } catch (e) {
      error.value = 'Network error.';
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
      const token = localStorage.getItem('auth-token');
      const res = await fetch(`${apiBase}/subscriptions/plans`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(planData)
      });
      const data = await res.json();
      if (!data.success) {
        error.value = data.message || 'Failed to create plan.';
        return null;
      }
      return data.data;
    } catch (e) {
      error.value = 'Network error.';
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
      const token = localStorage.getItem('auth-token');
      const res = await fetch(`${apiBase}/subscriptions/plans/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(planData)
      });
      const data = await res.json();
      if (!data.success) {
        error.value = data.message || 'Failed to update plan.';
        return null;
      }
      return data.data;
    } catch (e) {
      error.value = 'Network error.';
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
      const token = localStorage.getItem('auth-token');
      const res = await fetch(`${apiBase}/subscriptions/plans/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!data.success) {
        error.value = data.message || 'Failed to delete plan.';
        return false;
      }
      return true;
    } catch (e) {
      error.value = 'Network error.';
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
      const token = localStorage.getItem('auth-token');
      const res = await fetch(`${apiBase}/subscriptions/schools`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Do not set Content-Type, browser will set it for FormData
        },
        body: formData
      });
      const data = await res.json();
      if (!data.success) {
        error.value = data.message || 'Failed to create school with subscription.';
        return null;
      }
      return data.data;
    } catch (e) {
      error.value = 'Network error.';
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Update school subscription
  const updateSchoolSubscription = async (schoolId: string, subscriptionData: any) => {
    loading.value = true;
    error.value = '';
    try {
      const token = localStorage.getItem('auth-token');
      const res = await fetch(`${apiBase}/subscriptions/schools/${schoolId}/subscription`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscriptionData)
      });
      const data = await res.json();
      if (!data.success) {
        error.value = data.message || 'Failed to update school subscription.';
        return null;
      }
      return data.data;
    } catch (e) {
      error.value = 'Network error.';
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
      const token = localStorage.getItem('auth-token');
      const queryString = new URLSearchParams(params).toString();
      const res = await fetch(`${apiBase}/subscriptions/schools/${schoolId}/transactions?${queryString}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        transactions.value = data.data.transactions || [];
        return data.data;
      } else {
        error.value = data.message || 'Failed to fetch transactions.';
        return null;
      }
    } catch (e) {
      error.value = 'Network error.';
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
      const token = localStorage.getItem('auth-token');
      const res = await fetch(`${apiBase}/subscriptions/transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transactionData)
      });
      const data = await res.json();
      if (!data.success) {
        error.value = data.message || 'Failed to create transaction.';
        return null;
      }
      return data.data;
    } catch (e) {
      error.value = 'Network error.';
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
      const token = localStorage.getItem('auth-token');
      const res = await fetch(`${apiBase}/subscriptions/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        return data.data;
      } else {
        error.value = data.message || 'Failed to fetch statistics.';
        return null;
      }
    } catch (e) {
      error.value = 'Network error.';
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
      const token = localStorage.getItem('auth-token');
      const res = await fetch(`${apiBase}/schools/${schoolId}/suspend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!data.success) {
        error.value = data.message || 'Failed to suspend school.';
        return null;
      }
      return data.data;
    } catch (e) {
      error.value = 'Network error.';
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
      const token = localStorage.getItem('auth-token');
      const res = await fetch(`${apiBase}/schools/${schoolId}/reactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!data.success) {
        error.value = data.message || 'Failed to reactivate school.';
        return null;
      }
      return data.data;
    } catch (e) {
      error.value = 'Network error.';
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