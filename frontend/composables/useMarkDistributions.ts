import { ref, computed } from 'vue';
import {
  markDistributionApi,
  type MarkDistribution,
  type MarkDistributionFilters
} from '~/api/academic/mark-distributions';
import { useToast } from '~/composables/useToast';

export const useMarkDistributions = () => {
  const { showToast } = useToast();

  // State
  const distributions = ref<MarkDistribution[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Computed
  const hasData = computed(() => distributions.value.length > 0);
  const isEmpty = computed(() => !loading.value && distributions.value.length === 0);

  // Methods
  const loadMarkDistributions = async (filters: MarkDistributionFilters = {}) => {
    try {
      loading.value = true;
      error.value = null;

      const queryParams = {
        ...filters,
        page: pagination.value.page,
        limit: pagination.value.limit
      };

      const response = await markDistributionApi.getAll(queryParams);

      if (response && response.data && response.data.distributions && response.data.pagination) {
        distributions.value = response.data.distributions;
        pagination.value = {
          ...pagination.value,
          ...response.data.pagination
        };
      } else if (response && response.data && Array.isArray(response.data)) {
        // Fallback for different response structure
        distributions.value = response.data;
        pagination.value.total = distributions.value.length;
      } else {
        distributions.value = [];
        pagination.value.total = 0;
      }
    } catch (err: any) {
      const backendError =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to load mark distributions';
      error.value = backendError;
      showToast(backendError, 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createDistribution = async (distributionData: { name: string; branch_id: string }) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await markDistributionApi.create(distributionData);
      showToast('Mark distribution created successfully', 'success');
      if (response && response.data) {
        distributions.value.unshift(response.data);
        pagination.value.total += 1;
      }
      return response;
    } catch (err: any) {
      const backendError =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to create mark distribution';
      error.value = backendError;
      showToast(backendError, 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateDistribution = async ({
    id,
    ...distributionData
  }: {
    id: string;
    name: string;
    branch_id: string;
  }) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await markDistributionApi.update(id, distributionData);
      showToast('Mark distribution updated successfully', 'success');
      if (response && response.data) {
        const index = distributions.value.findIndex(dist => dist.id === id);
        if (index !== -1) {
          distributions.value[index] = response.data;
        }
      }
      return response;
    } catch (err: any) {
      const backendError =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to update mark distribution';
      error.value = backendError;
      showToast(backendError, 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteDistribution = async (id: string) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await markDistributionApi.delete(id);
      showToast('Mark distribution deleted successfully', 'success');
      distributions.value = distributions.value.filter(dist => dist.id !== id);
      pagination.value.total -= 1;
      return response;
    } catch (err: any) {
      const backendError =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to delete mark distribution';
      error.value = backendError;
      showToast(backendError, 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const goToPage = (page: number) => {
    pagination.value.page = page;
    loadMarkDistributions();
  };

  const changePageSize = (limit: number) => {
    pagination.value.limit = limit;
    pagination.value.page = 1; // Reset to first page
    loadMarkDistributions();
  };

  return {
    // State
    distributions,
    loading,
    error,
    pagination,

    // Computed
    hasData,
    isEmpty,

    // Methods
    loadMarkDistributions,
    createDistribution,
    updateDistribution,
    deleteDistribution,
    goToPage,
    changePageSize
  };
};
