import { ref, readonly } from 'vue';
import { getExamTypeOptions, EXAM_TYPES } from '~/utils/exam-types';
import { useToast } from '~/composables/useToast';

interface DropdownOption {
  label: string;
  value: string | number;
}

/**
 * Composable for managing hardcoded exam options
 * Uses hardcoded exam types
 */
export const useExamOptions = () => {
  const { showToast } = useToast();

  // Hardcoded exam types - no API calls needed
  const examTypeOptions = ref<DropdownOption[]>(getExamTypeOptions());
  const examTypes = ref<any[]>(EXAM_TYPES); // Hardcoded exam types
  const durationTypeOptions = ref<DropdownOption[]>([
    { value: 'time_range', label: 'Start & End Time' },
    { value: 'duration', label: 'Duration in Minutes' }
  ]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Load all exam types (hardcoded - no API call needed)
   */
  const loadExamTypes = async () => {
    // No API call needed - exam types are hardcoded
    examTypes.value = EXAM_TYPES;
    examTypeOptions.value = getExamTypeOptions();
  };

  /**
   * Load all exam options (types only)
   */
  const loadAllExamOptions = async () => {
    // No API call needed - exam types are hardcoded
    examTypes.value = EXAM_TYPES;
    examTypeOptions.value = getExamTypeOptions();
  };

  return {
    // State
    examTypeOptions: readonly(examTypeOptions),
    examTypes: readonly(examTypes), // Raw exam types for display
    durationTypeOptions: readonly(durationTypeOptions),
    loading: readonly(loading),
    error: readonly(error),

    // Methods
    loadExamTypes,
    loadAllExamOptions
  };
};
