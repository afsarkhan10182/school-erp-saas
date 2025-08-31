<template>
  <div class="container mx-auto py-8 max-w-6xl">
    <!-- Header -->
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">School Module Management</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          Manage modules for {{ school?.name || 'School' }} ({{ school?.code }})
        </p>
        <div class="mt-2 flex items-center gap-4 text-sm">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {{ school?.subscription_plan || 'No Plan' }}
          </span>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            {{ school?.status || 'Unknown' }}
          </span>
        </div>
      </div>
      <div class="flex gap-3">
        <NuxtLink :to="`/saas/schools/${$route.params.id}/edit`" class="btn-secondary">
          Edit School
        </NuxtLink>
        <NuxtLink to="/saas" class="btn-secondary">
          Back to List
        </NuxtLink>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600 dark:text-gray-400">Loading school modules...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
          <p class="mt-1 text-sm text-red-700 dark:text-red-300">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Module Management -->
    <div v-else class="space-y-6">
      <!-- Loading State for Modules -->
      <div v-if="modules.length === 0" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="mt-2 text-gray-600 dark:text-gray-400">Loading modules...</p>
      </div>
      
      <!-- Modules Content -->
      <div v-else>
      <!-- Plan Information -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Subscription Plan</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span class="text-gray-500 dark:text-gray-400">Plan:</span>
            <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ school?.subscription_plan || 'No Plan' }}</span>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">Status:</span>
            <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ school?.status || 'Unknown' }}</span>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">Billing Cycle:</span>
            <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ planDetails?.billing_cycle || 'Unknown' }}</span>
          </div>
        </div>
      </div>

      <!-- Module Categories -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">Module Management</h2>
          <div class="flex gap-2">
            <button 
              @click="enableAllModules" 
              class="btn-secondary text-sm"
              :disabled="saving"
            >
              Enable All
            </button>
            <button 
              @click="disableAllModules" 
              class="btn-secondary text-sm"
              :disabled="saving"
            >
              Disable All
            </button>
          </div>
        </div>

        <!-- Module Categories -->
        <div v-for="category in moduleCategories" :key="category.name" class="mb-6">
          <h3 class="text-md font-medium text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
            {{ category.name }}
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              v-for="module in category.modules"
              :key="module.code"
              class="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              :class="{
                'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800': module.enabled,
                'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800': !module.enabled
              }"
            >
              <input
                type="checkbox"
                :id="module.code"
                v-model="module.enabled"
                @change="toggleModule(module.code, module.enabled)"
                :disabled="saving || module.is_core"
                class="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label :for="module.code" class="flex-1 cursor-pointer">
                <div class="flex items-center">
                  <span class="text-lg mr-2">{{ module.icon || '📦' }}</span>
                  <div>
                    <div class="font-medium text-gray-900 dark:text-white">{{ module.name }}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">{{ module.description }}</div>
                  </div>
                </div>
              </label>
              <div v-if="module.is_core" class="ml-2">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Core
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div class="flex justify-between items-center text-sm">
            <div class="flex gap-4">
              <span class="text-gray-500 dark:text-gray-400">
                Enabled: <span class="font-medium text-green-600 dark:text-green-400">{{ enabledCount }}</span>
              </span>
              <span class="text-gray-500 dark:text-gray-400">
                Disabled: <span class="font-medium text-red-600 dark:text-red-400">{{ disabledCount }}</span>
              </span>
              <span class="text-gray-500 dark:text-gray-400">
                Total: <span class="font-medium text-gray-900 dark:text-white">{{ totalModules }}</span>
              </span>
            </div>
          </div>
        </div>
        
        <!-- Information Panel -->
        <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">
                Module Management Information
              </h3>
              <div class="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <ul class="list-disc list-inside space-y-1">
                  <li><strong>Core modules</strong> (students, fees, settings) cannot be disabled</li>
                  <li><strong>Subscription plan</strong> remains active regardless of module status</li>
                  <li><strong>Disabled modules</strong> are hidden from the school's interface</li>
                  <li><strong>Re-enabling</strong> modules restores access immediately</li>
                  <li><strong>Billing</strong> is based on the subscription plan, not enabled modules</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div v-if="showToast" :class="toastClasses" class="fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <svg v-if="toastType === 'success'" class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <svg v-else class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium">{{ toastMessage }}</p>
        </div>
        <div class="ml-auto pl-3">
          <button @click="hideToast" class="inline-flex text-gray-400 hover:text-gray-600">
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '~/stores/auth';
import { useToast } from '~/composables/useToast';
import { apiClient } from '~/utils/api';

