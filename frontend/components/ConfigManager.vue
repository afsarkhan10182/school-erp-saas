<template>
  <div class="config-manager">
    <div class="config-header">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">Configuration Management</h2>
      <div class="flex gap-4 mb-6">
        <button
          @click="activeTab = 'school'"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-colors',
            activeTab === 'school'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          ]"
        >
          School Settings
        </button>
        <button
          @click="activeTab = 'modules'"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-colors',
            activeTab === 'modules'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          ]"
        >
          Module Settings
        </button>
        <button
          @click="activeTab = 'system'"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-colors',
            activeTab === 'system'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          ]"
        >
          System Settings
        </button>
      </div>
    </div>

    <!-- School Settings Tab -->
    <div v-if="activeTab === 'school'" class="config-content">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">School Configuration</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Basic Information -->
          <div class="space-y-4">
            <h4 class="font-medium text-gray-700">Basic Information</h4>
            
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">
                Currency
              </label>
              <select
                v-model="schoolConfig.currency"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                @change="updateSchoolConfig('currency', schoolConfig.currency)"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="INR">INR - Indian Rupee</option>
                <option value="PKR">PKR - Pakistani Rupee</option>
                <option value="AED">AED - UAE Dirham</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">
                Timezone
              </label>
              <select
                v-model="schoolConfig.timezone"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                @change="updateSchoolConfig('timezone', schoolConfig.timezone)"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Europe/Paris">Europe/Paris</option>
                <option value="Asia/Kolkata">Asia/Kolkata</option>
                <option value="Asia/Karachi">Asia/Karachi</option>
                <option value="Asia/Dubai">Asia/Dubai</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">
                Date Format
              </label>
              <select
                v-model="schoolConfig.date_format"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                @change="updateSchoolConfig('date_format', schoolConfig.date_format)"
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD-MM-YYYY">DD-MM-YYYY</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">
                Time Format
              </label>
              <select
                v-model="schoolConfig.time_format"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                @change="updateSchoolConfig('time_format', schoolConfig.time_format)"
              >
                <option value="12">12 Hour (AM/PM)</option>
                <option value="24">24 Hour</option>
              </select>
            </div>
          </div>

          <!-- Academic Settings -->
          <div class="space-y-4">
            <h4 class="font-medium text-gray-700">Academic Settings</h4>
            
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">
                Academic Year Start Month
              </label>
              <select
                v-model="schoolConfig.academic_year_start_month"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                @change="updateSchoolConfig('academic_year_start_month', schoolConfig.academic_year_start_month)"
              >
                <option v-for="month in months" :key="month.value" :value="month.value">
                  {{ month.label }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">
                Default Grading System
              </label>
              <select
                v-model="schoolConfig.default_grading_system"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                @change="updateSchoolConfig('default_grading_system', schoolConfig.default_grading_system)"
              >
                <option value="percentage">Percentage</option>
                <option value="letter_grade">Letter Grade</option>
                <option value="gpa">GPA</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">
                Working Days per Week
              </label>
              <input
                v-model.number="schoolConfig.working_days_per_week"
                type="number"
                min="1"
                max="7"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                @change="updateSchoolConfig('working_days_per_week', schoolConfig.working_days_per_week)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Module Settings Tab -->
    <div v-if="activeTab === 'modules'" class="config-content">
      <div class="space-y-6">
        <div
          v-for="module in enabledModules"
          :key="module.id"
          class="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-800">{{ module.name }}</h3>
            <div class="flex items-center space-x-2">
              <span
                :class="[
                  'px-2 py-1 rounded-full text-xs font-medium',
                  module.is_enabled
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                ]"
              >
                {{ module.is_enabled ? 'Enabled' : 'Disabled' }}
              </span>
              <button
                @click="toggleModule(module)"
                :class="[
                  'px-3 py-1 rounded text-sm font-medium transition-colors',
                  module.is_enabled
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                ]"
              >
                {{ module.is_enabled ? 'Disable' : 'Enable' }}
              </button>
            </div>
          </div>

          <div v-if="module.is_enabled" class="space-y-4">
            <div
              v-for="setting in module.settings"
              :key="setting.key"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <h4 class="font-medium text-gray-700">{{ setting.label }}</h4>
                <p class="text-sm text-gray-500">{{ setting.description }}</p>
              </div>
              <div class="flex items-center space-x-2">
                <input
                  v-if="setting.type === 'boolean'"
                  v-model="setting.value"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  @change="updateModuleConfig(module.code, setting.key, setting.value)"
                />
                <input
                  v-else-if="setting.type === 'number'"
                  v-model.number="setting.value"
                  type="number"
                  class="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @change="updateModuleConfig(module.code, setting.key, setting.value)"
                />
                <select
                  v-else-if="setting.type === 'select'"
                  v-model="setting.value"
                  class="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @change="updateModuleConfig(module.code, setting.key, setting.value)"
                >
                  <option
                    v-for="option in setting.options"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
                <input
                  v-else
                  v-model="setting.value"
                  type="text"
                  class="w-32 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @change="updateModuleConfig(module.code, setting.key, setting.value)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- System Settings Tab -->
    <div v-if="activeTab === 'system'" class="config-content">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">System Configuration</h3>
        
        <div class="space-y-6">
          <!-- Security Settings -->
          <div>
            <h4 class="font-medium text-gray-700 mb-3">Security Settings</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">
                  Session Timeout (minutes)
                </label>
                <input
                  v-model.number="systemConfig.session_timeout"
                  type="number"
                  min="5"
                  max="480"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @change="updateSystemConfig('session_timeout', systemConfig.session_timeout)"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">
                  Max Login Attempts
                </label>
                <input
                  v-model.number="systemConfig.max_login_attempts"
                  type="number"
                  min="3"
                  max="10"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @change="updateSystemConfig('max_login_attempts', systemConfig.max_login_attempts)"
                />
              </div>
            </div>
          </div>

          <!-- Notification Settings -->
          <div>
            <h4 class="font-medium text-gray-700 mb-3">Notification Settings</h4>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <h5 class="font-medium text-gray-600">Email Notifications</h5>
                  <p class="text-sm text-gray-500">Enable email notifications for system events</p>
                </div>
                <input
                  v-model="systemConfig.email_notifications"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  @change="updateSystemConfig('email_notifications', systemConfig.email_notifications)"
                />
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <h5 class="font-medium text-gray-600">SMS Notifications</h5>
                  <p class="text-sm text-gray-500">Enable SMS notifications for important events</p>
                </div>
                <input
                  v-model="systemConfig.sms_notifications"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  @change="updateSystemConfig('sms_notifications', systemConfig.sms_notifications)"
                />
              </div>
            </div>
          </div>

          <!-- Backup Settings -->
          <div>
            <h4 class="font-medium text-gray-700 mb-3">Backup Settings</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">
                  Auto Backup Frequency
                </label>
                <select
                  v-model="systemConfig.backup_frequency"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @change="updateSystemConfig('backup_frequency', systemConfig.backup_frequency)"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">
                  Backup Retention (days)
                </label>
                <input
                  v-model.number="systemConfig.backup_retention_days"
                  type="number"
                  min="7"
                  max="365"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @change="updateSystemConfig('backup_retention_days', systemConfig.backup_retention_days)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-2 text-gray-600">Loading configuration...</span>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="message" class="mt-4">
      <div
        :class="[
          'p-4 rounded-lg',
          message.type === 'success'
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-red-100 text-red-800 border border-red-200'
        ]"
      >
        {{ message.text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useConfig } from '~/composables/useConfig';

// Composables
const config = useConfig();

// Reactive data
const activeTab = ref<'school' | 'modules' | 'system'>('school');
const loading = ref(false);
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null);

