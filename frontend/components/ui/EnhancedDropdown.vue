<template>
  <div ref="containerRef" class="relative w-full">
    <label
      v-if="label"
      :for="id"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <div class="relative">
      <!-- Trigger Button -->
      <button
        :id="id"
        type="button"
        :aria-expanded="isOpen"
        aria-haspopup="listbox"
        @click="toggleDropdown"
        @keydown="handleTriggerKeydown"
        :disabled="disabled"
        class="w-full h-[46px] px-3.5 py-2.5 text-left text-sm rounded-lg border transition-all duration-150 flex items-center justify-between gap-2 focus:outline-none"
        :class="[
          'bg-white dark:bg-gray-800',
          disabled
            ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-700'
            : 'cursor-pointer hover:border-gray-400 dark:hover:border-gray-500',
          isOpen
            ? 'border-indigo-500 dark:border-indigo-400 ring-1 ring-indigo-500/30'
            : error
              ? 'border-red-500 dark:border-red-400'
              : 'border-gray-200 dark:border-gray-700'
        ]"
      >
        <span
          class="truncate"
          :class="
            selectedLabel
              ? 'text-gray-900 dark:text-white font-normal'
              : 'text-gray-400 dark:text-gray-500'
          "
        >
          {{ selectedLabel || placeholder }}
        </span>

        <!-- Loading spinner or Chevron icon -->
        <span v-if="loading" class="flex-shrink-0 flex items-center pr-1">
          <span
            class="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent"
          ></span>
        </span>
        <span
          v-else
          class="flex-shrink-0 flex items-center text-gray-400 dark:text-gray-500 transition-transform duration-150"
          :class="{ 'rotate-180 text-indigo-500 dark:text-indigo-400': isOpen }"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </button>

      <!-- Custom Floating Dropdown Menu -->
      <Transition
        enter-active-class="transition duration-75 ease-out"
        enter-from-class="opacity-0 -translate-y-0.5"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-50 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-0.5"
      >
        <div
          v-if="isOpen"
          class="absolute left-0 right-0 mt-1.5 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden p-1"
        >
          <!-- Search filter if > 6 options -->
          <div
            v-if="normalizedOptions.length > 6"
            class="p-1.5 border-b border-gray-100 dark:border-gray-700/80 mb-1"
          >
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              placeholder="Search..."
              class="w-full px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 border border-transparent rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none"
              @click.stop
            />
          </div>

          <!-- Options List -->
          <div class="max-h-60 overflow-y-auto space-y-0.5" role="listbox" :aria-label="label || placeholder">
            <!-- Clear/Placeholder Option -->
            <button
              v-if="placeholder && !required"
              type="button"
              role="option"
              :aria-selected="!modelValue"
              @click="selectOption('')"
              class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/60 cursor-pointer"
            >
              <span>{{ placeholder }}</span>
              <span v-if="!modelValue" class="text-indigo-600 dark:text-indigo-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2.5"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </span>
            </button>

            <!-- Regular Options -->
            <button
              v-for="(option, index) in filteredOptions"
              :key="option.value"
              :ref="el => setOptionRef(el, index)"
              type="button"
              @click="selectOption(option.value)"
              @keydown="handleOptionKeydown($event, option.value)"
              class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left cursor-pointer"
              :class="[
                String(option.value) === String(modelValue)
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 font-medium'
                  : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60'
              ]"
            >
              <span class="truncate">{{ option.label }}</span>
              <span
                v-if="String(option.value) === String(modelValue)"
                class="text-indigo-600 dark:text-indigo-400 flex-shrink-0 ml-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2.5"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </span>
            </button>

            <div
              v-if="!filteredOptions.length"
              class="px-3 py-3 text-center text-xs text-gray-400 dark:text-gray-500"
            >
              No options found
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Error message -->
    <p v-if="error" class="mt-1 text-xs text-red-600 dark:text-red-400">{{ error }}</p>
    <!-- Helper text -->
    <p v-if="helperText" class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ helperText }}</p>
    <!-- Loading text -->
    <p v-if="loadingText" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
      {{ loadingText }}
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';

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
const searchQuery = ref('');
const containerRef = ref(null);
const searchInputRef = ref(null);
const optionButtonRefs = ref([]);

const normalizedOptions = computed(() => {
  if (!Array.isArray(props.options)) return [];
  return props.options.map(opt => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value ?? opt.id ?? '',
        label: String(opt.label ?? opt.name ?? opt.value ?? '')
      };
    }
    return {
      value: opt,
      label: String(opt)
    };
  });
});

const selectedLabel = computed(() => {
  const match = normalizedOptions.value.find(opt => String(opt.value) === String(props.modelValue));
  return match ? match.label : '';
});

const filteredOptions = computed(() => {
  if (!searchQuery.value.trim()) return normalizedOptions.value;
  const q = searchQuery.value.toLowerCase();
  return normalizedOptions.value.filter(opt => opt.label.toLowerCase().includes(q));
});

const toggleDropdown = () => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  searchQuery.value = '';
  optionButtonRefs.value = [];
  if (isOpen.value && normalizedOptions.value.length > 6) {
    nextTick(() => {
      searchInputRef.value?.focus();
    });
  }
};

const setOptionRef = (el, index) => {
  if (el) optionButtonRefs.value[index] = el;
};

const handleTriggerKeydown = event => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    if (!isOpen.value) {
      toggleDropdown();
      nextTick(() => {
        const index = event.key === 'ArrowUp' ? filteredOptions.value.length - 1 : 0;
        optionButtonRefs.value[index]?.focus();
      });
    } else if (filteredOptions.value.length) {
      nextTick(() => optionButtonRefs.value[0]?.focus());
    }
  } else if (event.key === 'Escape' && isOpen.value) {
    event.preventDefault();
    isOpen.value = false;
  }
};

const handleOptionKeydown = (event, value) => {
  const index = filteredOptions.value.findIndex(option => String(option.value) === String(value));
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    const nextIndex =
      event.key === 'ArrowDown'
        ? Math.min(index + 1, filteredOptions.value.length - 1)
        : Math.max(index - 1, 0);
    optionButtonRefs.value[nextIndex]?.focus();
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    selectOption(value);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    isOpen.value = false;
  }
};

const selectOption = value => {
  emit('update:modelValue', value);
  emit('change', value);
  isOpen.value = false;
  searchQuery.value = '';
  optionButtonRefs.value = [];
};

const handleClickOutside = event => {
  if (containerRef.value && !containerRef.value.contains(event.target)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  if (import.meta.client) {
    document.addEventListener('click', handleClickOutside);
  }
});

onUnmounted(() => {
  if (import.meta.client) {
    document.removeEventListener('click', handleClickOutside);
  }
});
</script>
