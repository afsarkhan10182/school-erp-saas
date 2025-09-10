import { ref } from 'vue';
import { Branches } from '~/api/administration/branches';

export function useBranches() {
  const branches = ref<any[]>([]);
  const loading = ref(false);
  const error = ref('');

  // Fetch all branches for a school
  const fetchBranches = async (schoolId: string) => {
    loading.value = true;
    error.value = '';
    try {
      const response = await Branches.getForDropdown({ school_id: schoolId });

      if (response.success) {
        // Dropdown endpoint returns data directly as an array
        branches.value = response.data || [];
        return branches.value;
      } else {
        error.value = response.message || 'Failed to fetch branches.';
        branches.value = [];
        return [];
      }
    } catch (e) {
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
      const response = await Branches.getForDropdown(params);
      if (response.success) {
        // Dropdown endpoint returns data directly as an array
        branches.value = response.data || [];
      } else {
        error.value = response.message || 'Failed to fetch branches.';
      }
    } catch (e) {
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
      const response = await Branches.create(formData);
      if (!response.success) {
        // Collect detailed validation errors if present
        const fieldErrors = (response.fieldErrors || []) as Array<{
          field?: string;
          message?: string;
        }>;
        const errorMap = response.errors || {};
        const collected: string[] = [];

        if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
          fieldErrors.forEach(fe => {
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

        error.value =
          collected.length > 0
            ? collected.join(', ')
            : response.message || 'Failed to create branch.';
        return null;
      }
      return response.data;
    } catch (e) {
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
      const response = await Branches.getById(branchId);
      if (!response.success) {
        error.value = response.message || 'Failed to fetch branch.';
        return null;
      }
      return response.data;
    } catch (e) {
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
      const response = await Branches.update(branchId, formData);
      if (!response.success) {
        error.value = response.message || 'Failed to update branch.';
        return null;
      }
      return response.data;
    } catch (e) {
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
      const response = await Branches.delete(branchId);
      if (!response.success) {
        error.value = response.message || 'Failed to delete branch.';
        return false;
      }
      return true;
    } catch (e) {
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
