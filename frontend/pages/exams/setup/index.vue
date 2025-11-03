<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Exam Setup</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Configure exam system settings following industry standards
          </p>
        </div>
      </div>

      <!-- Tab Navigation ( Standard - 4 tabs only) -->
      <ScrollableTabs :tabs="tabs" :active-tab="activeTab" @tab-change="handleTabChange">
        <!-- Exam Terms Tab ( Standard) -->
        <div v-if="activeTab === 'exam-terms'" class="p-6">
          <ExamTermsTab ref="examTermsTabRef" @refresh="loadTerms" @success="handleTermSuccess" />
        </div>

        <!-- Exam Halls Tab -->
        <div v-else-if="activeTab === 'exam-halls'" class="p-6">
          <ExamHallsTab
            ref="examHallsTabRef"
            @refresh="loadExamHalls"
            @success="handleExamHallSuccess"
          />
        </div>

        <!-- Mark Distribution Tab ( Standard) -->
        <div v-else-if="activeTab === 'mark-distributions'" class="p-6">
          <MarkDistributionsTab
            ref="markDistributionsTabRef"
            @refresh="loadMarkDistributions"
            @success="handleDistributionSuccess"
          />
        </div>

        <!-- Grading Systems Tab -->
        <div v-else-if="activeTab === 'grading-systems'" class="p-6">
          <GradingSystemsTab
            ref="gradingSystemsTabRef"
            @create="handleGradingSystemCreate"
            @update="handleGradingSystemUpdate"
            @delete="handleGradingSystemDelete"
            @success="handleGradingSystemSuccess"
          />
        </div>
      </ScrollableTabs>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { Tag, Building, Calendar, Award } from 'lucide-vue-next';
import ScrollableTabs from '~/components/ui/ScrollableTabs.vue';
import ExamHallsTab from '~/components/academic/ExamHallsTab.vue';
import ExamTermsTab from '~/components/academic/ExamTermsTab.vue';
import MarkDistributionsTab from '~/pages/exams/setup/mark-distributions.vue';
import GradingSystemsTab from '~/components/academic/GradingSystemsTab.vue';
import { useAuth } from '~/composables/useAuth';
import { useToast } from '~/composables/useToast';
import { examTermApi } from '~/api/academic/exam-terms';
import { markDistributionApi } from '~/api/academic/mark-distributions';

// Tab configuration ( Standard - 4 tabs only)
const tabs = [
  { id: 'exam-terms', name: 'Exam Terms', icon: Calendar },
  { id: 'exam-halls', name: 'Exam Halls', icon: Building },
  { id: 'mark-distributions', name: 'Mark Distribution', icon: Tag },
  { id: 'grading-systems', name: 'Grading Systems', icon: Award }
];

// Reactive data
const activeTab = ref('exam-terms');

// Template refs
const examTermsTabRef = ref(null);
const examHallsTabRef = ref(null);
const markDistributionsTabRef = ref(null);
const gradingSystemsTabRef = ref(null);

// Composables
const { user } = useAuth();
const { showToast } = useToast();

// Methods
const handleTabChange = async tabId => {
  activeTab.value = tabId;

  // Load data for the specific tab when it becomes active
  switch (tabId) {
    case 'exam-terms':
      if (examTermsTabRef.value) {
        await examTermsTabRef.value.loadData();
      }
      break;
    case 'exam-halls':
      if (examHallsTabRef.value) {
        await examHallsTabRef.value.loadData();
      }
      break;
    case 'mark-distributions':
      if (markDistributionsTabRef.value) {
        await markDistributionsTabRef.value.loadData();
      }
      break;
    case 'grading-systems':
      if (gradingSystemsTabRef.value) {
        await gradingSystemsTabRef.value.loadData();
      }
      break;
  }
};

// Success handlers for each tab
const handleTermSuccess = () => {
  if (examTermsTabRef.value) {
    examTermsTabRef.value.loadData();
  }
};

const handleExamHallSuccess = () => {
  if (examHallsTabRef.value) {
    examHallsTabRef.value.loadData();
  }
};

const handleDistributionSuccess = () => {
  if (markDistributionsTabRef.value) {
    markDistributionsTabRef.value.loadData();
  }
};

// Grading system event handlers (now handled by the component itself)
const handleGradingSystemCreate = async systemData => {
  // Component handles this internally
};

const handleGradingSystemUpdate = async systemData => {
  // Component handles this internally
};

const handleGradingSystemDelete = async systemId => {
  // Component handles this internally
};

const handleGradingSystemSuccess = () => {
  // Component handles this internally
};

// Lifecycle - Each tab will load its own data on mount
onMounted(() => {
  // No need to load initial data - each tab handles its own loading
});
</script>