const authStore = useAuthStore();
const { showError, showSuccess } = useToast();

// Access control - only Super Admin can access school module management
const user = authStore.user;
if (user?.role !== 'super_admin') {
  showError('Access denied. Only Super Admin can manage school modules.');
  await navigateTo('/dashboard');
}

const route = useRoute();

// State
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const school = ref(null);
const planDetails = ref(null);
const modules = ref([]);

// Toast notification state
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

// Computed
const moduleCategories = computed(() => {
  const categories = {
    academic: { name: 'Academic Management', modules: [] },
    administrative: { name: 'Administrative', modules: [] },
    financial: { name: 'Financial Management', modules: [] },
    reporting: { name: 'Reporting & Analytics', modules: [] }
  };

  // Map modules to categories based on their code/name
  modules.value.forEach(module => {
    const moduleCode = module.code?.toLowerCase() || module.name?.toLowerCase() || '';
    
    if (moduleCode.includes('student') || moduleCode.includes('attendance') || moduleCode.includes('exam') || moduleCode.includes('library')) {
      categories.academic.modules.push(module);
    } else if (moduleCode.includes('transport') || moduleCode.includes('hr') || moduleCode.includes('system') || moduleCode.includes('settings')) {
      categories.administrative.modules.push(module);
    } else if (moduleCode.includes('fee') || moduleCode.includes('payment') || moduleCode.includes('financial')) {
      categories.financial.modules.push(module);
    } else if (moduleCode.includes('report') || moduleCode.includes('analytics') || moduleCode.includes('advanced')) {
      categories.reporting.modules.push(module);
    } else {
      // Default to administrative for unknown modules
      categories.administrative.modules.push(module);
    }
  });

  return Object.values(categories).filter(cat => cat.modules.length > 0);
});

const enabledCount = computed(() => modules.value.filter(m => m.enabled).length);
const disabledCount = computed(() => modules.value.filter(m => !m.enabled).length);
const totalModules = computed(() => modules.value.length);

const toastClasses = computed(() => {
  return toastType.value === 'success' 
    ? 'bg-green-50 border border-green-200 text-green-800' 
    : 'bg-red-50 border border-red-200 text-red-800';
});

// Methods
const loadSchoolModules = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const schoolId = route.params.id;
    
    // Load school details
    const schoolResponse = await apiClient.schools.getById(schoolId);
    if (schoolResponse.success) {
      school.value = schoolResponse.data.school;
    }

    // Load school modules
    const modulesResponse = await apiClient.schools.getModules(schoolId);
    if (modulesResponse.success) {
      modules.value = modulesResponse.data.modules.map(module => {
        // Ensure enabled property is properly set
        const isEnabled = module.enabled !== false && module.enabled !== 'false';
        return {
          ...module,
          enabled: isEnabled,
          icon: getModuleIcon(module.code || module.name),
          description: getModuleDescription(module.code || module.name)
        };
      });
    }

    // Load plan details if available
    if (school.value?.subscription_plan) {
      try {
        const plansResponse = await apiClient.saas.getPlans();
        if (plansResponse.success && Array.isArray(plansResponse.data)) {
          planDetails.value = plansResponse.data.find(
            plan => plan.code === school.value.subscription_plan
          );
        }
      } catch (e) {
        console.warn('Could not load plan details:', e);
      }
    }

  } catch (e) {
    error.value = e?.message || 'Failed to load school modules';
    showToastNotification(error.value, 'error');
  } finally {
    loading.value = false;
  }
};

