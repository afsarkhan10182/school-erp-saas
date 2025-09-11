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
          'focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20',
          'hover:border-gray-400 dark:hover:border-gray-500',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-700',
          'text-sm font-medium',
          error
            ? 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500/20'
            : ''
        ]"
        :style="`background-image: url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27${isDark ? '%2394a3b8' : '%236b7280'}%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27m6 8 4 4 4-4%27/%3e%3c/svg%3e'); background-position: right 12px center; background-repeat: no-repeat; background-size: 16px; padding-right: 40px;`"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          :class="option.value === modelValue ? 'bg-indigo-100 dark:bg-indigo-900' : ''"
        >
          {{ option.label }}
        </option>
      </select>

      <!-- Custom dropdown arrow -->
      <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg
          class="h-5 w-5 text-gray-400 dark:text-gray-500 transition-transform duration-200"
          :class="{ 'rotate-180': isOpen }"
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

      <!-- Loading indicator -->
      <div v-if="loading" class="absolute inset-y-0 right-0 flex items-center pr-10">
        <div
          class="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 dark:border-indigo-400"
        ></div>
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
import { ref, watch } from 'vue';

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

const isOpen = ref(false);

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
  @apply bg-gray-100 dark:bg-gray-700;
}
</style>
