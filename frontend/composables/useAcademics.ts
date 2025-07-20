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
  branch?: {
    id: string;
    name: string;
    code?: string;
  };
}

interface Section {
  id: string;
  name: string;
  capacity?: number;
  current_strength?: number;
  is_active?: boolean;
  class?: {
    id: string;
    name: string;
    code: string;
  };
  branch?: {
    id: string;
    name: string;
    code?: string;
  };
}

export function useAcademics() {
  const academicYears = ref<AcademicYear[]>([]);
  const classes = ref<Class[]>([]);
  const sections = ref<Section[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed properties for active items
  const activeAcademicYears = computed(() => 
    academicYears.value.filter(year => year.status === 'active')
  );

  const activeClasses = computed(() => 
    classes.value.filter(cls => cls.is_active !== false)
  );

  const activeSections = computed(() => 
    sections.value.filter(section => section.is_active !== false)
  );

  const currentAcademicYear = computed(() => 
    academicYears.value.find(year => year.is_current) || null
  );

  const fetchAcademicYears = async (schoolId?: string) => {
    loading.value = true;
    error.value = null;
    try {
      const params = new URLSearchParams();
      if (schoolId) params.append('school_id', schoolId);
      
      const response = await apiClient.academicYears.getDropdown(params.toString());
      academicYears.value = response.data || [];
    } catch (err) {
      console.error('Error fetching academic years:', err);
      error.value = 'Failed to fetch academic years';
    } finally {
      loading.value = false;
    }
  };

  const fetchClasses = async (schoolId?: string, branchId?: string) => {
    console.log('🔍 fetchClasses called with schoolId:', schoolId, 'branchId:', branchId);
    loading.value = true;
    error.value = null;
    try {
      const params = new URLSearchParams();
      if (schoolId) params.append('school_id', schoolId);
      if (branchId) params.append('branch_id', branchId);
      
      console.log('🔍 API call params:', params.toString());
      const response = await apiClient.classes.getDropdown(params.toString());
      console.log('🔍 API response:', response);
      classes.value = response.data || [];
      console.log('🔍 Classes set:', classes.value.length);
    } catch (err) {
      console.error('❌ Error fetching classes:', err);
      error.value = 'Failed to fetch classes';
    } finally {
      loading.value = false;
    }
  };

  const fetchSections = async (schoolId?: string, branchId?: string, classId?: string) => {
    loading.value = true;
    error.value = null;
    try {
      const params = new URLSearchParams();
      if (schoolId) params.append('school_id', schoolId);
      if (branchId) params.append('branch_id', branchId);
      if (classId) params.append('class_id', classId);
      
      const response = await apiClient.sections.getDropdown(params.toString());
      sections.value = response.data || [];
    } catch (err) {
      console.error('Error fetching sections:', err);
      error.value = 'Failed to fetch sections';
    } finally {
      loading.value = false;
    }
  };

  const getCurrentAcademicYear = async (schoolId?: string) => {
    try {
      const params = new URLSearchParams();
      if (schoolId) params.append('school_id', schoolId);
      
      const response = await apiClient.academicYears.getCurrent(params.toString());
      return response.data;
    } catch (err) {
      console.error('Error fetching current academic year:', err);
      return null;
    }
  };

  const loadSectionsByClass = async (classId: string, schoolId?: string, branchId?: string) => {
    return await fetchSections(schoolId, branchId, classId);
  };

  return {
    academicYears,
    classes,
    sections,
    loading,
    error,
    activeAcademicYears,
    activeClasses,
    activeSections,
    currentAcademicYear,
    fetchAcademicYears,
    fetchClasses,
    fetchSections,
    getCurrentAcademicYear,
    loadSectionsByClass,
  };
} 