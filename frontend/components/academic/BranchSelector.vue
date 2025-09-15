<template>
  <div class="branch-selector">
    <label class="block text-gray-300 text-sm font-medium mb-2"> Select Branch </label>
    <div class="relative">
      <select
        :value="modelValue"
        @change="handleBranchChange"
        class="block w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-white placeholder-gray-400"
        :disabled="disabled || loading"
        :class="{
          'opacity-50 cursor-not-allowed': disabled || loading,
          'hover:border-gray-500': !disabled && !loading
        }"
        style="
          appearance: none;
          background-image: url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%2394a3b8%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27m6 8 4 4 4-4%27/%3e%3c/svg%3e');
          background-position: right 12px center;
          background-repeat: no-repeat;
          background-size: 16px;
          padding-right: 40px;
        "
      >
        <option value="" disabled class="bg-gray-800 text-white">
          {{ loading ? 'Loading branches...' : 'Select a branch' }}
        </option>
        <option
          v-for="branch in branches"
          :key="branch.id"
          :value="branch.id"
          class="bg-gray-800 text-white"
        >
          {{ branch.name }} ({{ branch.code }})
        </option>
      </select>

      <!-- Loading spinner -->
      <div
        v-if="loading"
        class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none"
      >
        <svg
          class="animate-spin h-5 w-5 text-blue-400"
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
      </div>

      <!-- Dropdown arrow -->
      <div v-else class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
        <svg
          class="h-5 w-5 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>

    <!-- Selected branch info -->
    <div v-if="selectedBranch" class="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg
              class="h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
        </div>
        <div class="ml-4 flex-1">
          <p class="text-sm font-medium text-blue-300">
            {{ selectedBranch.name }}
          </p>
          <p class="text-sm text-blue-400">Code: {{ selectedBranch.code }}</p>
          <p v-if="selectedBranch.address" class="text-xs text-blue-400/80 mt-1">
            {{ selectedBranch.address }}
          </p>
        </div>
        <div class="flex-shrink-0">
          <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>

    <!-- Error message -->
    <div v-if="error" class="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <svg
            class="h-5 w-5 text-red-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-300">
            {{ error }}
          </p>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-if="!loading && !error && branches.length === 0"
      class="mt-4 p-4 bg-gray-800/50 border border-gray-600 rounded-lg"
    >
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <svg
            class="h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-gray-300">No branches available</p>
          <p class="text-xs text-gray-400">Contact your administrator to add branches</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';

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
});

const emit = defineEmits(['update:modelValue', 'branch-changed']);

// Computed property to get the selected branch object
const selectedBranch = computed(() => {
  if (!props.modelValue) return null;
  return props.branches.find(branch => branch.id === props.modelValue);
});

// Handle branch selection change
const handleBranchChange = event => {
  const selectedValue = event.target.value;
  const selectedId = selectedValue === '' ? null : selectedValue;

  emit('update:modelValue', selectedId);

  // Find the selected branch object and emit it
  const branchObj = props.branches.find(branch => branch.id === selectedId);
  emit('branch-changed', branchObj);
};

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      const branchObj = props.branches.find(branch => branch.id === newValue);
      emit('branch-changed', branchObj);
    }
  }
);
</script>

<style scoped>
.branch-selector select {
  appearance: none;
  background-image: none;
}

/* Custom select styling for dark theme */
.branch-selector select option {
  background-color: #1f2937;
  color: #f9fafb;
}

.branch-selector select option:hover {
  background-color: #374151;
}

/* Focus ring styling */
.branch-selector select:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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

/* Pulse animation for status indicator */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
