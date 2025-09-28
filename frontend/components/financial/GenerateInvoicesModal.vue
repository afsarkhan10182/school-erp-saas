<template>
  <Modal :show="show" @close="$emit('close')" size="4xl">
    <template #header>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">Generate Invoices</h3>
    </template>

    <template #body>
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
                <svg
                  class="h-5 w-5 text-gray-400 dark:text-gray-500"
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
          </div>

          <!-- Fee Structure Selection (Primary Selection) -->
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Fee Structure <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <select
                v-model="form.fee_structure_id"
                required
                @change="onFeeStructureChange"
                class="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 ease-in-out text-sm font-medium appearance-none"
              >
                <option value="">Select Fee Structure</option>
                <option
                  v-for="structure in availableFeeStructures"
                  :key="structure.id"
                  :value="structure.id"
                >
                  {{ structure.feeType?.name }} -
                  {{
                    structure.applicable_classes && structure.applicable_classes.length > 0
                      ? structure.applicable_classes.join(', ')
                      : structure.class_name
                  }}{{ structure.section ? ` (${structure.section})` : ''
                  }}{{ structure.stream_names ? ` - ${structure.stream_names}` : '' }} ({{
                    structure.academic_year
                  }})
                </option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  class="h-5 w-5 text-gray-400 dark:text-gray-500"
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
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Fee structure contains all context: Branch, Class, Section, Academic Year, and Amount
            </p>
          </div>

          <!-- Fee Structure Context Display (Read-only) -->
          <div
            v-if="selectedFeeStructure"
            class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
          >
            <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
              📋 Fee Structure Context
            </h4>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span class="text-gray-600 dark:text-gray-400">Branch:</span>
                <span class="ml-2 font-medium text-gray-900 dark:text-white">{{
                  selectedFeeStructure.branch?.name || 'N/A'
                }}</span>
              </div>
              <div>
                <span class="text-gray-600 dark:text-gray-400">Class:</span>
                <span class="ml-2 font-medium text-gray-900 dark:text-white">
                  <span
                    v-if="
                      selectedFeeStructure.applicable_classes &&
                      selectedFeeStructure.applicable_classes.length > 0
                    "
                  >
                    {{ selectedFeeStructure.applicable_classes.join(', ') }}
                  </span>
                  <span v-else>{{ selectedFeeStructure.class_name }}</span>
                </span>
              </div>
              <div v-if="selectedFeeStructure.section">
                <span class="text-gray-600 dark:text-gray-400">Section:</span>
                <span class="ml-2 font-medium text-gray-900 dark:text-white">{{
                  selectedFeeStructure.section
                }}</span>
              </div>
              <div v-if="selectedFeeStructure.stream_names">
                <span class="text-gray-600 dark:text-gray-400">Streams:</span>
                <span class="ml-2 font-medium text-gray-900 dark:text-white">{{
                  selectedFeeStructure.stream_names
                }}</span>
              </div>
              <div>
                <span class="text-gray-600 dark:text-gray-400">Academic Year:</span>
                <span class="ml-2 font-medium text-gray-900 dark:text-white">{{
                  selectedFeeStructure.academic_year
                }}</span>
              </div>
              <div>
                <span class="text-gray-600 dark:text-gray-400">Fee Type:</span>
                <span class="ml-2 font-medium text-gray-900 dark:text-white">{{
                  selectedFeeStructure.feeType?.name
                }}</span>
              </div>
              <div>
                <span class="text-gray-600 dark:text-gray-400">Amount:</span>
                <span class="ml-2 font-medium text-gray-900 dark:text-white">
                  ₹{{
                    form.payment_model === 'monthly'
                      ? selectedFeeStructure.monthly_payment_amount?.toLocaleString() ||
                        selectedFeeStructure.amount?.toLocaleString()
                      : selectedFeeStructure.amount?.toLocaleString()
                  }}
                  <span v-if="form.payment_model === 'monthly'" class="text-xs text-gray-500"
                    >(monthly)</span
                  >
                  <span v-else class="text-xs text-gray-500">(total)</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Student Selection (Optional) -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Students (Optional)
            </label>
            <div class="relative">
              <select
                v-model="form.student_selection"
                @change="onStudentSelectionChange"
                class="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 ease-in-out text-sm font-medium appearance-none"
              >
                <option value="all">All Students in Class</option>
                <option value="specific">Select Specific Students</option>
              </select>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Leave as "All Students" to generate for entire class, or select specific students
            </p>
          </div>

          <!-- Specific Student Selection -->
          <div v-if="form.student_selection === 'specific'" class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Students
            </label>
            <div
              class="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2"
            >
              <!-- Loading state -->
              <div v-if="loadingStudents" class="flex items-center justify-center py-4">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                <span class="ml-2 text-sm text-gray-500">Loading students...</span>
              </div>

              <!-- No students found -->
              <div
                v-else-if="availableStudents.length === 0"
                class="text-center py-4 text-sm text-gray-500"
              >
                No students found for the selected fee structure
              </div>

              <!-- Students list -->
              <div v-else>
                <!-- Select All Checkbox -->
                <div
                  class="flex items-center mb-3 pb-2 border-b border-gray-200 dark:border-gray-600"
                >
                  <input
                    type="checkbox"
                    id="select-all-students"
                    :checked="isAllStudentsSelected"
                    @change="toggleSelectAllStudents"
                    class="mr-2"
                  />
                  <label
                    for="select-all-students"
                    class="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Select All Students ({{ availableStudents.length }})
                  </label>
                </div>

                <!-- Individual Student Checkboxes -->
                <div
                  v-for="student in availableStudents"
                  :key="student.id"
                  class="flex items-center mb-2"
                >
                  <input
                    type="checkbox"
                    :id="student.id"
                    :value="student.id"
                    v-model="form.selected_student_ids"
                    class="mr-2"
                  />
                  <label :for="student.id" class="text-sm text-gray-700 dark:text-gray-300">
                    {{ getStudentFullName(student) }} ({{ student.admission_number }})
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Monthly Payment Specific Fields -->
          <div v-if="form.payment_model === 'monthly'" class="space-y-4">
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
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Months <span class="text-red-500">*</span>
              </label>
              <div class="flex justify-between items-center mb-2">
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  All 12 months will be generated automatically
                </span>
                <button
                  type="button"
                  @click="selectAllMonths"
                  class="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                >
                  Select All (12 months)
                </button>
              </div>
              <div
                class="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2"
              >
                <div v-for="month in months" :key="month.value" class="flex items-center">
                  <input
                    type="checkbox"
                    :id="`month-${month.value}`"
                    :value="month.value"
                    v-model="form.months"
                    class="mr-2"
                  />
                  <label
                    :for="`month-${month.value}`"
                    class="text-sm text-gray-700 dark:text-gray-300"
                  >
                    {{ month.label }}
                  </label>
                </div>
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                Selected: {{ form.months.length }} month{{ form.months.length !== 1 ? 's' : '' }}
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              @click="$emit('close')"
              class="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="!canSubmit || isGenerating"
              class="px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <span v-if="isGenerating">Generating...</span>
              <span v-else
                >Generate
                {{ form.payment_model === 'monthly' ? 'Monthly Payments' : 'Invoices' }}</span
              >
            </button>
          </div>
        </form>
      </div>
    </template>

    <template #footer> </template>
  </Modal>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted, nextTick } from 'vue';
