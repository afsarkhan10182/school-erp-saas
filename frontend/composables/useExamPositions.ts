import { ref, computed } from 'vue';
import {
  examPositionsApi,
  type CalculatePositionsData,
  type SavePositionsData,
  type StudentForPosition
} from '~/api/academic/exam-positions';

export const useExamPositions = () => {
  const examPositions = ref<StudentForPosition[]>([]);
  const loading = ref(false);
  const calculating = ref(false);
  const saving = ref(false);
  const error = ref<string | null>(null);

  // Get students for positions
  const getStudentsForPositions = async (params: {
    exam_id: string;
    class_id: string;
    section_id?: string;
    school_id?: string;
    branch_id?: string;
  }) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await examPositionsApi.getStudents(params);
      return response;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Calculate positions for an exam
  const calculatePositions = async (data: CalculatePositionsData) => {
    try {
      calculating.value = true;
      error.value = null;
      const response = await examPositionsApi.calculate(data);
      return response;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      calculating.value = false;
    }
  };

  // Save positions
  const savePositions = async (data: SavePositionsData) => {
    try {
      saving.value = true;
      error.value = null;
      const response = await examPositionsApi.save(data);
      return response;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      saving.value = false;
    }
  };

  // Get position statistics
  const getPositionStats = async (examId: string, classId: string) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await examPositionsApi.getStats(examId, classId);
      return response;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err);
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
    calculating,
    saving,
    error,
    topPerformers,
    positionStats,
    getStudentsForPositions,
    calculatePositions,
    savePositions,
    getPositionStats
  };
};
