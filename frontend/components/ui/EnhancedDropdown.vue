<template>
  <div class="relative">
    <label
      v-if="label"
      :for="id"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <div class="relative">
      <select
        :id="id"
        :value="modelValue"
        @change="handleChange"
        :disabled="disabled"
        :class="[
          'appearance-none w-full px-4 py-3 pr-10 rounded-lg border transition-all duration-200 ease-in-out',
          'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
          'border-gray-300 dark:border-gray-600',
          'focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none',
          'hover:border-indigo-300 dark:hover:border-indigo-500',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-700',
          'text-sm font-medium',
          error
            ? 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500/20'
            : ''
        ]"
        style="padding-right: 40px"
      >
        <option v-if="placeholder" value="" class="text-gray-500 dark:text-gray-400">
          {{ placeholder }}
        </option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          :class="
            option.value === modelValue
              ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100'
              : 'text-gray-900 dark:text-white'
          "
        >
          {{ option.label }}
        </option>
      </select>

      <!-- Loading indicator -->
      <div
        v-if="loading"
        class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
      >
        <div
          class="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 dark:border-indigo-400"
        ></div>
      </div>

      <!-- Custom dropdown arrow -->
      <div v-else class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg
          class="h-4 w-4 text-gray-500 dark:text-gray-400 transition-all duration-200 group-hover:text-indigo-400 dark:group-hover:text-indigo-300 focus-within:text-indigo-500 dark:focus-within:text-indigo-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
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

    <!-- Error message -->
    <p v-if="error" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ error }}</p>

    <!-- Helper text -->
    <p v-if="helperText" class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ helperText }}</p>

    <!-- Loading text -->
    <p v-if="loadingText" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      {{ loadingText }}
    </p>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  options: {
    type: Array,
    default: () => []
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Select an option'
  },
  id: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingText: {
    type: String,
    default: ''
  },
  error: {
    type: String,
    default: ''
  },
  helperText: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

// Check if dark mode is active
const isDark = computed(() => {
  if (import.meta.client) {
    return document.documentElement.classList.contains('dark');
  }
  return false;
});

// Watch for changes to emit change event
watch(
  () => props.modelValue,
  newValue => {
    emit('change', newValue);
  }
);

const handleChange = event => {
  const value = event.target.value;
  emit('update:modelValue', value);
  emit('change', value);
};
</script>

<style scoped>
select option {
  @apply py-2 px-3;
}

select option:checked {
  @apply bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100;
}

select option:hover {
  @apply bg-indigo-50 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200;
}

/* Arrow color changes when select is focused */
select:focus + div svg {
  @apply text-indigo-500 dark:text-indigo-400 rotate-180;
}

/* Arrow color changes on hover */
select:hover + div svg {
  @apply text-indigo-400 dark:text-indigo-300;
}

/* Arrow rotates when select is active (dropdown open) */
select:active + div svg {
  @apply rotate-180;
}
</style>
