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
                :class="[
                  'input-field',
                  errors.first_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                ]"
                placeholder="John"
                @blur="validateField('first_name')"
                @input="clearError('first_name')"
              />
              <div v-if="errors.first_name" class="mt-1 text-sm text-red-600 dark:text-red-400">
                {{ errors.first_name }}
              </div>
              <div v-else class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Enter the staff member's first name (2-50 characters)
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.last_name"
                type="text"
                required
                :class="[
                  'input-field',
                  errors.last_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                ]"
                placeholder="Doe"
                @blur="validateField('last_name')"
                @input="clearError('last_name')"
              />
              <div v-if="errors.last_name" class="mt-1 text-sm text-red-600 dark:text-red-400">
                {{ errors.last_name }}
              </div>
              <div v-else class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Enter the staff member's last name (2-50 characters)
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.email"
                type="email"
                required
                :class="[
                  'input-field',
                  errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                ]"
                placeholder="john.doe@example.com"
                @blur="validateField('email')"
                @input="clearError('email')"
              />
              <div v-if="errors.email" class="mt-1 text-sm text-red-600 dark:text-red-400">
                {{ errors.email }}
              </div>
              <div v-else class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Enter a valid email address (will be used for login)
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                v-model="formData.phone"
                type="tel"
                :class="[
                  'input-field',
                  errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                ]"
                placeholder="+1234567890"
                @blur="validateField('phone')"
                @input="clearError('phone')"
              />
              <div v-if="errors.phone" class="mt-1 text-sm text-red-600 dark:text-red-400">
                {{ errors.phone }}
              </div>
              <div v-else class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Enter phone number with country code (optional)
              </div>
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
                :class="[
                  'input-field',
                  errors.role ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                ]"
                @change="validateField('role')"
              >
                <option value="">Select Role</option>
                <option v-for="role in availableRoles" :key="role.value" :value="role.value">
                  {{ role.label }}
                </option>
              </select>
              <div v-if="errors.role" class="mt-1 text-sm text-red-600 dark:text-red-400">
                {{ errors.role }}
              </div>
              <div v-else class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Select the appropriate role for this staff member
              </div>
            </div>
            <div v-if="formData.role === 'teacher'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subjects (Comma separated)
              </label>
              <input
                v-model="formData.subjects"
                type="text"
                :class="[
                  'input-field',
                  errors.subjects ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                ]"
                placeholder="Math, Science, English"
                @blur="validateField('subjects')"
                @input="clearError('subjects')"
              />
              <div v-if="errors.subjects" class="mt-1 text-sm text-red-600 dark:text-red-400">
                {{ errors.subjects }}
              </div>
              <div v-else class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Enter subjects separated by commas (e.g., Math, Science, English)
              </div>
            </div>
            <div v-if="formData.role === 'teacher'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Classes/Grades (Comma separated)
              </label>
              <input
                v-model="formData.grades"
                type="text"
                :class="[
                  'input-field',
                  errors.grades ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                ]"
                placeholder="1, 2, 3"
                @blur="validateField('grades')"
                @input="clearError('grades')"
              />
              <div v-if="errors.grades" class="mt-1 text-sm text-red-600 dark:text-red-400">
                {{ errors.grades }}
              </div>
              <div v-else class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Enter grade levels separated by commas (e.g., 1, 2, 3)
              </div>
            </div>
          </div>
        </div>

        <!-- Login Credentials -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Login Credentials</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                v-model="formData.password"
                type="password"
                :class="[
                  'input-field',
                  errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                ]"
                placeholder="••••••••"
                @blur="validateField('password')"
                @input="clearError('password')"
              />
              <div v-if="errors.password" class="mt-1 text-sm text-red-600 dark:text-red-400">
                {{ errors.password }}
              </div>
              <div v-else class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                <div class="font-medium mb-1">Password Requirements:</div>
                <ul class="space-y-1">
                  <li :class="passwordValidation.length ? 'text-green-600' : 'text-gray-500'">
                    ✓ At least 8 characters
                  </li>
                  <li :class="passwordValidation.hasLowercase ? 'text-green-600' : 'text-gray-500'">
                    ✓ Contains lowercase letter
                  </li>
                  <li :class="passwordValidation.hasUppercase ? 'text-green-600' : 'text-gray-500'">
                    ✓ Contains uppercase letter
                  </li>
                  <li :class="passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-500'">
                    ✓ Contains number
                  </li>
                  <li :class="passwordValidation.hasSpecial ? 'text-green-600' : 'text-gray-500'">
                    ✓ Contains special character (!@#$%^&*)
                  </li>
                </ul>
                <div class="mt-2 text-blue-600 dark:text-blue-400">
                  Leave blank to auto-generate a secure password
                </div>
              </div>
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
                :class="[
                  'input-field',
                  errors.address ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                ]"
                placeholder="123 Main St, City, Country"
                @blur="validateField('address')"
                @input="clearError('address')"
              ></textarea>
              <div v-if="errors.address" class="mt-1 text-sm text-red-600 dark:text-red-400">
                {{ errors.address }}
              </div>
              <div v-else class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Enter the staff member's address (optional)
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Joining Date
              </label>
              <input
                v-model="formData.joining_date"
                type="date"
                :class="[
                  'input-field',
                  errors.joining_date ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                ]"
                @blur="validateField('joining_date')"
                @input="clearError('joining_date')"
              />
              <div v-if="errors.joining_date" class="mt-1 text-sm text-red-600 dark:text-red-400">
                {{ errors.joining_date }}
              </div>
              <div v-else class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Select the date when the staff member joined (optional)
              </div>
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
            :disabled="isSubmitting || !isFormValid"
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
import { useToast } from '~/composables/useToast';
import { apiClient } from '~/utils/api';

