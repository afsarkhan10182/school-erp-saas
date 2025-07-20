import { ref } from 'vue';
import { apiClient } from '~/utils/api';

export function useBranches() {
  const branches = ref<any[]>([]);
  const loading = ref(false);
  const error = ref('');

  // Fetch all branches for a school
  const fetchBranches = async (schoolId: string) => {
    loading.value = true;
    error.value = '';
    try {
      console.log('🔍 Fetching branches for school:', schoolId);
      
      const response = await apiClient.branches.getAll(schoolId);
      
      console.log('🔍 Branches API response:', response);
      
      if (response.success) {
        // Handle different response structures
        const responseData = response.data as any;
        if (responseData?.branches) {
          // Backend returns { branches: [...], pagination: {...} }
          branches.value = responseData.branches;
        } else if (responseData?.items) {
          // Fallback for paginated response
          branches.value = responseData.items;
        } else if (Array.isArray(responseData)) {
          // Direct array response
          branches.value = responseData;
        } else {
          branches.value = [];
        }
        console.log('🔍 Branches loaded successfully:', branches.value.length);
        return branches.value;
      } else {
        error.value = response.message || 'Failed to fetch branches.';
        console.error('❌ Branches API error:', response.message);
        branches.value = [];
        return [];
      }
    } catch (e) {
      console.error('❌ Error fetching branches:', e);
      error.value = 'Network error while fetching branches.';
      branches.value = [];
      return [];
    } finally {
      loading.value = false;
    }
  };

  // Fetch all branches (optionally with filters)
  const fetchAllBranches = async (params = {}) => {
    loading.value = true;
    error.value = '';
    try {
      const response = await apiClient.branches.getAll(undefined, params);
      if (response.success) {
        // Handle different response structures
        const responseData = response.data as any;
        if (responseData?.branches) {
          // Backend returns { branches: [...], pagination: {...} }
          branches.value = responseData.branches;
        } else if (responseData?.items) {
          // Fallback for paginated response
          branches.value = responseData.items;
        } else if (Array.isArray(responseData)) {
          // Direct array response
          branches.value = responseData;
        } else {
          branches.value = [];
        }
      } else {
        error.value = response.message || 'Failed to fetch branches.';
      }
    } catch (e) {
      console.error('Error fetching all branches:', e);
      error.value = 'Network error.';
    } finally {
      loading.value = false;
    }
  };

  // Create a branch (with file upload support)
  const createBranch = async (formData: FormData) => {
    loading.value = true;
    error.value = '';
    try {
      // For FormData, we need to use direct fetch since axios doesn't handle it well
      const config = useRuntimeConfig();
      const apiBase = config.public.apiBase;
      const token = useCookie('auth-token').value;
      
      const res = await fetch(`${apiBase}/branches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Do not set Content-Type for FormData
        },
        body: formData
      });
      const data = await res.json();
      if (!data.success) {
        error.value = data.message || 'Failed to create branch.';
        return null;
      }
      return data.data;
    } catch (e) {
      console.error('Error creating branch:', e);
      error.value = 'Network error.';
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Delete a branch
  const deleteBranch = async (branchId: string) => {
    loading.value = true;
    error.value = '';
    try {
      const response = await apiClient.branches.delete(branchId);
      if (!response.success) {
        error.value = response.message || 'Failed to delete branch.';
        return false;
      }
      return true;
    } catch (e) {
      console.error('Error deleting branch:', e);
      error.value = 'Network error.';
      return false;
    } finally {
      loading.value = false;
    }
  };

  return {
    branches,
    loading,
    error,
    fetchBranches,
    fetchAllBranches,
    createBranch,
    deleteBranch
  };
} 