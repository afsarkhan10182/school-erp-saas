<template>
  <div class="min-h-screen">
    <div class="container mx-auto py-8 px-4">
      <h1 class="text-2xl font-bold mb-4">Branch Settings</h1>
      <div class="mb-6">
        <branch-selector
          v-model="selectedBranch"
          :branches="branches"
          @branch-changed="loadBranchSettings"
        />
      </div>
      <div v-if="selectedBranch" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-lg font-semibold mb-4">General Settings</h2>
          <form @submit.prevent="saveBranchSettings">
            <div class="mb-4">
              <label class="block text-gray-700 text-sm mb-2" for="branchName">Branch Name</label>
              <input
                id="branchName"
                v-model="settings.branchName"
                class="border p-2 rounded w-full"
                type="text"
                required
              />
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 text-sm mb-2" for="branchCode">Branch Code</label>
              <input
                id="branchCode"
                v-model="settings.branchCode"
                class="border p-2 rounded w-full"
                type="text"
                required
              />
            </div>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save Settings
            </button>
          </form>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-lg font-semibold mb-4">Module Settings</h2>
          <div class="space-y-4">
            <div v-for="module in modules" :key="module.id" class="flex items-center">
              <input
                :id="module.id"
                v-model="module.enabled"
                type="checkbox"
                class="mr-3"
              />
              <label :for="module.id" class="text-gray-700">{{ module.name }}</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { apiClient } from '~/utils/api';
import BranchSelector from '~/components/BranchSelector.vue';

const branches = ref([]);
const selectedBranch = ref(null);

const settings = reactive({
  branchName: '',
  branchCode: '',
});

const modules = ref([
  { id: 'fees', name: 'Fees Management', enabled: true },
  { id: 'attendance', name: 'Attendance Tracking', enabled: false },
  { id: 'exams', name: 'Exam Management', enabled: false },
  { id: 'reports', name: 'Reports and Analytics', enabled: true },
]);

const loadBranchSettings = async () => {
  if (!selectedBranch.value) return;
  
  try {
    // Load branch-specific settings
    const response = await apiClient.branches.getById(selectedBranch.value);
    settings.branchName = response.data.name;
    settings.branchCode = response.data.code;
  } catch (error) {
    console.error('Error loading branch settings:', error);
  }
};

const saveBranchSettings = async () => {
  try {
    await apiClient.branches.update(selectedBranch.value, {
      name: settings.branchName,
      code: settings.branchCode
    });
    alert('Settings saved successfully!');
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

onMounted(async () => {
  try {
    const response = await apiClient.branches.getAll();
    branches.value = response.data;
  } catch (error) {
    console.error('Error fetching branches:', error);
  }
});
</script>

<style scoped>
.container {
  max-width: 1024px;
}
</style>
