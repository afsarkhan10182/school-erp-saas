<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Allocations</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage student transport allocations
          </p>
        </div>
        <div class="mt-4 sm:mt-0 sm:flex sm:space-x-3">
          <button
            @click="openCreateModal"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          >
            <Plus class="-ml-1 mr-2 h-5 w-5" />
            Add Allocation
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
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Route</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Vehicle</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pickup Point</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Month</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="alloc in allocations" :key="alloc.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {{ alloc.student?.first_name }} {{ alloc.student?.last_name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{{ alloc.route?.route_name }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{{ alloc.vehicle?.vehicle_number }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{{ alloc.pickup_point }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{{ alloc.month }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button @click="editAllocation(alloc)" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3">Edit</button>
                  <button @click="deleteAllocation(alloc.id)" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Delete</button>
                </td>
              </tr>
              <tr v-if="!allocations.length">
                <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No allocations found</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Pagination
          v-if="pagination.total > 0"
          :pagination="pagination"
          item-label="allocations"
          @page-changed="goToPage"
          @page-size-changed="changeLimit"
        />
      </div>

      <div v-if="showModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[100]">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ isEditing ? 'Edit Allocation' : 'Add Allocation' }}
          </h3>
          <form @submit.prevent="saveAllocation">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student</label>
              <select v-model="form.student_id" required class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">Select Student</option>
                <option v-for="student in students" :key="student.id" :value="student.id">
                  {{ student.first_name }} {{ student.last_name }} ({{ student.admission_number }})
                </option>
              </select>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Route</label>
              <select v-model="form.route_id" required class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">Select Route</option>
                <option v-for="route in routes" :key="route.id" :value="route.id">{{ route.route_name }}</option>
              </select>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle</label>
              <select v-model="form.vehicle_id" required class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">Select Vehicle</option>
                <option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">{{ vehicle.vehicle_number }}</option>
              </select>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pickup Point</label>
              <input v-model="form.pickup_point" type="text" class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Month</label>
              <input v-model="form.month" type="text" class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
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
import { TransportAllocations, TransportRoutes, TransportVehicles } from '~/api/transport';
import { Students } from '~/api/students';
import Pagination from '~/components/ui/Pagination.vue';
import { useAuth } from '~/composables/useAuth';

const { currentBranch, currentSchool, selectedBranchId } = useGlobalBranch();
const { showError, showSuccess } = useToast();
const { user } = useAuth();

const allocations = ref([]);
const routes = ref([]);
const vehicles = ref([]);
const students = ref([]);
const showModal = ref(false);
const isEditing = ref(false);
const isSubmitting = ref(false);
const editingId = ref(null);

const pagination = reactive({ page: 1, limit: 10, total: 0 });
const form = reactive({
  student_id: '',
  route_id: '',
  vehicle_id: '',
  pickup_point: '',
  month: ''
});

import { extractList, apiErrorMessage } from '~/utils/list-response';

const loadDropdowns = async () => {
  if (!selectedBranchId.value) return;
  try {
    const rRes = await TransportRoutes.getAll({ branch_id: selectedBranchId.value, limit: 100 });
    routes.value = extractList(rRes);
    const vRes = await TransportVehicles.getAll({ branch_id: selectedBranchId.value, limit: 100 });
    vehicles.value = extractList(vRes);
    const sRes = await Students.getAll({ branch_id: selectedBranchId.value, limit: 100 });
    students.value = extractList(sRes);
  } catch (e) {
    console.error('Failed to load dropdowns', e);
  }
};

const loadAllocations = async () => {
  if (!selectedBranchId.value) return;
  try {
    const res = await TransportAllocations.getAll({
      page: pagination.page,
      limit: pagination.limit,
      branch_id: selectedBranchId.value
    });
    allocations.value = extractList(res);
    if (res?.pagination) pagination.total = res.pagination.total;
    else pagination.total = allocations.value.length;
  } catch (e: any) {
    showError(apiErrorMessage(e, 'Failed to fetch allocations'));
  }
};

const goToPage = (p) => { pagination.page = p; loadAllocations(); };
const changeLimit = (l) => { pagination.limit = l; pagination.page = 1; loadAllocations(); };

const openCreateModal = () => {
  Object.assign(form, {
    student_id: '',
    route_id: '',
    vehicle_id: '',
    pickup_point: '',
    month: ''
  });
  isEditing.value = false;
  editingId.value = null;
  showModal.value = true;
};

const editAllocation = (a: any) => {
  Object.assign(form, {
    student_id: a.student_id || '',
    route_id: a.route_id || '',
    vehicle_id: a.vehicle_id || '',
    pickup_point: a.pickup_point || '',
    month: a.month || ''
  });
  isEditing.value = true;
  editingId.value = a.id;
  showModal.value = true;
};

const closeModal = () => { showModal.value = false; };

const saveAllocation = async () => {
  if (!selectedBranchId.value) {
    showError('No branch selected');
    return;
  }
  if (!form.student_id) {
    showError('Student is required');
    return;
  }
  if (!form.route_id) {
    showError('Route is required');
    return;
  }
  if (!form.vehicle_id) {
    showError('Vehicle is required');
    return;
  }
  isSubmitting.value = true;
  try {
    const payload = { ...form, branch_id: selectedBranchId.value };
    if (!isEditing.value) {
      payload.school_id = currentSchool.value?.id || user.value?.school_id;
      await TransportAllocations.create(payload);
    } else {
      await TransportAllocations.update(editingId.value, payload);
    }
    closeModal();
    loadAllocations();
    showSuccess(`Allocation ${isEditing.value ? 'updated' : 'created'}`);
  } catch (e: any) {
    showError(apiErrorMessage(e, 'Error saving allocation'));
  } finally {
    isSubmitting.value = false;
  }
};

const deleteAllocation = async (id: string) => {
  if (!confirm('Are you sure you want to delete this allocation?')) return;
  try {
    await TransportAllocations.delete(id);
    loadAllocations();
    showSuccess('Allocation deleted');
  } catch (e: any) {
    showError(apiErrorMessage(e, 'Error deleting allocation'));
  }
};

onMounted(() => {
  loadAllocations();
  loadDropdowns();
});

watch(selectedBranchId, () => {
  pagination.page = 1;
  loadAllocations();
  loadDropdowns();
});
</script>
