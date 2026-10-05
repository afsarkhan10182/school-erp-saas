<template>
  <div class="container mx-auto py-8 max-w-6xl">
    <!-- Header -->
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Module Management</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          {{ school?.name || 'School' }} — toggle features on/off for this school (must be included
          in the subscription plan first)
        </p>
        <div class="mt-2 flex items-center gap-4 text-sm">
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
          >
            {{ school?.subscription_plan || 'No Plan' }}
          </span>
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          >
            {{ school?.status || 'Unknown' }}
          </span>
          <span class="text-gray-500 dark:text-gray-400">
            {{ enabledCount }} of {{ totalModules }} modules active
          </span>
        </div>
      </div>
      <div class="flex gap-3">
        <button @click="refreshData" class="btn-secondary" :disabled="loading">🔄 Refresh</button>
        <NuxtLink :to="`/saas/schools/${$route.params.id}/edit`" class="btn-secondary">
          Edit School
        </NuxtLink>
        <NuxtLink to="/saas" class="btn-secondary"> Back to List </NuxtLink>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600 dark:text-gray-400">Loading school modules...</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6"
    >
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
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
        <div
          class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
        ></div>
        <p class="mt-2 text-gray-600 dark:text-gray-400">Loading modules...</p>
      </div>

      <!-- Modules Content -->
      <div v-else>
        <!-- Summary at Top -->
        <div class="mb-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                {{ enabledCount }}
              </div>
              <div class="text-sm text-green-700 dark:text-green-300">Active Modules</div>
            </div>
            <div class="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div class="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {{ disabledCount }}
              </div>
              <div class="text-sm text-gray-700 dark:text-gray-300">Inactive Modules</div>
            </div>
            <div class="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <div class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {{ totalModules }}
              </div>
              <div class="text-sm text-indigo-700 dark:text-indigo-300">Total Available</div>
            </div>
          </div>
        </div>

        <!-- Module Management -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div class="mb-6">
            <h2 class="text-lg font-medium text-gray-900 dark:text-white">Module Management</h2>
          </div>

          <!-- Active Modules -->
          <div v-if="enabledCount > 0" class="mb-6">
            <h3
              class="text-sm font-medium text-green-700 dark:text-green-400 mb-4 flex items-center"
            >
              <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Active Modules ({{ enabledCount }})
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                v-for="module in modules.filter(m => m.enabled)"
                :key="module.code"
                class="flex items-center p-4 rounded-lg transition-colors"
                :class="{
                  'border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30':
                    !module.is_core,
                  'border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30':
                    module.is_core
                }"
              >
                <input
                  type="checkbox"
                  :id="module.code"
                  v-model="module.enabled"
                  @change="requestToggle(module.code, module.enabled)"
                  :disabled="saving || module.is_core"
                  class="mr-3 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  :class="{ 'opacity-50 cursor-not-allowed': module.is_core }"
                />
                <label :for="module.code" class="flex-1 cursor-pointer">
                  <div class="flex items-center">
                    <span class="text-lg mr-3">{{ module.icon || '📦' }}</span>
                    <div>
                      <div class="font-medium text-gray-900 dark:text-white flex items-center">
                        {{ module.name }}
                        <span
                          v-if="module.is_core"
                          class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                        >
                          🔒 Core (Cannot Disable)
                        </span>
                      </div>
                      <div class="text-sm text-gray-600 dark:text-gray-400">
                        {{ module.description }}
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- Inactive Modules -->
          <div v-if="disabledCount > 0">
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 flex items-center">
              <span class="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
              Inactive Modules ({{ disabledCount }})
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                v-for="module in modules.filter(m => !m.enabled)"
                :key="module.code"
                class="flex items-center p-4 rounded-lg transition-colors"
                :class="{
                  'border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700':
                    !module.is_core,
                  'border border-orange-200 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30':
                    module.is_core
                }"
              >
                <input
                  type="checkbox"
                  :id="module.code"
                  v-model="module.enabled"
                  @change="requestToggle(module.code, module.enabled)"
                  :disabled="saving || module.is_core"
                  class="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  :class="{ 'opacity-50 cursor-not-allowed': module.is_core }"
                />
                <label :for="module.code" class="flex-1 cursor-pointer">
                  <div class="flex items-center">
                    <span class="text-lg mr-3" :class="{ 'opacity-60': !module.is_core }">{{
                      module.icon || '📦'
                    }}</span>
                    <div>
                      <div
                        class="font-medium flex items-center"
                        :class="
                          module.is_core
                            ? 'text-orange-800 dark:text-orange-200'
                            : 'text-gray-700 dark:text-gray-300'
                        "
                      >
                        {{ module.name }}
                        <span
                          v-if="module.is_core"
                          class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                        >
                          ⚠️ Core (Should be Active)
                        </span>
                      </div>
                      <div
                        class="text-sm"
                        :class="
                          module.is_core
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-gray-500 dark:text-gray-500'
                        "
                      >
                        {{ module.description }}
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div
      v-if="showToast"
      :class="toastClasses"
      class="fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm"
    >
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <svg
            v-if="toastType === 'success'"
            class="h-5 w-5 text-green-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
          <svg v-else class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium">{{ toastMessage }}</p>
        </div>
        <div class="ml-auto pl-3">
          <button @click="hideToast" class="inline-flex text-gray-400 hover:text-gray-600">
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
  <ConfirmDialog
    :show="Boolean(pendingToggle)"
    title="Disable the last module?"
    message="This will leave only core features available for the school. Continue?"
    confirm-label="Disable module"
    @close="pendingToggle = null"
    @confirm="confirmToggle"
  />
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '~/stores/auth';
import { useToast } from '~/composables/useToast';
import { useModuleAccess } from '~/composables/useModuleAccess';
import { Schools, Saas } from '~/api';
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue';

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
const pendingToggle = ref(null);

