<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Class Management</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage classes, sections, class assignments, and class teachers
          </p>
        </div>
      </div>

      <!-- Branch Selection -->
      <div
        v-if="shouldShowBranchFilter"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Branch Selection</h3>
          <div class="flex items-center space-x-2">
            <Building2 class="h-5 w-5 text-indigo-600" />
            <span class="text-sm text-gray-600 dark:text-gray-400"
              >Select branch to manage class teachers</span
            >
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- School Selection (Super Admin only) -->
          <div v-if="isSuperAdmin">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              School
            </label>
            <select
              v-model="selectedSchoolId"
              @change="onSchoolChange"
              class="input-field"
              :disabled="schoolsLoading"
            >
              <option value="">Select School</option>
              <option v-if="schoolsLoading" value="" disabled>Loading schools...</option>
              <option v-for="school in availableSchools" :key="school.id" :value="school.id">
                {{ school.name }}
              </option>
            </select>
          </div>

          <!-- Branch Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Branch
            </label>
            <select
              v-model="selectedBranchId"
              @change="onBranchChange"
              class="input-field"
              :disabled="branchesLoading"
            >
              <option value="">Select Branch</option>
              <option v-if="branchesLoading" value="" disabled>Loading branches...</option>
              <option v-for="branch in availableBranches" :key="branch.id" :value="branch.id">
                {{ branch.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Branch Info (for non-admin users) -->
      <div
        v-if="!shouldShowBranchFilter"
        class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6"
      >
        <div class="flex items-center">
          <Building2 class="h-5 w-5 text-blue-600 mr-2" />
          <div>
            <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100">
              Your Branch: {{ user?.branch_name || 'Your Branch' }}
            </h4>
            <p class="text-xs text-blue-700 dark:text-blue-300">
              Managing class teachers for your assigned branch
            </p>
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 mb-6"
      >
        <div class="border-b border-gray-200 dark:border-gray-700">
          <nav class="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              ]"
            >
              <component :is="tab.icon" class="w-5 h-5 inline-block mr-2" />
              {{ tab.name }}
            </button>
          </nav>
        </div>
      </div>

      <!-- Tab Content -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <!-- Branch Selection Required Message -->
        <div v-if="!selectedBranchId && shouldShowBranchFilter" class="p-8 text-center">
          <Building2 class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Select a Branch</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Please select a branch to manage classes and assignments.
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
            :schoolId="user?.school_id"
            @refresh="loadClassTeacherAllocations"
            @assign="handleClassTeacherAssign"
            @update="handleClassTeacherUpdate"
            @remove="handleClassTeacherRemove"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from '~/composables/useToast';
import { useAcademics } from '~/composables/useAcademics';
import { useAuth } from '~/composables/useAuth';
import { Schools } from '~/api/administration/schools';
import { Branches } from '~/api/administration/branches';
import { classTeacherApi } from '~/api/academic/class-teacher';
import { classSubjectAssignmentApi } from '~/api/academic/class-subject-assignment';
import { Subjects } from '~/api';
import { AcademicYears } from '~/api/academic/academic-years';
import { Classes } from '~/api/academic/classes';
import { Sections } from '~/api/academic/sections';
import { Streams } from '~/api/academic/streams';
import { Users } from '~/api';
import { Building2, Users as UsersIcon, UserCheck } from 'lucide-vue-next';

// Import tab components
import ClassAssignmentTab from '~/components/academic/ClassAssignmentTab.vue';
import ClassTeacherTab from '~/components/academic/ClassTeacherTab.vue';

// Composables
const { showToast } = useToast();
const { academicYears, fetchAcademicYears } = useAcademics();
const { isSuperAdmin, isSchoolAdmin, isBranchAdmin, user } = useAuth();

// Tab configuration
const tabs = [
  { id: 'class-assignment', name: 'Class Assignment', icon: UsersIcon },
  { id: 'class-teachers', name: 'Class Teachers', icon: UserCheck }
];

// Reactive data
const activeTab = ref('class-assignment');
const classes = ref([]);
const sections = ref([]);
const streams = ref([]);
const subjects = ref([]);
const classSubjectMappings = ref([]);
const classTeacherAllocations = ref([]);
const teacherOptions = ref([]);
const mappingsLoading = ref(false);
const classTeacherLoading = ref(false);

// Branch selection
const selectedSchoolId = ref('');
const selectedBranchId = ref('');
const selectedBranch = ref(null);
const availableSchools = ref([]);
const availableBranches = ref([]);
const schoolsLoading = ref(false);
const branchesLoading = ref(false);

const shouldShowBranchFilter = computed(() => {
  const shouldShow = isSuperAdmin.value || isSchoolAdmin.value || isBranchAdmin.value;
  return shouldShow;
});

const academicYearOptions = computed(() => {
  return academicYears.value || [];
});

// Methods
const loadClasses = async () => {
  if (!selectedBranchId.value) return;

  try {
    const response = await Classes.getAll({ branch_id: selectedBranchId.value });
    classes.value = response.data || [];
  } catch (error) {
    showToast('Failed to load classes', 'error');
    console.error('Error loading classes:', error);
  }
};

const loadSubjects = async () => {
  if (!selectedBranchId.value) return;

  try {
    const response = await Subjects.getAll({
      limit: 1000,
      branch_id: selectedBranchId.value
    });
    subjects.value = response.data.subjects || [];
  } catch (error) {
    showToast('Failed to load subjects', 'error');
    console.error('Error loading subjects:', error);
  }
};

const loadClassSubjectMappings = async () => {
  if (!selectedBranchId.value) return;

  try {
    mappingsLoading.value = true;
    const response = await classSubjectAssignmentApi.getAll({
      limit: 1000,
      branch_id: selectedBranchId.value
    });
    classSubjectMappings.value = response.data.assignments || [];
  } catch (error) {
    showToast('Failed to load class-subject assignments', 'error');
    console.error('Error loading mappings:', error);
  } finally {
    mappingsLoading.value = false;
  }
};

const loadSections = async () => {
  if (!selectedBranchId.value) return;

  try {
    // Extract sections from classes data (embedded in class objects)
    const allSections = [];
    classes.value.forEach(cls => {
      if (cls.sections && Array.isArray(cls.sections)) {
        cls.sections.forEach(section => {
          allSections.push({
            ...section,
            class_id: cls.id,
            class_name: cls.name
          });
        });
      }
    });
    sections.value = allSections;
  } catch (error) {
    showToast('Failed to load sections', 'error');
    console.error('Error loading sections:', error);
  }
};

const loadStreams = async () => {
  if (!selectedBranchId.value) return;

  try {
    // Extract streams from classes data (embedded in class objects)
    const allStreams = [];
    classes.value.forEach(cls => {
      if (cls.streams && Array.isArray(cls.streams)) {
        cls.streams.forEach(stream => {
          allStreams.push({
            ...stream,
            class_id: cls.id,
            class_name: cls.name
          });
        });
      }
    });
    streams.value = allStreams;
  } catch (error) {
    showToast('Failed to load streams', 'error');
    console.error('Error loading streams:', error);
  }
};

const loadClassTeacherAllocations = async () => {
  if (!selectedBranchId.value) return;

  try {
    classTeacherLoading.value = true;
    const response = await classTeacherApi.getAll({
      limit: 1000,
      branch_id: selectedBranchId.value
    });
    // Fix: Extract classTeachers from nested data structure
    classTeacherAllocations.value = response.data?.classTeachers || [];
  } catch (error) {
    showToast('Failed to load class teacher allocations', 'error');
    console.error('Error loading class teacher allocations:', error);
  } finally {
    classTeacherLoading.value = false;
  }
};

const loadTeachers = async () => {
  if (!selectedBranchId.value) return;

  try {
    const response = await Users.getAll({
      role: 'teacher',
      branch_id: selectedBranchId.value,
      limit: 1000
    });
    // Fix: Access teachers from response.data.users, not response.data
    teacherOptions.value = response.data?.users || [];
  } catch (error) {
    console.error('Error loading teachers:', error);
    showToast('Failed to load teachers', 'error');
  }
};

const loadSchools = async () => {
  if (!isSuperAdmin.value) return;

  try {
    schoolsLoading.value = true;
    const response = await Schools.getAll();
    availableSchools.value = response.data.schools || [];
  } catch (error) {
    showToast('Failed to load schools', 'error');
    console.error('Error loading schools:', error);
  } finally {
    schoolsLoading.value = false;
  }
};

const loadBranches = async () => {
  try {
    branchesLoading.value = true;
    let response;

    if (isSuperAdmin.value && selectedSchoolId.value) {
      response = await Branches.getAll({ school_id: selectedSchoolId.value });
    } else if (isSchoolAdmin.value) {
      response = await Branches.getAll({ school_id: user.value.school_id });
    } else if (isBranchAdmin.value) {
      response = await Branches.getAll({ school_id: user.value.school_id });
    }

    if (response) {
      availableBranches.value = response.data.branches || [];
    }
  } catch (error) {
    showToast('Failed to load branches', 'error');
    console.error('Error loading branches:', error);
  } finally {
    branchesLoading.value = false;
  }
};

const onSchoolChange = async () => {
  selectedBranchId.value = '';
  selectedBranch.value = null;
  await loadBranches();
};

const onBranchChange = async () => {
  const branch = availableBranches.value.find(b => b.id === selectedBranchId.value);
  selectedBranch.value = branch;

  if (selectedBranchId.value) {
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
    await classTeacherApi.create(data);
    showToast('Class teacher assigned successfully', 'success');
    await loadClassTeacherAllocations();
  } catch (error) {
    showToast('Failed to assign class teacher', 'error');
    console.error('Error assigning class teacher:', error);
  }
};

const handleClassTeacherUpdate = async data => {
  try {
    await classTeacherApi.update(data.id, data);
    showToast('Class teacher updated successfully', 'success');
    await loadClassTeacherAllocations();
  } catch (error) {
    showToast('Failed to update class teacher', 'error');
    console.error('Error updating class teacher:', error);
  }
};

const handleClassTeacherRemove = async id => {
  try {
    await classTeacherApi.delete(id);
    showToast('Class teacher removed successfully', 'success');
    await loadClassTeacherAllocations();
  } catch (error) {
    showToast('Failed to remove class teacher', 'error');
    console.error('Error removing class teacher:', error);
  }
};

// Class Subject Assignment handlers
const handleClassSubjectAssign = async mappingData => {
  try {
    console.log('Bulk assign data:', mappingData);

    // Create individual assignments for each subject
    const assignments = mappingData.subject_ids.map(subjectId => {
      const assignment = {
        class_id: mappingData.class_id,
        subject_id: subjectId,
        section_id:
          mappingData.section_id && mappingData.section_id !== '' ? mappingData.section_id : null,
        stream_id:
          mappingData.stream_id && mappingData.stream_id !== '' ? mappingData.stream_id : null,
        academic_year: mappingData.academic_year
      };

      console.log('Assignment data:', {
        section_id: assignment.section_id,
        section_id_type: typeof assignment.section_id,
        section_id_length: assignment.section_id?.length,
        stream_id: assignment.stream_id,
        stream_id_type: typeof assignment.stream_id,
        stream_id_length: assignment.stream_id?.length
      });

      return assignment;
    });

    const className = classes.value.find(cls => cls.id === mappingData.class_id)?.name || 'Class';

    console.log('Creating assignments:', assignments);

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

  if (shouldShowBranchFilter.value) {
    await loadSchools();
    await loadBranches();
  } else {
    // For non-admin users, use their assigned branch
    selectedBranchId.value = user.value.branch_id;
    selectedBranch.value = { id: user.value.branch_id, name: user.value.branch_name };

    if (selectedBranchId.value) {
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
  }
});
</script>
