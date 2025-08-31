<template>
  <div class="p-4 space-y-4">
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-semibold">Attendance Reports</h2>
      <div class="flex gap-2">
        <button 
          class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2" 
          @click="exportPDF" 
          :disabled="!records.length || loading"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          Export PDF
        </button>
        <button 
          class="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2" 
          @click="exportExcel" 
          :disabled="!records.length || loading"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          Export Excel
        </button>
        <button 
          class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          @click="showNotificationModal = true"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6zM4 5h6V4a1 1 0 00-1-1H5a1 1 0 00-1 1v1zM20 5V4a1 1 0 00-1-1h-1a1 1 0 00-1 1v1h3z"></path>
          </svg>
          Notifications
        </button>
      </div>
    </div>
    <!-- Filters -->
    <FilterCard>
      <template #header>
        <div class="ml-auto">
          <button
            @click="resetFilters"
            :disabled="loading"
            class="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium disabled:opacity-50"
          >
            Reset Filters
          </button>
        </div>
      </template>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">From Date</label>
          <input 
            v-model="filters.date_from" 
            type="date" 
            :disabled="loading"
            class="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To Date</label>
          <input 
            v-model="filters.date_to" 
            type="date" 
            :disabled="loading"
            class="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <!-- School (Super Admin Only) -->
        <div v-if="isSuperAdmin">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">School</label>
          <EnhancedDropdown 
            :options="schoolOptions" 
            v-model="filters.school_id" 
            placeholder="All Schools" 
            @update:modelValue="onSchoolChange"
            :disabled="loading"
          />
        </div>
        
        <!-- Branch (Super Admin and School Admin) -->
        <div v-if="isSuperAdmin || isSchoolAdmin">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch</label>
          <EnhancedDropdown 
            :options="branchOptions" 
            v-model="filters.branch_id" 
            placeholder="All Branches" 
            @update:modelValue="onBranchChange"
            :disabled="loading"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Class</label>
          <EnhancedDropdown 
            :options="classOptions" 
            v-model="filters.class_id" 
            placeholder="All Classes" 
            @update:modelValue="onClassChange"
            :disabled="loading"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Section</label>
          <EnhancedDropdown 
            :options="sectionOptions" 
            v-model="filters.section_id" 
            placeholder="All Sections"
            :disabled="loading || !filters.class_id"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Academic Year</label>
          <input 
            v-model="filters.academic_year" 
            type="text" 
            :disabled="loading"
            class="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="2024-25"
          />
        </div>
        
        <!-- Apply Filters Button -->
        <div class="flex items-end">
          <button 
            @click="load"
            :disabled="loading"
            class="w-full inline-flex justify-center items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            {{ loading ? 'Loading...' : 'Apply Filters' }}
          </button>
        </div>
      </div>
    </FilterCard>

    <div v-if="summary" class="bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
      <div class="font-medium mb-2 text-gray-900 dark:text-white">Summary</div>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-2 text-gray-700 dark:text-gray-300">
        <div>Total: {{ summary.total }}</div>
        <div>Present: {{ summary.present }}</div>
        <div>Absent: {{ summary.absent }}</div>
        <div>Late: {{ summary.late }}</div>
        <div>Excused: {{ summary.excused }}</div>
      </div>
    </div>

    <div v-if="!loading && (!records || records.length === 0)" class="border border-gray-200 dark:border-gray-700 rounded p-6 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
      <div class="font-medium mb-2 text-gray-900 dark:text-white">No attendance records</div>
      <p>Adjust the report filters and try again.</p>
    </div>

    <DataTable v-else :items="records" :columns="columns" :loading="loading" />

    <!-- Notification Modal -->
    <Modal :show="showNotificationModal" @close="showNotificationModal = false">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Send Attendance Notifications</h3>
      </template>
      
      <template #body>
        <form @submit.prevent="sendNotifications" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notification Type</label>
            <select 
              v-model="notificationForm.type" 
              required 
              class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select notification type</option>
              <option value="absence">Send Absence Notifications</option>
              <option value="late">Send Late Arrival Notifications</option>
              <option value="summary">Send Daily Summary</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Date</label>
            <input 
              v-model="notificationForm.date" 
              type="date" 
              required 
              class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              :max="new Date().toISOString().split('T')[0]"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Class</label>
            <select 
              v-model="notificationForm.class_id" 
              required 
              class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @change="loadNotificationSections"
            >
              <option value="">Choose a class</option>
              <option v-for="cls in classOptions" :key="cls.value" :value="cls.value">{{ cls.label }}</option>
            </select>
          </div>
          
          <div v-if="notificationSectionOptions.length > 0">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Section (Optional)</label>
            <select 
              v-model="notificationForm.section_id" 
              class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All sections</option>
              <option v-for="section in notificationSectionOptions" :key="section.value" :value="section.value">{{ section.label }}</option>
            </select>
          </div>
          
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div class="flex">
              <svg class="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
              </svg>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">How it works</h3>
                <div class="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  <p>{{ getNotificationDescription() }}</p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </template>
      
      <template #footer>
        <button 
          type="button" 
          @click="showNotificationModal = false"
          class="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          @click="sendNotifications"
          :disabled="isNotificationLoading || !notificationForm.type || !notificationForm.date || !notificationForm.class_id"
          class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ isNotificationLoading ? 'Sending...' : 'Send Notifications' }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useToast } from '~/composables/useToast';
