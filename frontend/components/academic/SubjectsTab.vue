<template>
  <div class="space-y-6">
    <!-- Header with Add Button -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Subjects</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Manage academic subjects for your branch
        </p>
      </div>
      <button
        @click="showCreateModal = true"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <Plus class="-ml-1 mr-2 h-5 w-5" />
        Add Subject
      </button>
    </div>

    <!-- Subjects List -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading subjects...</p>
      </div>

      <div v-else-if="subjects.length === 0" class="p-8 text-center">
        <BookOpen class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No subjects found</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Get started by creating your first subject.
        </p>
        <div class="mt-6">
          <button
            @click="showCreateModal = true"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus class="-ml-1 mr-2 h-5 w-5" />
            Add Subject
          </button>
        </div>
      </div>

      <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
        <div
          v-for="subject in subjects"
          :key="subject.id"
          class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-3">
                <div>
                  <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ subject.name }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ subject.code }}</p>
                </div>
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getCategoryBadgeClass(subject.category)
                  ]"
                >
                  {{ subject.category.replace('_', ' ').toUpperCase() }}
                </span>
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    subject.is_active
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  ]"
                >
                  {{ subject.is_active ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button
                @click="editSubject(subject)"
                class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
              >
                Edit
              </button>
              <button
                @click="deleteSubject(subject)"
                class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Modal :show="showCreateModal || showEditModal" @close="closeModal">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ isEditing ? 'Edit Subject' : 'Create New Subject' }}
        </h3>
      </template>

      <template #body>
        <SubjectForm
          :subject="editingSubject"
          :selected-branch="selectedBranch"
          @submit="handleSubmit"
          @cancel="closeModal"
        />
      </template>
    </Modal>
    <ConfirmDialog
      :open="deleteDialog.open"
      title="Delete subject"
      message="Are you sure you want to delete this subject?"
      confirm-label="Delete"
      @confirm="confirmDeleteSubject"
      @cancel="deleteDialog.open = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useToast } from '~/composables/useToast';
import { Plus, BookOpen } from 'lucide-vue-next';
import Modal from '~/components/ui/Modal.vue';
import SubjectForm from '~/components/forms/SubjectForm.vue';
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue';

// Props
const props = defineProps({
  subjects: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  classOptions: {
    type: Array,
    default: () => []
  },
  selectedBranch: {
    type: Object,
    default: null
  }
});

// Emits
const emit = defineEmits(['refresh', 'create', 'update', 'delete']);

// Composables
const { showToast } = useToast();

// Reactive data
const showCreateModal = ref(false);
const showEditModal = ref(false);
const isEditing = ref(false);
const editingSubject = ref(null);
const deleteDialog = reactive({ open: false, id: '' });

// Methods
const getCategoryBadgeClass = category => {
  const classes = {
    core: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    elective: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    extra_curricular: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    language: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    science: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    arts: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    commerce: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
  };
  return classes[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
};

const editSubject = subject => {
  isEditing.value = true;
  editingSubject.value = subject;
  showEditModal.value = true;
};

const deleteSubject = async subject => {
  deleteDialog.id = subject.id;
  deleteDialog.open = true;
};

const confirmDeleteSubject = async () => {
  try {
    emit('delete', deleteDialog.id);
  } catch (error) {
    showToast('Failed to delete subject', 'error');
  } finally {
    deleteDialog.open = false;
    deleteDialog.id = '';
  }
};

const handleSubmit = async subjectData => {
  try {
    if (isEditing.value) {
      emit('update', editingSubject.value.id, subjectData);
    } else {
      emit('create', subjectData);
    }
    closeModal();
  } catch (error) {
    showToast('Failed to save subject', 'error');
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  showEditModal.value = false;
  isEditing.value = false;
  editingSubject.value = null;
};
</script>
