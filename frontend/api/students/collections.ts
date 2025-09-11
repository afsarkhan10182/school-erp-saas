import { createApiInstance } from '~/utils/api';

export const fetchCollectionsAPI = async (filters: any, pagination: any) => {
  try {
    const api = createApiInstance();
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    };

    const response = await api.get('/fee-invoices/collections', { params });
    return {
      data: response.data.data.collections || [],
      pagination: response.data.data.pagination || { total: 0 }
    };
  } catch (error) {
    console.error('Error fetching collections:', error);
    throw error;
  }
};
