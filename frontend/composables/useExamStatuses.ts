import { ref, readonly } from 'vue';
import { examStatusApi } from '~/api/academic/exam-statuses';
import { useToast } from '~/composables/useToast';

export const useExamStatuses = () => {
  const { showToast } = useToast();

  // State
  const examStatuses = ref([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Load all exam statuses
   */
  const loadExamStatuses = async () => {
    try {
      loading.value = true;
      error.value = null;

      const response = await examStatusApi.getAll({ limit: 100 });
      examStatuses.value = response.data?.examStatuses || [];
    } catch (err: any) {
      error.value = 'Failed to load exam statuses';
      showToast('Failed to load exam statuses', 'error');
    } finally {
      loading.value = false;
    }
  };

  /**
   * Create exam status
   */
  const createExamStatus = async (statusData: any) => {
    try {
      loading.value = true;
      error.value = null;

      const response = await examStatusApi.create(statusData);
      if (response.success) {
        showToast('Exam status created successfully', 'success');
        await loadExamStatuses();
        return response.data;
      }
    } catch (err: any) {
      error.value = 'Failed to create exam status';
      showToast(err.message || 'Failed to create exam status', 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Update exam status
   */
  const updateExamStatus = async (id: string, statusData: any) => {
    try {
      loading.value = true;
      error.value = null;

      const response = await examStatusApi.update(id, statusData);
      if (response.success) {
        showToast('Exam status updated successfully', 'success');
        await loadExamStatuses();
        return response.data;
      }
    } catch (err: any) {
      error.value = 'Failed to update exam status';
      showToast(err.message || 'Failed to update exam status', 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Delete exam status
   */
  const deleteExamStatus = async (id: string) => {
    try {
      loading.value = true;
      error.value = null;

      const response = await examStatusApi.delete(id);
      if (response.success) {
        showToast('Exam status deleted successfully', 'success');
        await loadExamStatuses();
        return response.data;
      }
    } catch (err: any) {
      error.value = 'Failed to delete exam status';
      showToast(err.message || 'Failed to delete exam status', 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    // State
    examStatuses: readonly(examStatuses),
    loading: readonly(loading),
    error: readonly(error),

    // Methods
    loadExamStatuses,
    createExamStatus,
    updateExamStatus,
    deleteExamStatus
  };
};