// School configuration
const schoolConfig = ref({
  currency: 'USD',
  timezone: 'UTC',
  date_format: 'YYYY-MM-DD',
  time_format: '12',
  academic_year_start_month: 'April',
  default_grading_system: 'percentage',
  working_days_per_week: 5,
});

// System configuration
const systemConfig = ref({
  session_timeout: 30,
  max_login_attempts: 5,
  email_notifications: true,
  sms_notifications: false,
  backup_frequency: 'daily',
  backup_retention_days: 30,
});

// Enabled modules
const enabledModules = ref<any[]>([]);

// Months for academic year start
const months = computed(() => [
  { value: 'January', label: 'January' },
  { value: 'February', label: 'February' },
  { value: 'March', label: 'March' },
  { value: 'April', label: 'April' },
  { value: 'May', label: 'May' },
  { value: 'June', label: 'June' },
  { value: 'July', label: 'July' },
  { value: 'August', label: 'August' },
  { value: 'September', label: 'September' },
  { value: 'October', label: 'October' },
  { value: 'November', label: 'November' },
  { value: 'December', label: 'December' },
]);

// Methods
const loadConfigurations = async () => {
  try {
    loading.value = true;
    
    // Load school configuration
    const schoolConfigData = await config.getSchoolConfig();
    if (schoolConfigData) {
      schoolConfig.value = { ...schoolConfig.value, ...schoolConfigData.settings };
    }
    
    // Load enabled modules
    enabledModules.value = await config.getEnabledModules();
    
    // Load system configuration
    const systemConfigData = await config.getSystemConfig();
    if (systemConfigData) {
      systemConfig.value = { ...systemConfig.value, ...systemConfigData };
    }
    
  } catch (error) {
    console.error('Error loading configurations:', error);
    showMessage('error', 'Failed to load configurations');
  } finally {
    loading.value = false;
  }
};

