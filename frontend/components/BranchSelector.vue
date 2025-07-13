<template>
  <div class="branch-selector">
    <label class="block text-gray-700 text-sm font-medium mb-2">
      Select Branch
    </label>
    <div class="relative">
      <select
        :value="modelValue"
        @change="handleBranchChange"
        class="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
        :disabled="disabled || loading"
      >
        <option value="" disabled>
          {{ loading ? 'Loading branches...' : 'Select a branch' }}
        </option>
        <option
          v-for="branch in branches"
          :key="branch.id"
          :value="branch.id"
        >
          {{ branch.name }} ({{ branch.code }})
        </option>
      </select>
      
      <!-- Loading spinner -->
      <div
        v-if="loading"
        class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
      >
        <svg class="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      
      <!-- Dropdown arrow -->
      <div
        v-else
        class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
      >
        <svg class="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
    
    <!-- Selected branch info -->
    <div
      v-if="selectedBranch"
      class="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md"
    >
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-blue-800">
            {{ selectedBranch.name }}
          </p>
          <p class="text-sm text-blue-600">
            Code: {{ selectedBranch.code }}
          </p>
        </div>
      </div>
    </div>
    
    <!-- Error message -->
    <div
      v-if="error"
      class="mt-2 p-3 bg-red-50 border border-red-200 rounded-md"
    >
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-800">
            {{ error }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: null
  },
  branches: {
    type: Array,
    default: () => []
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'branch-changed'])

// Computed property to get the selected branch object
const selectedBranch = computed(() => {
  if (!props.modelValue) return null
  return props.branches.find(branch => branch.id === props.modelValue)
})

// Handle branch selection change
const handleBranchChange = (event) => {
  const selectedValue = event.target.value
  const selectedId = selectedValue === '' ? null : selectedValue
  
  emit('update:modelValue', selectedId)
  
  // Find the selected branch object and emit it
  const branchObj = props.branches.find(branch => branch.id === selectedId)
  emit('branch-changed', branchObj)
}

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    const branchObj = props.branches.find(branch => branch.id === newValue)
    emit('branch-changed', branchObj)
  }
})
</script>

<style scoped>
.branch-selector select:disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
}

.branch-selector select:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Custom select arrow styling */
.branch-selector select {
  appearance: none;
  background-image: none;
}

/* Hover effects */
.branch-selector select:hover:not(:disabled) {
  border-color: #d1d5db;
}

/* Animation for loading state */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
