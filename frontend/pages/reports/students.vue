<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Student Reports</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">Comprehensive student analytics and insights</p>
        </div>
        <div class="mt-4 sm:mt-0 sm:flex sm:space-x-3">
          <button
            @click="exportReport"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Download class="-ml-1 mr-2 h-5 w-5" />
            Export Report
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <Users class="h-6 w-6 text-blue-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Students</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ stats.totalStudents || 0 }}</dd>
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
                          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">New Students</dt>
        <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ stats.newStudents || 0 }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <GraduationCap class="h-6 w-6 text-purple-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Active Students</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ stats.activeStudents || 0 }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <UserMinus class="h-6 w-6 text-red-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Inactive Students</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ stats.inactiveStudents || 0 }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
        <div class="px-4 py-5 sm:p-6">
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Academic Year</label>
              <select v-model="filters.academic_year" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                <option value="">All Years</option>
                <option v-for="year in academicYears" :key="year.id" :value="year.year">{{ year.year }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Class</label>
              <select v-model="filters.class_name" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                <option value="">All Classes</option>
                <option v-for="classItem in classes" :key="classItem.id" :value="classItem.name">{{ classItem.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Section</label>
              <select v-model="filters.section_name" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                <option value="">All Sections</option>
                <option v-for="section in sections" :key="section.id" :value="section.name">{{ section.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <select v-model="filters.status" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="transferred">Transferred</option>
                <option value="graduated">Graduated</option>
              </select>
            </div>
            <div class="flex items-end">
              <button
                @click="fetchReport"
                class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Search class="-ml-1 mr-2 h-4 w-4" />
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Class Distribution Chart -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Student Distribution by Class</h3>
          <div class="h-64 flex items-center justify-center">
            <div class="text-center">
              <BarChart3 class="mx-auto h-12 w-12 text-gray-400" />
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Chart will be implemented with Chart.js</p>
            </div>
          </div>
        </div>

        <!-- Gender Distribution Chart -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Gender Distribution</h3>
          <div class="h-64 flex items-center justify-center">
            <div class="text-center">
              <PieChart class="mx-auto h-12 w-12 text-gray-400" />
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Chart will be implemented with Chart.js</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Students Table -->
      <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">Student Report</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Class</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Admission Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fee Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="student in students" :key="student.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <img v-if="student.photo" :src="student.photo" alt="" class="h-10 w-10 rounded-full" />
                      <div v-else class="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {{ student.first_name?.charAt(0) }}{{ student.last_name?.charAt(0) }}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ student.first_name }} {{ student.last_name }}
                      </div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">
                        {{ student.admission_number }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ student.class?.name || student.class_name }}{{ student.section?.name ? `-${student.section.name}` : '' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ formatDate(student.admission_date) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getStatusClass(student.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                    {{ getStatusText(student.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getFeeStatusClass(student.fee_status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                    {{ getFeeStatusText(student.fee_status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    @click="viewStudent(student)"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                  >
                    View
                  </button>
                  <button
                    @click="viewFees(student)"
                    class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                  >
                    Fees
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { 
  Download, 
  Users, 
  UserPlus, 
  GraduationCap,
  UserMinus,
  Search,
  BarChart3,
  PieChart
} from 'lucide-vue-next';
import apiClient from '~/utils/api';

// State
const students = ref([]);
const stats = ref({});
const academicYears = ref([]);
const classes = ref([]);
const sections = ref([]);
const isLoading = ref(false);

// Pagination
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
const totalPages = ref(0);

// Filters
const filters = reactive({
  academic_year: '',
  class_name: '',
  section_name: '',
  status: '',
});

// Methods
const fetchReport = async () => {
  isLoading.value = true;
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      ...filters
    };
    
    const response = await apiClient.students.getReport(params);
    students.value = response.data?.items || response.data || [];
    totalItems.value = response.pagination?.total || 0;
    totalPages.value = response.pagination?.totalPages || 0;
  } catch (error) {
    console.error('Error fetching student report:', error);
  } finally {
    isLoading.value = false;
  }
};

const fetchStats = async () => {
  try {
    const response = await apiClient.students.getStats();
    stats.value = response.data || {};
  } catch (error) {
    console.error('Error fetching student stats:', error);
  }
};

const fetchAcademicYears = async () => {
  try {
    const response = await apiClient.academicYears.getAll();
    academicYears.value = response.data || [];
  } catch (error) {
    console.error('Error fetching academic years:', error);
  }
};

const fetchClasses = async () => {
  try {
    const response = await apiClient.classes.getAll();
    classes.value = response.data || [];
  } catch (error) {
    console.error('Error fetching classes:', error);
  }
};

const fetchSections = async () => {
  try {
    const response = await apiClient.sections.getAll();
    sections.value = response.data || [];
  } catch (error) {
    console.error('Error fetching sections:', error);
  }
};

const exportReport = async () => {
  try {
    const params = new URLSearchParams(filters);
    const response = await apiClient.students.exportReport(params.toString());
    
    // Create download link
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student-report-${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting report:', error);
  }
};

const viewStudent = (student) => {
  navigateTo(`/students/${student.id}`);
};

const viewFees = (student) => {
  navigateTo(`/fees/invoices?student_id=${student.id}`);
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchReport();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchReport();
  }
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN');
};

const getStatusClass = (status) => {
  const classes = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    inactive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    transferred: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    graduated: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  };
  return classes[status] || classes.active;
};

const getStatusText = (status) => {
  const texts = {
    active: 'Active',
    inactive: 'Inactive',
    transferred: 'Transferred',
    graduated: 'Graduated',
  };
  return texts[status] || status;
};

const getFeeStatusClass = (status) => {
  const classes = {
    paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    unpaid: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return classes[status] || classes.unpaid;
};

const getFeeStatusText = (status) => {
  const texts = {
    paid: 'Paid',
    partial: 'Partial',
    unpaid: 'Unpaid',
  };
  return texts[status] || status;
};

onMounted(async () => {
  await Promise.all([
    fetchReport(),
    fetchStats(),
    fetchAcademicYears(),
    fetchClasses(),
    fetchSections()
  ]);
});
</script> 