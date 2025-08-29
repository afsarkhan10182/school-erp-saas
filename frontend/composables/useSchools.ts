import { ref } from 'vue';
import { apiClient } from '~/utils/api';

export function useSchools() {
  const schools = ref<any[]>([]);
  const loading = ref(false);
  const error = ref('');

  // Enhanced fetchSchools that can optionally get subscription details
  const fetchSchools = async (includeSubscriptions = false) => {
    loading.value = true;
    error.value = '';
    try {
      if (includeSubscriptions) {
        // Use subscription endpoint for enhanced data
        const response = await apiClient.saas.getSchoolsWithSubscriptions();
        if (response.success) {
          schools.value = response.data.schools || [];
        } else {
          error.value = response.message || 'Failed to fetch schools with subscriptions.';
        }
      } else {
        // Use regular school endpoint for basic data
        const response = await apiClient.schools.getAll();
        if (response.success) {
          // Type assertion to handle actual API response structure
          const responseData = response.data as any;
          schools.value = responseData?.schools || responseData?.items || [];
        } else {
          error.value = response.message || 'Failed to fetch schools.';
        }
      }
    } catch (e) {
      console.error('Error fetching schools:', e);
      error.value = 'Network error.';
    } finally {
      loading.value = false;
    }
  };

  const createSchool = async (schoolData: any) => {
    loading.value = true;
    error.value = '';
    try {
      const response = await apiClient.schools.create(schoolData);
      if (!response.success) {
        error.value = response.message || 'Failed to create school.';
        return null;
      }
      return response.data;
    } catch (e) {
      console.error('Error creating school:', e);
      error.value = 'Network error.';
      return null;
    } finally {
      loading.value = false;
    }
  };

  const updateSchool = async (id: string, schoolData: any) => {
    loading.value = true;
    error.value = '';
    try {
      const response = await apiClient.schools.update(id, schoolData);
      if (!response.success) {
        error.value = response.message || 'Failed to update school.';
        return null;
      }
      return response.data;
    } catch (e) {
      console.error('Error updating school:', e);
      error.value = 'Network error.';
      return null;
    } finally {
      loading.value = false;
    }
  };

  const deleteSchool = async (id: string) => {
    loading.value = true;
    error.value = '';
    try {
      const response = await apiClient.schools.delete(id);
      if (!response.success) {
        error.value = response.message || 'Failed to delete school.';
        return false;
      }
      return true;
    } catch (e) {
      console.error('Error deleting school:', e);
      error.value = 'Network error.';
      return false;
    } finally {
      loading.value = false;
    }
  };

  const getSchoolById = async (id: string) => {
    loading.value = true;
    error.value = '';
    try {
      const response = await apiClient.schools.getById(id);
      if (!response.success) {
        error.value = response.message || 'Failed to fetch school.';
        return null;
      }
      return response.data;
    } catch (e) {
      console.error('Error fetching school:', e);
      error.value = 'Network error.';
      return null;
    } finally {
      loading.value = false;
    }
  };

  return {
    schools,
    loading,
    error,
    fetchSchools,
    createSchool,
    updateSchool,
    deleteSchool,
    getSchoolById
  };
} 