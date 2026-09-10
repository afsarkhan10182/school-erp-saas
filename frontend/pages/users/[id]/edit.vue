<template>
  <div class="container mx-auto py-8 max-w-2xl">
    <h1 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Edit User</h1>
    <div v-if="loading" class="text-gray-500 dark:text-gray-400">Loading...</div>
    <div v-else-if="error" class="text-red-600 dark:text-red-400">{{ error }}</div>
    <form
      v-else
      @submit.prevent="handleSubmit"
      class="space-y-6 bg-white dark:bg-gray-800 p-6 rounded shadow"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
            >First Name *</label
          >
          <input
            v-model="form.first_name"
            type="text"
            required
            :class="[
              'form-input',
              fieldErrors.first_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            ]"
            @input="clearFieldError('first_name')"
          />
          <div v-if="fieldErrors.first_name" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ fieldErrors.first_name }}
          </div>
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Last Name *</label>
          <input
            v-model="form.last_name"
            type="text"
            required
            :class="[
              'form-input',
              fieldErrors.last_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            ]"
            @input="clearFieldError('last_name')"
          />
          <div v-if="fieldErrors.last_name" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ fieldErrors.last_name }}
          </div>
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Email *</label>
          <input
            v-model="form.email"
            type="email"
            required
            :class="[
              'form-input',
              fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            ]"
            @input="clearFieldError('email')"
          />
          <div v-if="fieldErrors.email" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ fieldErrors.email }}
          </div>
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Phone</label>
          <input
            v-model="form.phone"
            type="tel"
            :class="[
              'form-input',
              fieldErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            ]"
            placeholder="Enter phone number"
            @input="handlePhoneInput"
            @blur="validatePhone"
          />
          <div v-if="fieldErrors.phone" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ fieldErrors.phone }}
          </div>
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Password</label>
          <PasswordInput
            v-model="form.password"
            placeholder="Leave blank to keep current password"
            :error="!!fieldErrors.password"
            @input="clearFieldError('password')"
          />
          <div v-if="fieldErrors.password" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ fieldErrors.password }}
          </div>
          <div v-else class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Leave blank to keep current password
          </div>
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Role *</label>
          <select
            v-model="form.role"
            required
            :class="[
              'form-input',
              fieldErrors.role ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            ]"
            :disabled="isAdmin"
            @change="clearFieldError('role')"
          >
            <option value="super_admin" v-if="!isAdmin">Super Admin</option>
            <option value="admin" v-if="!isAdmin">Admin</option>
            <option value="branch_admin">Branch Admin</option>
            <option value="teacher">Teacher</option>
            <option value="accountant">Accountant</option>
            <option value="librarian">Librarian</option>
            <option value="receptionist">Receptionist</option>
            <option value="hr">HR</option>
            <option value="student">Student</option>
            <option value="parent">Parent</option>
            <option value="alumni">Alumni</option>
            <option value="transport_manager">Transport Manager</option>
          </select>
          <div v-if="fieldErrors.role" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ fieldErrors.role }}
          </div>
          <p v-if="isAdmin" class="text-sm text-gray-500 mt-1">Role cannot be changed by Admin</p>
        </div>
        <div v-if="isSuperAdmin">
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Branch *</label>
          <select v-model="form.branch_id" required class="form-select">
            <option v-for="branch in branches" :key="branch.id" :value="branch.id">
              {{ branch.name }}
            </option>
          </select>
        </div>
      </div>
      <div class="flex justify-end gap-3">
        <NuxtLink to="/users" class="btn-secondary">Cancel</NuxtLink>
        <button
          type="submit"
          class="btn-primary"
          :disabled="saving"
          :class="{ 'opacity-50 cursor-not-allowed': saving }"
        >
          <span v-if="saving">
            <svg
              class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Saving...
          </span>
          <span v-else>Save Changes</span>
        </button>
      </div>
      <div v-if="success" class="text-green-600 dark:text-green-400 mt-4">
        User updated successfully!
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '~/composables/useAuth';
import { useToast } from '~/composables/useToast';
import { Users, Branches } from '~/api';
import PasswordInput from '~/components/ui/PasswordInput.vue';

