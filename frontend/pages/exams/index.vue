<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-start">
      <div class="space-y-2">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Examination Management</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">Create, manage, and track exam schedules and results</p>
      </div>
      <div class="flex gap-2">
        <button 
          @click="showCreateModal = true"
          class="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Create Exam
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center">
          <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Exams</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.total_exams || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center">
          <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.completed_exams || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center">
          <div class="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Scheduled</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.scheduled_exams || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center">
          <div class="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.this_month || 0 }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div class="grid grid-cols-1 md:grid-cols-6 gap-4">
        <!-- Search -->
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
          <input 
            v-model="filters.search" 
            type="text" 
            placeholder="Search exam name..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            @input="debouncedSearch"
          />
        </div>

        <!-- Exam Type -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Exam Type</label>
          <select 
            v-model="filters.exam_type" 
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            @change="loadExams"
          >
            <option value="">All Types</option>
            <option value="unit_test">Unit Test</option>
            <option value="mid_term">Mid Term</option>
            <option value="final">Final</option>
            <option value="semester">Semester</option>
            <option value="annual">Annual</option>
            <option value="mock_test">Mock Test</option>
          </select>
        </div>

        <!-- Status -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
          <select 
            v-model="filters.status" 
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            @change="loadExams"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <!-- Academic Year -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Academic Year</label>
          <select 
            v-model="filters.academic_year" 
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            @change="loadExams"
          >
            <option value="">All Years</option>
            <option v-for="year in academicYears" :key="year.id" :value="year.name">{{ year.name }}</option>
          </select>
        </div>

        <!-- Clear Filters -->
        <div class="flex items-end">
          <button 
            @click="clearFilters"
            class="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Exams Table -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Exams</h3>
      </div>
      
      <div v-if="loading" class="p-8 text-center">
        <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500 hover:bg-blue-400 transition ease-in-out duration-150 cursor-not-allowed">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading exams...
        </div>
      </div>

      <div v-else-if="exams.length === 0" class="p-8 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No exams found</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new exam.</p>
        <div class="mt-6">
          <button 
            @click="showCreateModal = true"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Create Exam
          </button>
        </div>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Exam</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date & Time</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Class</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="exam in exams" :key="exam.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-gray-900 dark:text-white">{{ exam.name }}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">{{ exam.subject?.name || 'All Subjects' }}</div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="{
                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': exam.exam_type === 'unit_test',
                  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': exam.exam_type === 'mid_term',
                  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200': exam.exam_type === 'final',
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': exam.exam_type === 'semester',
                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': exam.exam_type === 'annual',
                  'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200': exam.exam_type === 'mock_test'
                }">
                  {{ exam.exam_type.replace('_', ' ').toUpperCase() }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">{{ formatDate(exam.exam_date) }}</div>
                <div v-if="exam.start_time" class="text-sm text-gray-500 dark:text-gray-400">
                  {{ exam.start_time }} - {{ exam.end_time || 'TBD' }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">{{ exam.class?.name }}</div>
                <div v-if="exam.section" class="text-sm text-gray-500 dark:text-gray-400">Section {{ exam.section.name }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="{
                  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200': exam.status === 'draft',
                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': exam.status === 'scheduled',
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': exam.status === 'in_progress',
                  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': exam.status === 'completed',
                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': exam.status === 'cancelled'
                }">
                  {{ exam.status.replace('_', ' ').toUpperCase() }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                  <button 
                    @click="viewExam(exam)"
                    class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    View
                  </button>
                  <button 
                    v-if="exam.status === 'completed'"
                    @click="viewResults(exam)"
                    class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                  >
                    Results
                  </button>
                  <button 
                    v-if="exam.status === 'scheduled' || exam.status === 'draft'"
                    @click="editExam(exam)"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    Edit
                  </button>
                  <button 
                    v-if="exam.status === 'scheduled' || exam.status === 'draft'"
                    @click="deleteExam(exam)"
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

      <!-- Pagination -->
      <div v-if="exams.length > 0" class="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <Pagination 
          :current-page="filters.page" 
          :total-pages="totalPages" 
          :total-items="totalItems"
          @page-change="handlePageChange"
        />
      </div>
    </div>

    <!-- Create/Edit Exam Modal -->
    <Modal :show="showCreateModal || showEditModal" @close="closeModal">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ showEditModal ? 'Edit Exam' : 'Create New Exam' }}
        </h3>
      </template>
      
      <template #body>
        <ExamForm 
          :exam="editingExam"
          :classes="classOptions"
          :sections="sectionOptions"
          :subjects="subjectOptions"
          @submit="handleExamSubmit"
          @cancel="closeModal"
        />
      </template>
    </Modal>

    <!-- Results Modal -->
    <Modal :show="showResultsModal" @close="showResultsModal = false" size="xl">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Exam Results - {{ selectedExam?.name }}
        </h3>
      </template>
      
      <template #body>
        <ExamResults 
          :exam="selectedExam"
          @close="showResultsModal = false"
        />
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useToast } from '~/composables/useToast'
import { useDropdowns } from '~/composables/useDropdowns'
import { useAcademics } from '~/composables/useAcademics'
import examApi from '~/api/exams'
import Modal from '~/components/Modal.vue'
import Pagination from '~/components/Pagination.vue'
import ExamForm from '~/components/forms/ExamForm.vue'
import ExamResults from '~/components/ExamResults.vue'

