<template>
  <div class="space-y-6">
    <!-- Header with Button -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          Class Teacher Assignment
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Assign class teachers to classes and sections
        </p>
      </div>

      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar class="h-4 w-4" />
          <span>Academic Year: {{ currentAcademicYear }}</span>
        </div>
        <button
          @click="showAssignModal = true"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus class="-ml-1 mr-2 h-5 w-5" />
          Assign Class Teacher
        </button>
      </div>
    </div>

    <!-- Allocations Table -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Class
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Stream
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Section
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Class Teacher
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="allocation in classTeachers" :key="allocation.id">
            <td
              class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
            >
              {{ allocation.class?.name }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
              {{ allocation.stream?.name || 'All Streams' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
              {{ allocation.section?.name || 'All Sections' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
              {{ allocation.teacher?.first_name }} {{ allocation.teacher?.last_name }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button
                @click="editAllocation(allocation)"
                class="text-indigo-600 hover:text-indigo-900 mr-3"
              >
                Edit
              </button>
              <button
                @click="deleteAllocation(allocation.id)"
                class="text-red-600 hover:text-red-900"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Assign Class Teacher Modal -->
    <Modal :show="showAssignModal || showEditModal" @close="closeModal">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ isEditing ? 'Edit Class Teacher' : 'Assign Class Teacher' }}
        </h3>
      </template>

      <template #body>
        <ClassTeacherForm
          ref="classTeacherForm"
          :allocation="editingAllocation"
          :classes="classes"
          :sections="sections"
          :streams="streams"
          :teachers="teachers"
          :academic-years="academicYears"
          :school-id="schoolId"
          :branch-id="branchId"
          @submit="handleSubmit"
          @cancel="closeModal"
        />
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useToast } from '~/composables/useToast';
import { Plus, UserCheck, Users, Calendar, Edit, Trash2 } from 'lucide-vue-next';
import Modal from '~/components/ui/Modal.vue';
import ClassTeacherForm from '~/components/forms/ClassTeacherForm.vue';

// Props
const props = defineProps({
  classTeachers: {
    type: Array,
    default: () => []
  },
  classes: {
    type: Array,
    default: () => []
  },
  sections: {
    type: Array,
    default: () => []
  },
  streams: {
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
  },
  schoolId: {
    type: String,
    default: ''
  },
  branchId: {
    type: String,
    default: ''
  }
});

// Emits
const emit = defineEmits(['refresh', 'assign', 'update', 'remove']);

// Composables
const { showToast } = useToast();

// Reactive data
const showAssignModal = ref(false);
const showEditModal = ref(false);
const isEditing = ref(false);
const editingAllocation = ref(null);
const classTeacherForm = ref(null);

// Computed
const classTeachers = computed(() => {
  return Array.isArray(props.classTeachers) ? props.classTeachers : [];
});

const uniqueTeachers = computed(() => {
  const teacherIds = new Set(classTeachers.value.map(a => a.teacher_id));
  return teacherIds.size;
});

const currentAcademicYear = computed(() => {
  const currentYear = props.academicYears.find(year => year.is_current);
  return currentYear ? currentYear.name : 'Not Set';
});

// Methods
const editAllocation = allocation => {
  editingAllocation.value = allocation;
  isEditing.value = true;
  showEditModal.value = true;
};

const deleteAllocation = async id => {
  if (confirm('Are you sure you want to remove this class teacher assignment?')) {
    emit('remove', id);
  }
};

const handleSubmit = async data => {
  try {
    if (isEditing.value) {
      await emit('update', data);
    } else {
      await emit('assign', data);
    }
    closeModal();
  } catch (error) {
    console.error('Error in handleSubmit:', error);

    // Handle backend validation errors
    if (error.response?.data?.errors && classTeacherForm.value) {
      classTeacherForm.value.setBackendErrors(error.response.data.errors);
    }

    // Don't close modal if there are validation errors
    // The error will be handled by the parent component's error handling
    return;
  }
};

const closeModal = () => {
  showAssignModal.value = false;
  showEditModal.value = false;
  isEditing.value = false;
  editingAllocation.value = null;
};
</script>
