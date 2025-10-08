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
        class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
      >
        <form @submit.prevent="handleSubmit">
          <!-- Header -->
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                {{ isEditing ? 'Edit Exam Status' : 'Create Exam Status' }}
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
                  placeholder="Enter status name"
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
                  placeholder="Enter status code"
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
                  placeholder="Enter status description"
                ></textarea>
              </div>

              <!-- Color -->
              <div>
                <label
                  for="color"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Color
                </label>
                <div class="flex items-center space-x-2">
                  <input
                    id="color"
                    v-model="form.color"
                    type="color"
                    class="w-12 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <input
                    v-model="form.color"
                    type="text"
                    class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="#6B7280"
                  />
                </div>
              </div>

              <!-- Sort Order -->
              <div>
                <label
                  for="sort_order"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Sort Order
                </label>
                <input
                  id="sort_order"
                  v-model.number="form.sort_order"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
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
  status: {
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
const isEditing = computed(() => !!props.status);

// Form data
const form = reactive({
  name: '',
  code: '',
  description: '',
  color: '#6B7280',
  sort_order: 0,
  is_active: true
});

// Initialize form
onMounted(() => {
  if (props.status) {
    form.name = props.status.name || '';
    form.code = props.status.code || '';
    form.description = props.status.description || '';
    form.color = props.status.color || '#6B7280';
    form.sort_order = props.status.sort_order || 0;
    form.is_active = props.status.is_active !== false;
  }
});

// Methods
const handleSubmit = () => {
  emit('submit', { ...form });
};
</script>
