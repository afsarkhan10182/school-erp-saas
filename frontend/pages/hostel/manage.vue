<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Hostels</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage hostels for the school branch
          </p>
        </div>
        <div class="mt-4 sm:mt-0 sm:flex sm:space-x-3">
          <button
            @click="openCreateModal"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          >
            <Plus class="-ml-1 mr-2 h-5 w-5" />
            Add Hostel
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
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Hostel Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Address</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Intake</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="hostel in hostels" :key="hostel.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ hostel.hostel_name }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{{ hostel.hostel_type }}</td>
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">{{ hostel.address }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{{ hostel.intake }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="hostel.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'"
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  >
                    {{ hostel.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button @click="editHostel(hostel)" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3">Edit</button>
                  <button @click="deleteHostel(hostel.id)" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Delete</button>
                </td>
              </tr>
              <tr v-if="!hostels.length">
                <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No hostels found</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Pagination
          v-if="pagination.total > 0"
          :pagination="pagination"
          item-label="hostels"
          @page-changed="goToPage"
          @page-size-changed="changeLimit"
        />
      </div>

      <div v-if="showModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[100]">
        <div class="relative top-20 mx-auto p-5 border w-[32rem] shadow-lg rounded-md bg-white dark:bg-gray-800">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ isEditing ? 'Edit Hostel' : 'Add Hostel' }}
          </h3>
          <form @submit.prevent="saveHostel">
            <div class="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hostel Name *</label>
                <input v-model="form.hostel_name" type="text" required class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hostel Type</label>
                <select v-model="form.hostel_type" class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="Boys">Boys</option>
                  <option value="Girls">Girls</option>
                  <option value="Co-ed">Co-ed</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <textarea v-model="form.address" rows="3" class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Intake Capacity</label>
                <input v-model="form.intake" type="number" class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label class="flex items-center">
                  <input v-model="form.is_active" type="checkbox" class="rounded border-gray-300 text-indigo-600" />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { Plus } from 'lucide-vue-next';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useToast } from '~/composables/useToast';
import { HostelsAPI } from '~/api/hostel';
import Pagination from '~/components/ui/Pagination.vue';
import { useAuth } from '~/composables/useAuth';

const { currentBranch, currentSchool, selectedBranchId } = useGlobalBranch();
const { showError, showSuccess } = useToast();
const { user } = useAuth();

const hostels = ref([]);
const showModal = ref(false);
const isEditing = ref(false);
const isSubmitting = ref(false);
const editingId = ref(null);

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
});
const form = reactive({
  hostel_name: '',
  hostel_type: 'Boys',
  address: '',
  intake: null,
  is_active: true
});

const loadHostels = async () => {
  if (!selectedBranchId.value) return;
  try {
    const res = await HostelsAPI.getAll({
      page: pagination.page,
      limit: pagination.limit,
      branch_id: selectedBranchId.value
    });
    hostels.value = extractList(res);
    if (res?.pagination) pagination.total = res.pagination.total;
    else pagination.total = hostels.value.length;
  } catch (e: any) {
    showError(apiErrorMessage(e, 'Failed to fetch hostels'));
  }
};

const goToPage = (p) => { pagination.page = p; loadHostels(); };
const changeLimit = (l) => { pagination.limit = l; pagination.page = 1; loadHostels(); };

const openCreateModal = () => {
  Object.assign(form, {
    hostel_name: '',
    hostel_type: 'Boys',
    address: '',
    intake: null,
    is_active: true
  });
  isEditing.value = false;
  editingId.value = null;
  showModal.value = true;
};

const editHostel = (h) => {
  Object.assign(form, {
    hostel_name: h.hostel_name,
    hostel_type: h.hostel_type || 'Boys',
    address: h.address || '',
    intake: h.intake || null,
    is_active: h.is_active
  });
  isEditing.value = true;
  editingId.value = h.id;
  showModal.value = true;
};

const closeModal = () => { showModal.value = false; };

const saveHostel = async () => {
  isSubmitting.value = true;
  try {
    const payload = {
      hostel_name: form.hostel_name,
      hostel_type: form.hostel_type,
      address: form.address || null,
      intake: form.intake !== '' && form.intake !== null && form.intake !== undefined ? Number(form.intake) : null,
      is_active: form.is_active
    };
    if (!isEditing.value) {
      payload.school_id = currentSchool.value?.id || user.value?.school_id;
      payload.branch_id = selectedBranchId.value || user.value?.branch_id;
      await HostelsAPI.create(payload);
    } else {
      await HostelsAPI.update(editingId.value, payload);
    }
    closeModal();
    loadHostels();
    showSuccess(`Hostel ${isEditing.value ? 'updated' : 'created'}`);
  } catch (e) {
    showError(e?.response?.data?.message || e?.message || 'Error saving hostel');
  } finally {
    isSubmitting.value = false;
  }
};

const deleteHostel = async (id) => {
  if (!confirm('Are you sure you want to delete this hostel?')) return;
  try {
    await HostelsAPI.delete(id);
    loadHostels();
    showSuccess('Hostel deleted');
  } catch (e) {
    showError('Error deleting hostel');
  }
};

onMounted(loadHostels);
watch(selectedBranchId, () => { pagination.page = 1; loadHostels(); });
</script>
