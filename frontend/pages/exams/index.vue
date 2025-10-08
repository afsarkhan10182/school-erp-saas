<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Exams</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">Manage exams and exam types</p>
        </div>
      </div>

      <!-- Branch Selection (For Exams and Exam Halls Tabs) -->
      <div
        v-if="shouldShowBranchFilter && activeTab === 'exams'"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Branch Selection</h3>
          <div class="flex items-center space-x-2">
            <Building2 class="h-5 w-5 text-indigo-600" />
            <span class="text-sm text-gray-600 dark:text-gray-400"
              >Select branch to manage exams</span
            >
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- School Selection (Super Admin only) -->
          <div v-if="isSuperAdmin">
            <EnhancedDropdown
              v-model="selectedSchoolId"
              :options="schoolOptions"
              label="School"
              placeholder="Select School"
              :loading="schoolsLoading"
              @update:model-value="onSchoolChange"
            />
          </div>

          <!-- Branch Selection using EnhancedDropdown -->
          <div>
            <EnhancedDropdown
              v-model="selectedBranchId"
              :options="branchOptions"
              label="Branch"
              placeholder="Select Branch"
              :loading="branchesLoading"
              :disabled="isSuperAdmin && !selectedSchoolId"
              @update:model-value="onBranchChange"
            />
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
              Managing exams for your assigned branch
            </p>
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <ScrollableTabs :tabs="tabs" :active-tab="activeTab" @tab-change="handleTabChange">
        <!-- Branch Selection Required Message (Only for Exams Tab) -->
        <div
          v-if="activeTab === 'exams' && !selectedBranchId && shouldShowBranchFilter"
          class="p-8 text-center"
        >
          <Building2 class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Select a Branch</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Please select a branch to manage exams.
          </p>
        </div>

        <!-- Exam Types Tab (School-wide, no branch selection needed) -->
        <div v-else-if="activeTab === 'exam-types'" class="p-6">
          <ExamTypesTab
            ref="examTypesTabRef"
            :exam-types="examTypes"
            :loading="examTypesLoading"
            :branch-id="null"
            @refresh="loadExamTypes"
            @create="handleExamTypeCreate"
            @update="handleExamTypeUpdate"
            @delete="handleExamTypeDelete"
          />
        </div>

        <!-- Exam Statuses Tab (School-wide, no branch selection needed) -->
        <div v-else-if="activeTab === 'exam-statuses'" class="p-6">
          <ExamStatusesTab
            ref="examStatusesTabRef"
            :exam-statuses="examStatuses"
            :loading="examStatusesLoading"
            @refresh="loadExamStatuses"
            @create="handleExamStatusCreate"
            @update="handleExamStatusUpdate"
            @delete="handleExamStatusDelete"
          />
        </div>

        <!-- Grading Systems Tab (School-wide, no branch selection needed) -->
        <div v-else-if="activeTab === 'grading-systems'" class="p-6">
          <GradingSystemsTab
            ref="gradingSystemsTabRef"
            :grading-systems="gradingSystems"
            :loading="gradingSystemsLoading"
            @refresh="loadGradingSystems"
            @create="handleGradingSystemCreate"
            @update="handleGradingSystemUpdate"
            @delete="handleGradingSystemDelete"
          />
        </div>

        <!-- Exam Halls Tab (School-wide, no branch selection needed) -->
        <div v-else-if="activeTab === 'exam-halls'" class="p-6">
          <ExamHallsTab ref="examHallsTabRef" @refresh="loadExamHalls" @success="loadExamHalls" />
        </div>

        <!-- Exams Tab (Branch-specific, requires branch selection) -->
        <div
          v-else-if="activeTab === 'exams' && (selectedBranchId || !shouldShowBranchFilter)"
          class="p-6"
        >
          <ExamsTab
            ref="examsTabRef"
            :exams="exams"
            :stats="stats"
            :loading="examsLoading"
            :branch-id="selectedBranchId"
            :school-id="selectedSchoolId"
            @refresh="loadExams"
            @create="handleExamCreate"
            @update="handleExamUpdate"
            @delete="handleExamDelete"
          />
        </div>
      </ScrollableTabs>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { Building2, Tag, BookOpen, Settings, BarChart3, Building } from 'lucide-vue-next';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import ScrollableTabs from '~/components/ui/ScrollableTabs.vue';
import ExamTypesTab from '~/components/academic/ExamTypesTab.vue';
import ExamsTab from '~/components/academic/ExamsTab.vue';
import ExamStatusesTab from '~/components/academic/ExamStatusesTab.vue';
import GradingSystemsTab from '~/components/academic/GradingSystemsTab.vue';
import ExamHallsTab from '~/components/academic/ExamHallsTab.vue';
import { useBranches } from '~/composables/useBranches';
import { useAuth } from '~/composables/useAuth';
import { useToast } from '~/composables/useToast';
import { useExamOptions } from '~/composables/useExamOptions';
import { useExams } from '~/composables/useExams';
import { useExamStatuses } from '~/composables/useExamStatuses';
import { useGradingSystems } from '~/composables/useGradingSystems';
import { useExamHalls } from '~/composables/useExamHalls';

