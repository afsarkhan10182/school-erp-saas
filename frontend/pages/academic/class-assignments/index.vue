<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Class Assignments</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Assign subjects and teachers to classes
        </p>
      </div>
    </div>

    <!-- Tab Navigation -->
    <ScrollableTabs :tabs="tabs" :active-tab="activeTab" @tab-change="setActiveTab" />

    <!-- Tab Content -->
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <!-- Branch Selection Required Message -->
      <div v-if="!selectedBranchId" class="p-8 text-center">
        <Building2 class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Select a Branch</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Please select a branch from the top bar to manage classes and assignments.
        </p>
      </div>

      <!-- Class Assignment Tab -->
      <div v-else-if="activeTab === 'class-assignment' && selectedBranchId" class="p-6">
        <ClassAssignmentTab
          :classes="classes"
          :subjects="subjects"
          :mappings="classSubjectMappings"
          :loading="mappingsLoading"
          :academic-years="academicYears"
          :branch-id="selectedBranchId"
          @refresh="loadClassSubjectMappings"
          @assign="handleClassSubjectAssign"
          @unassign="handleClassSubjectUnassign"
        />

        <!-- Pagination for Classes -->
        <Pagination
          v-if="classes.length > 0"
          :pagination="{
            page: classPagination.page,
            limit: classPagination.limit,
            total: classPagination.total || classes.length
          }"
          item-label="classes"
          @page-changed="goToClassPage"
          @page-size-changed="changeClassLimit"
        />
      </div>

      <!-- Class Teachers Tab -->
      <div v-else-if="activeTab === 'class-teachers' && selectedBranchId" class="p-6">
        <ClassTeacherTab
          :classTeachers="classTeacherAllocations"
          :classes="classes"
          :sections="sections"
          :streams="streams"
          :teachers="teacherOptions"
          :loading="classTeacherLoading"
          :academicYears="academicYearOptions"
          :branchId="selectedBranchId"
          @refresh="loadClassTeacherAllocations"
          @assign="handleClassTeacherAssign"
          @update="handleClassTeacherUpdate"
          @remove="handleClassTeacherRemove"
        />

        <!-- Pagination for Class Teachers -->
        <Pagination
          v-if="classTeacherAllocations.length > 0"
          :pagination="{
            page: classTeacherPagination.page,
            limit: classTeacherPagination.limit,
            total: classTeacherPagination.total || classTeacherAllocations.length
          }"
          item-label="class teachers"
          @page-changed="goToClassTeacherPage"
          @page-size-changed="changeClassTeacherLimit"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '~/composables/useToast';
import { useAcademics } from '~/composables/useAcademics';
import { useAuth } from '~/composables/useAuth';
import { useAuthStore } from '~/stores/auth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useSchools } from '~/composables/useSchools';
import { classSubjectAssignmentApi } from '~/api/academic/class-subject-assignment';
import { ClassTeachers } from '~/api/academic/class-teacher';
import { Building2, Users as UsersIcon, UserCheck } from 'lucide-vue-next';

// Import tab components
import ClassAssignmentTab from '~/components/academic/ClassAssignmentTab.vue';
import ClassTeacherTab from '~/components/academic/ClassTeacherTab.vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import ScrollableTabs from '~/components/ui/ScrollableTabs.vue';
import Pagination from '~/components/ui/Pagination.vue';

// Composables
const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const { selectedBranchId: globalBranchId } = useGlobalBranch();
const { showToast } = useToast();
const {
  academicYears,
  classes,
  subjects,
  teachers,
  sections,
  streams,
  classOptions,
  streamOptions,
  sectionOptions,
  subjectOptions,
  teacherOptions,
  fetchAcademicYears,
  fetchClasses,
  fetchSubjects,
  fetchTeachers,
  fetchSections,
  fetchStreams
} = useAcademics();
const { schools, fetchSchools } = useSchools();
const { isSuperAdmin, isAdmin, isBranchAdmin, user } = useAuth();

// Tab configuration
const tabs = [
  { id: 'class-assignment', name: 'Class Subject Assignment', icon: UsersIcon },
  { id: 'class-teachers', name: 'Assign Class Teachers', icon: UserCheck }
];

// Reactive data
const activeTab = ref(route.query.tab === 'teacher' ? 'class-teachers' : 'class-assignment');

const setActiveTab = tab => {
  activeTab.value = tab;
  const query = { ...route.query };
  if (tab === 'class-teachers') query.tab = 'teacher';
  else delete query.tab;
  router.replace({ query });
};

