import { ref, computed } from 'vue';
import { Students } from '~/api/students';
import { useToast } from '~/composables/useToast';
import { useAuth } from '~/composables/useAuth';

export function useStudents() {
  const { showToast, showApiError } = useToast();
  const { user } = useAuth();

  // State
  const students = ref([]);
  const loading = ref(false);
  const saving = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const activeStudents = computed(() =>
    students.value.filter(student => student.is_active !== false)
  );

  // Methods
  const loadStudents = async (filters?: {
    class_id?: string;
    section_id?: string;
    branch_id?: string;
    school_id?: string;
    page?: number;
    limit?: number;
    search?: string;
    academic_year?: string;
    stream_id?: string;
  }) => {
    loading.value = true;
    error.value = null;

    try {
      const params = {
        page: 1,
        limit: 1000,
        ...filters
      };

      const response = await Students.getAll(params);

      if (response.success) {
        // Handle paginated response from backend
        if (response.data && response.pagination) {
          students.value = response.data || [];
          return {
            data: response.data,
            pagination: response.pagination
          };
        } else if (response.data && Array.isArray(response.data)) {
          // Handle array response (fallback)
          students.value = response.data;
          return {
            data: response.data,
            pagination: {
              current_page: 1,
              limit: response.data.length,
              total_count: response.data.length
            }
          };
        } else {
          students.value = [];
          return {
            data: [],
            pagination: { current_page: 1, limit: 0, total_count: 0 }
          };
        }
      } else {
        students.value = [];
        return {
          data: [],
          pagination: { current_page: 1, limit: 0, total_count: 0 }
        };
      }
    } catch (err: any) {
      error.value = 'Failed to load students';
      showApiError(err, 'Failed to load students');
      students.value = [];
      return {
        data: [],
        pagination: { current_page: 1, limit: 0, total_count: 0 }
      };
    } finally {
      loading.value = false;
    }
  };

  const createStudent = async (studentData: any) => {
    saving.value = true;
    try {
      const response = await Students.create(studentData);
      if (response.success) {
        showToast('Student created successfully', 'success');
        await loadStudents();
        return response.data;
      }
    } catch (err: any) {
      showApiError(err, 'Failed to create student');
      throw err;
    } finally {
      saving.value = false;
    }
  };

  const updateStudent = async (id: string, studentData: any) => {
    saving.value = true;
    try {
      const response = await Students.update(id, studentData);
      if (response.success) {
        showToast('Student updated successfully', 'success');
        await loadStudents();
        return response.data;
      }
    } catch (err: any) {
      showApiError(err, 'Failed to update student');
      throw err;
    } finally {
      saving.value = false;
    }
  };

  const deleteStudent = async (id: string) => {
    saving.value = true;
    try {
      const response = await Students.delete(id);
      if (response.success) {
        showToast('Student deleted successfully', 'success');
        await loadStudents();
        return true;
      }
    } catch (err: any) {
      showApiError(err, 'Failed to delete student');
      throw err;
    } finally {
      saving.value = false;
    }
  };

  const getStudentById = async (id: string) => {
    loading.value = true;
    try {
      const response = await Students.getById(id);
      if (response.success) {
        return response.data;
      }
    } catch (err: any) {
      showApiError(err, 'Failed to load student details');
      return null;
    } finally {
      loading.value = false;
    }
  };

  const resetState = () => {
    students.value = [];
    error.value = null;
  };

  return {
    // State
    students,
    loading,
    saving,
    error,

    // Computed
    activeStudents,

    // Methods
    loadStudents,
    createStudent,
    updateStudent,
    deleteStudent,
    getStudentById,
    resetState
  };
}
