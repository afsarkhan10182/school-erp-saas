<template>
  <div v-if="show" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
    <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Plus class="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Generate Invoices & Payments</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Create installment invoices or monthly payments for students</p>
          </div>
        </div>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6">
        <form @submit.prevent="generateInvoices" class="space-y-6">
          <!-- Payment Model Selection -->
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Payment Model <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <select 
                v-model="form.payment_model" 
                required
                @change="onPaymentModelChange"
                class="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 ease-in-out text-sm font-medium appearance-none"
              >
                <option value="">Select Payment Model</option>
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

          <!-- Fee Structure Selection (for monthly payments) -->
          <div v-if="form.payment_model === 'monthly'" class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Fee Structure <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <select 
                v-model="form.fee_structure_id" 
                required
                class="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 ease-in-out text-sm font-medium appearance-none"
              >
                <option value="">Select Fee Structure</option>
                <option v-for="structure in filteredMonthlyFeeStructures" :key="structure.id" :value="structure.id">
                  {{ structure.name }} - {{ structure.feeType?.name }}
                </option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Role-based Context Selection -->
          <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-4 border border-blue-200 dark:border-blue-800">
            <h4 class="text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center">
              <Building2 class="w-4 h-4 mr-2" />
              {{ userRole === 'super_admin' ? 'Select School & Branch' : userRole === 'school_admin' ? 'Select Branch' : 'Academic Context' }}
            </h4>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- School Dropdown (Super Admin Only) -->
              <div v-if="userRole === 'super_admin'">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  School <span class="text-red-500">*</span>
                </label>
                <select 
                  v-model="form.school_id" 
                  @change="onSchoolChange" 
                  required 
                  class="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 ease-in-out text-sm font-medium appearance-none"
                  :class="{ 'opacity-50': schoolsLoading }"
                  :disabled="schoolsLoading"
                >
                                <option value="">{{ props.schoolsLoading ? 'Loading schools...' : 'Select School' }}</option>
              <option v-for="school in filteredSchools" :key="school.id" :value="school.id">
                {{ school.name }}
              </option>
                </select>
              </div>

              <!-- Branch Dropdown (Super Admin & School Admin) -->
              <div v-if="userRole !== 'branch_admin'">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Branch <span class="text-red-500">*</span>
                </label>
                <select 
                  v-model="form.branch_id" 
                  @change="onBranchChange" 
                  required 
                  class="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 ease-in-out text-sm font-medium appearance-none"
                  :class="{ 'opacity-50': branchesLoading }"
                  :disabled="!canSelectBranch || branchesLoading"
                >
                                <option value="">{{ props.branchesLoading ? 'Loading branches...' : getBranchPlaceholder() }}</option>
              <option v-for="branch in filteredBranches" :key="branch.id" :value="branch.id">
                {{ branch.name }}
              </option>
                </select>
              </div>

              <!-- Auto-selected Branch Info (Branch Admin) -->
              <div v-if="userRole === 'branch_admin'" class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Branch
                </label>
                <div class="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
                  <span class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ userBranch?.name || 'Your Branch' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Academic Details Section -->
          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-4">
            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
              <GraduationCap class="w-4 h-4 mr-2" />
              Academic Details
            </h4>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Academic Year <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <select 
                    v-model="form.academic_year" 
                    required
                    class="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 ease-in-out text-sm font-medium appearance-none"
                  >
                    <option value="">Select Year</option>
                    <option v-for="year in filteredAcademicYears" :key="year.id" :value="year.name">
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

              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Class <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <select 
                    v-model="form.class_name" 
                    required
                    @change="onClassChange"
                    class="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 ease-in-out text-sm font-medium appearance-none"
                    :class="{ 'opacity-50': loadingClasses }"
                    :disabled="!canSelectClass || loadingClasses"
                  >
                    <option value="">{{ loadingClasses ? 'Loading classes...' : getClassPlaceholder() }}</option>
                    <option v-for="classItem in filteredClasses" :key="classItem.id" :value="classItem.name">
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

              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Section</label>
                <div class="relative">
                  <select 
                    v-model="form.section" 
                    class="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 ease-in-out text-sm font-medium appearance-none"
                    :class="{ 'opacity-50': loadingSections }"
                    :disabled="!canSelectSection || loadingSections"
                  >
                    <option value="">{{ loadingSections ? 'Loading sections...' : 'All Sections' }}</option>
                    <option v-for="section in filteredSections" :key="section.id" :value="section.name">
                      {{ section.name }}
                    </option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Monthly Payment Specific Fields -->
          <div v-if="form.payment_model === 'monthly'" class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-4 border border-blue-200 dark:border-blue-800">
            <h4 class="text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center">
              <Calendar class="w-4 h-4 mr-2" />
              Monthly Payment Details
            </h4>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Year <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.year"
                  type="number"
                  required
                  min="2020"
                  max="2030"
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 ease-in-out text-sm font-medium"
                  placeholder="e.g., 2024"
                />
              </div>
            </div>

            <div class="space-y-3">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Months <span class="text-red-500">*</span>
              </label>
              <div class="grid grid-cols-3 gap-3">
                <label v-for="month in months" :key="month.value" class="flex items-center p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer">
                  <input
                    type="checkbox"
                    :value="month.value"
                    v-model="form.months"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">{{ month.label }}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Installment Payment Specific Fields -->
          <div v-if="form.payment_model === 'installment'" class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 space-y-4 border border-green-200 dark:border-green-800">
            <h4 class="text-sm font-semibold text-green-700 dark:text-green-300 flex items-center">
              <Calendar class="w-4 h-4 mr-2" />
              Installment Details
            </h4>
            
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Due Date
                <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">(Optional - will auto-calculate if not set)</span>
              </label>
              <input 
                v-model="form.due_date" 
                type="date" 
                class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 ease-in-out text-sm font-medium"
                :min="new Date().toISOString().split('T')[0]"
              >
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Leave empty to use fee type default due date settings
              </p>
            </div>
          </div>
        </form>
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl">
        <button
          type="button"
          @click="$emit('close')"
          class="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="isGenerating || !canSubmit"
          @click="generateInvoices"
          class="px-6 py-2.5 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
        >
          <div v-if="isGenerating" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>{{ isGenerating ? 'Generating...' : 'Generate' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted, nextTick } from 'vue';
import { Plus, GraduationCap, Calendar, Building2 } from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  schools: {
    type: Array,
    default: () => []
  },
  branches: {
    type: Array,
    default: () => []
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
  monthlyFeeStructures: {
    type: Array,
    default: () => []
  },
  isGenerating: {
    type: Boolean,
    default: false
  },
  schoolsLoading: {
    type: Boolean,
    default: false
  },
  branchesLoading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'generate', 'school-change', 'branch-change', 'class-change']);

