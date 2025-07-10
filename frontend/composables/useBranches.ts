import { ref } from 'vue';
import { useCookie } from 'nuxt/app';

export function useBranches() {
  const branches = ref([]);
  const loading = ref(false);
  const error = ref('');

  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;

  // Fetch all branches for a school
  const fetchBranches = async (schoolId: string) => {
    loading.value = true;
    error.value = '';
    try {
      const token = useCookie('auth-token').value;
      const res = await fetch(`${apiBase}/schools/${schoolId}/branches`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        branches.value = data.data.branches || [];
      } else {
        error.value = data.message || 'Failed to fetch branches.';
      }
    } catch (e) {
      error.value = 'Network error.';
    } finally {
      loading.value = false;
    }
  };

  // Fetch all branches (optionally with filters)
  const fetchAllBranches = async (params = {}) => {
    loading.value = true;
    error.value = '';
    try {
      const token = localStorage.getItem('auth-token');
      const queryString = new URLSearchParams(params).toString();
      const res = await fetch(`${apiBase}/branches${queryString ? '?' + queryString : ''}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        branches.value = data.data.branches || data.data.items || [];
      } else {
        error.value = data.message || 'Failed to fetch branches.';
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
      const token = localStorage.getItem('auth-token');
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
      const token = localStorage.getItem('auth-token');
      const res = await fetch(`${apiBase}/branches/${branchId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!data.success) {
        error.value = data.message || 'Failed to delete branch.';
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
    deleteBranch
  };
} 