watch(
  () => route.query.tab,
  tab => {
    activeTab.value = tab === 'teacher' ? 'class-teachers' : 'class-assignment';
  }
);
const classSubjectMappings = ref([]);
const classTeacherAllocations = ref([]);
const mappingsLoading = ref(false);
const classTeacherLoading = ref(false);

// Pagination for class teachers
const classTeacherPagination = reactive({
  page: 1,
  limit: 10, // Consistent with class pagination
  total: 0
});

// Pagination for classes (not class assignments)
const classPagination = reactive({
  page: 1,
  limit: 10,
  total: 0
});

// Branch selection
const selectedSchoolId = ref('');
const selectedBranchId = ref('');
const selectedBranch = ref(null);

const shouldShowBranchFilter = computed(() => {
  // Only show branch selection for Super Admin and Admin
  // Branch Admin should only see their own branch (no selection needed)
  return isSuperAdmin.value || isAdmin.value;
});

const academicYearOptions = computed(() => {
  return academicYears.value || [];
});

// Convert schools to options format for EnhancedDropdown
const schoolOptions = computed(() => {
  return schools.value.map(school => ({
    value: school.id,
    label: school.name
  }));
});

// Convert branches to options format for EnhancedDropdown

// Methods
const loadClasses = async () => {
  if (!selectedBranchId.value) return;
  await fetchClasses({
    schoolId: selectedSchoolId.value,
    branchId: selectedBranchId.value,
    useTableData: true
  });
};

const loadSubjects = async () => {
  if (!selectedBranchId.value) return;
  await fetchSubjects({
    schoolId: selectedSchoolId.value,
    branchId: selectedBranchId.value
  });
};

const loadClassSubjectMappings = async () => {
  if (!selectedBranchId.value) return;

  try {
    mappingsLoading.value = true;
    const response = await classSubjectAssignmentApi.getAll({
      page: classPagination.page,
      limit: classPagination.limit,
      school_id: selectedSchoolId.value,
      branch_id: selectedBranchId.value
    });
    console.log('🔍 API Response for class-subject mappings:', response);
    console.log('🔍 Assignments from API:', response.data.assignments);
    classSubjectMappings.value = response.data.assignments || [];
    console.log('🔍 Set classSubjectMappings to:', classSubjectMappings.value);
  } catch (error) {
    showToast('Failed to load class-subject assignments', 'error');
    console.error('Error loading mappings:', error);
  } finally {
    mappingsLoading.value = false;
  }
};

const loadSections = async () => {
  if (!selectedBranchId.value) return;
  await fetchSections({
    schoolId: selectedSchoolId.value,
    branchId: selectedBranchId.value
  });
};

const loadStreams = async () => {
  if (!selectedBranchId.value) return;
  await fetchStreams({
    schoolId: selectedSchoolId.value,
    branchId: selectedBranchId.value
  });
};

const loadClassTeacherAllocations = async () => {
  if (!selectedBranchId.value) return;

  try {
    classTeacherLoading.value = true;

    const response = await ClassTeachers.getAll({
      page: classTeacherPagination.page,
      limit: classTeacherPagination.limit,
      school_id: selectedSchoolId.value,
      branch_id: selectedBranchId.value
    });

    // Use the known response structure from our backend
    classTeacherAllocations.value = response.data.classTeachers || [];
    classTeacherPagination.total = response.data.pagination.total;
  } catch (error) {
    showToast('Failed to load class teacher allocations', 'error');
    console.error('Error loading class teacher allocations:', error);
  } finally {
    classTeacherLoading.value = false;
  }
};

const loadTeachers = async () => {
  if (!selectedBranchId.value) return;
  await fetchTeachers({
    schoolId: selectedSchoolId.value,
    branchId: selectedBranchId.value
  });
};

const loadSchools = async () => {
  if (!isSuperAdmin.value) return;
  await fetchSchools();
};



const onBranchChange = async branchId => {
  // Set the selected branch ID
  selectedBranchId.value = branchId;

  // Find the selected branch object

  if (selectedBranchId.value) {
    // Reset pagination when branch changes
    classTeacherPagination.page = 1;
    classTeacherPagination.total = 0;
    classPagination.page = 1;
    classPagination.total = 0;

    // Load classes first, then extract sections and streams from classes
    await loadClasses();
    await Promise.all([
      loadSubjects(),
      loadSections(),
      loadStreams(),
      loadClassSubjectMappings(),
      loadClassTeacherAllocations(),
      loadTeachers()
    ]);
  }
};

