<template>
  <div class="form-field">
    <label v-if="label" :for="id" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    
    <div class="relative">
      <slot 
        :id="id"
        :class="[
          'input-field',
          { 
            'border-red-500 focus:border-red-500 focus:ring-red-500': hasError,
            'border-green-500 focus:border-green-500 focus:ring-green-500': isValid
          }
        ]"
        :aria-invalid="hasError"
        :aria-describedby="hasError ? `${id}-error` : undefined"
      />
      
      <!-- Error Icon -->
      <div v-if="hasError" class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <svg class="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
      </div>
      
      <!-- Success Icon -->
      <div v-else-if="isValid" class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <svg class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
      </div>
    </div>
    
    <!-- Error Message -->
    <div v-if="hasError" :id="`${id}-error`" class="mt-1 text-sm text-red-600 dark:text-red-400 flex items-start">
      <svg class="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      {{ errorMessage }}
    </div>
    
    <!-- Help Text -->
    <div v-else-if="helpText" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      {{ helpText }}
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  id: string
  label?: string
  required?: boolean
  errorMessage?: string
  helpText?: string
  isValid?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  isValid: false
})

const hasError = computed(() => !!props.errorMessage)
</script>

<style scoped>
.form-field {
  @apply w-full;
}

.input-field {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
         placeholder-gray-500 dark:placeholder-gray-400
         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
         disabled:opacity-50 disabled:cursor-not-allowed
         transition-colors duration-200;
}

.input-field:focus {
  @apply ring-2 ring-blue-500 border-blue-500;
}

.input-field.border-red-500:focus {
  @apply ring-red-500;
}

.input-field.border-green-500:focus {
  @apply ring-green-500;
}
</style> 