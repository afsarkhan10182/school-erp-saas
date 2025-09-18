<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <span class="ml-3 text-gray-600 dark:text-gray-400">Loading school settings...</span>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Basic School Information -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
        <div class="space-y-4">
          <div>
            <label class="block font-medium mb-2 text-gray-700 dark:text-gray-300"
              >School Name *</label
            >
            <input
              v-model="schoolInfo.name"
              type="text"
              required
              :class="['input-field', fieldErrors.name ? 'border-red-500' : '']"
              placeholder="Enter your school name"
            />
            <p v-if="fieldErrors.name" class="mt-1 text-xs text-red-600">
              {{ fieldErrors.name }}
            </p>
          </div>
          <div>
            <label class="block font-medium mb-2 text-gray-700 dark:text-gray-300"
              >School Address</label
            >
            <textarea
              v-model="contactInfo.address"
              rows="3"
              class="input-field"
              placeholder="Enter complete school address"
            ></textarea>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block font-medium mb-2 text-gray-700 dark:text-gray-300"
                >Phone Number</label
              >
              <input
                v-model="contactInfo.phone"
                type="text"
                :class="['input-field', fieldErrors.phone ? 'border-red-500' : '']"
                placeholder="+1 (555) 123-4567"
              />
              <p v-if="fieldErrors.phone" class="mt-1 text-xs text-red-600">
                {{ fieldErrors.phone }}
              </p>
            </div>
            <div>
              <label class="block font-medium mb-2 text-gray-700 dark:text-gray-300"
                >Email Address</label
              >
              <input
                v-model="contactInfo.email"
                type="email"
                :class="['input-field', fieldErrors.email ? 'border-red-500' : '']"
                placeholder="info@school.com"
              />
              <p v-if="fieldErrors.email" class="mt-1 text-xs text-red-600">
                {{ fieldErrors.email }}
              </p>
            </div>
          </div>

          <!-- School Logo -->
          <div>
            <label class="block font-medium mb-2 text-gray-700 dark:text-gray-300"
              >School Logo</label
            >
            <div class="flex items-center gap-4">
              <input
                type="file"
                @change="handleSchoolLogoUpload"
                accept="image/*"
                class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <div v-if="schoolInfo.logo" class="flex-shrink-0">
                <img
                  :src="
                    schoolInfo.logo.startsWith('data:')
                      ? schoolInfo.logo
                      : getLogoUrl(
                          schoolInfo.logo,
                          authStore.currentSchool?.code || authStore.user?.school?.code
                        )
                  "
                  alt="School Logo"
                  class="w-16 h-16 object-cover rounded border-2 border-gray-200"
                />
              </div>
              <div
                v-else
                class="flex-shrink-0 w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded border-2 border-gray-200 flex items-center justify-center"
              >
                <span class="text-xs text-gray-400">No logo</span>
              </div>
            </div>
            <p class="text-sm text-gray-500 mt-1">Upload your school's main logo</p>
          </div>
        </div>
      </div>

      <!-- Error Summary -->
      <div v-if="hasErrors" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 class="text-sm font-medium text-red-800 mb-2">Please correct the following errors:</h4>
        <ul class="text-sm text-red-700 space-y-1">
          <li v-for="(error, field) in fieldErrors" :key="field">• {{ error }}</li>
        </ul>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end">
        <button @click="saveSettings" class="btn-primary" :disabled="isSaving || hasErrors">
          <span
            v-if="isSaving"
            class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
          ></span>
          {{ isSaving ? 'Saving...' : 'Save School Settings' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, onUnmounted, watch } from 'vue';
import { Settings } from '~/api/administration/settings';
import { useAuthStore } from '~/stores/auth';
import { getLogoUrl } from '~/utils/image';
import { useFormValidation } from '~/composables/useFormValidation';
import { validationRules, validateForm } from '~/utils/validators';

// Props
const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['save', 'update:loading']);

// Composables
const authStore = useAuthStore();

// Validation
const { fieldErrors, hasErrors, clearErrors, clearFieldError, setFieldError, handleApiError } =
  useFormValidation();

