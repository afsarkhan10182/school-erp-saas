<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Subject Name -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Subject Name <span class="text-red-500">*</span>
        </label>
        <input
          v-model="form.name"
          type="text"
          required
          :class="[
            'input-field',
            errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
          ]"
          placeholder="Mathematics"
          @blur="validateField('name')"
          @input="clearError('name')"
        />
        <div v-if="errors.name" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ errors.name }}
        </div>
      </div>

      <!-- Subject Code -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Subject Code <span class="text-red-500">*</span>
        </label>
        <input
          v-model="form.code"
          type="text"
          required
          :class="[
            'input-field',
            errors.code ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
          ]"
          placeholder="MATH101"
          @blur="validateField('code')"
          @input="clearError('code')"
        />
        <div v-if="errors.code" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ errors.code }}
        </div>
      </div>

      <!-- Category -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Category <span class="text-red-500">*</span>
        </label>
        <select
          v-model="form.category"
          required
          :class="[
            'input-field',
            errors.category ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
          ]"
          @blur="validateField('category')"
          @change="clearError('category')"
        >
          <option value="">Select Category</option>
          <option value="core">Core</option>
          <option value="elective">Elective</option>
          <option value="extra_curricular">Extra Curricular</option>
          <option value="language">Language</option>
          <option value="science">Science</option>
          <option value="arts">Arts</option>
          <option value="commerce">Commerce</option>
        </select>
        <div v-if="errors.category" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ errors.category }}
        </div>
      </div>

      <!-- Credit Hours -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Credit Hours
        </label>
        <input
          v-model.number="form.credit_hours"
          type="number"
          min="1"
          max="10"
          :class="[
            'input-field',
            errors.credit_hours ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
          ]"
          placeholder="1"
          @blur="validateField('credit_hours')"
          @input="clearError('credit_hours')"
        />
        <div v-if="errors.credit_hours" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ errors.credit_hours }}
        </div>
      </div>

      <!-- Class (Optional) -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Class (Optional)
        </label>
        <select
          v-model="form.class_id"
          :class="[
            'input-field',
            errors.class_id ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
          ]"
          @blur="validateField('class_id')"
          @change="clearError('class_id')"
        >
          <option value="">All Classes</option>
          <option v-for="cls in classes" :key="cls.value" :value="cls.value">
            {{ cls.label }}
          </option>
        </select>
        <div v-if="errors.class_id" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ errors.class_id }}
        </div>
      </div>

      <!-- Status -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Status
        </label>
        <div class="flex items-center space-x-4">
          <label class="flex items-center">
            <input
              v-model="form.is_active"
              type="radio"
              :value="true"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
          </label>
          <label class="flex items-center">
            <input
              v-model="form.is_active"
              type="radio"
              :value="false"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Inactive</span>
          </label>
        </div>
        <div v-if="errors.is_active" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ errors.is_active }}
        </div>
      </div>
    </div>

    <!-- Description -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Description
      </label>
      <textarea
        v-model="form.description"
        rows="3"
        :class="[
          'input-field',
          errors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        ]"
        placeholder="Brief description of the subject..."
        @blur="validateField('description')"
        @input="clearError('description')"
      ></textarea>
      <div v-if="errors.description" class="mt-1 text-sm text-red-600 dark:text-red-400">
        {{ errors.description }}
      </div>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {{ form.description?.length || 0 }}/500 characters
      </p>
    </div>

    <!-- Form Actions -->
    <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
      <button
        type="button"
        @click="$emit('cancel')"
        class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Cancel
      </button>
      <button
        type="submit"
        :disabled="isSubmitting"
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ isSubmitting ? 'Saving...' : (props.subject ? 'Update Subject' : 'Create Subject') }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useToast } from '~/composables/useToast'

