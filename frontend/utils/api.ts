import axios from 'axios';
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, PaginatedResponse } from '~/types';
import { useAuthStore } from '~/stores/auth';

export function createApiInstance(): AxiosInstance {
  const config = useRuntimeConfig();
  const apiBase = config.public?.apiBase || 'http://localhost:8000/api';

  const api: AxiosInstance = axios.create({
    baseURL: apiBase,
    timeout: 10000,
    withCredentials: true, // Include cookies with requests
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - no need to manually add tokens since they're in secure cookies
  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Ensure config exists and has required properties
      if (!config) {
        throw new Error('Request configuration is undefined');
      }
      return config;
    },
    (error: any) => Promise.reject(error)
  );

  // Response interceptor for error handling
  api.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error) => {
      const originalRequest = error.config;
      
      // Safety check for originalRequest
      if (!originalRequest) {
        console.error('❌ Original request is undefined:', error);
        return Promise.reject(error);
      }
      
      // Don't attempt token refresh for auth endpoints (login, logout, refresh)
      const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
                            originalRequest.url?.includes('/auth/logout') || 
                            originalRequest.url?.includes('/auth/refresh-token');
      
      // Don't attempt token refresh for /auth/me endpoint (prevents logout loops)
      const isMeEndpoint = originalRequest.url?.includes('/auth/me');
      
      // Handle 401 errors with automatic token refresh (only for non-auth endpoints)
      if (error.response?.status === 401 && 
          !originalRequest._retry && 
          !isAuthEndpoint &&
          !isMeEndpoint) {
        
        originalRequest._retry = true;
        
        try {
          // Call refresh endpoint to get new tokens
          const refreshResponse = await api.post('/auth/refresh-token');
          
          if (refreshResponse.status === 200) {
            // Retry the original request with new tokens (cookies are automatically included)
            return api(originalRequest);
          }
        } catch (refreshError: any) {
          console.error('❌ Token refresh failed:', refreshError);
        }
        
        // If refresh failed, logout and redirect (but only once)
        if (import.meta.client) {
          const authStore = useAuthStore();
          // Only logout if not already on login page
          if (window.location.pathname !== '/login') {
            await authStore.logout();
            await navigateTo('/login');
          }
        }
        return Promise.reject(new Error('Authentication required'));
      }
      
      // For auth endpoints with 401, just reject the error without attempting refresh
      if (error.response?.status === 401 && (isAuthEndpoint || isMeEndpoint)) {
        return Promise.reject(error);
      }
      
      return Promise.reject(error);
    }
  );

  return api;
}

