import { ref, readonly, computed } from 'vue';
import { gradingSystemApi, type GradingSystem } from '~/api/academic/grading-systems';
import { useToast } from '~/composables/useToast';

export const useGradingSystems = () => {
  const { showToast } = useToast();

  // State
  const gradingSystems = ref<GradingSystem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  /**
   * Load all grading systems with pagination
   */
  const loadGradingSystems = async (filters: any = {}) => {
    try {
      loading.value = true;
      error.value = null;

      const queryParams = {
        page: pagination.value.page,
        limit: pagination.value.limit,
        ...filters
      };

      const response = await gradingSystemApi.getAll(queryParams);

      if (response.data && response.data.gradingSystems && response.data.pagination) {
        gradingSystems.value = response.data.gradingSystems;
        pagination.value = {
          ...pagination.value,
          ...response.data.pagination
        };
      }
    } catch (err: any) {
      error.value = 'Failed to load grading systems';
      showToast('Failed to load grading systems', 'error');
    } finally {
      loading.value = false;
    }
  };

  /**
   * Create grading system
   */
  const createGradingSystem = async (systemData: any) => {
    try {
      loading.value = true;
      error.value = null;

      const response = await gradingSystemApi.create(systemData);
      if (response.success) {
        showToast('Grading system created successfully', 'success');
        // Add to local list and update pagination
        if (response.data && response.data.gradingSystem) {
          gradingSystems.value.unshift(response.data.gradingSystem);
          pagination.value.total += 1;
        }
        return response.data;
      }
    } catch (err: any) {
      error.value = 'Failed to create grading system';
      showToast(err.message || 'Failed to create grading system', 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Update grading system
   */
  const updateGradingSystem = async (id: string, systemData: any) => {
    try {
      loading.value = true;
      error.value = null;

      const response = await gradingSystemApi.update(id, systemData);
      if (response.success) {
        showToast('Grading system updated successfully', 'success');
        // Update local list
        if (response.data && response.data.gradingSystem) {
          const index = gradingSystems.value.findIndex(system => system.id === id);
          if (index !== -1) {
            gradingSystems.value[index] = response.data.gradingSystem;
          }
        }
        return response.data;
      }
    } catch (err: any) {
      error.value = 'Failed to update grading system';
      showToast(err.message || 'Failed to update grading system', 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Delete grading system
   */
  const deleteGradingSystem = async (id: string) => {
    try {
      loading.value = true;
      error.value = null;

      const response = await gradingSystemApi.delete(id);
      if (response.success) {
        showToast('Grading system deleted successfully', 'success');
        // Remove from local list and update pagination
        gradingSystems.value = gradingSystems.value.filter(system => system.id !== id);
        pagination.value.total -= 1;
        return response.data;
      }
    } catch (err: any) {
      error.value = 'Failed to delete grading system';
      showToast(err.message || 'Failed to delete grading system', 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Pagination methods
  const goToPage = async (page: number) => {
    pagination.value.page = page;
    await loadGradingSystems();
  };

  const changePageSize = async (limit: number) => {
    pagination.value.limit = limit;
    pagination.value.page = 1; // Reset to first page
    await loadGradingSystems();
  };

  // Computed properties
  const hasData = computed(() => gradingSystems.value.length > 0);
  const isEmpty = computed(() => !loading.value && gradingSystems.value.length === 0);

  return {
    // State
    gradingSystems: readonly(gradingSystems),
    loading: readonly(loading),
    error: readonly(error),
    pagination: readonly(pagination),

    // Computed
    hasData,
    isEmpty,

    // Methods
    loadGradingSystems,
    createGradingSystem,
    updateGradingSystem,
    deleteGradingSystem,
    goToPage,
    changePageSize
  };
};