import { useAuth } from '~/composables/useAuth';
import { useAuthStore } from '~/stores/auth';
import { apiClient } from '~/utils/api';
import Modal from '~/components/Modal.vue';
import EnhancedDropdown from '~/components/EnhancedDropdown.vue';
import FilterCard from '~/components/ui/FilterCard.vue';

// Removed reportTypeOptions as we now use date range filters

const filters = ref<any>({ 
  date_from: new Date().toISOString().slice(0,10),
  date_to: new Date().toISOString().slice(0,10),
  school_id: '',
  branch_id: '',
  academic_year: '',
  class_id: '',
  section_id: ''
});
const loading = ref(false);
const records = ref<any[]>([]);
const summary = ref<any>(null);
const classOptions = ref<any[]>([]);
const sectionOptions = ref<any[]>([]);

// Auth composables
const { isSuperAdmin, isSchoolAdmin } = useAuth();
const authStore = useAuthStore();

// School and branch data
const schools = ref<any[]>([]);
const branches = ref<any[]>([]);
const schoolOptions = computed(() => schools.value.map(school => ({
  value: school.id,
  label: school.name
})));
const branchOptions = computed(() => branches.value.map(branch => ({
  value: branch.id,
  label: branch.name
})));

// Notification modal state
const showNotificationModal = ref(false);
const isNotificationLoading = ref(false);
const notificationSectionOptions = ref<any[]>([]);
const notificationForm = ref({
  type: '',
  date: new Date().toISOString().slice(0, 10),
  class_id: '',
  section_id: ''
});

const columns = [
  { key: 'date', label: 'Date' },
  { key: 'student.admission_number', label: 'Admission' },
  { key: 'student.first_name', label: 'First Name' },
  { key: 'student.last_name', label: 'Last Name' },
  { key: 'status', label: 'Status' },
  { key: 'remarks', label: 'Remarks' },
];

const loadSchools = async () => {
  if (!isSuperAdmin.value) return;
  
  try {
    const response = await apiClient.schools.getAll();
    if (response.success) {
      schools.value = response.data?.items || [];
    }
  } catch (error) {
    console.error('Error loading schools:', error);
  }
};

const loadBranches = async () => {
  if (!isSuperAdmin.value && !isSchoolAdmin.value) return;

  try {
    const response = await apiClient.branches.getAll();
    let allBranches = [];
    
    if (response.success) {
      allBranches = response.data?.branches || response.data?.items || response.data || [];
      
      // Filter branches based on user role and selected school
      if (isSuperAdmin.value) {
        if (filters.value.school_id) {
          branches.value = allBranches.filter(branch => branch.school_id === filters.value.school_id);
        } else {
          branches.value = allBranches;
        }
      } else if (isSchoolAdmin.value) {
        // School admin sees branches from their school
        branches.value = allBranches.filter(branch => branch.school_id === authStore.user?.school_id);
      }
    }
  } catch (error) {
    console.error('Error loading branches:', error);
  }
};

