import { apiCall } from '~/utils/api';

export interface ReportTemplateConfig {
  show_rank?: boolean;
  show_remarks?: boolean;
  [key: string]: unknown;
}

export interface ReportTemplate {
  id: string;
  name: string;
  code: string;
  description: string | null;
  report_type: 'student_wise' | 'detailed';
  footer_template: string | null;
  config: ReportTemplateConfig | null;
  is_default: boolean;
  is_active: boolean;
  school_id: string | null;
}

export interface ReportTemplateFilters {
  school_id?: string;
}

export interface CopyReportTemplateData {
  source_template_id: string;
  name: string;
  description?: string | null;
  footer_template?: string | null;
  config?: Pick<ReportTemplateConfig, 'show_rank' | 'show_remarks'>;
  school_id?: string;
}

export interface UpdateReportTemplateData {
  id: string;
  name: string;
  description?: string | null;
  footer_template?: string | null;
  config?: Pick<ReportTemplateConfig, 'show_rank' | 'show_remarks'>;
  school_id?: string;
}

export const reportTemplateApi = {
  getAll: (filters: ReportTemplateFilters = {}) =>
    apiCall('get', '/exam-reports/templates', { params: filters }),
  create: (data: CopyReportTemplateData) => apiCall('post', '/exam-reports/templates', data),
  update: ({ id, ...data }: UpdateReportTemplateData) =>
    apiCall('put', `/exam-reports/templates/${encodeURIComponent(id)}`, data)
};
