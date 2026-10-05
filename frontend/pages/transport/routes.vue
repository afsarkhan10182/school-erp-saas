<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Routes</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage transport routes for the school branch
          </p>
        </div>
        <div class="mt-4 sm:mt-0 sm:flex sm:space-x-3">
          <button
            @click="openCreateModal"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          >
            <Plus class="-ml-1 mr-2 h-5 w-5" />
            Add Route
          </button>
        </div>
      </div>

      <!-- Context Info -->
      <div
        v-if="currentBranch || currentSchool"
        class="mb-6 bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-700 rounded-lg p-3 flex items-center justify-between"
      >
        <div class="flex items-center space-x-2">
          <span class="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            {{ (currentBranch?.name || currentSchool?.name || 'B').charAt(0).toUpperCase() }}
          </span>
          <div>
            <span class="text-xs font-semibold text-gray-900 dark:text-white">
              {{ currentBranch?.name || 'Active Branch' }}
            </span>
            <span v-if="currentSchool" class="text-xs text-gray-500 ml-1">
              ({{ currentSchool.name }})
            </span>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Route Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Start Point</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">End Point</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fare</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="route in routes" :key="route.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ route.route_name }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{{ route.start_point }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{{ route.end_point }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{{ route.fare }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="route.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'"
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  >
                    {{ route.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button @click="editRoute(route)" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3">Edit</button>
                  <button @click="deleteRoute(route.id)" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Delete</button>
                </td>
              </tr>
              <tr v-if="!routes.length">
                <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No routes found</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Pagination
          v-if="pagination.total > 0"
          :pagination="pagination"
          item-label="routes"
          @page-changed="goToPage"
          @page-size-changed="changeLimit"
        />
      </div>

      <div v-if="showModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[100]">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ isEditing ? 'Edit Route' : 'Add Route' }}
          </h3>
          <form @submit.prevent="saveRoute">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Route Name *</label>
              <input v-model="form.route_name" type="text" required class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Point</label>
              <input v-model="form.start_point" type="text" class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Point</label>
              <input v-model="form.end_point" type="text" class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fare</label>
              <input v-model="form.fare" type="number" step="0.01" class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div class="mb-4">
              <label class="flex items-center">
                <input v-model="form.is_active" type="checkbox" class="rounded border-gray-300 text-indigo-600" />
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
              </label>
            </div>
            <div class="flex justify-end space-x-3 mt-6">
              <button type="button" @click="closeModal" class="px-4 py-2 border rounded-md text-gray-700 dark:text-gray-300">Cancel</button>
              <button type="submit" :disabled="isSubmitting" class="px-4 py-2 bg-indigo-600 text-white rounded-md">{{ isSubmitting ? 'Saving...' : 'Save' }}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { Plus } from 'lucide-vue-next';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useToast } from '~/composables/useToast';
import { TransportRoutes } from '~/api/transport';
import Pagination from '~/components/ui/Pagination.vue';
import { useAuth } from '~/composables/useAuth';

const { currentBranch, currentSchool, selectedBranchId } = useGlobalBranch();
const { showError, showSuccess } = useToast();
const { user } = useAuth();

const routes = ref([]);
const showModal = ref(false);
const isEditing = ref(false);
const isSubmitting = ref(false);
const editingId = ref(null);

const pagination = reactive({ page: 1, limit: 10, total: 0 });
const form = reactive({
  route_name: '',
  start_point: '',
  end_point: '',
  fare: 0,
  is_active: true
});

import { extractList, apiErrorMessage } from '~/utils/list-response';

const loadRoutes = async () => {
  if (!selectedBranchId.value) return;
  try {
    const res = await TransportRoutes.getAll({
      page: pagination.page,
      limit: pagination.limit,
      branch_id: selectedBranchId.value
    });
    routes.value = extractList(res);
    if (res?.pagination) pagination.total = res.pagination.total;
    else pagination.total = routes.value.length;
  } catch (e: any) {
    showError(apiErrorMessage(e, 'Failed to fetch routes'));
  }
};

const goToPage = (p) => { pagination.page = p; loadRoutes(); };
const changeLimit = (l) => { pagination.limit = l; pagination.page = 1; loadRoutes(); };

const openCreateModal = () => {
  Object.assign(form, {
    route_name: '',
    start_point: '',
    end_point: '',
    fare: 0,
    is_active: true
  });
  isEditing.value = false;
  editingId.value = null;
  showModal.value = true;
};

const editRoute = (r: any) => {
  Object.assign(form, {
    route_name: r.route_name || '',
    start_point: r.start_point || '',
    end_point: r.end_point || '',
    fare: Number(r.fare) || 0,
    is_active: r.is_active !== undefined ? r.is_active : true
  });
  isEditing.value = true;
  editingId.value = r.id;
  showModal.value = true;
};

const closeModal = () => { showModal.value = false; };

const saveRoute = async () => {
  if (!selectedBranchId.value) {
    showError('No branch selected');
    return;
  }
  if (!form.route_name?.trim()) {
    showError('Route name is required');
    return;
  }
  isSubmitting.value = true;
  try {
    const payload = {
      ...form,
      fare: Number(form.fare) || 0,
      branch_id: selectedBranchId.value
    };
    if (!isEditing.value) {
      payload.school_id = currentSchool.value?.id || user.value?.school_id;
      await TransportRoutes.create(payload);
    } else {
      await TransportRoutes.update(editingId.value, payload);
    }
    closeModal();
    loadRoutes();
    showSuccess(`Route ${isEditing.value ? 'updated' : 'created'}`);
  } catch (e: any) {
    showError(apiErrorMessage(e, 'Error saving route'));
  } finally {
    isSubmitting.value = false;
  }
};

const deleteRoute = async (id: string) => {
  if (!confirm('Are you sure you want to delete this route?')) return;
  try {
    await TransportRoutes.delete(id);
    loadRoutes();
    showSuccess('Route deleted');
  } catch (e: any) {
    showError(apiErrorMessage(e, 'Error deleting route'));
  }
};

onMounted(loadRoutes);
watch(selectedBranchId, () => { pagination.page = 1; loadRoutes(); });
</script>
