import { ref, readonly } from 'vue';
import { createApiInstance } from '~/utils/api';
import { useToast } from '~/composables/useToast';

import type { ExportColumn, ExportFilters } from '~/utils/exportConfig';
import { validateExportOptions, cleanExportFilters } from '~/utils/exportConfig';

export interface ExportFormat {
  value: string;
  label: string;
  description: string;
}

export interface ReportType {
  value: string;
  label: string;
  description: string;
}

export interface ExportOptions {
  report_type: string;
  format: string;
  filters: ExportFilters;
  columns?: ExportColumn[];
}

export const useExportService = () => {
  const { showToast } = useToast();
  const isGenerating = ref(false);
  const generationProgress = ref(0);

  // Supported report types
  const supportedReportTypes: ReportType[] = [
    {
      value: 'receipts',
      label: 'Receipts Report',
      description: 'Export payment receipts with student and fee details'
    },
    {
      value: 'fees',
      label: 'Fee Invoices Report',
      description: 'Export fee invoices with payment status and amounts'
    },
    {
      value: 'students',
      label: 'Students Report',
      description: 'Export student information with guardian details'
    },
    {
      value: 'attendance',
      label: 'Attendance Report',
      description: 'Export attendance records with student and class details'
    }
  ];

  // Supported export formats
  const supportedFormats: ExportFormat[] = [
    {
      value: 'pdf',
      label: 'PDF',
      description: 'Portable Document Format - Best for printing and sharing'
    },
    {
      value: 'excel',
      label: 'Excel',
      description: 'Microsoft Excel format - Best for data analysis'
    },
    {
      value: 'csv',
      label: 'CSV',
      description: 'Comma Separated Values - Best for data import'
    }
  ];
  // Get available report types
  const getReportTypes = (): ReportType[] => {
    return supportedReportTypes;
  };

  // Main report generation function
  const generateReport = async (options: ExportOptions): Promise<void> => {
    const { report_type, format, filters, columns } = options;

    try {
      isGenerating.value = true;
      generationProgress.value = 0;

      // Validate inputs using shared utility
      const validationError = validateExportOptions(report_type, format, columns || []);
      if (validationError) {
        throw new Error(validationError);
      }

      // All formats use backend for consistency
      await handleBackendExport(report_type, format, filters, columns);

      generationProgress.value = 100;
      showToast(`${report_type} in ${format} downloaded successfully`, 'success');
    } catch (error) {
      showToast(`Error generating ${report_type} report`, 'error');
      throw error;
    } finally {
      isGenerating.value = false;
      generationProgress.value = 0;
    }
  };

  // Handle backend export (PDF, Excel, CSV)
  const handleBackendExport = async (
    reportType: string,
    format: string,
    filters: ExportFilters,
    columns?: ExportColumn[]
  ): Promise<void> => {
    // Build query parameters for backend API
    const queryParams = new URLSearchParams();
    queryParams.append('report_type', reportType);
    queryParams.append('format', format);

    // Clean and add filters using shared utility
    const cleanedFilters = cleanExportFilters(filters);
    Object.entries(cleanedFilters).forEach(([key, value]) => {
      queryParams.append(key, String(value));
    });

    // Add columns if specified - send as JSON string for proper format
    if (columns && columns.length > 0) {
      queryParams.append('columns', JSON.stringify(columns));
    }

    // Call backend API
    const api = createApiInstance();
    const response = await api.get(`/export?${queryParams.toString()}`, {
      responseType: 'blob'
    });

    // Handle the file download
    await handleFileDownload(response, reportType, format);
  };

  // Handle file download for PDF, Excel, CSV formats
  const handleFileDownload = async (
    response: any,
    reportType: string,
    format: string
  ): Promise<void> => {
    const contentType = response.headers['content-type'];
    const contentDisposition = response.headers['content-disposition'];

    // Extract filename from content-disposition header or generate one
    let filename = `report-${reportType}-${new Date().toISOString().split('T')[0]}`;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Add appropriate extension if not present
    if (!filename.includes('.')) {
      const extensions: Record<string, string> = {
        pdf: '.pdf',
        excel: '.xlsx',
        csv: '.csv'
      };
      filename += extensions[format] || '';
    }

    // Create and download file
    const blob = new Blob([response.data], { type: contentType });

    if (blob.size === 0) {
      throw new Error('Downloaded file is empty');
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return {
    // State
    isGenerating: readonly(isGenerating),
    generationProgress: readonly(generationProgress),

    // Data
    supportedReportTypes,
    supportedFormats,

    // Methods
    generateReport,
    getReportTypes
  };
};
