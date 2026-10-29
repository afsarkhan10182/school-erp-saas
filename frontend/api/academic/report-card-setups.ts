import { apiCall } from '~/utils/api';

export interface ReportCardSetupInput {
  name: string;
  template_id: string;
  orientation: 'portrait' | 'landscape';
  exam_entries: Array<{ exam_id: string; weightage: number }>;
}

export const reportCardSetupApi = {
  getAll: (branch_id: string) => apiCall('get', '/exam-reports/setups', { params: { branch_id } }),
  create: (data: ReportCardSetupInput, branch_id: string) =>
    apiCall('post', '/exam-reports/setups', { ...data, branch_id }),
  update: (id: string, data: ReportCardSetupInput, branch_id: string) =>
    apiCall('put', `/exam-reports/setups/${id}`, { ...data, branch_id }),
  setPublished: (id: string, is_published: boolean, branch_id: string) =>
    apiCall('patch', `/exam-reports/setups/${id}/publication`, { is_published, branch_id }),
  delete: (id: string, branch_id: string) =>
    apiCall('delete', `/exam-reports/setups/${id}`, { params: { branch_id } })
};
