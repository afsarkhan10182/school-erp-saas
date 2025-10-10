import { ref, computed } from 'vue';
import { examReportApi } from '~/api/academic/exam-reports';

export const useExamReports = () => {
  const examReports = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Fetch exam reports by exam ID
  const fetchExamReports = async (examId, params = {}) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await examReportApi.getByExamId(examId, params);
      if (response.success) {
        examReports.value = response.data.reports || response.data;
      }
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Preview report
  const previewReport = async (examId, reportData) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await examReportApi.preview(examId, reportData);
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Generate report
  const generateReport = async (examId, reportData) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await examReportApi.generate(examId, reportData);
      if (response.success) {
        await fetchExamReports(examId);
      }
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Download report
  const downloadReport = async reportId => {
    try {
      const response = await examReportApi.download(reportId);
      return response;
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  // Delete exam report
  const deleteExamReport = async reportId => {
    try {
      loading.value = true;
      error.value = null;
      const response = await examReportApi.delete(reportId);
      if (response.success) {
        await fetchExamReports();
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
  const completedReports = computed(() =>
    examReports.value.filter(report => report.status === 'completed')
  );

  const pendingReports = computed(() =>
    examReports.value.filter(
      report => report.status === 'pending' || report.status === 'generating'
    )
  );

  const reportTypes = computed(() => {
    const types = [...new Set(examReports.value.map(report => report.report_type))];
    return types.map(type => ({
      value: type,
      label: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }));
  });

  return {
    examReports,
    loading,
    error,
    completedReports,
    pendingReports,
    reportTypes,
    fetchExamReports,
    previewReport,
    generateReport,
    downloadReport,
    deleteExamReport
  };
};
