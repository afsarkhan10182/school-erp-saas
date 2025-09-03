import { ref, computed } from 'vue';
import { AcademicYears, Classes, Streams, Sections } from '~/api';

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
  has_stream?: boolean; // Add has_stream field
  branch?: {
    id: string;
    name: string;
    code?: string;
  };
}

interface Stream {
  id: string;
  name: string;
  code: string;
  class_id: string;
  is_active?: boolean;
}

interface Section {
  id: string;
  name: string;
  capacity?: number;
  current_strength?: number;
  is_active?: boolean;
  stream_id?: string;
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
  const streams = ref<Stream[]>([]);
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

  const activeStreams = computed(() => 
    streams.value.filter(stream => stream.is_active !== false)
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
      console.log('🔍 fetchAcademicYears: Starting with schoolId:', schoolId);
      const params = new URLSearchParams();
      if (schoolId) params.append('school_id', schoolId);
      
      console.log('🔍 fetchAcademicYears: Calling API with params:', params.toString());
      const response = await AcademicYears.getDropdown(params.toString());
      console.log('🔍 fetchAcademicYears: API response:', response);
      academicYears.value = response.data || [];
      console.log('🔍 fetchAcademicYears: Set academicYears.value:', academicYears.value);
    } catch (err) {
      console.error('❌ useAcademics: Error fetching academic years:', err);
      error.value = 'Failed to fetch academic years';
      academicYears.value = [];
    } finally {
      loading.value = false;
    }
  };

  const fetchClasses = async (schoolId?: string, branchId?: string) => {
    loading.value = true;
    error.value = null;
    try {
      console.log('🔍 fetchClasses: Starting with schoolId:', schoolId, 'branchId:', branchId);
      const params = new URLSearchParams();
      if (schoolId) params.append('school_id', schoolId);
      if (branchId) params.append('branch_id', branchId);
      
      console.log('🔍 fetchClasses: Calling API with params:', params.toString());
      const response = await Classes.getDropdown(params.toString());
      console.log('🔍 fetchClasses: API response:', response);
      classes.value = response.data || [];
      console.log('🔍 fetchClasses: Set classes.value:', classes.value);
    } catch (err) {
      console.error('❌ useAcademics: Error fetching classes:', err);
      error.value = 'Failed to fetch classes';
      classes.value = [];
    } finally {
      loading.value = false;
    }
  };

  const fetchStreams = async (schoolId?: string, branchId?: string, classId?: string) => {
    loading.value = true;
    error.value = null;
    try {
      const params: { school_id?: string; branch_id?: string; class_id?: string } = {};
      if (schoolId) params.school_id = schoolId;
      if (branchId) params.branch_id = branchId;
      if (classId) params.class_id = classId;
      
      const response = await Streams.getForDropdown(params);
      streams.value = response.data || [];
    } catch (err) {
      console.error('❌ useAcademics: Error fetching streams:', err);
      error.value = 'Failed to fetch streams';
      streams.value = [];
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
      
      const response = await Sections.getDropdown(params.toString());
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
      
      const response = await AcademicYears.getCurrent(params.toString());
      return response.data;
    } catch (err) {
      console.error('Error fetching current academic year:', err);
      return null;
    }
  };

  const loadSectionsByClass = async (classId: string, schoolId?: string, branchId?: string) => {
    return await fetchSections(schoolId, branchId, classId);
  };

  const loadStreamsByClass = async (classId: string, schoolId?: string, branchId?: string) => {
    return await fetchStreams(schoolId, branchId, classId);
  };

  return {
    academicYears,
    classes,
    streams,
    sections,
    loading,
    error,
    activeAcademicYears,
    activeClasses,
    activeStreams,
    activeSections,
    currentAcademicYear,
    fetchAcademicYears,
    fetchClasses,
    fetchStreams,
    fetchSections,
    getCurrentAcademicYear,
    loadSectionsByClass,
    loadStreamsByClass,
  };
} 