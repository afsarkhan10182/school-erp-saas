<template>
  <div>
    <label v-if="label" :for="id" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    
    <div class="relative">
      <select
        :id="id"
        :value="modelValue"
        @change="$emit('update:modelValue', $event.target.value)"
        :class="[
          'w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white',
          error ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
        ]"
        :disabled="loading"
      >
        <option value="">{{ placeholder || 'Select exam type' }}</option>
        <option 
          v-for="type in examTypes" 
          :key="type.value" 
          :value="type.value"
        >
          {{ type.label }}
        </option>
      </select>
      
      <!-- Loading indicator -->
      <div v-if="loading" class="absolute inset-y-0 right-0 flex items-center pr-3">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
      </div>
      
      <!-- Dropdown arrow -->
      <div v-else class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
    
    <!-- Error message -->
    <p v-if="error" class="mt-1 text-sm text-red-600 dark:text-red-400">
      {{ error }}
    </p>
    
    <!-- Description -->
    <p v-if="description" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      {{ description }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { examTypeApi } from '~/api/academic/exam-types'
import { useToast } from '~/composables/useToast'

// Props
interface Props {
  modelValue?: string
  label?: string
  placeholder?: string
  required?: boolean
  error?: string
  description?: string
  id?: string
  schoolId?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: 'Exam Type',
  placeholder: 'Select exam type',
  required: false,
  error: '',
  description: '',
  id: 'exam-type',
  schoolId: ''
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// Composables
const { showToast } = useToast()

// Reactive state
const loading = ref(false)
const examTypes = ref<Array<{ label: string; value: string; description?: string; weightage?: number }>>([])

// Load exam types from database
const loadExamTypes = async () => {
  try {
    loading.value = true
    
    const response = await examTypeApi.getActive({ 
      school_id: props.schoolId 
    })
    
    const types = response.data || []
    
    examTypes.value = types
      .filter((type: any) => type.is_active)
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((type: any) => ({
        label: type.name,
        value: type.id, // Use ID as value for database relationships
        description: type.description,
        weightage: type.weightage
      }))
      
  } catch (error) {
    console.error('Failed to load exam types:', error)
    showToast('Failed to load exam types', 'error')
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadExamTypes()
})
</script>
