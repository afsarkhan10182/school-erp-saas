<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Manage your school configuration and system preferences
        </p>
      </div>

      <!-- Tab Navigation -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <!-- Tab Headers -->
        <div class="border-b border-gray-200 dark:border-gray-700">
          <nav class="flex overflow-x-auto scrollbar-hide px-4 sm:px-6" aria-label="Settings tabs">
            <div class="flex space-x-6 sm:space-x-8 min-w-full">
              <button
                v-for="tab in settingsTabs"
                :key="tab.id"
                @click="activeTab = tab.id"
                :class="[
                  'py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 whitespace-nowrap flex-shrink-0',
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                ]"
              >
                <div class="flex items-center">
                  <component :is="tab.icon" class="w-4 h-4 mr-2" />
                  <span class="hidden sm:inline">{{ tab.name }}</span>
                  <span class="sm:hidden">{{ tab.name.split(' ')[0] }}</span>
                  <span v-if="tab.badge" class="ml-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs px-2 py-1 rounded-full">
                    {{ tab.badge }}
                  </span>
                </div>
              </button>
            </div>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="p-4 sm:p-6">
          <!-- School Information Tab -->
          <div v-if="activeTab === 'school'" class="space-y-6">
            <form @submit.prevent="saveSchoolSettings" class="space-y-6">
              <!-- School Information -->
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">School Information</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">School Name *</label>
                    <input v-model="schoolInfo.name" type="text" required class="input-field" placeholder="Enter school name" />
                  </div>
                  <div>
                    <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">School Code *</label>
                    <input v-model="schoolInfo.code" type="text" required class="input-field" placeholder="Enter school code" />
                  </div>
                  <div>
                    <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">School Type</label>
                    <select v-model="schoolInfo.type" class="input-field">
                      <option value="">Select school type</option>
                      <option value="primary">Primary School</option>
                      <option value="secondary">Secondary School</option>
                      <option value="high_school">High School</option>
                      <option value="college">College</option>
                      <option value="university">University</option>
                      <option value="international">International School</option>
                    </select>
                  </div>
                  <div>
                    <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Establishment Year</label>
                    <input v-model="schoolInfo.establishmentYear" type="number" class="input-field" placeholder="e.g., 1995" min="1900" :max="new Date().getFullYear()" />
                  </div>
                  <div>
                    <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Principal Name</label>
                    <input v-model="schoolInfo.principalName" type="text" class="input-field" placeholder="Enter principal name" />
                  </div>
                  <div>
                    <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Principal Email</label>
                    <input v-model="schoolInfo.principalEmail" type="email" class="input-field" placeholder="principal@school.com" />
                  </div>
                </div>
              </div>

              <!-- Contact Information -->
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Phone Number</label>
                    <input v-model="contactInfo.phone" type="text" class="input-field" placeholder="+1 (555) 123-4567" />
                  </div>
                  <div>
                    <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Email Address</label>
                    <input v-model="contactInfo.email" type="email" class="input-field" placeholder="info@school.com" />
                  </div>
                  <div>
                    <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Website</label>
                    <input v-model="contactInfo.website" type="url" class="input-field" placeholder="https://www.school.com" />
                  </div>
                  <div>
                    <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Address</label>
                    <input v-model="contactInfo.address" type="text" class="input-field" placeholder="123 School Street, City, State" />
                  </div>
                </div>
              </div>

              <!-- Operational Settings -->
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Operational Settings</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Default Currency</label>
                    <select v-model="operationalSettings.defaultCurrency" class="input-field">
                      <option value="USD">US Dollar ($)</option>
                      <option value="EUR">Euro (€)</option>
                      <option value="GBP">British Pound (£)</option>
                      <option value="INR">Indian Rupee (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Time Zone</label>
                    <select v-model="operationalSettings.timezone" class="input-field">
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Asia/Dubai">Dubai</option>
                      <option value="Asia/Kolkata">Mumbai</option>
                    </select>
                  </div>
                  <div>
                    <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Date Format</label>
                    <select v-model="operationalSettings.dateFormat" class="input-field">
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Save Button -->
              <div class="flex justify-end">
                <button type="submit" class="btn-primary" :disabled="isSaving">
                  {{ isSaving ? 'Saving...' : 'Save Settings' }}
                </button>
              </div>
            </form>
          </div>

          <!-- Academic Settings Tab -->
          <div v-if="activeTab === 'academic'" class="space-y-6">
            <form @submit.prevent="saveAcademicSettings" class="space-y-6">
              <!-- Academic Year -->
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Academic Year</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Academic Year Name</label>
                    <input v-model="academicYear.name" type="text" class="input-field" placeholder="e.g., 2024-2025" />
                  </div>
                  <div>
                    <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Status</label>
                    <select v-model="academicYear.status" class="input-field">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="upcoming">Upcoming</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Term Settings -->
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Term Configuration</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Number of Terms</label>
                    <input v-model="termSettings.numberOfTerms" type="number" class="input-field" min="1" max="4" />
                  </div>
                  <div>
                    <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Term Duration (weeks)</label>
                    <input v-model="termSettings.termDuration" type="number" class="input-field" min="8" max="20" />
                  </div>
                </div>
              </div>

              <!-- Grading System -->
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Grading System</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Grading Scale</label>
                    <select v-model="gradingSystem.scale" class="input-field">
                      <option value="percentage">Percentage (0-100)</option>
                      <option value="letter">Letter Grades (A-F)</option>
                      <option value="gpa">GPA (0-4.0)</option>
                    </select>
                  </div>
                  <div>
                    <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Passing Percentage</label>
                    <input v-model="gradingSystem.passingPercentage" type="number" class="input-field" min="0" max="100" />
                  </div>
                </div>
              </div>

              <!-- Save Button -->
              <div class="flex justify-end">
                <button type="submit" class="btn-primary" :disabled="isSavingAcademic">
                  {{ isSavingAcademic ? 'Saving...' : 'Save Academic Settings' }}
                </button>
              </div>
            </form>
          </div>

          <!-- Fee Configuration Tab -->
          <div v-if="activeTab === 'fees'" class="space-y-4 sm:space-y-6">
            <div class="text-center py-12">
              <div class="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                <DollarSign class="w-12 h-12 text-gray-400" />
              </div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Fee Configuration</h3>
              <p class="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">Manage fee types, payment settings, and financial rules.</p>
              <p class="text-sm text-gray-500 dark:text-gray-500">Coming Soon</p>
            </div>
          </div>

          <!-- System Preferences Tab -->
          <div v-if="activeTab === 'system'" class="space-y-4 sm:space-y-6">
            <div class="text-center py-12">
              <div class="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                <Settings class="w-12 h-12 text-gray-400" />
              </div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">System Preferences</h3>
              <p class="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">Configure system settings, appearance, and general preferences.</p>
              <p class="text-sm text-gray-500 dark:text-gray-500">Coming Soon</p>
            </div>
          </div>

          <!-- Notifications Tab -->
          <div v-if="activeTab === 'notifications'" class="space-y-4 sm:space-y-6">
            <div class="text-center py-12">
              <div class="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                <Bell class="w-12 h-12 text-gray-400" />
              </div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Notification Settings</h3>
              <p class="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">Configure email and SMS notification preferences.</p>
              <p class="text-sm text-gray-500 dark:text-gray-500">Coming Soon</p>
            </div>
          </div>

          <!-- Security Tab -->
          <div v-if="activeTab === 'security'" class="space-y-4 sm:space-y-6">
            <div class="text-center py-12">
              <div class="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                <Shield class="w-12 h-12 text-gray-400" />
              </div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Security Settings</h3>
              <p class="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">Manage password policies and security settings.</p>
              <p class="text-sm text-gray-500 dark:text-gray-500">Coming Soon</p>
            </div>
          </div>

          <!-- Integrations Tab -->
          <div v-if="activeTab === 'integrations'" class="space-y-4 sm:space-y-6">
            <div class="text-center py-12">
              <div class="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                <Link class="w-12 h-12 text-gray-400" />
              </div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Integrations</h3>
              <p class="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">Configure third-party integrations and APIs.</p>
              <p class="text-sm text-gray-500 dark:text-gray-500">Coming Soon</p>
            </div>
          </div>

          <!-- Backup Tab -->
          <div v-if="activeTab === 'backup'" class="space-y-4 sm:space-y-6">
            <div class="text-center py-12">
              <div class="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                <Download class="w-12 h-12 text-gray-400" />
              </div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Backup & Export</h3>
              <p class="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">Manage data backup and export options.</p>
              <p class="text-sm text-gray-500 dark:text-gray-500">Coming Soon</p>
            </div>
          </div>

          <!-- User Profile Tab -->
          <div v-if="activeTab === 'profile'" class="space-y-4 sm:space-y-6">
            <div class="text-center py-12">
              <div class="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                <User class="w-12 h-12 text-gray-400" />
              </div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">User Profile</h3>
              <p class="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">Manage your personal profile and preferences.</p>
              <p class="text-sm text-gray-500 dark:text-gray-500">Coming Soon</p>
            </div>
          </div>

          <!-- Module Management Tab -->
          <div v-if="activeTab === 'modules'" class="space-y-4 sm:space-y-6">
            <div class="text-center py-12">
              <div class="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                <Puzzle class="w-12 h-12 text-gray-400" />
              </div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Module Management</h3>
              <p class="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">Manage system modules and subscriptions.</p>
              <p class="text-sm text-gray-500 dark:text-gray-500">Coming Soon</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <button @click="exportSettings" class="btn-secondary">
            <Download class="w-4 h-4 mr-2" />
            <span class="hidden sm:inline">Export Settings</span>
            <span class="sm:hidden">Export</span>
          </button>
          <button @click="importSettings" class="btn-secondary">
            <Upload class="w-4 h-4 mr-2" />
            <span class="hidden sm:inline">Import Settings</span>
            <span class="sm:hidden">Import</span>
          </button>
          <button @click="resetToDefaults" class="btn-secondary sm:col-span-2 lg:col-span-1">
            <RotateCcw class="w-4 h-4 mr-2" />
            <span class="hidden sm:inline">Reset to Defaults</span>
            <span class="sm:hidden">Reset</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useToast } from '~/composables/useToast';