// Auth store
const authStore = useAuthStore();

// Local loading states (not used anymore since we get data from props)
const loadingClasses = ref(false);
const loadingSections = ref(false);

// User context
const userRole = computed(() => authStore.currentUser?.role || null);
const userBranch = computed(() => authStore.currentBranch || null);

// Form data
const form = reactive({
  payment_model: '',
  fee_structure_id: '',
  school_id: '',
  branch_id: '',
  academic_year: '',
  class_name: '',
  section: '',
  due_date: '',
  year: new Date().getFullYear(),
  months: [],
});

const months = ref([
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]);

// Computed properties for role-based logic
const canSelectBranch = computed(() => {
  if (userRole.value === 'super_admin') {
    return !!form.school_id;
  }
  return true; // School admin can always select branch
});

const canSelectClass = computed(() => {
  if (userRole.value === 'super_admin') {
    return !!(form.school_id && form.branch_id);
  } else if (userRole.value === 'school_admin') {
    return !!form.branch_id;
  }
  return true; // Branch admin can always select class
});

const canSelectSection = computed(() => {
  return !!form.class_name;
});

const filteredClasses = computed(() => {
  console.log('🔍 Filtered classes:', props.classes);
  return Array.isArray(props.classes) ? props.classes : [];
});

const filteredSections = computed(() => {
  console.log('🔍 Filtered sections:', props.sections);
  return Array.isArray(props.sections) ? props.sections : [];
});

const filteredBranches = computed(() => {
  return Array.isArray(props.branches) ? props.branches : [];
});

const filteredAcademicYears = computed(() => {
  return Array.isArray(props.academicYears) ? props.academicYears : [];
});

