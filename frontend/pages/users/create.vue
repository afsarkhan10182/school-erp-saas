<template>
  <div class="container mx-auto py-8 max-w-2xl">
    <h1 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Add New Staff Member</h1>
    
    <form @submit.prevent="handleSubmit" class="space-y-6 bg-white dark:bg-gray-800 p-6 rounded shadow">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">
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
        </div>
        
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">
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
        </div>
        
        <!-- Login Details (Email and Password in one line) -->
        <div class="col-span-2">
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">
            Login Details <span class="text-red-500">*</span>
          </label>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                v-model="formData.email"
                type="email"
                required
                :class="[
                  'input-field',
                  errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                ]"
                placeholder="Email address"
                @blur="validateField('email')"
                @input="clearError('email')"
              />
              <div v-if="errors.email" class="mt-1 text-sm text-red-600 dark:text-red-400">
                {{ errors.email }}
              </div>
            </div>
            <div>
              <PasswordInput
                v-model="formData.password"
                :error="!!errors.password"
                placeholder="Password"
                @blur="validateField('password')"
                @input="clearError('password')"
              />
              <div v-if="errors.password" class="mt-1 text-sm text-red-600 dark:text-red-400">
                {{ errors.password }}
              </div>
              <div v-else class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Leave blank to auto-generate a secure password
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Phone</label>
          <input
            v-model="formData.phone"
            type="tel"
            :class="[
              'input-field',
              errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            ]"
            placeholder="9898989898"
            @input="handlePhoneInput"
            @blur="validateField('phone')"
          />
          <div v-if="errors.phone" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ errors.phone }}
          </div>
          </div>
        
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">
            Role <span class="text-red-500">*</span>
          </label>
          <select
            v-model="formData.role"
            required
            :class="[
              'input-field',
              errors.role ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            ]"
            @change="onRoleChange"
          >
            <option value="">Select Role</option>
            <option v-for="role in availableRoles" :key="role.value" :value="role.value">
              {{ role.label }}
            </option>
          </select>
          <div v-if="errors.role" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ errors.role }}
          </div>
        </div>
        
        <!-- School Selection (Super Admin only) -->
        <div v-if="authStore.user?.role === 'super_admin'">
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">
            School <span class="text-red-500">*</span>
          </label>
          <select
            v-model="formData.school_id"
            required
            :class="[
              'input-field',
              errors.school_id ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            ]"
            @change="onSchoolChange"
            :disabled="isLoadingSchools"
          >
            <option value="">{{ isLoadingSchools ? 'Loading schools...' : 'Select School' }}</option>
            <option v-for="school in schools" :key="school.id" :value="school.id">
              {{ school.name }}
            </option>
          </select>
          <div v-if="errors.school_id" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ errors.school_id }}
          </div>
        </div>
        
        <!-- Branch Selection (Super Admin & School Admin) -->
        <div v-if="(authStore.user?.role === 'super_admin' && formData.school_id) || authStore.user?.role === 'school_admin'">
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">
            Branch <span class="text-red-500">*</span>
          </label>
          <select
            v-model="formData.branch_id"
            required
            :class="[
              'input-field',
              errors.branch_id ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            ]"
            @change="onBranchChange"
            :disabled="isLoadingBranches"
          >
            <option value="">{{ isLoadingBranches ? 'Loading branches...' : 'Select Branch' }}</option>
            <option v-for="branch in branches" :key="branch.id" :value="branch.id">
              {{ branch.name }}
            </option>
          </select>
          <div v-if="errors.branch_id" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ errors.branch_id }}
          </div>
        </div>
        

      </div>
      
      <div class="flex justify-end gap-3">
        <NuxtLink to="/users" class="btn-secondary">Cancel</NuxtLink>
        <button
          type="submit"
          :disabled="isSubmitting || !isFormValid"
          class="btn-primary"
          :class="{ 'opacity-50 cursor-not-allowed': isSubmitting || !isFormValid }"
        >
          <span v-if="isSubmitting">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating Staff Member...
          </span>
          <span v-else>Save Staff Member</span>
        </button>
      </div>
    </form>
    
    <!-- Generated Password Modal -->
    <div v-if="showPasswordModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">User Created Successfully</h3>
          <div class="space-y-4">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Email: <span class="font-medium text-gray-900 dark:text-white">{{ createdUserEmail }}</span></p>
              <p class="text-sm text-gray-600 dark:text-gray-400">Password has been auto-generated:</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded border">
              <div class="flex items-center justify-between">
                <code class="text-sm font-mono text-gray-900 dark:text-white bg-white dark:bg-gray-800 px-2 py-1 rounded border select-all">
                  {{ generatedPassword }}
                </code>
                <button
                  @click="copyPassword"
                  class="ml-2 p-1 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                  title="Copy password"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                </button>
              </div>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              ⚠️ This password will not be shown again. Please save it securely.
            </p>
          </div>
          <div class="mt-6 flex justify-end">
            <button
              @click="closePasswordModal"
              class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '~/stores/auth';
