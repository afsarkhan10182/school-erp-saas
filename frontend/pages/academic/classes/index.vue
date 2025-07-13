<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Class Management</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">Manage academic classes and their configurations</p>
        </div>
        <div class="mt-4 sm:mt-0 sm:flex sm:space-x-3">
          <button
            @click="openCreateModal"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus class="-ml-1 mr-2 h-5 w-5" />
            Add Class
          </button>
        </div>
      </div>

      <!-- Classes List -->
      <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">Academic Classes</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Class Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Display Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sections</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Students</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="classItem in classes" :key="classItem.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {{ classItem.name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ classItem.display_name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ classItem.sections?.length || 0 }} sections
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ classItem.student_count || 0 }} students
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="{
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': classItem.is_active,
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': !classItem.is_active,
                    }"
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  >
                    {{ classItem.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    @click="editClass(classItem)"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    @click="toggleStatus(classItem)"
                    class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3"
                  >
                    {{ classItem.is_active ? 'Deactivate' : 'Activate' }}
                  </button>
                  <button
                    @click="deleteClass(classItem.id)"
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div v-if="showModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {{ isEditing ? 'Edit Class' : 'Create New Class' }}
            </h3>
            
            <form @submit.prevent="saveClass">
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Class Name *</label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., 1st, 2nd, 3rd"
                />
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Name *</label>
                <input
                  v-model="form.display_name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., First Standard, Second Standard"
                />
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  v-model="form.description"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter class description"
                ></textarea>
              </div>

              <div class="mb-6">
                <label class="flex items-center">
                  <input
                    v-model="form.is_active"
                    type="checkbox"
                    class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>
              </div>

              <div class="flex justify-end space-x-3">
                <button
                  type="button"
                  @click="closeModal"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="isSubmitting"
                  class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {{ isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Create') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { apiClient } from '~/utils/api';
import { Plus } from 'lucide-vue-next';

const classes = ref([]);
const isLoading = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const isSubmitting = ref(false);
const editingId = ref(null);

const form = reactive({
  name: '',
  display_name: '',
  description: '',
  is_active: true
});

const resetForm = () => {
  form.name = '';
  form.display_name = '';
  form.description = '';
  form.is_active = true;
};

const fetchClasses = async () => {
  isLoading.value = true;
  try {
    const response = await apiClient.classes.getAll();
    classes.value = response.data || [];
  } catch (error) {
    console.error('Error fetching classes:', error);
  } finally {
    isLoading.value = false;
  }
};

const openCreateModal = () => {
  resetForm();
  isEditing.value = false;
  showModal.value = true;
};

const editClass = (classItem) => {
  form.name = classItem.name;
  form.display_name = classItem.display_name;
  form.description = classItem.description || '';
  form.is_active = classItem.is_active;
  editingId.value = classItem.id;
  isEditing.value = true;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  resetForm();
  editingId.value = null;
};

const saveClass = async () => {
  isSubmitting.value = true;
  try {
    const payload = {
      name: form.name,
      display_name: form.display_name,
      description: form.description,
      is_active: form.is_active
    };

    if (isEditing.value) {
      await apiClient.classes.update(editingId.value, payload);
    } else {
      await apiClient.classes.create(payload);
    }

    closeModal();
    await fetchClasses();
    
    // Show success message
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('show-toast', {
        detail: {
          message: `Class ${isEditing.value ? 'updated' : 'created'} successfully!`,
          type: 'success'
        }
      });
      window.dispatchEvent(event);
    }
  } catch (error) {
    console.error('Error saving class:', error);
    // Show error message
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('show-toast', {
        detail: {
          message: 'Error saving class. Please try again.',
          type: 'error'
        }
      });
      window.dispatchEvent(event);
    }
  } finally {
    isSubmitting.value = false;
  }
};

const toggleStatus = async (classItem) => {
  try {
    await apiClient.classes.update(classItem.id, {
      ...classItem,
      is_active: !classItem.is_active
    });
    await fetchClasses();
    
    // Show success message
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('show-toast', {
        detail: {
          message: `Class ${classItem.is_active ? 'deactivated' : 'activated'} successfully!`,
          type: 'success'
        }
      });
      window.dispatchEvent(event);
    }
  } catch (error) {
    console.error('Error toggling class status:', error);
  }
};

const deleteClass = async (id) => {
  if (!confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
    return;
  }
  
  try {
    await apiClient.classes.delete(id);
    await fetchClasses();
    
    // Show success message
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('show-toast', {
        detail: {
          message: 'Class deleted successfully!',
          type: 'success'
        }
      });
      window.dispatchEvent(event);
    }
  } catch (error) {
    console.error('Error deleting class:', error);
    // Show error message
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('show-toast', {
        detail: {
          message: 'Error deleting class. Please try again.',
          type: 'error'
        }
      });
      window.dispatchEvent(event);
    }
  }
};

onMounted(() => {
  fetchClasses();
});
</script> 