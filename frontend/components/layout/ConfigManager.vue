<template>
  <div class="config-manager">
    <div class="config-header">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">Configuration Management</h2>
      <div class="flex gap-4 mb-6">
        <button
          @click="activeTab = 'school'"
          :class="['btn', activeTab === 'school' ? 'btn-primary' : 'btn-secondary']"
        >
          School Settings
        </button>
        <button
          @click="activeTab = 'modules'"
          :class="['btn', activeTab === 'modules' ? 'btn-primary' : 'btn-secondary']"
        >
          Module Settings
        </button>
        <button
          @click="activeTab = 'system'"
          :class="['btn', activeTab === 'system' ? 'btn-primary' : 'btn-secondary']"
        >
          System Settings
        </button>
      </div>
    </div>

    <!-- School Settings Tab -->
    <div v-if="activeTab === 'school'" class="config-content">
      <div class="card card-body">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">School Configuration</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Basic Information -->
          <div class="space-y-4">
            <h4 class="font-medium text-gray-700">Basic Information</h4>

            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1"> Currency </label>
              <EnhancedDropdown v-model="schoolConfig.currency" :options="currencyOptions" placeholder="Select currency" @change="updateSchoolConfig('currency', schoolConfig.currency)" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1"> Timezone </label>
              <EnhancedDropdown v-model="schoolConfig.timezone" :options="timezoneOptions" placeholder="Select timezone" @change="updateSchoolConfig('timezone', schoolConfig.timezone)" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1"> Date Format </label>
              <EnhancedDropdown v-model="schoolConfig.date_format" :options="dateFormatOptions" placeholder="Select date format" @change="updateSchoolConfig('date_format', schoolConfig.date_format)" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1"> Time Format </label>
              <EnhancedDropdown v-model="schoolConfig.time_format" :options="timeFormatOptions" placeholder="Select time format" @change="updateSchoolConfig('time_format', schoolConfig.time_format)" />
            </div>
          </div>

          <!-- Academic Settings -->
          <div class="space-y-4">
            <h4 class="font-medium text-gray-700">Academic Settings</h4>

            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">
                Academic Year Start Month
              </label>
              <EnhancedDropdown v-model="schoolConfig.academic_year_start_month" :options="months" placeholder="Select month" @change="updateSchoolConfig('academic_year_start_month', schoolConfig.academic_year_start_month)" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">
                Default Grading System
              </label>
              <EnhancedDropdown v-model="schoolConfig.default_grading_system" :options="gradingOptions" placeholder="Select grading system" @change="updateSchoolConfig('default_grading_system', schoolConfig.default_grading_system)" />
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
                class="form-input"
                @change="
                  updateSchoolConfig('working_days_per_week', schoolConfig.working_days_per_week)
                "
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Module Settings Tab -->
    <div v-if="activeTab === 'modules'" class="config-content">
      <div class="space-y-6">
        <div v-for="module in enabledModules" :key="module.id" class="card card-body">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-800">{{ module.name }}</h3>
            <div class="flex items-center space-x-2">
              <span :class="['badge', module.is_enabled ? 'badge-success' : 'badge-danger']">
                {{ module.is_enabled ? 'Enabled' : 'Disabled' }}
              </span>
              <button
                v-if="module.canEnable"
                @click="toggleModule(module)"
                :class="['btn btn-sm', module.is_enabled ? 'btn-danger' : 'btn-success']"
              >
                {{ module.is_enabled ? 'Disable' : 'Enable' }}
              </button>
              <span v-else class="text-xs text-gray-500 dark:text-gray-400">Managed by plan</span>
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
                  class="form-checkbox"
                  @change="updateModuleConfig(module.code, setting.key, setting.value)"
                />
                <input
                  v-else-if="setting.type === 'number'"
                  v-model.number="setting.value"
                  type="number"
                  class="form-input"
                  style="width: 6rem"
                  @change="updateModuleConfig(module.code, setting.key, setting.value)"
                />
                <EnhancedDropdown
                  v-else-if="setting.type === 'select'"
                  v-model="setting.value"
                  :options="setting.options || []"
                  placeholder="Select value"
                  class="min-w-32"
                  @change="updateModuleConfig(module.code, setting.key, setting.value)"
                />
                <input
                  v-else
                  v-model="setting.value"
                  type="text"
                  class="form-input"
                  style="width: 8rem"
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
      <div class="card card-body">
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
                  class="form-input"
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
                  class="form-input"
                  @change="
                    updateSystemConfig('max_login_attempts', systemConfig.max_login_attempts)
                  "
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
                  class="form-checkbox"
                  @change="
                    updateSystemConfig('email_notifications', systemConfig.email_notifications)
                  "
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
                  class="form-checkbox"
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
                <EnhancedDropdown v-model="systemConfig.backup_frequency" :options="backupFrequencyOptions" placeholder="Select backup frequency" @change="updateSystemConfig('backup_frequency', systemConfig.backup_frequency)" />
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
                  class="form-input"
                  @change="
                    updateSystemConfig('backup_retention_days', systemConfig.backup_retention_days)
                  "
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
      <div :class="['alert', message.type === 'success' ? 'alert-success' : 'alert-danger']">
        {{ message.text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useConfig } from '~/composables/useConfig';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';

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
  working_days_per_week: 5
});

// System configuration
const systemConfig = ref({
  session_timeout: 30,
  max_login_attempts: 5,
  email_notifications: true,
  sms_notifications: false,
  backup_frequency: 'daily',
  backup_retention_days: 30
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
  { value: 'December', label: 'December' }
]);
const currencyOptions = [
  { value: 'USD', label: 'USD - US Dollar' }, { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' }, { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'PKR', label: 'PKR - Pakistani Rupee' }, { value: 'AED', label: 'AED - UAE Dirham' }
];
const timezoneOptions = ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Kolkata', 'Asia/Karachi', 'Asia/Dubai'];
const dateFormatOptions = ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'DD-MM-YYYY'];
const timeFormatOptions = [{ value: '12', label: '12 Hour (AM/PM)' }, { value: '24', label: '24 Hour' }];
const gradingOptions = [{ value: 'percentage', label: 'Percentage' }, { value: 'letter_grade', label: 'Letter Grade' }, { value: 'gpa', label: 'GPA' }, { value: 'custom', label: 'Custom' }];
const backupFrequencyOptions = ['daily', 'weekly', 'monthly', 'disabled'];

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
    await config.setSystemConfig(key, value);
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
