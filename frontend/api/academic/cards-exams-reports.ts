import { apiCall } from '~/utils/api';

export const ReportsSuite = {
  catalog: () => apiCall('get', '/reports/catalog'),
  run: (module: string, type = 'summary', params?: Record<string, any>) =>
    apiCall('get', `/reports/${module}`, { params: { type, ...params } })
};

export const CardTemplates = {
  list: (params?: { kind?: string; user_type?: string; school_id?: string; branch_id?: string }) =>
    apiCall('get', '/cards/templates', { params }),
  create: (data: any) => apiCall('post', '/cards/templates', data),
  update: (id: string, data: any) => apiCall('put', `/cards/templates/${id}`, data),
  remove: (id: string) => apiCall('delete', `/cards/templates/${id}`),
  generate: (data: {
    student_id?: string;
    user_id?: string;
    user_type?: string;
    template_id?: string;
    kind?: string;
    branch_id?: string;
  }) => apiCall('post', '/cards/generate', data)
};

export const ExamSeatings = {
  list: (params?: { exam_id?: string; branch_id?: string; school_id?: string }) =>
    apiCall('get', '/exam-seatings', { params }),
  preview: (data: any) => apiCall('post', '/exam-seatings/preview', data),
  apply: (data: any) => apiCall('post', '/exam-seatings/apply', data),
  overview: (id: string) => apiCall('get', `/exam-seatings/${id}/overview`),
  reset: (id: string) => apiCall('post', `/exam-seatings/${id}/reset`)
};

export const OnlineExams = {
  list: (params?: any) => apiCall('get', '/online-exams', { params }),
  available: () => apiCall('get', '/online-exams/available'),
  parentProgress: (studentId: string) =>
    apiCall('get', '/online-exams/parent/progress', { params: { student_id: studentId } }),
  get: (id: string, params?: { branch_id?: string }) => apiCall('get', `/online-exams/${id}`, { params }),
  create: (data: any) => apiCall('post', '/online-exams', data),
  update: (id: string, data: any, params?: { branch_id?: string }) =>
    apiCall('put', `/online-exams/${id}`, { ...data, ...params }),
  remove: (id: string, params?: { branch_id?: string }) =>
    apiCall('delete', `/online-exams/${id}`, { params }),
  addQuestion: (id: string, data: any, params?: { branch_id?: string }) =>
    apiCall('post', `/online-exams/${id}/questions`, { ...data, ...params }),
  deleteQuestion: (id: string, questionId: string, params?: { branch_id?: string }) =>
    apiCall('delete', `/online-exams/${id}/questions/${questionId}`, { params }),
  take: (id: string, params?: { branch_id?: string }) =>
    apiCall('get', `/online-exams/${id}/take`, { params }),
  saveAnswers: (id: string, data: { answers_json: Record<string, number> }) =>
    apiCall('patch', `/online-exams/${id}/attempt`, data),
  submit: (
    id: string,
    data: { student_id?: string; answers_json: Record<string, number> },
    params?: { branch_id?: string }
  ) => apiCall('post', `/online-exams/${id}/submit`, { ...data, ...params }),
  results: (id: string, params?: { branch_id?: string }) =>
    apiCall('get', `/online-exams/${id}/results`, { params })
};
