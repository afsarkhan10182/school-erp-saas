import { apiCall } from '~/utils/api';

export const fetchCollectionsAPI = async (filters: any, pagination: any) => {
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    };

    const response = await apiCall('get', '/fee-invoices/collections', { params });
    return {
      data: response.data.collections || [],
      pagination: response.data.pagination || { total: 0 }
    };
  } catch (error) {
    console.error('Error fetching collections:', error);
    throw error;
  }
};
