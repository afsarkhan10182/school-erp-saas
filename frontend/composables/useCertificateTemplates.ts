import { ref, reactive } from 'vue';
import { Certificates } from '~/api/administration/certificates';

interface CertificateTemplate {
  id: string;
  name: string;
  background_image?: string | null;
  logo_image?: string | null;
  signature_image?: string | null;
  user_type: string;
  page_layout: string;
  created_at: string;
  branch?: {
    name: string;
  };
  [key: string]: any;
}

interface Pagination {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: Pagination;
  templates?: CertificateTemplate[];
}

// Helper function to get full image URL
const getFullImageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  // If it's already a full URL, return as is
  if (path.startsWith('http') || path.startsWith('blob:')) {
    return path;
  }
  // Otherwise, prepend the API base URL if it's a relative path
  const baseUrl = process.env.NUXT_PUBLIC_API_BASE_URL || '';
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

export const useCertificateTemplates = () => {
  const templates = ref<CertificateTemplate[]>([]);
  const loading = ref(false);
  const pagination = reactive<Pagination>({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10
  });

  /**
   * Load certificate templates with filters
   */
  const loadTemplates = async (filters: Record<string, any> = {}) => {
    try {
      loading.value = true;

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          params.append(key, String(value));
        }
      });

      const response = await Certificates.getAll(filters);

      // Handle response structure
      // apiCall returns response.data from axios, so if backend returns:
      // { success: true, data: { templates: [...], pagination: {...} } }
      // Then apiCall returns: { success: true, data: { templates: [...], pagination: {...} } }
      let templatesList: CertificateTemplate[] = [];

      if (response && response.success) {
        // Primary structure: response.data.templates
        if (response.data && response.data.templates && Array.isArray(response.data.templates)) {
          templatesList = response.data.templates;
        }
        // Fallback: response.data is directly an array
        else if (response.data && Array.isArray(response.data)) {
          templatesList = response.data;
        }
        // Fallback: response.templates
        else if (response.templates && Array.isArray(response.templates)) {
          templatesList = response.templates;
        }
        // Fallback: response is directly the data object
        else if (
          response.data &&
          response.data.constructor === Object &&
          !response.data.templates
        ) {
          // If data is an object but doesn't have templates, maybe templates are at root
          templatesList = [];
        }
      }

      // Process templates to ensure image URLs are complete
      templates.value = templatesList.map(template => ({
        ...template,
        background_image: template.background_image
          ? getFullImageUrl(template.background_image)
          : null,
        logo_image: template.logo_image ? getFullImageUrl(template.logo_image) : null,
        signature_image: template.signature_image ? getFullImageUrl(template.signature_image) : null
      }));

      // Handle pagination
      if (response && response.success) {
        if (response.data?.pagination) {
          Object.assign(pagination, response.data.pagination);
        } else if (response.pagination) {
          Object.assign(pagination, response.pagination);
        }
      }
    } catch (error) {
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Get a single certificate template by ID
   */
  const getTemplate = async (id: string) => {
    try {
      const response = await Certificates.getById(id);

      if (response.success) {
        return response.data;
      }
      throw new Error('Failed to fetch template');
    } catch (error) {
      throw error;
    }
  };

  /**
   * Create a new certificate template
   */
  const createTemplate = async (templateData: FormData) => {
    try {
      const response = await Certificates.create(templateData);

      if (response.success) {
        return response.data;
      }
      throw new Error('Failed to create template');
    } catch (error) {
      throw error;
    }
  };

  /**
   * Update an existing certificate template
   */
  const updateTemplate = async (id: string, templateData: FormData) => {
    try {
      const response = await Certificates.update(id, templateData);

      if (response.success) {
        return response.data;
      }
      throw new Error('Failed to update template');
    } catch (error) {
      throw error;
    }
  };

  /**
   * Delete a certificate template
   */
  const deleteTemplate = async (id: string) => {
    try {
      const response = await Certificates.delete(id);

      if (response.success) {
        return true;
      }
      throw new Error('Failed to delete template');
    } catch (error) {
      throw error;
    }
  };

  /**
   * Get QR code options for a specific user type
   */
  const getQrCodeOptions = async (userType: 'student' | 'employee') => {
    try {
      const response = await Certificates.getQrCodeOptions(userType);

      if (response.success) {
        return response.data;
      }
      throw new Error('Failed to fetch QR code options');
    } catch (error) {
      throw error;
    }
  };

  /**
   * Generate certificates for students
   */
  const generateStudentCertificates = async (data: {
    student_ids: string[];
    template_id: string;
    print_date: string;
    branch_id?: string;
    class_id?: string;
    section_id?: string;
  }) => {
    try {
      const response = await Certificates.generateStudentCertificates(data);

      if (response.success) {
        return response;
      }
      throw new Error(response.message || 'Failed to generate student certificates');
    } catch (error) {
      throw error;
    }
  };

  /**
   * Generate certificates for employees
   */
  const generateEmployeeCertificates = async (data: {
    employee_ids: string[];
    template_id: string;
    print_date: string;
    branch_id?: string;
  }) => {
    try {
      const response = await Certificates.generateEmployeeCertificates(data);

      if (response.success) {
        return response;
      }
      throw new Error(response.message || 'Failed to generate employee certificates');
    } catch (error) {
      throw error;
    }
  };

  return {
    templates,
    loading,
    pagination,
    loadTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getQrCodeOptions,
    generateStudentCertificates,
    generateEmployeeCertificates
  };
};