const toggleModule = async (moduleCode, enabled) => {
  if (saving.value) return;
  
  const module = modules.value.find(m => m.code === moduleCode);
  if (!module || module.is_core) return;

  // Check if this is the last enabled non-core module being disabled
  if (!enabled) {
    const enabledNonCoreModules = modules.value.filter(m => 
      m.enabled && !m.is_core && m.code !== moduleCode
    );
    
    if (enabledNonCoreModules.length === 0) {
      const confirmed = confirm(
        '⚠️ Warning: This is the last enabled module.\n\n' +
        'Disabling it will remove access to all features except core modules.\n\n' +
        'Are you sure you want to continue?'
      );
      
      if (!confirmed) return;
    }
  }

  saving.value = true;
  
  try {
    const response = await apiClient.saas.toggleSchoolModule(
      route.params.id, 
      moduleCode, 
      enabled
    );
    
    if (response.success) {
      // Update the module state
      module.enabled = enabled;
      

      
      showToastNotification(
        `Module "${module.name}" ${enabled ? 'enabled' : 'disabled'} successfully`,
        'success'
      );
    } else {
      // Revert the checkbox state if the API call failed
      module.enabled = !enabled;
      throw new Error(response.message || 'Failed to toggle module');
    }
  } catch (e) {
    showToastNotification(
      `Failed to ${enabled ? 'enable' : 'disable'} module: ${e.message}`,
      'error'
    );
  } finally {
    saving.value = false;
  }
};

const enableAllModules = async () => {
  if (saving.value) return;
  
  saving.value = true;
  
  try {
    const promises = modules.value
      .filter(module => !module.enabled && !module.is_core)
      .map(module => toggleModule(module.code, true));
    
    await Promise.all(promises);
    showToastNotification('All modules enabled successfully', 'success');
  } catch (e) {
    showToastNotification('Failed to enable all modules', 'error');
  } finally {
    saving.value = false;
  }
};

const disableAllModules = async () => {
  if (saving.value) return;
  
  // Show confirmation dialog
  const confirmed = confirm(
    '⚠️ Warning: Disabling all modules will:\n\n' +
    '• Remove access to all features\n' +
    '• Keep the subscription plan active\n' +
    '• Require manual re-enabling of modules\n\n' +
    'Are you sure you want to disable all modules?'
  );
  
  if (!confirmed) return;
  
  saving.value = true;
  
  try {
    const promises = modules.value
      .filter(module => module.enabled && !module.is_core)
      .map(module => toggleModule(module.code, false));
    
    await Promise.all(promises);
    showToastNotification('All modules disabled successfully. You can re-enable them anytime.', 'success');
  } catch (e) {
    showToastNotification('Failed to disable all modules', 'error');
  } finally {
    saving.value = false;
  }
};

const showToastNotification = (message, type = 'success') => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => {
    hideToast();
  }, 5000);
};

const hideToast = () => {
  showToast.value = false;
};

// Helper functions for module icons and descriptions
const getModuleIcon = (moduleCode) => {
  const code = moduleCode.toLowerCase();
  const icons = {
    students: '👥',
    student: '👥',
    attendance: '📊',
    exam: '📝',
    examination: '📝',
    library: '📚',
    transport: '🚌',
    hr: '👤',
    system: '⚙️',
    settings: '⚙️',
    fee: '💰',
    payment: '💰',
    financial: '💰',
    report: '📈',
    analytics: '📈',
    advanced: '📈'
  };
  
  for (const [key, icon] of Object.entries(icons)) {
    if (code.includes(key)) {
      return icon;
    }
  }
  
  return '📦';
};

const getModuleDescription = (moduleCode) => {
  const code = moduleCode.toLowerCase();
  const descriptions = {
    students: 'Admit students, manage profiles, class assignments, and student records',
    student: 'Admit students, manage profiles, class assignments, and student records',
    attendance: 'Track student and staff attendance with reports and notifications',
    exam: 'Exam schedules, results, grades, and academic performance tracking',
    examination: 'Exam schedules, results, grades, and academic performance tracking',
    library: 'Book catalog, issue/return, fine management, and library reports',
    transport: 'Bus routes, vehicle management, student transportation tracking',
    hr: 'Staff management, payroll, leave management, and HR reports',
    system: 'School configuration, user management, and system preferences',
    settings: 'School configuration, user management, and system preferences',
    fee: 'Fee types, structures, invoices, payments, and collections',
    payment: 'Fee types, structures, invoices, payments, and collections',
    financial: 'Fee types, structures, invoices, payments, and collections',
    report: 'Comprehensive analytics, custom reports, and data export',
    analytics: 'Comprehensive analytics, custom reports, and data export',
    advanced: 'Comprehensive analytics, custom reports, and data export'
  };
  
  for (const [key, description] of Object.entries(descriptions)) {
    if (code.includes(key)) {
      return description;
    }
  }
  
  return 'Module description';
};

// Load data on mount
onMounted(() => {
  loadSchoolModules();
});
</script>

<style scoped>
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500;
}

.input-field {
  @apply block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white sm:text-sm;
}
</style>
