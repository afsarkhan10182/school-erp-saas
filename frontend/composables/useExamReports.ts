import { ref, computed } from 'vue';
import { examReportsApi } from '~/api/academic/exam-reports';

export const useExamReports = () => {
  const examReports = ref([]);
  const students = ref([]);
  const templates = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Fetch students for report cards
  const fetchStudents = async (filters) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await examReportsApi.getStudents(filters);
      if (response.success) {
        students.value = response.data.students || response.data || [];
      }
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Fetch report card templates
  const fetchTemplates = async (params = {}) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await examReportsApi.getTemplates(params);
      if (response.success) {
        templates.value = response.data.templates || response.data || [];
      }
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Generate report cards
  const generateReport = async (reportData) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await examReportsApi.generate(reportData);
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Download report
  const downloadReport = async (reportId) => {
    try {
      const response = await examReportsApi.download(reportId);
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  // Get report generation status
  const getReportStatus = async (reportId) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await examReportsApi.getStatus(reportId);
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Computed properties
  const availableStudents = computed(() => students.value.filter(s => !s.is_absent));
  const absentStudents = computed(() => students.value.filter(s => s.is_absent));

  return {
    examReports,
    students,
    templates,
    loading,
    error,
    availableStudents,
    absentStudents,
    fetchStudents,
    fetchTemplates,
    generateReport,
    downloadReport,
    getReportStatus
  };
};
