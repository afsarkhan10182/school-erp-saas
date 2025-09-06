<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-start">
      <div class="space-y-2">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">My Timetable</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">View your teaching schedule for the current academic year</p>
      </div>
      
      <!-- Academic Year Selector -->
      <div class="flex items-center space-x-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Academic Year</label>
          <select 
            v-model="selectedAcademicYear" 
            @change="loadMyTimetable"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option v-for="year in academicYears" :key="year.id" :value="year.name">
              {{ year.name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-2 text-gray-600 dark:text-gray-400">Loading your timetable...</span>
    </div>

    <!-- Timetable Display -->
    <div v-else-if="myTimetable" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <!-- Timetable Header -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <h3 class="text-lg font-semibold text-white">
          {{ myTimetable.teacher?.first_name }} {{ myTimetable.teacher?.last_name }} - Teaching Schedule
        </h3>
        <p class="text-blue-100 text-sm">Academic Year: {{ selectedAcademicYear }}</p>
      </div>

      <!-- Timetable Grid -->
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">
                Time
              </th>
              <th 
                v-for="day in weekDays" 
                :key="day.value"
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                {{ day.label }}
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="period in periods" :key="period.number">
              <!-- Period Time -->
              <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700">
                <div class="text-xs text-gray-500 dark:text-gray-400">Period {{ period.number }}</div>
                <div class="font-semibold">{{ period.startTime }} - {{ period.endTime }}</div>
              </td>
              
              <!-- Day Slots -->
              <td 
                v-for="day in weekDays" 
                :key="day.value"
                class="px-4 py-3 text-sm"
              >
                <div 
                  v-for="slot in getSlotsForDayAndPeriod(day.value, period.number)" 
                  :key="slot.id"
                  class="p-3 rounded-lg border-l-4"
                  :class="getSlotClasses(slot)"
                >
                  <div class="font-semibold text-sm">{{ slot.subject?.name || 'Free Period' }}</div>
                  <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {{ slot.timetable?.class?.name }}{{ slot.timetable?.section?.name ? '-' + slot.timetable.section.name : '' }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {{ slot.start_time }} - {{ slot.end_time }}
                  </div>
                  <div v-if="slot.room_number" class="text-xs text-gray-500 dark:text-gray-500">
                    Room: {{ slot.room_number }}
                  </div>
                </div>
                
                <!-- Empty slot indicator -->
                <div v-if="getSlotsForDayAndPeriod(day.value, period.number).length === 0" class="text-gray-400 dark:text-gray-600 text-center py-2">
                  -
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
      <div class="text-gray-400 dark:text-gray-600 mb-4">
        <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No Timetable Found</h3>
      <p class="text-gray-600 dark:text-gray-400">
        You don't have any scheduled classes for the selected academic year.
      </p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error Loading Timetable</h3>
          <div class="mt-2 text-sm text-red-700 dark:text-red-300">{{ error }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAcademics } from '~/composables/useAcademics'
import { useToast } from '~/composables/useToast'
import { Academic } from '~/api'

// Composables
const { academicYears, fetchAcademicYears } = useAcademics()
const { showToast } = useToast()

// Reactive data
const loading = ref(false)
const error = ref(null)
const myTimetable = ref(null)
const selectedAcademicYear = ref('')

// Week days configuration
const weekDays = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
]

// Periods configuration (can be made dynamic based on school settings)
const periods = [
  { number: 1, startTime: '08:00', endTime: '08:45' },
  { number: 2, startTime: '08:45', endTime: '09:30' },
  { number: 3, startTime: '09:30', endTime: '10:15' },
  { number: 4, startTime: '10:15', endTime: '11:00' },
  { number: 5, startTime: '11:15', endTime: '12:00' },
  { number: 6, startTime: '12:00', endTime: '12:45' },
  { number: 7, startTime: '12:45', endTime: '13:30' },
  { number: 8, startTime: '14:00', endTime: '14:45' },
  { number: 9, startTime: '14:45', endTime: '15:30' },
  { number: 10, startTime: '15:30', endTime: '16:15' }
]

// Methods
const loadMyTimetable = async () => {
  if (!selectedAcademicYear.value) return
  
  try {
    loading.value = true
    error.value = null
    
    const response = await Academic.getMyTimetable({ academic_year: selectedAcademicYear.value })
    myTimetable.value = response.data
  } catch (err) {
    console.error('Error loading timetable:', err)
    error.value = err.message || 'Failed to load timetable'
    showToast('Failed to load timetable', 'error')
  } finally {
    loading.value = false
  }
}

const getSlotsForDayAndPeriod = (day, periodNumber) => {
  if (!myTimetable.value?.schedule?.[day]) return []
  return myTimetable.value.schedule[day].filter(slot => slot.period_number === periodNumber)
}

const getSlotClasses = (slot) => {
  const baseClasses = 'mb-2'
  
  if (slot.slot_type === 'break') {
    return `${baseClasses} bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700`
  } else if (slot.slot_type === 'lunch') {
    return `${baseClasses} bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700`
  } else if (slot.slot_type === 'assembly') {
    return `${baseClasses} bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700`
  } else if (slot.slot_type === 'free') {
    return `${baseClasses} bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600`
  } else {
    return `${baseClasses} bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700`
  }
}

// Lifecycle
onMounted(async () => {
  await fetchAcademicYears()
  
  // Set current academic year as default
  if (academicYears.value.length > 0) {
    const currentYear = academicYears.value.find(year => year.is_current)
    selectedAcademicYear.value = currentYear ? currentYear.name : academicYears.value[0].name
    await loadMyTimetable()
  }
})
</script>
