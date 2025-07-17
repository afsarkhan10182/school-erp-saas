<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header Section -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="container mx-auto px-4 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Module Settings</h1>
            <p class="text-gray-600 dark:text-gray-400 mt-2">
              Configure and manage school management modules and role permissions
            </p>
          </div>
          <div class="flex items-center space-x-3">
            <button
              @click="resetToDefaults"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Reset to Defaults
            </button>
            <button
              @click="saveModuleSettings"
              :disabled="isSaving"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span v-if="isSaving" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
              <span v-else>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <!-- Module Cards Section -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Available Modules</h2>
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ enabledModulesCount }} of {{ modules.length }} modules enabled
            </span>
            <div class="flex items-center space-x-2">
              <button
                @click="enableAllModules"
                class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Enable All
              </button>
              <span class="text-gray-400">|</span>
              <button
                @click="disableAllModules"
                class="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Disable All
              </button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="module in modules"
            :key="module.id"
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden"
          >
            <!-- Module Header -->
            <div class="p-6">
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <component :is="getModuleIcon(module.id)" class="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ module.name }}</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">{{ module.description }}</p>
                  </div>
                </div>
                <toggle-switch
                  :value="module.enabled"
                  @toggle="toggleModule(module.id, $event)"
                />
              </div>

              <!-- Module Status -->
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <div 
                    class="w-2 h-2 rounded-full"
                    :class="module.enabled ? 'bg-green-500' : 'bg-gray-400'"
                  ></div>
                  <span 
                    class="text-sm font-medium"
                    :class="module.enabled ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'"
                  >
                    {{ module.enabled ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                
                <div class="flex items-center space-x-2">
                  <button
                    v-if="module.enabled"
                    @click="configureModule(module.id)"
                    class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    Configure
                  </button>
                  <button
                    v-if="module.enabled"
                    @click="showModuleInfo(module)"
                    class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Module Features (if enabled) -->
            <div v-if="module.enabled" class="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">Features</span>
                <span class="text-xs text-gray-500 dark:text-gray-400">{{ getModuleFeatures(module.id).length }} available</span>
              </div>
              <div class="mt-2 flex flex-wrap gap-1">
                <span
                  v-for="feature in getModuleFeatures(module.id).slice(0, 3)"
                  :key="feature"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                >
                  {{ feature }}
                </span>
                <span
                  v-if="getModuleFeatures(module.id).length > 3"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                >
                  +{{ getModuleFeatures(module.id).length - 3 }} more
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Role Permissions Section -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Role Permissions</h2>
              <p class="text-gray-600 dark:text-gray-400 mt-1">
                Configure what each role can access and manage
              </p>
            </div>
            <button
              @click="expandAllRoles"
              class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {{ allRolesExpanded ? 'Collapse All' : 'Expand All' }}
            </button>
          </div>
        </div>

        <div class="p-6">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div
              v-for="role in roles"
              :key="role.id"
              class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-2">
                  <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                  <h3 class="font-semibold text-gray-900 dark:text-white">{{ role.name }}</h3>
                </div>
                <button
                  @click="toggleRoleExpanded(role.id)"
                  class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg 
                    class="w-5 h-5 transition-transform"
                    :class="{ 'rotate-180': expandedRoles.includes(role.id) }"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
              </div>

              <div 
                class="space-y-3 transition-all duration-200 overflow-hidden"
                :class="expandedRoles.includes(role.id) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'"
              >
                <div
                  v-for="permission in role.permissions"
                  :key="permission.id"
                  class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div class="flex items-center space-x-3">
                    <input
                      :id="`${role.id}-${permission.id}`"
                      v-model="permission.enabled"
                      type="checkbox"
                      class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label 
                      :for="`${role.id}-${permission.id}`" 
                      class="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      {{ permission.name }}
                    </label>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span 
                      class="text-xs px-2 py-1 rounded-full"
                      :class="permission.enabled ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-400'"
                    >
                      {{ permission.enabled ? 'Allowed' : 'Denied' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Permission Summary -->
              <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">Permissions</span>
                  <span class="font-medium text-gray-900 dark:text-white">
                    {{ role.permissions.filter(p => p.enabled).length }}/{{ role.permissions.length }}
                  </span>
                </div>
                <div class="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    :style="{ width: `${(role.permissions.filter(p => p.enabled).length / role.permissions.length) * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Module Info Modal -->
    <div v-if="selectedModule" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ selectedModule.name }}</h3>
            <button
              @click="selectedModule = null"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <p class="text-gray-600 dark:text-gray-400 mb-4">{{ selectedModule.description }}</p>
          <div class="space-y-3">
            <div>
              <h4 class="font-medium text-gray-900 dark:text-white mb-2">Features</h4>
              <ul class="space-y-1">
                <li
                  v-for="feature in getModuleFeatures(selectedModule.id)"
                  :key="feature"
                  class="flex items-center text-sm text-gray-600 dark:text-gray-400"
                >
                  <svg class="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  {{ feature }}
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-xl">
          <button
            @click="selectedModule = null"
            class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useModulesStore } from '~/stores/modules';
import { useToast } from '~/composables/useToast';
import ToggleSwitch from '~/components/ToggleSwitch.vue';
import { 
  DollarSign, 
  Calendar, 
  BookOpen, 
  Library, 
  Truck, 
  Home,
  Users,
  UserCheck,
  BarChart3,
  Settings,
  Clock,
  MessageSquare,
  Package
} from 'lucide-vue-next';

const modulesStore = useModulesStore();
const { showSuccess, showError } = useToast();

const modules = ref(modulesStore.getModules());
const roles = ref(modulesStore.getRoles());
const isSaving = ref(false);
const selectedModule = ref(null);
const expandedRoles = ref([]);
const allRolesExpanded = ref(false);

// Computed properties
const enabledModulesCount = computed(() => modules.value.filter(m => m.enabled).length);

// Module icons mapping
const getModuleIcon = (moduleId) => {
  const icons = {
    fees: DollarSign,
    attendance: Calendar,
    exams: BookOpen,
    library: Library,
    transport: Truck,
    hostel: Home,
    timetable: Clock,
    communication: MessageSquare,
    inventory: Package
  };
  return icons[moduleId] || Settings;
};

// Module features mapping
const getModuleFeatures = (moduleId) => {
  const features = {
    fees: ['Fee Collection', 'Invoice Generation', 'Payment Tracking', 'Financial Reports', 'Late Fee Management'],
    attendance: ['Student Attendance', 'Staff Attendance', 'Attendance Reports', 'Absence Tracking', 'Attendance Alerts'],
    exams: ['Exam Scheduling', 'Grade Management', 'Performance Analytics', 'Report Cards', 'Academic Reports'],
    library: ['Book Management', 'Lending System', 'Return Tracking', 'Library Reports', 'Book Inventory'],
    transport: ['Route Management', 'Vehicle Tracking', 'Driver Management', 'Transport Reports', 'Route Optimization'],
    hostel: ['Room Management', 'Student Accommodation', 'Hostel Reports', 'Facility Management', 'Visitor Tracking'],
    timetable: ['Class Scheduling', 'Teacher Assignments', 'Room Allocation', 'Conflict Detection', 'Schedule Optimization'],
    communication: ['Internal Messaging', 'Announcements', 'Email Notifications', 'SMS Alerts', 'Communication History'],
    inventory: ['Supply Tracking', 'Equipment Management', 'Purchase Orders', 'Stock Alerts', 'Inventory Reports']
  };
  return features[moduleId] || [];
};

// Methods
const toggleModule = (moduleId, enabled) => {
  modulesStore.toggleModule(moduleId, enabled);
};

const configureModule = (moduleId) => {
  navigateTo(`/settings/modules/${moduleId}`);
};

const showModuleInfo = (module) => {
  selectedModule.value = module;
};

const enableAllModules = () => {
  modules.value.forEach(module => {
    module.enabled = true;
  });
};

const disableAllModules = () => {
  modules.value.forEach(module => {
    module.enabled = false;
  });
};

const toggleRoleExpanded = (roleId) => {
  const index = expandedRoles.value.indexOf(roleId);
  if (index > -1) {
    expandedRoles.value.splice(index, 1);
  } else {
    expandedRoles.value.push(roleId);
  }
};

const expandAllRoles = () => {
  if (allRolesExpanded.value) {
    expandedRoles.value = [];
    allRolesExpanded.value = false;
  } else {
    expandedRoles.value = roles.value.map(role => role.id);
    allRolesExpanded.value = true;
  }
};

const resetToDefaults = () => {
  if (confirm('Are you sure you want to reset all module settings to defaults? This action cannot be undone.')) {
    modulesStore.loadModuleSettings();
    showSuccess('Module settings reset to defaults');
  }
};

const saveModuleSettings = async () => {
  isSaving.value = true;
  try {
    await modulesStore.saveModuleSettings();
    showSuccess('Module settings saved successfully!');
  } catch (error) {
    console.error('Error saving module settings:', error);
    showError('Failed to save module settings. Please try again.');
  } finally {
    isSaving.value = false;
  }
};

onMounted(async () => {
  await modulesStore.fetchModules();
  // Expand first role by default
  if (roles.value.length > 0) {
    expandedRoles.value = [roles.value[0].id];
  }
});
</script>

<style scoped>
.container {
  max-width: 1200px;
}

/* Smooth transitions */
.transition-all {
  transition: all 0.2s ease-in-out;
}

/* Custom scrollbar for expanded content */
.overflow-hidden::-webkit-scrollbar {
  width: 4px;
}

.overflow-hidden::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-hidden::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 2px;
}

.overflow-hidden::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.5);
}
</style>

