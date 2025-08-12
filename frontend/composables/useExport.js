import { ref } from 'vue';
import { createApiInstance } from '~/utils/api';
import { useToast } from '~/composables/useToast';

/**
 * Universal Export Composable
 * Handles exports for all report types with multiple formats
 */
export const useExport = () => {
  const { showToast } = useToast();
  const isExporting = ref(false);
  const exportProgress = ref(0);

  /**
   * Export report data
   * @param {Object} options - Export options
   * @param {string} options.reportType - Type of report (students, fees, etc.)
   * @param {string} options.format - Export format (excel, csv, pdf, json)
   * @param {Object} options.filters - Report filters
   * @param {boolean} options.includeSummary - Include summary data
   * @param {string} options.customFilename - Custom filename prefix
   */
  const exportReport = async (options) => {
    const {
      reportType,
      format = 'excel',
      filters = {},
      includeSummary = false,
      customFilename = null
    } = options;

    if (!reportType) {
      showToast('Report type is required', 'error');
      return;
    }

    isExporting.value = true;
    exportProgress.value = 0;

    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });

      // Add export options
      if (includeSummary) {
        queryParams.append('includeSummary', 'true');
      }

      // Create API instance
      const api = createApiInstance();
      
      // Make export request
      const response = await api.get(`/export/${reportType}/${format}?${queryParams.toString()}`, {
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            exportProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          }
        }
      });

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = customFilename 
        ? `${customFilename}-${timestamp}-${time}.${format}`
        : `${reportType}-report-${timestamp}-${time}.${format}`;

      // Download file
      await downloadFile(response.data, filename, format);

      showToast(`${reportType} report exported successfully`, 'success');
      
    } catch (error) {
      console.error('Export failed:', error);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        showToast('Report type not found', 'error');
      } else if (error.response?.status === 400) {
        showToast('Invalid export parameters', 'error');
      } else if (error.response?.status === 403) {
        showToast('You do not have permission to export this report', 'error');
      } else {
        showToast('Export failed. Please try again.', 'error');
      }
    } finally {
      isExporting.value = false;
      exportProgress.value = 0;
    }
  };

  /**
   * Download file from blob
   */
  const downloadFile = (blob, filename, format) => {
    return new Promise((resolve, reject) => {
      try {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  };

  /**
   * Export with specific format helpers
   */
  const exportToExcel = (options) => exportReport({ ...options, format: 'excel' });
  const exportToCSV = (options) => exportReport({ ...options, format: 'csv' });
  const exportToPDF = (options) => exportReport({ ...options, format: 'pdf' });
  const exportToJSON = (options) => exportReport({ ...options, format: 'json' });

  /**
   * Get supported formats for a report type
   */
  const getSupportedFormats = (reportType) => {
    const formatConfig = {
      students: ['excel', 'csv', 'pdf', 'json'],
      fees: ['excel', 'csv', 'pdf', 'json'],
      'fee-invoices': ['excel', 'csv', 'pdf', 'json'],
      attendance: ['excel', 'csv', 'pdf'],
      academic: ['excel', 'csv', 'pdf'],
      financial: ['excel', 'csv', 'pdf']
    };

    return formatConfig[reportType] || ['excel', 'csv'];
  };

  /**
   * Get format display name
   */
  const getFormatDisplayName = (format) => {
    const displayNames = {
      excel: 'Excel (.xlsx)',
      csv: 'CSV (.csv)',
      pdf: 'PDF (.pdf)',
      json: 'JSON (.json)'
    };

    return displayNames[format] || format.toUpperCase();
  };

  /**
   * Get format icon
   */
  const getFormatIcon = (format) => {
    const icons = {
      excel: '📊',
      csv: '📄',
      pdf: '📋',
      json: '📝'
    };

    return icons[format] || '📁';
  };

  /**
   * Validate export options
   */
  const validateExportOptions = (options) => {
    const errors = [];

    if (!options.reportType) {
      errors.push('Report type is required');
    }

    if (options.format && !['excel', 'csv', 'pdf', 'json'].includes(options.format)) {
      errors.push('Invalid export format');
    }

    return errors;
  };

  /**
   * Create export configuration for common report types
   */
  const createExportConfig = (reportType, filters = {}) => {
    const baseConfig = {
      reportType,
      filters,
      includeSummary: true
    };

    switch (reportType) {
      case 'students':
        return {
          ...baseConfig,
          customFilename: 'student-report'
        };
      case 'fees':
      case 'fee-invoices':
        return {
          ...baseConfig,
          customFilename: 'fee-report'
        };
      case 'attendance':
        return {
          ...baseConfig,
          customFilename: 'attendance-report'
        };
      case 'academic':
        return {
          ...baseConfig,
          customFilename: 'academic-report'
        };
      case 'financial':
        return {
          ...baseConfig,
          customFilename: 'financial-report'
        };
      default:
        return baseConfig;
    }
  };

  return {
    // State
    isExporting,
    exportProgress,

    // Main export function
    exportReport,

    // Format-specific helpers
    exportToExcel,
    exportToCSV,
    exportToPDF,
    exportToJSON,

    // Utility functions
    getSupportedFormats,
    getFormatDisplayName,
    getFormatIcon,
    validateExportOptions,
    createExportConfig
  };
};
