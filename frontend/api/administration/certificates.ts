import { apiCall } from '~/utils/api';

export const Certificates = {
  // Get all certificate templates
  getAll: async (params = {}) => {
    return await apiCall('get', '/certificate-templates', { params });
  },

  // Get a single certificate template
  getById: async (id: string) => {
    return await apiCall('get', `/certificate-templates/${id}`);
  },

  // Create a new certificate template
  create: async (templateData: FormData) => {
    const api = await import('~/utils/api').then(m => m.createApiInstance());
    const response = await api.post('/certificate-templates', templateData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Update a certificate template
  update: async (id: string, templateData: FormData) => {
    const api = await import('~/utils/api').then(m => m.createApiInstance());
    const response = await api.put(`/certificate-templates/${id}`, templateData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Delete a certificate template
  delete: async (id: string) => {
    return await apiCall('delete', `/certificate-templates/${id}`);
  },

  // Get QR code options
  getQrCodeOptions: async (userType: 'student' | 'employee') => {
    return await apiCall('get', `/certificate-templates/qr-code-options?user_type=${userType}`);
  },

  // Generate certificates for students
  generateStudentCertificates: async (data: {
    student_ids: string[];
    template_id: string;
    print_date: string;
    branch_id?: string;
    class_id?: string;
    section_id?: string;
  }) => {
    return await apiCall('post', '/certificates/students', data);
  },

  // Generate certificates for employees
  generateEmployeeCertificates: async (data: {
    employee_ids: string[];
    template_id: string;
    print_date: string;
    branch_id?: string;
  }) => {
    return await apiCall('post', '/certificates/employees', data);
  }
};
