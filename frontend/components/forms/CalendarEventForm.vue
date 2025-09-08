<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Date -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Date <span class="text-red-500">*</span>
        </label>
        <input
          v-model="form.date"
          type="date"
          required
          :class="[
            'input-field',
            errors.date ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
          ]"
          @blur="validateField('date')"
          @input="clearError('date')"
        />
        <div v-if="errors.date" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ errors.date }}
        </div>
      </div>

      <!-- Day Type -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Day Type <span class="text-red-500">*</span>
        </label>
        <select
          v-model="form.day_type"
          required
          :class="[
            'input-field',
            errors.day_type ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
          ]"
          @blur="validateField('day_type')"
          @change="clearError('day_type')"
        >
          <option value="">Select Day Type</option>
          <option value="working">Working Day</option>
          <option value="holiday">Holiday</option>
          <option value="weekend">Weekend</option>
          <option value="exam">Exam Day</option>
          <option value="event">Event</option>
        </select>
        <div v-if="errors.day_type" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ errors.day_type }}
        </div>
      </div>

      <!-- Academic Year -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Academic Year <span class="text-red-500">*</span>
        </label>
        <select
          v-model="form.academic_year"
          required
          :class="[
            'input-field',
            errors.academic_year ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
          ]"
          @blur="validateField('academic_year')"
          @change="clearError('academic_year')"
        >
          <option value="">Select Academic Year</option>
          <option v-for="year in academicYears" :key="year.value" :value="year.value">
            {{ year.label }}
          </option>
        </select>
        <div v-if="errors.academic_year" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ errors.academic_year }}
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
        placeholder="Brief description of the event..."
        @blur="validateField('description')"
        @input="clearError('description')"
      ></textarea>
      <div v-if="errors.description" class="mt-1 text-sm text-red-600 dark:text-red-400">
        {{ errors.description }}
      </div>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {{ form.description?.length || 0 }}/255 characters
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
        {{ isSubmitting ? 'Saving...' : (props.event ? 'Update Event' : 'Create Event') }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useToast } from '~/composables/useToast'

// Props
const props = defineProps({
  event: {
    type: Object,
    default: null
  },
  academicYears: {
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
  date: '',
  day_type: 'working',
  description: '',
  academic_year: ''
})

// Validation rules
const validationRules = {
  date: (value) => {
    if (!value) {
      return 'Date is required'
    }
    const date = new Date(value)
    if (isNaN(date.getTime())) {
      return 'Invalid date format'
    }
    return null
  },
  day_type: (value) => {
    if (!value) {
      return 'Day type is required'
    }
    const validTypes = ['working', 'holiday', 'weekend', 'exam', 'event']
    if (!validTypes.includes(value)) {
      return 'Invalid day type selected'
    }
    return null
  },
  academic_year: (value) => {
    if (!value) {
      return 'Academic year is required'
    }
    return null
  },
  description: (value) => {
    if (value && value.length > 255) {
      return 'Description must not exceed 255 characters'
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

const handleSubmit = async () => {
  if (!validateForm()) {
    showToast('Please fix the validation errors', 'error')
    return
  }

  isSubmitting.value = true
  
  try {
    // Prepare form data
    const formData = {
      date: form.date,
      day_type: form.day_type,
      description: form.description.trim() || null,
      academic_year: form.academic_year
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
    date: '',
    day_type: 'working',
    description: '',
    academic_year: ''
  })
  errors.value = {}
}

const populateForm = (event) => {
  if (event) {
    Object.assign(form, {
      date: event.date || '',
      day_type: event.day_type || 'working',
      description: event.description || '',
      academic_year: event.academic_year || ''
    })
  } else {
    resetForm()
  }
}

// Watchers
watch(() => props.event, (newEvent) => {
  populateForm(newEvent)
}, { immediate: true })

// Lifecycle
onMounted(() => {
  populateForm(props.event)
})
</script>

<style scoped>
.input-field {
  @apply block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white sm:text-sm;
}
</style>