export const apiClient = {
  // Auth endpoints
  auth: {
    login: async (credentials: { email: string; password: string }) => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<{ user: any }>>('/auth/login', credentials);
      return response.data;
    },
    
    logout: async () => {
      const api = createApiInstance();
      try {
        const response = await api.post<ApiResponse<null>>('/auth/logout');
        return response.data;
      } catch (error: any) {
        // If logout fails due to authentication issues, still return success
        // This handles cases where the token is expired/invalid
        if (error.response?.status === 401 || error.response?.status === 403) {
          return {
            success: true,
            message: 'Logout successful (local cleanup only)',
            data: null
          };
        }
        throw error;
      }
    },
    
    refresh: async () => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<{ user: any }>>('/auth/refresh-token');
      return response.data;
    },
    
    me: async () => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>('/auth/me');
      return response.data;
    }
  },



  // School endpoints
  schools: {
    getAll: async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
      const api = createApiInstance();
      const response = await api.get<PaginatedResponse<any>>('/schools', { params });
      return response.data;
    },
    
    getById: async (id: string) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>(`/schools/${id}`);
      return response.data;
    },
    
    create: async (schoolData: FormData) => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<any>>('/schools', schoolData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    
    update: async (id: string, schoolData: FormData) => {
      const api = createApiInstance();
      const response = await api.put<ApiResponse<any>>(`/schools/${id}`, schoolData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    
    delete: async (id: string) => {
      const api = createApiInstance();
      const response = await api.delete<ApiResponse<null>>(`/schools/${id}`);
      return response.data;
    },

    // Module management (Super Admin controls, School Admin view-only)
    getModules: async (id: string) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>(`/schools/${id}/modules`);
      return response.data;
    },
    
    updateModules: async (id: string, modules: string[], subscriptionPlan?: string) => {
      const api = createApiInstance();
      const response = await api.put<ApiResponse<any>>(`/schools/${id}/modules`, { 
        modules, 
        subscription_plan: subscriptionPlan 
      });
      return response.data;
    },

    // Subscription plans
    getSubscriptionPlans: async () => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>('/schools/subscription-plans');
      return response.data;
    },

    requestUpgrade: async (schoolId: string, requestedPlan: string, reason: string) => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<any>>(`/schools/${schoolId}/request-upgrade`, {
        requested_plan: requestedPlan,
        reason
      });
      return response.data;
    },
  },

  // Branch endpoints
  branches: {
    getAll: async (params?: { page?: number; limit?: number }) => {
      const api = createApiInstance();
      const response = await api.get<PaginatedResponse<any>>('/branches', { params });
      return response.data;
    },
    
    getBySchool: async (schoolId: string, params?: { page?: number; limit?: number }) => {
      const api = createApiInstance();
      const response = await api.get<PaginatedResponse<any>>(`/branches/school/${schoolId}`, { params });
      return response.data;
    },
    
    getById: async (id: string) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>(`/branches/${id}`);
      return response.data;
    },
    
    create: async (branchData: any) => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<any>>('/branches', branchData);
      return response.data;
    },
    
    update: async (id: string, branchData: any) => {
      const api = createApiInstance();
      const response = await api.put<ApiResponse<any>>(`/branches/${id}`, branchData);
      return response.data;
    },
    
    delete: async (id: string) => {
      const api = createApiInstance();
      const response = await api.delete<ApiResponse<null>>(`/branches/${id}`);
      return response.data;
    }
  },

  // Fee Type endpoints
  feeTypes: {
    getAll: async (params?: { page?: number; limit?: number; category?: string }) => {
      const api = createApiInstance();
      const response = await api.get<PaginatedResponse<any>>('/fee-types', { params });
      return response.data;
    },
    
    getById: async (id: string) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>(`/fee-types/${id}`);
      return response.data;
    },
    
    create: async (feeTypeData: any) => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<any>>('/fee-types', feeTypeData);
      return response.data;
    },
    
    update: async (id: string, feeTypeData: any) => {
      const api = createApiInstance();
      const response = await api.put<ApiResponse<any>>(`/fee-types/${id}`, feeTypeData);
      return response.data;
    },
    
    delete: async (id: string) => {
      const api = createApiInstance();
      const response = await api.delete<ApiResponse<null>>(`/fee-types/${id}`);
      return response.data;
    }
  },

  // Enhanced Fee Invoice endpoints with reports
  feeInvoices: {
    /**
     * Get grouped invoices for better UI display
     * Groups invoices by receipt_group_id for paid/partial_paid invoices
     * @param params - Query parameters
     */
    getGrouped: async (params?: { 
      page?: number; 
      limit?: number; 
      academic_year?: string; 
      status?: string; 
      student_id?: string;
      payment_model?: 'monthly' | 'installment';
      class_name?: string;
      section?: string;
      branch_id?: string;
    }) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>('/fee-invoices/grouped', { params });
      return response.data;
    },

    /**
     * Get combined receipt for grouped payments
     * @param receiptGroupId - The receipt group ID
     */
    getCombinedReceipt: async (receiptGroupId: string) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>(`/fee-invoices/grouped-receipts/${receiptGroupId}`);
      return response.data;
    },
    
    getById: async (id: string) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>(`/fee-invoices/${id}`);
      return response.data;
    },
    
    generateInvoices: async (invoiceData: any) => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<any>>('/fee-invoices/generate', invoiceData);
      return response.data;
    },
    
    recordPayment: async (id: string, paymentData: any) => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<any>>(`/fee-invoices/${id}/payment`, paymentData);
      return response.data;
    },
    
    updateInvoice: async (id: string, invoiceData: any) => {
      const api = createApiInstance();
      const response = await api.put<ApiResponse<any>>(`/fee-invoices/${id}`, invoiceData);
      return response.data;
    },
    
    cancelInvoice: async (id: string) => {
      const api = createApiInstance();
      const response = await api.put<ApiResponse<any>>(`/fee-invoices/${id}/cancel`);
      return response.data;
    },
    
    getSummary: async (params?: { academic_year?: string; class?: string }) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>('/fee-invoices/summary', { params });
      return response.data;
    },

    getStats: async (params?: { academic_year?: string; class?: string }) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>('/fee-invoices/stats', { params });
      return response.data;
    },

    getMonthlyFeeStructures: async (params?: { payment_model?: string }) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>('/fee-structures', { params: { ...params, payment_model: 'monthly' } });
      return response.data;
    },
    
    generateReceipt: async (id: string) => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<any>>(`/fee-invoices/${id}/receipt`);
      return response.data;
    },
    
    getReceipt: async (id: string) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>(`/fee-invoices/${id}/receipt`);
      return response.data;
    },

    // New payment tracking endpoints
    getInvoicePayments: async (id: string, params?: { page?: number; limit?: number }) => {
      const api = createApiInstance();
      const response = await api.get<PaginatedResponse<any>>(`/fee-invoices/${id}/payments`, { params });
      return response.data;
    },

    getPaymentById: async (paymentId: string) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>(`/fee-invoices/payment/${paymentId}`);
      return response.data;
    },

    getPaymentReceipt: async (paymentId: string) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>(`/fee-invoices/payment/${paymentId}/receipt`);
      return response.data;
    },

    getStudentPayments: async (studentId: string, params?: { page?: number; limit?: number; academic_year?: string }) => {
      const api = createApiInstance();
      const response = await api.get<PaginatedResponse<any>>(`/fee-invoices/student/${studentId}/payments`, { params });
      return response.data;
    },



    // Smart payment allocation (amount-based with receipt grouping)
    recordSmartPayment: async (paymentData: {
      student_id: string;
      payment_amount: number;
      payment_method?: string;
      payment_date?: string;
      notes?: string;
      transaction_id?: string;
      cheque_number?: string;
      bank_name?: string;
      reference_number?: string;
    }) => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<any>>('/fee-invoices/smart-payment', paymentData);
      return response.data;
    },

    getStudentLedger: async (params: { student_id: string; academic_year?: string; page?: number; limit?: number }) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>('/fee-invoices/student-ledger', { params });
      return response.data;
    },

    getStudentDues: async (params: { student_id: string; academic_year?: string }) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>('/fee-invoices/student-dues', { params });
      return response.data;
    },

    getAvailableMonths: async (params: { student_id: string; academic_year?: string }) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>('/fee-invoices/available-months', { params });
      return response.data;
    },

    getGroupedReceipts: async (params: { student_id: string; academic_year?: string }) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>('/fee-invoices/grouped-receipts', { params });
      return response.data;
    },



    getBreakdown: async (params: { student_id: string; fee_structure_id: string; academic_year: string }) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>('/fee-invoices/breakdown', { params });
      return response.data;
    },

    adjustInvoice: async (id: string, adjustmentData: any) => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<any>>(`/fee-invoices/${id}/adjust`, adjustmentData);
      return response.data;
    },

    applyLateFees: async (id: string) => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<any>>(`/fee-invoices/${id}/late-fees`);
      return response.data;
    },

    // Report and export methods
    getReport: async (params?: { page?: number; limit?: number; academic_year?: string; status?: string; student_id?: string; class_id?: string; section_id?: string; fee_type_id?: string; payment_status?: string; date_from?: string; date_to?: string }) => {
      const api = createApiInstance();
      const response = await api.get<PaginatedResponse<any>>('/fee-invoices/report', { params });
      return response.data;
    },

    exportReport: async (queryString: string) => {
      const api = createApiInstance();
      const response = await api.get(`/fee-invoices/export?${queryString}`, { responseType: 'blob' });
      return response;
    },
  },

  // Unified Invoices endpoints (new - replaces separate monthly/fee invoice calls)
  invoices: {
    getAll: async (params?: { 
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
    }) => {
      const api = createApiInstance();
      const response = await api.get<PaginatedResponse<any>>('/invoices', { params });
      return response.data;
    },
    
    getSummary: async (params?: { payment_model?: 'monthly' | 'installment'; academic_year?: string; status?: string }) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>('/invoices/summary', { params });
      return response.data;
    },
  },





  // Enhanced Fee Structure endpoints
  feeStructures: {
    getAll: async (params?: any) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>('/fee-structures', { params });
      return response.data;
    },
    
    getWithContext: async (params?: { payment_model?: string; page?: number; limit?: number }) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>('/fee-structures/with-context', { params });
      return response.data;
    },
    
    getById: async (id: string) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>(`/fee-structures/${id}`);
      return response.data;
    },
    
    create: async (data: any) => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<any>>('/fee-structures', data);
      return response.data;
    },
    
    update: async (id: string, data: any) => {
      const api = createApiInstance();
      const response = await api.put<ApiResponse<any>>(`/fee-structures/${id}`, data);
      return response.data;
    },
    
    delete: async (id: string) => {
      const api = createApiInstance();
      const response = await api.delete<ApiResponse<any>>(`/fee-structures/${id}`);
      return response.data;
    },

    // New clone functionality
    clone: async (id: string, cloneData: any) => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<any>>(`/fee-structures/${id}/clone`, cloneData);
      return response.data;
    },
  },





  // Dashboard endpoints
  dashboard: {
    getStats: async () => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>('/dashboard/stats');
      return response.data;
    },
    
    getOverviewReport: async () => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>('/dashboard/overview-report');
      return response.data;
    },
    
    getSchoolReport: async () => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>('/dashboard/school-report');
      return response.data;
    },

    getRecentActivities: async (params?: { limit?: number }) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>('/dashboard/recent-activities', { params });
      return response.data;
    },

    getStudentsChartData: async () => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>('/dashboard/students-chart');
      return response.data;
    },

    getFeesChartData: async () => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>('/dashboard/fees-chart');
      return response.data;
    },

    getStudentDistributionData: async () => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>('/dashboard/student-distribution');
      return response.data;
    },

    getFeeTrendData: async () => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>('/dashboard/fee-trend');
      return response.data;
    },

    getFeeCollectionSummary: async (params?: { academic_year?: string }) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>('/dashboard/fee-collection-summary', { params });
      return response.data;
    },
  },

  // Academic Year endpoints
  academicYears: {
    getAll: async (params?: { page?: number; limit?: number }) => {
      const api = createApiInstance();
      const response = await api.get<PaginatedResponse<any>>('/academic-years', { params });
      return response.data;
    },
    
    getById: async (id: string) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>(`/academic-years/${id}`);
      return response.data;
    },
    
    create: async (yearData: any) => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<any>>('/academic-years', yearData);
      return response.data;
    },
    
    update: async (id: string, yearData: any) => {
      const api = createApiInstance();
      const response = await api.put<ApiResponse<any>>(`/academic-years/${id}`, yearData);
      return response.data;
    },
    
    delete: async (id: string) => {
      const api = createApiInstance();
      const response = await api.delete<ApiResponse<null>>(`/academic-years/${id}`);
      return response.data;
    },
    
    getDropdown: async (queryString?: string) => {
      const api = createApiInstance();
      const url = queryString ? `/academic-years/dropdown?${queryString}` : '/academic-years/dropdown';
      const response = await api.get<ApiResponse<any>>(url);
      return response.data;
    },
    
    getCurrent: async (queryString?: string) => {
      const api = createApiInstance();
      const url = queryString ? `/academic-years/current?${queryString}` : '/academic-years/current';
      const response = await api.get<ApiResponse<any>>(url);
      return response.data;
    },
    
    syncSchools: async () => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<any>>('/academic-years/sync-schools');
      return response.data;
    }
  },

  // Class endpoints
  classes: {
    getAll: async (params?: { page?: number; limit?: number }) => {
      const api = createApiInstance();
      const response = await api.get<PaginatedResponse<any>>('/classes', { params });
      return response.data;
    },
    
    getById: async (id: string) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>(`/classes/${id}`);
      return response.data;
    },
    
    create: async (classData: any) => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<any>>('/classes', classData);
      return response.data;
    },
    
    update: async (id: string, classData: any) => {
      const api = createApiInstance();
      const response = await api.put<ApiResponse<any>>(`/classes/${id}`, classData);
      return response.data;
    },
    
    delete: async (id: string) => {
      const api = createApiInstance();
      const response = await api.delete<ApiResponse<null>>(`/classes/${id}`);
      return response.data;
    },
    
    getDropdown: async (queryString?: string) => {
      const api = createApiInstance();
      const url = queryString ? `/classes/dropdown?${queryString}` : '/classes/dropdown';
      const response = await api.get<ApiResponse<any>>(url);
      return response.data;
    }
  },

  // Section endpoints
  sections: {
    getAll: async (params?: { page?: number; limit?: number; class_id?: string }) => {
      const api = createApiInstance();
      const response = await api.get<PaginatedResponse<any>>('/sections', { params });
      return response.data;
    },
    
    getById: async (id: string) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>(`/sections/${id}`);
      return response.data;
    },
    
    create: async (sectionData: any) => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<any>>('/sections', sectionData);
      return response.data;
    },
    
    update: async (id: string, sectionData: any) => {
      const api = createApiInstance();
      const response = await api.put<ApiResponse<any>>(`/sections/${id}`, sectionData);
      return response.data;
    },
    
    delete: async (id: string) => {
      const api = createApiInstance();
      const response = await api.delete<ApiResponse<null>>(`/sections/${id}`);
      return response.data;
    },
    
    getDropdown: async (queryString?: string) => {
      const api = createApiInstance();
      const url = queryString ? `/sections/dropdown?${queryString}` : '/sections/dropdown';
      const response = await api.get<ApiResponse<any>>(url);
      return response.data;
    }
  },

  // Enhanced Student endpoints with reports
  students: {
    getAll: async (params?: { page?: number; limit?: number; class?: string; section?: string; status?: string; academic_year?: string; branch_id?: string; class_id?: string; section_id?: string; search?: string; school_id?: string }) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>('/students', { params });
      return response.data;
    },
    
    getById: async (id: string) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>(`/students/${id}`);
      return response.data;
    },
    
    create: async (studentData: any) => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<any>>('/students', studentData);
      return response.data;
    },
    
    createWithFormData: async (formData: FormData) => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<any>>('/students', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    },
    
    bulkImport: async (formData: FormData) => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<any>>('/students/bulk-import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    },
    
    downloadTemplate: async (type: 'required' | 'complete' = 'complete') => {
      const api = createApiInstance();
      const response = await api.get('/students/import-template', {
        params: { type },
        responseType: 'blob'
      });
      return response;
    },
    
    update: async (id: string, studentData: any) => {
      const api = createApiInstance();
      const response = await api.put<ApiResponse<any>>(`/students/${id}`, studentData);
      return response.data;
    },
    
    updateWithFormData: async (id: string, formData: FormData) => {
      const api = createApiInstance();
      const response = await api.put<ApiResponse<any>>(`/students/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    },
    
    delete: async (id: string) => {
      const api = createApiInstance();
      const response = await api.delete<ApiResponse<any>>(`/students/${id}`);
      return response.data;
    },
    
    getByClass: async (params: { class_name?: string; class_names?: string; section?: string; academic_year?: string; branch_id?: string; status?: string; fee_structure_id?: string }) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>('/students/by-class', { params });
      return response.data;
    },
    
    getStats: async (params?: { academic_year?: string; school_id?: string; branch_id?: string; class_id?: string; section_id?: string }) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>('/students/stats', { params });
      return response.data;
    },
    
    getReport: async (params?: { page?: number; limit?: number; academic_year?: string; class_name?: string; section_name?: string; status?: string; school_id?: string }) => {
      const api = createApiInstance();
      const response = await api.get<PaginatedResponse<any>>('/students/report', { params });
      return response.data;
    },
    
    exportReport: async (queryString: string) => {
      const api = createApiInstance();
      const response = await api.get(`/students/export?${queryString}`, { responseType: 'blob' });
      return response;
    }
  },



  // Enhanced User endpoints with profile management
  users: {
    getAll: async (params?: { page?: number; limit?: number; role?: string; schoolId?: string; branchId?: string }) => {
      const api = createApiInstance();
      const response = await api.get<PaginatedResponse<any>>('/users', { params });
      return response.data;
    },
    
    getById: async (id: string) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>(`/users/${id}`);
      return response.data;
    },
    
    create: async (userData: any) => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<any>>('/users', userData);
      return response.data;
    },
    
    update: async (id: string, userData: any) => {
      const api = createApiInstance();
      const response = await api.put<ApiResponse<any>>(`/users/${id}`, userData);
      return response.data;
    },
    
    delete: async (id: string) => {
      const api = createApiInstance();
      const response = await api.delete<ApiResponse<null>>(`/users/${id}`);
      return response.data;
    },
    
    updateProfile: async (profileData: FormData) => {
      const api = createApiInstance();
      const response = await api.put<ApiResponse<any>>('/users/profile', profileData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    },
    
    changePassword: async (passwordData: { currentPassword: string; newPassword: string }) => {
      const api = createApiInstance();
      const response = await api.put<ApiResponse<null>>('/users/change-password', passwordData);
      return response.data;
    }
  },

  // Subscription endpoints
  subscriptions: {
    getSchoolsWithSubscriptions: async (params?: { page?: number; limit?: number; search?: string; status?: string; subscription_plan?: string; id?: string }) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>('/subscriptions/schools', { params });
      return response.data;
    },
    
    getSchoolWithSubscription: async (id: string) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>(`/subscriptions/schools/${id}`);
      return response.data;
    },
    
    getPlans: async (params?: { page?: number; limit?: number; is_active?: boolean }) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>('/subscriptions/plans', { params });
      return response.data;
    },
    
    getPlanById: async (id: string) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>(`/subscriptions/plans/${id}`);
      return response.data;
    },
    
    createPlan: async (planData: any) => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<any>>('/subscriptions/plans', planData);
      return response.data;
    },
    
    updatePlan: async (id: string, planData: any) => {
      const api = createApiInstance();
      const response = await api.put<ApiResponse<any>>(`/subscriptions/plans/${id}`, planData);
      return response.data;
    },
    
    deletePlan: async (id: string) => {
      const api = createApiInstance();
      const response = await api.delete<ApiResponse<null>>(`/subscriptions/plans/${id}`);
      return response.data;
    },
    
    createSchoolWithSubscription: async (schoolData: FormData) => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<any>>('/subscriptions/schools', schoolData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    },
    
    updateSchoolSubscription: async (schoolId: string, schoolData: FormData) => {
      const api = createApiInstance();
      const response = await api.put<ApiResponse<any>>(`/subscriptions/schools/${schoolId}`, schoolData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    },
    
    getSchoolTransactions: async (schoolId: string, params?: { page?: number; limit?: number; payment_status?: string; payment_method?: string }) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>(`/subscriptions/schools/${schoolId}/transactions`, { params });
      return response.data;
    },
    
    createManualTransaction: async (transactionData: any) => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<any>>(`/subscriptions/schools/${transactionData.school_id}/transactions`, transactionData);
      return response.data;
    },
    
    getSubscriptionStats: async () => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>('/subscriptions/stats');
      return response.data;
    },
    
    suspendSchool: async (schoolId: string) => {
      const api = createApiInstance();
      const response = await api.patch<ApiResponse<any>>(`/schools/${schoolId}/suspend`);
      return response.data;
    },
    
    reactivateSchool: async (schoolId: string) => {
      const api = createApiInstance();
      const response = await api.patch<ApiResponse<any>>(`/schools/${schoolId}/reactivate`);
      return response.data;
    },
    
    // Renewal Requests
    getRenewalRequests: async (params?: { page?: number; limit?: number; status?: string; school_id?: string; request_type?: string }) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>('/subscriptions/renewal-requests', { params });
      return response.data;
    },
    
    createRenewalRequest: async (requestData: any) => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<any>>('/subscriptions/renewal-requests', requestData);
      return response.data;
    },
    
    reviewRenewalRequest: async (requestId: string, reviewData: any) => {
      const api = createApiInstance();
      const response = await api.put<ApiResponse<any>>(`/subscriptions/renewal-requests/${requestId}/review`, reviewData);
      return response.data;
    }
  }
};

export default apiClient;