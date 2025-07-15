import { apiClient } from '~/utils/api';

// Wrapper functions to match the expected API interface in the Vue component
// Collections are handled through fee invoices with payment status filter
export const fetchCollectionsAPI = async (filters: any, pagination: any) => {
  const params = {
    page: pagination.page,
    limit: pagination.limit,
    search: filters.search,
    status: 'paid', // Only show paid invoices (collections)
  };
  
  return await apiClient.feeInvoices.getAll(params);
};

export const getCollectionByIdAPI = async (id: string) => {
  return await apiClient.feeInvoices.getById(id);
};

export const createCollectionAPI = async (collectionData: any) => {
  // This would typically be handled through the fee invoice payment endpoint
  return await apiClient.feeInvoices.recordPayment(collectionData.invoice_id, collectionData);
};

export const updateCollectionAPI = async (id: string, collectionData: any) => {
  return await apiClient.feeInvoices.updateInvoice(id, collectionData);
};

export const deleteCollectionAPI = async (id: string) => {
  // Collections typically can't be deleted, but invoices can be cancelled
  return await apiClient.feeInvoices.cancelInvoice(id);
};

export const getCollectionStatsAPI = async () => {
  return await apiClient.feeInvoices.getStats();
}; 