// Composables
const { branches, loading: branchesLoading, fetchBranches } = useBranches();
const { user, isSuperAdmin, isSchoolAdmin, isBranchAdmin } = useAuth();
const { showToast } = useToast();
const { examTypes, examTypeOptions, loading: examTypesLoading, loadExamTypes } = useExamOptions();
const { exams, stats, loading: examsLoading, loadExams } = useExams();
const { examStatuses, loading: examStatusesLoading, loadExamStatuses } = useExamStatuses();
const { gradingSystems, loading: gradingSystemsLoading, loadGradingSystems } = useGradingSystems();
const { loadHalls: loadExamHalls } = useExamHalls();

// School-related composables (for Super Admin)
const { schools, loading: schoolsLoading, fetchSchools } = useBranches();

// Tab configuration
const tabs = [
  { id: 'exam-types', name: 'Exam Types', icon: Tag },
  { id: 'exam-statuses', name: 'Exam Statuses', icon: Settings },
  { id: 'grading-systems', name: 'Grading Systems', icon: BarChart3 },
  { id: 'exam-halls', name: 'Exam Halls', icon: Building },
  { id: 'exams', name: 'Exams', icon: BookOpen }
];

// Reactive data
const activeTab = ref('exam-types');
const selectedBranchId = ref('');
const selectedSchoolId = ref('');

// Refs
const examsTabRef = ref(null);
const examTypesTabRef = ref(null);
const examStatusesTabRef = ref(null);
const gradingSystemsTabRef = ref(null);
const examHallsTabRef = ref(null);

// Computed properties for branch logic
const shouldShowBranchFilter = computed(() => {
  return isSuperAdmin.value || isSchoolAdmin.value;
});

const branchOptions = computed(() => {
  return branches.value.map(branch => ({
    value: branch.id,
    label: branch.name
  }));
});

const schoolOptions = computed(() => {
  return schools.value.map(school => ({
    value: school.id,
    label: school.name
  }));
});

// Methods
const onBranchChange = async () => {
  if (selectedBranchId.value) {
    // Reload branch-specific data
    if (activeTab.value === 'exams') {
      await loadExams();
    } else if (activeTab.value === 'exam-halls') {
      await loadExamHalls();
    }
  }
};

const onSchoolChange = async () => {
  selectedBranchId.value = '';
  if (selectedSchoolId.value) {
    await fetchBranches({ school_id: selectedSchoolId.value });
  }
};

const handleExamTypeCreate = async examTypeData => {
  try {
    const { examTypeApi } = await import('~/api/academic/exam-types');
    const response = await examTypeApi.create(examTypeData);
    if (response.success) {
      showToast('Exam type created successfully', 'success');
      await loadExamTypes();
      // Close modal on success
      if (examTypesTabRef.value) {
        examTypesTabRef.value.closeModalOnSuccess();
      }
    }
  } catch (error) {
    showToast(error.message || 'Failed to create exam type', 'error');
  }
};

const handleExamTypeUpdate = async examTypeData => {
  try {
    const { examTypeApi } = await import('~/api/academic/exam-types');
    const response = await examTypeApi.update(examTypeData.id, examTypeData);
    if (response.success) {
      showToast('Exam type updated successfully', 'success');
      await loadExamTypes();
      // Close modal on success
      if (examTypesTabRef.value) {
        examTypesTabRef.value.closeModalOnSuccess();
      }
    }
  } catch (error) {
    showToast(error.message || 'Failed to update exam type', 'error');
  }
};

const handleExamTypeDelete = async examTypeId => {
  try {
    const { examTypeApi } = await import('~/api/academic/exam-types');
    const response = await examTypeApi.delete(examTypeId);
    if (response.success) {
      showToast('Exam type deleted successfully', 'success');
      await loadExamTypes();
    }
  } catch (error) {
    showToast(error.message || 'Failed to delete exam type', 'error');
  }
};

const handleExamCreate = async examData => {
  try {
    const { examApi } = await import('~/api/academic/exams');
    const response = await examApi.create(examData);
    if (response.success) {
      showToast('Exam created successfully', 'success');
      await loadExams();
      // Close modal on success
      if (examsTabRef.value) {
        examsTabRef.value.closeModalOnSuccess();
      }
    }
  } catch (error) {
    showToast(error.message || 'Failed to create exam', 'error');
  }
};

const handleExamUpdate = async examData => {
  try {
    const { examApi } = await import('~/api/academic/exams');
    const response = await examApi.update(examData.id, examData);
    if (response.success) {
      showToast('Exam updated successfully', 'success');
      await loadExams();
      // Close modal on success
      if (examsTabRef.value) {
        examsTabRef.value.closeModalOnSuccess();
      }
    }
  } catch (error) {
    showToast(error.message || 'Failed to update exam', 'error');
  }
};

