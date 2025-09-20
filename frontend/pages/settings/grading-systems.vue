<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-start">
      <div class="space-y-2">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Grading Systems</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Manage grading systems and grade scales for your school
        </p>
      </div>
      <button
        @click="openCreateModal"
        class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          ></path>
        </svg>
        Create Grading System
      </button>
    </div>

    <!-- Filters -->
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >Search</label
          >
          <input
            v-model="filters.search"
            type="text"
            placeholder="Search by name or code..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            @input="loadGradingSystems"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >Status</label
          >
          <select
            v-model="filters.is_active"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            @change="loadGradingSystems"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <div class="flex items-end">
          <button
            @click="resetFilters"
            class="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Grading Systems List -->
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
    >
      <div class="p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Grading Systems</h3>

        <div v-if="loading" class="text-center py-8">
          <div
            class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500"
          >
            <svg
              class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading...
          </div>
        </div>

        <div
          v-else-if="gradingSystems.length === 0"
          class="text-center py-8 text-gray-500 dark:text-gray-400"
        >
          No grading systems found
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="system in gradingSystems"
            :key="system.id"
            class="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <h4 class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ system.name }}
                  </h4>
                  <span class="text-sm text-gray-500 dark:text-gray-400">({{ system.code }})</span>
                  <span
                    v-if="system.is_default"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  >
                    Default
                  </span>
                  <span
                    :class="
                      system.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    "
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  >
                    {{ system.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                <p v-if="system.description" class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {{ system.description }}
                </p>
                <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>Type: {{ system.grade_type }}</span>
                  <span>Passing: {{ system.passing_percentage }}%</span>
                  <span>Scales: {{ system.gradeScales?.length || 0 }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  @click="viewGradingSystem(system)"
                  class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-2"
                  title="View Details"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    ></path>
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    ></path>
                  </svg>
                </button>
                <button
                  @click="editGradingSystem(system)"
                  class="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 p-2"
                  title="Edit"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    ></path>
                  </svg>
                </button>
                <button
                  v-if="!system.is_default"
                  @click="setAsDefault(system)"
                  class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-2"
                  title="Set as Default"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </button>
                <button
                  v-if="!system.is_default"
                  @click="deleteGradingSystem(system)"
                  class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-2"
                  title="Delete"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    ></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Modal
      :is-open="isModalOpen"
      :title="isEditing ? 'Edit Grading System' : 'Create Grading System'"
      @close="closeModal"
      size="lg"
    >
      <form @submit.prevent="saveGradingSystem" class="space-y-6">
        <!-- Basic Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >Name *</label
            >
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >Code *</label
            >
            <input
              v-model="form.code"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >Description</label
          >
          <textarea
            v-model="form.description"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          ></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >Grade Type</label
            >
            <select
              v-model="form.grade_type"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="letter">Letter</option>
              <option value="number">Number</option>
              <option value="percentage">Percentage</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >Passing Percentage</label
            >
            <input
              v-model.number="form.passing_percentage"
              type="number"
              min="0"
              max="100"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >Max Grade Points</label
            >
            <input
              v-model.number="form.max_grade_points"
              type="number"
              min="0"
              max="10"
              step="0.1"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <!-- Grade Scales -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-lg font-medium text-gray-900 dark:text-white">Grade Scales</h4>
            <button
              type="button"
              @click="addGradeScale"
              class="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors text-sm"
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
                  class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
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
                  class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
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
                  class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
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
                  class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Passing</label
                >
                <input
                  v-model="scale.is_passing"
                  type="checkbox"
                  class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <button
                  type="button"
                  @click="removeGradeScale(index)"
                  class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    ></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            @click="closeModal"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="saving"
            class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {{ saving ? 'Saving...' : isEditing ? 'Update' : 'Create' }}
          </button>
        </div>
      </form>
    </Modal>

    <!-- View Modal -->
    <Modal
      :is-open="isViewModalOpen"
      title="Grading System Details"
      @close="closeViewModal"
      size="lg"
    >
      <div v-if="selectedGradingSystem" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Name</label
            >
            <p class="text-gray-900 dark:text-white">{{ selectedGradingSystem.name }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Code</label
            >
            <p class="text-gray-900 dark:text-white">{{ selectedGradingSystem.code }}</p>
          </div>
        </div>

        <div v-if="selectedGradingSystem.description">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >Description</label
          >
          <p class="text-gray-900 dark:text-white">{{ selectedGradingSystem.description }}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Grade Type</label
            >
            <p class="text-gray-900 dark:text-white">{{ selectedGradingSystem.grade_type }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Passing Percentage</label
            >
            <p class="text-gray-900 dark:text-white">
              {{ selectedGradingSystem.passing_percentage }}%
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Max Grade Points</label
            >
            <p class="text-gray-900 dark:text-white">
              {{ selectedGradingSystem.max_grade_points || 'N/A' }}
            </p>
          </div>
        </div>

        <div>
          <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-3">Grade Scales</h4>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Grade
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Min %
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Max %
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Points
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Passing
                  </th>
                </tr>
              </thead>
              <tbody
                class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
              >
                <tr v-for="scale in selectedGradingSystem.gradeScales" :key="scale.id">
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
                  >
                    {{ scale.grade }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {{ scale.min_percentage }}%
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {{ scale.max_percentage }}%
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {{ scale.grade_points || 'N/A' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      :class="
                        scale.is_passing
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      "
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    >
                      {{ scale.is_passing ? 'Yes' : 'No' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useToast } from '~/composables/useToast';
import { gradingSystemApi } from '~/api/academic/grading-systems';
import Modal from '~/components/ui/Modal.vue';

// Composables
const { showToast } = useToast();

// Reactive data
const loading = ref(false);
const saving = ref(false);
const gradingSystems = ref([]);
const isModalOpen = ref(false);
const isViewModalOpen = ref(false);
const isEditing = ref(false);
const selectedGradingSystem = ref(null);

// Filters
const filters = reactive({
  search: '',
  is_active: ''
});

// Form data
const form = reactive({
  id: '',
  name: '',
  code: '',
  description: '',
  grade_type: 'letter',
  passing_percentage: 35,
  max_grade_points: 4.0,
  is_active: true,
  is_default: false,
  gradeScales: []
});

// Methods
const loadGradingSystems = async () => {
  try {
    loading.value = true;
    const response = await gradingSystemApi.getAll(filters);
    gradingSystems.value = response.gradingSystems;
  } catch (error) {
    console.error('Error loading grading systems:', error);
    showToast('Failed to load grading systems', 'error');
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  filters.search = '';
  filters.is_active = '';
  loadGradingSystems();
};

const openCreateModal = () => {
  isEditing.value = false;
  resetForm();
  isModalOpen.value = true;
};

const editGradingSystem = system => {
  isEditing.value = true;
  form.id = system.id;
  form.name = system.name;
  form.code = system.code;
  form.description = system.description || '';
  form.grade_type = system.grade_type;
  form.passing_percentage = system.passing_percentage;
  form.max_grade_points = system.max_grade_points || 4.0;
  form.is_active = system.is_active;
  form.is_default = system.is_default;
  form.gradeScales = system.gradeScales ? [...system.gradeScales] : [];
  isModalOpen.value = true;
};

const viewGradingSystem = system => {
  selectedGradingSystem.value = system;
  isViewModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  resetForm();
};

const closeViewModal = () => {
  isViewModalOpen.value = false;
  selectedGradingSystem.value = null;
};

const resetForm = () => {
  form.id = '';
  form.name = '';
  form.code = '';
  form.description = '';
  form.grade_type = 'letter';
  form.passing_percentage = 35;
  form.max_grade_points = 4.0;
  form.is_active = true;
  form.is_default = false;
  form.gradeScales = [];
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

const saveGradingSystem = async () => {
  try {
    saving.value = true;

    if (form.gradeScales.length === 0) {
      showToast('At least one grade scale is required', 'error');
      return;
    }

    if (isEditing.value) {
      await gradingSystemApi.update(form.id, form);
      showToast('Grading system updated successfully', 'success');
    } else {
      await gradingSystemApi.create(form);
      showToast('Grading system created successfully', 'success');
    }

    closeModal();
    loadGradingSystems();
  } catch (error) {
    console.error('Error saving grading system:', error);
    showToast('Failed to save grading system', 'error');
  } finally {
    saving.value = false;
  }
};

const setAsDefault = async system => {
  try {
    await gradingSystemApi.setDefault(system.id);
    showToast('Default grading system updated successfully', 'success');
    loadGradingSystems();
  } catch (error) {
    console.error('Error setting default grading system:', error);
    showToast('Failed to set default grading system', 'error');
  }
};

const deleteGradingSystem = async system => {
  if (!confirm(`Are you sure you want to delete the grading system "${system.name}"?`)) {
    return;
  }

  try {
    await gradingSystemApi.delete(system.id);
    showToast('Grading system deleted successfully', 'success');
    loadGradingSystems();
  } catch (error) {
    console.error('Error deleting grading system:', error);
    showToast('Failed to delete grading system', 'error');
  }
};

// Lifecycle
onMounted(() => {
  loadGradingSystems();
});
</script>
