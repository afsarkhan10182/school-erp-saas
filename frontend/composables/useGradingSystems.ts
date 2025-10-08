import { ref, readonly } from 'vue';
import { gradingSystemApi } from '~/api/academic/grading-systems';
import { useToast } from '~/composables/useToast';

export const useGradingSystems = () => {
  const { showToast } = useToast();

  // State
  const gradingSystems = ref([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Load all grading systems
   */
  const loadGradingSystems = async () => {
    try {
      loading.value = true;
      error.value = null;

      const response = await gradingSystemApi.getAll({ limit: 100 });
      gradingSystems.value = response.data?.gradingSystems || [];
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
        await loadGradingSystems();
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
        await loadGradingSystems();
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
        await loadGradingSystems();
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

  return {
    // State
    gradingSystems: readonly(gradingSystems),
    loading: readonly(loading),
    error: readonly(error),

    // Methods
    loadGradingSystems,
    createGradingSystem,
    updateGradingSystem,
    deleteGradingSystem
  };
};
