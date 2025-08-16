<template>
  <div class="p-4">
    <h2 class="text-xl font-semibold mb-4">Attendance Sessions</h2>
    
    <!-- Filters using new component -->
    <AttendanceFilters 
      v-model="filters"
      :show-status="true"
      :loading="loading"
      @filter="handleFilter"
      @reset="handleReset"
    >
      <template #actions>
        <NuxtLink to="/attendance/take" class="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors">
          Take Attendance
        </NuxtLink>
        <NuxtLink to="/attendance/bulk-import" class="bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 transition-colors">
          Bulk Import
        </NuxtLink>
        <NuxtLink to="/attendance/notify" class="bg-orange-600 text-white px-3 py-2 rounded hover:bg-orange-700 transition-colors">
          Notifications
        </NuxtLink>
      </template>
    </AttendanceFilters>

    <!-- Empty State -->
    <div v-if="!loading && sessions.length === 0" class="border rounded p-6 bg-gray-50 text-gray-600">
      <div class="font-medium mb-2">No attendance sessions found</div>
      <p class="mb-3">Try adjusting filters or create a new session.</p>
      <NuxtLink to="/attendance/take" class="inline-block bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors">
        Take Attendance
      </NuxtLink>
    </div>

    <!-- Data Table -->
    <DataTable
      v-else
      :items="sessions"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      @page-change="handlePageChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAttendance } from '~/composables/useAttendance'
import AttendanceFilters from '~/components/forms/AttendanceFilters.vue'

// Use attendance composable for business logic
const { sessions, loading, pagination, loadSessions, setPage } = useAttendance()

// Local state for filters
const filters = ref({
  date_from: '',
  date_to: '',
  class_id: '',
  section_id: '',
  status: ''
})

// Table columns configuration
const columns = [
  { key: 'date', label: 'Date' },
  { key: 'attendance_type', label: 'Type' },
  { key: 'period_number', label: 'Period' },
  { key: 'status', label: 'Status' }
]

// Event handlers
const handleFilter = async (filterData: typeof filters.value) => {
  filters.value = { ...filterData }
  pagination.page = 1 // Reset to first page when filtering
  await loadSessions(filters.value)
}

const handleReset = async () => {
  filters.value = {
    date_from: '',
    date_to: '',
    class_id: '',
    section_id: '',
    status: ''
  }
  pagination.page = 1
  await loadSessions()
}

const handlePageChange = async (page: number) => {
  setPage(page)
  await loadSessions(filters.value)
}

// Load initial data
onMounted(async () => {
  await loadSessions()
})
</script>

<style scoped></style>


