<template>
  <div class="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
    <div class="px-4 py-5 sm:p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <!-- Payment Model Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >Payment Model</label
          >
          <EnhancedDropdown
            v-model="localFilters.payment_model"
            :options="paymentModelOptions"
            @update:model-value="onFilterChange"
            placeholder="All Models"
          />
        </div>

        <!-- Academic Year Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >Academic Year</label
          >
          <EnhancedDropdown
            v-model="localFilters.academic_year"
            :options="[
              { value: '', label: 'All Years' },
              ...academicYears.map(year => ({
                value: year.name,
                label: `${year.name}${year.is_current ? ' (Current)' : ''}`
              }))
            ]"
            @update:model-value="onFilterChange"
            placeholder="All Years"
          />
        </div>

        <!-- Class Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >Class</label
          >
          <EnhancedDropdown
            v-model="localFilters.class_id"
            :options="[
              { value: '', label: 'All Classes' },
              ...availableClasses.map(classItem => ({ value: classItem.id, label: classItem.name }))
            ]"
            @update:model-value="onClassChange"
            placeholder="All Classes"
          />
        </div>

        <!-- Section Filter -->
        <div v-if="localFilters.class_id">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >Section</label
          >
          <EnhancedDropdown
            v-model="localFilters.section"
            :options="[
              { value: '', label: 'All Sections' },
              ...availableSections.map(section => ({ value: section.name, label: section.name }))
            ]"
            @update:model-value="onFilterChange"
            placeholder="All Sections"
          />
        </div>

        <!-- Stream Filter -->
        <div v-if="localFilters.class_id">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >Stream</label
          >
          <EnhancedDropdown
            v-model="localFilters.stream"
            :options="[
              { value: '', label: 'All Streams' },
              ...availableStreams.map(stream => ({ value: stream.name, label: stream.name }))
            ]"
            @update:model-value="onFilterChange"
            placeholder="All Streams"
          />
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >Status</label
          >
          <EnhancedDropdown
            v-model="localFilters.status"
            :options="statusOptions"
            @update:model-value="onFilterChange"
            placeholder="All Status"
          />
        </div>

        <!-- Filter Button -->
        <div class="flex items-end">
          <button
            @click="applyFilters"
            :disabled="isLoading"
            class="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-all duration-200 ease-in-out"
          >
            <Search class="-ml-1 mr-2 h-4 w-4" />
            {{ isLoading ? 'Loading...' : 'Filter' }}
          </button>
        </div>
      </div>

      <!-- Clear Filters -->
      <div class="mt-4 flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-500 dark:text-gray-400">Active filters:</span>
          <div class="flex flex-wrap gap-2">
            <span
              v-if="localFilters.payment_model"
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              {{ getPaymentModelLabel(localFilters.payment_model) }}
              <button @click="clearFilter('payment_model')" class="ml-1 hover:text-blue-600">
                ×
              </button>
            </span>

            <span
              v-if="localFilters.academic_year"
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            >
              {{ localFilters.academic_year }}
              <button @click="clearFilter('academic_year')" class="ml-1 hover:text-green-600">
                ×
              </button>
            </span>
            <span
              v-if="localFilters.class_id"
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
            >
              {{ getClassName(localFilters.class_id) }}
              <button @click="clearFilter('class_id')" class="ml-1 hover:text-purple-600">×</button>
            </span>
            <span
              v-if="localFilters.section"
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
            >
              {{ localFilters.section }}
              <button @click="clearFilter('section')" class="ml-1 hover:text-orange-600">×</button>
            </span>
            <span
              v-if="localFilters.stream"
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200"
            >
              {{ localFilters.stream }}
              <button @click="clearFilter('stream')" class="ml-1 hover:text-teal-600">×</button>
            </span>
            <span
              v-if="localFilters.status"
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
            >
              {{ getStatusLabel(localFilters.status) }}
              <button @click="clearFilter('status')" class="ml-1 hover:text-yellow-600">×</button>
            </span>
          </div>
        </div>
        <button
          @click="clearAllFilters"
          class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Clear all
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue';
import { Search } from 'lucide-vue-next';
import { useAuth } from '~/composables/useAuth';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';

