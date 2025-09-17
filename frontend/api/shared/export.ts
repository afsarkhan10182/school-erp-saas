import { createApiInstance, apiCall } from '~/utils/api';

export interface ExportParams {
  report_type: string;
  format?: 'csv' | 'excel' | 'pdf';
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

    const response = await api.get(`/export?${queryParams.toString()}`, {
      responseType: 'blob'
    });
    return response;
  }
};