import { useBranches } from '~/composables/useBranches';
import { useSchools } from '~/composables/useSchools';
import { useToast } from '~/composables/useToast';
import PasswordInput from '~/components/PasswordInput.vue';
import EnhancedDropdown from '~/components/EnhancedDropdown.vue';

const authStore = useAuthStore();
const { showError, showSuccess } = useToast();

// Access control - only Super Admin and School Admin can access user management
const user = authStore.user;
if (user?.role !== 'super_admin' && user?.role !== 'school_admin') {
  showError('Access denied. Only Super Admin and School Admin can manage users.');
  await navigateTo('/dashboard');
}

const router = useRouter();
const isSubmitting = ref(false);
const showPasswordModal = ref(false);
const generatedPassword = ref('');
const createdUserEmail = ref('');

// Data for schools and branches
const schools = ref([]);
const branches = ref([]);
const isLoadingSchools = ref(false);
const isLoadingBranches = ref(false);

// Available roles based on current user's role
const availableRoles = computed(() => {
  const currentUserRole = authStore.user?.role;
  
  if (!currentUserRole) {
    return [];
  }
  
  if (currentUserRole === 'super_admin') {
    return [
      { value: 'school_admin', label: 'School Admin' },
      { value: 'teacher', label: 'Teacher' },
      { value: 'accountant', label: 'Accountant' },
      { value: 'librarian', label: 'Librarian' },
      { value: 'receptionist', label: 'Receptionist' },
    ];
  } else if (currentUserRole === 'school_admin') {
    return [
      { value: 'branch_admin', label: 'Branch Admin' },
      { value: 'teacher', label: 'Teacher' },
      { value: 'accountant', label: 'Accountant' },
      { value: 'librarian', label: 'Librarian' },
      { value: 'receptionist', label: 'Receptionist' },
    ];
  }
  
  return [];
});

