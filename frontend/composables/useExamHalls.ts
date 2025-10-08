import { ref, readonly } from 'vue';
import { examHallApi, type ExamHall } from '~/api/academic/exam-halls';
import { useToast } from '~/composables/useToast';

export const useExamHalls = () => {
  const { showToast } = useToast();

  // State
  const halls = ref<ExamHall[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Load all exam halls
   */
  const loadHalls = async (filters: any = {}) => {
    try {
      loading.value = true;
      error.value = null;

      const response = await examHallApi.getAll({ limit: 100, ...filters });
      halls.value = response.data?.halls || [];
    } catch (err: any) {
      error.value = 'Failed to load exam halls';
      showToast('Failed to load exam halls', 'error');
    } finally {
      loading.value = false;
    }
  };

  /**
   * Create exam hall
   */
  const createHall = async (hallData: any) => {
    try {
      loading.value = true;
      error.value = null;

      const response = await examHallApi.create(hallData);
      if (response.success) {
        showToast('Exam hall created successfully', 'success');
        return response.data;
      }
    } catch (err: any) {
      error.value = 'Failed to create exam hall';
      showToast(err.message || 'Failed to create exam hall', 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Update exam hall
   */
  const updateHall = async (id: string, hallData: any) => {
    try {
      loading.value = true;
      error.value = null;

      const response = await examHallApi.update({ id, ...hallData });
      if (response.success) {
        showToast('Exam hall updated successfully', 'success');
        return response.data;
      }
    } catch (err: any) {
      error.value = 'Failed to update exam hall';
      showToast(err.message || 'Failed to update exam hall', 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Delete exam hall
   */
  const deleteHall = async (id: string) => {
    try {
      loading.value = true;
      error.value = null;

      const response = await examHallApi.delete(id);
      if (response.success) {
        showToast('Exam hall deleted successfully', 'success');
      }
    } catch (err: any) {
      error.value = 'Failed to delete exam hall';
      showToast(err.message || 'Failed to delete exam hall', 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Toggle hall status
   */
  const toggleHallStatus = async (id: string, isActive: boolean) => {
    try {
      loading.value = true;
      error.value = null;

      const response = await examHallApi.update({ id, is_active: isActive });
      if (response.success) {
        showToast(`Exam hall ${isActive ? 'activated' : 'deactivated'} successfully`, 'success');
      }
    } catch (err: any) {
      error.value = 'Failed to update exam hall status';
      showToast(err.message || 'Failed to update exam hall status', 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    // State
    halls: readonly(halls),
    loading: readonly(loading),
    error: readonly(error),

    // Methods
    loadHalls,
    createHall,
    updateHall,
    deleteHall,
    toggleHallStatus
  };
};
