<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-start">
      <div class="space-y-2">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Subject Teacher Assignments</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">Manage teacher assignments to subjects and classes</p>
      </div>
      <div class="flex gap-2">
        <button 
          @click="showCreateModal = true"
          class="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Assign Teacher
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Filters</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Subject Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
          <select 
            v-model="filters.subject_id" 
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            @change="loadAssignments"
          >
            <option value="">All Subjects</option>
            <option v-for="subject in subjectOptions" :key="subject.value" :value="subject.value">
              {{ subject.label }}
            </option>
          </select>
        </div>

        <!-- Class Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Class</label>
          <select 
            v-model="filters.class_id" 
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            @change="loadAssignments"
          >
            <option value="">All Classes</option>
            <option v-for="cls in classOptions" :key="cls.value" :value="cls.value">
              {{ cls.label }}
            </option>
          </select>
        </div>

        <!-- Academic Year Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Academic Year</label>
          <select 
            v-model="filters.academic_year" 
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            @change="loadAssignments"
          >
            <option value="">All Years</option>
            <option v-for="year in academicYearOptions" :key="year.value" :value="year.value">
              {{ year.label }}
            </option>
          </select>
        </div>

        <!-- Clear Filters -->
        <div class="flex items-end">
          <button 
            @click="clearFilters"
            class="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Assignments List -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Assignments</h3>
      </div>
      
      <div v-if="loading" class="p-8 text-center">
        <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading assignments...
        </div>
      </div>

      <div v-else-if="assignments.length === 0" class="p-8 text-center text-gray-500 dark:text-gray-400">
        <div class="text-lg font-medium mb-2">No assignments found</div>
        <p>Create your first subject-teacher assignment to get started.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Subject</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Teacher</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Class</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Section</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Primary</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="assignment in assignments" :key="assignment.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">{{ assignment.subject?.name }}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">{{ assignment.subject?.code }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ assignment.teacher?.first_name }} {{ assignment.teacher?.last_name }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">{{ assignment.teacher?.email }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ assignment.class?.name || 'All Classes' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ assignment.section?.name || 'All Sections' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span v-if="assignment.is_primary" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Primary
                </span>
                <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                  Secondary
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                  <button 
                    @click="editAssignment(assignment)"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    Edit
                  </button>
                  <button 
                    @click="deleteAssignment(assignment)"
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ isEditing ? 'Edit Assignment' : 'Create Assignment' }}
          </h3>
          
          <!-- Form will be added in the next step -->
          <div class="text-center text-gray-500 dark:text-gray-400">
            Form coming in next step...
          </div>
          
          <div class="flex justify-end space-x-3 mt-6">
            <button 
              @click="showCreateModal = false"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from '~/composables/useToast'
import { useDropdowns } from '~/composables/useDropdowns'
import { useAcademics } from '~/composables/useAcademics'
import { subjectTeacherApi } from '~/api/subject-teachers'
import { subjectApi } from '~/api/subjects'

// Composables
const { showToast } = useToast()
const { classOptions, loadClasses } = useDropdowns()
const { academicYears, fetchAcademicYears } = useAcademics()

// Reactive data
const loading = ref(false)
const assignments = ref([])
const subjectOptions = ref([])
const showCreateModal = ref(false)
const isEditing = ref(false)

// Filters
const filters = ref({
  subject_id: '',
  class_id: '',
  academic_year: ''
})

// Computed
const academicYearOptions = computed(() => {
  return academicYears.value.map(year => ({
    value: year.name,
    label: year.name + (year.is_current ? ' (Current)' : '')
  }))
})

// Methods
const loadAssignments = async () => {
  try {
    loading.value = true
    const response = await subjectTeacherApi.getAll(filters.value)
    assignments.value = response.data.assignments || response.data.rows || []
  } catch (error) {
    console.error('Error loading assignments:', error)
    showToast('Failed to load assignments', 'error')
  } finally {
    loading.value = false
  }
}

const loadSubjects = async () => {
  try {
    const response = await subjectApi.getAll()
    subjectOptions.value = (response.data.subjects || response.data.rows || []).map(subject => ({
      value: subject.id,
      label: `${subject.name} (${subject.code})`
    }))
  } catch (error) {
    console.error('Error loading subjects:', error)
  }
}

const clearFilters = () => {
  filters.value = {
    subject_id: '',
    class_id: '',
    academic_year: ''
  }
  loadAssignments()
}

const editAssignment = (assignment) => {
  // This will be implemented in the next step
  console.log('Edit assignment:', assignment)
}

const deleteAssignment = async (assignment) => {
  if (!confirm(`Are you sure you want to delete this assignment?`)) return
  
  try {
    await subjectTeacherApi.delete(assignment.id)
    showToast('Assignment deleted successfully', 'success')
    loadAssignments()
  } catch (error) {
    console.error('Error deleting assignment:', error)
    showToast('Failed to delete assignment', 'error')
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadClasses(),
    fetchAcademicYears(),
    loadSubjects()
  ])
  await loadAssignments()
})
</script>
