<template>
  <div class="relative">
    <!-- Export Button -->
    <button
      @click="toggleDropdown"
      :disabled="isExporting || disabled"
      class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
    >
      <Download v-if="!isExporting" class="w-4 h-4 mr-2" />
      <div v-else class="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
      {{ isExporting ? 'Exporting...' : 'Export' }}
      <ChevronDown class="w-4 h-4 ml-2" />
    </button>

    <!-- Export Dropdown -->
    <div
      v-show="showDropdown"
      class="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 transition-all duration-200 ease-in-out"
      style="transform-origin: top right;"
    >
      <div class="py-2">
        <!-- Export Options -->
        <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-sm font-medium text-gray-900 dark:text-white">Export Format</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Choose your preferred format</p>
        </div>

        <!-- Format Options -->
        <div class="py-1">
          <button
            v-for="format in supportedFormats"
            :key="format"
            @click="exportWithFormat(format)"
            :disabled="isExporting"
            class="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 flex items-center justify-between group"
          >
            <div class="flex items-center">
              <span class="text-lg mr-3">{{ getFormatIcon(format) }}</span>
              <div>
                <div class="font-medium">{{ getFormatDisplayName(format) }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ getFormatDescription(format) }}
                </div>
              </div>
            </div>
            <ChevronRight class="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
          </button>
        </div>

        <!-- Export Options -->
        <div class="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <label class="text-sm text-gray-700 dark:text-gray-300">Include Summary</label>
            <input
              v-model="includeSummary"
              type="checkbox"
              class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
        </div>

        <!-- Progress Bar (if exporting) -->
        <div v-if="isExporting" class="px-4 py-2">
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              class="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${exportProgress}%` }"
            ></div>
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
            {{ exportProgress }}% complete
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Download, ChevronDown, ChevronRight } from 'lucide-vue-next';
import { useExport } from '~/composables/useExport';

// Props
const props = defineProps({
  reportType: {
    type: String,
    required: true
  },
  filters: {
    type: Object,
    default: () => ({})
  },
  disabled: {
    type: Boolean,
    default: false
  },
  customFilename: {
    type: String,
    default: null
  }
});

// Emits
const emit = defineEmits(['export-started', 'export-completed', 'export-error']);

// Export composable
const {
  isExporting,
  exportProgress,
  exportReport,
  getSupportedFormats,
  getFormatDisplayName,
  getFormatIcon
} = useExport();

// Local state
const showDropdown = ref(false);
const includeSummary = ref(true);

// Computed
const supportedFormats = computed(() => getSupportedFormats(props.reportType));

// Methods
const toggleDropdown = () => {
  if (!isExporting.value && !props.disabled) {
    showDropdown.value = !showDropdown.value;
  }
};

const exportWithFormat = async (format) => {
  try {
    showDropdown.value = false;
    emit('export-started', { format, includeSummary: includeSummary.value });

    await exportReport({
      reportType: props.reportType,
      format,
      filters: props.filters,
      includeSummary: includeSummary.value,
      customFilename: props.customFilename
    });

    emit('export-completed', { format });
  } catch (error) {
    emit('export-error', { format, error });
  }
};

const getFormatDescription = (format) => {
  const descriptions = {
    excel: 'Best for data analysis and calculations',
    csv: 'Simple format, compatible with most applications',
    pdf: 'Professional format for printing and sharing',
    json: 'Structured data format for developers'
  };

  return descriptions[format] || 'Export data';
};

// Click outside to close dropdown
const handleClickOutside = (event) => {
  if (!event.target.closest('.relative')) {
    showDropdown.value = false;
  }
};

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
/* Custom styles for better UX */
.group:hover .group-hover\:text-gray-600 {
  @apply text-gray-600;
}

.dark .group:hover .group-hover\:text-gray-300 {
  @apply text-gray-300;
}
</style>
