<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Subject Management</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage subjects, class assignments, and teacher assignments in one place
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
              >Select branch to manage subjects</span
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
              Branch <span class="text-red-500">*</span>
            </label>
            <select
              v-model="selectedBranchId"
              @change="onBranchChange"
              class="input-field"
              :disabled="!selectedSchoolId || branchesLoading"
              required
            >
              <option value="">
                {{ branchesLoading ? 'Loading branches...' : 'Select Branch' }}
              </option>
              <option v-for="branch in availableBranches" :key="branch.id" :value="branch.id">
                {{ branch.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Branch Info for Branch Admin -->
      <div
        v-else-if="isBranchAdmin"
        class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6"
      >
        <div class="flex items-center">
          <Building2 class="h-5 w-5 text-blue-600 mr-2" />
          <div>
            <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100">
              Your Branch: {{ user?.branch_name || 'Your Branch' }}
            </h4>
            <p class="text-xs text-blue-700 dark:text-blue-300">
              Managing subjects for your assigned branch
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
            Please select a branch to manage subjects and assignments.
          </p>
        </div>

        <!-- Subjects Tab -->
        <div v-else-if="activeTab === 'subjects'" class="p-6">
          <SubjectsTab
            :subjects="subjects"
            :loading="subjectsLoading"
            :class-options="classOptions"
            :selected-branch="selectedBranch"
            @refresh="loadSubjects"
            @create="handleSubjectCreate"
            @update="handleSubjectUpdate"
            @delete="handleSubjectDelete"
          />
        </div>

        <!-- Teacher Assignment Tab -->
        <div v-else-if="activeTab === 'teacher-assignment'" class="p-6">
          <TeacherAssignmentTab
            :assignments="teacherAssignments"
            :classes="classes"
            :subjects="subjects"
            :teachers="teacherOptions"
            :loading="assignmentsLoading"
            :academic-years="academicYearOptions"
            :branch-id="selectedBranchId"
            @refresh="loadTeacherAssignments"
            @assign="handleTeacherAssign"
            @update="handleTeacherUpdate"
            @remove="handleTeacherRemove"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from '~/composables/useToast';
import { useDropdowns } from '~/composables/useDropdowns';
import { useAcademics } from '~/composables/useAcademics';
import { useAuth } from '~/composables/useAuth';
import { Subjects, SubjectTeachers, Users } from '~/api';
import { Schools } from '~/api/administration/schools';
import { Branches } from '~/api/administration/branches';
import { AcademicYears } from '~/api/academic/academic-years';
import { Classes } from '~/api/academic/classes';
import { BookOpen, UserCheck, Building2 } from 'lucide-vue-next';

// Import tab components
import SubjectsTab from '~/components/academic/SubjectsTab.vue';
import TeacherAssignmentTab from '~/components/academic/TeacherAssignmentTab.vue';

// Composables
const { showToast } = useToast();
const { classOptions } = useDropdowns();
const { academicYears, fetchAcademicYears } = useAcademics();
const { isSuperAdmin, isSchoolAdmin, isBranchAdmin, user } = useAuth();

// Tab configuration
const tabs = [
  { id: 'subjects', name: 'Subjects', icon: BookOpen },
  { id: 'teacher-assignment', name: 'Subject Teachers', icon: UserCheck }
];

// Reactive data
const activeTab = ref('subjects');
const subjects = ref([]);
const classes = ref([]);
const teacherAssignments = ref([]);
const teacherOptions = ref([]);
const subjectsLoading = ref(false);
const assignmentsLoading = ref(false);

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
  return academicYears.value.map(year => ({
    value: year.name,
    label: year.name + (year.is_current ? ' (Current)' : '')
  }));
});

const currentAcademicYear = computed(() => {
  return academicYears.value.find(year => year.is_current) || null;
});

// Methods
const loadSchools = async () => {
  try {
    schoolsLoading.value = true;
    const response = await Schools.getAll();
    availableSchools.value = response.data?.schools || response.data?.items || response.data || [];
  } catch (error) {
    showToast('Failed to load schools', 'error');
    console.error('Error loading schools:', error);
  } finally {
    schoolsLoading.value = false;
  }
};