const loadDropdowns = async () => {
  const classes = await apiClient.classes.getAll({ page: 1, limit: 100, is_active: 'true' });
  classOptions.value = (classes.data?.rows || classes.data || []).map((c: any) => ({ label: c.name, value: c.id }));
  const sections = await apiClient.sections.getAll({ page: 1, limit: 100, is_active: 'true' });
  sectionOptions.value = (sections.data?.rows || sections.data || []).map((s: any) => ({ label: s.name, value: s.id }));
};

const onSchoolChange = async () => {
  filters.value.branch_id = ''; // Reset branch when school changes
  filters.value.class_id = '';  // Reset class when school changes
  filters.value.section_id = ''; // Reset section when school changes
  
  await loadBranches(); // Reload branches for selected school
  await loadDropdowns(); // Reload classes
};

const onBranchChange = async () => {
  filters.value.class_id = '';  // Reset class when branch changes
  filters.value.section_id = ''; // Reset section when branch changes
  
  await loadDropdowns(); // Reload classes for selected branch
};

const onClassChange = async () => {
  filters.value.section_id = ''; // Reset section when class changes
  await loadDropdowns(); // Reload sections for selected class
};

const resetFilters = async () => {
  filters.value = {
    date_from: new Date().toISOString().slice(0, 10),
    date_to: new Date().toISOString().slice(0, 10),
    school_id: '',
    branch_id: '',
    academic_year: '',
    class_id: '',
    section_id: ''
  };
  
  // Clear current records and summary
  records.value = [];
  summary.value = null;
  
  // Reset dropdowns
  sectionOptions.value = [];
  
  // Reload initial data
  await loadDropdowns();
  if (isSuperAdmin.value) {
    await loadSchools();
  }
  if (isSuperAdmin.value || isSchoolAdmin.value) {
    await loadBranches();
  }
  
  showToast('Filters reset successfully', 'success');
};

const { showToast } = useToast();

const load = async () => {
  loading.value = true;
  try {
    // Validate date_from is provided
    if (!filters.value.date_from) {
      showToast('From Date is required to load data', 'error');
      loading.value = false;
      return;
    }

    // Build proper parameters for the API
    const params: any = {
      date_from: filters.value.date_from,
      date_to: filters.value.date_to || filters.value.date_from // Use date_from if date_to is not provided
    };
    
    if (filters.value.school_id) params.school_id = filters.value.school_id;
    if (filters.value.branch_id) params.branch_id = filters.value.branch_id;
    if (filters.value.class_id) params.class_id = filters.value.class_id;
    if (filters.value.section_id) params.section_id = filters.value.section_id;
    if (filters.value.academic_year) params.academic_year = filters.value.academic_year;
    
    const res = await apiClient.attendance.getReport(params);
    const data = (res as any).data || res;
    
    records.value = data.records || [];
    summary.value = data.summary || null;
    
    // Don't show toast for empty results - the UI already shows "No attendance records" message
    
  } catch (err: any) {
    console.error('Report load error:', err);
    const msg = err?.response?.data?.message || err?.message || 'Failed to load attendance report';
    showToast(msg, 'error');
  } finally {
    loading.value = false;
  }
};

const exportPDF = async () => {
  try {
    loading.value = true;
    // Remove generating toast - user can see loading state
    
    const config = useRuntimeConfig();
    const queryParams = new URLSearchParams();
    
    // Validate date_from is provided
    if (!filters.value.date_from) {
      showToast('From Date is required for PDF export', 'error');
      return;
    }
    
    queryParams.append('date_from', filters.value.date_from);
    
    // If no date_to provided, use date_from (single day report)
    const dateTo = filters.value.date_to || filters.value.date_from;
    queryParams.append('date_to', dateTo);
    
    if (filters.value.school_id) queryParams.append('school_id', filters.value.school_id);
    if (filters.value.branch_id) queryParams.append('branch_id', filters.value.branch_id);
    if (filters.value.class_id) queryParams.append('class_id', filters.value.class_id);
    if (filters.value.section_id) queryParams.append('section_id', filters.value.section_id);
    if (filters.value.academic_year) queryParams.append('academic_year', filters.value.academic_year);
    
    const response = await apiClient.attendance.exportPdfReport(queryParams.toString());
    
    const blob = response;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    showToast('PDF report downloaded successfully!', 'success');
  } catch (error: any) {
    console.error('PDF export error:', error);
    showToast('Failed to export PDF report', 'error');
  } finally {
    loading.value = false;
  }
};