const router = useRouter();
const authStore = useAuthStore();
const { showSuccess, showError } = useToast();
const isSubmitting = ref(false);

// Available roles for school admins to assign
const availableRoles = [
  { value: 'teacher', label: 'Teacher' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'librarian', label: 'Librarian' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'school_admin', label: 'School Admin' },
];

// Form data
const formData = ref({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  role: '',
  password: '',
  address: '',
  joining_date: new Date().toISOString().split('T')[0],
  subjects: '',
  grades: '',
  school_id: authStore.user?.school_id || null,
  created_by: authStore.user?.id || null,
});

// Validation errors
const errors = ref({});

// Validation rules
const validationRules = {
  first_name: (value) => {
    if (!value) return 'First name is required';
    if (value.length < 2) return 'First name must be at least 2 characters';
    if (value.length > 50) return 'First name must be less than 50 characters';
    if (!/^[a-zA-Z\s]+$/.test(value)) return 'First name can only contain letters and spaces';
    return null;
  },
  last_name: (value) => {
    if (!value) return 'Last name is required';
    if (value.length < 2) return 'Last name must be at least 2 characters';
    if (value.length > 50) return 'Last name must be less than 50 characters';
    if (!/^[a-zA-Z\s]+$/.test(value)) return 'Last name can only contain letters and spaces';
    return null;
  },
  email: (value) => {
    if (!value) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return null;
  },
  phone: (value) => {
    if (value && !/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
      return 'Please enter a valid phone number';
    }
    return null;
  },
  role: (value) => {
    if (!value) return 'Role is required';
    if (!availableRoles.find(role => role.value === value)) {
      return 'Please select a valid role';
    }
    return null;
  },
  password: (value) => {
    if (value) {
      if (value.length < 8) return 'Password must be at least 8 characters';
      if (!/(?=.*[a-z])/.test(value)) return 'Password must contain at least one lowercase letter';
      if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain at least one uppercase letter';
      if (!/(?=.*\d)/.test(value)) return 'Password must contain at least one number';
      if (!/(?=.*[!@#$%^&*])/.test(value)) return 'Password must contain at least one special character (!@#$%^&*)';
    }
    return null;
  },
  subjects: (value) => {
    if (formData.value.role === 'teacher' && value) {
      const subjects = value.split(',').map(s => s.trim()).filter(Boolean);
      if (subjects.length === 0) return 'Please enter at least one subject';
      if (subjects.some(s => s.length < 2)) return 'Each subject must be at least 2 characters';
    }
    return null;
  },
  grades: (value) => {
    if (formData.value.role === 'teacher' && value) {
      const grades = value.split(',').map(g => g.trim()).filter(Boolean);
      if (grades.length === 0) return 'Please enter at least one grade';
      if (grades.some(g => !/^\d+$/.test(g))) return 'Grades must be numbers only';
    }
    return null;
  },
  joining_date: (value) => {
    if (value) {
      const date = new Date(value);
      if (isNaN(date.getTime())) return 'Please enter a valid date';
      if (date > new Date()) return 'Joining date cannot be in the future';
    }
    return null;
  }
};

// Password validation state
const passwordValidation = computed(() => {
  const password = formData.value.password;
  if (!password) return {};
  
  return {
    length: password.length >= 8,
    hasLowercase: /(?=.*[a-z])/.test(password),
    hasUppercase: /(?=.*[A-Z])/.test(password),
    hasNumber: /(?=.*\d)/.test(password),
    hasSpecial: /(?=.*[!@#$%^&*])/.test(password)
  };
});

// Form validation
const isFormValid = computed(() => {
  const requiredFields = ['first_name', 'last_name', 'email', 'role'];
  return requiredFields.every(field => {
    const error = validationRules[field](formData.value[field]);
    return !error;
  });
});

// Validate a specific field
const validateField = (fieldName) => {
  if (validationRules[fieldName]) {
    const error = validationRules[fieldName](formData.value[fieldName]);
    if (error) {
      errors.value[fieldName] = error;
    } else {
      delete errors.value[fieldName];
    }
  }
};

// Clear error for a field
const clearError = (fieldName) => {
  delete errors.value[fieldName];
};

// Validate all fields
const validateForm = () => {
  Object.keys(validationRules).forEach(field => {
    validateField(field);
  });
  return Object.keys(errors.value).length === 0;
};

// Handle form submission
const handleSubmit = async () => {
  if (isSubmitting.value) return;
  
  // Validate form before submission
  if (!validateForm()) {
    showError('Please fix the validation errors before submitting');
    return;
  }
  
  isSubmitting.value = true;
  
  try {
    // Prepare the data
    const payload = { ...formData.value };
    
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
    const response = await apiClient.users.create(payload);
    
    // Show success message
    showSuccess('Staff member added successfully!');
    
    // Redirect to users list
    router.push('/users');
  } catch (error) {
    console.error('Error creating staff member:', error);
    
    // Handle specific validation errors from backend
    if (error.response?.data?.errors) {
      Object.keys(error.response.data.errors).forEach(field => {
        errors.value[field] = error.response.data.errors[field];
      });
      showError('Please fix the validation errors');
    } else {
      showError(error.response?.data?.message || 'Failed to add staff member');
    }
  } finally {
    isSubmitting.value = false;
  }
};

// Generate a random password that meets validation requirements
const generateRandomPassword = () => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  // Ensure at least one character from each required category
  let password = '';
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest with random characters
  const allChars = lowercase + uppercase + numbers + symbols;
  for (let i = 4; i < 10; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};
</script>

<style scoped>
.input-field {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200;
}

.input-field:focus {
  @apply ring-2 ring-offset-2;
}
</style>
