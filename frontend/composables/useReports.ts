import { ref, computed } from 'vue';
import { useToast } from '~/composables/useToast';
import { useAuth } from '~/composables/useAuth';

export function useReports() {
  const { showToast, showApiError } = useToast();
  const { user } = useAuth();

  // State
  const loading = ref(false);
  const generating = ref(false);
  const error = ref<string | null>(null);

  // Methods
  const generateStudentReport = async (filters: {
    academic_year?: string;
    class_id?: string;
    section_id?: string;
    date_from?: string;
    date_to?: string;
    format?: 'pdf' | 'excel';
  }) => {
    generating.value = true;
    error.value = null;

    try {
      // This would call the appropriate API endpoint
      const response = await $fetch('/api/reports/students', {
        method: 'POST',
        body: filters
      });

      // Handle file download
      const blob = new Blob([response.data], {
        type:
          filters.format === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `student-report.${filters.format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast('Report generated successfully', 'success');
      return response.data;
    } catch (err: any) {
      error.value = 'Failed to generate report';
      showApiError(err, 'Failed to generate report');
      throw err;
    } finally {
      generating.value = false;
    }
  };

  const generateAttendanceReport = async (filters: {
    academic_year?: string;
    class_id?: string;
    section_id?: string;
    date_from?: string;
    date_to?: string;
    format?: 'pdf' | 'excel';
  }) => {
    generating.value = true;
    error.value = null;

    try {
      const response = await $fetch('/api/reports/attendance', {
        method: 'POST',
        body: filters
      });

      const blob = new Blob([response.data], {
        type:
          filters.format === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance-report.${filters.format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast('Attendance report generated successfully', 'success');
      return response.data;
    } catch (err: any) {
      error.value = 'Failed to generate attendance report';
      showApiError(err, 'Failed to generate attendance report');
      throw err;
    } finally {
      generating.value = false;
    }
  };

  const generateFeesReport = async (filters: {
    academic_year?: string;
    class_id?: string;
    section_id?: string;
    date_from?: string;
    date_to?: string;
    format?: 'pdf' | 'excel';
  }) => {
    generating.value = true;
    error.value = null;

    try {
      const response = await $fetch('/api/reports/fees', {
        method: 'POST',
        body: filters
      });

      const blob = new Blob([response.data], {
        type:
          filters.format === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fees-report.${filters.format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast('Fees report generated successfully', 'success');
      return response.data;
    } catch (err: any) {
      error.value = 'Failed to generate fees report';
      showApiError(err, 'Failed to generate fees report');
      throw err;
    } finally {
      generating.value = false;
    }
  };

  const resetState = () => {
    error.value = null;
  };

  return {
    // State
    loading,
    generating,
    error,

    // Methods
    generateStudentReport,
    generateAttendanceReport,
    generateFeesReport,
    resetState
  };
}