// Form data
const formData = ref({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  role: '',
  password: '',
  school_id: authStore.user?.school_id || '',
  branch_id: '',
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
    if (value && value.trim() !== '') {
      // Remove all non-digit characters for validation
      const digitsOnly = value.replace(/[^\d]/g, '');
      if (digitsOnly.length !== 10) {
        return 'Mobile number must be 10 digits';
      }
      // Check if it starts with a valid Indian mobile pattern (6, 7, 8, 9)
      const phoneRegex = /^[\+]?[6-9][\d\s\-\(\)]{9,15}$/;
      if (!phoneRegex.test(value)) {
        return 'Please enter a valid Indian mobile number';
      }
    }
    return null;
  },
  role: (value) => {
    if (!value) return 'Role is required';
    if (!availableRoles.value || !Array.isArray(availableRoles.value) || !availableRoles.value.find(role => role.value === value)) {
      return 'Please select a valid role';
    }
    return null;
  },
  password: (value) => {
    if (value && value.trim() !== '') {
      if (value.length < 8) return 'Password must be at least 8 characters';
      if (!/(?=.*[a-z])/.test(value)) return 'Password must contain at least one lowercase letter';
      if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain at least one uppercase letter';
      if (!/(?=.*\d)/.test(value)) return 'Password must contain at least one number';
      if (!/(?=.*[!@#$%^&*])/.test(value)) return 'Password must contain at least one special character (!@#$%^&*)';
    }
    return null;
  },

  school_id: (value) => {
    if (authStore.user?.role === 'super_admin') {
      if (!value) return 'School selection is required';
    }
    return null;
  },
  branch_id: (value) => {
    if ((authStore.user?.role === 'super_admin' && formData.value.school_id) || authStore.user?.role === 'school_admin') {
      if (!value) return 'Branch selection is required';
    }
    return null;
  }
};



// Form validation
const isFormValid = computed(() => {
  // Don't validate if auth store is not ready
  if (!authStore.user?.role) {
    return false;
  }
  
  const requiredFields = ['first_name', 'last_name', 'email', 'role'];
  
  // Add conditional required fields based on role only if auth store is ready
  if (authStore.user?.role === 'super_admin') {
    requiredFields.push('school_id');
    if (formData.value.school_id) {
      requiredFields.push('branch_id');
    }
  }
  
  if (authStore.user?.role === 'school_admin') {
    requiredFields.push('branch_id');
  }
  
  // Check if all required fields have values
  const hasAllRequiredValues = requiredFields.every(field => {
    const value = formData.value[field];
    return value && value.toString().trim() !== '';
  });
  
  // Also check if there are any validation errors
  const hasNoValidationErrors = requiredFields.every(field => {
    const error = validationRules[field](formData.value[field]);
    return !error;
  });
  
  return hasAllRequiredValues && hasNoValidationErrors;
});

// Validate a specific field
const validateField = (fieldName) => {
  if (validationRules[fieldName] && authStore.user?.role) {
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

// Handle phone input
const handlePhoneInput = (event) => {
  // Allow digits, spaces, dashes, plus sign, and parentheses
  const value = event.target.value;
  const cleaned = value.replace(/[^\d\s\-\(\)\+]/g, '');
  formData.value.phone = cleaned;
  clearError('phone');
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
    
    // Remove empty phone field to avoid validation issues
    if (!payload.phone || payload.phone.trim() === '') {
      delete payload.phone;
    }
    
    // If password is not provided, remove it so backend can auto-generate
    if (!payload.password || payload.password.trim() === '') {
      delete payload.password;
    }
    
    // Auto-set school_id and branch_id based on user role
    if (authStore.user?.role === 'school_admin') {
      payload.school_id = authStore.user.school_id;
    }
    
    if (authStore.user?.role === 'branch_admin') {
      payload.school_id = authStore.user.school_id;
      payload.branch_id = authStore.user.branch_id;
    }
    
    // Send the request
    const response = await apiClient.users.create(payload);
    
    // Check if password was auto-generated
    if (response.generatedPassword) {
      // Store the generated password and email, then show modal
      generatedPassword.value = response.generatedPassword;
      createdUserEmail.value = formData.value.email;
      showPasswordModal.value = true;
    } else {
      // Show regular success message
      showSuccess('Staff member added successfully!');
      // Redirect to users list
      router.push('/users');
    }
  } catch (error) {
    console.error('Error creating staff member:', error);
    
    // Handle specific validation errors from backend
    if (error.response?.data?.errors) {
      Object.keys(error.response.data.errors).forEach(field => {
        // Handle cases where field name might be "undefined"
        let fieldName = field;
        if (field === 'undefined') {
          const errorMessage = error.response.data.errors[field];
          // Determine the correct field based on error message
          if (errorMessage.includes('Password must contain') || errorMessage.includes('password')) {
            fieldName = 'password';
          } else if (errorMessage.includes('phone') || errorMessage.includes('Phone')) {
            fieldName = 'phone';
          } else if (errorMessage.includes('email') || errorMessage.includes('Email')) {
            fieldName = 'email';
          } else if (errorMessage.includes('first_name') || errorMessage.includes('First name')) {
            fieldName = 'first_name';
          } else if (errorMessage.includes('last_name') || errorMessage.includes('Last name')) {
            fieldName = 'last_name';
          } else if (errorMessage.includes('role')) {
            fieldName = 'role';
          } else {
            fieldName = 'phone'; // Default fallback
          }
        }
        errors.value[fieldName] = error.response.data.errors[field];
      });
      showError('Please fix the validation errors');
    } else if (error.response?.data?.fieldErrors) {
      // Handle fieldErrors array format
      error.response.data.fieldErrors.forEach(fieldError => {
        let fieldName = fieldError.field;
        if (fieldError.field === 'undefined') {
          const errorMessage = fieldError.message;
          // Determine the correct field based on error message
          if (errorMessage.includes('Password must contain') || errorMessage.includes('password')) {
            fieldName = 'password';
          } else if (errorMessage.includes('phone') || errorMessage.includes('Phone')) {
            fieldName = 'phone';
          } else if (errorMessage.includes('email') || errorMessage.includes('Email')) {
            fieldName = 'email';
          } else if (errorMessage.includes('first_name') || errorMessage.includes('First name')) {
            fieldName = 'first_name';
          } else if (errorMessage.includes('last_name') || errorMessage.includes('Last name')) {
            fieldName = 'last_name';
          } else if (errorMessage.includes('role')) {
            fieldName = 'role';
          } else {
            fieldName = 'phone'; // Default fallback
          }
        }
        errors.value[fieldName] = fieldError.message;
      });
      showError('Please fix the validation errors');
    } else {
      showError(error.response?.data?.message || 'Failed to add staff member');
    }
  } finally {
    isSubmitting.value = false;
  }
};

// Fetch schools (for super admin)
const fetchSchools = async () => {
  if (authStore.user?.role !== 'super_admin') return;
  
  isLoadingSchools.value = true;
  try {
    const response = await apiClient.schools.getAll();
    // The API returns { success: true, data: { schools: [...], pagination: {...} } }
    schools.value = response.data?.schools || response.data?.data?.schools || [];
  } catch (error) {
    console.error('Error fetching schools:', error);
    showError('Failed to fetch schools');
  } finally {
    isLoadingSchools.value = false;
  }
};

// Fetch branches (for school admin and super admin when school is selected)
const fetchBranches = async (schoolId = null) => {
  const targetSchoolId = schoolId || authStore.user?.school_id;
  
  if (!targetSchoolId) {
    return;
  }
  
  isLoadingBranches.value = true;
  try {
            const response = await apiClient.branches.getForDropdown({ school_id: targetSchoolId });
    
    // The dropdown API returns { success: true, data: [...] }
    branches.value = response.data || [];
  } catch (error) {
    console.error('Error fetching branches:', error);
    showError('Failed to fetch branches');
  } finally {
    isLoadingBranches.value = false;
  }
};

// Handle role change
const onRoleChange = () => {
  // Only clear school_id for super admin, keep branch_id as is
  if (authStore.user?.role === 'super_admin') {
    formData.value.school_id = '';
    formData.value.branch_id = '';
  }
  
  // Validate the role field only if auth store is ready
  if (authStore.user?.role) {
    validateField('role');
  }
  
  // Auto-set school_id for non-super admins
  if (authStore.user?.role !== 'super_admin') {
    formData.value.school_id = authStore.user?.school_id;
  }
};

// Handle school change
const onSchoolChange = async () => {
  formData.value.branch_id = '';
  validateField('school_id');
  
  // Fetch branches for the selected school
  if (formData.value.school_id) {
    await fetchBranches(formData.value.school_id);
  }
};

// Handle branch change
const onBranchChange = () => {
  validateField('branch_id');
};

// Copy password to clipboard
const copyPassword = async () => {
  try {
    await navigator.clipboard.writeText(generatedPassword.value);
    showSuccess('Password copied to clipboard!');
  } catch (error) {
    console.error('Failed to copy password:', error);
    showError('Failed to copy password to clipboard');
  }
};

// Close password modal and redirect
const closePasswordModal = () => {
  showPasswordModal.value = false;
  generatedPassword.value = '';
  createdUserEmail.value = '';
  // Navigate to users list and trigger a refresh with a small delay to ensure cache is cleared
  setTimeout(() => {
    router.push('/users?refresh=true');
  }, 500);
};



// Initialize component
onMounted(async () => {
  // Auto-set school_id for non-super admins
  if (authStore.user?.role !== 'super_admin') {
    formData.value.school_id = authStore.user?.school_id;
  }
  
  // Fetch schools for super admin
  if (authStore.user?.role === 'super_admin') {
    await fetchSchools();
  }
  
  // Fetch branches for school admin
  if (authStore.user?.role === 'school_admin') {
    await fetchBranches();
  }
  
  // Ensure branch_id is empty string initially
  formData.value.branch_id = '';
});
</script>

<style scoped>
.input-field {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200;
}

.input-field:focus {
  @apply ring-2 ring-offset-2;
}
</style>
