<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          Class Subject Assignment
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Assign subjects to classes for the academic year
        </p>
      </div>
      <div class="flex items-center space-x-4">
        <!-- Current Academic Year Display -->
        <div class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar class="h-4 w-4" />
          <span>Academic Year: {{ currentAcademicYearName }}</span>
        </div>
        <button
          @click="handleBulkAssignClick"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus class="-ml-1 mr-2 h-5 w-5" />
          Bulk Assign
        </button>
      </div>
    </div>

    <!-- Assignment Matrix -->
    <div
      class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading assignments...</p>
      </div>

      <div
        v-else-if="!currentAcademicYearName || currentAcademicYearName === 'Not Set'"
        class="p-8 text-center"
      >
        <Calendar class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No Academic Year</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          No current academic year is set. Please contact administrator.
        </p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-700 z-10"
              >
                Class
              </th>
              <th
                v-for="subject in subjects"
                :key="subject.id"
                class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]"
              >
                <div class="flex flex-col items-center">
                  <span class="font-semibold">{{ subject.name }}</span>
                  <span class="text-xs text-gray-400">{{ subject.code }}</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="classItem in classes"
              :key="classItem.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td class="px-4 py-4 whitespace-nowrap sticky left-0 bg-white dark:bg-gray-800 z-10">
                <div class="flex items-center">
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ classItem.name }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ classItem.code }}
                    </div>
                  </div>
                </div>
              </td>
              <td
                v-for="subject in subjects"
                :key="`${classItem.id}-${subject.id}`"
                class="px-4 py-4 text-center"
              >
                <label class="flex items-center justify-center cursor-pointer">
                  <input
                    :checked="isAssigned(classItem.id, subject.id)"
                    @change="toggleAssignment(classItem.id, subject.id)"
                    type="checkbox"
                    class="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </label>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Bulk Assign Modal -->
    <Modal :show="showBulkAssignModal" @close="closeBulkModal">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Bulk Assign Subjects</h3>
      </template>

      <template #body>
        <BulkAssignForm
          :classes="formattedClasses"
          :subjects="formattedSubjects"
          :streams="formattedStreams"
          :sections="formattedSections"
          :academic-year="currentAcademicYearName"
          @submit="handleBulkAssign"
          @cancel="closeBulkModal"
        />
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useToast } from '~/composables/useToast';
import { Plus, Users, BookOpen, CheckCircle, Calendar } from 'lucide-vue-next';
import Modal from '~/components/ui/Modal.vue';
import BulkAssignForm from '~/components/forms/BulkAssignForm.vue';