const loadBranches = async schoolId => {
  try {
    branchesLoading.value = true;
    const response = await Branches.getForDropdown({ school_id: schoolId });
    availableBranches.value = response.data || [];
  } catch (error) {
    showToast('Failed to load branches', 'error');
    console.error('Error loading branches:', error);
  } finally {
    branchesLoading.value = false;
  }
};

const loadTeachers = async () => {
  try {
    const response = await Users.getAll({ role: 'teacher' });
    teacherOptions.value = (response.data.users || response.data.rows || []).map(teacher => ({
      value: teacher.id,
      label: `${teacher.first_name} ${teacher.last_name} (${teacher.email})`
    }));
  } catch (error) {
    console.error('Error loading teachers:', error);
    showToast('Failed to load teachers', 'error');
  }
};

// Load academic data for the selected branch (similar to student registration form)
const loadAcademicDataForBranch = async () => {
  try {
    if (!selectedSchoolId.value || !selectedBranchId.value) {
      console.log('loadAcademicDataForBranch: Missing school_id or branch_id');
      return;
    }

    console.log(
      'loadAcademicDataForBranch: Loading for school_id:',
      selectedSchoolId.value,
      'branch_id:',
      selectedBranchId.value
    );

    // Load academic years for the school
    await fetchAcademicYears(selectedSchoolId.value);

    console.log('loadAcademicDataForBranch: Academic years loaded:', academicYears.value?.length);
    console.log('loadAcademicDataForBranch: Academic years data:', academicYears.value);

    // Set current academic year if available
    if (academicYears.value?.length > 0) {
      const currentYear = academicYears.value.find(y => y.is_current) || academicYears.value[0];
      if (currentYear) {
        console.log(
          'loadAcademicDataForBranch: Found current year:',
          currentYear.name,
          'is_current:',
          currentYear.is_current
        );
      } else {
        console.log('loadAcademicDataForBranch: No current year found');
      }
    } else {
      console.log('loadAcademicDataForBranch: No academic years found');
    }
  } catch (error) {
    console.error('loadAcademicDataForBranch error:', error);
    showToast('Failed to load academic data for branch', 'error');
  }
};

const loadSubjects = async () => {
  if (!selectedBranchId.value) return;

  try {
    subjectsLoading.value = true;
    const response = await Subjects.getAll({
      limit: 1000,
      branch_id: selectedBranchId.value
    });
    subjects.value = response.data.subjects;
  } catch (error) {
    showToast('Failed to load subjects', 'error');
    console.error('Error loading subjects:', error);
  } finally {
    subjectsLoading.value = false;
  }
};

const loadClassesData = async () => {
  if (!selectedBranchId.value) return;

  try {
    // Load classes for teacher assignments
    const classesResponse = await Classes.getDropdown(`branch_id=${selectedBranchId.value}`);
    classes.value =
      classesResponse.data?.classes || classesResponse.data?.data || classesResponse.data || [];
  } catch (error) {
    showToast('Failed to load classes', 'error');
    console.error('Error loading classes:', error);
  }
};

const loadTeacherAssignments = async () => {
  if (!selectedBranchId.value) return;

  try {
    assignmentsLoading.value = true;
    const response = await SubjectTeachers.getAll({
      limit: 1000,
      branch_id: selectedBranchId.value
    });
    teacherAssignments.value = response.data.assignments;
  } catch (error) {
    showToast('Failed to load teacher assignments', 'error');
    console.error('Error loading assignments:', error);
  } finally {
    assignmentsLoading.value = false;
  }
};

// Branch selection handlers

// School and branch change handlers
const onSchoolChange = async () => {
  selectedBranchId.value = '';
  if (selectedSchoolId.value) {
    await loadBranches(selectedSchoolId.value);
  } else {
    availableBranches.value = [];
  }
};

const onBranchChange = async () => {
  if (selectedBranchId.value) {
    const branch = availableBranches.value.find(b => b.id === selectedBranchId.value);
    selectedBranch.value = branch;
    console.log('Selected branch:', selectedBranch.value);

    // Load academic data for the selected branch
    await loadAcademicDataForBranch();

    // Load other data
    await Promise.all([loadSubjects(), loadClassesData(), loadTeacherAssignments()]);
  } else {
    selectedBranch.value = null;
  }
};