// Toast notification state
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

// Computed

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

    // Try to load from sessionStorage first for better performance
    if (import.meta.client) {
      const cachedSchool = sessionStorage.getItem(`school-${schoolId}`);
      const cachedModules = sessionStorage.getItem(`modules-${schoolId}`);

      if (cachedSchool && cachedModules) {
        try {
          school.value = JSON.parse(cachedSchool);
          modules.value = JSON.parse(cachedModules);
          console.log('Loaded from cache:', { school: school.value, modules: modules.value });
        } catch (cacheError) {
          console.warn('Cache parse error:', cacheError);
        }
      }
    }

    // Load school details
    const schoolResponse = await Schools.getById(schoolId);
    if (schoolResponse.success) {
      school.value = schoolResponse.data.school;

      // Save to sessionStorage for persistence
      if (import.meta.client) {
        sessionStorage.setItem(`school-${schoolId}`, JSON.stringify(school.value));
      }
    }

    // Load school modules
    const modulesResponse = await Schools.getModules(schoolId);
    console.log('Modules API response:', modulesResponse);

    if (modulesResponse.success) {
      modules.value = modulesResponse.data.modules.map(module => {
        // Ensure enabled property is properly set
        const isEnabled = module.enabled !== false && module.enabled !== 'false';
        console.log(`Module ${module.code}:`, {
          originalEnabled: module.enabled,
          processedEnabled: isEnabled,
          isInPlan: !module.upgradeRequired,
          canEnable: module.canEnable,
          fullModule: module
        });
        return {
          ...module,
          enabled: isEnabled
          // Use database data directly - no hardcoded icons/descriptions
        };
      });

      // Log specific modules for debugging
      const examModule = modules.value.find(m => m.code === 'exams');
      const attendanceModule = modules.value.find(m => m.code === 'attendance');
      console.log('Exam module:', examModule);
      console.log('Attendance module:', attendanceModule);

      // Save to sessionStorage for persistence
      if (import.meta.client) {
        sessionStorage.setItem(`modules-${schoolId}`, JSON.stringify(modules.value));
      }
    }

    // Load plan details if available
    if (school.value?.subscription_plan) {
      try {
        const plansResponse = await Saas.getPlans();
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

const requestToggle = (moduleCode, enabled) => {
  if (!enabled && modules.value.filter(m => m.enabled && !m.is_core && m.code !== moduleCode).length === 0) {
    pendingToggle.value = { moduleCode, enabled };
    return;
  }
  toggleModule(moduleCode, enabled);
};

const confirmToggle = () => {
  const toggle = pendingToggle.value;
  pendingToggle.value = null;
  if (toggle) toggleModule(toggle.moduleCode, toggle.enabled);
};

const toggleModule = async (moduleCode, enabled) => {
  if (saving.value) return;

  const module = modules.value.find(m => m.code === moduleCode);
  if (!module || module.is_core) return;

  console.log('Toggle module:', {
    moduleCode,
    enabled,
    module,
    schoolId: route.params.id,
    isExamModule: moduleCode === 'exams',
    isAttendanceModule: moduleCode === 'attendance'
  });

  saving.value = true;

  try {
    console.log('Calling toggleSchoolModule API:', {
      schoolId: route.params.id,
      moduleCode,
      enabled
    });

    const response = await Saas.toggleSchoolModule(route.params.id, moduleCode, enabled);

    console.log('Toggle API response:', response);

    if (response.success) {
      // Update the module state
      module.enabled = enabled;

      // Update sessionStorage immediately
      if (import.meta.client) {
        sessionStorage.setItem(`modules-${route.params.id}`, JSON.stringify(modules.value));
      }

      // Force reactivity update
      modules.value = [...modules.value];

      // Clear module cache and reload modules to refresh sidebar immediately
      const { clearModuleCache, loadUserModules } = useModuleAccess();
      clearModuleCache();
      await loadUserModules(true); // Force reload modules

      // Set refresh flags for middleware optimization
      if (import.meta.client) {
        const timestamp = Date.now().toString();
        localStorage.setItem('modules-refresh', timestamp);
        sessionStorage.setItem('modules-refresh', 'true');
        // Also set a global flag for immediate detection
        sessionStorage.setItem('last-module-change', timestamp);
      }

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

// Refresh data manually
const refreshData = async () => {
  modules.value = [];
  school.value = null;
  await loadSchoolModules();
};

// Use database-driven module data instead of hardcoded helper functions
// All module information (icons, descriptions) should come from the API response

// Watch for route changes to handle navigation
watch(
  () => route.params.id,
  (newSchoolId, oldSchoolId) => {
    if (newSchoolId !== oldSchoolId) {
      // Different school, reload data
      modules.value = [];
      school.value = null;
      loadSchoolModules();
    }
  },
  { immediate: false }
);

// Load data on mount only if not already loaded
onMounted(async () => {
  const schoolId = route.params.id;

  // Try to load from sessionStorage first
  if (import.meta.client) {
    const cachedModules = sessionStorage.getItem(`modules-${schoolId}`);
    const cachedSchool = sessionStorage.getItem(`school-${schoolId}`);

    if (cachedModules && cachedSchool) {
      try {
        modules.value = JSON.parse(cachedModules);
        school.value = JSON.parse(cachedSchool);
        return; // Use cached data
      } catch (e) {
        console.warn('Failed to parse cached data:', e);
      }
    }
  }

  // Only load if modules are empty (first visit) or if we need to refresh
  if (modules.value.length === 0 || !school.value) {
    await loadSchoolModules();
  }
});
</script>

<style scoped>
.btn-primary {
  @apply bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500;
}
</style>
