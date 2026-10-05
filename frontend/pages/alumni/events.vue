<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800 dark:text-white">Alumni Events</h2>
      <button @click="openCreateModal" class="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
        <Plus class="w-5 h-5 mr-2" />
        Create Event
      </button>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div class="p-4 border-b dark:border-gray-700 flex justify-between items-center">
        <div class="relative w-64">
          <input
            v-model="search"
            type="text"
            placeholder="Search events..."
            class="w-full pl-3 pr-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            @input="onSearch"
          />
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
              <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Venue</th>
              <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="event in eventsList" :key="event.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ event.title }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{{ new Date(event.event_date).toLocaleDateString() }}</td>
              <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">{{ event.venue }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="{
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': event.status === 'upcoming',
                    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': event.status === 'ongoing',
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200': event.status === 'completed',
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': event.status === 'cancelled'
                  }"
                  class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full uppercase"
                >
                  {{ event.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button @click="editEvent(event)" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3">Edit</button>
                <button @click="deleteEvent(event.id)" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Delete</button>
              </td>
            </tr>
            <tr v-if="!eventsList.length">
              <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No events found</td>
            </tr>
          </tbody>
        </table>
      </div>
      <Pagination
        v-if="pagination.total > 0"
        :pagination="pagination"
        item-label="events"
        @page-changed="goToPage"
        @page-size-changed="changeLimit"
      />
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[100]">
      <div class="relative top-20 mx-auto p-5 border w-[32rem] shadow-lg rounded-md bg-white dark:bg-gray-800">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {{ isEditing ? 'Edit Event' : 'Create Event' }}
        </h3>
        <form @submit.prevent="saveEvent">
          <div class="grid grid-cols-1 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
              <input v-model="form.title" type="text" required class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea v-model="form.description" rows="3" class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Date *</label>
              <input v-model="form.event_date" type="datetime-local" required class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Venue</label>
              <input v-model="form.venue" type="text" class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select v-model="form.status" class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end space-x-3 mt-6">
            <button type="button" @click="closeModal" class="px-4 py-2 border rounded-md text-gray-700 dark:text-gray-300">Cancel</button>
            <button type="submit" :disabled="isSubmitting" class="px-4 py-2 bg-indigo-600 text-white rounded-md">{{ isSubmitting ? 'Saving...' : 'Save' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { Plus } from 'lucide-vue-next';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useToast } from '~/composables/useToast';
import { AlumniEventsAPI } from '~/api/alumni';
import Pagination from '~/components/ui/Pagination.vue';
import { useAuth } from '~/composables/useAuth';

const { currentBranch, currentSchool, selectedBranchId } = useGlobalBranch();
const { showError, showSuccess } = useToast();
const { user } = useAuth();

const eventsList = ref([]);
const showModal = ref(false);
const isEditing = ref(false);
const isSubmitting = ref(false);
const editingId = ref(null);
const search = ref('');

let searchTimeout = null;
const onSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.page = 1;
    loadEvents();
  }, 300);
};

const pagination = reactive({ page: 1, limit: 10, total: 0 });

const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
};

const form = reactive({
  title: '',
  description: '',
  event_date: '',
  venue: '',
  status: 'upcoming'
});

import { extractList, apiErrorMessage } from '~/utils/list-response';

const loadEvents = async () => {
  if (!selectedBranchId.value) return;
  try {
    const res = await AlumniEventsAPI.getAll({
      page: pagination.page,
      limit: pagination.limit,
      branch_id: selectedBranchId.value,
      search: search.value
    });
    eventsList.value = extractList(res);
    if (res?.pagination) pagination.total = res.pagination.total;
    else pagination.total = eventsList.value.length;
  } catch (e: any) {
    showError(apiErrorMessage(e, 'Failed to fetch events'));
  }
};

const goToPage = (p) => { pagination.page = p; loadEvents(); };
const changeLimit = (l) => { pagination.limit = l; pagination.page = 1; loadEvents(); };

const openCreateModal = () => {
  Object.assign(form, {
    title: '',
    description: '',
    event_date: '',
    venue: '',
    status: 'upcoming'
  });
  isEditing.value = false;
  editingId.value = null;
  showModal.value = true;
};

const editEvent = (e: any) => {
  Object.assign(form, {
    title: e.title || '',
    description: e.description || '',
    event_date: formatDateForInput(e.event_date),
    venue: e.venue || '',
    status: e.status || 'upcoming'
  });
  isEditing.value = true;
  editingId.value = e.id;
  showModal.value = true;
};

const closeModal = () => { showModal.value = false; };

const saveEvent = async () => {
  if (!selectedBranchId.value) {
    showError('No branch selected');
    return;
  }
  if (!form.title?.trim()) {
    showError('Event title is required');
    return;
  }
  if (!form.event_date) {
    showError('Event date is required');
    return;
  }
  isSubmitting.value = true;
  try {
    const payload = { ...form, branch_id: selectedBranchId.value };
    if (!isEditing.value) {
      payload.school_id = currentSchool.value?.id || user.value?.school_id;
      await AlumniEventsAPI.create(payload);
    } else {
      await AlumniEventsAPI.update(editingId.value, payload);
    }
    closeModal();
    loadEvents();
    showSuccess(`Event ${isEditing.value ? 'updated' : 'created'}`);
  } catch (e: any) {
    showError(apiErrorMessage(e, 'Error saving event'));
  } finally {
    isSubmitting.value = false;
  }
};

const deleteEvent = async (id: string) => {
  if (!confirm('Are you sure you want to delete this event?')) return;
  try {
    await AlumniEventsAPI.delete(id);
    loadEvents();
    showSuccess('Event deleted');
  } catch (e: any) {
    showError(apiErrorMessage(e, 'Error deleting event'));
  }
};

onMounted(loadEvents);
watch(selectedBranchId, () => { pagination.page = 1; loadEvents(); });
</script>