// Event handlers
const handleClassTeacherAssign = async data => {
  try {
    await ClassTeachers.create(data);
    showToast('Class teacher assigned successfully', 'success');
    await loadClassTeacherAllocations();
  } catch (error) {
    console.error('Error assigning class teacher:', error);

    // Show the specific error message from the backend
    const errorMessage = error.response?.data?.message || 'Failed to assign class teacher';
    showToast(errorMessage, 'error');

    // Re-throw the error so the form can handle it
    throw error;
  }
};

const handleClassTeacherUpdate = async data => {
  try {
    await ClassTeachers.update(data.id, data);
    showToast('Class teacher updated successfully', 'success');
    await loadClassTeacherAllocations();
  } catch (error) {
    console.error('Error updating class teacher:', error);

    // Show the specific error message from the backend
    const errorMessage = error.response?.data?.message || 'Failed to update class teacher';
    showToast(errorMessage, 'error');

    // Re-throw the error so the form can handle it
    throw error;
  }
};

const handleClassTeacherRemove = async id => {
  try {
    await ClassTeachers.delete(id);
    showToast('Class teacher removed successfully', 'success');
    await loadClassTeacherAllocations();
  } catch (error) {
    // Show the specific error message from the backend
    const errorMessage = error.response?.data?.message || 'Failed to remove class teacher';
    showToast(errorMessage, 'error');
    console.error('Error removing class teacher:', error);
  }
};

// Pagination handlers for class teachers
const goToClassTeacherPage = async page => {
  const totalPages = Math.ceil(classTeacherPagination.total / classTeacherPagination.limit);
  if (page >= 1 && page <= totalPages) {
    classTeacherPagination.page = page;
    await loadClassTeacherAllocations();
  }
};

const changeClassTeacherLimit = async newLimit => {
  classTeacherPagination.limit = newLimit;
  classTeacherPagination.page = 1; // Reset to first page
  await loadClassTeacherAllocations();
};

// Pagination handlers for classes
const goToClassPage = async page => {
  const totalPages = Math.ceil(classPagination.total / classPagination.limit);
  if (page >= 1 && page <= totalPages) {
    classPagination.page = page;
    await Promise.all([loadClasses(), loadClassSubjectMappings()]);
  }
};

const changeClassLimit = async newLimit => {
  classPagination.limit = newLimit;
  classPagination.page = 1; // Reset to first page
  await Promise.all([loadClasses(), loadClassSubjectMappings()]);
};

// Class Subject Assignment handlers
const handleClassSubjectAssign = async mappingData => {
  try {
    // Create individual assignments for each subject
    const assignments = mappingData.subject_ids.map(subjectId => {
      const assignment = {
        class_id: mappingData.class_id,
        subject_id: subjectId,
        section_id:
          mappingData.section_id && mappingData.section_id !== '' ? mappingData.section_id : null,
        stream_id:
          mappingData.stream_id && mappingData.stream_id !== '' ? mappingData.stream_id : null,
        academic_year: mappingData.academic_year,
        school_id: selectedSchoolId.value,
        branch_id: selectedBranchId.value
      };

      return assignment;
    });

    const className = classes.value.find(cls => cls.id === mappingData.class_id)?.name || 'Class';

    // Use the new simple assignment API
    const response = await classSubjectAssignmentApi.bulkCreate({ assignments });

    if (response.successful > 0) {
      showToast(`${response.successful} subjects assigned to ${className}`, 'success');
    }

    if (response.failed > 0) {
      showToast(`${response.failed} assignments failed`, 'warning');
    }

    await loadClassSubjectMappings();
  } catch (error) {
    showToast('Failed to assign subjects to class', 'error');
    console.error('Error creating assignments:', error);
  }
};

const handleClassSubjectUnassign = async id => {
  try {
    await classSubjectAssignmentApi.delete(id);
    showToast('Class-subject assignment removed successfully', 'success');
    await loadClassSubjectMappings();
  } catch (error) {
    showToast('Failed to remove class-subject assignment', 'error');
    console.error('Error removing mapping:', error);
  }
};

// Lifecycle
onMounted(async () => {
  await fetchAcademicYears();

  if (isSuperAdmin.value) {
    selectedSchoolId.value = authStore.currentSchool?.id || '';
  } else {
    selectedSchoolId.value = user.value?.school_id || '';
  }

  const activeBranch = globalBranchId.value || user.value?.branch_id;
  if (activeBranch) {
    await onBranchChange(activeBranch);
  }
});

watch(globalBranchId, async newBranch => {
  if (newBranch) {
    await onBranchChange(newBranch);
  } else {
    selectedBranchId.value = '';
    selectedBranch.value = null;
  }
});
</script>
