import { ref, computed, readonly } from 'vue';
import { examTermApi, type ExamTerm, type ExamTermFilters } from '~/api/academic/exam-terms';
import { useToast } from '~/composables/useToast';
import { useAuth } from '~/composables/useAuth';

export const useExamTerms = () => {
  const { showToast } = useToast();
  const { user } = useAuth();

  // Reactive state
  const examTerms = ref<ExamTerm[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Fetch exam terms with pagination and filters
  const fetchExamTerms = async (params: ExamTermFilters = {}) => {
    try {
      loading.value = true;
      error.value = null;

      const queryParams = {
        page: pagination.value.page,
        limit: pagination.value.limit,
        ...params
      };

      const response = await examTermApi.getAll(queryParams);

      console.log('Exam Terms API Response:', response);

      // Handle different response structures
      if (response && typeof response === 'object' && 'data' in response) {
        const responseData = response.data as any;

        if (responseData && responseData.terms && responseData.pagination) {
          // Backend response with pagination
          examTerms.value = responseData.terms;
          pagination.value = {
            ...pagination.value,
            ...responseData.pagination
          };
        } else if (responseData && Array.isArray(responseData)) {
          // Direct array response
          examTerms.value = responseData;
          pagination.value.total = (response as any).total || responseData.length;
          pagination.value.totalPages = Math.ceil(pagination.value.total / pagination.value.limit);
        } else if (responseData && responseData.terms) {
          // Response with terms but no pagination
          examTerms.value = responseData.terms;
          pagination.value.total = responseData.total || responseData.terms.length;
          pagination.value.totalPages = Math.ceil(pagination.value.total / pagination.value.limit);
        } else if (responseData && responseData.examTerms) {
          // Response with examTerms
          examTerms.value = responseData.examTerms;
          pagination.value.total = responseData.total || responseData.examTerms.length;
          pagination.value.totalPages = Math.ceil(pagination.value.total / pagination.value.limit);
        } else {
          examTerms.value = [];
          pagination.value.total = 0;
          pagination.value.totalPages = 0;
        }
      } else if (Array.isArray(response)) {
        // Direct array response
        const responseArray = response as ExamTerm[];
        examTerms.value = responseArray;
        pagination.value.total = responseArray.length;
        pagination.value.totalPages = Math.ceil(pagination.value.total / pagination.value.limit);
      } else {
        examTerms.value = [];
        pagination.value.total = 0;
        pagination.value.totalPages = 0;
      }

      return response;
    } catch (err: any) {
      // Extract backend error message from axios error response
      let backendError = 'An unknown error occurred';

      if (err?.response?.data?.message) {
        // Backend error message
        backendError = err.response.data.message;
      } else if (err?.response?.data?.error) {
        // Alternative error field
        backendError = err.response.data.error;
      } else if (err?.message) {
        // Generic error message
        backendError = err.message;
      }

      error.value = backendError;
      showToast(backendError, 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Create exam term
  const createExamTerm = async (examTermData: { branch_id: string; name: string }) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await examTermApi.create(examTermData);

      // Show success message and add to list
      showToast('Exam term created successfully', 'success');
      if (response.data && response.data.term) {
        examTerms.value.unshift(response.data.term);
        pagination.value.total += 1;
      }
      return response;
    } catch (err: any) {
      // Extract backend error message
      const backendError =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'An unknown error occurred';

      error.value = backendError;
      showToast(backendError, 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Update exam term
  const updateExamTerm = async (id: string, examTermData: Partial<ExamTerm>) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await examTermApi.update(id, examTermData);

      // Show success message and update in list
      showToast('Exam term updated successfully', 'success');
      if (response.data && response.data.term) {
        const index = examTerms.value.findIndex(term => term.id === id);
        if (index !== -1) {
          examTerms.value[index] = response.data.term;
        }
      }
      return response;
    } catch (err: any) {
      // Extract backend error message from axios error response
      let backendError = 'An unknown error occurred';

      if (err?.response?.data?.message) {
        // Backend error message
        backendError = err.response.data.message;
      } else if (err?.response?.data?.error) {
        // Alternative error field
        backendError = err.response.data.error;
      } else if (err?.message) {
        // Generic error message
        backendError = err.message;
      }

      error.value = backendError;
      showToast(backendError, 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Delete exam term
  const deleteExamTerm = async (id: string) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await examTermApi.delete(id);

      // Show success message and remove from list
      showToast('Exam term deleted successfully', 'success');
      examTerms.value = examTerms.value.filter(term => term.id !== id);
      pagination.value.total -= 1;
      return response;
    } catch (err: any) {
      // Extract backend error message from axios error response
      let backendError = 'An unknown error occurred';

      if (err?.response?.data?.message) {
        // Backend error message
        backendError = err.response.data.message;
      } else if (err?.response?.data?.error) {
        // Alternative error field
        backendError = err.response.data.error;
      } else if (err?.message) {
        // Generic error message
        backendError = err.message;
      }

      error.value = backendError;
      showToast(backendError, 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Pagination methods
  const goToPage = (page: number) => {
    pagination.value.page = page;
    fetchExamTerms();
  };

  const changePageSize = (limit: number) => {
    pagination.value.limit = limit;
    pagination.value.page = 1; // Reset to first page
    fetchExamTerms();
  };

  // Computed properties
  const hasData = computed(() => examTerms.value.length > 0);
  const isEmpty = computed(() => !loading.value && examTerms.value.length === 0);

  return {
    // State
    examTerms: readonly(examTerms),
    loading: readonly(loading),
    error: readonly(error),
    pagination: readonly(pagination),

    // Computed
    hasData,
    isEmpty,

    // Methods
    fetchExamTerms,
    createExamTerm,
    updateExamTerm,
    deleteExamTerm,
    goToPage,
    changePageSize
  };
};
