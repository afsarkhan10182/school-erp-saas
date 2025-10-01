<template>
  <div class="flex flex-wrap gap-2 mb-4">
    <!-- Date Range -->
    <div class="flex gap-2">
      <FormField id="date-from" label="From Date" class="min-w-36">
        <input
          v-model="localFilters.date_from"
          type="date"
          class="input-field"
          @change="emitFilters"
        />
      </FormField>

      <FormField id="date-to" label="To Date" class="min-w-36">
        <input
          v-model="localFilters.date_to"
          type="date"
          class="input-field"
          @change="emitFilters"
        />
      </FormField>
    </div>

    <!-- Dropdowns -->
    <div class="flex gap-2">
      <EnhancedDropdown
        :options="classOptions"
        v-model="localFilters.class_id"
        placeholder="Select Class"
        label="Class"
        @update:modelValue="onClassChange"
      />

      <EnhancedDropdown
        :options="sectionOptions"
        v-model="localFilters.section_id"
        placeholder="Select Section"
        label="Section"
        :disabled="!localFilters.class_id"
        @update:modelValue="emitFilters"
      />

      <EnhancedDropdown
        v-if="showStatus"
        :options="statusOptions"
        v-model="localFilters.status"
        placeholder="Select Status"
        label="Status"
        @update:modelValue="emitFilters"
      />
    </div>

    <!-- Additional Filters Slot -->
    <div v-if="$slots.additionalFilters" class="flex gap-2">
      <slot name="additionalFilters" :filters="localFilters" />
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-2 ml-auto">
      <button
        @click="applyFilters"
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        :disabled="loading"
      >
        {{ loading ? 'Loading...' : 'Apply Filters' }}
      </button>

      <button
        @click="resetFilters"
        class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
      >
        Reset
      </button>

      <!-- Additional Actions Slot -->
      <slot name="actions" :filters="localFilters" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAcademics } from '~/composables/useAcademics';
import FormField from '~/components/ui/FormField.vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';

interface Props {
  modelValue?: Record<string, any>;
  showStatus?: boolean;
  loading?: boolean;
  autoApply?: boolean;
}

interface Emits {
  (e: 'update:modelValue', filters: Record<string, any>): void;
  (e: 'filter', filters: Record<string, any>): void;
  (e: 'reset'): void;
}

const props = withDefaults(defineProps<Props>(), {
  showStatus: false,
  loading: false,
  autoApply: true
});

const emit = defineEmits<Emits>();

// Use centralized dropdown composable
const { classOptions, sectionOptions, fetchClasses, fetchSections } = useAcademics();

// Local filter state
const localFilters = ref({
  date_from: '',
  date_to: '',
  class_id: '',
  section_id: '',
  status: '',
  ...props.modelValue
});

// Status options for attendance
const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Draft (Can Edit)', value: 'draft' },
  { label: 'Published (Final)', value: 'published' }
];

// Watch for external filter changes
watch(
  () => props.modelValue,
  newFilters => {
    if (newFilters) {
      Object.assign(localFilters.value, newFilters);
    }
  },
  { deep: true }
);

// Handle class change to load sections
const onClassChange = async (classId: string) => {
  localFilters.value.class_id = classId;
  localFilters.value.section_id = ''; // Reset section when class changes

  if (classId) {
    await loadSections(classId);
  }

  emitFilters();
};

// Emit filters to parent
const emitFilters = () => {
  emit('update:modelValue', { ...localFilters.value });

  if (props.autoApply) {
    emit('filter', { ...localFilters.value });
  }
};

// Apply filters manually
const applyFilters = () => {
  emit('filter', { ...localFilters.value });
};

// Reset all filters
const resetFilters = () => {
  const resetData = {
    date_from: '',
    date_to: '',
    class_id: '',
    section_id: '',
    status: ''
  };

  Object.assign(localFilters.value, resetData);
  emit('update:modelValue', resetData);
  emit('reset');
  emit('filter', resetData);
};

// Load initial data
onMounted(() => {
  loadClasses();
});
</script>

<style scoped>
.input-field {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
         transition-colors duration-200;
}
</style>