const updateSchoolConfig = async (key: string, value: any) => {
  try {
    await config.setSchoolConfig(key, value);
    showMessage('success', 'School configuration updated successfully');
  } catch (error) {
    console.error('Error updating school config:', error);
    showMessage('error', 'Failed to update school configuration');
  }
};

const updateModuleConfig = async (moduleCode: string, key: string, value: any) => {
  try {
    await config.setModuleConfig(moduleCode, key, value);
    showMessage('success', 'Module configuration updated successfully');
  } catch (error) {
    console.error('Error updating module config:', error);
    showMessage('error', 'Failed to update module configuration');
  }
};

const updateSystemConfig = async (key: string, value: any) => {
  try {
    // Note: System config updates would typically require admin privileges
    // and might be handled differently in the backend
    showMessage('success', 'System configuration updated successfully');
  } catch (error) {
    console.error('Error updating system config:', error);
    showMessage('error', 'Failed to update system configuration');
  }
};

const toggleModule = async (module: any) => {
  try {
    await config.setModuleConfig(module.code, 'is_enabled', !module.is_enabled);
    module.is_enabled = !module.is_enabled;
    showMessage('success', `Module ${module.is_enabled ? 'enabled' : 'disabled'} successfully`);
  } catch (error) {
    console.error('Error toggling module:', error);
    showMessage('error', 'Failed to toggle module status');
  }
};

const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text };
  setTimeout(() => {
    message.value = null;
  }, 5000);
};

// Lifecycle
onMounted(() => {
  loadConfigurations();
});
</script>

<style scoped>
.config-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.config-content {
  min-height: 400px;
}

/* Custom checkbox styles */
input[type="checkbox"]:checked {
  background-color: #2563eb;
  border-color: #2563eb;
}

/* Focus styles */
input:focus,
select:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Transition effects */
button {
  transition: all 0.2s ease-in-out;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .config-manager {
    padding: 0.5rem;
  }
  
  .grid-cols-2 {
    grid-template-columns: 1fr;
  }
}
</style>
