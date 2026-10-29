import { ref, computed, watch } from 'vue';
import { useToast } from '~/composables/useToast';
import { useAcademics } from '~/composables/useAcademics';
import { useSchools } from '~/composables/useSchools';
import { useBranches } from '~/composables/useBranches';
import { useAuth } from '~/composables/useAuth';
import { useAuthStore } from '~/stores/auth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { Timetables } from '~/api/academic/timetables';

export function useTimetables() {
  const { showToast, showApiError } = useToast();
  const authStore = useAuthStore();
  const { effectiveBranchId: globalEffectiveBranchId } = useGlobalBranch();
  const {
    academicYears,
    currentAcademicYear,
    classes,
    sections,
    classOptions,
    sectionOptions,
    fetchAcademicYears,
    fetchClasses,
    fetchSections
  } = useAcademics();
  const { schools, fetchSchools } = useSchools();
  const { branches, fetchBranches } = useBranches();
  const { isSuperAdmin, isAdmin, isBranchAdmin, user } = useAuth();

  // Reactive data
  const timetables = ref([]);
  const timetablesLoading = ref(false);

  // Use current academic year automatically (no manual selection needed)
  const selectedAcademicYear = computed(() => {
    return currentAcademicYear.value?.name || '';
  });

  // Branch selection - driven by global branch
  const selectedSchoolId = ref('');
  const selectedBranchId = ref(globalEffectiveBranchId.value || '');
  const selectedBranch = ref<{ id: string; name: string } | null>(null);

  // Filters (removed page and limit from filters to avoid duplication)
  const filters = ref({
    search: '',
    class_id: '',
    section_id: '',
    academic_year: '',
    is_active: undefined
  });

  // Pagination
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0
  });

  // Computed properties
  const shouldShowBranchFilter = computed(() => false);

  const schoolOptions = computed(() =>
    schools.value.map(school => ({
      value: school.id,
      label: school.name
    }))
  );


  // Academic year options (for reports/history - not needed for current operations)
  const academicYearOptions = computed(() => [
    ...academicYears.value.map(year => ({
      value: year.name,
      label: year.name
    }))
  ]);

  const classDropdownOptions = computed(() => [...classOptions.value]);

  const sectionDropdownOptions = computed(() => [...sectionOptions.value]);

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' }
  ];

  const totalPages = computed(() => Math.ceil(pagination.value.total / pagination.value.limit));

  // Methods
  const loadSchoolsData = async () => {
    try {
      await fetchSchools();
      if (schools.value.length === 0) {
        showToast('No schools found', 'warning');
      }
    } catch (error) {
      showToast('Failed to load schools', 'error');
      console.error('Error loading schools:', error);
    }
  };

  const loadBranchesData = async (schoolId: string) => {
    try {
      await fetchBranches(schoolId);
      if (branches.value.length === 0) {
        showToast('No branches found for this school', 'warning');
      }
    } catch (error) {
      showToast('Failed to load branches', 'error');
      console.error('Error loading branches:', error);
    }
  };

  const loadAcademicDataForBranch = async () => {
    try {
      if (!selectedBranchId.value) {
        return;
      }

      // Load academic years
      await fetchAcademicYears();

      // Load classes and sections for the branch
      await Promise.all([
        fetchClasses({ branchId: selectedBranchId.value }),
        fetchSections({ branchId: selectedBranchId.value })
      ]);

      // Academic year is automatically set via computed property
      // No manual selection needed - uses current academic year
    } catch (error) {
      showToast('Failed to load academic data', 'error');
      console.error('Error loading academic data:', error);
    }
  };

  const loadTimetables = async () => {
    // Prevent multiple simultaneous calls
    if (timetablesLoading.value) {
      return;
    }

    try {
      timetablesLoading.value = true;
      filters.value.academic_year = selectedAcademicYear.value;

      // Combine filters with pagination for API call
      const apiParams = {
        ...filters.value,
        page: pagination.value.page,
        limit: pagination.value.limit
      };

      // Validate required filters
      if (!filters.value.academic_year) {
        console.warn('Academic year not set, skipping timetable load');
        timetables.value = [];
        return;
      }

      const response = await Timetables.getAll(apiParams);

      if (response.success) {
        timetables.value = response.data.timetables || [];
        pagination.value.total = response.data.pagination?.total || 0;
      } else {
        showToast('Failed to load timetables', 'error');
        timetables.value = [];
      }
    } catch (error) {
      console.error('Error loading timetables:', error);
      showToast('Error loading timetables', 'error');
      timetables.value = [];
    } finally {
      timetablesLoading.value = false;
    }
  };

  const onSchoolChange = async () => {
    selectedBranchId.value = '';
    selectedBranch.value = null;
    if (selectedSchoolId.value) {
      await loadBranchesData(selectedSchoolId.value);
    }
  };

  const onBranchChange = async () => {
    filters.value = { ...filters.value, class_id: '', section_id: '' };
    pagination.value.page = 1;

    if (selectedBranchId.value) {
      const branch = branches.value.find(b => b.id === selectedBranchId.value);
      selectedBranch.value = branch || null;

      // Load academic data for the branch
      await loadAcademicDataForBranch();

      // Load timetables for the branch
      await loadTimetables();
    } else {
      selectedBranch.value = null;
      classes.value = [];
      sections.value = [];
      timetables.value = [];
      pagination.value.total = 0;
    }
  };

  const handleTimetableCreate = async (timetableData: any) => {
    try {
      const response = await Timetables.create({
        ...timetableData,
        branch_id: selectedBranchId.value,
        academic_year: selectedAcademicYear.value
      });

      if (response.success) {
        showToast('Timetable created successfully', 'success');
        await loadTimetables();
        return response.data;
      } else {
        showToast('Failed to create timetable', 'error');
        throw new Error(response.message);
      }
    } catch (error) {
      showToast('Error creating timetable', 'error');
      console.error('Error creating timetable:', error);
      throw error;
    }
  };

  const handleTimetableUpdate = async (id: string, timetableData: any) => {
    try {
      const response = await Timetables.update(id, timetableData);

      if (response.success) {
        showToast('Timetable updated successfully', 'success');
        await loadTimetables();
        return response.data;
      } else {
        showToast('Failed to update timetable', 'error');
        throw new Error(response.message);
      }
    } catch (error) {
      showToast('Error updating timetable', 'error');
      console.error('Error updating timetable:', error);
      throw error;
    }
  };

  const handleTimetableDelete = async (id: string) => {
    try {
      const response = await Timetables.delete(id);

      if (response.success) {
        showToast('Timetable deleted successfully', 'success');
        await loadTimetables();
        return true;
      } else {
        showToast('Failed to delete timetable', 'error');
        throw new Error(response.message);
      }
    } catch (error) {
      showToast('Error deleting timetable', 'error');
      console.error('Error deleting timetable:', error);
      throw error;
    }
  };

  const updateFilters = async (newFilters: any) => {
    try {
      filters.value = { ...filters.value, ...newFilters };
      pagination.value.page = 1; // Reset to first page
      await loadTimetables();
    } catch (error) {
      console.error('Error updating filters:', error);
      showToast('Error updating filters', 'error');
    }
  };

  const goToPage = async (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      pagination.value.page = page;
      await loadTimetables();
    }
  };

  const changeLimit = async (newLimit: number) => {
    pagination.value.limit = newLimit;
    pagination.value.page = 1; // Reset to first page
    await loadTimetables();
  };

  const initialize = async () => {
    try {
      // Load schools and branches first
      await Promise.all([loadSchoolsData(), loadBranchesData('')]);

      // Load academic years
      await fetchAcademicYears();

      if (isSuperAdmin.value) {
        selectedSchoolId.value = authStore.currentSchool?.id || '';
      } else {
        selectedSchoolId.value = user.value?.school_id || '';
      }

      // Sync branch from global store
      const activeBranch = globalEffectiveBranchId.value;
      if (activeBranch) {
        selectedBranchId.value = activeBranch;
        await onBranchChange();
      }

      // Watch global branch changes and reload
      watch(globalEffectiveBranchId, async newVal => {
        selectedBranchId.value = newVal || '';
        await onBranchChange();
      });
    } catch (error) {
      showToast('Failed to initialize timetables', 'error');
      console.error('Error initializing timetables:', error);
    }
  };

  return {
    // State
    timetables,
    timetablesLoading,
    selectedAcademicYear,
    selectedSchoolId,
    selectedBranchId,
    selectedBranch,
    schools,
    branches,
    classes,
    sections,
    filters,
    pagination,

    // Computed
    shouldShowBranchFilter,
    schoolOptions,
    academicYearOptions,
    classDropdownOptions,
    sectionDropdownOptions,
    statusOptions,
    totalPages,

    // Methods
    loadSchoolsData,
    loadBranchesData,
    loadAcademicDataForBranch,
    loadTimetables,
    onSchoolChange,
    onBranchChange,
    handleTimetableCreate,
    handleTimetableUpdate,
    handleTimetableDelete,
    updateFilters,
    goToPage,
    changeLimit,
    initialize
  };
}