// Props
const props = defineProps({
  classes: {
    type: Array,
    default: () => []
  },
  subjects: {
    type: Array,
    default: () => []
  },
  mappings: {
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
const emit = defineEmits(['refresh', 'assign', 'unassign']);

// Composables
const { showToast } = useToast();

// Reactive data
const showBulkAssignModal = ref(false);
const assignments = ref(new Map()); // Map of "classId-subjectId" -> true/false

// Computed
const totalAssignments = computed(() => {
  return Array.from(assignments.value.values()).filter(Boolean).length;
});

const formattedClasses = computed(() => {
  console.log('formattedClasses: props.classes:', props.classes);
  const result = [];

  props.classes.forEach(cls => {
    // Add the main class with metadata
    result.push({
      value: cls.id,
      label: `${cls.name} (${cls.code})`,
      type: 'class',
      has_stream: cls.has_stream || false,
      has_section: cls.has_section || false
    });
  });

  console.log('formattedClasses: Final result:', result);
  return result;
});

const formattedSubjects = computed(() => {
  return props.subjects.map(subject => ({
    value: subject.id,
    label: subject.name,
    code: subject.code
  }));
});

const formattedStreams = computed(() => {
  const result = [];
  props.classes.forEach(cls => {
    if (cls.streams && cls.streams.length > 0) {
      cls.streams.forEach(stream => {
        result.push({
          value: stream.id,
          label: stream.name,
          code: stream.code,
          class_id: cls.id
        });
      });
    }
  });
  return result;
});

const formattedSections = computed(() => {
  const result = [];
  props.classes.forEach(cls => {
    if (cls.sections && cls.sections.length > 0) {
      cls.sections.forEach(section => {
        result.push({
          value: section.id,
          label: section.name,
          class_id: cls.id,
          stream_id: section.stream_id || null
        });
      });
    }
  });
  return result;
});

const currentAcademicYearName = computed(() => {
  const currentYear = props.academicYears.find(year => year.is_current);
  return currentYear ? currentYear.name : 'Not Set';
});

// Methods
const isAssigned = (classId, subjectId) => {
  const key = `${classId}-${subjectId}`;
  return assignments.value.get(key) || false;
};

const toggleAssignment = async (classId, subjectId) => {
  const key = `${classId}-${subjectId}`;
  const isCurrentlyAssigned = assignments.value.get(key) || false;

  try {
    if (isCurrentlyAssigned) {
      // Find and remove the mapping
      const mapping = props.mappings.find(m => {
        // Handle different API response structures
        if (m.subjects && Array.isArray(m.subjects)) {
          return m.class_id === classId && m.subjects.some(s => s.id === subjectId);
        } else if (m.subject) {
          return m.class_id === classId && m.subject.id === subjectId;
        } else if (m.subject_id) {
          return m.class_id === classId && m.subject_id === subjectId;
        }
        return false;
      });

      if (mapping) {
        emit('unassign', mapping.id);
      }
    } else {
      // Create new assignment
      const currentYear = props.academicYears.find(year => year.is_current);
      const assignmentData = {
        class_id: classId,
        subject_ids: [subjectId],
        academic_year: currentYear ? currentYear.name : null
      };
      emit('assign', assignmentData);
    }

    // Update local state
    assignments.value.set(key, !isCurrentlyAssigned);
  } catch (error) {
    showToast('Failed to update assignment', 'error');
    console.error('Error toggling assignment:', error);
  }
};

const handleBulkAssign = async bulkData => {
  try {
    emit('assign', bulkData);
    closeBulkModal();
  } catch (error) {
    showToast('Failed to bulk assign subjects', 'error');
    console.error('Error in bulk assign:', error);
  }
};

const handleBulkAssignClick = () => {
  console.log('Bulk assign clicked. Academic years:', props.academicYears);

  // Check if academic years are loaded
  if (!props.academicYears || props.academicYears.length === 0) {
    showToast('Academic years not loaded yet. Please wait...', 'error');
    return;
  }

  const currentYear = props.academicYears.find(year => year.is_current);
  console.log('Current year found:', currentYear);

  if (!currentYear) {
    showToast('No current academic year is set. Please contact administrator.', 'error');
    return;
  }

  console.log('Opening bulk assign modal for academic year:', currentYear.label);
  showBulkAssignModal.value = true;
};

const closeBulkModal = () => {
  showBulkAssignModal.value = false;
};

const loadMappings = () => {
  emit('refresh');
};

// Initialize assignments from mappings
const initializeAssignments = () => {
  assignments.value.clear();

  // Create a Set to track unique class-subject combinations
  const uniqueAssignments = new Set();

  props.mappings.forEach((assignment, index) => {
    let subjectId;
    // Handle different API response structures
    if (assignment.subject) {
      subjectId = assignment.subject.id;
    } else if (assignment.subject_id) {
      subjectId = assignment.subject_id;
    }

    if (subjectId) {
      const key = `${assignment.class_id}-${subjectId}`;

      // Only add if we haven't seen this combination before
      if (!uniqueAssignments.has(key)) {
        assignments.value.set(key, true);
        uniqueAssignments.add(key);
      }
    }
  });
};

// Watchers
watch(() => props.mappings, initializeAssignments, { immediate: true });
</script>

<style scoped>
.input-field {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  outline: none;
  background-color: white;
  color: #111827;
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.input-field:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.dark .input-field {
  border-color: #4b5563;
  background-color: #1f2937;
  color: white;
}

.dark .input-field:focus {
  border-color: #3b82f6;
}
</style>
