import { createApiInstance, apiCall } from '~/utils/api';

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
  payment_model?: string;
  months?: number[];
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
    return apiCall('get', `/fee-invoices/grouped-receipts/${receiptGroupId}`);
  },

  getReceiptByNumber: async (receiptNumber: string) => {
    return apiCall('get', `/fee-invoices/receipt/${receiptNumber}`);
  },

  getById: async (id: string) => {
    return apiCall('get', `/fee-invoices/${id}`);
  },

  generateInvoices: async (invoiceData: any) => {
    return apiCall('post', '/fee-invoices/generate', invoiceData);
  },

  recordPayment: async (id: string, paymentData: any) => {
    return apiCall('post', `/fee-invoices/${id}/payment`, paymentData);
  },

  updateInvoice: async (id: string, invoiceData: any) => {
    return apiCall('put', `/fee-invoices/${id}`, invoiceData);
  },

  cancelInvoice: async (id: string) => {
    return apiCall('put', `/fee-invoices/${id}/cancel`);
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
    payment_model?: string;
    months?: number[];
  }) => {
    // Add cache-busting parameter
    const cacheBustParams = { ...params, _t: Date.now() };
    return apiCall('get', '/fee-invoices/summary', { params: cacheBustParams });
  },

  getReceipt: async (id: string) => {
    return apiCall('get', `/fee-invoices/${id}/receipt`);
  },

  // New payment tracking endpoints
  getInvoicePayments: async (id: string, params?: { page?: number; limit?: number }) => {
    return apiCall('get', `/fee-invoices/${id}/payments`, { params });
  },

  getPaymentById: async (paymentId: string) => {
    return apiCall('get', `/fee-invoices/payment/${paymentId}`);
  },

  // Generate receipt data for a specific payment (on-demand - returns structured data)
  generateReceipt: async (paymentId: string) => {
    return apiCall('get', `/fee-invoices/payment/${paymentId}/generate-receipt`);
  },

  // Generate receipt data for an invoice (on-demand)
  generateInvoiceReceipt: async (invoiceId: string) => {
    return apiCall('get', `/fee-invoices/${invoiceId}/generate-receipt`);
  },

  // Legacy endpoints (deprecated - use generate* endpoints instead)
  getPaymentReceiptData: async (paymentId: string) => {
    return apiCall('get', `/fee-invoices/payment/${paymentId}/receipt-data`);
  },

  getCombinedReceiptData: async (paymentIds: string[]) => {
    return apiCall('post', '/fee-invoices/receipts/combined-data', { paymentIds });
  },

  getInvoiceReceiptData: async (invoiceId: string) => {
    return apiCall('get', `/fee-invoices/${invoiceId}/receipt-data`);
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
    return apiCall('get', '/fee-invoices/receipts-report', { params });
  },

  getStudentPayments: async (
    studentId: string,
    params?: { page?: number; limit?: number; academic_year?: string }
  ) => {
    return apiCall('get', `/fee-invoices/student/${studentId}/payments`, { params });
  },

  // Smart payment allocation (amount-based with receipt grouping)
  recordSmartPayment: async (paymentData: PaymentData) => {
    return apiCall('post', '/fee-invoices/smart-payment', paymentData);
  },

  getStudentLedger: async (params: {
    student_id: string;
    academic_year?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    return apiCall('get', '/fee-invoices/student-ledger', { params });
  },

  getStudentDues: async (params: { student_id: string; academic_year?: string }) => {
    return apiCall('get', '/fee-invoices/student-dues', { params });
  },

  getAvailableMonths: async (params: { student_id: string; academic_year?: string }) => {
    return apiCall('get', '/fee-invoices/available-months', { params });
  },

  getGroupedReceipts: async (params: { student_id: string; academic_year?: string }) => {
    return apiCall('get', '/fee-invoices/grouped-receipts', { params });
  },

  getBreakdown: async (params: {
    student_id: string;
    fee_structure_id: string;
    academic_year: string;
  }) => {
    return apiCall('get', '/fee-invoices/breakdown', { params });
  },

  adjustInvoice: async (id: string, adjustmentData: any) => {
    return apiCall('post', `/fee-invoices/${id}/adjust`, adjustmentData);
  },

  applyLateFees: async (id: string) => {
    return apiCall('post', `/fee-invoices/${id}/late-fees`);
  },

  // Report and export methods
  getReport: async (params?: FeeInvoiceParams) => {
    // Add cache-busting parameter
    const cacheBustParams = { ...params, _t: Date.now() };
    return apiCall('get', '/fee-invoices/report', { params: cacheBustParams });
  },

  // Get report grouped by students with proper pagination
  getReportGrouped: async (params?: FeeInvoiceParams) => {
    // Add cache-busting parameter
    const cacheBustParams = { ...params, _t: Date.now() };
    return apiCall('get', '/fee-invoices/report-grouped', { params: cacheBustParams });
  },

  exportReport: async (endpoint: string, queryString: string) => {
    const api = createApiInstance();
    const response = await api.get(`${endpoint}?${queryString}`, { responseType: 'blob' });
    return response;
  },

  // Monthly payment status endpoint
  getMonthlyPaymentStatus: async (params?: {
    months?: string | number[];
    year?: number;
    school_id?: string;
    branch_id?: string;
    class_id?: string;
    section_id?: string;
    stream_id?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    // Add cache-busting parameter
    const cacheBustParams = { ...params, _t: Date.now() };
    return apiCall('get', '/fee-invoices/monthly-payment-status', { params: cacheBustParams });
  }
};
