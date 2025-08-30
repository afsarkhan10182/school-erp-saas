<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Attendance Notifications</h1>
        <p class="text-gray-600 mt-1">Manage and send attendance notifications to parents</p>
      </div>

    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6" v-if="settings">
      <div class="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
        <div class="flex items-center">
          <div>
            <p class="text-blue-600 text-sm font-medium">Total Students</p>
            <p class="text-2xl font-bold text-gray-900">{{ settings.statistics.totalStudents }}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
        <div class="flex items-center">
          <div>
            <p class="text-green-600 text-sm font-medium">With Parent Email</p>
            <p class="text-2xl font-bold text-gray-900">{{ settings.statistics.studentsWithParentEmail }}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
        <div class="flex items-center">
          <div>
            <p class="text-purple-600 text-sm font-medium">Coverage</p>
            <p class="text-2xl font-bold text-gray-900">{{ settings.statistics.coveragePercentage }}%</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
        <div class="flex items-center">
          <div>
            <p class="text-yellow-600 text-sm font-medium">School</p>
            <p class="text-lg font-bold text-gray-900">{{ settings.school.name }}</p>
          </div>
        </div>
      </div>
    </div>


    <!-- Quick Actions -->
    <div class="bg-white rounded-lg shadow">
      <div class="p-6 border-b border-gray-200">
        <h2 class="text-lg font-medium text-gray-900">Quick Actions</h2>
        <p class="text-gray-600 text-sm mt-1">Send notifications for today's attendance</p>
      </div>
      
      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            @click="sendNotificationType = 'absence'; showSendModal = true"
            class="p-4 border-2 border-red-200 rounded-lg hover:border-red-300 transition-colors group"
          >
            <div class="text-center">
              <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-red-200">
                <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <h3 class="font-medium text-gray-900">Send Absence Alerts</h3>
              <p class="text-sm text-gray-600 mt-1">Notify parents of absent students</p>
            </div>
          </button>

          <button
            @click="sendNotificationType = 'late'; showSendModal = true"
            class="p-4 border-2 border-yellow-200 rounded-lg hover:border-yellow-300 transition-colors group"
          >
            <div class="text-center">
              <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-yellow-200">
                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 class="font-medium text-gray-900">Send Late Arrival Alerts</h3>
              <p class="text-sm text-gray-600 mt-1">Notify parents of late students</p>
            </div>
          </button>

          <button
            @click="sendNotificationType = 'summary'; showSendModal = true"
            class="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-300 transition-colors group"
          >
            <div class="text-center">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <h3 class="font-medium text-gray-900">Send Daily Summary</h3>
              <p class="text-sm text-gray-600 mt-1">Send attendance summary to parents</p>
            </div>
          </button>
        </div>
      </div>
    </div>



    <!-- Send Notification Modal -->
    <Modal :show="showSendModal" @close="showSendModal = false">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900">{{ getModalTitle() }}</h3>
      </template>
      
      <template #body>
        <form @submit.prevent="sendNotifications" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
            <input 
              v-model="sendForm.date" 
              type="date" 
              required 
              class="w-full border border-gray-300 rounded-lg px-3 py-2"
              :max="new Date().toISOString().split('T')[0]"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
            <select v-model="sendForm.class_id" required class="w-full border border-gray-300 rounded-lg px-3 py-2" @change="loadSections">
              <option value="">Choose a class</option>
              <option v-for="cls in classOptions" :key="cls.value" :value="cls.value">{{ cls.label }}</option>
            </select>
          </div>
          
          <div v-if="sectionOptions.length > 0">
            <label class="block text-sm font-medium text-gray-700 mb-2">Select Section (Optional)</label>
            <select v-model="sendForm.section_id" class="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="">All sections</option>
              <option v-for="section in sectionOptions" :key="section.value" :value="section.value">{{ section.label }}</option>
            </select>
          </div>
          
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex">
              <svg class="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
              </svg>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-blue-800">How it works</h3>
                <div class="mt-2 text-sm text-blue-700">
                  <p>This will send {{ getNotificationDescription() }} based on the selected date and class attendance records.</p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </template>
      
      <template #footer>
        <button 
          type="button" 
          @click="showSendModal = false"
          class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          @click="sendNotifications"
          :disabled="isLoading || !sendForm.date || !sendForm.class_id"
          class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
        >
          {{ isLoading ? 'Sending...' : 'Send Notifications' }}
        </button>
      </template>
    </Modal>

    <!-- Toast Notifications -->
    <Toast 
      v-if="toast.show" 
      :type="toast.type" 
      :message="toast.message" 
      @close="toast.show = false" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiClient } from '~/utils/api'
import Modal from '~/components/Modal.vue'
import Toast from '~/components/Toast.vue'

// Page metadata
definePageMeta({
  title: 'Attendance Notifications'
})

// Reactive data
const settings = ref(null)
const isLoading = ref(false)

const showSendModal = ref(false)
const sendNotificationType = ref('')



const sendForm = ref({
  date: '',
  class_id: '',
  section_id: ''
})

const classOptions = ref([])
const sectionOptions = ref([])

const toast = ref({
  show: false,
  type: 'success',
  message: ''
})

