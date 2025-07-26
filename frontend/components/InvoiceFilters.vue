<template>
  <div class="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
    <div class="px-4 py-5 sm:p-6">
      <div class="grid grid-cols-1 md:grid-cols-6 gap-4">
        <!-- Payment Model Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Model</label>
          <div class="relative">
            <select 
              v-model="localFilters.payment_model" 
              @change="onFilterChange"
              class="appearance-none w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 ease-in-out text-sm font-medium"
            >
              <option value="">All Models</option>
              <option value="installment">Installment Payments</option>
              <option value="monthly">Monthly Payments</option>
            </select>
            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Branch Filter - Only show for Super Admin or School Admin with multiple branches -->
        <div v-if="shouldShowBranchFilter">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Branch</label>
          <div class="relative">
            <select 
              v-model="localFilters.branch_id" 
              @change="onFilterChange"
              class="appearance-none w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 ease-in-out text-sm font-medium"
            >
              <option value="">All Branches</option>
              <option v-for="branch in availableBranches" :key="branch.id" :value="branch.id">
                {{ branch.name }}
              </option>
            </select>
            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Academic Year Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Academic Year</label>
          <div class="relative">
            <select 
              v-model="localFilters.academic_year" 
              @change="onFilterChange"
              class="appearance-none w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 ease-in-out text-sm font-medium"
            >
              <option value="">All Years</option>
              <option v-for="year in academicYears" :key="year.id" :value="year.name">
                {{ year.name }} {{ year.is_current ? '(Current)' : '' }}
              </option>
            </select>
            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Class Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Class</label>
          <div class="relative">
            <select 
              v-model="localFilters.class_name" 
              @change="onFilterChange"
              class="appearance-none w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 ease-in-out text-sm font-medium"
            >
              <option value="">All Classes</option>
              <option v-for="classItem in classes" :key="classItem.id" :value="classItem.name">
                {{ classItem.name }}
              </option>
            </select>
            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
          <div class="relative">
            <select 
              v-model="localFilters.status" 
              @change="onFilterChange"
              class="appearance-none w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 ease-in-out text-sm font-medium"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="partial_paid">Partial Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
            </select>
            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Filter Button -->
        <div class="flex items-end">
          <button
            @click="applyFilters"
            :disabled="isLoading"
            class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
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
              <button @click="clearFilter('payment_model')" class="ml-1 hover:text-blue-600">×</button>
            </span>
            <span 
              v-if="localFilters.branch_id" 
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
            >
              {{ getBranchName(localFilters.branch_id) }}
              <button @click="clearFilter('branch_id')" class="ml-1 hover:text-indigo-600">×</button>
            </span>
            <span 
              v-if="localFilters.academic_year" 
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            >
              {{ localFilters.academic_year }}
              <button @click="clearFilter('academic_year')" class="ml-1 hover:text-green-600">×</button>
            </span>
            <span 
              v-if="localFilters.class_name" 
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
            >
              {{ localFilters.class_name }}
              <button @click="clearFilter('class_name')" class="ml-1 hover:text-purple-600">×</button>
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
import { useAuthStore } from '~/stores/auth';

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
  branches: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['filter-change', 'clear-filters']);

// Auth store
const authStore = useAuthStore();

// Computed properties for role-based logic
const shouldShowBranchFilter = computed(() => {
  // Super admin can always see branch filter
  if (authStore.isSuperAdmin) {
    return true;
  }
  
  // School admin can see branch filter only if they have multiple branches
  if (authStore.isSchoolAdmin) {
    return props.branches.length > 1;
  }
  
  // Branch admin should not see branch filter (they're fixed to one branch)
  if (authStore.isBranchAdmin) {
    return false;
  }
  
  // Default: don't show for other roles
  return false;
});

const availableBranches = computed(() => {
  // Super admin sees all branches
  if (authStore.isSuperAdmin) {
    return props.branches;
  }
  
  // School admin sees only their school's branches
  if (authStore.isSchoolAdmin) {
    return props.branches.filter(branch => branch.school_id === authStore.currentUser?.school_id);
  }
  
  // Branch admin sees only their branch
  if (authStore.isBranchAdmin) {
    return props.branches.filter(branch => branch.id === authStore.currentUser?.branch_id);
  }
  
  return [];
});

const localFilters = reactive({
  payment_model: '',
  branch_id: '',
  academic_year: '',
  class_name: '',
  status: '',
});

// Initialize local filters with props
watch(() => props.filters, (newFilters) => {
  Object.assign(localFilters, newFilters);
}, { immediate: true, deep: true });

const onFilterChange = () => {
  emit('filter-change', { ...localFilters });
};

const applyFilters = () => {
  emit('filter-change', { ...localFilters });
};

const clearFilter = (filterName) => {
  localFilters[filterName] = '';
  emit('filter-change', { ...localFilters });
};

const clearAllFilters = () => {
  Object.keys(localFilters).forEach(key => {
    localFilters[key] = '';
  });
  emit('clear-filters');
};

const getPaymentModelLabel = (model) => {
  const labels = {
    installment: 'Installment',
    monthly: 'Monthly'
  };
  return labels[model] || model;
};

const getBranchName = (branchId) => {
  const branch = availableBranches.value.find(b => b.id === branchId);
  return branch ? branch.name : 'Unknown Branch';
};

const getStatusLabel = (status) => {
  const labels = {
    draft: 'Draft',
    sent: 'Sent',
    paid: 'Paid',
    partial_paid: 'Partial Paid',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
    pending: 'Pending',
    partial: 'Partial'
  };
  return labels[status] || status;
};
</script> 