const exportExcel = async () => {
  try {
    loading.value = true;
    // Remove generating toast - user can see loading state
    
    const config = useRuntimeConfig();
    const queryParams = new URLSearchParams();
    
    // Validate date_from is provided
    if (!filters.value.date_from) {
      showToast('From Date is required for Excel export', 'error');
      return;
    }
    
    queryParams.append('date_from', filters.value.date_from);
    
    // If no date_to provided, use date_from (single day report)
    const dateTo = filters.value.date_to || filters.value.date_from;
    queryParams.append('date_to', dateTo);
    
    if (filters.value.school_id) queryParams.append('school_id', filters.value.school_id);
    if (filters.value.branch_id) queryParams.append('branch_id', filters.value.branch_id);
    if (filters.value.class_id) queryParams.append('class_id', filters.value.class_id);
    if (filters.value.section_id) queryParams.append('section_id', filters.value.section_id);
    if (filters.value.academic_year) queryParams.append('academic_year', filters.value.academic_year);
    
    const response = await apiClient.attendance.exportExcelReport(queryParams.toString());
    
    const blob = response;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    showToast('Excel report downloaded successfully!', 'success');
  } catch (error: any) {
    console.error('Excel export error:', error);
    showToast('Failed to export Excel report', 'error');
  } finally {
    loading.value = false;
  }
};

// Notification functions
const loadNotificationSections = async () => {
  if (!notificationForm.value.class_id) {
    notificationSectionOptions.value = [];
    return;
  }
  
  try {
    const sections = await apiClient.sections.getAll({ 
      page: 1, 
      limit: 100, 
      is_active: 'true',
      class_id: notificationForm.value.class_id 
    });
    notificationSectionOptions.value = (sections.data?.rows || sections.data || []).map((s: any) => ({ label: s.name, value: s.id }));
  } catch (error) {
    console.error('Error loading sections for notifications:', error);
  }
};

const getNotificationDescription = () => {
  const descriptions = {
    absence: 'This will send absence notifications to parents of students who were marked absent for the selected date and class.',
    late: 'This will send late arrival notifications to parents of students who arrived late for the selected date and class.',
    summary: 'This will send a daily attendance summary to all parents for the selected date and class.'
  };
  return descriptions[notificationForm.value.type as keyof typeof descriptions] || 'Select a notification type to see details.';
};

