import { ref, computed } from 'vue';
import { examResultApi } from '~/api/academic/exam-results';

export const useExamResults = () => {
  const examResults = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Fetch exam results by exam ID
  const fetchExamResults = async (examId, params = {}) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await examResultApi.getByExamId(examId, params);
      if (response.success) {
        examResults.value = response.data.results || response.data;
      }
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Create bulk exam results
  const createBulkResults = async (examId, resultsData) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await examResultApi.createBulk(examId, resultsData);
      if (response.success) {
        await fetchExamResults(examId);
      }
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Calculate grades for an exam
  const calculateGrades = async examId => {
    try {
      loading.value = true;
      error.value = null;
      const response = await examResultApi.calculateGrades(examId);
      if (response.success) {
        await fetchExamResults(examId);
      }
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Export exam results
  const exportResults = async (examId, format = 'csv') => {
    try {
      const response = await examResultApi.export(examId, format);
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  // Update exam result
  const updateExamResult = async (id, resultData) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await examResultApi.update(id, resultData);
      if (response.success) {
        await fetchExamResults(resultData.exam_id);
      }
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Delete exam result
  const deleteExamResult = async id => {
    try {
      loading.value = true;
      error.value = null;
      const response = await examResultApi.delete(id);
      if (response.success) {
        await fetchExamResults();
      }
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Computed properties
  const passedResults = computed(() => examResults.value.filter(result => result.is_passed));

  const failedResults = computed(() => examResults.value.filter(result => result.is_passed === false));

  const averagePercentage = computed(() => {
    if (examResults.value.length === 0) return 0;
    const total = examResults.value.reduce((sum, result) => sum + Number(result.percentage || 0), 0);
    return total / examResults.value.length;
  });

  return {
    examResults,
    loading,
    error,
    passedResults,
    failedResults,
    averagePercentage,
    fetchExamResults,
    createBulkResults,
    calculateGrades,
    exportResults,
    updateExamResult,
    deleteExamResult
  };
};
