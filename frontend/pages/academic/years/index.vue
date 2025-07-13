<template>
  <div class="page-content">
    <div class="page-header">
      <h1 class="page-title">Academic Years</h1>
      <button @click="showCreateForm = true" class="btn btn-primary">
        <i class="fas fa-plus"></i>
        Add Academic Year
      </button>
    </div>

    <!-- Academic Years List -->
    <div class="card">
      <div class="card-header">
        <h5 class="card-title">Academic Years</h5>
      </div>
      <div class="card-body">
        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
        
        <div v-else-if="academicYears.length === 0" class="text-center py-4">
          <p class="text-muted">No academic years found. Create your first academic year to get started.</p>
        </div>

        <div v-else class="table-responsive">
          <table class="table table-striped">
            <thead>
              <tr>
                <th>Year</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="year in academicYears" :key="year.id">
                <td>{{ year.year }}</td>
                <td>{{ formatDate(year.start_date) }}</td>
                <td>{{ formatDate(year.end_date) }}</td>
                <td>
                  <span :class="statusClass(year.is_active)" class="badge">
                    {{ year.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td>
                  <button @click="editYear(year)" class="btn btn-sm btn-outline-primary me-2">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button @click="toggleStatus(year)" class="btn btn-sm btn-outline-secondary me-2">
                    <i class="fas fa-toggle-on"></i>
                  </button>
                  <button @click="deleteYear(year)" class="btn btn-sm btn-outline-danger">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateForm || editingYear" class="modal show d-block" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingYear ? 'Edit' : 'Create' }} Academic Year</h5>
            <button type="button" class="btn-close" @click="closeForm"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveYear">
              <div class="mb-3">
                <label for="year" class="form-label">Academic Year</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="year" 
                  v-model="form.year"
                  placeholder="e.g., 2024-2025"
                  required
                >
              </div>
              
              <div class="mb-3">
                <label for="start_date" class="form-label">Start Date</label>
                <input 
                  type="date" 
                  class="form-control" 
                  id="start_date" 
                  v-model="form.start_date"
                  required
                >
              </div>
              
              <div class="mb-3">
                <label for="end_date" class="form-label">End Date</label>
                <input 
                  type="date" 
                  class="form-control" 
                  id="end_date" 
                  v-model="form.end_date"
                  required
                >
              </div>
              
              <div class="mb-3 form-check">
                <input 
                  type="checkbox" 
                  class="form-check-input" 
                  id="is_active" 
                  v-model="form.is_active"
                >
                <label class="form-check-label" for="is_active">
                  Active
                </label>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeForm">Cancel</button>
            <button type="button" class="btn btn-primary" @click="saveYear" :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              {{ editingYear ? 'Update' : 'Create' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showCreateForm || editingYear" class="modal-backdrop show"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from '~/composables/useToast'

definePageMeta({
  middleware: 'auth'
})

const { showToast } = useToast()

const academicYears = ref([])
const loading = ref(true)
const showCreateForm = ref(false)
const editingYear = ref(null)
const saving = ref(false)

const form = ref({
  year: '',
  start_date: '',
  end_date: '',
  is_active: false
})

const fetchAcademicYears = async () => {
  try {
    loading.value = true
    const { data } = await $fetch('/api/academic-years', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    academicYears.value = data
  } catch (error) {
    showToast('Error fetching academic years', 'error')
    console.error('Error fetching academic years:', error)
  } finally {
    loading.value = false
  }
}

const saveYear = async () => {
  try {
    saving.value = true
    
    if (editingYear.value) {
      await $fetch(`/api/academic-years/${editingYear.value.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: form.value
      })
      showToast('Academic year updated successfully', 'success')
    } else {
      await $fetch('/api/academic-years', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: form.value
      })
      showToast('Academic year created successfully', 'success')
    }
    
    closeForm()
    fetchAcademicYears()
  } catch (error) {
    showToast('Error saving academic year', 'error')
    console.error('Error saving academic year:', error)
  } finally {
    saving.value = false
  }
}

const editYear = (year) => {
  editingYear.value = year
  form.value = {
    year: year.year,
    start_date: year.start_date,
    end_date: year.end_date,
    is_active: year.is_active
  }
}

const toggleStatus = async (year) => {
  try {
    await $fetch(`/api/academic-years/${year.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: {
        ...year,
        is_active: !year.is_active
      }
    })
    showToast('Academic year status updated', 'success')
    fetchAcademicYears()
  } catch (error) {
    showToast('Error updating status', 'error')
    console.error('Error updating status:', error)
  }
}

const deleteYear = async (year) => {
  if (!confirm('Are you sure you want to delete this academic year?')) {
    return
  }
  
  try {
    await $fetch(`/api/academic-years/${year.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    showToast('Academic year deleted successfully', 'success')
    fetchAcademicYears()
  } catch (error) {
    showToast('Error deleting academic year', 'error')
    console.error('Error deleting academic year:', error)
  }
}

const closeForm = () => {
  showCreateForm.value = false
  editingYear.value = null
  form.value = {
    year: '',
    start_date: '',
    end_date: '',
    is_active: false
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

const statusClass = (isActive) => {
  return isActive ? 'badge-success' : 'badge-secondary'
}

onMounted(() => {
  fetchAcademicYears()
})
</script>

<style scoped>
.modal {
  background-color: rgba(0, 0, 0, 0.5);
}

.badge-success {
  background-color: #28a745;
  color: white;
}

.badge-secondary {
  background-color: #6c757d;
  color: white;
}
</style>
