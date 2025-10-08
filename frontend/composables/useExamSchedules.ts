import { ref, computed } from 'vue';
import {
  examScheduleApi,
  type ExamSchedule,
  type ExamScheduleFilters,
  type CreateExamScheduleData,
  type UpdateExamScheduleData
} from '~/api/academic/exam-schedules';
import { useToast } from './useToast';

export const useExamSchedules = () => {
  const { showToast } = useToast();

  // State
  const schedules = ref<ExamSchedule[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const total = ref(0);
  const currentPage = ref(1);
  const limit = ref(20);

  // Computed
  const hasMore = computed(() => {
    return schedules.value.length < total.value;
  });

  const pagination = computed(() => ({
    page: currentPage.value,
    limit: limit.value,
    total: total.value,
    hasMore: hasMore.value
  }));

  // Methods
  const loadSchedules = async (filters?: ExamScheduleFilters) => {
    try {
      loading.value = true;
      error.value = null;

      const params = {
        page: currentPage.value,
        limit: limit.value,
        ...filters
      };

      const response = await examScheduleApi.getAll(params);

      if (filters?.page === 1 || !filters?.page) {
        schedules.value = response.data.schedules;
      } else {
        schedules.value = [...schedules.value, ...response.data.schedules];
      }

      total.value = response.data.total;
      currentPage.value = response.data.page;

      return response.data;
    } catch (err: any) {
      error.value = 'Failed to load exam schedules';
      showToast('Failed to load exam schedules', 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const loadMore = async (filters?: ExamScheduleFilters) => {
    if (!hasMore.value || loading.value) return;

    currentPage.value += 1;
    await loadSchedules(filters);
  };

  const refreshSchedules = async (filters?: ExamScheduleFilters) => {
    currentPage.value = 1;
    schedules.value = [];
    await loadSchedules(filters);
  };

  const getScheduleById = async (id: string) => {
    try {
      loading.value = true;
      const response = await examScheduleApi.getById(id);
      return response.data.schedule;
    } catch (err: any) {
      showToast('Failed to load exam schedule', 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getSchedulesForExam = async (examId: string) => {
    try {
      loading.value = true;
      const response = await examScheduleApi.getByExam(examId);
      return response.data.schedules;
    } catch (err: any) {
      showToast('Failed to load exam schedules', 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createSchedule = async (data: CreateExamScheduleData) => {
    try {
      loading.value = true;
      const response = await examScheduleApi.create(data);
      schedules.value.unshift(response.data.schedule);
      total.value += 1;
      showToast('Exam schedule created successfully', 'success');
      return response.data.schedule;
    } catch (err: any) {
      showToast('Failed to create exam schedule', 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateSchedule = async (data: UpdateExamScheduleData) => {
    try {
      loading.value = true;
      const response = await examScheduleApi.update(data);

      const index = schedules.value.findIndex(s => s.id === data.id);
      if (index !== -1) {
        schedules.value[index] = response.data.schedule;
      }

      showToast('Exam schedule updated successfully', 'success');
      return response.data.schedule;
    } catch (err: any) {
      showToast('Failed to update exam schedule', 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      loading.value = true;
      await examScheduleApi.delete(id);

      const index = schedules.value.findIndex(s => s.id === id);
      if (index !== -1) {
        schedules.value.splice(index, 1);
        total.value -= 1;
      }

      showToast('Exam schedule deleted successfully', 'success');
    } catch (err: any) {
      showToast('Failed to delete exam schedule', 'error');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const rescheduleExam = async (scheduleId: string, newDate: string, reason: string) => {
    try {
      const schedule = schedules.value.find(s => s.id === scheduleId);
      if (!schedule) throw new Error('Schedule not found');

      const updateData: UpdateExamScheduleData = {
        id: scheduleId,
        exam_date: newDate,
        is_rescheduled: true,
        rescheduled_reason: reason,
        original_date: schedule.exam_date
      };

      return await updateSchedule(updateData);
    } catch (err: any) {
      showToast('Failed to reschedule exam', 'error');
      throw err;
    }
  };

  // Utility functions
  const formatScheduleTime = (schedule: ExamSchedule) => {
    if (!schedule.start_time && !schedule.end_time) {
      return 'Time TBD';
    }

    const start = schedule.start_time ? schedule.start_time.substring(0, 5) : '';
    const end = schedule.end_time ? schedule.end_time.substring(0, 5) : '';

    if (start && end) {
      return `${start} - ${end}`;
    } else if (start) {
      return `From ${start}`;
    } else if (end) {
      return `Until ${end}`;
    }

    return 'Time TBD';
  };

  const getScheduleStatus = (schedule: ExamSchedule) => {
    return schedule.status?.name || 'Unknown';
  };

  const getScheduleHall = (schedule: ExamSchedule) => {
    return schedule.exam_hall?.name || 'TBD';
  };

  const getScheduleInvigilator = (schedule: ExamSchedule) => {
    return schedule.invigilator?.name || 'TBD';
  };

  return {
    // State
    schedules: readonly(schedules),
    loading: readonly(loading),
    error: readonly(error),
    total: readonly(total),
    pagination: readonly(pagination),

    // Methods
    loadSchedules,
    loadMore,
    refreshSchedules,
    getScheduleById,
    getSchedulesForExam,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    rescheduleExam,

    // Utilities
    formatScheduleTime,
    getScheduleStatus,
    getScheduleHall,
    getScheduleInvigilator
  };
};
