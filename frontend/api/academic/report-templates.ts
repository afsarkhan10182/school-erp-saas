import { apiCall } from '~/utils/api';

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  template_type: string;
  is_active: boolean;
  school_id: string;
  branch_id?: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ReportTemplateFilters {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
  school_id?: string;
  branch_id?: string;
  template_type?: string;
}

export const reportTemplateApi = {
  // Get all templates
  getAll: async (filters: ReportTemplateFilters = {}) => {
    return apiCall('get', '/report-templates', { params: filters });
  },

  // Get single template
  getById: async (templateId: string) => {
    return apiCall('get', `/report-templates/${templateId}`);
  },

  // Create template
  create: async (data: any) => {
    return apiCall('post', '/report-templates', data);
  },

  // Update template
  update: async (data: any) => {
    return apiCall('put', `/report-templates/${data.id}`, data);
  },

  // Delete template
  delete: async (templateId: string) => {
    return apiCall('delete', `/report-templates/${templateId}`);
  },

  // Get templates for dropdown
  getDropdown: async () => {
    return apiCall('get', '/report-templates/dropdown');
  }
};
