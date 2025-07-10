import { ref } from 'vue';
import { useCookie } from 'nuxt/app';

export function useSchools() {
  const schools = ref([]);
  const loading = ref(false);
  const error = ref('');

  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;

  const fetchSchools = async () => {
    loading.value = true;
    error.value = '';
    try {
      const token = useCookie('auth-token').value;
      const res = await fetch(`${apiBase}/schools`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        schools.value = data.data.schools || [];
      } else {
        error.value = data.message || 'Failed to fetch schools.';
      }
    } catch (e) {
      error.value = 'Network error.';
    } finally {
      loading.value = false;
    }
  };

  const createSchool = async (schoolData: any) => {
    loading.value = true;
    error.value = '';
    try {
      const token = useCookie('auth-token').value;
      const res = await fetch(`${apiBase}/schools`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(schoolData)
      });
      const data = await res.json();
      if (!data.success) {
        error.value = data.message || 'Failed to create school.';
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

  const updateSchool = async (id: string, schoolData: any) => {
    loading.value = true;
    error.value = '';
    try {
      const token = useCookie('auth-token').value;
      const res = await fetch(`${apiBase}/schools/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(schoolData)
      });
      const data = await res.json();
      if (!data.success) {
        error.value = data.message || 'Failed to update school.';
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

  const deleteSchool = async (id: string) => {
    loading.value = true;
    error.value = '';
    try {
      const token = useCookie('auth-token').value;
      const res = await fetch(`${apiBase}/schools/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!data.success) {
        error.value = data.message || 'Failed to delete school.';
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

  const getSchoolById = async (id: string) => {
    loading.value = true;
    error.value = '';
    try {
      const token = useCookie('auth-token').value;
      const res = await fetch(`${apiBase}/schools/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!data.success) {
        error.value = data.message || 'Failed to fetch school.';
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