const sendNotifications = async () => {
  try {
    isNotificationLoading.value = true;
    
    // First, find attendance sessions for the selected date and class
    const sessionsResponse = await apiClient.attendance.listSessions({
      page: 1,
      limit: 10,
      date_from: notificationForm.value.date,
      date_to: notificationForm.value.date,
      class_id: notificationForm.value.class_id,
      status: 'published'
    });
    
    const sessions = sessionsResponse.data || [];
    if (sessions.length === 0) {
      showToast('No published attendance sessions found for the selected date and class', 'error');
      return;
    }
    
    // Use the first session found
    const session = sessions[0];
    
    // Get session details to find absent/late students
    const sessionDetails = await apiClient.attendance.getSession(session.id);
    const attendanceRecords = sessionDetails.data.records || [];
    
    let response;
    if (notificationForm.value.type === 'absence') {
      const absentStudents = attendanceRecords
        .filter((record: any) => record.status === 'absent')
        .map((record: any) => ({ student_id: record.student_id, remarks: record.remarks }));
      
      if (absentStudents.length === 0) {
        showToast('No absent students found for the selected session', 'warning');
        return;
      }
      
      response = await apiClient.attendanceNotifications.sendAbsenceNotifications({
        absentStudents,
        sessionData: {
          date: notificationForm.value.date,
          class_id: notificationForm.value.class_id,
          section_id: notificationForm.value.section_id,
          attendance_type: session.attendance_type,
          period_number: session.period_number
        }
      });
      
    } else if (notificationForm.value.type === 'late') {
      const lateStudents = attendanceRecords
        .filter((record: any) => record.status === 'late')
        .map((record: any) => ({ 
          student_id: record.student_id, 
          arrival_time: record.arrival_time || 'Not specified',
          remarks: record.remarks 
        }));
      
      if (lateStudents.length === 0) {
        showToast('No late students found for the selected session', 'warning');
        return;
      }
      
      response = await apiClient.attendanceNotifications.sendLateArrivalNotifications({
        lateStudents,
        sessionData: {
          date: notificationForm.value.date,
          class_id: notificationForm.value.class_id,
          section_id: notificationForm.value.section_id,
          attendance_type: session.attendance_type,
          period_number: session.period_number
        }
      });
      
    } else if (notificationForm.value.type === 'summary') {
      const totalStudents = attendanceRecords.length;
      const presentCount = attendanceRecords.filter((r: any) => r.status === 'present').length;
      const absentCount = attendanceRecords.filter((r: any) => r.status === 'absent').length;
      const lateCount = attendanceRecords.filter((r: any) => r.status === 'late').length;
      const attendancePercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
      
      response = await apiClient.attendanceNotifications.sendAttendanceSummary({
        classData: {
          totalStudents,
          presentCount,
          absentCount,
          lateCount,
          attendancePercentage,
          className: session.Class?.name || 'Unknown',
          sectionName: session.Section?.name || 'All'
        },
        sessionData: {
          date: notificationForm.value.date,
          class_id: notificationForm.value.class_id,
          section_id: notificationForm.value.section_id,
          attendance_type: session.attendance_type,
          period_number: session.period_number
        }
      });
    }
    
    showToast(`Notifications sent successfully! ${response.data.emailsSent || 0} emails sent.`, 'success');
    showNotificationModal.value = false;
    notificationForm.value = {
      type: '',
      date: new Date().toISOString().slice(0, 10),
      class_id: '',
      section_id: ''
    };
    
  } catch (error: any) {
    console.error('Error sending notifications:', error);
    
    // Parse error and show user-friendly message
    let userMessage = 'Unable to send notifications. Please try again.';
    
    // Handle specific error scenarios with user-friendly messages
    if (error.response?.status === 404) {
      userMessage = 'No attendance records found for the selected date and class. Please ensure attendance is marked and published first.';
    } else if (error.response?.status === 400) {
      const errorMsg = error.response?.data?.message || '';
      if (errorMsg.includes('students data is required') || errorMsg.includes('No absent students')) {
        userMessage = 'No absent students found for the selected session. Please check the attendance records.';
      } else if (errorMsg.includes('do not belong to your school')) {
        userMessage = 'Access denied: You can only send notifications for students in your school.';
      } else if (errorMsg.includes('Session data') || errorMsg.includes('date and class_id is required')) {
        userMessage = 'Invalid session data. Please select a valid date and class.';
      } else if (errorMsg.includes('No published attendance sessions found')) {
        userMessage = 'No attendance sessions found for the selected date and class. Please ensure attendance is marked and saved first.';
      } else {
        userMessage = 'Invalid request. Please check your selections and try again.';
      }
    } else if (error.response?.status === 403) {
      userMessage = 'You do not have permission to send notifications for this class.';
    } else if (error.response?.status === 500) {
      userMessage = 'Server error occurred. Please contact your administrator if this persists.';
    } else if (error.response?.status === 401) {
      userMessage = 'Session expired. Please log in again and try again.';
    } else if (!error.response) {
      userMessage = 'Network error. Please check your internet connection and try again.';
    }
    
    showToast(userMessage, 'error');
  } finally {
    isNotificationLoading.value = false;
  }
};

await loadSchools();   // Load schools first (for super admin)
await loadBranches();  // Load branches
await loadDropdowns(); // Load classes and sections
await load();          // Load initial data
</script>

<style scoped></style>


