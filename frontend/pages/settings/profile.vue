<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
        <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">Update your personal information and preferences</p>
      </div>

      <!-- Profile Form -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <form @submit.prevent="updateProfile">
            <!-- Profile Picture -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profile Picture</label>
              <div class="flex items-center space-x-4">
                <div class="flex-shrink-0">
                  <img 
                    v-if="form.profilePicture || user?.profilePicture" 
                    :src="form.profilePicture || user?.profilePicture" 
                    alt="Profile" 
                    class="h-16 w-16 rounded-full object-cover"
                  />
                  <div v-else class="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    <User class="h-8 w-8 text-gray-400" />
                  </div>
                </div>
                <div>
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
                    class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Upload class="-ml-1 mr-2 h-4 w-4" />
                    Change Photo
                  </button>
                </div>
              </div>
            </div>

            <!-- Personal Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name *</label>
                <input 
                  v-model="form.firstName" 
                  type="text" 
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name *</label>
                <input 
                  v-model="form.lastName" 
                  type="text" 
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                <input 
                  v-model="form.email" 
                  type="email" 
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                <input 
                  v-model="form.phone" 
                  type="tel" 
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter phone number"
                  @input="form.phone = form.phone.replace(/[^\d+]/g, '')"
                />
              </div>
            </div>

            <!-- Role Information (Read-only) -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
              <input 
                :value="formatRole(user?.role)" 
                type="text" 
                readonly
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
              />
            </div>

            <!-- School/Branch Information (Read-only) -->
            <div v-if="user?.schoolId || user?.branchId" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div v-if="user?.schoolId">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">School</label>
                <input 
                  :value="schoolName" 
                  type="text" 
                  readonly
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                />
              </div>
              <div v-if="user?.branchId">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Branch</label>
                <input 
                  :value="branchName" 
                  type="text" 
                  readonly
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                />
              </div>
            </div>

            <!-- Submit Button -->
            <div class="flex justify-end">
              <button 
                type="submit" 
                :disabled="isSubmitting"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <Save v-if="!isSubmitting" class="-ml-1 mr-2 h-4 w-4" />
                <div v-else class="-ml-1 mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                {{ isSubmitting ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Change Password Section -->
      <div class="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Change Password</h3>
          <form @submit.prevent="changePassword">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password *</label>
                <input 
                  v-model="passwordForm.currentPassword" 
                  type="password" 
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password *</label>
                <input 
                  v-model="passwordForm.newPassword" 
                  type="password" 
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter new password"
                />
              </div>
            </div>
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password *</label>
              <input 
                v-model="passwordForm.confirmPassword" 
                type="password" 
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Confirm new password"
              />
            </div>
            <div class="flex justify-end">
              <button 
                type="submit" 
                :disabled="isChangingPassword"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                <Lock v-if="!isChangingPassword" class="-ml-1 mr-2 h-4 w-4" />
                <div v-else class="-ml-1 mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                {{ isChangingPassword ? 'Changing...' : 'Change Password' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';
import apiClient from '~/utils/api';
import { 
  User, 
  Upload, 
  Save, 
  Lock 
} from 'lucide-vue-next';

const authStore = useAuthStore();
const user = computed(() => authStore.currentUser);

const isSubmitting = ref(false);
const isChangingPassword = ref(false);
const schoolName = ref('');
const branchName = ref('');

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  profilePicture: null
});

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const onFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    form.profilePicture = URL.createObjectURL(file);
  }
};

const updateProfile = async () => {
  isSubmitting.value = true;
  try {
    const formData = new FormData();
    formData.append('firstName', form.firstName);
    formData.append('lastName', form.lastName);
    formData.append('email', form.email);
    formData.append('phone', form.phone);
    
    if (form.profilePicture && form.profilePicture.startsWith('blob:')) {
      // Convert blob URL back to file
      const response = await fetch(form.profilePicture);
      const blob = await response.blob();
      formData.append('profilePicture', blob, 'profile.jpg');
    }
    
    await apiClient.users.updateProfile(formData);
    
    // Update local user data
    authStore.updateUser({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone
    });
    
    // Show success message
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('show-toast', {
        detail: {
          message: 'Profile updated successfully!',
          type: 'success'
        }
      });
      window.dispatchEvent(event);
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    // Show error message
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('show-toast', {
        detail: {
          message: 'Error updating profile. Please try again.',
          type: 'error'
        }
      });
      window.dispatchEvent(event);
    }
  } finally {
    isSubmitting.value = false;
  }
};

const changePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('show-toast', {
        detail: {
          message: 'New passwords do not match!',
          type: 'error'
        }
      });
      window.dispatchEvent(event);
    }
    return;
  }
  
  isChangingPassword.value = true;
  try {
    await apiClient.users.changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    });
    
    // Reset form
    passwordForm.currentPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
    
    // Show success message
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('show-toast', {
        detail: {
          message: 'Password changed successfully!',
          type: 'success'
        }
      });
      window.dispatchEvent(event);
    }
  } catch (error) {
    console.error('Error changing password:', error);
    // Show error message
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('show-toast', {
        detail: {
          message: 'Error changing password. Please check your current password.',
          type: 'error'
        }
      });
      window.dispatchEvent(event);
    }
  } finally {
    isChangingPassword.value = false;
  }
};

const formatRole = (role) => {
  if (!role) return '';
  return role.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const fetchSchoolAndBranchNames = async () => {
  try {
    if (user.value?.schoolId) {
      const schoolResponse = await apiClient.schools.getById(user.value.schoolId);
      schoolName.value = schoolResponse.data?.name || '';
    }
    
    if (user.value?.branchId) {
      const branchResponse = await apiClient.branches.getById(user.value.branchId);
      branchName.value = branchResponse.data?.name || '';
    }
  } catch (error) {
    console.error('Error fetching school/branch names:', error);
  }
};

onMounted(() => {
  // Initialize form with current user data
  if (user.value) {
    form.firstName = user.value.firstName || '';
    form.lastName = user.value.lastName || '';
    form.email = user.value.email || '';
    form.phone = user.value.phone || '';
  }
  
  fetchSchoolAndBranchNames();
});
</script> 