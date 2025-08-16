<template>
  <div class="p-6 space-y-6">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Attendance</h1>

    <!-- Filter Card -->
    <FilterCard>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <!-- Date -->
        <FormField id="attendance-date" label="Date" required>
          <input 
            v-model="form.date" 
            type="date" 
            class="input-field"
            :max="new Date().toISOString().split('T')[0]"
            @change="onFilterChange"
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
            @update:modelValue="onFilterChange"
          />
        </FormField>
        
        <!-- Academic Year -->
        <FormField id="attendance-year" label="Academic Year">
          <input 
            v-model="form.academic_year" 
            type="text" 
            class="input-field"
            placeholder="2025-2026"
            @input="onFilterChange"
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
      </div>
      
      <template #actions>
        <!-- Left side - Action buttons -->
        <div class="flex gap-3">
          <NuxtLink 
            to="/attendance/bulk-import" 
            class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Bulk Import
          </NuxtLink>
          
          <button 
            @click="saveAttendance(true)"
            :disabled="!hasValidSession || saving || loading || students.length === 0"
            class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ saving ? 'Publishing...' : 'Save & Publish' }}
          </button>
          
          <button 
            @click="saveAttendance(false)"
            :disabled="!hasValidSession || saving || loading || students.length === 0"
            class="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ saving ? 'Saving...' : 'Save Draft' }}
          </button>
        </div>
        
        <!-- Right side - Reset button -->
        <div class="flex gap-3">
          <button 
            @click="resetFilters"
            class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Reset Filters
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

// Form state
const form = ref({
  date: new Date().toISOString().slice(0, 10),
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
    // Auto-load students after class change if date is selected
    if (form.value.date) {
      await loadStudents()
    }
  }
}

// Auto-filtering handler for other fields
const onFilterChange = async () => {
  // Debounce auto-filtering to avoid too many API calls
  if (autoFilterTimeout.value) {
    clearTimeout(autoFilterTimeout.value)
  }
  
  autoFilterTimeout.value = setTimeout(async () => {
    if (form.value.date && form.value.class_id) {
      await loadStudents()
    }
  }, 500) // 500ms debounce
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
      await createSession({
        date: form.value.date,
        attendance_type: 'daily',
        class_id: form.value.class_id,
        section_id: form.value.section_id || undefined,
        academic_year: form.value.academic_year || undefined
      })
      
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

const resetFilters = () => {
  form.value = {
    date: new Date().toISOString().slice(0, 10),
    class_id: '',
    section_id: '',
    academic_year: ''
  }
  searchQuery.value = ''
}

// Load initial data
onMounted(async () => {
  await loadClasses()
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


