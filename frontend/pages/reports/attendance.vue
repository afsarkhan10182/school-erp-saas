<template>
  <div class="p-4 space-y-4">
    <h2 class="text-xl font-semibold">Attendance Reports</h2>
    <div class="grid grid-cols-2 md:grid-cols-6 gap-3">
      <input v-model="filters.date_from" type="date" class="border px-2 py-1 rounded" placeholder="From Date" title="From Date" />
      <input v-model="filters.date_to" type="date" class="border px-2 py-1 rounded" placeholder="To Date" title="To Date" />
      <EnhancedDropdown :options="classOptions" v-model="filters.class_id" placeholder="Class" />
      <EnhancedDropdown :options="sectionOptions" v-model="filters.section_id" placeholder="Section" />
      <input v-model="filters.academic_year" type="text" class="border px-2 py-1 rounded" placeholder="Academic Year (e.g., 2024-25)" title="Academic Year" />
      <button class="bg-blue-600 text-white px-3 py-1 rounded" @click="load">Load</button>
    </div>
    <div class="flex gap-2">
      <button 
        class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
        @click="exportPDF" 
        :disabled="!records.length || loading"
      >
        Export PDF
      </button>
      <button 
        class="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
        @click="exportExcel" 
        :disabled="!records.length || loading"
      >
        Export Excel
      </button>
      <button 
        class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        @click="showNotificationModal = true"
      >
        Notifications
      </button>
    </div>

    <div v-if="summary" class="bg-gray-50 p-3 rounded border">
      <div class="font-medium mb-2">Summary</div>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-2">
        <div>Total: {{ summary.total }}</div>
        <div>Present: {{ summary.present }}</div>
        <div>Absent: {{ summary.absent }}</div>
        <div>Late: {{ summary.late }}</div>
        <div>Excused: {{ summary.excused }}</div>
      </div>
    </div>

    <div v-if="!loading && (!records || records.length === 0)" class="border rounded p-6 bg-gray-50 text-gray-600">
      <div class="font-medium mb-2">No attendance records</div>
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
import { ref } from 'vue';
import { useToast } from '~/composables/useToast';
import { apiClient } from '~/utils/api';
import Modal from '~/components/Modal.vue';

// Removed reportTypeOptions as we now use date range filters

const filters = ref<any>({ 
  date_from: new Date().toISOString().slice(0,10),
  date_to: new Date().toISOString().slice(0,10),
  academic_year: '',
  class_id: '',
  section_id: ''
});
const loading = ref(false);
const records = ref<any[]>([]);
const summary = ref<any>(null);
const classOptions = ref<any[]>([]);
const sectionOptions = ref<any[]>([]);

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

const loadDropdowns = async () => {
  const classes = await apiClient.classes.getAll({ page: 1, limit: 100, is_active: 'true' });
  classOptions.value = (classes.data?.rows || classes.data || []).map((c: any) => ({ label: c.name, value: c.id }));
  const sections = await apiClient.sections.getAll({ page: 1, limit: 100, is_active: 'true' });
  sectionOptions.value = (sections.data?.rows || sections.data || []).map((s: any) => ({ label: s.name, value: s.id }));
};

const { showToast } = useToast();

const load = async () => {
  loading.value = true;
  try {
    // Validate date_from is provided
    if (!filters.value.date_from) {
      showToast({ type: 'error', message: 'From Date is required to load data' });
      loading.value = false;
      return;
    }

    // Build proper parameters for the API
    const params: any = {
      date_from: filters.value.date_from,
      date_to: filters.value.date_to || filters.value.date_from // Use date_from if date_to is not provided
    };
    
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
    showToast({ type: 'error', message: msg });
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
      showToast({ type: 'error', message: 'From Date is required for PDF export' });
      return;
    }
    
    queryParams.append('date_from', filters.value.date_from);
    
    // If no date_to provided, use date_from (single day report)
    const dateTo = filters.value.date_to || filters.value.date_from;
    queryParams.append('date_to', dateTo);
    
    if (filters.value.class_id) queryParams.append('class_id', filters.value.class_id);
    if (filters.value.section_id) queryParams.append('section_id', filters.value.section_id);
    if (filters.value.academic_year) queryParams.append('academic_year', filters.value.academic_year);
    
    const response = await fetch(`${config.public.apiBase}/attendance/reports/export/pdf?${queryParams}`, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to export PDF');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    showToast({ type: 'success', message: 'PDF report downloaded successfully!' });
  } catch (error: any) {
    console.error('PDF export error:', error);
    showToast({ type: 'error', message: 'Failed to export PDF report' });
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
      showToast({ type: 'error', message: 'From Date is required for Excel export' });
      return;
    }
    
    queryParams.append('date_from', filters.value.date_from);
    
    // If no date_to provided, use date_from (single day report)
    const dateTo = filters.value.date_to || filters.value.date_from;
    queryParams.append('date_to', dateTo);
    
    if (filters.value.class_id) queryParams.append('class_id', filters.value.class_id);
    if (filters.value.section_id) queryParams.append('section_id', filters.value.section_id);
    if (filters.value.academic_year) queryParams.append('academic_year', filters.value.academic_year);
    
    const response = await fetch(`${config.public.apiBase}/attendance/reports/export/excel?${queryParams}`, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to export Excel');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    showToast({ type: 'success', message: 'Excel report downloaded successfully!' });
  } catch (error: any) {
    console.error('Excel export error:', error);
    showToast({ type: 'error', message: 'Failed to export Excel report' });
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
      showToast({ type: 'error', message: 'No published attendance sessions found for the selected date and class' });
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
        showToast({ type: 'warning', message: 'No absent students found for the selected session' });
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
        showToast({ type: 'warning', message: 'No late students found for the selected session' });
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
    
    showToast({ type: 'success', message: `Notifications sent successfully! ${response.data.emailsSent || 0} emails sent.` });
    showNotificationModal.value = false;
    notificationForm.value = {
      type: '',
      date: new Date().toISOString().slice(0, 10),
      class_id: '',
      section_id: ''
    };
    
  } catch (error: any) {
    console.error('Error sending notifications:', error);
    showToast({ type: 'error', message: error.response?.data?.message || 'Failed to send notifications' });
  } finally {
    isNotificationLoading.value = false;
  }
};

await loadDropdowns();
await load();
</script>

<style scoped></style>


