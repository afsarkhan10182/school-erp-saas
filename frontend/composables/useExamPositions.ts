import { ref, computed } from 'vue';
import { examPositionsApi } from '~/api/academic/exam-positions';

export const useExamPositions = () => {
  const examPositions = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Fetch exam positions by exam ID and class ID
  const fetchExamPositions = async (examId, classId, params = {}) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await examPositionsApi.getStudents({
        exam_id: examId,
        class_id: classId,
        ...params
      });
      if (response.success) {
        examPositions.value = response.data.students || response.data || [];
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
  const calculatePositions = async (examId, classId, calculationData) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await examPositionsApi.calculate({
        exam_id: examId,
        class_id: classId,
        ...calculationData
      });
      if (response.success && examId && classId) {
        await fetchExamPositions(examId, classId);
      }
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Save positions
  const savePositions = async (examId, classId, positions) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await examPositionsApi.save({
        exam_id: examId,
        class_id: classId,
        positions
      });
      if (response.success && examId && classId) {
        await fetchExamPositions(examId, classId);
      }
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Get position statistics
  const getPositionStats = async (examId, classId) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await examPositionsApi.getStats(examId, classId);
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
    savePositions,
    getPositionStats
  };
};
