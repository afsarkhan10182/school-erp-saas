import { createApiInstance, apiCall } from '~/utils/api';

export interface ExportParams {
  report_type: string;
  format?: 'csv' | 'excel' | 'pdf' | 'print';
  filters?: Record<string, any>;
  [key: string]: any;
}

export const Export = {
  exportData: async (params: ExportParams) => {
    const api = createApiInstance();
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object') {
          queryParams.append(key, JSON.stringify(value));
        } else {
          queryParams.append(key, String(value));
        }
      }
    });

    const endpoint =
      params.report_type === 'audit_events'
        ? '/audit-trail/export'
        : params.report_type === 'homeworks'
        ? '/export/homeworks'
        : params.report_type === 'gate_passes'
          ? '/export/gate-passes'
          : params.report_type === 'visitors'
            ? '/export/visitors'
              : params.report_type === 'admission_enquiries'
                ? '/export/admission-enquiries'
                : '/export';
    const response = await api.get(`${endpoint}?${queryParams.toString()}`, {
      responseType: 'blob'
    });
    return response;
  }
};
