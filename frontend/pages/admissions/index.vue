<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Student Admissions</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">Manage student admissions and view admitted students</p>
        </div>
        <div class="mt-4 sm:mt-0 sm:flex sm:space-x-3">
          <button
            @click="navigateTo('/admissions/create')"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus class="-ml-1 mr-2 h-5 w-5" />
            New Admission
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <FileText class="h-6 w-6 text-blue-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Admissions</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ stats.totalAdmissions || 0 }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <UserPlus class="h-6 w-6 text-green-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Admitted Students</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ stats.admittedStudents || 0 }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <CheckCircle class="h-6 w-6 text-purple-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">This Month</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ stats.thisMonth || 0 }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
        <div class="px-4 py-5 sm:p-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Academic Year</label>
              <select v-model="filters.academic_year" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                <option value="">All Years</option>
                <option value="2024-25">2024-25</option>
                <option value="2023-24">2023-24</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Class</label>
              <select v-model="filters.class_name" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                <option value="">All Classes</option>
                <option value="1st">1st</option>
                <option value="2nd">2nd</option>
                <option value="3rd">3rd</option>
                <option value="4th">4th</option>
                <option value="5th">5th</option>
                <option value="6th">6th</option>
                <option value="7th">7th</option>
                <option value="8th">8th</option>
                <option value="9th">9th</option>
                <option value="10th">10th</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Admission Type</label>
              <select v-model="filters.admission_type" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                <option value="">All Types</option>
                <option value="new">New</option>
                <option value="transfer">Transfer</option>
                <option value="readmission">Readmission</option>
              </select>
            </div>
            <div class="flex items-end">
              <button
                @click="fetchAdmissions"
                class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Search class="-ml-1 mr-2 h-4 w-4" />
                Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Admissions Table -->
      <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">Admitted Students</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Application</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Class</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Admission Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="admission in admissions" :key="admission.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {{ admission.application_number }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <img v-if="admission.student?.photo" :src="admission.student.photo" alt="" class="h-10 w-10 rounded-full" />
                      <div v-else class="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {{ admission.student?.first_name?.charAt(0) }}{{ admission.student?.last_name?.charAt(0) }}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ admission.student?.first_name }} {{ admission.student?.last_name }}
                      </div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">
                        {{ admission.student?.email || 'No email' }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ admission.applied_class || 'N/A' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <span class="capitalize">{{ admission.admission_type }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ formatDate(admission.application_date) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getStatusClass(admission.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                    {{ getStatusText(admission.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    @click="viewAdmission(admission)"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                  >
                    View
                  </button>
                  <button
                    v-if="admission.student_id && authStore.isAuthenticated"
                    @click="viewStudent(admission.student_id)"
                    class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                  >
                    Student Profile
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div class="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
          <div class="flex-1 flex justify-between sm:hidden">
            <button
              @click="previousPage"
              :disabled="currentPage === 1"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              @click="nextPage"
              :disabled="currentPage >= totalPages"
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700 dark:text-gray-300">
                Showing <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span> to <span class="font-medium">{{ Math.min(currentPage * pageSize, totalItems) }}</span> of <span class="font-medium">{{ totalItems }}</span> results
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  @click="previousPage"
                  :disabled="currentPage === 1"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  @click="nextPage"
                  :disabled="currentPage >= totalPages"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Admission Detail Modal -->
    <div v-if="showAdmissionModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Admission Details</h3>
            <button
              @click="showAdmissionModal = false"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <div v-if="selectedAdmission" class="space-y-6">
            <!-- Basic Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 class="font-medium text-gray-900 dark:text-white mb-3">Basic Information</h4>
                <dl class="space-y-2">
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Application Number</dt>
                    <dd class="text-sm text-gray-900 dark:text-white">{{ selectedAdmission.application_number }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Student Name</dt>
                    <dd class="text-sm text-gray-900 dark:text-white">{{ selectedAdmission.first_name }} {{ selectedAdmission.last_name }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Class</dt>
                    <dd class="text-sm text-gray-900 dark:text-white">{{ selectedAdmission.applied_class }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Admission Type</dt>
                    <dd class="text-sm text-gray-900 dark:text-white">{{ selectedAdmission.admission_type }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                    <dd class="text-sm">
                      <span :class="getStatusClass(selectedAdmission.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                        {{ getStatusText(selectedAdmission.status) }}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Admission Date</dt>
                    <dd class="text-sm text-gray-900 dark:text-white">{{ formatDate(selectedAdmission.application_date) }}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 class="font-medium text-gray-900 dark:text-white mb-3">Contact Information</h4>
                <dl class="space-y-2">
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                    <dd class="text-sm text-gray-900 dark:text-white">{{ selectedAdmission.email || 'Not provided' }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</dt>
                    <dd class="text-sm text-gray-900 dark:text-white">{{ selectedAdmission.phone || 'Not provided' }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Address</dt>
                    <dd class="text-sm text-gray-900 dark:text-white">{{ selectedAdmission.address || 'Not provided' }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">City</dt>
                    <dd class="text-sm text-gray-900 dark:text-white">{{ selectedAdmission.city || 'Not provided' }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">State</dt>
                    <dd class="text-sm text-gray-900 dark:text-white">{{ selectedAdmission.state || 'Not provided' }}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <!-- Student Information (if available) -->
            <div v-if="selectedAdmission.student" class="border-t pt-6">
              <h4 class="font-medium text-gray-900 dark:text-white mb-3">Student Information</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <dl class="space-y-2">
                    <div>
                      <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Student ID</dt>
                      <dd class="text-sm text-gray-900 dark:text-white">{{ selectedAdmission.student.id }}</dd>
                    </div>
                    <div>
                      <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Admission Number</dt>
                      <dd class="text-sm text-gray-900 dark:text-white">{{ selectedAdmission.student.admission_number }}</dd>
                    </div>
                    <div>
                      <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Current Class</dt>
                      <dd class="text-sm text-gray-900 dark:text-white">{{ selectedAdmission.student.current_class }}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <dl class="space-y-2">
                    <div>
                      <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Student Email</dt>
                      <dd class="text-sm text-gray-900 dark:text-white">{{ selectedAdmission.student.email || 'Not provided' }}</dd>
                    </div>
                    <div>
                      <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Student Phone</dt>
                      <dd class="text-sm text-gray-900 dark:text-white">{{ selectedAdmission.student.phone || 'Not provided' }}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="border-t pt-6 flex justify-end space-x-3">
              <button
                v-if="selectedAdmission.student_id"
                @click="viewStudent(selectedAdmission.student_id)"
                class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
              >
                View Student Profile
              </button>
              <button
                @click="showAdmissionModal = false"
                class="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { 
  Plus, 
  FileText, 
  CheckCircle, 
  UserPlus,
  Search
} from 'lucide-vue-next';
import apiClient from '~/utils/api';
import { useAuthStore } from '~/stores/auth';

// State
const admissions = ref([]);
const stats = ref({});
const isLoading = ref(false);

// Modal state
const showAdmissionModal = ref(false);
const selectedAdmission = ref(null);

// Auth store
const authStore = useAuthStore();

// Pagination
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
const totalPages = ref(0);

// Filters
const filters = reactive({
  academic_year: '',
  class_name: '',
  admission_type: '',
});

// Methods
const fetchAdmissions = async () => {
  isLoading.value = true;
  try {
    // Check if user is authenticated
    if (!authStore.isAuthenticated) {
      console.error('User not authenticated');
      return;
    }
    
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      status: 'admitted,approved', // Show both admitted and approved students
      ...filters
    };
    
    const response = await apiClient.admissions.getAll(params);
    admissions.value = response.data.items || response.data || [];
    totalItems.value = response.pagination?.total || 0;
    totalPages.value = response.pagination?.totalPages || 0;
    
    // Debug logging
    console.log('Admissions data:', admissions.value);
    admissions.value.forEach(admission => {
      console.log('Admission:', {
        id: admission.id,
        application_number: admission.application_number,
        student_id: admission.student_id,
        student: admission.student,
        status: admission.status
      });
    });
  } catch (error) {
    console.error('Error fetching admissions:', error);
  } finally {
    isLoading.value = false;
  }
};

const fetchStats = async () => {
  try {
    // This would be a new endpoint for admission statistics
    const response = await apiClient.admissions.getStats();
    stats.value = response.data || {};
  } catch (error) {
    console.error('Error fetching admission stats:', error);
  }
};

const viewAdmission = (admission) => {
  selectedAdmission.value = admission;
  showAdmissionModal.value = true;
};

const viewStudent = (studentId) => {
  if (!authStore.isAuthenticated) {
    console.error('User not authenticated');
    // Redirect to login
    navigateTo('/login');
    return;
  }
  navigateTo(`/students/${studentId}`);
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchAdmissions();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchAdmissions();
  }
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN');
};

const getStatusClass = (status) => {
  const classes = {
    admitted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  };
  return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
};

const getStatusText = (status) => {
  const texts = {
    admitted: 'Admitted',
    approved: 'Admitted', // Show approved as admitted since student is created
    active: 'Active',
  };
  return texts[status] || 'Admitted';
};

onMounted(async () => {
  await fetchAdmissions();
  await fetchStats();
});
</script> 