<template>
  <div class="p-6 space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Attendance</h1>
      <NuxtLink 
        to="/attendance/bulk-import" 
        class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
        </svg>
        Bulk Import
      </NuxtLink>
    </div>

    <!-- Filter Card -->
    <FilterCard>
      <template #header>
        <div class="ml-auto">
          <button
            @click="resetFilters"
            class="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
          >
            Reset Filters
          </button>
        </div>
      </template>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <!-- Date -->
        <FormField id="attendance-date" label="Date" required>
          <input 
            v-model="form.date" 
            type="date" 
            class="input-field"
            :max="new Date().toISOString().split('T')[0]"
          />
        </FormField>

        <!-- School (Super Admin Only) -->
        <FormField v-if="isSuperAdmin" id="attendance-school" label="School">
          <EnhancedDropdown 
            :options="schoolOptions" 
            v-model="form.school_id" 
            placeholder="All Schools"
            @update:modelValue="onSchoolChange"
          />
        </FormField>
        
        <!-- Branch (Super Admin and School Admin) -->
        <FormField v-if="isSuperAdmin || isSchoolAdmin" id="attendance-branch" label="Branch">
          <EnhancedDropdown 
            :options="branchOptions" 
            v-model="form.branch_id" 
            placeholder="All Branches"
            @update:modelValue="onBranchChange"
          />
        </FormField>
        
        <!-- Class -->
        <FormField id="attendance-class" label="Class" required>
          <EnhancedDropdown 
            :options="classOptions" 
            v-model="form.class_id" 
            placeholder="Select Class"
            @update:modelValue="onClassChange"
          />
        </FormField>
        
        <!-- Section -->
        <FormField id="attendance-section" label="Section (Optional)">
          <EnhancedDropdown 
            :options="sectionOptions" 
            v-model="form.section_id" 
            placeholder="All Sections"
            :disabled="!form.class_id"
          />
        </FormField>
        
        <!-- Academic Year -->
        <FormField id="attendance-year" label="Academic Year">
          <input 
            v-model="form.academic_year" 
            type="text" 
            class="input-field"
            placeholder="2025-2026"
          />
        </FormField>
        
        <!-- Search -->
        <FormField id="attendance-search" label="Search">
          <input 
            v-model="searchQuery" 
            type="text" 
            class="input-field"
            placeholder="Search students..."
          />
        </FormField>

        <!-- Apply Filters Button (matching Fee Reports pattern) -->
        <div class="flex items-end">
          <button 
            @click="applyFilters"
            :disabled="loading || !form.date || !form.class_id"
            class="w-full inline-flex justify-center items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            {{ loading ? 'Loading...' : 'Apply Filters' }}
          </button>
        </div>
      </div>
      
      <template #actions>
        <!-- Left side - Action buttons -->
        <div class="flex gap-3">
          <button 
            @click="saveAttendance(true)"
            :disabled="!hasValidSession || saving || loading || students.length === 0"
            class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </template>
    </FilterCard>


    <!-- Students Table -->
    <div v-if="filteredStudents.length > 0" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Student Attendance ({{ filteredStudents.length }} students)
        </h3>
      </div>
      
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Admission No.
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Student Name
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
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {{ student.admission_number }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ student.first_name }} {{ student.last_name || '' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <select 
                  v-model="attendanceRecords[student.id].status" 
                  class="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add remarks..."
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty States -->
    <div v-else-if="!loading && students.length === 0" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
      </svg>
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">No students found</h3>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Select a date and class to load students for attendance.
      </p>
    </div>

    <div v-else-if="!loading && searchQuery && filteredStudents.length === 0" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
      </svg>
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">No students match your search</h3>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Try adjusting your search terms or clear the search filter.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAttendance } from '~/composables/useAttendance'
import { useDropdowns } from '~/composables/useDropdowns'
import { useToast } from '~/composables/useToast'
import { useAuth } from '~/composables/useAuth'
import { useAuthStore } from '~/stores/auth'
import { apiClient } from '~/utils/api'
import FilterCard from '~/components/ui/FilterCard.vue'
import FormField from '~/components/FormField.vue'
import EnhancedDropdown from '~/components/EnhancedDropdown.vue'

// Use composables for business logic
const { 
  currentSession, 
  students, 
  attendanceRecords, 
  loading, 
  saving, 
  createSession, 
  loadStudents: loadStudentsFromAPI, 
  saveAttendance: saveAttendanceAPI 
} = useAttendance()

const { classOptions, sectionOptions, loadClasses, loadSections } = useDropdowns()
const { showError, showSuccess } = useToast()
const { isSuperAdmin, isSchoolAdmin } = useAuth()

// School and branch data
const schools = ref([])
const branches = ref([])
const schoolOptions = computed(() => schools.value.map(school => ({
  value: school.id,
  label: school.name
})))
const branchOptions = computed(() => branches.value.map(branch => ({
  value: branch.id,
  label: branch.name
})))

// Form state
const form = ref({
  date: new Date().toISOString().slice(0, 10),
  school_id: '',
  branch_id: '',
  class_id: '',
  section_id: '',
  academic_year: ''
})

// Search functionality
const searchQuery = ref('')

// Auto-filtering timeout
const autoFilterTimeout = ref<NodeJS.Timeout | null>(null)

// Computed properties
const hasValidSession = computed(() => !!(currentSession.value && currentSession.value.id))

const filteredStudents = computed(() => {
  if (!searchQuery.value) return students.value
  
  const query = searchQuery.value.toLowerCase()
  return students.value.filter(student => 
    student.admission_number?.toLowerCase().includes(query) ||
    student.first_name?.toLowerCase().includes(query) ||
    student.last_name?.toLowerCase().includes(query)
  )
})

// Event handlers
const onClassChange = async (classId: string) => {
  form.value.class_id = classId
  form.value.section_id = '' // Reset section when class changes
  
  if (classId) {
    await loadSections(classId)
  }
}

// Remove auto-filtering - filters are now applied only on button click
const onFilterChange = () => {
  // No auto-filtering - user must click "Apply Filters" button
}

// Apply filters when user clicks the button
const applyFilters = async () => {
  if (!form.value.date || !form.value.class_id) {
    showError('Please select date and class before applying filters')
    return
  }
  
  await loadStudents()
}

const loadStudents = async () => {
  if (!form.value.date || !form.value.class_id) {
    return // Don't show error, just don't load
  }

  try {
    // First load students
    await loadStudentsFromAPI(form.value.class_id, form.value.section_id)
    
    // Then create/get session if we have students
    if (students.value.length > 0) {
      const sessionData: any = {
        date: form.value.date,
        attendance_type: 'daily',
        class_id: form.value.class_id,
        section_id: form.value.section_id || undefined,
        academic_year: form.value.academic_year || undefined
      }
      
      // Include school_id and branch_id if they're selected (for super admin and school admin)
      if (form.value.school_id) sessionData.school_id = form.value.school_id
      if (form.value.branch_id) sessionData.branch_id = form.value.branch_id
      
      await createSession(sessionData)
      
      // Only show success message if we have a meaningful number of students
      if (students.value.length === 0) {
        showError('No students found for this class/section')
      }
    }
  } catch (error) {
    // Error handling is done in composables
  }
}

const saveAttendance = async (publish: boolean) => {
  if (!hasValidSession.value) {
    showError('Create or load a session first')
    return
  }

  if (students.value.length === 0) {
    showError('No students found. Please load students first.')
    return
  }

  try {
    const records = students.value.map(student => ({
      student_id: student.id,
      status: attendanceRecords.value[student.id]?.status || 'present',
      remarks: attendanceRecords.value[student.id]?.remarks || ''
    }))

    await saveAttendanceAPI(currentSession.value!.id, records, publish)
  } catch (error) {
    // Error handling is done in composables
  }
}

// School and branch functions
const loadSchools = async () => {
  if (!isSuperAdmin.value) return
  
  try {
    const response = await apiClient.schools.getAll()
    if (response.success) {
      schools.value = response.data?.schools || response.data?.items || response.data || []
    }
  } catch (error) {
    console.error('Error loading schools:', error)
    showError('Failed to load schools')
  }
}

const loadBranches = async () => {
  if (!isSuperAdmin.value && !isSchoolAdmin.value) return

  try {
    const response = await apiClient.branches.getAll()
    let allBranches = []
    
    if (response.success) {
      allBranches = response.data?.branches || response.data?.items || response.data || []
      
      // Filter branches based on user role and selected school
      if (isSuperAdmin.value) {
        if (form.value.school_id) {
          branches.value = allBranches.filter(branch => branch.school_id === form.value.school_id)
        } else {
          branches.value = allBranches
        }
      } else if (isSchoolAdmin.value) {
        // School admin sees branches from their school
        const authStore = useAuthStore()
        branches.value = allBranches.filter(branch => branch.school_id === authStore.user?.school_id)
      }
    }
  } catch (error) {
    console.error('Error loading branches:', error)
    showError('Failed to load branches')
  }
}

const onSchoolChange = async () => {
  form.value.branch_id = '' // Reset branch when school changes
  form.value.class_id = ''  // Reset class when school changes
  form.value.section_id = '' // Reset section when school changes
  
  await loadBranches() // Reload branches for selected school
  await loadClasses()  // Reload classes
  
  // Clear current students when school changes
  students.value = []
  attendanceRecords.value = {}
  currentSession.value = null
}

const onBranchChange = async () => {
  form.value.class_id = ''  // Reset class when branch changes
  form.value.section_id = '' // Reset section when branch changes
  
  await loadClasses()  // Reload classes for selected branch
  
  // Clear current students when branch changes
  students.value = []
  attendanceRecords.value = {}
  currentSession.value = null
}

const resetFilters = () => {
  form.value = {
    date: new Date().toISOString().slice(0, 10),
    school_id: '',
    branch_id: '',
    class_id: '',
    section_id: '',
    academic_year: ''
  }
  searchQuery.value = ''
  
  // Clear students and attendance data when resetting
  students.value = []
  attendanceRecords.value = {}
  currentSession.value = null
  
  // Reset dropdowns to initial state
  sectionOptions.value = []
  
  // Reload initial data to reset dropdowns properly
  if (isSuperAdmin.value) {
    loadSchools()
  }
  if (isSuperAdmin.value || isSchoolAdmin.value) {
    loadBranches()
  }
  loadClasses()
}

// Load initial data
onMounted(async () => {
  await loadSchools()  // Load schools first (for super admin)
  await loadBranches() // Load branches 
  await loadClasses()  // Load classes
})

// Cleanup timeout on unmount
onUnmounted(() => {
  if (autoFilterTimeout.value) {
    clearTimeout(autoFilterTimeout.value)
  }
})
</script>

<style scoped>
.input-field {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
         placeholder-gray-500 dark:placeholder-gray-400
         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
         disabled:opacity-50 disabled:cursor-not-allowed
         transition-colors duration-200;
}
</style>

<style scoped></style>


