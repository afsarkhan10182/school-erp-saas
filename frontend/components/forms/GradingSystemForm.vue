<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div
      class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
    >
      <!-- Background overlay -->
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        @click="$emit('close')"
      ></div>

      <!-- Modal panel -->
      <div
        class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
      >
        <form @submit.prevent="handleSubmit">
          <!-- Header -->
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                {{ isEditing ? 'Edit Grading System' : 'Create Grading System' }}
              </h3>
              <button
                type="button"
                @click="$emit('close')"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X class="w-6 h-6" />
              </button>
            </div>

            <!-- Form Fields -->
            <div class="space-y-4">
              <!-- Name -->
              <div>
                <label
                  for="name"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Name *
                </label>
                <input
                  id="name"
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter grading system name"
                />
              </div>

              <!-- Code -->
              <div>
                <label
                  for="code"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Code *
                </label>
                <input
                  id="code"
                  v-model="form.code"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter grading system code (e.g., CBSE)"
                />
              </div>

              <!-- Description -->
              <div>
                <label
                  for="description"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  v-model="form.description"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter grading system description"
                ></textarea>
              </div>

              <!-- Grade Type -->
              <div>
                <label
                  for="grade_type"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Grade Type *
                </label>
                <select
                  id="grade_type"
                  v-model="form.grade_type"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select grade type</option>
                  <option value="letter">Letter Grades (A, B, C, D, F)</option>
                  <option value="number">Numeric Grades (1-100)</option>
                  <option value="percentage">Percentage Grades (0-100%)</option>
                  <option value="custom">Custom Grade Scale</option>
                </select>
              </div>

              <!-- Passing Percentage -->
              <div>
                <label
                  for="passing_percentage"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Passing Percentage *
                </label>
                <input
                  id="passing_percentage"
                  v-model.number="form.passing_percentage"
                  type="number"
                  min="0"
                  max="100"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter passing percentage (e.g., 35)"
                />
              </div>

              <!-- Max Grade Points -->
              <div>
                <label
                  for="max_grade_points"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Max Grade Points *
                </label>
                <input
                  id="max_grade_points"
                  v-model.number="form.max_grade_points"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter max grade points (e.g., 4.0)"
                />
              </div>

              <!-- Is Default -->
              <div class="flex items-center">
                <input
                  id="is_default"
                  v-model="form.is_default"
                  type="checkbox"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label for="is_default" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Set as default grading system
                </label>
              </div>

              <!-- Is Active -->
              <div class="flex items-center">
                <input
                  id="is_active"
                  v-model="form.is_active"
                  type="checkbox"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label for="is_active" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Active
                </label>
              </div>

              <!-- Grade Scales -->
              <div>
                <div class="flex items-center justify-between mb-4">
                  <h4 class="text-lg font-medium text-gray-900 dark:text-white">Grade Scales</h4>
                  <button
                    type="button"
                    @click="addGradeScale"
                    class="bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 transition-colors text-sm"
                  >
                    Add Scale
                  </button>
                </div>

                <div
                  v-if="form.gradeScales.length === 0"
                  class="text-center py-4 text-gray-500 dark:text-gray-400"
                >
                  No grade scales added yet
                </div>

                <div v-else class="space-y-3">
                  <div
                    v-for="(scale, index) in form.gradeScales"
                    :key="index"
                    class="grid grid-cols-1 md:grid-cols-6 gap-3 items-end p-3 border border-gray-200 dark:border-gray-600 rounded-md"
                  >
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >Grade</label
                      >
                      <input
                        v-model="scale.grade"
                        type="text"
                        required
                        class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >Min %</label
                      >
                      <input
                        v-model.number="scale.min_percentage"
                        type="number"
                        min="0"
                        max="100"
                        required
                        class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >Max %</label
                      >
                      <input
                        v-model.number="scale.max_percentage"
                        type="number"
                        min="0"
                        max="100"
                        required
                        class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >Points</label
                      >
                      <input
                        v-model.number="scale.grade_points"
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>
                    <div class="flex items-center">
                      <input
                        v-model="scale.is_passing"
                        type="checkbox"
                        class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Passing
                      </label>
                    </div>
                    <div>
                      <button
                        type="button"
                        @click="removeGradeScale(index)"
                        class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              :disabled="loading"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ loading ? 'Saving...' : isEditing ? 'Update' : 'Create' }}
            </button>
            <button
              type="button"
              @click="$emit('close')"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { X } from 'lucide-vue-next';

