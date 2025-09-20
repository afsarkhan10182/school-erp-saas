import { ref, reactive, computed, readonly } from 'vue';
import {
  examApi,
  type Exam,
  type ExamFilters,
  type ExamResult,
  type ExamResultData
} from '~/api/academic/exams';
import { useToast } from '~/composables/useToast';

export interface ExamState {
  exams: Exam[];
  currentExam: Exam | null;
  examResults: ExamResult[];
  loading: boolean;
  saving: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: ExamFilters;
  stats: any;
}

export const useExams = () => {
  const { showToast } = useToast();

  // State
  const state = reactive<ExamState>({
    exams: [],
    currentExam: null,
    examResults: [],
    loading: false,
    saving: false,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    },
    filters: {},
    stats: {
      total_exams: 0,
      active_exams: 0,
      total_results: 0,
      average_percentage: 0
    }
  });

  // Computed
  const hasExams = computed(() => state.exams.length > 0);
  const hasResults = computed(() => state.examResults.length > 0);
  const isLoading = computed(() => state.loading);
  const isSaving = computed(() => state.saving);

  // Methods
  const loadExams = async (filters: ExamFilters = {}) => {
    state.loading = true;

    try {
      const response = await examApi.getAll({
        page: state.pagination.page,
        limit: state.pagination.limit,
        ...filters
      });

      if (response.success) {
        state.exams = response.data.items || [];
        state.pagination = {
          page: response.data.page,
          limit: response.data.limit,
          total: response.data.total,
          totalPages: response.data.totalPages
        };
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to load exams', 'error');
    } finally {
      state.loading = false;
    }
  };

  const loadExamById = async (examId: string) => {
    state.loading = true;

    try {
      const response = await examApi.getById(examId);
      if (response.success) {
        state.currentExam = response.data;
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to load exam details', 'error');
    } finally {
      state.loading = false;
    }
  };

  const createExam = async (examData: Partial<Exam>) => {
    state.saving = true;

    try {
      const response = await examApi.create(examData);
      if (response.success) {
        showToast('Exam created successfully', 'success');
        return response.data;
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to create exam', 'error');
      throw error;
    } finally {
      state.saving = false;
    }
  };

  const updateExam = async (examId: string, examData: Partial<Exam>) => {
    state.saving = true;

    try {
      const response = await examApi.update(examId, examData);
      if (response.success) {
        showToast('Exam updated successfully', 'success');
        return response.data;
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to update exam', 'error');
      throw error;
    } finally {
      state.saving = false;
    }
  };

  const deleteExam = async (examId: string) => {
    state.saving = true;

    try {
      const response = await examApi.delete(examId);
      if (response.success) {
        showToast('Exam deleted successfully', 'success');
        // Remove from local state
        state.exams = state.exams.filter(exam => exam.id !== examId);
        return true;
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to delete exam', 'error');
      throw error;
    } finally {
      state.saving = false;
    }
  };

  const loadExamResults = async (examId: string) => {
    state.loading = true;

    try {
      const response = await examApi.getResults(examId);
      if (response.success) {
        state.examResults = response.data.results || [];
        state.currentExam = response.data.exam;
        return response.data;
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to load exam results', 'error');
    } finally {
      state.loading = false;
    }
  };

  const saveExamResults = async (examId: string, results: ExamResultData[]) => {
    state.saving = true;

    try {
      const response = await examApi.bulkCreateResults(examId, results);
      if (response.success) {
        showToast('Results saved successfully', 'success');
        return response.data;
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to save exam results', 'error');
      throw error;
    } finally {
      state.saving = false;
    }
  };

  const updateExamResult = async (resultId: string, resultData: Partial<ExamResult>) => {
    state.saving = true;

    try {
      const response = await examApi.updateResult(resultId, resultData);
      if (response.success) {
        showToast('Result updated successfully', 'success');
        return response.data.result;
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to update exam result', 'error');
      throw error;
    } finally {
      state.saving = false;
    }
  };

  const loadStats = async (params?: {
    academic_year?: string;
    date_from?: string;
    date_to?: string;
  }) => {
    try {
      const response = await examApi.getStats(params);
      if (response.success) {
        state.stats = response.data;
        return response.data;
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to load exam statistics', 'error');
    }
  };

  const exportExamResults = async (examId: string, format: 'excel' | 'pdf' = 'excel') => {
    try {
      const response = await examApi.exportResults(examId, format);

      // Create download link
      const blob = new Blob([response.data], {
        type:
          format === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `exam-results.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast(`Results exported successfully as ${format.toUpperCase()}`, 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to export results', 'error');
    }
  };

  const generateReportCard = async (
    studentId: string,
    params?: { academic_year?: string; exam_types?: string }
  ) => {
    try {
      const response = await examApi.generateReportCard(studentId, params);

      // Create download link for PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-card-${studentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast('Report card generated successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to generate report card', 'error');
    }
  };

  const setPage = (page: number) => {
    state.pagination.page = page;
  };

  const setFilters = (filters: ExamFilters) => {
    state.filters = { ...filters };
    state.pagination.page = 1; // Reset to first page when filters change
  };

  const resetState = () => {
    state.exams = [];
    state.currentExam = null;
    state.examResults = [];
    state.loading = false;
    state.saving = false;
    state.pagination = {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    };
    state.filters = {};
    state.stats = {
      total_exams: 0,
      active_exams: 0,
      total_results: 0,
      average_percentage: 0
    };
  };

  return {
    // State
    exams: computed(() => state.exams),
    stats: computed(() => state.stats),
    pagination: computed(() => state.pagination),
    filters: computed(() => state.filters),
    hasExams,
    hasResults,
    isLoading,
    isSaving,

    // Methods
    loadExams,
    loadExamById,
    createExam,
    updateExam,
    deleteExam,
    loadExamResults,
    saveExamResults,
    updateExamResult,
    loadStats,
    exportExamResults,
    generateReportCard,
    setPage,
    setFilters,
    resetState
  };
};
