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
          >
            <option value="">Select Branch</option>
            <option v-for="branch in availableBranches" :key="branch.id" :value="branch.id">
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
          >
            <option value="">Select Role</option>
            <option v-for="roleOption in EMPLOYEE_ROLES" :key="roleOption.value" :value="roleOption.value">
              {{ roleOption.label }}
            </option>
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
            :disabled="!filters.branch_id || employeeTemplates.length === 0"
          >
            <option value="">
              {{ employeeTemplates.length === 0 && filters.branch_id ? `No ${user_type.value} templates found for this branch` : 'Select Template' }}
            </option>
            <option v-for="template in employeeTemplates" :key="template.id" :value="template.id">
              {{ template.name }}
            </option>
          </select>
          <p v-if="filters.branch_id && employeeTemplates.length === 0 && templates.value.length === 0" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            No templates found for this branch. Please create {{ user_type.value }} certificate templates first.
          </p>
          <p v-else-if="filters.branch_id && employeeTemplates.length === 0 && templates.value.length > 0" class="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
            Found {{ templates.value.length }} template(s) but none are for {{ user_type.value }}s. Please create {{ user_type.value }} certificate templates.
          </p>
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
          />
        </div>
      </div>

      <div class="flex items-center gap-4">
        <button
          @click="loadEmployees"
          :disabled="!filters.branch_id"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Search class="h-4 w-4 mr-2" />
          Load Employees
        </button>
        
        <button
          @click="generateCertificates"
          :disabled="selectedEmployees.length === 0 || !filters.template_id || employees.length === 0"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText class="h-4 w-4 mr-2" />
          Generate Certificates
        </button>
      </div>
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
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { Search, FileText, Users } from 'lucide-vue-next';
import { useRoute } from 'vue-router';
import { useBranches } from '~/composables/useBranches';
import { useCertificateTemplates } from '~/composables/useCertificateTemplates';
import { useToast } from '~/composables/useToast';
import { Users as UsersApi } from '~/api';
import { useAuth } from '~/composables/useAuth';

// Props - allow user_type to be passed, otherwise determine from route
const props = defineProps({
  userType: {
    type: String,
    default: null
  }
});

const route = useRoute();

// Determine user_type from route or prop
// Route-based: /certificates/generate-employees -> 'employee'
// Route-based: /certificates/generate-students -> 'student'
const user_type = computed(() => {
  if (props.userType) {
    return props.userType;
  }
  
  // Determine from route path
  const path = route.path || '';
  if (path.includes('generate-employees') || path.includes('employee')) {
    return 'employee';
  }
  if (path.includes('generate-students') || path.includes('student')) {
    return 'student';
  }
  
  // Default fallback
  return 'employee';
});

// Composables
const { branches, availableBranches, fetchBranchesForUser } = useBranches();
const { templates, loadTemplates, generateEmployeeCertificates } = useCertificateTemplates();
const { showToast } = useToast();
const { user } = useAuth();