// Props
const props = defineProps({
  system: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['close', 'submit']);

// Computed
const isEditing = computed(() => !!props.system);

// Form data
const form = reactive({
  name: '',
  code: '',
  description: '',
  grade_type: '',
  passing_percentage: 35,
  max_grade_points: 4.0,
  is_default: false,
  is_active: true,
  gradeScales: []
});

// Initialize form
onMounted(() => {
  if (props.system) {
    form.name = props.system.name || '';
    form.code = props.system.code || '';
    form.description = props.system.description || '';
    form.grade_type = props.system.grade_type || '';
    form.passing_percentage = props.system.passing_percentage || 35;
    form.max_grade_points = props.system.max_grade_points || 4.0;
    form.is_default = props.system.is_default || false;
    form.is_active = props.system.is_active !== false;
    form.gradeScales = props.system.gradeScales ? [...props.system.gradeScales] : [];
  } else {
    // Add a default grade scale for new grading systems
    addInitialGradeScale();
  }
});

// Methods
const addInitialGradeScale = () => {
  // Add CBSE-style grade scales as default
  const defaultScales = [
    { grade: 'A1', min_percentage: 91, max_percentage: 100, grade_points: 4.0, is_passing: true },
    { grade: 'A2', min_percentage: 81, max_percentage: 90, grade_points: 3.7, is_passing: true },
    { grade: 'B1', min_percentage: 71, max_percentage: 80, grade_points: 3.3, is_passing: true },
    { grade: 'B2', min_percentage: 61, max_percentage: 70, grade_points: 3.0, is_passing: true },
    { grade: 'C1', min_percentage: 51, max_percentage: 60, grade_points: 2.7, is_passing: true },
    { grade: 'C2', min_percentage: 41, max_percentage: 50, grade_points: 2.3, is_passing: true },
    { grade: 'D', min_percentage: 35, max_percentage: 40, grade_points: 2.0, is_passing: true },
    { grade: 'E', min_percentage: 0, max_percentage: 34, grade_points: 0.0, is_passing: false }
  ];

  form.gradeScales = [...defaultScales];
};

const addGradeScale = () => {
  form.gradeScales.push({
    grade: '',
    min_percentage: 0,
    max_percentage: 100,
    grade_points: 0,
    is_passing: false
  });
};

const removeGradeScale = index => {
  form.gradeScales.splice(index, 1);
};

const handleSubmit = () => {
  // Validate required fields
  if (!form.name.trim()) {
    alert('Name is required');
    return;
  }

  if (!form.code.trim()) {
    alert('Code is required');
    return;
  }

  if (!form.grade_type) {
    alert('Grade type is required');
    return;
  }

  if (form.passing_percentage < 0 || form.passing_percentage > 100) {
    alert('Passing percentage must be between 0 and 100');
    return;
  }

  if (form.max_grade_points < 0 || form.max_grade_points > 10) {
    alert('Max grade points must be between 0 and 10');
    return;
  }

  if (form.gradeScales.length === 0) {
    alert('At least one grade scale is required');
    return;
  }

  // Validate grade scales
  const grades = form.gradeScales.map(scale => scale.grade.trim().toUpperCase());
  const uniqueGrades = [...new Set(grades)];

  if (grades.length !== uniqueGrades.length) {
    alert('Grade values must be unique within this grading system');
    return;
  }

  // Check for empty grades
  const emptyGrades = form.gradeScales.some(scale => !scale.grade.trim());
  if (emptyGrades) {
    alert('All grade values must be filled');
    return;
  }

  // Check for overlapping percentage ranges
  for (let i = 0; i < form.gradeScales.length; i++) {
    for (let j = i + 1; j < form.gradeScales.length; j++) {
      const scale1 = form.gradeScales[i];
      const scale2 = form.gradeScales[j];

      if (
        scale1.min_percentage <= scale2.max_percentage &&
        scale2.min_percentage <= scale1.max_percentage
      ) {
        alert(
          `Grade scales "${scale1.grade}" and "${scale2.grade}" have overlapping percentage ranges`
        );
        return;
      }
    }
  }

  // Validate that min_percentage <= max_percentage for each scale
  for (const scale of form.gradeScales) {
    if (scale.min_percentage > scale.max_percentage) {
      alert(`Grade "${scale.grade}": Minimum percentage cannot be greater than maximum percentage`);
      return;
    }
  }

  emit('submit', { ...form });
};
</script>