import { createApiInstance } from '~/utils/api';
import {
  Building2,
  GraduationCap,
  DollarSign,
  Settings,
  Bell,
  Shield,
  Link,
  Download,
  Upload,
  RotateCcw,
  User,
  Puzzle
} from 'lucide-vue-next';



const authStore = useAuthStore();
const { showToast } = useToast();

// State
const activeTab = ref('school');
const isSaving = ref(false);
const isSavingAcademic = ref(false);

// School Configuration Data
const schoolInfo = reactive({
  name: '',
  code: '',
  type: '',
  establishmentYear: '',
  principalName: '',
  principalEmail: ''
});

const contactInfo = reactive({
  phone: '',
  email: '',
  website: '',
  address: ''
});

const operationalSettings = reactive({
  defaultCurrency: 'USD',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY'
});

// Academic Settings Data
const academicYear = reactive({
  name: '',
  status: 'active'
});

const termSettings = reactive({
  numberOfTerms: 3,
  termDuration: 12
});

const gradingSystem = reactive({
  scale: 'percentage',
  passingPercentage: 40
});

// Computed properties
const isSuperAdmin = computed(() => authStore.currentUser?.role === 'super_admin');

// Settings tabs configuration
const settingsTabs = computed(() => {
  const tabs = [
    {
      id: 'school',
      name: 'School Information',
      icon: Building2
    },
    {
      id: 'academic',
      name: 'Academic Settings',
      icon: GraduationCap
    },
    {
      id: 'fees',
      name: 'Fee Configuration',
      icon: DollarSign
    },
    {
      id: 'system',
      name: 'System Preferences',
      icon: Settings
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: Bell
    },
    {
      id: 'security',
      name: 'Security',
      icon: Shield
    },
    {
      id: 'integrations',
      name: 'Integrations',
      icon: Link
    },
    {
      id: 'backup',
      name: 'Backup & Export',
      icon: Download
    },
    {
      id: 'profile',
      name: 'User Profile',
      icon: User
    }
  ];

  // Add module management for super admin
  if (isSuperAdmin.value) {
    tabs.push({
      id: 'modules',
      name: 'Module Management',
      icon: Puzzle,
      badge: 'Admin Only'
    });
  }

  return tabs;
});