const filteredSchools = computed(() => {
  return Array.isArray(props.schools) ? props.schools : [];
});

const filteredMonthlyFeeStructures = computed(() => {
  return Array.isArray(props.monthlyFeeStructures) ? props.monthlyFeeStructures : [];
});

const canSubmit = computed(() => {
  const baseRequirements = !!(form.payment_model && form.academic_year && form.class_name);
  
  if (userRole.value === 'super_admin') {
    return baseRequirements && !!(form.school_id && form.branch_id);
  } else if (userRole.value === 'school_admin') {
    return baseRequirements && !!form.branch_id;
  } else {
    // Branch admin
    return baseRequirements;
  }
});

// Helper functions
const getBranchPlaceholder = () => {
  if (userRole.value === 'super_admin') {
    return form.school_id ? 'Select Branch' : 'Select School First';
  }
  return 'Select Branch';
};

const getClassPlaceholder = () => {
  if (userRole.value === 'super_admin') {
    return form.branch_id ? 'Select Class' : 'Select Branch First';
  } else if (userRole.value === 'school_admin') {
    return form.branch_id ? 'Select Class' : 'Select Branch First';
  }
  return 'Select Class';
};

// Event handlers
const onPaymentModelChange = () => {
  // Clear fee structure and months when payment model changes
  form.fee_structure_id = '';
  form.months = [];
  
  // Clear year for monthly payments if switching to installment
  if (form.payment_model === 'installment') {
    form.year = new Date().getFullYear();
  }
};

const onSchoolChange = async () => {
  form.branch_id = '';
  form.class_name = '';
  form.section = '';
  
  // Emit school change event to parent
  if (form.school_id) {
    emit('school-change', form.school_id);
  }
};

const onBranchChange = async () => {
  form.class_name = '';
  form.section = '';
  
  // Emit branch change event to parent
  if (form.branch_id) {
    emit('branch-change', form.branch_id);
  }
};

const onClassChange = async () => {
  form.section = '';
  
  // Emit class change event to parent
  if (form.class_name) {
    emit('class-change', form.class_name);
  }
};

const generateInvoices = () => {
  // Add role-based context to the form data
  const formData = { ...form };
  
  // Ensure auth store is properly initialized
  if (!authStore.currentUser) {
    console.error('Auth store not initialized');
    return;
  }
  
  // Set school_id for non-super admins
  if (userRole.value !== 'super_admin') {
    formData.school_id = authStore.currentUser?.school_id;
  }
  
  // Set branch_id for branch admins
  if (userRole.value === 'branch_admin') {
    formData.branch_id = authStore.currentUser?.branch_id;
  }
  
  emit('generate', formData);
};

// Initialize component based on user role
const initializeComponent = async () => {
  // Ensure auth store is properly initialized
  if (!authStore.currentUser) {
    console.warn('Auth store not initialized yet');
    return;
  }
  
  if (userRole.value === 'school_admin') {
    // Set school for school admin
    form.school_id = authStore.currentUser?.school_id;
  } else if (userRole.value === 'branch_admin') {
    // Set school and branch for branch admin
    form.school_id = authStore.currentUser?.school_id;
    form.branch_id = authStore.currentUser?.branch_id;
  }
};

// Watch for fee structure changes to load months
watch(() => form.fee_structure_id, async (newStructure) => {
  if (newStructure && filteredMonthlyFeeStructures.value.length > 0) {
    const structure = filteredMonthlyFeeStructures.value.find(s => s.id === newStructure);
    if (structure) {
      form.months = Array.isArray(structure.months) ? structure.months : [];
    } else {
      form.months = [];
    }
  } else {
    form.months = [];
  }
});

// Initialize when modal opens
watch(() => props.show, async (show) => {
  if (show) {
    // Add a small delay to ensure props are properly initialized
    await nextTick();
    console.log('🔍 Modal opened with props:', {
      schools: props.schools?.length || 0,
      branches: props.branches?.length || 0,
      academicYears: props.academicYears?.length || 0,
      classes: props.classes?.length || 0,
      sections: props.sections?.length || 0
    });
    await initializeComponent();
  }
});

// Initialize on mount
onMounted(async () => {
  if (props.show) {
    await nextTick();
    await initializeComponent();
  }
});
</script> 