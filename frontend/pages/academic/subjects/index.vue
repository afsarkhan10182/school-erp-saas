<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Academic Management</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage subjects and teacher assignments for your school
          </p>
        </div>
      </div>

      <!-- Tabs -->
      <ScrollableTabs :tabs="tabs" :active-tab="activeTab" @tab-change="activeTab = $event">
        <!-- Subjects Tab -->
        <div v-if="activeTab === 'subjects'" class="p-6">
          <SubjectsTab
            :subjects="subjects"
            :loading="subjectsLoading"
            :academic-years="academicYears"
            :school-id="selectedSchoolId"
            :branch-id="selectedBranchId"
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
            :academic-years="academicYears"
            :school-id="selectedSchoolId"
            :branch-id="selectedBranchId"
            @refresh="loadTeacherAssignments"
            @assign="handleTeacherAssign"
            @update="handleTeacherUpdate"
            @remove="handleTeacherRemove"
          />
        </div>
      </ScrollableTabs>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useSubjects } from '~/composables/useSubjects';
import { useAuth } from '~/composables/useAuth';
import { BookOpen, UserCheck, Building2 } from 'lucide-vue-next';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import ScrollableTabs from '~/components/ui/ScrollableTabs.vue';

// Import tab components
import SubjectsTab from '~/components/academic/SubjectsTab.vue';
import TeacherAssignmentTab from '~/components/academic/TeacherAssignmentTab.vue';

// Composables
const {
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
} = useSubjects();

// Dropdown options
const schoolOptions = computed(() => [
  ...schools.value.map(school => ({
    value: school.id,
    label: school.name
  }))
]);

const branchOptions = computed(() => [
  ...branches.value.map(branch => ({
    value: branch.id,
    label: branch.name
  }))
]);

const { isSuperAdmin, isAdmin, isBranchAdmin } = useAuth();

// Tab configuration
const tabs = [
  { id: 'subjects', name: 'Subjects', icon: BookOpen },
  { id: 'teacher-assignment', name: 'Subject Teachers', icon: UserCheck }
];

// Reactive data
const activeTab = ref('subjects');

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
  transition:
    border-color 0.15s ease-in-out,
    box-shadow 0.15s ease-in-out;
}

.input-field:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.dark .input-field {
  background-color: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}

.dark .input-field:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}
</style>
