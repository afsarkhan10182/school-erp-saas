import { apiCall } from '~/utils/api';

export const AuditTrail = {
  list: (params: {
    school_id?: string;
    branch_id?: string;
    search?: string;
    action?: string;
    entity?: string;
    from?: string;
    to?: string;
    sort_by?: 'date' | 'user' | 'activity';
    sort_order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) => apiCall('get', '/audit-trail', { params })
};
