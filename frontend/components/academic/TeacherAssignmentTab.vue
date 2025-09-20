<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Teacher Assignment</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Assign teachers to subjects and classes
        </p>
      </div>
      <div class="flex items-center space-x-4">
        <!-- Academic Year Filter -->
        <select v-model="selectedAcademicYear" class="input-field" @change="loadAssignments">
          <option value="">Select Academic Year</option>
          <option v-for="year in academicYears" :key="year.value" :value="year.value">
            {{ year.label }}
          </option>
        </select>
        <button
          @click="showAssignModal = true"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus class="-ml-1 mr-2 h-5 w-5" />
          Assign Teacher
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <div class="flex items-center">
          <UserCheck class="h-8 w-8 text-blue-600" />
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Assignments</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">
              {{ assignments.length }}
            </p>
          </div>
        </div>
      </div>
      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <div class="flex items-center">
          <Users class="h-8 w-8 text-green-600" />
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Teachers Assigned</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ uniqueTeachers }}</p>
          </div>
        </div>
      </div>
      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <div class="flex items-center">
          <Star class="h-8 w-8 text-yellow-600" />
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Primary Teachers</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">
              {{ primaryTeachers }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Assignments List -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading assignments...</p>
      </div>

      <div v-else-if="!selectedAcademicYear" class="p-8 text-center">
        <Calendar class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Select Academic Year</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Choose an academic year to view and manage teacher assignments.
        </p>
      </div>

      <div v-else-if="assignments.length === 0" class="p-8 text-center">
        <UserCheck class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No assignments found</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Get started by assigning teachers to subjects and classes.
        </p>
        <div class="mt-6">
          <button
            @click="showAssignModal = true"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus class="-ml-1 mr-2 h-5 w-5" />
            Assign Teacher
          </button>
        </div>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Teacher
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Subject
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Class
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Section
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Type
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Academic Year
              </th>
              <th
                class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="assignment in assignments"
              :key="assignment.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div
                      class="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center"
                    >
                      <span class="text-sm font-medium text-indigo-600 dark:text-indigo-300">
                        {{
                          getInitials(assignment.teacher?.first_name, assignment.teacher?.last_name)
                        }}
                      </span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ assignment.teacher?.first_name }} {{ assignment.teacher?.last_name }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ assignment.teacher?.email }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white">
                  {{ assignment.subject?.name }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ assignment.subject?.code }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ assignment.class?.name || 'All Classes' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ assignment.section?.name || 'All Sections' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    assignment.is_primary
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  ]"
                >
                  <Star v-if="assignment.is_primary" class="w-3 h-3 mr-1" />
                  {{ assignment.is_primary ? 'Primary' : 'Secondary' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ assignment.academic_year }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                  <button
                    @click="editAssignment(assignment)"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    <Edit class="h-4 w-4" />
                  </button>
                  <button
                    @click="removeAssignment(assignment)"
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
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

    <!-- Assign Teacher Modal -->
    <Modal :show="showAssignModal || showEditModal" @close="closeModal">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ isEditing ? 'Edit Assignment' : 'Assign Teacher' }}
        </h3>
      </template>

      <template #body>
        <TeacherAssignmentForm
          :assignment="editingAssignment"
          :classes="classes"
          :subjects="subjects"
          :teachers="teachers"
          :academic-years="academicYears"
          @submit="handleSubmit"
          @cancel="closeModal"
        />
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useToast } from '~/composables/useToast';
import { Plus, UserCheck, Users, Star, Calendar, Edit, Trash2 } from 'lucide-vue-next';
import Modal from '~/components/ui/Modal.vue';
import TeacherAssignmentForm from '~/components/forms/TeacherAssignmentForm.vue';

// Props
const props = defineProps({
  assignments: {
    type: Array,
    default: () => []
  },
  classes: {
    type: Array,
    default: () => []
  },
  subjects: {
    type: Array,
    default: () => []
  },
  teachers: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  academicYears: {
    type: Array,
    default: () => []
  }
});

// Emits
const emit = defineEmits(['refresh', 'assign', 'update', 'remove']);

// Composables
const { showToast } = useToast();

// Reactive data
const selectedAcademicYear = ref('');
const showAssignModal = ref(false);
const showEditModal = ref(false);
const isEditing = ref(false);
const editingAssignment = ref(null);

// Computed
const uniqueTeachers = computed(() => {
  const teacherIds = new Set(props.assignments.map(a => a.teacher_id));
  return teacherIds.size;
});

const primaryTeachers = computed(() => {
  return props.assignments.filter(a => a.is_primary).length;
});

// Methods
const getInitials = (firstName, lastName) => {
  const first = firstName?.charAt(0) || '';
  const last = lastName?.charAt(0) || '';
  return (first + last).toUpperCase();
};

const editAssignment = assignment => {
  isEditing.value = true;
  editingAssignment.value = assignment;
  showEditModal.value = true;
};

const removeAssignment = async assignment => {
  if (!confirm(`Are you sure you want to remove this assignment?`)) return;

  try {
    emit('remove', assignment.id);
  } catch (error) {
    showToast('Failed to remove assignment', 'error');
    console.error('Error removing assignment:', error);
  }
};

const handleSubmit = async assignmentData => {
  try {
    if (isEditing.value) {
      emit('update', editingAssignment.value.id, assignmentData);
    } else {
      emit('assign', assignmentData);
    }
    closeModal();
  } catch (error) {
    showToast('Failed to save assignment', 'error');
    console.error('Error saving assignment:', error);
  }
};

const closeModal = () => {
  showAssignModal.value = false;
  showEditModal.value = false;
  isEditing.value = false;
  editingAssignment.value = null;
};

const loadAssignments = () => {
  if (props.selectedAcademicYear) {
    emit('refresh');
  }
};

// Watchers
watch(
  () => props.selectedAcademicYear,
  () => {
    if (props.selectedAcademicYear) {
      loadAssignments();
    }
  }
);
</script>

<style scoped>
.input-field {
  @apply block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white sm:text-sm;
}
</style>