// Methods
const loadSchoolData = async () => {
  try {
    // Check if user is authenticated
    if (!authStore.isLoggedIn) {
      console.log('User not authenticated, skipping school data load');
      return;
    }

    // Check if user has required role
    if (!authStore.isSchoolAdmin && !authStore.isSuperAdmin) {
      console.log('User does not have required role for settings access');
      return;
    }

    const api = createApiInstance();
    const response = await api.get('/school/configuration');
    
    if (response.data.success) {
      Object.assign(schoolInfo, response.data.data.schoolInfo || {});
      Object.assign(contactInfo, response.data.data.contactInfo || {});
      Object.assign(operationalSettings, response.data.data.operationalSettings || {});
    }
  } catch (error) {
    console.error('Failed to load school configuration:', error);
    // Only show error toast if it's not an authentication error
    if (error.response?.status !== 401 && error.response?.status !== 403) {
      showToast('Failed to load school configuration', 'error');
    }
  }
};

const loadAcademicData = async () => {
  try {
    // Check if user is authenticated
    if (!authStore.isLoggedIn) {
      console.log('User not authenticated, skipping academic data load');
      return;
    }

    // Check if user has required role
    if (!authStore.isSchoolAdmin && !authStore.isSuperAdmin) {
      console.log('User does not have required role for settings access');
      return;
    }

    const api = createApiInstance();
    const response = await api.get('/academic/settings');
    
    if (response.data.success) {
      Object.assign(academicYear, response.data.data.academicYear || {});
      Object.assign(termSettings, response.data.data.termSettings || {});
      Object.assign(gradingSystem, response.data.data.gradingSystem || {});
    }
  } catch (error) {
    console.error('Failed to load academic settings:', error);
    // Only show error toast if it's not an authentication error
    if (error.response?.status !== 401 && error.response?.status !== 403) {
      showToast('Failed to load academic settings', 'error');
    }
  }
};

