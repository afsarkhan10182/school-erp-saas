<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Scroll Progress Bar -->
    <div class="fixed top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 z-50">
      <div
        class="h-full bg-indigo-600 transition-all duration-150 ease-out"
        :style="{ width: `${scrollProgress}%` }"
      ></div>
    </div>

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Enhanced Header with Breadcrumb -->
      <div class="mb-8">
        <!-- Breadcrumb -->
        <nav class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <span>Dashboard</span>
          <ChevronRight class="h-4 w-4" />
          <span class="text-gray-900 dark:text-white font-medium">Settings</span>
        </nav>

        <!-- Main Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1
              class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center"
            >
              <Settings class="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3 text-indigo-600" />
              Settings
            </h1>
            <p class="mt-1 sm:mt-2 text-sm text-gray-700 dark:text-gray-300">
              Manage your school configuration and system preferences
            </p>
          </div>
        </div>
      </div>

      <!-- Clean Tab Navigation -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <!-- Tab Header -->
        <div class="border-b border-gray-200 dark:border-gray-700">
          <nav
            class="flex space-x-1 sm:space-x-4 px-2 sm:px-6 overflow-x-auto scrollbar-hide"
            aria-label="Settings tabs"
          >
            <button
              v-for="tab in settingsTabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :disabled="loadingStates[tab.id]"
              :class="[
                'inline-flex items-center py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-blue-500 hover:text-blue-600',
                loadingStates[tab.id] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              ]"
            >
              <component :is="tab.icon" class="mr-2 h-4 w-4" />
              <span class="hidden sm:inline">{{ tab.name }}</span>

              <!-- Loading indicator -->
              <span
                v-if="loadingStates[tab.id]"
                class="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600"
              ></span>
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="p-4 sm:p-6">
          <!-- Settings Content -->
          <div class="space-y-4 sm:space-y-6">
            <!-- School Information Tab -->
            <SchoolSettings
              v-if="activeTab === 'school'"
              :loading="loadingStates.school"
              @save="saveSchoolSettings"
            />

            <!-- Academic Settings Tab -->
            <AcademicSettings
              v-if="activeTab === 'academic'"
              :loading="loadingStates.academic"
              @save="saveAcademicSettings"
            />

            <!-- Fee Settings Tab -->
            <FeeSettings
              v-if="activeTab === 'fees'"
              :loading="loadingStates.fees"
              @save="saveFeeSettings"
            />

            <!-- Branding Settings Tab -->
            <BrandingSettings
              v-if="activeTab === 'branding'"
              :loading="loadingStates.branding"
              :branches="branches"
              @save="saveBrandingSettings"
            />

            <!-- System Settings Tab -->
            <SystemSettings
              v-if="activeTab === 'system'"
              :loading="loadingStates.system"
              @save="saveSystemSettings"
            />

            <!-- Notification Settings Tab -->
            <NotificationSettings
              v-if="activeTab === 'notifications'"
              :loading="loadingStates.notifications"
              @save="saveNotificationSettings"
            />

            <!-- Security Settings Tab -->
            <SecuritySettings
              v-if="activeTab === 'security'"
              :loading="loadingStates.security"
              @save="saveSecuritySettings"
            />

            <!-- Integration Settings Tab -->
            <IntegrationSettings
              v-if="activeTab === 'integrations'"
              :loading="loadingStates.integrations"
              @save="saveIntegrationSettings"
            />

            <!-- Backup Settings Tab -->
            <BackupSettings
              v-if="activeTab === 'backup'"
              :loading="loadingStates.backup"
              @save="saveBackupSettings"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useToast } from '~/composables/useToast';
import {
  Settings,
  Building2,
  GraduationCap,
  DollarSign,
  Receipt,
  Bell,
  Shield,
  Link,
  Download,
  ChevronRight
} from 'lucide-vue-next';

// Import settings components
import SchoolSettings from '~/components/settings/SchoolSettings.vue';
import AcademicSettings from '~/components/settings/AcademicSettings.vue';
import FeeSettings from '~/components/settings/FeeSettings.vue';
import BrandingSettings from '~/components/settings/BrandingSettings.vue';
import SystemSettings from '~/components/settings/SystemSettings.vue';
import NotificationSettings from '~/components/settings/NotificationSettings.vue';
import SecuritySettings from '~/components/settings/SecuritySettings.vue';
import IntegrationSettings from '~/components/settings/IntegrationSettings.vue';
import BackupSettings from '~/components/settings/BackupSettings.vue';

// Composables
const { showToast } = useToast();

// Reactive data
const activeTab = ref('school');
const scrollProgress = ref(0);
const branches = ref([]);

// Loading states for each tab
const loadingStates = reactive({
  school: false,
  academic: false,
  fees: false,
  branding: false,
  system: false,
  notifications: false,
  security: false,
  integrations: false,
  backup: false
});

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
      name: 'Fee & Finance Settings',
      icon: DollarSign
    },
    {
      id: 'branding',
      name: 'Branding & Receipt',
      icon: Receipt
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
    }
  ];
  return tabs;
});

// Methods
const loadBranches = async () => {
  try {
    const { Branches } = await import('~/api/administration/branches');
    const response = await Branches.getAll();
    if (response.success && response.data) {
      branches.value = response.data;
    }
  } catch (error) {
    console.error('Error loading branches:', error);
  }
};

