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
      const response = await apiClient.branches.getBySchool(schoolId);
      
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
      const response = await apiClient.branches.getAll(params);
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
      
      // Don't set Authorization header - let cookies be sent automatically
      const res = await fetch(`${apiBase}/branches`, {
        method: 'POST',
        credentials: 'include', // Include cookies automatically
        body: formData
      });
      const data = await res.json();
      if (!data.success) {
        // Collect detailed validation errors if present
        const fieldErrors = (data.fieldErrors || []) as Array<{ field?: string; message?: string }>;
        const errorMap = data.errors || {};
        const collected: string[] = [];

        if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
          fieldErrors.forEach((fe) => {
            if (fe?.message) collected.push(fe.message);
          });
        }
        if (errorMap && typeof errorMap === 'object') {
          Object.values(errorMap).forEach((val: any) => {
            if (Array.isArray(val)) {
              collected.push(...val);
            } else if (typeof val === 'string') {
              collected.push(val);
            }
          });
        }

        error.value = collected.length > 0 ? collected.join(', ') : (data.message || 'Failed to create branch.');
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

  // Get branch by ID
  const getBranchById = async (branchId: string) => {
    loading.value = true;
    error.value = '';
    try {
      const response = await apiClient.branches.getById(branchId);
      if (!response.success) {
        error.value = response.message || 'Failed to fetch branch.';
        return null;
      }
      return response.data;
    } catch (e) {
      console.error('Error fetching branch:', e);
      error.value = 'Network error.';
      return null;
    } finally {
      loading.value = false;
    }
  };

  // Update a branch (with file upload support)
  const updateBranch = async (branchId: string, formData: FormData) => {
    loading.value = true;
    error.value = '';
    try {
      // For FormData, we need to use direct fetch since axios doesn't handle it well
      const config = useRuntimeConfig();
      const apiBase = config.public.apiBase;
      
      // Don't set Authorization header - let cookies be sent automatically
      const res = await fetch(`${apiBase}/branches/${branchId}`, {
        method: 'PUT',
        credentials: 'include', // Include cookies automatically
        body: formData
      });
      const data = await res.json();
      if (!data.success) {
        error.value = data.message || 'Failed to update branch.';
        return null;
      }
      return data.data;
    } catch (e) {
      console.error('Error updating branch:', e);
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
    getBranchById,
    updateBranch,
    deleteBranch
  };
} 