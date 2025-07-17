<template>
  <client-only>
    <div class="card">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Add New Staff Member
        </h1>
        <NuxtLink 
          to="/users" 
          class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clip-rule="evenodd" />
          </svg>
          Back to Staff
        </NuxtLink>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Personal Information -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Personal Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.first_name"
                type="text"
                required
                class="input-field"
                placeholder="John"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.last_name"
                type="text"
                required
                class="input-field"
                placeholder="Doe"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.email"
                type="email"
                required
                class="input-field"
                placeholder="john.doe@example.com"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                v-model="formData.phone"
                type="tel"
                class="input-field"
                placeholder="+1234567890"
              />
            </div>
          </div>
        </div>

        <!-- Role and Access -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Role and Access</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role <span class="text-red-500">*</span>
              </label>
              <select
                v-model="formData.role"
                required
                class="input-field"
              >
                <option value="">Select Role</option>
                <option v-for="role in availableRoles" :key="role.value" :value="role.value">
                  {{ role.label }}
                </option>
              </select>
            </div>
            <div v-if="formData.role === 'teacher'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subjects (Comma separated)
              </label>
              <input
                v-model="formData.subjects"
                type="text"
                class="input-field"
                placeholder="Math, Science, English"
              />
            </div>
            <div v-if="formData.role === 'teacher'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Classes/Grades (Comma separated)
              </label>
              <input
                v-model="formData.grades"
                type="text"
                class="input-field"
                placeholder="1, 2, 3"
              />
            </div>
          </div>
        </div>

        <!-- Login Credentials -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Login Credentials</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <input
                v-model="formData.username"
                type="text"
                class="input-field"
                placeholder="johndoe"
              />
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Leave blank to auto-generate</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                v-model="formData.password"
                type="password"
                class="input-field"
                placeholder="••••••••"
              />
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Leave blank to auto-generate</p>
            </div>
          </div>
        </div>

        <!-- Additional Information -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Additional Information</h2>
          <div class="grid grid-cols-1 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address
              </label>
              <textarea
                v-model="formData.address"
                rows="3"
                class="input-field"
                placeholder="123 Main St, City, Country"
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Joining Date
              </label>
              <input
                v-model="formData.joining_date"
                type="date"
                class="input-field"
              />
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            @click="$router.push('/users')"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isSubmitting">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
            <span v-else>Save Staff Member</span>
          </button>
        </div>
      </form>
    </div>
  </client-only>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '~/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const isSubmitting = ref(false);

// Available roles for school admins to assign
const availableRoles = [
  { value: 'teacher', label: 'Teacher' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'librarian', label: 'Librarian' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'admin', label: 'School Admin' },
];

// Form data
const formData = ref({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  role: '',
  username: '',
  password: '',
  address: '',
  joining_date: new Date().toISOString().split('T')[0],
  subjects: '',
  grades: '',
  school_id: authStore.user?.school_id || null,
  created_by: authStore.user?.id || null,
});

// Handle form submission
const handleSubmit = async () => {
  if (isSubmitting.value) return;
  
  isSubmitting.value = true;
  
  try {
    // Prepare the data
    const payload = { ...formData.value };
    
    // If username is not provided, generate one from email
    if (!payload.username && payload.email) {
      payload.username = payload.email.split('@')[0];
    }
    
    // If password is not provided, generate a random one
    if (!payload.password) {
      payload.password = generateRandomPassword();
      payload.password_confirmation = payload.password;
    }
    
    // Convert comma-separated strings to arrays
    if (payload.subjects) {
      payload.subjects = payload.subjects.split(',').map(s => s.trim()).filter(Boolean);
    }
    
    if (payload.grades) {
      payload.grades = payload.grades.split(',').map(g => g.trim()).filter(Boolean);
    }
    
    // Send the request
    const response = await $fetch('/api/users', {
      method: 'POST',
      body: payload,
    });
    
    // Show success message
    useToast().success('Staff member added successfully!');
    
    // Redirect to users list
    router.push('/users');
  } catch (error) {
    console.error('Error creating staff member:', error);
    useToast().error(error.data?.message || 'Failed to add staff member');
  } finally {
    isSubmitting.value = false;
  }
};

// Generate a random password
const generateRandomPassword = () => {
  const length = 10;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
};
</script>

<style scoped>
.input-field {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white;
}
</style>
