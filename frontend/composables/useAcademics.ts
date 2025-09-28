import { ref, computed, watch } from 'vue';
import { AcademicYears } from '~/api/academic/academic-years';
import { Classes } from '~/api/academic';
import { Streams } from '~/api/academic';
import { Sections } from '~/api/academic';
import { subjectApi } from '~/api/academic/subjects';
import { Users } from '~/api/administration/users';
import { useToast } from '~/composables/useToast';
import { useAuth } from '~/composables/useAuth';
import { useAuthStore } from '~/stores/auth';

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
  class_id?: string;
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

interface Subject {
  id: string;
  name: string;
  code: string;
  category?: string;
  credit_hours?: number;
  is_active?: boolean;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active?: boolean;
}

interface DropdownOption {
  label: string;
  value: string | number;
}

export function useAcademics() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const authStore = useAuthStore();

  // Raw data
  const academicYears = ref<AcademicYear[]>([]);
  const classes = ref<Class[]>([]);
  const streams = ref<Stream[]>([]);
  const sections = ref<Section[]>([]);
  const subjects = ref<Subject[]>([]);
  const teachers = ref<Teacher[]>([]);

  // Dropdown options
  const classOptions = ref<DropdownOption[]>([]);
  const streamOptions = ref<DropdownOption[]>([]);
  const sectionOptions = ref<DropdownOption[]>([]);
  const subjectOptions = ref<DropdownOption[]>([]);
  const teacherOptions = ref<DropdownOption[]>([]);

  const loading = ref(false);
  const error = ref<string | null>(null);

  // Watchers to populate dropdown options when data changes
  watch(
    classes,
    newClasses => {
      classOptions.value = newClasses.map((cls: any) => ({
        value: cls.id,
        label: cls.name,
        class_id: cls.id
      }));
    },
    { immediate: true }
  );

  watch(
    sections,
    newSections => {
      sectionOptions.value = newSections.map((section: any) => ({
        value: section.id,
        label: section.name,
        class_id: section.class_id
      }));
    },
    { immediate: true }
  );

  watch(
    subjects,
    newSubjects => {
      subjectOptions.value = newSubjects.map((subject: any) => ({
        value: subject.id,
        label: `${subject.name} (${subject.code})`,
        category: subject.category,
        credit_hours: subject.credit_hours
      }));
    },
    { immediate: true }
  );

  watch(
    teachers,
    newTeachers => {
      teacherOptions.value = newTeachers.map((teacher: any) => ({
        value: teacher.id,
        label: `${teacher.first_name || 'Unknown'} ${teacher.last_name || 'Teacher'} (${teacher.email || 'No Email'})`
      }));
    },
    { immediate: true }
  );

  // Computed properties for active items
  const activeAcademicYears = computed(() =>
    academicYears.value.filter(year => year.status === 'active')
  );

  const activeClasses = computed(() => classes.value.filter(cls => cls.is_active !== false));

  const activeStreams = computed(() => streams.value.filter(stream => stream.is_active !== false));

  const activeSections = computed(() =>
    sections.value.filter(section => section.is_active !== false)
  );

  const currentAcademicYear = computed(
    () => academicYears.value.find(year => year.is_current) || null
  );

  const fetchAcademicYears = async (schoolId?: string) => {
    loading.value = true;
    error.value = null;
    try {
      const params = new URLSearchParams();
      if (schoolId) params.append('school_id', schoolId);

      const response = await AcademicYears.getDropdown(params.toString());
      academicYears.value = response.data || [];
    } catch (err) {
      error.value = 'Failed to fetch academic years';
      academicYears.value = [];
    } finally {
      loading.value = false;
    }
  };

  const fetchClasses = async (options?: {
    schoolId?: string;
    branchId?: string;
    // Table data options
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: string;
    // API endpoint selection
    useTableData?: boolean; // true for table data, false for dropdown data
  }) => {
    loading.value = true;
    error.value = null;
    try {
      if (options?.useTableData) {
        // Use getAll for table data with pagination
        const params: any = {};
        if (options.schoolId) params.school_id = options.schoolId;
        if (options.branchId) params.branch_id = options.branchId;
        if (options.page) params.page = options.page;
        if (options.limit) params.limit = options.limit;
        if (options.sort_by) params.sort_by = options.sort_by;
        if (options.sort_order) params.sort_order = options.sort_order;

        const response = await Classes.getAll(params);
        classes.value = response.data || [];
        return response; // Return full response for pagination info
      } else {
        // Use getDropdown for dropdown data (default behavior)
        const params = new URLSearchParams();
        if (options?.schoolId) params.append('school_id', options.schoolId);
        if (options?.branchId) params.append('branch_id', options.branchId);

        const response = await Classes.getDropdown(params.toString());
        classes.value = response.data || [];
        return response;
      }
    } catch (err) {
      error.value = 'Failed to fetch classes';
      classes.value = [];
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchStreams = async (
    options: {
      schoolId?: string;
      branchId?: string;
      classId?: string;
    } = {}
  ) => {
    loading.value = true;
    error.value = null;
    try {
      const params: {
        school_id?: string;
        branch_id?: string;
        class_id?: string;
      } = {};
      if (options?.schoolId) params.school_id = options.schoolId;
      if (options?.branchId) params.branch_id = options.branchId;
      if (options?.classId) params.class_id = options.classId;

      const response = await Streams.getForDropdown(params);
      streams.value = response.data || [];
    } catch (err) {
      error.value = 'Failed to fetch streams';
      streams.value = [];
    } finally {
      loading.value = false;
    }
  };

  const fetchSections = async (
    options: {
      schoolId?: string;
      branchId?: string;
      classId?: string;
    } = {}
  ) => {
    loading.value = true;
    error.value = null;
    try {
      const params = new URLSearchParams();

      // Auto-resolve from auth context if not provided (following existing pattern)
      const resolvedSchoolId = options?.schoolId || authStore.currentSchool?.id;
      const resolvedBranchId = options?.branchId || authStore.currentBranch?.id;

      if (resolvedSchoolId) params.append('school_id', resolvedSchoolId);
      if (resolvedBranchId && resolvedBranchId !== '') params.append('branch_id', resolvedBranchId);
      if (options?.classId) params.append('class_id', options.classId);

      const response = await Sections.getDropdown(params.toString());
      sections.value = response.data || [];
    } catch (err) {
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
      return null;
    }
  };

  const loadSectionsByClass = async (classId: string, schoolId?: string, branchId?: string) => {
    return await fetchSections({ schoolId, branchId, classId });
  };

  const loadStreamsByClass = async (classId: string, schoolId?: string, branchId?: string) => {
    return await fetchStreams({ schoolId, branchId, classId });
  };

  // Subjects management
  const fetchSubjects = async (
    options: {
      schoolId?: string;
      branchId?: string;
      classId?: string;
      streamId?: string;
      category?: string;
    } = {}
  ) => {
    loading.value = true;
    error.value = null;
    try {
      const params: any = {};
      if (options?.schoolId) params.school_id = options.schoolId;
      if (options?.branchId) params.branch_id = options.branchId;
      if (options?.classId) params.class_id = options.classId;
      if (options?.streamId) params.stream_id = options.streamId;
      if (options?.category) params.category = options.category;

      const response = await subjectApi.getForDropdown(params);

      // Handle different API response structures
      let subjectsData = [];
      if (response.data && Array.isArray(response.data)) {
        subjectsData = response.data;
      } else if (response.data && response.data.subjects && Array.isArray(response.data.subjects)) {
        subjectsData = response.data.subjects;
      }

      subjects.value = subjectsData;

      // Update dropdown options
      subjectOptions.value = subjects.value.map((subject: any) => ({
        value: subject.id,
        label: `${subject.name} (${subject.code})`,
        category: subject.category,
        credit_hours: subject.credit_hours
      }));
    } catch (err) {
      error.value = 'Failed to fetch subjects';
      subjects.value = [];
      subjectOptions.value = [];
    } finally {
      loading.value = false;
    }
  };

  // Teachers management
  const fetchTeachers = async (options: { schoolId?: string; branchId?: string } = {}) => {
    loading.value = true;
    error.value = null;
    try {
      const params: any = {
        role: 'teacher',
        limit: 1000
      };
      if (options?.schoolId) params.school_id = options.schoolId;
      if (options?.branchId) params.branch_id = options.branchId;

      const response = await Users.getAll(params);
      teachers.value = response.data?.users || [];

      // Update dropdown options
      teacherOptions.value = teachers.value.map((teacher: any) => ({
        value: teacher.id,
        label: `${teacher.first_name || 'Unknown'} ${teacher.last_name || 'Teacher'} (${teacher.email || 'No Email'})`
      }));
    } catch (err) {
      error.value = 'Failed to fetch teachers';
      teachers.value = [];
      teacherOptions.value = [];
    } finally {
      loading.value = false;
    }
  };

  // Utility methods
  const getClassName = (classId: string | number): string => {
    const cls = classOptions.value.find(c => c.value === classId);
    return cls?.label || 'Unknown Class';
  };

  const getSectionName = (sectionId: string | number): string => {
    const section = sectionOptions.value.find(s => s.value === sectionId);
    return section?.label || 'Unknown Section';
  };

  const getSubjectName = (subjectId: string | number): string => {
    const subject = subjectOptions.value.find(s => s.value === subjectId);
    return subject?.label || 'Unknown Subject';
  };

  const getTeacherName = (teacherId: string | number): string => {
    const teacher = teacherOptions.value.find(t => t.value === teacherId);
    return teacher?.label || 'Unknown Teacher';
  };

  // Reset all data
  const resetAll = () => {
    academicYears.value = [];
    classes.value = [];
    streams.value = [];
    sections.value = [];
    subjects.value = [];
    teachers.value = [];
    classOptions.value = [];
    streamOptions.value = [];
    sectionOptions.value = [];
    subjectOptions.value = [];
    teacherOptions.value = [];
    error.value = null;
  };

  return {
    // Raw data
    academicYears,
    classes,
    streams,
    sections,
    subjects,
    teachers,

    // Dropdown options
    classOptions,
    streamOptions,
    sectionOptions,
    subjectOptions,
    teacherOptions,

    // State
    loading,
    error,

    // Computed
    activeAcademicYears,
    activeClasses,
    activeStreams,
    activeSections,
    currentAcademicYear,

    // Fetch methods
    fetchAcademicYears,
    fetchClasses,
    fetchStreams,
    fetchSections,
    fetchSubjects,
    fetchTeachers,

    // Utility methods
    getCurrentAcademicYear,
    loadSectionsByClass,
    loadStreamsByClass,
    getClassName,
    getSectionName,
    getSubjectName,
    getTeacherName,
    resetAll
  };
}
