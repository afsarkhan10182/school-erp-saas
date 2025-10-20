import { ref, computed, readonly } from 'vue';
import { examHallApi, type ExamHall } from '~/api/academic/exam-halls';
import { useToast } from '~/composables/useToast';

export const useExamHalls = () => {
  const { showToast } = useToast();

  // State
  const halls = ref<ExamHall[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  /**
   * Load exam halls with pagination
   */
  const loadExamHalls = async (filters: any = {}) => {
    try {
      loading.value = true;
      error.value = null;

      const queryParams = {
        page: pagination.value.page,
        limit: pagination.value.limit,
        ...filters
      };

      const response = await examHallApi.getAll(queryParams);

      // Handle different response structures
      if (response && typeof response === 'object' && 'data' in response) {
        const responseData = response.data as any;

        if (responseData && responseData.halls && responseData.pagination) {
          // Backend response with pagination
          halls.value = responseData.halls;
          pagination.value = {
            ...pagination.value,
            ...responseData.pagination
          };
        } else if (responseData && Array.isArray(responseData)) {
          // Direct array response
          halls.value = responseData;
          pagination.value.total = (response as any).total || responseData.length;
          pagination.value.totalPages = Math.ceil(pagination.value.total / pagination.value.limit);
        } else if (responseData && responseData.halls) {
          // Response with halls but no pagination
          halls.value = responseData.halls;
          pagination.value.total = responseData.total || responseData.halls.length;
          pagination.value.totalPages = Math.ceil(pagination.value.total / pagination.value.limit);
        } else {
          halls.value = [];
          pagination.value.total = 0;
          pagination.value.totalPages = 0;
        }
      } else if (Array.isArray(response)) {
        // Direct array response
        const responseArray = response as ExamHall[];
        halls.value = responseArray;
        pagination.value.total = responseArray.length;
        pagination.value.totalPages = Math.ceil(pagination.value.total / pagination.value.limit);
      } else {
        halls.value = [];
        pagination.value.total = 0;
        pagination.value.totalPages = 0;
      }
    } catch (err: any) {
      const backendError =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to load exam halls';
      error.value = backendError;
      showToast(backendError, 'error');
    } finally {
      loading.value = false;
    }
  };

  /**
   * Create exam hall
   */
  const createHall = async (hallData: any) => {
    try {
      loading.value = true;
      error.value = null;

      const response = await examHallApi.create(hallData);

      // Show success message and add to list
      showToast('Exam hall created successfully', 'success');
      if (response.data && response.data.hall) {
        halls.value.unshift(response.data.hall);
        pagination.value.total += 1;
      }
      return response;
    } catch (err: any) {
      const backendError =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to create exam hall';
      error.value = backendError;
      showToast(backendError, 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Update exam hall
   */
  const updateHall = async (id: string, hallData: any) => {
    try {
      loading.value = true;
      error.value = null;

      const response = await examHallApi.update({ id, ...hallData });

      // Show success message and update in list
      showToast('Exam hall updated successfully', 'success');
      if (response.data && response.data.hall) {
        const index = halls.value.findIndex(hall => hall.id === id);
        if (index !== -1) {
          halls.value[index] = response.data.hall;
        }
      }
      return response;
    } catch (err: any) {
      const backendError =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to update exam hall';
      error.value = backendError;
      showToast(backendError, 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Delete exam hall
   */
  const deleteHall = async (id: string) => {
    try {
      loading.value = true;
      error.value = null;

      const response = await examHallApi.delete(id);

      // Show success message and remove from list
      showToast('Exam hall deleted successfully', 'success');
      halls.value = halls.value.filter(hall => hall.id !== id);
      pagination.value.total -= 1;
      return response;
    } catch (err: any) {
      const backendError =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to delete exam hall';
      error.value = backendError;
      showToast(backendError, 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Toggle hall status
   */
  const toggleHallStatus = async (id: string, isActive: boolean) => {
    try {
      loading.value = true;
      error.value = null;

      const response = await examHallApi.update({ id, is_active: isActive });
      if (response.success) {
        showToast(`Exam hall ${isActive ? 'activated' : 'deactivated'} successfully`, 'success');
      }
    } catch (err: any) {
      error.value = 'Failed to update exam hall status';
      showToast(err.message || 'Failed to update exam hall status', 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Pagination methods
  const goToPage = (page: number) => {
    pagination.value.page = page;
    loadExamHalls();
  };

  const changePageSize = (limit: number) => {
    pagination.value.limit = limit;
    pagination.value.page = 1; // Reset to first page
    loadExamHalls();
  };

  // Computed properties
  const hasData = computed(() => halls.value.length > 0);
  const isEmpty = computed(() => !loading.value && halls.value.length === 0);

  return {
    // State
    halls: readonly(halls),
    loading: readonly(loading),
    error: readonly(error),
    pagination: readonly(pagination),

    // Computed
    hasData,
    isEmpty,

    // Methods
    loadExamHalls,
    createHall,
    updateHall,
    deleteHall,
    toggleHallStatus,
    goToPage,
    changePageSize
  };
};
