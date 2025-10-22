<template>
  <div class="space-y-6">
    <!-- Selection Form -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Select Employees for Certificate Generation
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <!-- Branch Selection -->
        <div>
          <label
            for="branch"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Branch
          </label>
          <select
            id="branch"
            v-model="filters.branch_id"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            @change="loadRoles"
          >
            <option value="">Select Branch</option>
            <option v-for="branch in branches" :key="branch.id" :value="branch.id">
              {{ branch.name }}
            </option>
          </select>
        </div>

        <!-- Role Selection -->
        <div>
          <label for="role" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Role
          </label>
          <select
            id="role"
            v-model="filters.role"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            @change="loadEmployees"
          >
            <option value="">Select Role</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="principal">Principal</option>
          </select>
        </div>

        <!-- Template Selection -->
        <div>
          <label
            for="template"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Certificate Template
          </label>
          <select
            id="template"
            v-model="filters.template_id"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select Template</option>
            <option v-for="template in employeeTemplates" :key="template.id" :value="template.id">
              {{ template.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <!-- Print Date -->
        <div>
          <label
            for="printDate"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Print Date
          </label>
          <input
            id="printDate"
            v-model="filters.print_date"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <!-- Search Employees -->
        <div>
          <label
            for="search"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Search Employees
          </label>
          <input
            id="search"
            v-model="filters.search"
            type="text"
            placeholder="Search by name or staff ID..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            @input="loadEmployees"
          />
        </div>
      </div>

      <button
        @click="loadEmployees"
        :disabled="!filters.branch_id"
        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Search class="h-4 w-4 mr-2" />
        Load Employees
      </button>
    </div>

    <!-- Employees List -->
    <div v-if="employees.length > 0" class="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Select Employees ({{ employees.length }} found)
          </h3>
          <div class="flex items-center space-x-2">
            <button @click="selectAll" class="text-sm text-indigo-600 hover:text-indigo-500">
              Select All
            </button>
            <button @click="deselectAll" class="text-sm text-gray-600 hover:text-gray-500">
              Deselect All
            </button>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                <input
                  type="checkbox"
                  :checked="allSelected"
                  @change="toggleAll"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Name
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Staff ID
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Department
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Designation
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Mobile
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="employee in employees" :key="employee.id">
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  :checked="selectedEmployees.includes(employee.id)"
                  @change="toggleEmployee(employee.id)"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
              >
                {{ employee.name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ employee.staff_id }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ employee.department }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ employee.designation }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ employee.mobile_no }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-700 dark:text-gray-300">
            {{ selectedEmployees.length }} of {{ employees.length }} employees selected
          </span>
          <button
            @click="generateCertificates"
            :disabled="selectedEmployees.length === 0 || !filters.template_id"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText class="h-4 w-4 mr-2" />
            Generate Certificates
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading" class="text-center py-12">
      <Users class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No employees found</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Please select branch and role to load employees.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { Search, FileText, Users } from 'lucide-vue-next';
import { useBranches } from '~/composables/useBranches';
import { useCertificateTemplates } from '~/composables/useCertificateTemplates';
import { useToast } from '~/composables/useToast';

// Composables
const { branches, loadBranches } = useBranches();
const { employeeTemplates, loadEmployeeTemplates } = useCertificateTemplates();
const { showToast } = useToast();

// Reactive data
const loading = ref(false);
const employees = ref([]);
const selectedEmployees = ref([]);
const filters = reactive({
  branch_id: '',
  role: '',
  template_id: '',
  print_date: new Date().toISOString().split('T')[0],
  search: ''
});

// Computed
const allSelected = computed(() => {
  return employees.value.length > 0 && selectedEmployees.value.length === employees.value.length;
});

// Methods
const loadRoles = async () => {
  // Load roles for selected branch
  console.log('Loading roles for branch:', filters.branch_id);
};

const loadEmployees = async () => {
  if (!filters.branch_id) {
    showToast('Please select a branch', 'warning');
    return;
  }

  try {
    loading.value = true;
    // Load employees based on filters
    console.log('Loading employees with filters:', filters);

    // Mock data for now
    employees.value = [
      {
        id: '1',
        name: 'John Doe',
        staff_id: 'EMP001',
        department: 'Academic',
        designation: 'Teacher',
        mobile_no: '+1234567890'
      },
      {
        id: '2',
        name: 'Jane Smith',
        staff_id: 'EMP002',
        department: 'Administration',
        designation: 'Admin',
        mobile_no: '+1234567891'
      }
    ];
  } catch (error) {
    showToast('Failed to load employees', 'error');
  } finally {
    loading.value = false;
  }
};

const selectAll = () => {
  selectedEmployees.value = employees.value.map(employee => employee.id);
};

const deselectAll = () => {
  selectedEmployees.value = [];
};

const toggleAll = () => {
  if (allSelected.value) {
    deselectAll();
  } else {
    selectAll();
  }
};

const toggleEmployee = employeeId => {
  const index = selectedEmployees.value.indexOf(employeeId);
  if (index > -1) {
    selectedEmployees.value.splice(index, 1);
  } else {
    selectedEmployees.value.push(employeeId);
  }
};

const generateCertificates = async () => {
  if (selectedEmployees.value.length === 0) {
    showToast('Please select at least one employee', 'warning');
    return;
  }

  if (!filters.template_id) {
    showToast('Please select a certificate template', 'warning');
    return;
  }

  try {
    // Generate certificates for selected employees
    console.log('Generating certificates for employees:', selectedEmployees.value);
    console.log('Using template:', filters.template_id);
    console.log('Print date:', filters.print_date);

    showToast('Certificates generated successfully', 'success');
    emit('success', 'Employee certificates generated successfully');
  } catch (error) {
    showToast('Failed to generate certificates', 'error');
  }
};

// Emits
const emit = defineEmits(['success']);

onMounted(async () => {
  await loadBranches();
  await loadEmployeeTemplates();
});
</script>
