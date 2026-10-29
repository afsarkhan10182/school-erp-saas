import { createApiInstance, apiCall } from '~/utils/api';

export interface ReportCardTemplate {
  id: string;
  name: string;
  description: string | null;
  report_type: string;
  config: Record<string, unknown> | null;
  footer_template?: string | null;
  is_default: boolean;
  school_id: string | null;
}

export interface StudentForReportCard {
  id: string;
  name: string;
  roll_number: string;
  class?: { name: string };
  section?: { name: string };
  total_marks?: number;
  grade?: string;
  is_absent?: boolean;
  is_promoted_since_exam?: boolean;
}

export interface ReportCardFilters {
  exam_id: string;
  class_id: string;
  section_id?: string;
  school_id?: string;
  branch_id?: string;
  enrollment_scope?: 'currently_studying' | 'full_register';
}

export interface GenerateReportCardData {
  exam_id?: string;
  setup_id?: string;
  student_ids: string[];
  template_id?: string;
  output_format: 'pdf' | 'print';
  email_options: {
    to_parents: boolean;
    to_students: boolean;
  };
  class_id?: string;
  section_id?: string;
  enrollment_scope?: 'currently_studying' | 'full_register';
  archive_report_cards?: boolean;
}

export const examReportsApi = {
  // Get students for report cards
  getStudents: async (filters: ReportCardFilters) => {
    return apiCall('get', '/exam-reports/students', { params: filters });
  },

  // Get report card templates
  getTemplates: async (params?: { school_id?: string; branch_id?: string }) => {
    return apiCall('get', '/exam-reports/templates', { params });
  },

  // Generate report cards
  generate: async (data: GenerateReportCardData) => {
    return apiCall('post', '/exam-reports/generate', data);
  },

  // Download generated report card
  download: async (reportId: string) => {
    return apiCall('get', `/exam-reports/download/${reportId}`);
  },

  // Get report generation status
  getStatus: async (reportId: string) => {
    return apiCall('get', `/exam-reports/status/${reportId}`);
  },

  getTabulation: async (params: { exam_id: string; class_id: string; section_id?: string }) => {
    return apiCall('get', '/exam-reports/tabulation', { params });
  },

  getProgress: async (params: { exam_ids: string; class_id: string; section_id?: string }) => {
    return apiCall('get', '/exam-reports/progress', { params });
  },

  getStudentArchives: async (studentId: string) =>
    apiCall('get', `/exam-reports/students/${studentId}/archives`),

  downloadArchive: async (archiveId: string) => {
    const api = createApiInstance();
    return api.get(`/exam-reports/archives/${archiveId}/download`, { responseType: 'blob' });
  }
};
