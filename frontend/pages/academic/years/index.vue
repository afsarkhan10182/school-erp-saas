<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Global Academic Years</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">Common academic year sessions for all schools (e.g., 2024-2025)</p>
        </div>
        <div class="mt-4 sm:mt-0 sm:flex sm:space-x-3">
          <button
            v-if="authStore.user?.role === 'super_admin'"
            @click="showCreateForm = true"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Academic Year
          </button>
        </div>
      </div>

      <!-- Authorization Error Banner -->
      <div v-if="authError" class="mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div class="flex items-center">
          <svg class="w-5 h-5 text-red-600 dark:text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Access Denied</h3>
            <p class="mt-1 text-sm text-red-700 dark:text-red-300">
              {{ authError }}
            </p>
          </div>
        </div>
      </div>

      <!-- Current Academic Year Status -->
      <div v-if="!authError && currentAcademicYear" class="mb-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <svg class="w-5 h-5 text-green-600 dark:text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <h3 class="text-sm font-medium text-green-800 dark:text-green-200">
                Current Global Academic Year: {{ currentAcademicYear.name }}
              </h3>
              <p class="mt-1 text-sm text-green-700 dark:text-green-300">
                {{ currentAcademicYear.schools_count || 0 }} schools are linked to this academic year
              </p>
            </div>
          </div>
          <button
            v-if="authStore.user?.role === 'super_admin'"
            @click="syncSchoolsToCurrentYear"
            :disabled="syncing"
            class="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
          >
            <svg v-if="syncing" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ syncing ? 'Syncing...' : 'Sync All Schools' }}</span>
          </button>
        </div>
      </div>

      <!-- Info Banner -->
      <div v-if="!authError" class="mb-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div class="flex items-center">
          <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">Global Academic Years</h3>
            <p class="mt-1 text-sm text-blue-700 dark:text-blue-300">
              These academic years are shared across all schools. When you set an academic year as "Current", all schools are automatically linked to it.
            </p>
          </div>
        </div>
      </div>

      <!-- Academic Years List -->
      <div v-if="!authError" class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">Academic Years</h3>
        </div>
        <div class="overflow-x-auto">
          <div v-if="loading" class="text-center py-8">
            <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-500 hover:bg-indigo-400 transition ease-in-out duration-150 cursor-not-allowed">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </div>
          </div>
          
          <div v-else-if="academicYears.length === 0" class="text-center py-8">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No academic years</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new academic year (e.g., 2024-2025).</p>
          </div>

          <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
            <div v-for="year in academicYears" :key="year.id" class="px-4 py-4 sm:px-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                      <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="flex items-center">
                      <h4 class="text-lg font-medium text-gray-900 dark:text-white">{{ year.name }}</h4>
                      <span v-if="year.is_current" class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Current
                      </span>
                    </div>
                    <div class="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <span>Created: {{ formatDate(year.created_at) }}</span>
                      <span v-if="year.updated_at && year.updated_at !== year.created_at" class="ml-4">Updated: {{ formatDate(year.updated_at) }}</span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <!-- Set as Current Button (Super Admin Only) -->
                  <button
                    v-if="authStore.user?.role === 'super_admin'"
                    @click="toggleCurrent(year)"
                    :class="[
                      'inline-flex items-center px-3 py-1 border text-sm font-medium rounded-md',
                      year.is_current
                        ? 'border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-300 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/40'
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                    ]"
                  >
                    {{ year.is_current ? 'Unset Current' : 'Set as Current' }}
                  </button>
                  
                  <!-- Edit Button (Super Admin Only) -->
                  <button
                    v-if="authStore.user?.role === 'super_admin'"
                    @click="editYear(year)"
                    class="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    Edit
                  </button>
                  
                  <!-- Delete Button (Super Admin Only) -->
                  <button
                    v-if="authStore.user?.role === 'super_admin'"
                    @click="deleteYear(year)"
                    class="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:bg-gray-700 dark:hover:bg-red-900/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div v-if="showCreateForm && authStore.user?.role === 'super_admin'" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {{ editingYear ? 'Edit Academic Year' : 'Create New Academic Year' }}
            </h3>
            <form @submit.prevent="saveYear">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Academic Year Name</label>
                  <input
                    v-model="form.name"
                    type="text"
                    placeholder="e.g., 2024-2025"
                    class="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div class="flex items-center">
                  <input
                    v-model="form.is_current"
                    type="checkbox"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label class="ml-2 block text-sm text-gray-900 dark:text-gray-300">Set as current academic year</label>
                </div>
              </div>
              <div class="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  @click="closeForm"
                  class="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="saving"
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <svg v-if="saving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ saving ? 'Saving...' : (editingYear ? 'Update' : 'Create') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useToast } from '~/composables/useToast'
import { apiClient } from '~/utils/api'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  // Global auth middleware handles authentication
})

