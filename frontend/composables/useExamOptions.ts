import { ref, readonly } from 'vue';
import { examTypeApi } from '~/api/academic/exam-types';
import { examStatusApi } from '~/api/academic/exam-statuses';
import { useToast } from '~/composables/useToast';

interface DropdownOption {
  label: string;
  value: string | number;
}

/**
 * Composable for managing database-driven exam options
 * Loads exam types, statuses, and other exam-related dropdown data
 */
export const useExamOptions = () => {
  const { showToast } = useToast();

  // Reactive state
  const examTypeOptions = ref<DropdownOption[]>([]);
  const examTypes = ref<any[]>([]); // Raw exam types for display
  const examStatusOptions = ref<DropdownOption[]>([]);
  const durationTypeOptions = ref<DropdownOption[]>([
    { value: 'time_range', label: 'Start & End Time' },
    { value: 'duration', label: 'Duration in Minutes' }
  ]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Load all exam types (active and inactive)
   */
  const loadExamTypes = async () => {
    try {
      loading.value = true;
      error.value = null;

      const response = await examTypeApi.getAll({ limit: 100 }); // Get all without pagination
      const rawExamTypes = response.data?.exam_types || [];

      // Store raw exam types for display (all types, both active and inactive)
      examTypes.value = rawExamTypes;

      // Format for dropdown options (only active types for dropdowns)
      examTypeOptions.value = examTypes.value
        .filter((type: any) => type.is_active)
        .map((type: any) => ({
          label: type.name,
          value: type.id, // Use ID for database relationships
          description: type.description,
          weightage: type.weightage,
          sort_order: type.sort_order,
          is_active: type.is_active
        }));
    } catch (err: any) {
      error.value = 'Failed to load exam types';
      showToast('Failed to load exam types', 'error');
    } finally {
      loading.value = false;
    }
  };

  /**
   * Load all active exam statuses
   */
  const loadExamStatuses = async () => {
    try {
      loading.value = true;
      error.value = null;

      const response = await examStatusApi.getActive();
      const examStatuses = response.data || [];

      examStatusOptions.value = examStatuses
        .filter((status: any) => status.is_active)
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((status: any) => ({
          label: status.name,
          value: status.code
        }));
    } catch (err: any) {
      error.value = 'Failed to load exam statuses';
      showToast('Failed to load exam statuses', 'error');
    } finally {
      loading.value = false;
    }
  };

  /**
   * Load all exam options (types and statuses)
   */
  const loadAllExamOptions = async () => {
    try {
      loading.value = true;
      error.value = null;

      await Promise.all([loadExamTypes(), loadExamStatuses()]);
    } catch (err: any) {
      error.value = 'Failed to load exam options';
      showToast('Failed to load exam options', 'error');
    } finally {
      loading.value = false;
    }
  };

  return {
    // State
    examTypeOptions: readonly(examTypeOptions),
    examTypes: readonly(examTypes), // Raw exam types for display
    examStatusOptions: readonly(examStatusOptions),
    durationTypeOptions: readonly(durationTypeOptions),
    loading: readonly(loading),
    error: readonly(error),

    // Methods
    loadExamTypes,
    loadExamStatuses,
    loadAllExamOptions
  };
};
