import { createApiInstance, apiCall } from '~/utils/api';

export interface FeeInvoiceParams {
  page?: number;
  limit?: number;
  academic_year?: string;
  status?: string;
  search?: string;
        school_id?: string;
  class_name?: string;
  section?: string;
  branch_id?: string;
  due_from?: string;
  due_to?: string;
  payment_method?: string;
  student_id?: string;
  class_id?: string;
  section_id?: string;
  fee_type_id?: string;
  payment_status?: string;
  from_date?: string;
  to_date?: string;
  payment_model?: string;
  periods?: string;
  months?: string | number[];
}

export interface PaymentData {
  student_id: string;
  school_id?: string;
  branch_id?: string;
  payment_amount: number;
  payment_method?: string;
  payment_date?: string;
  notes?: string;
  transaction_id?: string;
  cheque_number?: string;
  bank_name?: string;
  reference_number?: string;
  payment_mode?: 'auto' | 'manual';
  selected_invoice_ids?: string[];
}

const pendingPaymentKeys = new Map<string, { fingerprint: string; key: string }>();

const stableJson = (value: any): string => {
  if (Array.isArray(value))
    return `[${value.map(item => stableJson(item === undefined ? null : item)).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .filter(key => value[key] !== undefined)
      .sort()
      .map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
};

const fingerprintPayment = async (data: Record<string, any>) => {
  const bytes = new TextEncoder().encode(stableJson(data));
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
};

const postIdempotentPayment = async (
  scope: string,
  endpoint: string,
  data: Record<string, any>
) => {
  const payload = { ...data };
  delete payload.idempotency_key;
  const fingerprint = await fingerprintPayment(payload);
  const storageKey = `fee-payment:${scope}`;
  let key: string | undefined;

  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
    key = saved?.fingerprint === fingerprint ? saved.key : undefined;
  } catch {
    const saved = pendingPaymentKeys.get(scope);
    key = saved?.fingerprint === fingerprint ? saved.key : undefined;
  }
  if (!key) {
    const saved = pendingPaymentKeys.get(scope);
    key = saved?.fingerprint === fingerprint ? saved.key : undefined;
  }
  if (!key) {
    key = globalThis.crypto.randomUUID();
    pendingPaymentKeys.set(scope, { fingerprint, key });
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ fingerprint, key }));
    } catch {
      // Keep the retry key in memory when session storage is unavailable.
    }
  }

  const response = await apiCall('post', endpoint, { ...payload, idempotency_key: key });
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
    if (saved?.key === key) sessionStorage.removeItem(storageKey);
  } catch {}
  if (pendingPaymentKeys.get(scope)?.key === key) pendingPaymentKeys.delete(scope);
  return response;
};

export const FeeInvoices = {
  searchStudents: async (
    search:
      | string
      | {
          search?: string;
          school_id?: string;
          class_name?: string;
          academic_year?: string;
          branch_id?: string;
          section?: string;
          stream_id?: string;
        }
  ) => {
    return apiCall('get', '/fee-invoices/students/search', {
      params: typeof search === 'string' ? { search } : search
    });
  },

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
    return postIdempotentPayment(`invoice:${id}`, `/fee-invoices/${id}/payment`, paymentData);
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
    payment_method?: string;
    periods?: string;
    months?: string | number[];
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

  reversePayment: async (paymentId: string, reason: string) => {
    return apiCall('post', `/fee-invoices/payment/${paymentId}/reverse`, { reason });
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
    return postIdempotentPayment(
      `student:${paymentData.student_id}`,
      '/fee-invoices/smart-payment',
      paymentData
    );
  },

  recordFlexibleInstallmentPayment: async (id: string, paymentData: Record<string, any>) => {
    return postIdempotentPayment(`flexible-invoice:${id}`, '/fee-invoices/flexible-installment', {
      ...paymentData,
      invoice_id: id
    });
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

  getStudentDues: async (params: { student_id: string; school_id?: string; branch_id?: string; academic_year?: string }) => {
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

  getAdjustments: async (id: string) => {
    return apiCall('get', `/fee-invoices/${id}/adjustments`);
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
    payment_method?: string;
    periods?: string;
    page?: number;
    limit?: number;
  }) => {
    // Add cache-busting parameter
    const cacheBustParams = { ...params, _t: Date.now() };
    return apiCall('get', '/fee-invoices/monthly-payment-status', { params: cacheBustParams });
  }
};
