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
        class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full"
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

            <!-- Form Fields (CodeIgniter Style - 5 fields) -->
            <div class="space-y-4">
              <!-- Branch -->
              <div>
                <label
                  for="branch_id"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Branch <span class="text-red-500">*</span>
                </label>
                <EnhancedDropdown
                  v-model="form.branch_id"
                  :options="branchOptions"
                  placeholder="Choose branch"
                  :loading="branchesLoading"
                  required
                />
              </div>

              <!-- Name -->
              <div>
                <label
                  for="name"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Name <span class="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter grading system name"
                />
              </div>

              <!-- Grade Point -->
              <div>
                <label
                  for="grade_point"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Grade Point <span class="text-red-500">*</span>
                </label>
                <input
                  id="grade_point"
                  v-model="form.grade_point"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter grade point (e.g., 4.0)"
                />
              </div>

              <!-- Min Percentage -->
              <div>
                <label
                  for="min_percentage"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Min Percentage <span class="text-red-500">*</span>
                </label>
                <input
                  id="min_percentage"
                  v-model="form.min_percentage"
                  type="number"
                  min="0"
                  max="100"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter minimum percentage (e.g., 0)"
                />
              </div>

              <!-- Max Percentage -->
              <div>
                <label
                  for="max_percentage"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Max Percentage <span class="text-red-500">*</span>
                </label>
                <input
                  id="max_percentage"
                  v-model="form.max_percentage"
                  type="number"
                  min="0"
                  max="100"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter maximum percentage (e.g., 100)"
                />
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              :disabled="loading"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ loading ? 'Saving...' : isEditing ? 'Update' : 'Create' }}
            </button>
            <button
              type="button"
              @click="$emit('close')"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { useBranches } from '~/composables/useBranches';

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

// Composables
const { branches, fetchBranches, loading: branchesLoading } = useBranches();

// Computed
const isEditing = computed(() => !!props.system);

// Branch options
const branchOptions = computed(() =>
  branches.value.map(branch => ({
    value: branch.id,
    label: branch.name
  }))
);

// Form data (CodeIgniter Style - 5 fields)
const form = reactive({
  branch_id: '',
  name: '',
  grade_point: 4.0,
  min_percentage: 0,
  max_percentage: 100,
  // Hidden fields for backend compatibility
  description: '',
  grade_type: 'letter',
  passing_percentage: 35,
  max_grade_points: 4.0,
  is_default: false,
  is_active: true,
  created_by: '',
  updated_by: ''
});

// Initialize form
onMounted(async () => {
  await fetchBranches();

  if (props.system) {
    form.branch_id = props.system.branch_id || '';
    form.name = props.system.name || '';
    form.grade_point = props.system.grade_point || 4.0;
    form.min_percentage = props.system.min_percentage || 0;
    form.max_percentage = props.system.max_percentage || 100;
    form.description = props.system.description || '';
    form.grade_type = props.system.grade_type || 'letter';
    form.passing_percentage = props.system.passing_percentage || 35;
    form.max_grade_points = props.system.max_grade_points || 4.0;
    form.is_default = props.system.is_default || false;
    form.is_active = props.system.is_active !== false;
    form.created_by = props.system.created_by || '';
    form.updated_by = props.system.updated_by || '';
  } else {
    // Set defaults for new grading system
    form.branch_id = '';
    form.name = '';
    form.grade_point = 4.0;
    form.min_percentage = 0;
    form.max_percentage = 100;
    form.description = '';
    form.grade_type = 'letter';
    form.passing_percentage = 35;
    form.max_grade_points = 4.0;
    form.is_default = false;
    form.is_active = true;
    form.created_by = '';
    form.updated_by = '';
  }
});

// Methods
const validateForm = () => {
  if (!form.branch_id) {
    alert('Branch is required');
    return false;
  }

  if (!form.name.trim()) {
    alert('Name is required');
    return false;
  }

  if (form.grade_point < 0 || form.grade_point > 10) {
    alert('Grade point must be between 0 and 10');
    return false;
  }

  if (form.min_percentage < 0 || form.min_percentage > 100) {
    alert('Min percentage must be between 0 and 100');
    return false;
  }

  if (form.max_percentage < 0 || form.max_percentage > 100) {
    alert('Max percentage must be between 0 and 100');
    return false;
  }

  if (form.min_percentage > form.max_percentage) {
    alert('Min percentage cannot be greater than max percentage');
    return false;
  }

  return true;
};

const handleSubmit = () => {
  if (!validateForm()) {
    return;
  }

  emit('submit', { ...form });
};
</script>