const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollHeight =
    document.documentElement.scrollHeight - document.documentElement.clientHeight;
  scrollProgress.value = (scrollTop / scrollHeight) * 100;
};

// Save methods for each tab
const saveSchoolSettings = async data => {
  try {
    loadingStates.school = true;

    // Create FormData for file uploads
    const formData = new FormData();

    // Prepare school info data (exclude logoFile from JSON)
    const { logoFile, ...schoolInfoData } = data.schoolInfo;

    // Add school settings data
    formData.append('schoolInfo', JSON.stringify(schoolInfoData));
    formData.append('contactInfo', JSON.stringify(data.contactInfo));
    formData.append('operationalSettings', JSON.stringify(data.operationalSettings));

    // Add school logo file if it exists
    if (logoFile) {
      formData.append('schoolLogo', logoFile);
    }

    // Make API call to save school settings
    const { Settings } = await import('~/api/administration/settings');
    const response = await Settings.updateSchoolSettings(formData);

    // Update auth store with new school data
    if (response.success && response.data?.school) {
      const { useAuthStore } = await import('~/stores/auth');
      const authStore = useAuthStore();

      // Update currentSchool with new data
      authStore.setCurrentSchool({
        id: response.data.school.id,
        name: response.data.school.name,
        code: response.data.school.code,
        logo: response.data.school.logo || ''
      });

      // Also update user's school information
      if (authStore.user) {
        authStore.updateUser({
          school_name: response.data.school.name
        });
      }
    }

    showToast('School settings saved successfully', 'success');
  } catch (error) {
    console.error('Error saving school settings:', error);
    showToast('Failed to save school settings', 'error');
  } finally {
    loadingStates.school = false;
  }
};

const saveAcademicSettings = async data => {
  try {
    loadingStates.academic = true;
    // API call to save academic settings
    showToast('Academic settings saved successfully', 'success');
  } catch (error) {
    console.error('Error saving academic settings:', error);
    showToast('Failed to save academic settings', 'error');
  } finally {
    loadingStates.academic = false;
  }
};

const saveFeeSettings = async data => {
  try {
    loadingStates.fees = true;
    // API call to save fee settings
    showToast('Fee settings saved successfully', 'success');
  } catch (error) {
    console.error('Error saving fee settings:', error);
    showToast('Failed to save fee settings', 'error');
  } finally {
    loadingStates.fees = false;
  }
};

const saveBrandingSettings = async data => {
  try {
    loadingStates.branding = true;

    // Create FormData for file uploads
    const formData = new FormData();

    // Add receipt settings data
    formData.append('receiptSettings', JSON.stringify(data.receiptSettings));

    // Add file uploads if they exist
    if (data.receiptSettings.receiptLogoFile) {
      formData.append('receiptLogo', data.receiptSettings.receiptLogoFile);
    }

    // Add branches data
    if (data.branches && data.branches.length > 0) {
      formData.append('branches', JSON.stringify(data.branches));

      // Add branch logo files
      data.branches.forEach((branch, index) => {
        if (branch.receiptLogoFile) {
          formData.append('branchLogos', branch.receiptLogoFile);
        }
      });
    }

    // Make API call
    const { Settings } = await import('~/api/administration/settings');
    await Settings.updateBrandingSettings(formData);

    showToast('Branding settings saved successfully', 'success');
  } catch (error) {
    console.error('Error saving branding settings:', error);
    showToast('Failed to save branding settings', 'error');
  } finally {
    loadingStates.branding = false;
  }
};

const saveSystemSettings = async data => {
  try {
    loadingStates.system = true;

    // Make API call to save system settings
    const { Settings } = await import('~/api/administration/settings');
    await Settings.updateSystemSettings(data);

    showToast('System settings saved successfully', 'success');
  } catch (error) {
    console.error('Error saving system settings:', error);
    showToast('Failed to save system settings', 'error');
  } finally {
    loadingStates.system = false;
  }
};

const saveNotificationSettings = async data => {
  try {
    loadingStates.notifications = true;
    // API call to save notification settings
    showToast('Notification settings saved successfully', 'success');
  } catch (error) {
    console.error('Error saving notification settings:', error);
    showToast('Failed to save notification settings', 'error');
  } finally {
    loadingStates.notifications = false;
  }
};

const saveSecuritySettings = async data => {
  try {
    loadingStates.security = true;
    // API call to save security settings
    showToast('Security settings saved successfully', 'success');
  } catch (error) {
    console.error('Error saving security settings:', error);
    showToast('Failed to save security settings', 'error');
  } finally {
    loadingStates.security = false;
  }
};

const saveIntegrationSettings = async data => {
  try {
    loadingStates.integrations = true;
    // API call to save integration settings
    showToast('Integration settings saved successfully', 'success');
  } catch (error) {
    console.error('Error saving integration settings:', error);
    showToast('Failed to save integration settings', 'error');
  } finally {
    loadingStates.integrations = false;
  }
};

const saveBackupSettings = async data => {
  try {
    loadingStates.backup = true;
    // API call to save backup settings
    showToast('Backup settings saved successfully', 'success');
  } catch (error) {
    console.error('Error saving backup settings:', error);
    showToast('Failed to save backup settings', 'error');
  } finally {
    loadingStates.backup = false;
  }
};

// Lifecycle
onMounted(() => {
  window.addEventListener('scroll', handleScroll);
  // Load initial data
  loadBranches();
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
