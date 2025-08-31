<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Subject Management</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">Manage academic subjects for each class and branch</p>
        </div>
        <div class="mt-4 sm:mt-0 sm:flex sm:space-x-3">
          <button
            @click="openCreateModal"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus class="-ml-1 mr-2 h-5 w-5" />
            Add Subject
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <BookOpen class="h-6 w-6 text-gray-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Subjects</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ stats.total || 0 }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <CheckCircle class="h-6 w-6 text-green-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Active Subjects</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ stats.active || 0 }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <XCircle class="h-6 w-6 text-red-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Inactive Subjects</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ stats.inactive || 0 }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <Tag class="h-6 w-6 text-blue-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Categories</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ stats.byCategory?.length || 0 }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-6 gap-4">
          <!-- Search -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
            <input 
              v-model="filters.search" 
              type="text" 
              placeholder="Search subject name, code..."
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              @input="debouncedSearch"
            />
          </div>

          <!-- Category -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
            <select 
              v-model="filters.category" 
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              @change="loadSubjects"
            >
              <option value="">All Categories</option>
              <option value="core">Core</option>
              <option value="elective">Elective</option>
              <option value="extra_curricular">Extra Curricular</option>
              <option value="language">Language</option>
              <option value="science">Science</option>
              <option value="arts">Arts</option>
              <option value="commerce">Commerce</option>
            </select>
          </div>

          <!-- Status -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <select 
              v-model="filters.is_active" 
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              @change="loadSubjects"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
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

      <!-- Subjects Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Subjects</h3>
        </div>
        
        <div v-if="loading" class="p-8 text-center">
          <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500 hover:bg-blue-400 transition ease-in-out duration-150 cursor-not-allowed">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading subjects...
          </div>
        </div>

        <div v-else-if="subjects.length === 0" class="p-8 text-center">
          <div class="text-gray-500 dark:text-gray-400">
            <BookOpen class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No subjects found</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new subject.
            </p>
            <div class="mt-6">
              <button
                @click="openCreateModal"
                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus class="-ml-1 mr-2 h-5 w-5" />
                Add Subject
              </button>
            </div>
          </div>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Subject
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Category
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Class
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Credits
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="subject in subjects" :key="subject.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">{{ subject.name }}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">{{ subject.code }}</div>
                    <div v-if="subject.description" class="text-xs text-gray-400 dark:text-gray-500 truncate max-w-xs">
                      {{ subject.description }}
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="{
                    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': subject.category === 'core',
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': subject.category === 'elective',
                    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200': subject.category === 'extra_curricular',
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': subject.category === 'language',
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': subject.category === 'science',
                    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200': subject.category === 'arts',
                    'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200': subject.category === 'commerce'
                  }">
                    {{ subject.category.replace('_', ' ').toUpperCase() }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ subject.class?.name || 'All Classes' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ subject.credit_hours || 1 }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="{
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': subject.is_active,
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': !subject.is_active
                  }">
                    {{ subject.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex space-x-2">
                    <button 
                      @click="editSubject(subject)"
                      class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      Edit
                    </button>
                    <button 
                      @click="deleteSubject(subject)"
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
        <div v-if="subjects.length > 0" class="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <Pagination 
            :current-page="filters.page" 
            :total-pages="totalPages" 
            :total-items="totalItems"
            @page-change="handlePageChange"
          />
        </div>
      </div>
    </div>

    <!-- Create/Edit Subject Modal -->
    <Modal :show="showModal" @close="closeModal">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ isEditing ? 'Edit Subject' : 'Create New Subject' }}
        </h3>
      </template>
      
      <template #body>
        <SubjectForm 
          :subject="editingSubject"
          :classes="classOptions"
          @submit="handleSubjectSubmit"
          @cancel="closeModal"
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
import { subjectApi } from '~/api/subjects'
import Modal from '~/components/Modal.vue'
import Pagination from '~/components/Pagination.vue'
import SubjectForm from '~/components/forms/SubjectForm.vue'
import { Plus, BookOpen, CheckCircle, XCircle, Tag } from 'lucide-vue-next'

// Composables
const { showToast } = useToast()
const { classOptions, loadClasses } = useDropdowns()
const { academicYears, fetchAcademicYears } = useAcademics()

// Reactive data
const loading = ref(false)
const subjects = ref([])
const stats = ref({})
const totalItems = ref(0)
const totalPages = ref(0)
const showModal = ref(false)
const isEditing = ref(false)
const editingSubject = ref(null)

// Filters
const filters = ref({
  page: 1,
  limit: 10,
  search: '',
  category: '',
  is_active: ''
})

// Methods
const loadSubjects = async () => {
  try {
    loading.value = true
    const response = await subjectApi.getAll(filters.value)
    subjects.value = response.data.subjects
    totalItems.value = response.data.pagination.total
    totalPages.value = response.data.pagination.totalPages
  } catch (error) {
    showToast('Failed to load subjects', 'error')
    console.error('Error loading subjects:', error)
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const response = await subjectApi.getStats()
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
    loadSubjects()
  }, 300)
}

const clearFilters = () => {
  filters.value = {
    page: 1,
    limit: 10,
    search: '',
    category: '',
    is_active: ''
  }
  loadSubjects()
}

const handlePageChange = (page) => {
  filters.value.page = page
  loadSubjects()
}

const openCreateModal = () => {
  isEditing.value = false
  editingSubject.value = null
  showModal.value = true
}

const editSubject = (subject) => {
  isEditing.value = true
  editingSubject.value = subject
  showModal.value = true
}

const deleteSubject = async (subject) => {
  if (!confirm(`Are you sure you want to delete "${subject.name}"?`)) return
  
  try {
    await subjectApi.delete(subject.id)
    showToast('Subject deleted successfully', 'success')
    loadSubjects()
    loadStats()
  } catch (error) {
    showToast('Failed to delete subject', 'error')
    console.error('Error deleting subject:', error)
  }
}

const handleSubjectSubmit = async (subjectData) => {
  try {
    if (editingSubject.value) {
      await subjectApi.update(editingSubject.value.id, subjectData)
      showToast('Subject updated successfully', 'success')
    } else {
      await subjectApi.create(subjectData)
      showToast('Subject created successfully', 'success')
    }
    closeModal()
    loadSubjects()
    loadStats()
  } catch (error) {
    showToast(error.response?.data?.message || 'Failed to save subject', 'error')
    console.error('Error in handleSubjectSubmit:', error)
  }
}

const closeModal = () => {
  showModal.value = false
  editingSubject.value = null
  isEditing.value = false
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadClasses(),
    fetchAcademicYears(),
    loadSubjects(),
    loadStats()
  ])
})
</script>
