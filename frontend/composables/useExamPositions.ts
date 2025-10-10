import { ref, computed } from 'vue';
import { examPositionApi } from '~/api/academic/exam-positions';

export const useExamPositions = () => {
  const examPositions = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Fetch exam positions by exam ID
  const fetchExamPositions = async (examId, params = {}) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await examPositionApi.getByExamId(examId, params);
      if (response.success) {
        examPositions.value = response.data.positions || response.data;
      }
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Calculate positions for an exam
  const calculatePositions = async examId => {
    try {
      loading.value = true;
      error.value = null;
      const response = await examPositionApi.calculatePositions(examId);
      if (response.success) {
        await fetchExamPositions(examId);
      }
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Export exam positions
  const exportPositions = async (examId, format = 'csv') => {
    try {
      const response = await examPositionApi.export(examId, format);
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  // Update exam position
  const updateExamPosition = async (id, positionData) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await examPositionApi.update(id, positionData);
      if (response.success) {
        await fetchExamPositions(positionData.exam_id);
      }
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Delete exam position
  const deleteExamPosition = async id => {
    try {
      loading.value = true;
      error.value = null;
      const response = await examPositionApi.delete(id);
      if (response.success) {
        await fetchExamPositions();
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
  const topPerformers = computed(() => examPositions.value.slice(0, 10));

  const positionStats = computed(() => {
    const total = examPositions.value.length;
    const passed = examPositions.value.filter(pos => pos.is_passed).length;
    const failed = total - passed;

    return {
      total,
      passed,
      failed,
      passRate: total > 0 ? (passed / total) * 100 : 0
    };
  });

  return {
    examPositions,
    loading,
    error,
    topPerformers,
    positionStats,
    fetchExamPositions,
    calculatePositions,
    exportPositions,
    updateExamPosition,
    deleteExamPosition
  };
};
