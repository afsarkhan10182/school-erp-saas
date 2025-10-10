import { ref, computed } from 'vue';
import { examTypeApi, type ExamType, type ExamTypeFilters } from '~/api/academic/exam-types';

export const useExamTypes = () => {
  const examTypes = ref<ExamType[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Fetch all exam types
  const fetchExamTypes = async (params: ExamTypeFilters = {}) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await examTypeApi.getAll(params);
      if (response.success) {
        examTypes.value = response.data.examTypes || response.data;
      }
      return response;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Create exam type
  const createExamType = async (examTypeData: Partial<ExamType>) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await examTypeApi.create(examTypeData);
      if (response.success) {
        await fetchExamTypes();
      }
      return response;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Update exam type
  const updateExamType = async (id: string, examTypeData: Partial<ExamType>) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await examTypeApi.update(id, examTypeData);
      if (response.success) {
        await fetchExamTypes();
      }
      return response;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Delete exam type
  const deleteExamType = async (id: string) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await examTypeApi.delete(id);
      if (response.success) {
        await fetchExamTypes();
      }
      return response;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      error.value = errorMessage;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Get active exam types for dropdowns
  const fetchActiveExamTypes = async () => {
    try {
      const response = await examTypeApi.getActive();
      if (response.success) {
        return response.data.examTypes || response.data;
      }
      return [];
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      error.value = errorMessage;
      return [];
    }
  };

  // Computed properties
  const activeExamTypes = computed(() => examTypes.value.filter(type => type.is_active));

  const examTypeOptions = computed(() =>
    examTypes.value.map(type => ({
      value: type.id,
      label: type.name,
      code: type.code
    }))
  );

  return {
    examTypes,
    loading,
    error,
    activeExamTypes,
    examTypeOptions,
    fetchExamTypes,
    createExamType,
    updateExamType,
    deleteExamType,
    fetchActiveExamTypes
  };
};
