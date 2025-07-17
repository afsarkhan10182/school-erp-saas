<template>
  <div class="min-h-screen bg-gray-900">
    <div class="container mx-auto py-8 px-4">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">Branch Settings</h1>
        <p class="text-gray-400">Manage branch configurations and module settings</p>
      </div>

      <!-- Branch Selector Section -->
      <div class="mb-8">
        <branch-selector
          v-model="selectedBranch"
          :branches="branches"
          :loading="loading"
          :error="error"
          @branch-changed="loadBranchSettings"
        />
      </div>

      <!-- Settings Content -->
      <div v-if="selectedBranch" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- General Settings Card -->
        <div class="card">
          <div class="flex items-center mb-6">
            <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 class="text-xl font-semibold text-white">General Settings</h2>
          </div>
          
          <form @submit.prevent="saveBranchSettings" class="space-y-6">
            <div>
              <label class="block text-gray-300 text-sm font-medium mb-2" for="branchName">
                Branch Name
              </label>
              <input
                id="branchName"
                v-model="settings.branchName"
                class="input-field"
                type="text"
                placeholder="Enter branch name"
                required
              />
            </div>
            
            <div>
              <label class="block text-gray-300 text-sm font-medium mb-2" for="branchCode">
                Branch Code
              </label>
              <input
                id="branchCode"
                v-model="settings.branchCode"
                class="input-field"
                type="text"
                placeholder="Enter branch code"
                required
              />
            </div>

            <div>
              <label class="block text-gray-300 text-sm font-medium mb-2" for="branchAddress">
                Address
              </label>
              <textarea
                id="branchAddress"
                v-model="settings.address"
                class="input-field"
                rows="3"
                placeholder="Enter branch address"
              ></textarea>
            </div>

            <div>
              <label class="block text-gray-300 text-sm font-medium mb-2" for="branchPhone">
                Phone Number
              </label>
              <input
                id="branchPhone"
                v-model="settings.phone"
                class="input-field"
                type="tel"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label class="block text-gray-300 text-sm font-medium mb-2" for="branchEmail">
                Email
              </label>
              <input
                id="branchEmail"
                v-model="settings.email"
                class="input-field"
                type="email"
                placeholder="Enter email address"
              />
            </div>

            <div class="flex gap-4">
              <button
                type="submit"
                :disabled="saving"
                class="btn-primary flex-1"
              >
                <span v-if="saving" class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
                <span v-else>Save Settings</span>
              </button>
              
              <button
                type="button"
                @click="resetSettings"
                class="btn-secondary"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        <!-- Module Settings Card -->
        <div class="card">
          <div class="flex items-center mb-6">
            <div class="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 class="text-xl font-semibold text-white">Module Settings</h2>
          </div>
          
          <div class="space-y-4">
            <div v-for="module in modules" :key="module.id" class="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div class="flex items-center">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center mr-3" :class="module.enabled ? 'bg-green-500' : 'bg-gray-600'">
                  <component :is="module.icon" class="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 class="text-white font-medium">{{ module.name }}</h3>
                  <p class="text-gray-400 text-sm">{{ module.description }}</p>
                </div>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  :id="module.id"
                  v-model="module.enabled"
                  type="checkbox"
                  class="sr-only peer"
                />
                <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div class="mt-6 pt-6 border-t border-gray-700">
            <button
              @click="saveModuleSettings"
              :disabled="savingModules"
              class="btn-primary w-full"
            >
              <span v-if="savingModules" class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
              <span v-else>Save Module Settings</span>
            </button>
          </div>
        </div>
      </div>

      <!-- No Branch Selected State -->
      <div v-else-if="!loading" class="text-center py-12">
        <div class="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-white mb-2">No Branch Selected</h3>
        <p class="text-gray-400">Please select a branch from the dropdown above to manage its settings.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { apiClient } from '~/utils/api';
import { useToast } from '~/composables/useToast';
import BranchSelector from '~/components/BranchSelector.vue';

// Icons for modules
const FeeIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>`
};

const AttendanceIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
};

const ExamIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>`
};

const ReportIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>`
};

const StudentIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>`
};

const LibraryIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>`
};

// Reactive state
const branches = ref([]);
const selectedBranch = ref(null);
const loading = ref(false);
const error = ref('');
const saving = ref(false);
const savingModules = ref(false);

const settings = reactive({
  branchName: '',
  branchCode: '',
  address: '',
  phone: '',
  email: ''
});

const modules = ref([
  { 
    id: 'fees', 
    name: 'Fees Management', 
    description: 'Manage student fees, invoices, and payments',
    enabled: true,
    icon: FeeIcon
  },
  { 
    id: 'attendance', 
    name: 'Attendance Tracking', 
    description: 'Track student and staff attendance',
    enabled: false,
    icon: AttendanceIcon
  },
  { 
    id: 'exams', 
    name: 'Exam Management', 
    description: 'Create and manage exams, results, and reports',
    enabled: false,
    icon: ExamIcon
  },
  { 
    id: 'reports', 
    name: 'Reports & Analytics', 
    description: 'Generate comprehensive reports and analytics',
    enabled: true,
    icon: ReportIcon
  },
  { 
    id: 'students', 
    name: 'Student Management', 
    description: 'Manage student profiles and information',
    enabled: true,
    icon: StudentIcon
  },
  { 
    id: 'library', 
    name: 'Library Management', 
    description: 'Manage books, borrowing, and library resources',
    enabled: false,
    icon: LibraryIcon
  }
]);

const { showToast } = useToast();

// Methods
const loadBranchSettings = async (branch) => {
  if (!branch) return;
  
  loading.value = true;
  error.value = '';
  
  try {
    const response = await apiClient.branches.getById(branch.id);
    if (response.success) {
      const branchData = response.data;
      settings.branchName = branchData.name || '';
      settings.branchCode = branchData.code || '';
      settings.address = branchData.address || '';
      settings.phone = branchData.phone || '';
      settings.email = branchData.email || '';
      
      // Load module settings if available
      if (branchData.moduleSettings) {
        modules.value.forEach(module => {
          if (branchData.moduleSettings[module.id] !== undefined) {
            module.enabled = branchData.moduleSettings[module.id];
          }
        });
      }
    }
  } catch (err) {
    console.error('Error loading branch settings:', err);
    error.value = 'Failed to load branch settings';
    showToast('Error loading branch settings', 'error');
  } finally {
    loading.value = false;
  }
};

const saveBranchSettings = async () => {
  if (!selectedBranch.value) return;
  
  saving.value = true;
  
  try {
    const updateData = {
      name: settings.branchName,
      code: settings.branchCode,
      address: settings.address,
      phone: settings.phone,
      email: settings.email
    };
    
    await apiClient.branches.update(selectedBranch.value, updateData);
    showToast('Branch settings saved successfully', 'success');
  } catch (err) {
    console.error('Error saving branch settings:', err);
    showToast('Failed to save branch settings', 'error');
  } finally {
    saving.value = false;
  }
};

const saveModuleSettings = async () => {
  if (!selectedBranch.value) return;
  
  savingModules.value = true;
  
  try {
    const moduleSettings = {};
    modules.value.forEach(module => {
      moduleSettings[module.id] = module.enabled;
    });
    
    await apiClient.branches.update(selectedBranch.value, {
      moduleSettings
    });
    
    showToast('Module settings saved successfully', 'success');
  } catch (err) {
    console.error('Error saving module settings:', err);
    showToast('Failed to save module settings', 'error');
  } finally {
    savingModules.value = false;
  }
};

const resetSettings = () => {
  if (selectedBranch.value) {
    loadBranchSettings({ id: selectedBranch.value });
  }
};

// Load branches on mount
onMounted(async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await apiClient.branches.getAll();
    if (response.success) {
      branches.value = response.data?.items || response.data || [];
      
      // Auto-select first branch if available
      if (branches.value.length > 0 && !selectedBranch.value) {
        selectedBranch.value = branches.value[0].id;
        await loadBranchSettings(branches.value[0]);
      }
    }
  } catch (err) {
    console.error('Error fetching branches:', err);
    error.value = 'Failed to fetch branches';
    showToast('Error loading branches', 'error');
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.container {
  max-width: 1200px;
}

/* Custom checkbox styling */
input[type="checkbox"]:checked + div {
  background-color: #3b82f6;
}

/* Smooth transitions */
.card {
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}
</style>
