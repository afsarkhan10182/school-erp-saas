<template>
  <div class="quick-schedule-form">
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-gray-900">Quick Schedule Creation</h3>
        <p class="text-sm text-gray-500">Create multiple exam schedules at once</p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Exam Selection -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Select Exam <span class="text-red-500">*</span>
            </label>
            <select
              v-model="formData.exam_id"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose an exam</option>
              <option v-for="exam in exams" :key="exam.id" :value="exam.id">
                {{ exam.name }} ({{ exam.examType?.name }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Exam Hall (Optional)
            </label>
            <select
              v-model="formData.exam_hall_id"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No hall assigned</option>
              <option v-for="hall in examHalls" :key="hall.id" :value="hall.id">
                {{ hall.name }} (Capacity: {{ hall.capacity }})
              </option>
            </select>
          </div>
        </div>

        <!-- Class Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Select Classes <span class="text-red-500">*</span>
          </label>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <label
              v-for="classItem in classes"
              :key="classItem.id"
              class="flex items-center space-x-2 cursor-pointer"
            >
              <input
                type="checkbox"
                :value="classItem.id"
                v-model="formData.class_ids"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm text-gray-700">{{ classItem.name }}</span>
            </label>
          </div>
        </div>

        <!-- Section Selection (Optional) -->
        <div v-if="showSections">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Select Sections (Optional)
          </label>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <label
              v-for="section in sections"
              :key="section.id"
              class="flex items-center space-x-2 cursor-pointer"
            >
              <input
                type="checkbox"
                :value="section.id"
                v-model="formData.section_ids"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm text-gray-700">{{ section.name }}</span>
            </label>
          </div>
        </div>

        <!-- Date and Time -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Starting Date <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.starting_date"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Starting Time <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.starting_time"
              type="time"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes) <span class="text-red-500">*</span>
            </label>
            <input
              v-model.number="formData.duration_minutes"
              type="number"
              min="1"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <!-- Mark Distribution -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="text-md font-medium text-gray-900 mb-4">Mark Distribution</h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"> Theory Marks </label>
              <input
                v-model.number="formData.mark_distribution.theory_marks"
                type="number"
                min="0"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"> Practical Marks </label>
              <input
                v-model.number="formData.mark_distribution.practical_marks"
                type="number"
                min="0"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"> Viva Marks </label>
              <input
                v-model.number="formData.mark_distribution.viva_marks"
                type="number"
                min="0"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"> Assignment Marks </label>
              <input
                v-model.number="formData.mark_distribution.assignment_marks"
                type="number"
                min="0"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"> Total Marks </label>
              <input
                v-model.number="formData.total_marks"
                type="number"
                min="1"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"> Pass Marks </label>
              <input
                v-model.number="formData.pass_marks"
                type="number"
                min="0"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="flex justify-end space-x-3">
          <button
            type="button"
            @click="$emit('cancel')"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isLoading || formData.class_ids.length === 0"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isLoading">Creating Schedules...</span>
            <span v-else>Create Quick Schedule</span>
          </button>
        </div>
      </form>

      <!-- Results Display -->
      <div v-if="result" class="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 class="text-md font-medium text-gray-900 mb-3">Creation Results</h4>
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">{{ result.success_count }}</div>
            <div class="text-sm text-gray-600">Schedules Created</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-red-600">{{ result.error_count }}</div>
            <div class="text-sm text-gray-600">Errors</div>
          </div>
        </div>

        <div v-if="result.errors.length > 0" class="mt-4">
          <h5 class="text-sm font-medium text-gray-900 mb-2">Errors:</h5>
          <ul class="text-sm text-red-600 space-y-1">
            <li v-for="error in result.errors" :key="error" class="flex items-start">
              <span class="mr-2">•</span>
              <span>{{ error }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuickSchedule } from '~/composables/useQuickSchedule';
import { useExams } from '~/composables/useExams';
import { useExamHalls } from '~/composables/useExamHalls';
import { useStudents } from '~/composables/useStudents';

const emit = defineEmits<{
  cancel: [];
  success: [result: any];
}>();

const { createQuickSchedule, isLoading, result } = useQuickSchedule();
const { exams, fetchExams } = useExams();
const { examHalls, fetchExamHalls } = useExamHalls();
const { classes, sections, fetchClasses, fetchSections } = useStudents();

const formData = ref({
  exam_id: '',
  class_ids: [] as string[],
  section_ids: [] as string[],
  starting_date: '',
  starting_time: '',
  duration_minutes: 180,
  exam_hall_id: '',
  mark_distribution: {
    theory_marks: 70,
    practical_marks: 20,
    viva_marks: 10,
    assignment_marks: 0
  },
  total_marks: 100,
  pass_marks: 35
});

const showSections = computed(() => formData.value.section_ids.length > 0);

const handleSubmit = async () => {
  try {
    const response = await createQuickSchedule({
      ...formData.value,
      school_id: '', // Will be set by the composable
      branch_id: '' // Will be set by the composable
    });

    emit('success', response);
  } catch (error) {
    console.error('Quick schedule creation failed:', error);
  }
};

onMounted(async () => {
  await Promise.all([fetchExams(), fetchExamHalls(), fetchClasses(), fetchSections()]);
});
</script>
