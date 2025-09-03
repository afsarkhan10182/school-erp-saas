import { createApiInstance } from '~/utils/api';

export interface FeeInvoiceParams {
  page?: number;
  limit?: number;
  academic_year?: string;
  status?: string;
  student_id?: string;
  class_id?: string;
  section_id?: string;
  fee_type_id?: string;
  payment_status?: string;
  from_date?: string;
  to_date?: string;
}

export interface PaymentData {
  student_id: string;
  payment_amount: number;
  payment_method?: string;
  payment_date?: string;
  notes?: string;
  transaction_id?: string;
  cheque_number?: string;
  bank_name?: string;
  reference_number?: string;
}

export const FeeInvoices = {
  getCombinedReceipt: async (receiptGroupId: string) => {
    const api = createApiInstance();
    const response = await api.get(`/fee-invoices/grouped-receipts/${receiptGroupId}`);
    return response.data;
  },

  getById: async (id: string) => {
    const api = createApiInstance();
    const response = await api.get(`/fee-invoices/${id}`);
    return response.data;
  },

  generateInvoices: async (invoiceData: any) => {
    const api = createApiInstance();
    const response = await api.post('/fee-invoices/generate', invoiceData);
    return response.data;
  },

  recordPayment: async (id: string, paymentData: any) => {
    const api = createApiInstance();
    const response = await api.post(`/fee-invoices/${id}/payment`, paymentData);
    return response.data;
  },

  updateInvoice: async (id: string, invoiceData: any) => {
    const api = createApiInstance();
    const response = await api.put(`/fee-invoices/${id}`, invoiceData);
    return response.data;
  },

  cancelInvoice: async (id: string) => {
    const api = createApiInstance();
    const response = await api.put(`/fee-invoices/${id}/cancel`);
    return response.data;
  },

  getSummary: async (params?: { 
    academic_year?: string; 
    class_name?: string; 
    status?: string; 
    branch_id?: string; 
    search?: string; 
    section?: string; 
    from_date?: string; 
    to_date?: string; 
  }) => {
    const api = createApiInstance();
    // Add cache-busting parameter
    const cacheBustParams = { ...params, _t: Date.now() };
    const response = await api.get('/fee-invoices/summary', { params: cacheBustParams });
    return response.data;
  },

  getReceipt: async (id: string) => {
    const api = createApiInstance();
    const response = await api.get(`/fee-invoices/${id}/receipt`);
    return response.data;
  },

  // New payment tracking endpoints
  getInvoicePayments: async (id: string, params?: { page?: number; limit?: number }) => {
    const api = createApiInstance();
    const response = await api.get(`/fee-invoices/${id}/payments`, { params });
    return response.data;
  },

  getPaymentById: async (paymentId: string) => {
    const api = createApiInstance();
    const response = await api.get(`/fee-invoices/payment/${paymentId}`);
    return response.data;
  },

  // Generate receipt data for a specific payment (on-demand - returns structured data)
  generateReceipt: async (paymentId: string) => {
    const api = createApiInstance();
    const response = await api.get(`/fee-invoices/payment/${paymentId}/generate-receipt`);
    return response.data;
  },

  // Generate receipt data for an invoice (on-demand)
  generateInvoiceReceipt: async (invoiceId: string) => {
    const api = createApiInstance();
    const response = await api.get(`/fee-invoices/${invoiceId}/generate-receipt`);
    return response.data;
  },

  // Legacy endpoints (deprecated - use generate* endpoints instead)
  getPaymentReceiptData: async (paymentId: string) => {
    const api = createApiInstance();
    const response = await api.get(`/fee-invoices/payment/${paymentId}/receipt-data`);
    return response.data;
  },

  getCombinedReceiptData: async (paymentIds: string[]) => {
    const api = createApiInstance();
    const response = await api.post('/fee-invoices/receipts/combined-data', { paymentIds });
    return response.data;
  },

  getInvoiceReceiptData: async (invoiceId: string) => {
    const api = createApiInstance();
    const response = await api.get(`/fee-invoices/${invoiceId}/receipt-data`);
    return response.data;
  },

  // Receipts Report (payments only)
  getReceiptsReport: async (params?: {
    from_date?: string;
    to_date?: string;
    payment_method?: string;
    class_id?: string;
    section?: string;
    search?: string;
    branch_id?: string;
    page?: number;
    limit?: number;
  }) => {
    const api = createApiInstance();
    const response = await api.get('/fee-invoices/receipts-report', { params });
    return response.data;
  },

  getStudentPayments: async (studentId: string, params?: { page?: number; limit?: number; academic_year?: string }) => {
    const api = createApiInstance();
    const response = await api.get(`/fee-invoices/student/${studentId}/payments`, { params });
    return response.data;
  },

  // Smart payment allocation (amount-based with receipt grouping)
  recordSmartPayment: async (paymentData: PaymentData) => {
    const api = createApiInstance();
    const response = await api.post('/fee-invoices/smart-payment', paymentData);
    return response.data;
  },

  getStudentLedger: async (params: { student_id: string; academic_year?: string; status?: string; page?: number; limit?: number }) => {
    const api = createApiInstance();
    const response = await api.get('/fee-invoices/student-ledger', { params });
    return response.data;
  },

  getStudentDues: async (params: { student_id: string; academic_year?: string }) => {
    const api = createApiInstance();
    const response = await api.get('/fee-invoices/student-dues', { params });
    return response.data;
  },

  getAvailableMonths: async (params: { student_id: string; academic_year?: string }) => {
    const api = createApiInstance();
    const response = await api.get('/fee-invoices/available-months', { params });
    return response.data;
  },

  getGroupedReceipts: async (params: { student_id: string; academic_year?: string }) => {
    const api = createApiInstance();
    const response = await api.get('/fee-invoices/grouped-receipts', { params });
    return response.data;
  },

  getBreakdown: async (params: { student_id: string; fee_structure_id: string; academic_year: string }) => {
    const api = createApiInstance();
    const response = await api.get('/fee-invoices/breakdown', { params });
    return response.data;
  },

  adjustInvoice: async (id: string, adjustmentData: any) => {
    const api = createApiInstance();
    const response = await api.post(`/fee-invoices/${id}/adjust`, adjustmentData);
    return response.data;
  },

  applyLateFees: async (id: string) => {
    const api = createApiInstance();
    const response = await api.post(`/fee-invoices/${id}/late-fees`);
    return response.data;
  },

  // Report and export methods
  getReport: async (params?: FeeInvoiceParams) => {
    const api = createApiInstance();
    // Add cache-busting parameter
    const cacheBustParams = { ...params, _t: Date.now() };
    const response = await api.get('/fee-invoices/report', { params: cacheBustParams });
    return response.data;
  },

  exportReport: async (endpoint: string, queryString: string) => {
    const api = createApiInstance();
    const response = await api.get(`${endpoint}?${queryString}`, { responseType: 'blob' });
    return response;
  }
};