// Methods
const showToast = (type, message) => {
  toast.value = { show: true, type, message }
  setTimeout(() => {
    toast.value.show = false
  }, 5000)
}

const getModalTitle = () => {
  const titles = {
    absence: 'Send Absence Notifications',
    late: 'Send Late Arrival Notifications',
    summary: 'Send Daily Summary'
  }
  return titles[sendNotificationType.value] || 'Send Notifications'
}

const loadSettings = async () => {
  try {
    isLoading.value = true
    const response = await apiClient.attendanceNotifications.getNotificationSettings()
    settings.value = response.data
  } catch (error) {
    console.error('Error loading notification settings:', error)
    // Log error but don't show toast for initial data loading
    console.error('Failed to load notification settings:', error)
  } finally {
    isLoading.value = false
  }
}

const getNotificationDescription = () => {
  const descriptions = {
    absence: 'absence notifications to parents of students who were marked absent',
    late: 'late arrival notifications to parents of students who arrived late',
    summary: 'a daily attendance summary to all parents'
  }
  return descriptions[sendNotificationType.value] || 'notifications'
}

const loadDropdowns = async () => {
  try {
    const classes = await apiClient.classes.getAll({ page: 1, limit: 100, is_active: 'true' })
    classOptions.value = (classes.data?.rows || classes.data || []).map((c) => ({ label: c.name, value: c.id }))
  } catch (error) {
    console.error('Error loading classes:', error)
    // Log error but don't show toast for dropdown loading
    console.error('Failed to load classes:', error)
  }
}

const loadSections = async () => {
  if (!sendForm.value.class_id) {
    sectionOptions.value = []
    return
  }
  
  try {
    const sections = await apiClient.sections.getAll({ 
      page: 1, 
      limit: 100, 
      is_active: 'true',
      class_id: sendForm.value.class_id 
    })
    sectionOptions.value = (sections.data?.rows || sections.data || []).map((s) => ({ label: s.name, value: s.id }))
  } catch (error) {
    console.error('Error loading sections:', error)
    // Log error but don't show toast for dropdown loading
    console.error('Failed to load sections:', error)
  }
}

const sendNotifications = async () => {
  try {
    isLoading.value = true
    
    // First, find attendance sessions for the selected date and class
    const sessionsResponse = await apiClient.attendance.listSessions({
      page: 1,
      limit: 10,
      date_from: sendForm.value.date,
      date_to: sendForm.value.date,
      class_id: sendForm.value.class_id,
      status: 'published'
    })
    
    const sessions = sessionsResponse.data || []
    if (sessions.length === 0) {
      showToast('error', 'No published attendance sessions found for the selected date and class')
      return
    }
    
    // Use the first session found
    const session = sessions[0]
    
    // Get session details to find absent/late students
    const sessionDetails = await apiClient.attendance.getSession(session.id)
    const records = sessionDetails.data.records || []
    
    let response
    if (sendNotificationType.value === 'absence') {
      const absentStudents = records
        .filter(record => record.status === 'absent')
        .map(record => ({ student_id: record.student_id, remarks: record.remarks }))
      
      if (absentStudents.length === 0) {
        showToast('warning', 'No absent students found for the selected session')
        return
      }
      
      response = await apiClient.attendanceNotifications.sendAbsenceNotifications({
        absentStudents,
        sessionData: {
          date: sendForm.value.date,
          class_id: sendForm.value.class_id,
          section_id: sendForm.value.section_id,
          attendance_type: session.attendance_type,
          period_number: session.period_number
        }
      })
      
    } else if (sendNotificationType.value === 'late') {
      const lateStudents = records
        .filter(record => record.status === 'late')
        .map(record => ({ 
          student_id: record.student_id, 
          arrival_time: record.arrival_time || 'Not specified',
          remarks: record.remarks 
        }))
      
      if (lateStudents.length === 0) {
        showToast('warning', 'No late students found for the selected session')
        return
      }
      
      response = await apiClient.attendanceNotifications.sendLateArrivalNotifications({
        lateStudents,
        sessionData: {
          date: sendForm.value.date,
          class_id: sendForm.value.class_id,
          section_id: sendForm.value.section_id,
          attendance_type: session.attendance_type,
          period_number: session.period_number
        }
      })
      
    } else if (sendNotificationType.value === 'summary') {
      const totalStudents = records.length
      const presentCount = records.filter(r => r.status === 'present').length
      const absentCount = records.filter(r => r.status === 'absent').length
      const lateCount = records.filter(r => r.status === 'late').length
      const attendancePercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0
      
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
          date: sendForm.value.date,
          class_id: sendForm.value.class_id,
          section_id: sendForm.value.section_id,
          attendance_type: session.attendance_type,
          period_number: session.period_number
        }
      })
    }
    
    showToast('success', `Notifications sent successfully! ${response.data.emailsSent || 0} emails sent.`)
    showSendModal.value = false
    sendForm.value = { date: '', class_id: '', section_id: '' }
    
  } catch (error) {
    console.error('Error sending notifications:', error)
    showToast('error', error.response?.data?.message || 'Failed to send notifications')
  } finally {
    isLoading.value = false
  }
}



// Lifecycle
onMounted(() => {
  loadSettings()
  loadDropdowns()
})
</script>