<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Mark Today's Attendance</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Select class and mark student attendance</p>
        <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
          💡 <strong>Tip:</strong> Save as "Draft" to review later, or "Submit" to finalize and notify parents
        </div>
        <!-- Cut-off Time Warning -->
        <div v-if="showCutoffWarning" class="mt-2 p-2 bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span class="text-sm text-orange-800 dark:text-orange-200">
              <strong>Cut-off Time:</strong> Attendance must be submitted before 4:00 PM today
            </span>
          </div>
        </div>
        <!-- Working Day Status -->
        <div v-if="workingDayStatus" class="mt-2 p-2 rounded-lg" :class="workingDayStatus.is_working_day ? 'bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800' : 'bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800'">
          <div class="flex items-center gap-2">
            <svg v-if="workingDayStatus.is_working_day" class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <svg v-else class="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            <span class="text-sm" :class="workingDayStatus.is_working_day ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'">
              <strong>{{ workingDayStatus.day_type.toUpperCase() }}:</strong> {{ workingDayStatus.description }}
            </span>
          </div>
        </div>
      </div>
      <div class="flex gap-2">
        <button 
          @click="showBulkImport = true"
          class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
          </svg>
          Import from Excel/CSV
        </button>
      </div>
    </div>

    <!-- Quick Setup Card -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Select Class & Load Students</h3>
        <div class="flex items-center space-x-2">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            {{ students.length }} Students Loaded
          </span>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-6 gap-4">
        <!-- Date Picker -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            Date
          </label>
          <input 
            v-model="form.date" 
            type="date" 
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            :max="new Date().toISOString().split('T')[0]"
            @change="checkWorkingDay"
          />
        </div>
        
        <!-- School Selector (Super Admin Only) -->
        <div v-if="isSuperAdmin">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
            School
          </label>
          <EnhancedDropdown 
            :options="schoolOptions" 
            v-model="form.school_id" 
            placeholder="All Schools"
            @update:modelValue="onSchoolChange"
          />
        </div>
        
        <!-- Branch Selector (Super Admin and School Admin) -->
        <div v-if="isSuperAdmin || isSchoolAdmin">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            Branch
          </label>
          <EnhancedDropdown 
            :options="branchOptions" 
            v-model="form.branch_id" 
            placeholder="All Branches"
            @update:modelValue="onBranchChange"
          />
        </div>
        
        <!-- Class Selector -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
            Class
          </label>
          <EnhancedDropdown 
            :options="classOptions as any[]" 
            v-model="form.class_id" 
            placeholder="Select Class"
            @update:modelValue="onClassChange"
          />
        </div>
        
        <!-- Section Selector -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            Section
          </label>
          <EnhancedDropdown 
            :options="sectionOptions as any[]" 
            v-model="form.section_id" 
            placeholder="Select Section"
            :disabled="!form.class_id"
          />
        </div>
        
        <!-- Load Students Button -->
        <div class="flex items-end">
          <button 
            @click="loadStudents"
            :disabled="!form.class_id || loading"
            class="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            {{ loading ? 'Loading...' : 'Load Students' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Attendance Marking Section -->
    <div v-if="students.length > 0" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Mark Attendance</h3>
        
        <!-- Quick Actions -->
        <div class="flex items-center gap-2">
          <button 
            @click="markAllPresent"
            class="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors text-sm flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Mark All Present
          </button>
          <button 
            @click="markAllAbsent"
            class="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors text-sm flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            Mark All Absent
          </button>
        </div>
      </div>

      <!-- Search and Filter -->
      <div class="mb-4 flex gap-4">
        <div class="flex-1">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search students by name or roll number..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <select 
            v-model="filterStatus" 
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="excused">Excused</option>
          </select>
        </div>
      </div>

      <!-- Attendance Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
          <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ presentCount }}</div>
          <div class="text-sm text-green-700 dark:text-green-300">Present</div>
        </div>
        <div class="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
          <div class="text-2xl font-bold text-red-600 dark:text-red-400">{{ absentCount }}</div>
          <div class="text-sm text-red-700 dark:text-red-300">Absent</div>
        </div>
        <div class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{{ lateCount }}</div>
          <div class="text-sm text-yellow-700 dark:text-yellow-300">Late</div>
        </div>
        <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ totalStudents }}</div>
          <div class="text-sm text-blue-700 dark:text-blue-300">Total</div>
        </div>
      </div>

      <!-- Students List -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Student
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Roll No
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Remarks
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="student in filteredStudents" :key="student.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {{ student.first_name?.charAt(0) }}{{ student.last_name?.charAt(0) }}
                      </span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ student.first_name }} {{ student.last_name }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ student.admission_number }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <select 
                  v-model="attendanceRecords[student.id].status"
                  class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="excused">Excused</option>
                </select>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <input 
                  v-model="attendanceRecords[student.id].remarks"
                  type="text" 
                  placeholder="Optional remarks..."
                  class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm w-full"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <Pagination 
        v-if="totalStudents > pageSize"
        :current-page="currentPage"
        :total-items="totalStudents"
        :page-size="pageSize"
        @page-changed="handlePageChange"
      />

      <!-- Action Buttons -->
      <div class="mt-6 flex justify-end gap-3">
        <button 
          @click="saveDraft"
          :disabled="attendanceSaving || !hasChanges"
          class="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ attendanceSaving ? 'Saving...' : 'Save Draft' }}
        </button>
        <button 
          @click="submitAttendance"
          :disabled="attendanceSaving || !hasChanges || !canSubmit"
          class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ attendanceSaving ? 'Submitting...' : 'Submit Attendance' }}
        </button>
      </div>
    </div>

    <!-- Bulk Import Modal -->
    <div v-if="showBulkImport" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Import Attendance from Excel/CSV</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Upload an Excel or CSV file with attendance data. The file should contain columns for Date, Class, Student ID, and Status.
        </p>
        <input type="file" accept=".xlsx,.xls,.csv" class="w-full mb-4" />
        <div class="flex justify-end gap-3">
          <button @click="showBulkImport = false" class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
            Cancel
          </button>
          <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Import
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useToast } from '~/composables/useToast'
import { useAttendance } from '~/composables/useAttendance'
import { useDropdowns } from '~/composables/useDropdowns'
import { useSchools } from '~/composables/useSchools'
import { useBranches } from '~/composables/useBranches'
import { useAuth } from '~/composables/useAuth'
import { useAuthStore } from '~/stores/auth'
import { apiClient } from '~/utils/api'
import EnhancedDropdown from '~/components/EnhancedDropdown.vue'
import Pagination from '~/components/Pagination.vue'

