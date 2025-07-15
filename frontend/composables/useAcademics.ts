import { ref, computed } from 'vue';
import { apiClient } from '~/utils/api';

interface AcademicYear {
  id: string;
  name: string;
  code: string;
  is_current: boolean;
  status: string;
}

interface Class {
  id: string;
  name: string;
  code: string;
  numeric_value?: number;
  is_active?: boolean;
}

interface Section {
  id: string;
  name: string;
  capacity?: number;
  is_active?: boolean;
}

export function useAcademics() {
  const academicYears = ref<AcademicYear[]>([]);
  const classes = ref<Class[]>([]);
  const sections = ref<Section[]>([]);
  const loading = ref(false);
  const error = ref('');

  // Get all academic years for dropdown
  const fetchAcademicYears = async (schoolId?: string) => {
    loading.value = true;
    error.value = '';
    try {
      console.log('🔍 Fetching academic years for school:', schoolId);
      const params = new URLSearchParams();
      if (schoolId) params.append('school_id', schoolId);
      
      const response = await apiClient.academicYears.getDropdown(params.toString());
      console.log('🔍 Academic years API response:', response);
      
      if (response.success) {
        academicYears.value = response.data || [];
        console.log('✅ Academic years loaded:', academicYears.value);
        return response.data;
      } else {
        error.value = response.message || 'Failed to fetch academic years.';
        console.error('❌ Academic years API error:', response.message);
        return [];
      }
    } catch (e) {
      console.error('❌ Error fetching academic years:', e);
      error.value = 'Network error while fetching academic years.';
      return [];
    } finally {
      loading.value = false;
    }
  };

  // Get all classes for dropdown with optional branch filtering
  const fetchClasses = async (schoolId?: string, branchId?: string) => {
    loading.value = true;
    error.value = '';
    try {
      const params = new URLSearchParams();
      if (schoolId) params.append('school_id', schoolId);
      if (branchId) params.append('branch_id', branchId);
      
      const response = await apiClient.classes.getDropdown(params.toString());
      if (response.success) {
        classes.value = response.data || [];
        return response.data;
      } else {
        error.value = response.message || 'Failed to fetch classes.';
        return [];
      }
    } catch (e) {
      console.error('Error fetching classes:', e);
      error.value = 'Network error while fetching classes.';
      return [];
    } finally {
      loading.value = false;
    }
  };

  // Get sections for dropdown with optional class filtering
  const fetchSections = async (schoolId?: string, branchId?: string, classId?: string) => {
    loading.value = true;
    error.value = '';
    try {
      const params = new URLSearchParams();
      if (schoolId) params.append('school_id', schoolId);
      if (branchId) params.append('branch_id', branchId);
      if (classId) params.append('class_id', classId);
      
      const response = await apiClient.sections.getDropdown(params.toString());
      if (response.success) {
        sections.value = response.data || [];
        return response.data;
      } else {
        error.value = response.message || 'Failed to fetch sections.';
        return [];
      }
    } catch (e) {
      console.error('Error fetching sections:', e);
      error.value = 'Network error while fetching sections.';
      return [];
    } finally {
      loading.value = false;
    }
  };

  // Get current academic year
  const getCurrentAcademicYear = async (schoolId?: string) => {
    try {
      const params = new URLSearchParams();
      if (schoolId) params.append('school_id', schoolId);
      
      const response = await apiClient.academicYears.getCurrent(params.toString());
      if (response.success) {
        return response.data;
      }
      return null;
    } catch (e) {
      console.error('Error fetching current academic year:', e);
      return null;
    }
  };

  // Auto-load sections when class changes
  const loadSectionsByClass = async (classId: string, schoolId?: string, branchId?: string) => {
    if (!classId) {
      sections.value = [];
      return [];
    }
    return await fetchSections(schoolId, branchId, classId);
  };

  // Computed values
  const currentAcademicYear = computed(() => {
    return academicYears.value.find(year => year.is_current) || academicYears.value[0];
  });

  const activeAcademicYears = computed(() => {
    return academicYears.value.filter(year => year.status === 'active');
  });

  const activeClasses = computed(() => {
    return classes.value.filter(cls => cls.is_active !== false);
  });

  const activeSections = computed(() => {
    return sections.value.filter(section => section.is_active !== false);
  });

  return {
    // State
    academicYears,
    classes,
    sections,
    loading,
    error,

    // Methods
    fetchAcademicYears,
    fetchClasses,
    fetchSections,
    getCurrentAcademicYear,
    loadSectionsByClass,

    // Computed
    currentAcademicYear,
    activeAcademicYears,
    activeClasses,
    activeSections,
  };
} 