import { Plus, GraduationCap, Calendar, Building2 } from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';
import { Students } from '~/api';
import { useToast } from '~/composables/useToast';
import Modal from '~/components/ui/Modal.vue';

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

const emit = defineEmits([
  'close',
  'generate',
  'school-change',
  'branch-change',
  'class-change',
  'payment-model-change',
  'fee-structure-change',
  'student-selection-change'
]);

// Auth store and toast
const authStore = useAuthStore();
const { showToast } = useToast();

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
  year: new Date().getFullYear(),
  months: [],
  student_selection: 'all', // 'all' or 'specific'
  selected_student_ids: [] // For specific student selection
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
  { value: 12, label: 'December' }
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

// Computed properties for filtered data
const filteredClasses = computed(() => {
  return props.classes || [];
});

const filteredSections = computed(() => {
  return props.sections || [];
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

const availableFeeStructures = computed(() => {
  if (form.payment_model === 'monthly') {
    const structures = filteredMonthlyFeeStructures.value
      .filter(structure => structure.payment_model === 'monthly')
      .map(structure => ({
        ...structure,
        name: `${structure.name} - ${structure.feeType?.name}`,
        class_name: structure.class_name,
        applicable_classes: structure.applicable_classes, // Preserve applicable_classes
        section: structure.section,
        academic_year: structure.academic_year,
        amount: structure.amount,
        branch: structure.branch,
        branch_id: structure.branch_id || structure.branch?.id // Ensure branch_id is available
      }));

    return structures;
  } else if (form.payment_model === 'installment') {
    const structures = filteredMonthlyFeeStructures.value
      .filter(structure => structure.payment_model === 'installment')
      .map(structure => ({
        ...structure,
        name: `${structure.name} - ${structure.feeType?.name}`,
        class_name: structure.class_name,
        applicable_classes: structure.applicable_classes, // Preserve applicable_classes
        section: structure.section,
        academic_year: structure.academic_year,
        amount: structure.amount,
        branch: structure.branch,
        branch_id: structure.branch_id || structure.branch?.id // Ensure branch_id is available
      }));

    return structures;
  }
  return [];
});

const selectedFeeStructure = computed(() => {
  if (form.fee_structure_id) {
    return availableFeeStructures.value.find(s => s.id === form.fee_structure_id);
  }
  return null;
});

// Students state
const availableStudents = ref([]);
const loadingStudents = ref(false);

// Fetch students based on selected fee structure
const fetchStudents = async () => {
  if (!form.fee_structure_id) {
    availableStudents.value = [];
    return;
  }

  loadingStudents.value = true;
  try {
    const selectedStructure = availableFeeStructures.value.find(
      s => s.id === form.fee_structure_id
    );
    if (!selectedStructure) {
      availableStudents.value = [];
      return;
    }

    // Build params for student filtering
    const params = {
      branch_id: selectedStructure.branch_id
      // Note: academic_year will be automatically used from the fee structure
    };

    // Add section filter if available
    if (selectedStructure.section && selectedStructure.section !== 'All Sections') {
      params.section = selectedStructure.section;
    }

    // If fee structure has applicable_classes (array), we need to fetch students for each class
    if (selectedStructure.applicable_classes && selectedStructure.applicable_classes.length > 0) {
      // Fetch students for all applicable classes
      const allStudents = [];

      for (const className of selectedStructure.applicable_classes) {
        try {
          // Find the class ID for the class name
          const classItem = props.classes?.find(c => c.name === className);
          const classId = classItem?.id;

          if (!classId) {
            continue;
          }

          // If fee structure has streams, fetch students for each stream
          if (selectedStructure.stream_ids && selectedStructure.stream_ids.length > 0) {
            for (const streamId of selectedStructure.stream_ids) {
              const streamParams = {
                ...params,
                class_id: classId,
                stream_id: streamId,
                limit: 1000
              };
              const response = await Students.getAll(streamParams);

              // Handle different response structures
              let students = [];
              if (response.data && Array.isArray(response.data)) {
                students = response.data;
              } else if (
                response.data &&
                response.data.students &&
                Array.isArray(response.data.students)
              ) {
                students = response.data.students;
              } else if (
                response.data &&
                response.data.items &&
                Array.isArray(response.data.items)
              ) {
                students = response.data.items;
              }

              if (students.length > 0) {
                allStudents.push(...students);
              }
            }
          } else {
            // No streams, fetch all students for the class
            const classParams = { ...params, class_id: classId, limit: 1000 };
            const response = await Students.getAll(classParams);

            // Handle different response structures
            let students = [];
            if (response.data && Array.isArray(response.data)) {
              students = response.data;
            } else if (
              response.data &&
              response.data.students &&
              Array.isArray(response.data.students)
            ) {
              students = response.data.students;
            } else if (response.data && response.data.items && Array.isArray(response.data.items)) {
              students = response.data.items;
            }

            if (students.length > 0) {
              allStudents.push(...students);
            }
          }
        } catch (error) {
          // Error handling
        }
      }

      availableStudents.value = allStudents;
    } else {
      // Use single class_name - find the class ID
      const classItem = props.classes?.find(c => c.name === selectedStructure.class_name);
      const classId = classItem?.id;

      if (!classId) {
        availableStudents.value = [];
        return;
      }

      // If fee structure has streams, fetch students for each stream
      if (selectedStructure.stream_ids && selectedStructure.stream_ids.length > 0) {
        const allStudents = [];
        for (const streamId of selectedStructure.stream_ids) {
          const streamParams = { ...params, class_id: classId, stream_id: streamId, limit: 1000 };
          const response = await Students.getAll(streamParams);

          // Handle different response structures
          let students = [];
          if (response.data && Array.isArray(response.data)) {
            students = response.data;
          } else if (
            response.data &&
            response.data.students &&
            Array.isArray(response.data.students)
          ) {
            students = response.data.students;
          } else if (response.data && response.data.items && Array.isArray(response.data.items)) {
            students = response.data.items;
          }

          if (students.length > 0) {
            allStudents.push(...students);
          }
        }
        availableStudents.value = allStudents;
      } else {
        // No streams, fetch all students for the class
        params.class_id = classId;
        params.limit = 1000; // Set high limit to get all students

        const response = await Students.getAll(params);

        // Handle different response structures
        let students = [];
        if (response.data && Array.isArray(response.data)) {
          students = response.data;
        } else if (
          response.data &&
          response.data.students &&
          Array.isArray(response.data.students)
        ) {
          students = response.data.students;
        } else if (response.data && response.data.items && Array.isArray(response.data.items)) {
          students = response.data.items;
        }

        availableStudents.value = students;
      }
    }
  } catch (error) {
    availableStudents.value = [];
    showToast('Error loading students', 'error');
  } finally {
    loadingStudents.value = false;
  }
};

const canSubmit = computed(() => {
  const baseRequirements = !!(form.payment_model && form.fee_structure_id);

  if (form.payment_model === 'monthly') {
    return baseRequirements && !!(form.year && form.months.length > 0);
  } else if (form.payment_model === 'installment') {
    return baseRequirements; // No due_date requirement since it comes from fee structure
  }

  return baseRequirements;
});

// Select All Students functionality
const isAllStudentsSelected = computed(() => {
  return (
    availableStudents.value.length > 0 &&
    form.selected_student_ids.length === availableStudents.value.length
  );
});

const toggleSelectAllStudents = () => {
  if (isAllStudentsSelected.value) {
    // Unselect all
    form.selected_student_ids = [];
  } else {
    // Select all
    form.selected_student_ids = availableStudents.value.map(student => student.id);
  }
};

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
const onPaymentModelChange = async () => {
  // Clear fee structure and months when payment model changes
  form.fee_structure_id = '';
  availableStudents.value = [];

  if (form.payment_model === 'monthly') {
    // Automatically select all 12 months for monthly payments
    form.months = months.value.map(month => month.value);
    form.year = new Date().getFullYear();
  } else if (form.payment_model === 'installment') {
    // Clear months for installment payments
    form.months = [];
    form.year = new Date().getFullYear();
  }

  // Emit change event to parent
  emit('payment-model-change', form.payment_model);
};

const onFeeStructureChange = async () => {
  // Clear months for monthly payments if switching to installment
  if (form.payment_model === 'installment') {
    form.months = [];
  }

  // Fetch students when fee structure changes
  if (form.fee_structure_id) {
    await fetchStudents();
  } else {
    availableStudents.value = [];
  }

  // Emit change event to parent
  emit('fee-structure-change', form.fee_structure_id);
};

const onStudentSelectionChange = async () => {
  // Clear selected students if switching to 'all'
  if (form.student_selection === 'all') {
    form.selected_student_ids = [];
  } else if (form.student_selection === 'specific' && form.fee_structure_id) {
    // Fetch students if switching to specific selection
    await fetchStudents();
  }

  // Emit change event to parent
  emit('student-selection-change', form.student_selection);
};

const selectAllMonths = () => {
  form.months = months.value.map(month => month.value);
};

const generateInvoices = () => {
  // Prepare form data based on payment model
  // Note: Always passing student_ids when available enables batching support in the parent component
  const formData = {
    payment_model: form.payment_model,
    fee_structure_ids: [form.fee_structure_id] // Send as array for invoice generation
  };

  // Always pass student_ids when available for batching support
  if (form.student_selection === 'specific' && form.selected_student_ids.length > 0) {
    formData.student_ids = form.selected_student_ids;
  } else if (form.student_selection === 'all' && availableStudents.value.length > 0) {
    // For "all students" selection, pass all available student IDs for batching
    formData.student_ids = availableStudents.value.map(student => student.id);
  }

  // Add payment model specific fields
  if (form.payment_model === 'monthly') {
    formData.year = form.year;
    formData.months = form.months;
  }
  // Note: For installment payments, due dates come from fee structure

  // Ensure auth store is properly initialized
  if (!authStore.currentUser) {
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
    return;
  }

  // Set default values
  form.student_selection = 'all';
  form.selected_student_ids = [];

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
watch(
  () => form.fee_structure_id,
  async newStructure => {
    if (newStructure && filteredMonthlyFeeStructures.value.length > 0) {
      const structure = filteredMonthlyFeeStructures.value.find(s => s.id === newStructure);
      if (structure && form.payment_model === 'monthly') {
        // For monthly payments, select all 12 months by default if no specific months are set
        if (Array.isArray(structure.months) && structure.months.length > 0) {
          form.months = structure.months;
        } else {
          // Default to all 12 months for monthly payments
          form.months = months.value.map(month => month.value);
        }
      } else {
        form.months = [];
      }
    } else {
      form.months = [];
    }
  }
);

// Watch for fee structures data changes
watch(
  () => props.monthlyFeeStructures,
  newStructures => {},
  { deep: true }
);

// Initialize when modal opens
watch(
  () => props.show,
  async show => {
    if (show) {
      // Add a small delay to ensure props are properly initialized
      await nextTick();
      await initializeComponent();
    }
  }
);

// Helper function to get student full name
const getStudentFullName = student => {
  const firstName = student.first_name || '';
  const lastName = student.last_name || '';

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  } else if (firstName) {
    return firstName;
  } else if (lastName) {
    return lastName;
  } else {
    return 'Unknown Student';
  }
};

// Initialize on mount
onMounted(async () => {
  if (props.show) {
    await nextTick();
    await initializeComponent();
  }
});
</script>