// Composables
const { showToast } = useToast()
const { classOptions, sectionOptions, subjectOptions, loadAllDropdowns } = useDropdowns()
const { academicYears, fetchAcademicYears } = useAcademics()

// Reactive data
const loading = ref(false)
const exams = ref([])
const stats = ref({})
const totalItems = ref(0)
const totalPages = ref(0)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showResultsModal = ref(false)
const editingExam = ref(null)
const selectedExam = ref(null)

// Filters
const filters = ref({
  page: 1,
  limit: 10,
  search: '',
  exam_type: '',
  status: '',
  academic_year: ''
})

// Academic years are now loaded from database via useAcademics composable

// Methods
const loadExams = async () => {
  try {
    loading.value = true
    const response = await examApi.getAll(filters.value)
    exams.value = response.data.exams
    totalItems.value = response.data.total
    totalPages.value = response.data.totalPages
  } catch (error) {
    showToast('Failed to load exams', 'error')
    console.error('Error loading exams:', error)
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const response = await examApi.getStats()
    stats.value = response.data.stats
  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

let searchTimeout = null
const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    filters.value.page = 1
    loadExams()
  }, 300)
}

const clearFilters = () => {
  filters.value = {
    page: 1,
    limit: 10,
    search: '',
    exam_type: '',
    status: '',
    academic_year: ''
  }
  loadExams()
}

const handlePageChange = (page) => {
  filters.value.page = page
  loadExams()
}

const viewExam = (exam) => {
  selectedExam.value = exam
  showEditModal.value = true
}

const editExam = (exam) => {
  editingExam.value = exam
  showEditModal.value = true
}

const viewResults = (exam) => {
  selectedExam.value = exam
  showResultsModal.value = true
}

const deleteExam = async (exam) => {
  if (!confirm(`Are you sure you want to delete "${exam.name}"?`)) return
  
  try {
    await examApi.delete(exam.id)
    showToast('Exam deleted successfully', 'success')
    loadExams()
    loadStats()
  } catch (error) {
    showToast('Failed to delete exam', 'error')
    console.error('Error deleting exam:', error)
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const handleExamSubmit = async (examData) => {
  console.log('handleExamSubmit called with:', examData)
  try {
    if (editingExam.value) {
      console.log('Updating exam:', editingExam.value.id)
      await examApi.update(editingExam.value.id, examData)
      showToast('Exam updated successfully', 'success')
    } else {
      console.log('Creating new exam')
      const result = await examApi.create(examData)
      console.log('Exam creation result:', result)
      showToast('Exam created successfully', 'success')
    }
    closeModal()
    loadExams()
    loadStats()
  } catch (error) {
    console.error('Error in handleExamSubmit:', error)
    console.error('Error response:', error.response)
    showToast(error.response?.data?.message || 'Failed to save exam', 'error')
  }
}

const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  editingExam.value = null
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadAllDropdowns(),
    fetchAcademicYears(),
    loadExams(),
    loadStats()
  ])
})
</script>