// Props
const props = defineProps({
  subject: {
    type: Object,
    default: null
  },
  classes: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['submit', 'cancel'])

// Composables
const { showToast } = useToast()

// Reactive data
const isSubmitting = ref(false)
const errors = ref({})

// Form data
const form = reactive({
  name: '',
  code: '',
  description: '',
  category: 'core',
  credit_hours: 1,
  is_active: true,
  class_id: ''
})

// Validation rules
const validationRules = {
  name: (value) => {
    if (!value || value.trim().length === 0) {
      return 'Subject name is required'
    }
    if (value.trim().length < 2) {
      return 'Subject name must be at least 2 characters'
    }
    if (value.trim().length > 100) {
      return 'Subject name must not exceed 100 characters'
    }
    return null
  },
  code: (value) => {
    if (!value || value.trim().length === 0) {
      return 'Subject code is required'
    }
    if (value.trim().length < 2) {
      return 'Subject code must be at least 2 characters'
    }
    if (value.trim().length > 20) {
      return 'Subject code must not exceed 20 characters'
    }
    if (!/^[A-Za-z0-9_-]+$/.test(value)) {
      return 'Subject code can only contain letters, numbers, hyphens, and underscores'
    }
    return null
  },
  category: (value) => {
    if (!value) {
      return 'Category is required'
    }
    const validCategories = ['core', 'elective', 'extra_curricular', 'language', 'science', 'arts', 'commerce']
    if (!validCategories.includes(value)) {
      return 'Invalid category selected'
    }
    return null
  },
  credit_hours: (value) => {
    if (value && (value < 1 || value > 10)) {
      return 'Credit hours must be between 1 and 10'
    }
    return null
  },
  description: (value) => {
    if (value && value.length > 500) {
      return 'Description must not exceed 500 characters'
    }
    return null
  },
  class_id: (value) => {
    if (value && !isValidUUID(value)) {
      return 'Invalid class ID format'
    }
    return null
  }
}

// Methods
const validateField = (fieldName) => {
  const value = form[fieldName]
  const error = validationRules[fieldName] ? validationRules[fieldName](value) : null
  
  if (error) {
    errors.value[fieldName] = error
  } else {
    delete errors.value[fieldName]
  }
}

const validateForm = () => {
  const fieldNames = Object.keys(validationRules)
  fieldNames.forEach(fieldName => {
    validateField(fieldName)
  })
  
  return Object.keys(errors.value).length === 0
}

const clearError = (fieldName) => {
  delete errors.value[fieldName]
}

const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

const handleSubmit = async () => {
  if (!validateForm()) {
    showToast('Please fix the validation errors', 'error')
    return
  }

  isSubmitting.value = true
  
  try {
    // Prepare form data
    const formData = {
      name: form.name.trim(),
      code: form.code.trim(),
      description: form.description.trim() || null,
      category: form.category,
      credit_hours: form.credit_hours,
      is_active: form.is_active,
      class_id: form.class_id || null
    }

    emit('submit', formData)
  } catch (error) {
    console.error('Error in form submission:', error)
    showToast('An error occurred while saving', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  Object.assign(form, {
    name: '',
    code: '',
    description: '',
    category: 'core',
    credit_hours: 1,
    is_active: true,
    class_id: ''
  })
  errors.value = {}
}

const populateForm = (subject) => {
  if (subject) {
    Object.assign(form, {
      name: subject.name || '',
      code: subject.code || '',
      description: subject.description || '',
      category: subject.category || 'core',
      credit_hours: subject.credit_hours || 1,
      is_active: subject.is_active !== undefined ? subject.is_active : true,
      class_id: subject.class_id || ''
    })
  } else {
    resetForm()
  }
}

// Watchers
watch(() => props.subject, (newSubject) => {
  populateForm(newSubject)
}, { immediate: true })

// Lifecycle
onMounted(() => {
  populateForm(props.subject)
})
</script>

<style scoped>
.input-field {
  @apply block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white sm:text-sm;
}
</style>
