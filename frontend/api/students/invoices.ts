import { createApiInstance } from '~/utils/api';

export interface InvoiceParams {
  payment_model?: 'monthly' | 'installment';
  page?: number;
  limit?: number;
  academic_year?: string;
  status?: string;
  student_id?: string;
  fee_structure_id?: string;
  month?: number;
  year?: number;
  class_name?: string;
  section?: string;
  branch_id?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
  all?: boolean; // Special parameter to get all invoices without pagination
}

export interface StudentSummaryParams {
  page?: number;
  limit?: number;
  academic_year?: string;
  class_id?: string;
  class_name?: string;
  section?: string;
  stream?: string;
  stream_id?: string;
  status?: string;
  branch_id?: string;
  payment_model?: 'monthly' | 'installment';
  search?: string;
}

export const Invoices = {
  getAll: async (params?: InvoiceParams) => {
    const api = createApiInstance();
    const response = await api.get('/fee-invoices/grouped', { params });
    return response.data;
  },

  // New endpoint for paginated student-based invoice summaries
  getStudentSummary: async (params?: StudentSummaryParams) => {
    const api = createApiInstance();
    const response = await api.get('/fee-invoices/student-fee-summary', { params });
    return response.data;
  },

  getSummary: async (params?: { payment_model?: 'monthly' | 'installment'; academic_year?: string; status?: string }) => {
    const api = createApiInstance();
    const response = await api.get('/fee-invoices/summary', { params });
    return response.data;
  }
};
