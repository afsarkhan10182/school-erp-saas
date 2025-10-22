import { ref, reactive } from 'vue';
import { Certificates } from '~/api/administration/certificates';

export const useCertificateTemplates = () => {
  const templates = ref([]);
  const loading = ref(false);
  const pagination = reactive({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10
  });

  /**
   * Load certificate templates with filters
   */
  const loadTemplates = async (filters = {}) => {
    try {
      loading.value = true;

      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
          params.append(key, filters[key]);
        }
      });

      const response = await Certificates.getAll(filters);

      if (response.success) {
        templates.value = response.data.templates;
        Object.assign(pagination, response.data.pagination);
      }
    } catch (error) {
      console.error('Error loading certificate templates:', error);
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
      console.error('Error fetching certificate template:', error);
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
      console.error('Error creating certificate template:', error);
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
      console.error('Error updating certificate template:', error);
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
      console.error('Error deleting certificate template:', error);
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
      console.error('Error fetching QR code options:', error);
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
        return response.data;
      }
      throw new Error('Failed to generate student certificates');
    } catch (error) {
      console.error('Error generating student certificates:', error);
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
        return response.data;
      }
      throw new Error('Failed to generate employee certificates');
    } catch (error) {
      console.error('Error generating employee certificates:', error);
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
