import { ref, computed } from 'vue';
import { useToast } from '~/composables/useToast';
import { useAcademics } from '~/composables/useAcademics';
import { useSchools } from '~/composables/useSchools';
import { useBranches } from '~/composables/useBranches';
import { useAuth } from '~/composables/useAuth';
import { Timetables } from '~/api/academic/timetables';

export function useTimetables() {
  const { showToast, showApiError } = useToast();
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
  const { isSuperAdmin, isSchoolAdmin, isBranchAdmin, user } = useAuth();

  // Reactive data
  const timetables = ref([]);
  const timetablesLoading = ref(false);

  // Use current academic year automatically (no manual selection needed)
  const selectedAcademicYear = computed(() => {
    return currentAcademicYear.value?.name || '';
  });

  // Branch selection
  const selectedSchoolId = ref('');
  const selectedBranchId = ref('');
  const selectedBranch = ref<{ id: string; name: string } | null>(null);

  // Filters
  const filters = ref({
    page: 1,
    limit: 10,
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
  const shouldShowBranchFilter = computed(() => {
    return isSuperAdmin.value || isSchoolAdmin.value || isBranchAdmin.value;
  });

  const schoolOptions = computed(() =>
    schools.value.map(school => ({
      value: school.id,
      label: school.name
    }))
  );

  const branchOptions = computed(() =>
    branches.value.map(branch => ({
      value: branch.id,
      label: branch.name
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
    try {
      timetablesLoading.value = true;
      filters.value.academic_year = selectedAcademicYear.value;
      filters.value.page = pagination.value.page;
      filters.value.limit = pagination.value.limit;

      const response = await Timetables.getAll(filters.value);
      console.log('🔍 API Response:', response);

      if (response.success) {
        timetables.value = response.data.timetables || [];
        pagination.value.total = response.data.pagination?.total || 0;
        console.log('🔍 Timetables loaded:', timetables.value.length);
        if (timetables.value.length > 0) {
          console.log('🔍 First timetable:', timetables.value[0]);
          console.log('🔍 First timetable slots:', timetables.value[0].slots);
        }
      } else {
        showToast('Failed to load timetables', 'error');
      }
    } catch (error) {
      console.error('Error loading timetables:', error);
      showToast('Error loading timetables', 'error');
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
    if (selectedBranchId.value) {
      const branch = branches.value.find(b => b.id === selectedBranchId.value);
      selectedBranch.value = branch || null;

      // Reset pagination
      pagination.value.page = 1;

      // Load academic data for the branch
      await loadAcademicDataForBranch();

      // Load timetables for the branch
      await loadTimetables();
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

  const updateFilters = (newFilters: any) => {
    filters.value = { ...filters.value, ...newFilters };
    pagination.value.page = 1; // Reset to first page
    loadTimetables();
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      pagination.value.page = page;
      loadTimetables();
    }
  };

  const changeLimit = (newLimit: number) => {
    pagination.value.limit = newLimit;
    pagination.value.page = 1; // Reset to first page
    loadTimetables();
  };

  const initialize = async () => {
    try {
      // Load schools and branches first
      await Promise.all([loadSchoolsData(), loadBranchesData('')]);

      // Load academic years
      await fetchAcademicYears();

      // Academic year is automatically set via computed property

      // Load timetables if branch is already selected
      if (selectedBranchId.value) {
        await loadTimetables();
      }
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
    branchOptions,
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
