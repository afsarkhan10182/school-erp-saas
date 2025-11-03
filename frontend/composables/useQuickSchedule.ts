import { ref, computed } from 'vue';
import {
  examScheduleApi,
  type QuickScheduleData,
  type QuickScheduleResult
} from '~/api/academic/exam-schedules';
import { useToast } from './useToast';

export const useQuickSchedule = () => {
  const { showSuccess, showError } = useToast();

  const isLoading = ref(false);
  const result = ref<QuickScheduleResult | null>(null);

  const createQuickSchedule = async (data: QuickScheduleData) => {
    isLoading.value = true;
    result.value = null;

    try {
      const response = await examScheduleApi.createQuickSchedule(data);
      result.value = response;

      if (response.error_count > 0) {
        showError(
          `Quick schedule creation completed with ${response.error_count} errors. ${response.success_count} schedules created successfully.`
        );
      } else {
        showSuccess(`Successfully created ${response.success_count} exam schedules.`);
      }

      return response;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to create quick schedule';
      showError(errorMessage);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const resetResult = () => {
    result.value = null;
  };

  const hasErrors = computed(() => result.value?.error_count > 0);
  const hasSuccess = computed(() => result.value?.success_count > 0);
  const totalProcessed = computed(
    () => (result.value?.success_count || 0) + (result.value?.error_count || 0)
  );

  return {
    isLoading,
    result,
    createQuickSchedule,
    resetResult,
    hasErrors,
    hasSuccess,
    totalProcessed
  };
};