// Employee roles (excluding student, parent, super_admin as these are not employees)
const EMPLOYEE_ROLES = [
  { value: 'teacher', label: 'Teacher' },
  { value: 'branch_admin', label: 'Branch Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'librarian', label: 'Librarian' },
  { value: 'receptionist', label: 'Receptionist' }
];

// Templates are already filtered by backend with branch_id and user_type
const employeeTemplates = computed(() => {
  // Only return templates if branch_id is selected and templates are loaded
  // This ensures we don't show templates from other branches or before branch is selected
  if (!filters.branch_id) {
    return [];
  }
  // Backend returns only templates for the selected branch and user_type, so no need to filter again
  return templates.value || [];
});

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

// Format role label for display
const formatRoleLabel = (role) => {
  const roleObj = EMPLOYEE_ROLES.find(r => r.value === role);
  return roleObj ? roleObj.label : role.charAt(0).toUpperCase() + role.slice(1);
};

// Map User model to employee display format
const mapUserToEmployee = (userData) => {
  return {
    id: userData.id,
    name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
    staff_id: userData.id?.substring(0, 8).toUpperCase() || 'N/A', // Use first 8 chars of UUID as staff ID
    department: 'N/A', // Department doesn't exist in User model
    designation: formatRoleLabel(userData.role),
    mobile_no: userData.phone || 'N/A',
    role: userData.role,
    // Preserve original user data for certificate generation
    originalUser: {
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      phone: userData.phone
    }
  };
};

// Methods
// Load templates for the selected branch
const loadTemplatesForBranch = async () => {
  if (!filters.branch_id) {
    // Clear templates when no branch is selected
    templates.value = [];
    return;
  }
  
  try {
    // Clear previous templates before loading new ones to prevent showing wrong templates
    templates.value = [];
    
    const currentUserType = user_type.value;
    console.log('Loading templates for branch:', filters.branch_id, 'user_type:', currentUserType);
    // Filter by user_type on backend to get only templates for the current user type
    // Backend will filter by both branch_id and user_type
    await loadTemplates({ 
      branch_id: filters.branch_id,
      user_type: currentUserType
    });
    console.log('Templates loaded:', templates.value.length, 'templates for branch', filters.branch_id, 'user_type', currentUserType);
  } catch (error) {
    console.error('Error loading templates:', error);
    showToast('Failed to load certificate templates', 'error');
    templates.value = [];
  }
};

const loadEmployees = async () => {
  if (!filters.branch_id) {
    showToast('Please select a branch', 'warning');
    return;
  }

  try {
    loading.value = true;
    
    // Build query params for Users API
    const params = {
      branch_id: filters.branch_id,
      page: 1,
      limit: 1000, // Load many employees at once
      status: 'active'
    };
    
    // Add role filter if selected
    if (filters.role) {
      params.role = filters.role;
    }
    
    // Add search filter if provided
    if (filters.search && filters.search.trim()) {
      params.search = filters.search.trim();
    }
    
    // Fetch users from API
    const response = await UsersApi.getAll(params);
    
    // Handle response structure
    let usersList = [];
    if (response.data && response.data.users && Array.isArray(response.data.users)) {
      usersList = response.data.users;
    } else if (response.data && Array.isArray(response.data)) {
      usersList = response.data;
    }
    
    // Filter out student and parent roles (only show employees)
    const employeeRoles = EMPLOYEE_ROLES.map(r => r.value);
    usersList = usersList.filter(user => employeeRoles.includes(user.role));
    
    // Map users to employee format
    employees.value = usersList.map(mapUserToEmployee);
    
    if (employees.value.length === 0) {
      showToast('No employees found for the selected filters', 'info');
    } else {
      showToast(`Loaded ${employees.value.length} employee(s)`, 'success');
    }
  } catch (error) {
    const errorMsg = error?.response?.data?.message || error?.message || 'Failed to load employees';
    showToast(errorMsg, 'error');
    employees.value = [];
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

  if (!filters.branch_id) {
    showToast('Please select a branch', 'warning');
    return;
  }

  try {
    loading.value = true;

    const result = await generateEmployeeCertificates({
      employee_ids: selectedEmployees.value,
      template_id: filters.template_id,
      print_date: filters.print_date,
      branch_id: filters.branch_id
    });

    if (result.success) {
      showToast(`Successfully generated ${selectedEmployees.value.length} certificates`, 'success');

      // Show print preview for certificates
      await printCertificates(selectedEmployees.value, result.data);

      emit(
        'success',
        `Employee certificates generated successfully for ${selectedEmployees.value.length} employees`
      );

      // Reset selections after successful generation
      selectedEmployees.value = [];
    } else {
      showToast(result.message || 'Failed to generate certificates', 'error');
    }
  } catch (error) {
    const errorMsg = error?.response?.data?.message || error?.message || 'Failed to generate certificates';
    showToast(errorMsg, 'error');
  } finally {
    loading.value = false;
  }
};

const printCertificates = async (employeeIds, certificateData) => {
  try {
    // Get selected employees data
    const selectedEmployeesData = employees.value.filter(employee => employeeIds.includes(employee.id));

    if (selectedEmployeesData.length === 0) {
      showToast('No employee data found for printing', 'error');
      return;
    }

    // Get the selected template
    const selectedTemplate = templates.value.find(t => t.id === filters.template_id);
    if (!selectedTemplate) {
      showToast('Template not found', 'error');
      return;
    }

    // Check template content
    if (!selectedTemplate.content) {
      showToast('Selected template has no content. Please check the template.', 'error');
      return;
    }

    // Generate individual certificates for each employee
    const certificateHTMLs = selectedEmployeesData.map(employee => {
      return generateCertificateHTML(employee, selectedTemplate);
    });

    // Create a combined HTML document for all certificates
    const combinedHTML = createCombinedCertificateHTML(certificateHTMLs, selectedTemplate.name);

    // Open print preview with the certificate HTML
    await openCertificatePrintPreview(combinedHTML, selectedTemplate.name);
  } catch (error) {
    console.error('Error printing certificates:', error);
    showToast('Error opening print preview', 'error');
  }
};

// Generate HTML for a single certificate using the template
const generateCertificateHTML = (employee, template) => {
  // Check if template has content
  if (!template.content) {
    console.error('Template has no content:', template);
    return '<div style="padding: 20px; text-align: center; color: red;">Template content not found</div>';
  }

  // Replace dynamic tags in template content with actual employee data
  let certificateContent = template.content;

  // Get original user data if available (stored in employee object)
  const originalUser = employee.originalUser || employee;

  // Replace common dynamic tags
  const replacements = {
    '{name}': employee.name || 'N/A',
    '{first_name}': originalUser.first_name || employee.name?.split(' ')[0] || 'N/A',
    '{last_name}': originalUser.last_name || employee.name?.split(' ').slice(1).join(' ') || 'N/A',
    '{staff_id}': employee.staff_id || 'N/A',
    '{employee_id}': employee.staff_id || employee.id?.substring(0, 8).toUpperCase() || 'N/A',
    '{designation}': employee.designation || 'N/A',
    '{role}': employee.role || employee.designation || 'N/A',
    '{department}': employee.department || 'N/A',
    '{mobile_no}': employee.mobile_no || originalUser.phone || 'N/A',
    '{phone}': employee.mobile_no || originalUser.phone || 'N/A',
    '{email}': originalUser.email || 'N/A',
    '{print_date}': filters.print_date,
    '{current_date}': new Date().toLocaleDateString(),
    '{certificate_id}': `CERT-${Date.now()}-${employee.id.slice(-4)}`
  };

  // Replace all dynamic tags
  Object.entries(replacements).forEach(([tag, value]) => {
    certificateContent = certificateContent.replace(new RegExp(tag, 'g'), value);
  });

  return certificateContent;
};

// Create combined HTML document for all certificates
const createCombinedCertificateHTML = (certificateHTMLs, templateName) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${templateName} - Certificates</title>
      <style>
        @media print {
          @page {
            size: A4;
            margin: 0.5in;
          }
          .certificate-page {
            page-break-after: always;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .certificate-page:last-child {
            page-break-after: avoid;
          }
        }
        
        body {
          font-family: 'Times New Roman', serif;
          margin: 0;
          padding: 20px;
          background: #f5f5f5;
        }
        
        .certificate-page {
          background: white;
          margin: 20px 0;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .certificate-content {
          width: 100%;
          max-width: 800px;
          text-align: center;
        }
        
        .print-controls {
          position: fixed;
          top: 20px;
          right: 20px;
          background: white;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          z-index: 1000;
        }
        
        .print-controls button {
          margin: 0 8px;
          padding: 10px 20px;
          border: 1px solid #ddd;
          background: #f8f9fa;
          cursor: pointer;
          border-radius: 6px;
          font-size: 12px;
        }
        
        .print-controls button:hover {
          background: #e9ecef;
        }
        
        .print-controls button.primary {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }
        
        .print-controls button.success {
          background: #28a745;
          color: white;
          border-color: #28a745;
        }
      </style>
    </head>
    <body>
      <div class="print-controls">
        <button onclick="window.print()" class="primary">Print Certificates</button>
        <button onclick="window.print()" class="success">Save as PDF</button>
        <button onclick="window.close()">Close</button>
      </div>
      
      ${certificateHTMLs
        .map(
          html => `
        <div class="certificate-page">
          <div class="certificate-content">
            ${html}
          </div>
        </div>
      `
        )
        .join('')}
    </body>
    </html>
  `;
};

// Open certificate print preview
const openCertificatePrintPreview = async (htmlContent, title) => {
  try {
    const previewWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!previewWindow) {
      throw new Error('Please allow popups to view print preview');
    }

    previewWindow.document.write(htmlContent);
    previewWindow.document.close();
    previewWindow.focus();
  } catch (error) {
    console.error('Error opening certificate print preview:', error);
    throw error;
  }
};

// Emits
const emit = defineEmits(['success']);

// Watch for branch changes to reload templates
watch(
  () => filters.branch_id,
  async (newBranchId, oldBranchId) => {
    // Reset filters when branch changes
    if (newBranchId !== oldBranchId) {
      filters.role = '';
      filters.template_id = '';
      employees.value = [];
      selectedEmployees.value = [];
    }
    
    // Load templates for the selected branch
    await loadTemplatesForBranch();
  }
);

// Clear employees when role or search changes (user must click Load Employees button)
watch(
  () => [filters.role, filters.search],
  () => {
    employees.value = [];
    selectedEmployees.value = [];
  }
);

onMounted(async () => {
  try {
    // Initialize: don't load employees automatically
    employees.value = [];
    selectedEmployees.value = [];
    
    await fetchBranchesForUser();
    
    // Auto-select branch if only one branch available
    if (availableBranches.value.length === 1) {
      filters.branch_id = availableBranches.value[0].id;
      // Templates will load automatically via watcher
    }
  } catch (error) {
    console.error('Error initializing component:', error);
    showToast('Failed to initialize', 'error');
  }
});
</script>