const props = defineProps({
  filters: {
    type: Object,
    required: true
  },
  academicYears: {
    type: Array,
    default: () => []
  },
  classes: {
    type: Array,
    default: () => []
  },
  sections: {
    type: Array,
    default: () => []
  },
  streams: {
    type: Array,
    default: () => []
  },
  branches: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['filter-change', 'clear-filters', 'branch-change', 'class-change']);

// Auth composable
const { isSuperAdmin, isAdmin, isBranchAdmin, user } = useAuth();

// Computed properties for role-based logic
const shouldShowBranchFilter = computed(() => {
  // Super admin can always see branch filter
  if (isSuperAdmin.value) {
    return true;
  }

  // School admin can see branch filter only if they have multiple branches
  if (isAdmin.value) {
    return props.branches.length > 1;
  }

  // Branch admin should not see branch filter (they're fixed to one branch)
  if (isBranchAdmin.value) {
    return false;
  }

  // Default: don't show for other roles
  return false;
});

const availableBranches = computed(() => {
  // Super admin sees all branches
  if (isSuperAdmin.value) {
    return props.branches;
  }

  // School admin sees only their school's branches
  if (isAdmin.value) {
    return props.branches.filter(branch => branch.school_id === user.value?.school_id);
  }

  // Branch admin sees only their branch
  if (isBranchAdmin.value) {
    return props.branches.filter(branch => branch.id === user.value?.branch_id);
  }

  return [];
});

const availableClasses = computed(() => {
  // If no branch is selected, show all classes
  if (!localFilters.branch_id) {
    return props.classes || [];
  }

  // Filter classes by selected branch
  return (props.classes || []).filter(classItem => {
    // If class has branch info, filter by it
    if (classItem.branch && classItem.branch.id) {
      return classItem.branch.id === localFilters.branch_id;
    }
    // If no branch info on class, show it (fallback)
    return true;
  });
});

const availableSections = computed(() => {
  // If no class is selected, show all sections
  if (!localFilters.class_id) {
    return props.sections || [];
  }

  // Filter sections by selected class
  return (props.sections || []).filter(section => {
    // If section has class info, filter by it
    if (section.class_id) {
      return section.class_id === localFilters.class_id;
    }
    // If no class info on section, show it (fallback)
    return true;
  });
});

const availableStreams = computed(() => {
  // If no class is selected, show all streams
  if (!localFilters.class_id) {
    return props.streams || [];
  }

  // Filter streams by selected class
  const filteredStreams = (props.streams || []).filter(stream => {
    // Check for class_id (direct field) or class.id (nested object)
    const streamClassId = stream.class_id || stream.class?.id;

    if (streamClassId) {
      const matches = streamClassId === localFilters.class_id;
      return matches;
    }
    // If no class info on stream, show it (fallback)
    return true;
  });

  return filteredStreams;
});

const localFilters = reactive({
  payment_model: '',
  branch_id: '',
  academic_year: '',
  class_id: '',
  section: '',
  stream: '',
  status: ''
});
const paymentModelOptions = [
  { value: '', label: 'All Models' },
  { value: 'installment', label: 'Installment Payments' },
  { value: 'monthly', label: 'Monthly Payments' }
];
const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Unpaid' },
  { value: 'paid', label: 'Paid' },
  { value: 'partial_paid', label: 'Partial Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' }
];

// Initialize local filters with props
watch(
  () => props.filters,
  newFilters => {
    Object.assign(localFilters, newFilters);
  },
  { immediate: true, deep: true }
);

// Watch for streams changes
watch(
  () => props.streams,
  newStreams => {},
  { immediate: true, deep: true }
);

// Watch for sections changes
watch(
  () => props.sections,
  newSections => {},
  { immediate: true, deep: true }
);

const onFilterChange = () => {
  // If branch changed, reset class, section, and stream filters and emit branch change event
  if (localFilters.branch_id !== props.filters.branch_id) {
    localFilters.class_id = '';
    localFilters.section = '';
    localFilters.stream = '';
    emit('branch-change', localFilters.branch_id);
  }

  emit('filter-change', { ...localFilters });
};

const onClassChange = () => {
  // Reset section and stream filters when class changes
  localFilters.section = '';
  localFilters.stream = '';

  // Emit class change event for parent component to handle
  emit('class-change', localFilters.class_id);

  // Also emit filter change
  emit('filter-change', { ...localFilters });
};

const applyFilters = () => {
  emit('filter-change', { ...localFilters });
};

const clearFilter = filterName => {
  localFilters[filterName] = '';
  emit('filter-change', { ...localFilters });
};

const clearAllFilters = () => {
  Object.keys(localFilters).forEach(key => {
    localFilters[key] = '';
  });
  emit('clear-filters');
};

const getPaymentModelLabel = model => {
  const labels = {
    installment: 'Installment',
    monthly: 'Monthly'
  };
  return labels[model] || model;
};

const getClassName = classId => {
  const classItem = availableClasses.value.find(c => c.id === classId);
  return classItem ? classItem.name : 'Unknown Class';
};

const getBranchName = branchId => {
  const branch = availableBranches.value.find(b => b.id === branchId);
  return branch ? branch.name : 'Unknown Branch';
};

const getStatusLabel = status => {
  const labels = {
    draft: 'Draft',
    sent: 'Unpaid', // 'sent' status represents unpaid invoices
    paid: 'Paid',
    partial_paid: 'Partial Paid',
    overdue: 'Overdue',
    cancelled: 'Cancelled'
  };
  return labels[status] || status;
};
</script>