const handleExamDelete = async examId => {
  try {
    const { examApi } = await import('~/api/academic/exams');
    const response = await examApi.delete(examId);
    if (response.success) {
      showToast('Exam deleted successfully', 'success');
      await loadExams();
    }
  } catch (error) {
    showToast(error.message || 'Failed to delete exam', 'error');
  }
};

const handleExamStatusCreate = async statusData => {
  try {
    const { examStatusApi } = await import('~/api/academic/exam-statuses');
    const response = await examStatusApi.create(statusData);
    if (response.success) {
      showToast('Exam status created successfully', 'success');
      await loadExamStatuses();
      // Close modal on success
      if (examStatusesTabRef.value) {
        examStatusesTabRef.value.closeModalOnSuccess();
      }
    }
  } catch (error) {
    showToast(error.message || 'Failed to create exam status', 'error');
  }
};

const handleExamStatusUpdate = async statusData => {
  try {
    const { examStatusApi } = await import('~/api/academic/exam-statuses');
    const response = await examStatusApi.update(statusData.id, statusData);
    if (response.success) {
      showToast('Exam status updated successfully', 'success');
      await loadExamStatuses();
      // Close modal on success
      if (examStatusesTabRef.value) {
        examStatusesTabRef.value.closeModalOnSuccess();
      }
    }
  } catch (error) {
    showToast(error.message || 'Failed to update exam status', 'error');
  }
};

const handleExamStatusDelete = async statusId => {
  try {
    const { examStatusApi } = await import('~/api/academic/exam-statuses');
    const response = await examStatusApi.delete(statusId);
    if (response.success) {
      showToast('Exam status deleted successfully', 'success');
      await loadExamStatuses();
    }
  } catch (error) {
    showToast(error.message || 'Failed to delete exam status', 'error');
  }
};

const handleGradingSystemCreate = async systemData => {
  try {
    const { gradingSystemApi } = await import('~/api/academic/grading-systems');
    const response = await gradingSystemApi.create(systemData);
    if (response.success) {
      showToast('Grading system created successfully', 'success');
      await loadGradingSystems();
      // Close modal on success
      if (gradingSystemsTabRef.value) {
        gradingSystemsTabRef.value.closeModalOnSuccess();
      }
    }
  } catch (error) {
    showToast(error.message || 'Failed to create grading system', 'error');
  }
};

const handleGradingSystemUpdate = async systemData => {
  try {
    const { gradingSystemApi } = await import('~/api/academic/grading-systems');
    const response = await gradingSystemApi.update(systemData.id, systemData);
    if (response.success) {
      showToast('Grading system updated successfully', 'success');
      await loadGradingSystems();
      // Close modal on success
      if (gradingSystemsTabRef.value) {
        gradingSystemsTabRef.value.closeModalOnSuccess();
      }
    }
  } catch (error) {
    showToast(error.message || 'Failed to update grading system', 'error');
  }
};

const handleGradingSystemDelete = async systemId => {
  try {
    const { gradingSystemApi } = await import('~/api/academic/grading-systems');
    const response = await gradingSystemApi.delete(systemId);
    if (response.success) {
      showToast('Grading system deleted successfully', 'success');
      await loadGradingSystems();
    }
  } catch (error) {
    showToast(error.message || 'Failed to delete grading system', 'error');
  }
};

// Tab change handler
const handleTabChange = async tabId => {
  activeTab.value = tabId;

  // Load data only when tab is accessed
  switch (tabId) {
    case 'exam-types':
      if (examTypes.value.length === 0) {
        await loadExamTypes();
      }
      break;
    case 'exam-statuses':
      if (examStatuses.value.length === 0) {
        await loadExamStatuses();
      }
      break;
    case 'grading-systems':
      if (gradingSystems.value.length === 0) {
        await loadGradingSystems();
      }
      break;
    case 'exam-halls':
      // Load exam halls when tab is accessed
      await loadExamHalls();
      break;
    case 'exams':
      if (selectedBranchId.value || !shouldShowBranchFilter.value) {
        if (exams.value.length === 0) {
          await loadExams();
        }
      }
      break;
  }
};

// Lifecycle
onMounted(async () => {
  // Load schools for Super Admin
  if (isSuperAdmin.value) {
    await fetchSchools();
  }

  // Load branches and handle branch logic
  await fetchBranches();

  // Auto-select branch for branch admin
  if (isBranchAdmin.value && user.value?.branch_id) {
    selectedBranchId.value = user.value.branch_id;
  }

  // Auto-select branch if only one branch for school admin
  if (isSchoolAdmin.value && branches.value.length === 1) {
    selectedBranchId.value = branches.value[0].id;
  }

  // Load only the default tab data (exam-types)
  await loadExamTypes();
});
</script>
