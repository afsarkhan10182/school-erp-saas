import { apiCall } from '~/utils/api';
import { createApiInstance } from '~/utils/api';

export const Classwork = {
  list: (params?: Record<string, string | number>) => apiCall('get', '/classwork', { params }),
  export: (params: Record<string, string>, columns: { key: string; header: string }[]) =>
    createApiInstance().get('/export/classwork', { params: { ...params, columns: JSON.stringify(columns) }, responseType: 'blob' }),
  create: (data: FormData) => apiCall('post', '/classwork', data),
  update: (id: string, data: FormData) => apiCall('put', `/classwork/${id}`, data),
  download: (id: string) => createApiInstance().get(`/classwork/${id}/file`, { responseType: 'blob' }),
  remove: (id: string, branchId?: string) => apiCall('delete', `/classwork/${id}`, { params: branchId ? { branch_id: branchId } : undefined })
};