const { showToast } = useToast()
const { saveAttendance, loading: attendanceLoading, saving: attendanceSaving } = useAttendance()
const { classOptions, sectionOptions, loadClasses, loadSections } = useDropdowns()
const { schools, fetchSchools } = useSchools()
const { branches, fetchAllBranches } = useBranches()
const { isSuperAdmin, isSchoolAdmin } = useAuth()

// State
const loading = ref(false)
const students = ref<any[]>([])
const showBulkImport = ref(false)
const workingDayStatus = ref<any>(null)
const showCutoffWarning = ref(false)

// School and branch data from composables
const schoolOptions = computed(() => schools.value.map((school: any) => ({
  value: school.id,
  label: school.name
})))
const branchOptions = computed(() => branches.value.map((branch: any) => ({
  value: branch.id,
  label: branch.name
})))

// Form
const form = reactive({
  date: new Date().toISOString().slice(0, 10),
  school_id: '',
  branch_id: '',
  class_id: '',
  section_id: '',
  academic_year: ''
})

// Attendance records
const attendanceRecords = reactive<Record<string, { status: 'present' | 'absent' | 'late' | 'excused'; remarks: string }>>({})
const searchQuery = ref('')
const filterStatus = ref('')

// Pagination
const currentPage = ref(1)
const pageSize = ref(20)

// Computed
const presentCount = computed(() => 
  Object.values(attendanceRecords).filter(r => r.status === 'present').length
)
const absentCount = computed(() => 
  Object.values(attendanceRecords).filter(r => r.status === 'absent').length
)
const lateCount = computed(() => 
  Object.values(attendanceRecords).filter(r => r.status === 'late').length
)

const totalStudents = computed(() => students.value.length)

const hasChanges = computed(() => 
  Object.keys(attendanceRecords).length > 0
)

const canSubmit = computed(() => {
  if (!workingDayStatus.value?.is_working_day) return false
  
  const currentTime = new Date()
  const cutoffTime = new Date(form.date)
  cutoffTime.setHours(16, 0, 0, 0) // 4 PM
  
  return currentTime <= cutoffTime
})

