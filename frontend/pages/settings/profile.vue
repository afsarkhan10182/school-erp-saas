<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Profile & Settings</h1>
        <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Manage your profile and subscription settings
        </p>
      </div>

      <!-- Tab Navigation -->
      <div class="mb-6">
        <nav class="flex space-x-8 border-b border-gray-200 dark:border-gray-700">
          <button @click="activeTab = 'profile'" :class="tabButtonClasses(activeTab === 'profile')">
            <User class="inline-block w-4 h-4 mr-2" />
            Profile
          </button>
          <button
            v-if="canViewSubscription"
            @click="activeTab = 'subscription'"
            :class="tabButtonClasses(activeTab === 'subscription')"
          >
            <CreditCard class="inline-block w-4 h-4 mr-2" />
            Subscription
          </button>
          <button
            @click="activeTab = 'password'"
            :class="tabButtonClasses(activeTab === 'password')"
          >
            <Lock class="inline-block w-4 h-4 mr-2" />
            Change Password
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div v-if="activeTab === 'profile'" class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <form @submit.prevent="updateProfile">
            <!-- Profile Picture -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >Profile Picture</label
              >
              <div class="flex items-center space-x-4">
                <!-- Profile Picture (shows current or preview) -->
                <div class="flex-shrink-0">
                  <UserAvatar
                    :image-url="
                      form.profilePreview ||
                      (user?.profile_image
                        ? getProfileImageUrl(user.profile_image, user?.school?.code, apiBase)
                        : null)
                    "
                    :user="user"
                    size="xl"
                    alt="Profile"
                  />
                </div>

                <!-- Photo Upload Section -->
                <div class="flex-1">
                  <input
                    ref="fileInput"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="onFileChange"
                  />
                  <button
                    type="button"
                    @click="$refs.fileInput.click()"
                    :disabled="loading"
                    class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload class="-ml-1 mr-2 h-4 w-4" />
                    Upload Photo
                  </button>
                </div>
              </div>
            </div>

            <!-- Personal Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >First Name *</label
                >
                <input
                  v-model="form.first_name"
                  type="text"
                  required
                  :class="inputClasses"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Last Name *</label
                >
                <input
                  v-model="form.last_name"
                  type="text"
                  required
                  :class="inputClasses"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Email *</label
                >
                <input
                  v-model="form.email"
                  type="email"
                  required
                  :class="inputClasses"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Phone Number</label
                >
                <input
                  v-model="form.phone"
                  type="tel"
                  :class="inputClasses"
                  placeholder="Enter phone number"
                  @input="form.phone = form.phone.replace(/[^\d+]/g, '')"
                />
              </div>
            </div>

            <!-- Role Information (Read-only) -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >Role</label
              >
              <input
                :value="formatRole(user?.role)"
                type="text"
                readonly
                :class="readonlyInputClasses"
              />
            </div>

            <!-- School Information (Read-only) -->
            <div v-if="user?.school_name" class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >School</label
              >
              <input :value="user.school_name" type="text" readonly :class="readonlyInputClasses" />
            </div>

            <!-- Branch Information (Read-only) -->
            <div v-if="user?.branch_name" class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >Branch</label
              >
              <input :value="user.branch_name" type="text" readonly :class="readonlyInputClasses" />
            </div>

            <!-- Submit Button -->
            <div class="flex justify-end">
              <button type="submit" :disabled="loading" :class="submitButtonClasses('blue')">
                <Loader2 v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4" />
                {{ loading ? 'Updating...' : 'Update Profile' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Subscription Tab -->
      <div
        v-else-if="activeTab === 'subscription' && canViewSubscription"
        class="bg-white dark:bg-gray-800 shadow rounded-lg"
      >
        <div class="px-4 py-5 sm:p-6">
          <SubscriptionDetails
            :school-id="authStore.user.school_id"
            title="My Plan"
            subtitle="Your subscription overview"
            plan-section-title="Plan Overview"
            limits-section-title="Usage Limits"
            modules-section-title="Features Included"
            transactions-section-title="Payment History"
            renewal-requests-section-title="Upgrade/Downgrade Requests"
            :can-request-renewal="true"
            @data-loaded="handleDataLoaded"
            @renewal-requested="handleRenewalRequested"
          />
        </div>
      </div>

      <!-- Change Password Tab -->
      <div v-else-if="activeTab === 'password'" class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <form @submit.prevent="changePassword">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Change Password</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Current Password *</label
                >
                <input
                  v-model="passwordForm.currentPassword"
                  type="password"
                  required
                  :class="inputClasses"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >New Password *</label
                >
                <input
                  v-model="passwordForm.newPassword"
                  type="password"
                  required
                  :class="inputClasses"
                  placeholder="Enter new password"
                />
              </div>
            </div>

            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >Confirm New Password *</label
              >
              <input
                v-model="passwordForm.confirmPassword"
                type="password"
                required
                :class="inputClasses"
                placeholder="Confirm new password"
              />
            </div>

            <div class="flex justify-end">
              <button
                type="submit"
                :disabled="changingPassword"
                :class="submitButtonClasses('red')"
              >
                <Loader2 v-if="changingPassword" class="animate-spin -ml-1 mr-2 h-4 w-4" />
                {{ changingPassword ? 'Changing...' : 'Change Password' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { User, Upload, Loader2, CreditCard, Lock } from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';
import { useToast } from '~/composables/useToast';
import SubscriptionDetails from '~/components/shared/SubscriptionDetails.vue';
import UserAvatar from '~/components/shared/UserAvatar.vue';
import { Users } from '~/api';
import { getProfileImageUrl } from '~/utils/image';

// Page meta
definePageMeta({
  layout: 'default'
});

const authStore = useAuthStore();
const { showSuccess, showError } = useToast();
const config = useRuntimeConfig();
const apiBase = config.public?.apiBase;

// Tab management
const route = useRoute();
const activeTab = ref(route.query.tab === 'subscription' ? 'subscription' : 'profile');

// Form data
const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  profile_image: null
});

const loading = ref(false);
const changingPassword = ref(false);
const imageUploading = ref(false);
const user = computed(() => authStore.user);

// Password form data
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// Check if user can view subscription
const canViewSubscription = computed(() => {
  return ['school_admin', 'branch_admin'].includes(user.value?.role);
});

// Common CSS classes
const inputClasses = computed(
  () =>
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white'
);

const readonlyInputClasses = computed(
  () =>
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
);

const tabButtonClasses = computed(() => isActive => [
  'py-2 px-1 border-b-2 font-medium text-sm transition-colors',
  isActive
    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
]);

const submitButtonClasses = computed(
  () =>
    (color = 'blue') =>
      `inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-${color}-600 hover:bg-${color}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${color}-500 disabled:opacity-50 disabled:cursor-not-allowed`
);

// Initialize form with user data
const initializeForm = () => {
  if (user.value) {
    form.value = {
      first_name: user.value.first_name || '',
      last_name: user.value.last_name || '',
      email: user.value.email || '',
      phone: user.value.phone || '',
      profile_image: null,
      profilePreview: null
    };
  }
};

onMounted(() => {
  initializeForm();
});

// File upload handling
const onFileChange = event => {
  const file = event.target.files[0];
  if (file) {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Image size should be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please select a valid image file');
      return;
    }

    // Store the file for later upload
    form.value.profile_image = file;

    // Create preview
    const reader = new FileReader();
    reader.onload = e => {
      form.value.profilePreview = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

// Update profile
const updateProfile = async () => {
  loading.value = true;
  try {
    const formData = new FormData();
    formData.append('first_name', form.value.first_name);
    formData.append('last_name', form.value.last_name);
    formData.append('email', form.value.email);
    formData.append('phone', form.value.phone);

    if (form.value.profile_image) {
      formData.append('profile_image', form.value.profile_image);
    }

    console.log('📤 Updating profile with data:', {
      first_name: form.value.first_name,
      last_name: form.value.last_name,
      email: form.value.email,
      phone: form.value.phone,
      hasImage: !!form.value.profile_image
    });

    const response = await Users.updateProfile(formData);
    console.log('📥 Profile update response:', response);

    if (response.success) {
      // Small delay to ensure server processes the image upload
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update auth store with latest user data
      await authStore.checkAuth();

      // Update form data with the latest user data
      if (authStore.user) {
        form.value = {
          first_name: authStore.user.first_name || '',
          last_name: authStore.user.last_name || '',
          email: authStore.user.email || '',
          phone: authStore.user.phone || '',
          profile_image: null,
          profilePreview: null
        };
      }

      showSuccess('Profile updated successfully');
    } else {
      showError(response.message || 'Failed to update profile');
    }
  } catch (error) {
    console.error('❌ Profile update error:', error);
    const errorMessage =
      error.response?.data?.message || error.message || 'Failed to update profile';
    showError(errorMessage);
  } finally {
    loading.value = false;
  }
};

// Helper functions
const formatRole = role => {
  const roleMap = {
    super_admin: 'Super Admin',
    school_admin: 'School Admin',
    branch_admin: 'Branch Admin',
    teacher: 'Teacher',
    accountant: 'Accountant',
    receptionist: 'Receptionist'
  };
  return roleMap[role] || role;
};

// Change password function
const changePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    showError('New passwords do not match');
    return;
  }

  if (passwordForm.value.newPassword.length < 6) {
    showError('New password must be at least 6 characters long');
    return;
  }

  changingPassword.value = true;
  try {
    console.log('🔐 Changing password...');
    const response = await Users.changePassword({
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
    });

    console.log('🔐 Password change response:', response);

    if (response.success) {
      // Reset form
      passwordForm.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };

      showSuccess('Password changed successfully');
    } else {
      showError(response.message || 'Failed to change password');
    }
  } catch (error) {
    console.error('❌ Password change error:', error);
    const errorMessage =
      error.response?.data?.message || error.message || 'Failed to change password';
    showError(errorMessage);
  } finally {
    changingPassword.value = false;
  }
};

// Subscription event handlers
const handleDataLoaded = data => {
  // Data loaded successfully
};

const handleRenewalRequested = data => {
  showSuccess('Renewal request submitted successfully');
};
</script>
