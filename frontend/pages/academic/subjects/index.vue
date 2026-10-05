<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Academic Management</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage subjects and teacher assignments for your school
        </p>
      </div>
    </div>

    <!-- Tabs -->
    <ScrollableTabs :tabs="tabs" :active-tab="activeTab" @tab-change="activeTab = $event">
      <!-- Subjects Tab -->
      <div v-if="activeTab === 'subjects'" class="pt-4">
        <SubjectsTab
          :subjects="subjects"
          :loading="subjectsLoading"
          :academic-years="academicYears"
          :school-id="currentSchool?.id"
          :branch-id="selectedBranchId"
          @create="handleSubjectCreate"
          @update="handleSubjectUpdate"
          @delete="handleSubjectDelete"
        />
      </div>

      <!-- Teacher Assignment Tab -->
      <div v-else-if="activeTab === 'teacher-assignment'" class="pt-4">
        <TeacherAssignmentTab
          :assignments="teacherAssignments"
          :classes="classes"
          :subjects="subjects"
          :teachers="teacherOptions"
          :loading="assignmentsLoading"
          :academic-years="academicYears"
          :school-id="currentSchool?.id"
          :branch-id="selectedBranchId"
          @refresh="loadTeacherAssignments"
          @assign="handleTeacherAssign"
          @update="handleTeacherUpdate"
          @remove="handleTeacherRemove"
        />
      </div>
    </ScrollableTabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useSubjects } from '~/composables/useSubjects';
import { useAuth } from '~/composables/useAuth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { BookOpen, UserCheck, Building2 } from 'lucide-vue-next';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import ScrollableTabs from '~/components/ui/ScrollableTabs.vue';

// Import tab components
import SubjectsTab from '~/components/academic/SubjectsTab.vue';
import TeacherAssignmentTab from '~/components/academic/TeacherAssignmentTab.vue';

const { currentBranch, currentSchool, selectedBranchId, branchScopeParams } = useGlobalBranch();

// Composables
const {
  // State
  subjects,
  teacherAssignments,
  subjectsLoading,
  assignmentsLoading,
  classes,
  teacherOptions,
  academicYears,

  // Computed
  academicYearOptions,
  currentAcademicYear,

  // Methods
  loadTeachersData,
  loadAcademicDataForBranch,
  loadSubjects,
  loadClassesData,
  loadTeacherAssignments,
  handleSubjectCreate,
  handleSubjectUpdate,
  handleSubjectDelete,
  handleTeacherAssign,
  handleTeacherUpdate,
  handleTeacherRemove,
  initialize
} = useSubjects();

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