const filteredStudents = computed(() => {
  let filtered = students.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(student => 
      student.first_name?.toLowerCase().includes(query) ||
      student.last_name?.toLowerCase().includes(query) ||
      student.admission_number?.toLowerCase().includes(query)
    )
  }

  if (filterStatus.value) {
    filtered = filtered.filter(student => 
      attendanceRecords[student.id]?.status === filterStatus.value
    )
  }

  return filtered
})

// Methods
const checkWorkingDay = async () => {
  try {
    const response = await apiClient.academicCalendar.checkWorkingDay({
      date: form.date,
      academic_year: form.academic_year
    })
    workingDayStatus.value = response.data
    
    // Show cutoff warning if it's after 3 PM
    const currentTime = new Date()
    const cutoffTime = new Date(form.date)
    cutoffTime.setHours(15, 0, 0, 0) // 3 PM
    showCutoffWarning.value = currentTime > cutoffTime
  } catch (error) {
    console.error('Error checking working day:', error)
  }
}

const markAllPresent = () => {
  students.value.forEach(student => {
    if (attendanceRecords[student.id]) {
      attendanceRecords[student.id].status = 'present'
    }
  })
}

const markAllAbsent = () => {
  students.value.forEach(student => {
    if (attendanceRecords[student.id]) {
      attendanceRecords[student.id].status = 'absent'
    }
  })
}

const onSchoolChange = async (schoolId: string) => {
  form.school_id = schoolId
  form.branch_id = ''
  await fetchAllBranches(schoolId)
}

const onBranchChange = async (branchId: string) => {
  form.branch_id = branchId
  form.class_id = ''
  form.section_id = ''
  await loadClasses()
}

const onClassChange = async (classId: string) => {
  form.class_id = classId
  form.section_id = ''
  await loadSections(classId)
}

const loadStudents = async () => {
  if (!form.class_id) {
    showToast('Please select a class first', 'error')
    return
  }

  loading.value = true
  try {
    // Check if it's a working day
    await checkWorkingDay()
    
    if (!workingDayStatus.value?.is_working_day) {
      showToast(`Attendance cannot be marked on ${workingDayStatus.value?.day_type} days`, 'error')
      return
    }

    const response = await apiClient.students.getAll({
      class_id: form.class_id,
      section: form.section_id,
      branch_id: form.branch_id,
      page: currentPage.value,
      limit: pageSize.value
    })

    if (response.success && response.data) {
      students.value = Array.isArray(response.data) ? response.data : []
    } else {
      students.value = []
    }

    // Initialize attendance records
    students.value.forEach(student => {
      if (!attendanceRecords[student.id]) {
        attendanceRecords[student.id] = {
          status: 'present',
          remarks: ''
        }
      }
    })

    showToast(`Loaded ${students.value.length} students`, 'success')
  } catch (error: any) {
    console.error('Error loading students:', error)
    const message = error?.response?.data?.message || error?.message || 'Failed to load students'
    showToast(message, 'error')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  loadStudents()
}

const saveDraft = async () => {
  if (!hasChanges.value) {
    showToast('No changes to save', 'warning')
    return
  }

  try {
    const records = students.value.map(student => ({
      student_id: student.id,
      status: attendanceRecords[student.id]?.status || 'present',
      remarks: attendanceRecords[student.id]?.remarks || ''
    }))

    await saveAttendance('temp', records, false)
  } catch (error: any) {
    console.error('Error saving draft:', error)
  }
}



const submitAttendance = async () => {
  if (!hasChanges.value) {
    showToast('No changes to submit', 'warning')
    return
  }

  if (!canSubmit.value) {
    showToast('Cannot submit attendance after 4:00 PM or on non-working days', 'error')
    return
  }

  try {
    const records = students.value.map(student => ({
      student_id: student.id,
      status: attendanceRecords[student.id]?.status || 'present',
      remarks: attendanceRecords[student.id]?.remarks || ''
    }))

    await saveAttendance('temp', records, true)
    
    // Clear form
    students.value = []
    Object.keys(attendanceRecords).forEach(key => {
      delete attendanceRecords[key]
    })
  } catch (error: any) {
    console.error('Error submitting attendance:', error)
  }
}

// Watch for date changes
watch(() => form.date, () => {
  checkWorkingDay()
})

// Initialize
onMounted(async () => {
  try {
    // Load initial data
    await fetchSchools()
    await loadClasses()
    await checkWorkingDay()
    
    // Set academic year from current date
    const currentYear = new Date().getFullYear()
    form.academic_year = `${currentYear}-${currentYear + 1}`
  } catch (error) {
    console.error('Error initializing attendance page:', error)
  }
})
</script>

<style scoped></style>


