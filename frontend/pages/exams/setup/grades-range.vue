<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Grades Range</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage grade ranges and grade points following standards
          </p>
        </div>
        <div class="mt-4 sm:mt-0">
          <button
            @click="openCreateModal"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus class="h-4 w-4 mr-2" />
            Add Grade Range
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading grades...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="grades.length === 0" class="p-8 text-center">
        <Award class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          No grade ranges found
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Get started by creating your first grade range
        </p>
      </div>

      <!-- Grades Table -->
      <div v-else class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  #
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Branch Name
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Grade Name
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Grade Point
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Min Percentage
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Max Percentage
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="(grade, index) in grades"
                :key="grade.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ index + 1 }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ grade.branch?.name || 'N/A' }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ grade.name }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    {{ grade.grade_point }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ grade.min_percentage }}%
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ grade.max_percentage }}%
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end space-x-2">
                    <button
                      @click="editGrade(grade)"
                      class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      title="Edit Grade"
                    >
                      <Edit class="h-4 w-4" />
                    </button>
                    <button
                      @click="deleteGrade(grade)"
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      title="Delete Grade"
                    >
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <Modal :show="showModal" @close="closeModal" size="lg">
        <template #header>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            {{ editingGrade ? 'Edit Grade Range' : 'Create New Grade Range' }}
          </h3>
        </template>

        <template #body>
          <form @submit.prevent="saveGrade" class="space-y-6">
            <!-- Only essential fields -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Name -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  placeholder="e.g., A+, A, B+, B"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <!-- Grade Point () -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Grade Point <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.grade_point"
                  type="number"
                  step="0.1"
                  min="0"
                  max="4"
                  required
                  placeholder="4.0"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <!-- Min Percentage () -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Percentage <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.min_percentage"
                  type="number"
                  min="0"
                  max="100"
                  required
                  placeholder="91"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <!-- Max Percentage () -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Percentage <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.max_percentage"
                  type="number"
                  min="0"
                  max="100"
                  required
                  placeholder="100"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <!-- Form Actions -->
            <div
              class="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700"
            >
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 border border-transparent text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{
                  saving ? 'Saving...' : editingGrade ? 'Update Grade Range' : 'Create Grade Range'
                }}
              </button>
            </div>
          </form>
        </template>
      </Modal>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { Plus, Award, Edit, Trash2 } from 'lucide-vue-next';
import Modal from '~/components/ui/Modal.vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { useToast } from '~/composables/useToast';
import { useAuth } from '~/composables/useAuth';
import { useBranches } from '~/composables/useBranches';
import { useGlobalBranch } from '~/composables/useGlobalBranch';

// Composables
const { showToast } = useToast();
const { user } = useAuth();
const { selectedBranchId } = useGlobalBranch();
const { branches, fetchBranches, loading: branchesLoading } = useBranches();

// Reactive data
const loading = ref(false);
const grades = ref([]);
const showModal = ref(false);
const saving = ref(false);
const editingGrade = ref(null);

// Form data
const form = reactive({
  branch_id: selectedBranchId.value || '',
  name: '',
  grade_point: '',
  min_percentage: '',
  max_percentage: ''
});

watch(selectedBranchId, (newBranchId) => {
  form.branch_id = newBranchId || '';
  loadGrades();
});

// Computed properties
const branchOptions = computed(() =>
  branches.value.map(branch => ({
    value: branch.id,
    label: branch.name
  }))
);

// Methods
const loadGrades = async () => {
  try {
    loading.value = true;
    // TODO: Replace with actual API call
    // const response = await gradeRangeApi.getAll({
    //   school_id: user.value.school_id,
    //   branch_id: user.value.branch_id
    // });
    // grades.value = response.data || [];

    // Mock data for now
    grades.value = [
      {
        id: '1',
        name: 'A+',
        grade_point: 4.0,
        min_percentage: 91,
        max_percentage: 100,
        branch: { name: 'Main Branch' }
      },
      {
        id: '2',
        name: 'A',
        grade_point: 3.7,
        min_percentage: 81,
        max_percentage: 90,
        branch: { name: 'Main Branch' }
      }
    ];
  } catch (error) {
    showToast('Failed to load grades', 'error');
  } finally {
    loading.value = false;
  }
};

const openCreateModal = async () => {
  editingGrade.value = null;
  resetForm();
  await fetchBranches();
  showModal.value = true;
};

const editGrade = async grade => {
  editingGrade.value = grade;
  form.branch_id = grade.branch_id || '';
  form.name = grade.name || '';
  form.grade_point = grade.grade_point || '';
  form.min_percentage = grade.min_percentage || '';
  form.max_percentage = grade.max_percentage || '';

  await fetchBranches();
  showModal.value = true;
};

const saveGrade = async () => {
  form.branch_id = form.branch_id || selectedBranchId.value || authStore.currentBranch?.id || branches.value?.[0]?.id || user.value?.branch_id;
  if (
    !form.branch_id ||
    !form.name ||
    !form.grade_point ||
    !form.min_percentage ||
    !form.max_percentage
  ) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  try {
    saving.value = true;

    // Prepare form data for backend
    const gradeData = {
      branch_id: form.branch_id,
      name: form.name.trim(),
      grade_point: parseFloat(form.grade_point),
      min_percentage: parseInt(form.min_percentage),
      max_percentage: parseInt(form.max_percentage),
      description: form.description || '',
      school_id: user.value.school_id,
      // Default values for backend
      is_active: form.is_active !== false,
      created_by: form.created_by || user.value.id,
      updated_by: form.updated_by || user.value.id
    };

    if (editingGrade.value) {
      // TODO: Replace with actual API call
      // await gradeRangeApi.update(editingGrade.value.id, gradeData);
      showToast('Grade range updated successfully', 'success');
    } else {
      // TODO: Replace with actual API call
      // await gradeRangeApi.create(gradeData);
      showToast('Grade range created successfully', 'success');
    }

    closeModal();
    await loadGrades();
  } catch (error) {
    showToast('Failed to save grade range', 'error');
  } finally {
    saving.value = false;
  }
};

const deleteGrade = async grade => {
  if (!confirm(`Are you sure you want to delete "${grade.name}"?`)) {
    return;
  }

  try {
    // TODO: Replace with actual API call
    // await gradeRangeApi.delete(grade.id);
    showToast('Grade range deleted successfully', 'success');
    await loadGrades();
  } catch (error) {
    showToast('Failed to delete grade range', 'error');
  }
};

const closeModal = () => {
  showModal.value = false;
  editingGrade.value = null;
  resetForm();
};

const resetForm = () => {
  form.branch_id = '';
  form.name = '';
  form.grade_point = '';
  form.min_percentage = '';
  form.max_percentage = '';
  form.description = '';
  form.is_active = true;
  form.created_by = '';
  form.updated_by = '';
};

// Load initial data
onMounted(() => {
  loadGrades();
});
</script>