// Event handlers
const handleSubjectCreate = async subjectData => {
  try {
    await Subjects.create({ ...subjectData, branch_id: selectedBranchId.value });
    showToast('Subject created successfully', 'success');
    await loadSubjects();
  } catch (error) {
    showToast('Failed to create subject', 'error');
    console.error('Error creating subject:', error);
  }
};

const handleSubjectUpdate = async (id, subjectData) => {
  try {
    await Subjects.update(id, subjectData);
    showToast('Subject updated successfully', 'success');
    await loadSubjects();
  } catch (error) {
    showToast('Failed to update subject', 'error');
    console.error('Error updating subject:', error);
  }
};

const handleSubjectDelete = async id => {
  try {
    await Subjects.delete(id);
    showToast('Subject deleted successfully', 'success');
    await loadSubjects();
  } catch (error) {
    showToast('Failed to delete subject', 'error');
    console.error('Error deleting subject:', error);
  }
};

const handleTeacherAssign = async assignmentData => {
  try {
    await SubjectTeachers.create({ ...assignmentData, branch_id: selectedBranchId.value });
    showToast('Teacher assigned successfully', 'success');
    await loadTeacherAssignments();
  } catch (error) {
    showToast('Failed to assign teacher', 'error');
    console.error('Error assigning teacher:', error);
  }
};

const handleTeacherUpdate = async (id, assignmentData) => {
  try {
    await SubjectTeachers.update(id, assignmentData);
    showToast('Teacher assignment updated successfully', 'success');
    await loadTeacherAssignments();
  } catch (error) {
    showToast('Failed to update teacher assignment', 'error');
    console.error('Error updating assignment:', error);
  }
};

const handleTeacherRemove = async id => {
  try {
    await SubjectTeachers.delete(id);
    showToast('Teacher assignment removed successfully', 'success');
    await loadTeacherAssignments();
  } catch (error) {
    showToast('Failed to remove teacher assignment', 'error');
    console.error('Error removing assignment:', error);
  }
};

// Initialize
const initialize = async () => {
  try {
    // Load academic years first
    await fetchAcademicYears();

    // Check if we have a current academic year
    let currentYear = academicYears.value.find(year => year.is_current);

    // If no current year found, try to get it directly from API
    if (!currentYear) {
      try {
        const currentYearResponse = await AcademicYears.getCurrent();
        if (currentYearResponse.data) {
          currentYear = currentYearResponse.data;
          // Add to academic years array if not already there
          if (!academicYears.value.find(year => year.id === currentYear.id)) {
            academicYears.value.push(currentYear);
          }
        }
      } catch (error) {
        console.error('Error fetching current academic year:', error);
      }
    }

    if (!currentYear) {
      showToast(
        'No current academic year is set. Please contact administrator to set up academic years.',
        'error'
      );
      console.error('No current academic year found. Academic years:', academicYears.value);
      return;
    }

    await loadTeachers();

    // Set up based on user role
    if (isSuperAdmin.value) {
      await loadSchools();
    } else if (isSchoolAdmin.value) {
      // Auto-select user's school and load branches
      selectedSchoolId.value = user.value?.school_id;
      if (selectedSchoolId.value) {
        await loadBranches(selectedSchoolId.value);
        // Auto-select if only one branch
        if (availableBranches.value.length === 1) {
          selectedBranchId.value = availableBranches.value[0].id;
          await onBranchChange();
        }
      }
    } else if (isBranchAdmin.value) {
      // Auto-select user's branch
      selectedSchoolId.value = user.value?.school_id;
      selectedBranchId.value = user.value?.branch_id;
      selectedBranch.value = {
        id: user.value?.branch_id,
        name: user.value?.branch_name || 'Your Branch'
      };
      // Add the branch to availableBranches for display
      availableBranches.value = [selectedBranch.value];

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

// Lifecycle
onMounted(initialize);
</script>

<style scoped>
.input-field {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  outline: none;
  background-color: white;
  color: #111827;
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.input-field:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.dark .input-field {
  border-color: #4b5563;
  background-color: #1f2937;
  color: white;
}

.dark .input-field:focus {
  border-color: #3b82f6;
}
</style>
