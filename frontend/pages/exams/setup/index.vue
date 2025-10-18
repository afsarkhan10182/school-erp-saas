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

      <!-- Tab Navigation (CodeIgniter Standard - 4 tabs only) -->
      <ScrollableTabs :tabs="tabs" :active-tab="activeTab" @tab-change="handleTabChange">
        <!-- Exam Terms Tab (CodeIgniter Standard) -->
        <div v-if="activeTab === 'exam-terms'" class="p-6">
          <ExamTermsTab
            ref="examTermsTabRef"
            :terms="terms"
            :loading="termsLoading"
            @create="handleTermCreate"
            @update="handleTermUpdate"
            @delete="handleTermDelete"
            @success="handleTermSuccess"
          />
        </div>

        <!-- Exam Halls Tab -->
        <div v-else-if="activeTab === 'exam-halls'" class="p-6">
          <ExamHallsTab />
        </div>

        <!-- Mark Distribution Tab (CodeIgniter Standard) -->
        <div v-else-if="activeTab === 'mark-distributions'" class="p-6">
          <MarkDistributionsTab
            ref="markDistributionsTabRef"
            :distributions="distributions"
            :loading="distributionsLoading"
            @create="handleDistributionCreate"
            @update="handleDistributionUpdate"
            @delete="handleDistributionDelete"
            @success="handleDistributionSuccess"
          />
        </div>

        <!-- Grading Systems Tab -->
        <div v-else-if="activeTab === 'grading-systems'" class="p-6">
          <GradingSystemsTab
            ref="gradingSystemsTabRef"
            :grading-systems="gradingSystems"
            :loading="gradingSystemsLoading"
            :branch-id="user?.branch_id || ''"
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
import { useGradingSystems } from '~/composables/useGradingSystems';
import { useAuth } from '~/composables/useAuth';
import { useToast } from '~/composables/useToast';
import { termApi } from '~/api/academic/terms';
import { markDistributionApi } from '~/api/academic/mark-distributions';

// Tab configuration (CodeIgniter Standard - 4 tabs only)
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
const markDistributionsTabRef = ref(null);
const gradingSystemsTabRef = ref(null);

// Composables
const { user } = useAuth();
const { showToast } = useToast();
const {
  gradingSystems,
  gradingSystemsLoading,
  loadGradingSystems,
  createGradingSystem,
  updateGradingSystem,
  deleteGradingSystem
} = useGradingSystems();

// Data
const terms = ref([]);
const termsLoading = ref(false);
const distributions = ref([]);
const distributionsLoading = ref(false);

// Methods
const handleTabChange = tabId => {
  activeTab.value = tabId;
};

// Terms methods
const loadTerms = async () => {
  try {
    termsLoading.value = true;
    const response = await termApi.getAll({
      school_id: user.value.school_id,
      branch_id: user.value.branch_id
    });
    terms.value = response.data || [];
  } catch (error) {
    showToast('Failed to load terms', 'error');
  } finally {
    termsLoading.value = false;
  }
};

const handleTermCreate = async termData => {
  try {
    await termApi.create(termData);
    showToast('Term created successfully', 'success');
    await loadTerms();
  } catch (error) {
    showToast('Failed to create term', 'error');
  }
};

const handleTermUpdate = async (id, termData) => {
  try {
    await termApi.update(id, termData);
    showToast('Term updated successfully', 'success');
    await loadTerms();
  } catch (error) {
    showToast('Failed to update term', 'error');
  }
};

const handleTermDelete = async id => {
  try {
    await termApi.delete(id);
    showToast('Term deleted successfully', 'success');
    await loadTerms();
  } catch (error) {
    showToast('Failed to delete term', 'error');
  }
};

const handleTermSuccess = () => {
  loadTerms();
};

// Mark Distribution methods
const loadDistributions = async () => {
  try {
    distributionsLoading.value = true;
    const response = await markDistributionApi.getAll({
      school_id: user.value.school_id,
      branch_id: user.value.branch_id
    });
    distributions.value = response.data || [];
  } catch (error) {
    showToast('Failed to load distributions', 'error');
  } finally {
    distributionsLoading.value = false;
  }
};

const handleDistributionCreate = async distributionData => {
  try {
    await markDistributionApi.create(distributionData);
    showToast('Distribution created successfully', 'success');
    await loadDistributions();
  } catch (error) {
    showToast('Failed to create distribution', 'error');
  }
};

const handleDistributionUpdate = async (id, distributionData) => {
  try {
    await markDistributionApi.update(id, distributionData);
    showToast('Distribution updated successfully', 'success');
    await loadDistributions();
  } catch (error) {
    showToast('Failed to update distribution', 'error');
  }
};

const handleDistributionDelete = async id => {
  try {
    await markDistributionApi.delete(id);
    showToast('Distribution deleted successfully', 'success');
    await loadDistributions();
  } catch (error) {
    showToast('Failed to delete distribution', 'error');
  }
};

const handleDistributionSuccess = () => {
  loadDistributions();
};

// Grading Systems methods
const handleGradingSystemCreate = async gradingSystemData => {
  try {
    await createGradingSystem(gradingSystemData);
    showToast('Grading system created successfully', 'success');
  } catch (error) {
    showToast('Failed to create grading system', 'error');
  }
};

const handleGradingSystemUpdate = async (id, gradingSystemData) => {
  try {
    await updateGradingSystem(id, gradingSystemData);
    showToast('Grading system updated successfully', 'success');
  } catch (error) {
    showToast('Failed to update grading system', 'error');
  }
};

const handleGradingSystemDelete = async id => {
  try {
    await deleteGradingSystem(id);
    showToast('Grading system deleted successfully', 'success');
  } catch (error) {
    showToast('Failed to delete grading system', 'error');
  }
};

const handleGradingSystemSuccess = () => {
  loadGradingSystems();
};

// Load initial data
onMounted(async () => {
  await Promise.all([loadTerms(), loadDistributions(), loadGradingSystems()]);
});
</script>