const { isSuperAdmin, isAdmin, user } = useAuth();
const { showError, showSuccess } = useToast();

// Access control - only Super Admin and Admin can access user management
if (!isSuperAdmin.value && !isAdmin.value) {
  showError('Access denied. Only Super Admin and Admin can manage users.');
  await navigateTo('/dashboard');
}

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref('');
const saving = ref(false);
const success = ref(false);
const fieldErrors = ref({});
const branches = ref([]);

const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  role: '',
  branch_id: '',
  password: ''
});

// isAdmin is already available from useAuth composable

const fetchUser = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await Users.getById(route.params.id);
    if (res.success) {
      // Map backend field names to form fields
      form.value = {
        first_name: res.data.first_name || '',
        last_name: res.data.last_name || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        role: res.data.role || '',
        branch_id: res.data.branch_id || ''
      };
      if (isSuperAdmin.value && res.data.school_id) {
        const branchResponse = await Branches.getForDropdown({ school_id: res.data.school_id });
        branches.value = branchResponse.data || [];
      }
    } else {
      error.value = res.message || 'Failed to load user.';
    }
  } catch (e) {
    console.error('Error fetching user:', e);
    error.value = 'Failed to load user.';
  } finally {
    loading.value = false;
  }
};

const handlePhoneInput = event => {
  // Allow digits, spaces, dashes, plus sign, and parentheses
  const value = event.target.value;
  const cleaned = value.replace(/[^\d\s\-\(\)\+]/g, '');
  form.value.phone = cleaned;
  clearFieldError('phone');
};

const validatePhone = () => {
  const phone = form.value.phone;
  if (phone && phone.trim() !== '') {
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/[^\d]/g, '');
    if (digitsOnly.length !== 10) {
      fieldErrors.value.phone = 'Mobile number must be 10 digits';
      return false;
    }
    // Check if it starts with a valid Indian mobile pattern (6, 7, 8, 9)
    const phoneRegex = /^[\+]?[6-9][\d\s\-\(\)]{9,15}$/;
    if (!phoneRegex.test(phone)) {
      fieldErrors.value.phone = 'Please provide a valid Indian mobile number';
      return false;
    }
  }
  return true;
};

const clearFieldError = field => {
  if (fieldErrors.value[field]) {
    delete fieldErrors.value[field];
  }
};

const handleSubmit = async () => {
  saving.value = true;
  success.value = false;
  error.value = '';
  fieldErrors.value = {};

  try {
    // Validate phone number
    if (!validatePhone()) {
      saving.value = false;
      return;
    }

    // Prepare update data - only include fields that can be updated
    const updateData = {
      first_name: form.value.first_name,
      last_name: form.value.last_name,
      email: form.value.email,
      phone: form.value.phone
    };

    // Only include role if user is not Admin
    if (!isAdmin.value) {
      updateData.role = form.value.role;
      updateData.branch_id = form.value.branch_id;
    }

    // Only include password if provided
    if (form.value.password) {
      updateData.password = form.value.password;
    }

    const res = await Users.update(route.params.id, updateData);
    if (res.success) {
      success.value = true;
      showSuccess('User updated successfully!');
      setTimeout(() => router.push('/users?refresh=true'), 1000);
    } else {
      error.value = res.message || 'Failed to update user.';
    }
  } catch (e) {
    console.error('Error updating user:', e);

    // Handle validation errors from backend
    if (e.response?.data?.errors) {
      Object.keys(e.response.data.errors).forEach(field => {
        fieldErrors.value[field] = e.response.data.errors[field];
      });
      showError('Please fix the validation errors');
    } else if (e.response?.data?.fieldErrors) {
      e.response.data.fieldErrors.forEach(fieldError => {
        fieldErrors.value[fieldError.field] = fieldError.message;
      });
      showError('Please fix the validation errors');
    } else {
      error.value = e.response?.data?.message || 'Failed to update user.';
      showError(error.value);
    }
  } finally {
    saving.value = false;
  }
};

onMounted(fetchUser);
</script>

<style scoped>

.btn-primary {
  @apply bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-secondary {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500;
}
</style>