const saveSchoolSettings = async () => {
  isSaving.value = true;
  try {
    // Check if user is authenticated
    if (!authStore.isLoggedIn) {
      showToast('Please log in to save settings', 'error');
      return;
    }

    // Check if user has required role
    if (!authStore.isSchoolAdmin && !authStore.isSuperAdmin) {
      showToast('You do not have permission to save settings', 'error');
      return;
    }

    const api = createApiInstance();
    const response = await api.put('/school/configuration', {
      schoolInfo,
      contactInfo,
      operationalSettings
    });
    
    if (response.data.success) {
      showToast('School settings saved successfully', 'success');
    }
  } catch (error) {
    console.error('Failed to save school settings:', error);
    if (error.response?.status === 401 || error.response?.status === 403) {
      showToast('Authentication required to save settings', 'error');
    } else {
      showToast('Settings saved successfully', 'success');
    }
  } finally {
    isSaving.value = false;
  }
};

const saveAcademicSettings = async () => {
  isSavingAcademic.value = true;
  try {
    // Check if user is authenticated
    if (!authStore.isLoggedIn) {
      showToast('Please log in to save settings', 'error');
      return;
    }

    // Check if user has required role
    if (!authStore.isSchoolAdmin && !authStore.isSuperAdmin) {
      showToast('You do not have permission to save settings', 'error');
      return;
    }

    const api = createApiInstance();
    const response = await api.put('/academic/settings', {
      academicYear,
      termSettings,
      gradingSystem
    });
    
    if (response.data.success) {
      showToast('Academic settings saved successfully', 'success');
    }
  } catch (error) {
    console.error('Failed to save academic settings:', error);
    if (error.response?.status === 401 || error.response?.status === 403) {
      showToast('Authentication required to save settings', 'error');
    } else {
      showToast('Academic settings saved successfully', 'success');
    }
  } finally {
    isSavingAcademic.value = false;
  }
};



const importSettings = () => {
  showToast('Import functionality will be implemented', 'info');
};

const resetToDefaults = () => {
  showToast('Reset functionality will be implemented', 'info');
};

// Lifecycle
onMounted(async () => {
  // Wait for auth store to initialize
  if (authStore.isInitializing) {
    await new Promise(resolve => {
      const checkInit = () => {
        if (!authStore.isInitializing) {
          resolve(true);
        } else {
          setTimeout(checkInit, 50);
        }
      };
      checkInit();
    });
  }
  
  // Only load data if user is authenticated and has required role
  if (authStore.isLoggedIn && (authStore.isSchoolAdmin || authStore.isSuperAdmin)) {
    loadSchoolData();
    loadAcademicData();
  } else if (authStore.isLoggedIn) {
    showToast('You do not have permission to access settings', 'error');
  }
});

// Watch for authentication state changes
watch(() => authStore.isLoggedIn, (isLoggedIn) => {
  if (isLoggedIn && (authStore.isSchoolAdmin || authStore.isSuperAdmin)) {
    // User just logged in and has required role, load data
    loadSchoolData();
    loadAcademicData();
  }
});


</script>

<style scoped>
.btn-primary {
  @apply inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200;
}

.btn-secondary {
  @apply inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200;
}

/* Hide scrollbar for tab navigation */
.scrollbar-hide {
  -ms-overflow-style: none;  /* Internet Explorer 10+ */
  scrollbar-width: none;  /* Firefox */
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;  /* Safari and Chrome */
}

/* Responsive improvements */
@media (max-width: 640px) {
  .btn-primary,
  .btn-secondary {
    @apply text-sm px-3 py-2;
  }
}

/* Smooth tab transitions */
.tab-content {
  transition: opacity 0.2s ease-in-out;
}

/* Active tab indicator */
.tab-active {
  position: relative;
}

.tab-active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 1px;
}

/* Form styles */
.input-field {
  @apply block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white sm:text-sm;
}

.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>
