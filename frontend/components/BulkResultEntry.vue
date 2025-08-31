<template>
  <div class="space-y-6">
    <!-- Instructions -->
    <div class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <p class="text-sm text-blue-700 dark:text-blue-300">
        Enter marks for all students. Leave marks empty for absent students. Grades and percentages will be calculated automatically.
      </p>
    </div>

    <!-- Results Table -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Marks</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="(result, index) in results" :key="result.student_id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ result.student?.first_name }} {{ result.student?.last_name }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ result.student?.admission_number }}
                </div>
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <input
                  v-model.number="result.marks_obtained"
                  type="number"
                  :max="exam.max_marks"
                  min="0"
                  step="0.01"
                  class="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  :disabled="result.is_absent"
                  @input="calculateResult(index)"
                />
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <label class="flex items-center">
                  <input
                    v-model="result.is_absent"
                    type="checkbox"
                    class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    @change="handleAbsentChange(index)"
                  />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Absent</span>
                </label>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Form Actions -->
    <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
      <button
        type="button"
        @click="$emit('cancel')"
        class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Cancel
      </button>
      <button
        type="button"
        @click="handleSubmit"
        :disabled="loading"
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="loading" class="inline-flex items-center">
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Saving...
        </span>
        <span v-else>Save Results</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from '~/composables/useToast'

// Props
const props = defineProps({
  exam: {
    type: Object,
    required: true
  },
  students: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['submit', 'cancel'])

// Composables
const { showToast } = useToast()

// Reactive data
const loading = ref(false)
const results = ref([])

// Methods
const initializeResults = () => {
  results.value = props.students.map(student => ({
    student_id: student.id,
    student: student,
    marks_obtained: null,
    percentage: 0,
    grade: null,
    grade_points: null,
    is_absent: false
  }))
}

const calculateResult = (index) => {
  const result = results.value[index]
  
  if (result.is_absent) {
    result.marks_obtained = 0
    result.percentage = 0
    result.grade = 'F'
    result.grade_points = 0
    return
  }
  
  if (result.marks_obtained === null || result.marks_obtained === undefined) {
    result.percentage = 0
    result.grade = null
    result.grade_points = null
    return
  }
  
  // Calculate percentage
  result.percentage = (result.marks_obtained / props.exam.max_marks) * 100
  
  // Calculate grade
  result.grade = calculateGrade(result.percentage)
  result.grade_points = calculateGradePoints(result.grade)
}

const calculateGrade = (percentage) => {
  if (percentage >= 90) return 'A+'
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B+'
  if (percentage >= 60) return 'B'
  if (percentage >= 50) return 'C+'
  if (percentage >= 40) return 'C'
  if (percentage >= 35) return 'D'
  return 'F'
}

const calculateGradePoints = (grade) => {
  const gradePoints = {
    'A+': 4.00, 'A': 3.75, 'B+': 3.50, 'B': 3.25,
    'C+': 3.00, 'C': 2.75, 'D': 2.50, 'F': 0.00
  }
  return gradePoints[grade] || 0.00
}

const handleAbsentChange = (index) => {
  const result = results.value[index]
  if (result.is_absent) {
    result.marks_obtained = 0
  } else {
    result.marks_obtained = null
  }
  calculateResult(index)
}

const handleSubmit = async () => {
  loading.value = true
  
  try {
    // Prepare data for submission
    const submitData = results.value.map(result => ({
      student_id: result.student_id,
      marks_obtained: result.is_absent ? 0 : (result.marks_obtained || 0),
      percentage: result.percentage,
      grade: result.grade,
      grade_points: result.grade_points,
      is_absent: result.is_absent
    }))
    
    emit('submit', submitData)
  } catch (error) {
    showToast('error', 'Failed to save results')
    console.error('Error saving results:', error)
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  initializeResults()
})
</script>