// Reactive data
const schoolInfo = reactive({
  name: '',
  type: '',
  establishmentYear: '',
  principalName: '',
  principalEmail: '',
  logo: ''
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

const isSaving = ref(false);
const isLoading = ref(false);

// Methods
const loadSchoolSettings = async (forceRefresh = false) => {
  try {
    isLoading.value = true;

    // Clear cache if force refresh is requested
    if (forceRefresh) {
      const { useSchoolSettings } = await import('~/utils/settings');
      const { clearCache } = useSchoolSettings();
      clearCache();
    }

    const response = await Settings.getSchoolSettings();

    if (response.success && response.data) {
      const data = response.data;

      // Load school info
      if (data.schoolInfo) {
        Object.assign(schoolInfo, {
          name: data.schoolInfo.name || authStore.currentSchool?.name || '',
          type: data.schoolInfo.type || '',
          establishmentYear: data.schoolInfo.establishmentYear || '',
          principalName: data.schoolInfo.principalName || '',
          principalEmail: data.schoolInfo.principalEmail || '',
          logo: data.schoolInfo.logo || ''
        });

        // Clear any file reference when loading saved data
        delete schoolInfo.logoFile;
      }

      // Load contact info
      if (data.contactInfo) {
        Object.assign(contactInfo, {
          phone: data.contactInfo.phone || '',
          email: data.contactInfo.email || '',
          website: data.contactInfo.website || '',
          address: data.contactInfo.address || ''
        });
      }

      // Load operational settings
      if (data.operationalSettings) {
        Object.assign(operationalSettings, {
          defaultCurrency: data.operationalSettings.defaultCurrency || 'USD',
          timezone: data.operationalSettings.timezone || 'UTC',
          dateFormat: data.operationalSettings.dateFormat || 'MM/DD/YYYY'
        });
      }
    }
  } catch (error) {
    console.error('Error loading school settings:', error);
  } finally {
    isLoading.value = false;
  }
};

const handleSchoolLogoUpload = event => {
  const file = event.target.files[0];
  if (file) {
    schoolInfo.logoFile = file;
    // Create preview URL for immediate display
    const reader = new FileReader();
    reader.onload = e => {
      schoolInfo.logo = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

// Validation schema
const validationSchema = {
  name: [
    val => validationRules.required(val, 'School Name'),
    val => validationRules.minLength(val, 2, 'School Name')
  ],
  email: [val => validationRules.email(val)],
  phone: [val => validationRules.phone(val)]
};

const saveSettings = async () => {
  // Clear previous errors
  clearErrors();

  // Validate form data
  const errors = validateForm(schoolInfo, validationSchema);
  const contactErrors = validateForm(contactInfo, {
    email: [val => validationRules.email(val)],
    phone: [val => validationRules.phone(val)]
  });

  // Combine all errors
  const allErrors = { ...errors, ...contactErrors };

  if (Object.keys(allErrors).length > 0) {
    // Set field errors
    Object.entries(allErrors).forEach(([field, message]) => {
      setFieldError(field, message);
    });
    return;
  }

  isSaving.value = true;
  try {
    const settingsData = {
      schoolInfo,
      contactInfo,
      operationalSettings
    };
    emit('save', settingsData);
  } catch (error) {
    handleApiError(error);
  } finally {
    isSaving.value = false;
  }
};

// Real-time validation with debouncing
const validationTimeouts = ref({});

const validateField = (field, value) => {
  // Clear existing timeout for this field
  if (validationTimeouts.value[field]) {
    clearTimeout(validationTimeouts.value[field]);
  }

  // Set new timeout for debounced validation
  validationTimeouts.value[field] = setTimeout(() => {
    const rules = validationSchema[field];
    if (rules) {
      const error = validateForm({ [field]: value }, { [field]: rules })[field];
      if (error) {
        setFieldError(field, error);
      } else {
        clearFieldError(field);
      }
    }
  }, 300); // 300ms debounce
};

// Watch for changes in form fields and validate in real-time
watch(
  () => schoolInfo.name,
  newValue => validateField('name', newValue)
);
watch(
  () => contactInfo.email,
  newValue => validateField('email', newValue)
);
watch(
  () => contactInfo.phone,
  newValue => validateField('phone', newValue)
);

// Load data on mount
onMounted(() => {
  loadSchoolSettings();
});

// Cleanup timeouts on unmount
onUnmounted(() => {
  Object.values(validationTimeouts.value).forEach(timeout => {
    if (timeout) clearTimeout(timeout);
  });
});

// Expose methods for parent component
defineExpose({
  schoolInfo,
  contactInfo,
  operationalSettings,
  saveSettings,
  loadSchoolSettings
});
</script>
