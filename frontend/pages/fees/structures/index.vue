<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Fee Structures</h1>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Define fee structures for different classes and academic years</p>
        </div>
        <button
          @click="openCreateModal"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <PlusIcon class="h-4 w-4 mr-2" />
          Add Fee Structure
        </button>
      </div>

      <!-- Fee Structures List -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-x-auto">
        <div v-if="isLoading" class="p-8 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading fee structures...</p>
        </div>

        <div v-else-if="feeStructures.length === 0" class="p-8 text-center">
          <BanknoteIcon class="mx-auto h-12 w-12 text-gray-400" />
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">No fee structures found.</p>
          <button
            @click="openCreateModal"
            class="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200 dark:text-indigo-400 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40"
          >
            <PlusIcon class="h-4 w-4 mr-2" />
            Create your first fee structure
          </button>
        </div>

        <div v-else>
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Academic Year</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Class</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Branch</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fee Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payment Model</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="structure in feeStructures" :key="structure.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">{{ structure.academic_year }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500 dark:text-gray-400">{{ structure.class_name }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div v-if="structure.branch" class="flex items-center">
                    <div class="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span class="font-medium">{{ structure.branch.name }}</span>
                    <span v-if="structure.branch.code" class="text-gray-500 dark:text-gray-400 ml-1">({{ structure.branch.code }})</span>
                  </div>
                  <div v-else class="text-sm text-gray-500 dark:text-gray-400">All Branches</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">{{ structure.feeType?.name || 'N/A' }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ structure.feeType?.code || '' }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full" :class="{
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400': structure.payment_model === 'installment',
                    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400': structure.payment_model === 'monthly'
                  }">
                    {{ structure.payment_model === 'installment' ? 'Installment-based' : 'Monthly-based' }}
                  </span>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {{ structure.payment_model === 'installment' ? 
                      (structure.installment_count > 1 ? `${structure.installment_count} installments` : 'One time') : 
                      `₹${structure.monthly_payment_amount}/month` 
                    }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">₹{{ structure.amount }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full" :class="{
                    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400': structure.is_active,
                    'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400': !structure.is_active
                  }">
                    {{ structure.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    @click="editFeeStructure(structure)"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    @click="deleteFeeStructure(structure.id)"
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ isEditing ? 'Edit Fee Structure' : 'Create Fee Structure' }}
          </h3>
          
          <form @submit.prevent="saveFeeStructure">
            <!-- School Selector for Super Admin -->
            <div v-if="user?.role === 'super_admin'" class="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">📍 Select School Context</h4>
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">School *</label>
                  <select
                    v-model="selectedSchoolId"
                    required
                    :disabled="isEditing"
                    :class="[
                      'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white',
                      isEditing ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' : ''
                    ]"
                    @change="onSchoolChange"
                  >
                    <option value="">Select a school first</option>
                    <option v-for="school in availableSchools" :key="school.id" :value="school.id">
                      {{ school.name }} {{ school.code ? `(${school.code})` : '' }}
                    </option>
                  </select>
                </div>
                
                <!-- Branch Selector for Super Admin -->
                <div v-if="selectedSchoolId">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Branch *</label>
                  <select
                    v-model="selectedBranchId"
                    required
                    :disabled="isEditing"
                    :class="[
                      'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white',
                      isEditing ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' : ''
                    ]"
                    @change="onBranchChange"
                  >
                    <option value="">Select a branch</option>
                    <option v-for="branch in availableBranches" :key="branch.id" :value="branch.id">
                      {{ branch.name }}
                    </option>
                  </select>
                </div>
                
                <div v-if="!isEditing && !selectedSchoolId" class="text-xs text-blue-600 dark:text-blue-400">
                  ⚠️ Please select a school before creating the fee structure
                </div>
                <div v-if="!isEditing && selectedSchoolId && !selectedBranchId" class="text-xs text-blue-600 dark:text-blue-400">
                  ⚠️ Please select a branch before creating the fee structure
                </div>
              </div>
            </div>

            <!-- Branch Selector for School Admin -->
            <div v-if="user?.role === 'school_admin'" class="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">📍 Select Branch Context</h4>
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Branch *</label>
                  <select
                    v-model="selectedBranchId"
                    required
                    :disabled="isEditing"
                    :class="[
                      'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white',
                      isEditing ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' : ''
                    ]"
                    @change="onBranchChange"
                  >
                    <option value="">Select a branch</option>
                    <option v-for="branch in availableBranches" :key="branch.id" :value="branch.id">
                      {{ branch.name }}
                    </option>
                  </select>
                </div>
                <div v-if="!isEditing && !selectedBranchId" class="text-xs text-blue-600 dark:text-blue-400">
                  ⚠️ Please select a branch before creating the fee structure
                </div>
              </div>
            </div>

            <!-- Fee Structure Form -->
            <div class="space-y-4">
              <!-- Academic Year -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Academic Year *</label>
                <input
                  :value="currentAcademicYearName"
                  readonly
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                  placeholder="Loading current academic year..."
                />
              </div>

              <!-- Class Dropdown -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class *</label>
                <select
                  v-model="form.class_id"
                  required
                  @change="onClassChange"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Class</option>
                  <option v-for="classItem in classes" :key="classItem.id" :value="classItem.id">
                    {{ classItem.name }}
                  </option>
                </select>
              </div>

              <!-- Section Dropdown -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Section (Optional)</label>
                <select
                  v-model="form.section_id"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Sections (General)</option>
                  <option v-for="section in sections" :key="section.id" :value="section.id">
                    {{ section.name }}
                  </option>
                </select>
              </div>

              <!-- Fee Type Dropdown -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fee Type *</label>
                <select
                  v-model="form.fee_type_id"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Fee Type</option>
                  <option v-for="feeType in feeTypes" :key="feeType.id" :value="feeType.id">
                    {{ feeType.name }} ({{ feeType.code }})
                  </option>
                </select>
              </div>

              <!-- Amount Input -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (₹) *</label>
                <input
                  v-model="form.amount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter amount"
                />
              </div>

              <!-- Payment Model -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Model *</label>
                <select
                  v-model="form.payment_model"
                  required
                  @change="onPaymentModelChange"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Payment Model</option>
                  <option value="installment">Installment-based</option>
                  <option value="monthly">Monthly-based</option>
                </select>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Installment-based: One-time or installment payments | Monthly-based: Monthly payments
                </p>
              </div>

              <!-- Installment-based Fields -->
              <div v-if="form.payment_model === 'installment'" class="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100">Installment Configuration</h4>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Installment Type</label>
                  <select
                    v-model="form.installment_type"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="one_time">One Time</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="half_yearly">Half Yearly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Number of Installments</label>
                  <input
                    v-model="form.installment_count"
                    type="number"
                    min="1"
                    max="12"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., 2 for half-yearly"
                  />
                </div>

                <div v-if="form.installment_count > 1">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Installment Amounts</label>
                  <div class="space-y-2">
                    <div v-for="i in parseInt(form.installment_count)" :key="i" class="flex items-center space-x-2">
                      <span class="text-sm text-gray-600 dark:text-gray-400 w-8">#{{ i }}:</span>
                      <input
                        v-model="form.installment_amounts[i-1]"
                        type="number"
                        step="0.01"
                        min="0"
                        class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        :placeholder="`Installment ${i} amount`"
                      />
                    </div>
                  </div>
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Total: ₹{{ totalInstallmentAmount }}
                  </p>
                </div>
              </div>

              <!-- Monthly-based Fields -->
              <div v-if="form.payment_model === 'monthly'" class="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <h4 class="text-sm font-medium text-green-900 dark:text-green-100">Monthly Configuration</h4>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Payment Amount (₹)</label>
                  <input
                    v-model="form.monthly_payment_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., 1000"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Months</label>
                  <input
                    v-model="form.total_months"
                    type="number"
                    min="1"
                    max="12"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., 12 for full year"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Day of Month</label>
                  <input
                    v-model="form.due_day"
                    type="number"
                    min="1"
                    max="31"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., 10 for 10th of each month"
                  />
                </div>
              </div>

              <!-- Status -->
              <div class="flex items-center">
                <input
                  v-model="form.is_active"
                  type="checkbox"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-900 dark:text-gray-300">Active</label>
              </div>
            </div>

            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isSubmitting || (user?.role === 'super_admin' && !isEditing && (!selectedSchoolId || !selectedBranchId)) || (user?.role === 'school_admin' && !isEditing && !selectedBranchId)"
                class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                {{ isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Create') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiClient } from '~/utils/api';
import { useAuth } from '~/composables/useAuth';
import { useAcademics } from '~/composables/useAcademics';
import { useBranches } from '~/composables/useBranches';
import { useToast } from '~/composables/useToast';
import { PlusIcon, BanknoteIcon } from 'lucide-vue-next';

// SSR-safe window check
const isClient = import.meta.client;

// Get auth context
const { user } = useAuth();
const router = useRouter();
const route = useRoute();
const { academicYears, classes, sections, fetchAcademicYears, fetchClasses, fetchSections, loadSectionsByClass, currentAcademicYear } = useAcademics();
const { fetchBranches } = useBranches();
const { showSuccess, showError } = useToast();

const feeStructures = ref([]);
const feeTypes = ref([]);
const isLoading = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const isSubmitting = ref(false);
const editingId = ref(null);

// School selector for super admin
const selectedSchoolId = ref('');
const availableSchools = ref([]);

// Branch selector for school admin (only for modal)
const selectedBranchId = ref('');
const availableBranches = ref([]);

const form = ref({
  academic_year_id: '',
  class_id: '',
  section_id: '',
  fee_type_id: '',
  amount: '',
  payment_model: '',
  installment_type: 'one_time',
  installment_count: 1,
  installment_amounts: [],
  monthly_payment_amount: '',
  total_months: 12,
  due_day: 10,
  is_active: true
});

// Computed property for current academic year name
const currentAcademicYearName = computed(() => {
  if (academicYears.value && academicYears.value.length > 0) {
    const currentYear = academicYears.value.find(year => year.is_current);
    if (currentYear) {
      return `${currentYear.name} (Current)`;
    }
    return academicYears.value[0]?.name || 'No academic year available';
  }
  return 'Loading...';
});

// Computed property for total installment amount
const totalInstallmentAmount = computed(() => {
  if (form.value.installment_amounts && form.value.installment_amounts.length > 0) {
    return form.value.installment_amounts.reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0).toFixed(2);
  }
  return '0.00';
});

const resetForm = () => {
  form.value = {
    academic_year_id: '',
    class_id: '',
    section_id: '',
    fee_type_id: '',
    amount: '',
    payment_model: '',
    installment_type: 'one_time',
    installment_count: 1,
    installment_amounts: [],
    monthly_payment_amount: '',
    total_months: 12,
    due_day: 10,
    is_active: true
  };
  selectedSchoolId.value = '';
  selectedBranchId.value = '';
  
  // Set current academic year ID if available (only for create mode)
  if (!isEditing.value && academicYears.value && academicYears.value.length > 0) {
    const currentYear = academicYears.value.find(year => year.is_current);
    if (currentYear) {
      form.value.academic_year_id = currentYear.id;
    } else {
      form.value.academic_year_id = academicYears.value[0].id;
    }
  }
};

// Handle payment model change
const onPaymentModelChange = () => {
  if (form.value.payment_model === 'installment') {
    // Reset monthly fields
    form.value.monthly_payment_amount = '';
    form.value.total_months = 12;
  } else if (form.value.payment_model === 'monthly') {
    // Reset installment fields
    form.value.installment_type = 'one_time';
    form.value.installment_count = 1;
    form.value.installment_amounts = [];
  }
};

// Fetch schools for super admin
const fetchSchools = async () => {
  if (user.value?.role !== 'super_admin') return;
  
  try {
    const response = await apiClient.schools.getAll();
    
    // Handle both paginated and non-paginated responses
    if (response.data?.schools) {
      availableSchools.value = response.data.schools;
    } else if (response.data?.items) {
      availableSchools.value = response.data.items;
    } else if (response.data) {
      availableSchools.value = response.data;
    } else {
      availableSchools.value = [];
    }
  } catch (error) {
    console.error('❌ Error fetching schools:', error);
    availableSchools.value = [];
  }
};

// Handle school selection change
const onSchoolChange = async () => {
  selectedBranchId.value = ''; // Reset branch selection
  if (selectedSchoolId.value) {
    try {
      console.log('[FeeStructures] Fetching branches for school:', selectedSchoolId.value);
      const branches = await fetchBranches(selectedSchoolId.value);
      console.log('[FeeStructures] Branches response for school:', branches);
      
      // fetchBranches returns the branches array directly
      if (Array.isArray(branches)) {
        availableBranches.value = branches;
      } else {
        availableBranches.value = [];
      }
      
      console.log('[FeeStructures] Available branches for school:', availableBranches.value);
      
      // Auto-select if only one branch
      if (availableBranches.value.length === 1) {
        selectedBranchId.value = availableBranches.value[0].id;
        console.log('[FeeStructures] Auto-selected branch:', selectedBranchId.value);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      availableBranches.value = [];
    }
  }

  // Reset form when school changes
  if (!isEditing.value) {
    resetForm();
  }
};

// Handle branch selection change
const onBranchChange = async () => {
  // Reset class and section selection when branch changes
  form.value.class_id = '';
  form.value.section_id = '';
  sections.value = []; // Clear sections
  
  // Reload classes for the selected branch
  if (selectedBranchId.value) {
    try {
      const schoolId = user.value?.role === 'super_admin' ? selectedSchoolId.value : user.value?.school_id;
      await fetchClasses(schoolId, selectedBranchId.value);
    } catch (error) {
      console.error('Error loading classes for branch:', error);
    }
  } else {
    classes.value = []; // Clear classes if no branch selected
  }
  
  // Reload fee types for the selected branch
  await fetchFeeTypes();
};

// Fetch branches for school admin
const fetchBranchesForSchoolAdmin = async () => {
  if (user.value?.role !== 'school_admin' || !user.value?.school_id) return;
  
  try {
    console.log('[FeeStructures] Fetching branches for school admin, school_id:', user.value.school_id);
    const branches = await fetchBranches(user.value.school_id);
    console.log('[FeeStructures] Branches response:', branches);
    
    // fetchBranches returns the branches array directly
    if (Array.isArray(branches)) {
      availableBranches.value = branches;
    } else {
      availableBranches.value = [];
    }
    
    console.log('[FeeStructures] Available branches:', availableBranches.value);
    
    // Auto-select if only one branch
    if (availableBranches.value.length === 1) {
      selectedBranchId.value = availableBranches.value[0].id;
      console.log('[FeeStructures] Auto-selected branch:', selectedBranchId.value);
    }
  } catch (error) {
    console.error('Error fetching branches for school admin:', error);
    availableBranches.value = [];
  }
};

const fetchFeeStructures = async () => {
  isLoading.value = true;
  try {
    const params = {};
    if (user.value?.school_id) {
      params.school_id = user.value.school_id;
    }
    const response = await apiClient.feeStructures.getAll(params);
    feeStructures.value = response.data;
  } catch (error) {
    console.error('Error fetching fee structures:', error);
  } finally {
    isLoading.value = false;
  }
};

const fetchFeeTypes = async () => {
  try {
    const params = {};
    if (user.value?.school_id) {
      params.school_id = user.value.school_id;
    }
    // Filter fee types by the selected branch
    if (selectedBranchId.value) {
      params.branch_id = selectedBranchId.value;
    }
    const response = await apiClient.feeTypes.getAll(params);
    feeTypes.value = response.data.filter(type => type.is_active);
  } catch (error) {
    console.error('Error fetching fee types:', error);
  }
};

// Load form data (academic years and classes)
const loadFormData = async () => {
  try {
    const schoolId = user.value?.role === 'super_admin' ? selectedSchoolId.value : user.value?.school_id;
    const branchId = selectedBranchId.value;
    
    // Load academic years
    await fetchAcademicYears();
    
    // Set current academic year ID automatically (only for create mode)
    if (!isEditing.value && academicYears.value && academicYears.value.length > 0) {
      const currentYear = academicYears.value.find(year => year.is_current);
      if (currentYear) {
        form.value.academic_year_id = currentYear.id;
      } else {
        form.value.academic_year_id = academicYears.value[0].id;
      }
    }
    
    // Load classes
    await fetchClasses(schoolId, branchId);
    
    // Load fee types
    await fetchFeeTypes();
  } catch (error) {
    console.error('Error loading form data:', error);
  }
};

// Handle class change to load sections
const onClassChange = async () => {
  form.value.section_id = ''; // Reset section selection
  if (form.value.class_id) {
    try {
      const schoolId = user.value?.role === 'super_admin' ? selectedSchoolId.value : user.value?.school_id;
      const branchId = selectedBranchId.value;
      await loadSectionsByClass(form.value.class_id, schoolId, branchId);
    } catch (error) {
      console.error('Error loading sections for class:', error);
    }
  } else {
    sections.value = []; // Clear sections if no class selected
  }
};

// Watch for user data changes to load branches
watch(user, async (newUser) => {
  if (newUser?.role === 'school_admin' && newUser?.school_id && availableBranches.value.length === 0) {
    console.log('[FeeStructures] User changed, loading branches for school admin');
    await fetchBranchesForSchoolAdmin();
  }
}, { immediate: true });



const openCreateModal = async () => {
  resetForm();
  isEditing.value = false;
  showModal.value = true;
  
  // Load schools for super admin
  if (user.value?.role === 'super_admin') {
    await fetchSchools();
  }

  // Load branches for school admin (always load to ensure fresh data)
  if (user.value?.role === 'school_admin' && user.value?.school_id) {
    await fetchBranchesForSchoolAdmin();
  }

  // Load academic years and classes
  await loadFormData();
};

const editFeeStructure = async (structure) => {
  console.log('🔍 Editing fee structure:', structure);
  
  // Set editing mode first
  isEditing.value = true;
  editingId.value = structure.id;
  
  // Set school and branch context for super admin first
  if (user.value?.role === 'super_admin') {
    selectedSchoolId.value = structure.school_id;
    // Load branches for the school
    if (structure.school_id) {
      try {
        const branches = await fetchBranches(structure.school_id);
        if (Array.isArray(branches)) {
          availableBranches.value = branches;
        } else {
          availableBranches.value = [];
        }
      } catch (error) {
        console.error('Error fetching branches for edit:', error);
      }
    }
  }
  
  // Set branch context
  selectedBranchId.value = structure.branch_id;
  
  // Now load form data with the correct context
  await loadFormData();
  
  // Find the class ID by matching class name (fee structure stores class_name, not class_id)
  let classId = '';
  if (structure.class_name && classes.value.length > 0) {
    const matchingClass = classes.value.find(cls => cls.name === structure.class_name);
    if (matchingClass) {
      classId = matchingClass.id;
      console.log('🔍 Found matching class:', matchingClass.name, 'ID:', classId);
    } else {
      console.log('🔍 No matching class found for:', structure.class_name);
      console.log('🔍 Available classes:', classes.value.map(c => c.name));
    }
  }
  
  // Find the academic year ID by matching academic year name
  let academicYearId = '';
  if (structure.academic_year && academicYears.value.length > 0) {
    const matchingYear = academicYears.value.find(year => year.name === structure.academic_year);
    if (matchingYear) {
      academicYearId = matchingYear.id;
      console.log('🔍 Found matching academic year:', matchingYear.name, 'ID:', academicYearId);
    }
  }
  
  // Find section ID by name if section exists
  let sectionId = '';
  if (structure.section && sections.value.length > 0) {
    const matchingSection = sections.value.find(sec => sec.name === structure.section);
    if (matchingSection) {
      sectionId = matchingSection.id;
      console.log('🔍 Found matching section:', matchingSection.name, 'ID:', sectionId);
    }
  }
  
  // Set form values
  form.value = {
    academic_year_id: academicYearId,
    class_id: classId || '',
    section_id: sectionId || '',
    fee_type_id: structure.fee_type_id,
    amount: structure.amount,
    payment_model: structure.payment_model || 'monthly',
    installment_type: structure.installment_type || 'one_time',
    installment_count: structure.installment_count || 1,
    installment_amounts: structure.installment_amounts || [],
    monthly_payment_amount: structure.monthly_payment_amount || '',
    total_months: structure.total_months || 12,
    due_day: structure.due_day || 10,
    is_active: structure.is_active !== false
  };
  
  console.log('🔍 Form values set:', form.value);
  console.log('🔍 Available classes:', classes.value);
  
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  resetForm();
  editingId.value = null;
};

const saveFeeStructure = async () => {
  isSubmitting.value = true;
  try {
    // Get section name if section_id is provided
    let sectionName = null;
    if (form.value.section_id) {
      const selectedSection = sections.value.find(s => s.id === form.value.section_id);
      sectionName = selectedSection?.name || null;
    }

    const feeStructureData = {
      ...form.value,
      section: sectionName, // Send section name instead of section_id
      school_id: user.value?.role === 'super_admin' ? selectedSchoolId.value : user.value?.school_id,
      branch_id: selectedBranchId.value || user.value?.branch_id
    };

    // Debug: Log the data being sent
    console.log('🔍 Fee structure data being sent:', feeStructureData);

    if (isEditing.value) {
      await apiClient.feeStructures.update(editingId.value, feeStructureData);
      showSuccess('Fee structure updated successfully!');
    } else {
      await apiClient.feeStructures.create(feeStructureData);
      showSuccess('Fee structure created successfully!');
    }

    await fetchFeeStructures();
    closeModal();
  } catch (error) {
    console.error('Error saving fee structure:', error);
    
    // Extract error message from API response
    let errorMessage = 'Failed to save fee structure. Please try again.';
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    showError(errorMessage);
  } finally {
    isSubmitting.value = false;
  }
};

const deleteFeeStructure = async (id) => {
  if (confirm('Are you sure you want to delete this fee structure?')) {
    try {
      await apiClient.feeStructures.delete(id);
      showSuccess('Fee structure deleted successfully!');
      await fetchFeeStructures();
    } catch (error) {
      console.error('Error deleting fee structure:', error);
      
      // Extract error message from API response
      let errorMessage = 'Failed to delete fee structure. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showError(errorMessage);
    }
  }
};

// Watch for classes to be loaded and set class_id if we're in edit mode
watch(classes, (newClasses) => {
  if (isEditing.value && editingId.value && newClasses.length > 0) {
    // Find the fee structure being edited
    const structure = feeStructures.value.find(s => s.id === editingId.value);
    if (structure) {
      // Try to find matching class by name (fee structure stores class_name, not class_id)
      if (structure.class_name) {
        const matchingClass = newClasses.find(cls => cls.name === structure.class_name);
        if (matchingClass) {
          form.value.class_id = matchingClass.id;
          console.log('🔍 Watcher: Set class_id to', matchingClass.id, 'for class', matchingClass.name);
        } else {
          console.log('🔍 Watcher: No matching class found for:', structure.class_name);
        }
      }
    }
  }
}, { immediate: true });

// Watch for academic years to be loaded and set academic_year_id if we're in edit mode
watch(academicYears, (newYears) => {
  if (isEditing.value && editingId.value && newYears.length > 0) {
    // Find the fee structure being edited
    const structure = feeStructures.value.find(s => s.id === editingId.value);
    if (structure && structure.academic_year) {
      const matchingYear = newYears.find(year => year.name === structure.academic_year);
      if (matchingYear) {
        form.value.academic_year_id = matchingYear.id;
        console.log('🔍 Watcher: Set academic_year_id to', matchingYear.id, 'for year', matchingYear.name);
      }
    }
  }
}, { immediate: true });

// Watch for sections to be loaded and set section_id if we're in edit mode
watch(sections, (newSections) => {
  if (isEditing.value && editingId.value && newSections.length > 0) {
    // Find the fee structure being edited
    const structure = feeStructures.value.find(s => s.id === editingId.value);
    if (structure && structure.section) {
      const matchingSection = newSections.find(sec => sec.name === structure.section);
      if (matchingSection) {
        form.value.section_id = matchingSection.id;
        console.log('🔍 Watcher: Set section_id to', matchingSection.id, 'for section', matchingSection.name);
      }
    }
  }
}, { immediate: true });

// Handle window resize
let resizeObserver;

// Add missing checkMobile function
const checkMobile = () => {
  // This function was referenced but not defined
  // For now, we'll leave it empty as it's not critical for dropdown functionality
};

onMounted(async () => {
  if (isClient) {
    // Load schools for super admin on component mount
    if (user.value?.role === 'super_admin') {
      await fetchSchools();
    }
    
    // Load branches for school admin on component mount
    if (user.value?.role === 'school_admin') {
      await fetchBranchesForSchoolAdmin();
    }
    
    // Load fee structures and fee types
    await Promise.all([fetchFeeStructures(), fetchFeeTypes()]);
    
    // Setup resize observer
    resizeObserver = new ResizeObserver(() => {
      checkMobile();
    });
    resizeObserver.observe(document.body);
  }
});

onBeforeUnmount(() => {
  if (isClient && resizeObserver) {
    resizeObserver.disconnect();
  }
});
</script>

<style scoped>
/****************************************************
  Tailwind CSS styles are generated from utilities.
  Add custom styles here.
****************************************************/
</style>
