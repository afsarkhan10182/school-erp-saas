import { ref, computed } from 'vue';
import { useToast } from '~/composables/useToast';
import { useAcademics } from '~/composables/useAcademics';
import { useSchools } from '~/composables/useSchools';
import { useBranches } from '~/composables/useBranches';
import { useAuth } from '~/composables/useAuth';
import { Subjects, SubjectTeachers, Users } from '~/api';

export function useSubjects() {
  const { showToast, showApiError } = useToast();
  const {
    academicYears,
    classes,
    teacherOptions,
    fetchAcademicYears,
    fetchClasses,
    fetchTeachers
  } = useAcademics();
  const { schools, fetchSchools } = useSchools();
  const { branches, fetchBranches } = useBranches();
  const { isSuperAdmin, isAdmin, isBranchAdmin, user } = useAuth();

  // Reactive data
  const subjects = ref([]);
  const teacherAssignments = ref([]);
  const subjectsLoading = ref(false);
  const assignmentsLoading = ref(false);

  // Branch selection
  const selectedSchoolId = ref('');
  const selectedBranchId = ref('');
  const selectedBranch = ref<{ id: string; name: string } | null>(null);

  // Computed properties
  const shouldShowBranchFilter = computed(() => {
    const shouldShow = isSuperAdmin.value || isAdmin.value || isBranchAdmin.value;
    return shouldShow;
  });

  const academicYearOptions = computed(() => {
    return academicYears.value.map(year => ({
      value: year.name,
      label: year.name + (year.is_current ? ' (Current)' : '')
    }));
  });

  const currentAcademicYear = computed(() => {
    return academicYears.value.find(year => year.is_current) || null;
  });

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

  const loadTeachersData = async () => {
    if (!selectedBranchId.value) return;

    try {
      await fetchTeachers({ branchId: selectedBranchId.value });
    } catch (error) {
      showToast('Failed to load teachers', 'error');
      console.error('Error loading teachers:', error);
    }
  };

  const loadAcademicDataForBranch = async () => {
    try {
      if (!selectedSchoolId.value || !selectedBranchId.value) {
        return;
      }

      // Load academic years for the school
      await fetchAcademicYears(selectedSchoolId.value);

      // Load classes for the branch
      await fetchClasses({
        schoolId: selectedSchoolId.value,
        branchId: selectedBranchId.value
      });
    } catch (error) {
      console.error('Error loading academic data for branch:', error);
      showToast('Failed to load academic data', 'error');
    }
  };

  const loadSubjects = async () => {
    if (!selectedBranchId.value) return;

    try {
      subjectsLoading.value = true;
      const response = await Subjects.getAll({ branch_id: selectedBranchId.value });
      subjects.value = response.data?.subjects || [];
    } catch (error) {
      showApiError(error, 'Failed to load subjects');
      console.error('Error loading subjects:', error);
    } finally {
      subjectsLoading.value = false;
    }
  };

  const loadClassesData = async () => {
    if (!selectedBranchId.value) return;

    try {
      await fetchClasses({
        schoolId: selectedSchoolId.value,
        branchId: selectedBranchId.value,
        useTableData: true
      });

      if (classes.value.length === 0) {
        console.warn('No classes found for branch:', selectedBranchId.value);
        showToast('No classes found for the selected branch', 'warning');
      }
    } catch (error) {
      showToast('Failed to load classes', 'error');
      console.error('Error loading classes:', error);
    }
  };

  const loadTeacherAssignments = async () => {
    if (!selectedBranchId.value) return;

    try {
      assignmentsLoading.value = true;
      const response = await SubjectTeachers.getAll({ branch_id: selectedBranchId.value });
      console.log('Teacher assignments response:', response);
      teacherAssignments.value = response.data?.subjectTeachers || [];
      console.log('Teacher assignments loaded:', teacherAssignments.value);
    } catch (error) {
      showApiError(error, 'Failed to load teacher assignments');
      console.error('Error loading teacher assignments:', error);
    } finally {
      assignmentsLoading.value = false;
    }
  };

  const onSchoolChange = async () => {
    selectedBranchId.value = '';
    if (selectedSchoolId.value) {
      await loadBranchesData(selectedSchoolId.value);
    }
  };

  const onBranchChange = async () => {
    if (selectedBranchId.value) {
      const branch = branches.value.find(b => b.id === selectedBranchId.value);
      selectedBranch.value = branch;

      // Load academic data for the selected branch
      await loadAcademicDataForBranch();

      // Load other data
      await Promise.all([
        loadSubjects(),
        loadClassesData(),
        loadTeachersData(),
        loadTeacherAssignments()
      ]);
    } else {
      selectedBranch.value = null;
    }
  };

  const handleSubjectCreate = async (subjectData: any) => {
    try {
      await Subjects.create({ ...subjectData, branch_id: selectedBranchId.value });
      showToast('Subject created successfully', 'success');
      await loadSubjects();
    } catch (error) {
      showApiError(error, 'Failed to create subject');
      console.error('Error creating subject:', error);
    }
  };

  const handleSubjectUpdate = async (id: string, subjectData: any) => {
    try {
      await Subjects.update(id, subjectData);
      showToast('Subject updated successfully', 'success');
      await loadSubjects();
    } catch (error) {
      showApiError(error, 'Failed to update subject');
      console.error('Error updating subject:', error);
    }
  };

  const handleSubjectDelete = async (id: string) => {
    try {
      await Subjects.delete(id);
      showToast('Subject deleted successfully', 'success');
      await loadSubjects();
    } catch (error) {
      showApiError(error, 'Failed to delete subject');
      console.error('Error deleting subject:', error);
    }
  };

  const handleTeacherAssign = async (assignmentData: any) => {
    try {
      // Add school_id and branch_id to the assignment data
      const payload = {
        ...assignmentData,
        school_id: selectedSchoolId.value,
        branch_id: selectedBranchId.value
      };

      await SubjectTeachers.create(payload);
      showToast('Teacher assigned successfully', 'success');
      await loadTeacherAssignments();
    } catch (error) {
      showApiError(error, 'Failed to assign teacher');
      console.error('Error assigning teacher:', error);
    }
  };

  const handleTeacherUpdate = async (id: string, assignmentData: any) => {
    try {
      // Add school_id and branch_id to the assignment data
      const payload = {
        ...assignmentData,
        school_id: selectedSchoolId.value,
        branch_id: selectedBranchId.value
      };

      await SubjectTeachers.update(id, payload);
      showToast('Teacher assignment updated successfully', 'success');
      await loadTeacherAssignments();
    } catch (error) {
      showApiError(error, 'Failed to update teacher assignment');
      console.error('Error updating teacher assignment:', error);
    }
  };

  const handleTeacherRemove = async (id: string) => {
    try {
      await SubjectTeachers.delete(id);
      showToast('Teacher assignment removed successfully', 'success');
      await loadTeacherAssignments();
    } catch (error) {
      showApiError(error, 'Failed to remove teacher assignment');
      console.error('Error removing teacher assignment:', error);
    }
  };

  const initialize = async () => {
    try {
      // Load academic years first
      await fetchAcademicYears();

      // Load teachers
      await loadTeachersData();

      // Set up based on user role
      if (isSuperAdmin.value) {
        await loadSchoolsData();
      } else if (isAdmin.value) {
        // Auto-select user's school and load branches
        selectedSchoolId.value = user.value?.school_id || '';
        if (selectedSchoolId.value) {
          await loadBranchesData(selectedSchoolId.value);
          // Auto-select if only one branch
          if (branches.value.length === 1) {
            selectedBranchId.value = branches.value[0].id;
            await onBranchChange();
          }
        }
      } else if (isBranchAdmin.value) {
        // Auto-select user's branch
        selectedSchoolId.value = user.value?.school_id || '';
        selectedBranchId.value = user.value?.branch_id || '';
        selectedBranch.value = {
          id: user.value?.branch_id || '',
          name: user.value?.branch_name || 'Your Branch'
        };
        // Add the branch to availableBranches for display
        // Load academic data for the branch first
        await loadAcademicDataForBranch();

        // Load data for the selected branch
        await Promise.all([loadSubjects(), loadClassesData(), loadTeacherAssignments()]);
      }
    } catch (error) {
      console.error('Error initializing subjects page:', error);
      showToast('Failed to initialize page', 'error');
    }
  };

  return {
    // State
    subjects,
    teacherAssignments,
    subjectsLoading,
    assignmentsLoading,
    selectedSchoolId,
    selectedBranchId,
    selectedBranch,
    schools,
    branches,
    classes,
    teacherOptions,
    academicYears,

    // Computed
    shouldShowBranchFilter,
    academicYearOptions,
    currentAcademicYear,

    // Methods
    loadSchoolsData,
    loadBranchesData,
    loadTeachersData,
    loadAcademicDataForBranch,
    loadSubjects,
    loadClassesData,
    loadTeacherAssignments,
    onSchoolChange,
    onBranchChange,
    handleSubjectCreate,
    handleSubjectUpdate,
    handleSubjectDelete,
    handleTeacherAssign,
    handleTeacherUpdate,
    handleTeacherRemove,
    initialize
  };
}