const { showToast } = useToast()
const authStore = useAuthStore()

const academicYears = ref([])
const loading = ref(true)
const authError = ref('')
const showCreateForm = ref(false)
const editingYear = ref(null)
const saving = ref(false)
const syncing = ref(false)

// Computed property for current academic year
const currentAcademicYear = computed(() => {
  return academicYears.value.find(year => year.is_current) || null
})

const form = ref({
  name: '',
  is_current: false
})

const fetchAcademicYears = async () => {
  try {
    loading.value = true
    authError.value = ''
    
    // Fetch academic years list
    const response = await apiClient.academicYears.getAll()
    academicYears.value = response.data || []
    
    // Fetch current academic year with schools count
    try {
      const currentResponse = await apiClient.academicYears.getCurrent()
      if (currentResponse.data) {
        // Update the current academic year in the list with schools count
        const currentIndex = academicYears.value.findIndex(year => year.id === currentResponse.data.id)
        if (currentIndex !== -1) {
          academicYears.value[currentIndex] = { ...academicYears.value[currentIndex], ...currentResponse.data }
        }
      }
    } catch (currentError) {
      console.warn('Could not fetch current academic year details:', currentError)
    }
  } catch (error) {
    console.error('Error fetching academic years:', error)
    
    // Handle authorization errors
    if (error.response?.status === 403) {
      authError.value = 'You do not have permission to access academic years management. Only super admins and school admins can view academic years.'
    } else if (error.response?.status === 401) {
      authError.value = 'Please log in to access this page.'
    } else {
      showToast('Error fetching academic years', 'error')
    }
  } finally {
    loading.value = false
  }
}

const saveYear = async () => {
  try {
    saving.value = true
    
    const payload = { ...form.value }
    
    if (editingYear.value) {
      await apiClient.academicYears.update(editingYear.value.id, payload)
      showToast('Academic year updated successfully', 'success')
    } else {
      await apiClient.academicYears.create(payload)
      showToast('Academic year created successfully', 'success')
    }
    
    closeForm()
    fetchAcademicYears()
  } catch (error) {
    showToast(error.message || 'Error saving academic year', 'error')
    console.error('Error saving academic year:', error)
  } finally {
    saving.value = false
  }
}

const editYear = (year) => {
  editingYear.value = year
  form.value = {
    name: year.name,
    is_current: year.is_current
  }
  showCreateForm.value = true
}

const toggleCurrent = async (year) => {
  try {
    await apiClient.academicYears.update(year.id, { is_current: !year.is_current })
    showToast(`Academic year ${year.is_current ? 'unset' : 'set'} as current`, 'success')
    fetchAcademicYears()
  } catch (error) {
    showToast('Error updating academic year', 'error')
    console.error('Error updating academic year:', error)
  }
}

const deleteYear = async (year) => {
  if (year.is_current) {
    showToast('Cannot delete current academic year', 'error')
    return
  }
  
  if (confirm(`Are you sure you want to delete academic year ${year.name}?`)) {
    try {
      await apiClient.academicYears.delete(year.id)
      showToast('Academic year deleted successfully', 'success')
      fetchAcademicYears()
    } catch (error) {
      showToast('Error deleting academic year', 'error')
      console.error('Error deleting academic year:', error)
    }
  }
}

const closeForm = () => {
  showCreateForm.value = false
  editingYear.value = null
  form.value = {
    name: '',
    is_current: false
  }
}

const syncSchoolsToCurrentYear = async () => {
  try {
    syncing.value = true
    await apiClient.academicYears.syncSchools()
    showToast('All schools synced to current academic year successfully', 'success')
    fetchAcademicYears() // Refresh to get updated schools count
  } catch (error) {
    showToast(error.message || 'Error syncing schools', 'error')
    console.error('Error syncing schools:', error)
  } finally {
    syncing.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  fetchAcademicYears()
})
</script>

<style scoped>
/* Custom styles for academic years page */
</style>
