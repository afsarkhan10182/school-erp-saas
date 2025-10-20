<template>
  <div ref="componentRef" class="relative enhanced-multi-select" :class="containerClass">
    <label
      v-if="label"
      :for="id"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <div class="relative">
      <!-- Multi-select trigger -->
      <div
        :id="id"
        @click="toggleDropdown"
        @keydown.enter="toggleDropdown"
        @keydown.space.prevent="toggleDropdown"
        @keydown.escape="closeDropdown"
        :disabled="disabled"
        :tabindex="disabled ? -1 : 0"
        role="combobox"
        :aria-expanded="isOpen"
        :aria-haspopup="true"
        :aria-label="label"
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
            : '',
          isOpen ? 'ring-2 ring-indigo-500 border-indigo-500' : '',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer'
        ]"
      >
        <!-- Placeholder or selected items -->
        <div v-if="selectedItems.length === 0" class="text-gray-500 dark:text-gray-400">
          {{ placeholder }}
        </div>
        <div v-else class="flex flex-wrap gap-1">
          <span
            v-for="item in selectedItems"
            :key="item.value"
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 transition-colors duration-150"
          >
            {{ item.label }}
            <button
              v-if="!disabled"
              @click="removeItem(item.value)"
              @keydown.enter.stop="removeItem(item.value)"
              @keydown.space.prevent.stop="removeItem(item.value)"
              class="ml-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full p-0.5 transition-colors duration-150"
              type="button"
              :aria-label="`Remove ${item.label}`"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </span>
        </div>
      </div>

      <!-- Dropdown arrow -->
      <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg
          class="h-5 w-5 text-gray-400 transition-transform duration-200"
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
      <div
        v-if="loading"
        class="absolute inset-y-0 right-0 flex items-center pr-8 pointer-events-none"
      >
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
      </div>

      <!-- Error message -->
      <p v-if="error" class="mt-1 text-sm text-red-600 dark:text-red-400">
        {{ error }}
      </p>

      <!-- Dropdown options -->
      <div
        v-if="isOpen"
        class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto"
      >
        <!-- Search input (if searchable) -->
        <div v-if="searchable" class="p-2 border-b border-gray-200 dark:border-gray-600">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search options..."
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <!-- Select All / Clear All -->
        <div
          v-if="showSelectAll"
          class="px-3 py-2 border-b border-gray-200 dark:border-gray-600"
          @click.stop
        >
          <div class="flex justify-between items-center">
            <button
              @click="selectAll"
              class="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 font-medium"
              type="button"
            >
              Select All
            </button>
            <button
              v-if="selectedItems.length > 0"
              @click="clearAll"
              class="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium"
              type="button"
            >
              Clear All
            </button>
          </div>
        </div>

        <!-- Options list -->
        <div class="max-h-48 overflow-auto">
          <div
            v-for="option in filteredOptions"
            :key="option.value"
            @click="toggleOption(option.value)"
            @keydown.enter="toggleOption(option.value)"
            @keydown.space.prevent="toggleOption(option.value)"
            :class="[
              'px-3 py-2 cursor-pointer flex items-center transition-colors duration-150',
              'hover:bg-gray-100 dark:hover:bg-gray-700',
              modelValue.includes(option.value) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
            ]"
            role="option"
            :aria-selected="modelValue.includes(option.value)"
          >
            <input
              type="checkbox"
              :checked="modelValue.includes(option.value)"
              class="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-colors duration-150"
              readonly
              tabindex="-1"
            />
            <span class="text-sm text-gray-900 dark:text-white flex-1">{{ option.label }}</span>
            <span v-if="option.description" class="text-xs text-gray-500 dark:text-gray-400 ml-2">
              {{ option.description }}
            </span>
          </div>
        </div>

        <!-- No options message -->
        <div v-if="filteredOptions.length === 0" class="px-3 py-4 text-center">
          <div class="text-sm text-gray-500 dark:text-gray-400">
            <svg
              class="mx-auto h-8 w-8 text-gray-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33"
              />
            </svg>
            {{ searchQuery ? 'No matching options found' : 'No options available' }}
          </div>
        </div>

        <!-- Selected count -->
        <div
          v-if="selectedItems.length > 0"
          class="px-3 py-2 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
        >
          <div class="text-xs text-gray-600 dark:text-gray-400">
            {{ selectedItems.length }} item{{ selectedItems.length === 1 ? '' : 's' }} selected
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

// Props
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  options: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: 'Select options...'
  },
  label: {
    type: String,
    default: ''
  },
  id: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
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
    default: ''
  },
  containerClass: {
    type: String,
    default: ''
  },
  searchable: {
    type: Boolean,
    default: false
  },
  showSelectAll: {
    type: Boolean,
    default: false
  },
  maxSelections: {
    type: Number,
    default: null
  }
});

// Emits
const emit = defineEmits(['update:modelValue', 'change']);

// Reactive data
const isOpen = ref(false);
const searchQuery = ref('');
const componentRef = ref(null);

// Computed
const selectedItems = computed(() => {
  return props.options.filter(option => props.modelValue.includes(option.value));
});

const filteredOptions = computed(() => {
  if (!props.searchable || !searchQuery.value) {
    return props.options;
  }

  const query = searchQuery.value.toLowerCase();
  return props.options.filter(
    option =>
      option.label.toLowerCase().includes(query) ||
      (option.description && option.description.toLowerCase().includes(query))
  );
});

// Methods
const toggleDropdown = () => {
  if (!props.disabled) {
    isOpen.value = !isOpen.value;
    if (isOpen.value) {
      searchQuery.value = '';
    }
  }
};

const closeDropdown = () => {
  isOpen.value = false;
  searchQuery.value = '';
};

const toggleOption = value => {
  const currentValues = [...props.modelValue];
  const index = currentValues.indexOf(value);

  if (index > -1) {
    currentValues.splice(index, 1);
  } else {
    // Check max selections limit
    if (props.maxSelections && currentValues.length >= props.maxSelections) {
      return; // Don't add if max selections reached
    }
    currentValues.push(value);
  }

  emit('update:modelValue', currentValues);
  emit('change', currentValues);
};

const removeItem = value => {
  const currentValues = [...props.modelValue];
  const index = currentValues.indexOf(value);

  if (index > -1) {
    currentValues.splice(index, 1);
    emit('update:modelValue', currentValues);
    emit('change', currentValues);
  }
};

const selectAll = () => {
  const allValues = filteredOptions.value.map(option => option.value);
  const currentValues = [...new Set([...props.modelValue, ...allValues])];

  // Respect max selections limit
  if (props.maxSelections && currentValues.length > props.maxSelections) {
    currentValues.splice(props.maxSelections);
  }

  emit('update:modelValue', currentValues);
  emit('change', currentValues);
};

const clearAll = () => {
  emit('update:modelValue', []);
  emit('change', []);
};

// Click outside handler
const handleClickOutside = event => {
  // Only close if dropdown is open
  if (!isOpen.value) {
    return;
  }

  if (componentRef.value && !componentRef.value.contains(event.target)) {
    // Add small delay to ensure other events complete first
    setTimeout(() => {
      closeDropdown();
    }, 10);
  }
};

// Lifecycle
onMounted(() => {
  // Use multiple event types for better coverage
  document.addEventListener('mousedown', handleClickOutside, true);
  document.addEventListener('click', handleClickOutside, true);
  document.addEventListener('touchstart', handleClickOutside, true);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside, true);
  document.removeEventListener('click', handleClickOutside, true);
  document.removeEventListener('touchstart', handleClickOutside, true);
});
</script>
