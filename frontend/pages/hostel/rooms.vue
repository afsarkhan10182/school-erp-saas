<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Hostel Rooms</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage room types and rooms
          </p>
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

      <!-- Tabs -->
      <div class="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav class="-mb-px flex space-x-8">
          <button
            @click="activeTab = 'rooms'"
            :class="[activeTab === 'rooms' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300', 'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm']"
          >
            Rooms
          </button>
          <button
            @click="activeTab = 'types'"
            :class="[activeTab === 'types' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300', 'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm']"
          >
            Room Types
          </button>
        </nav>
      </div>

      <!-- Rooms Tab -->
      <div v-if="activeTab === 'rooms'">
        <div class="flex justify-end mb-4">
          <button
            @click="openRoomModal"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          >
            <Plus class="-ml-1 mr-2 h-5 w-5" />
            Add Room
          </button>
        </div>
        <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Room Number</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Hostel</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Beds</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cost/Bed</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="room in rooms" :key="room.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ room.room_number }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{{ room.hostel?.hostel_name }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{{ room.roomType?.type_name }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{{ room.number_of_beds }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{{ room.cost_per_bed }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="room.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                      {{ room.is_active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button @click="editRoom(room)" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3">Edit</button>
                    <button @click="deleteRoom(room.id)" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Delete</button>
                  </td>
                </tr>
                <tr v-if="!rooms.length">
                  <td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No rooms found</td>
                </tr>
              </tbody>
            </table>
          </div>
          <Pagination
            v-if="roomPagination.total > 0"
            :pagination="roomPagination"
            item-label="rooms"
            @page-changed="(p) => { roomPagination.page = p; loadRooms(); }"
            @page-size-changed="(l) => { roomPagination.limit = l; roomPagination.page = 1; loadRooms(); }"
          />
        </div>
      </div>

      <!-- Types Tab -->
      <div v-if="activeTab === 'types'">
        <div class="flex justify-end mb-4">
          <button
            @click="openTypeModal"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          >
            <Plus class="-ml-1 mr-2 h-5 w-5" />
            Add Room Type
          </button>
        </div>
        <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type Name</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="t in roomTypes" :key="t.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ t.type_name }}</td>
                  <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">{{ t.description }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="t.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                      {{ t.is_active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button @click="editType(t)" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3">Edit</button>
                    <button @click="deleteType(t.id)" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Delete</button>
                  </td>
                </tr>
                <tr v-if="!roomTypes.length">
                  <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No room types found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Room Modal -->
      <div v-if="showRoomModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[100]">
        <div class="relative top-20 mx-auto p-5 border w-[32rem] shadow-lg rounded-md bg-white dark:bg-gray-800">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ isEditingRoom ? 'Edit Room' : 'Add Room' }}
          </h3>
          <form @submit.prevent="saveRoom">
            <div class="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Room Number *</label>
                <input v-model="roomForm.room_number" type="text" required class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hostel *</label>
                <select v-model="roomForm.hostel_id" required class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option v-for="h in hostelsList" :key="h.id" :value="h.id">{{ h.hostel_name }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Room Type *</label>
                <select v-model="roomForm.room_type_id" required class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option v-for="rt in roomTypes" :key="rt.id" :value="rt.id">{{ rt.type_name }}</option>
                </select>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Number of Beds</label>
                  <input v-model="roomForm.number_of_beds" type="number" class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cost Per Bed</label>
                  <input v-model="roomForm.cost_per_bed" type="number" step="0.01" class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
              </div>
              <div>
                <label class="flex items-center">
                  <input v-model="roomForm.is_active" type="checkbox" class="rounded border-gray-300 text-indigo-600" />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>
              </div>
            </div>
            <div class="flex justify-end space-x-3 mt-6">
              <button type="button" @click="closeRoomModal" class="px-4 py-2 border rounded-md text-gray-700 dark:text-gray-300">Cancel</button>
              <button type="submit" :disabled="isSubmitting" class="px-4 py-2 bg-indigo-600 text-white rounded-md">{{ isSubmitting ? 'Saving...' : 'Save' }}</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Type Modal -->
      <div v-if="showTypeModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[100]">
        <div class="relative top-20 mx-auto p-5 border w-[32rem] shadow-lg rounded-md bg-white dark:bg-gray-800">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ isEditingType ? 'Edit Room Type' : 'Add Room Type' }}
          </h3>
          <form @submit.prevent="saveType">
            <div class="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type Name *</label>
                <input v-model="typeForm.type_name" type="text" required class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea v-model="typeForm.description" rows="3" class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
              </div>
              <div>
                <label class="flex items-center">
                  <input v-model="typeForm.is_active" type="checkbox" class="rounded border-gray-300 text-indigo-600" />
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>
              </div>
            </div>
            <div class="flex justify-end space-x-3 mt-6">
              <button type="button" @click="closeTypeModal" class="px-4 py-2 border rounded-md text-gray-700 dark:text-gray-300">Cancel</button>
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
import { RoomsAPI, RoomTypesAPI, HostelsAPI } from '~/api/hostel';
import Pagination from '~/components/ui/Pagination.vue';
import { useAuth } from '~/composables/useAuth';

const { currentBranch, currentSchool, selectedBranchId } = useGlobalBranch();
const { showError, showSuccess } = useToast();
const { user } = useAuth();

const activeTab = ref('rooms');
const rooms = ref([]);
const roomTypes = ref([]);
const hostelsList = ref([]);

const showRoomModal = ref(false);
const isEditingRoom = ref(false);
const editingRoomId = ref(null);

const showTypeModal = ref(false);
const isEditingType = ref(false);
const editingTypeId = ref(null);

const isSubmitting = ref(false);

const roomPagination = reactive({ page: 1, limit: 10, total: 0 });

const roomForm = reactive({
  room_number: '',
  hostel_id: '',
  room_type_id: '',
  number_of_beds: 1,
  cost_per_bed: 0,
  is_active: true
});

const typeForm = reactive({
  type_name: '',
  description: '',
  is_active: true
});

import { extractList, apiErrorMessage } from '~/utils/list-response';

const loadHostelsAndTypes = async () => {
  if (!selectedBranchId.value) return;
  try {
    const [hRes, tRes] = await Promise.all([
      HostelsAPI.getAll({ branch_id: selectedBranchId.value, limit: 100 }),
      RoomTypesAPI.getAll({ branch_id: selectedBranchId.value, limit: 100 })
    ]);
    hostelsList.value = extractList(hRes);
    roomTypes.value = extractList(tRes);
  } catch (e) {
    console.error(e);
  }
};

const loadRooms = async () => {
  if (!selectedBranchId.value) return;
  try {
    const res = await RoomsAPI.getAll({
      page: roomPagination.page,
      limit: roomPagination.limit,
      branch_id: selectedBranchId.value
    });
    rooms.value = extractList(res);
    if (res?.pagination) roomPagination.total = res.pagination.total;
    else roomPagination.total = rooms.value.length;
  } catch (e: any) {
    showError(apiErrorMessage(e, 'Failed to fetch rooms'));
  }
};

const openRoomModal = () => {
  Object.assign(roomForm, {
    room_number: '',
    hostel_id: hostelsList.value.length ? hostelsList.value[0].id : '',
    room_type_id: roomTypes.value.length ? roomTypes.value[0].id : '',
    number_of_beds: 1,
    cost_per_bed: 0,
    is_active: true
  });
  isEditingRoom.value = false;
  editingRoomId.value = null;
  showRoomModal.value = true;
};

const editRoom = (r: any) => {
  Object.assign(roomForm, {
    room_number: r.room_number || '',
    hostel_id: r.hostel_id || '',
    room_type_id: r.room_type_id || '',
    number_of_beds: Number(r.number_of_beds) || 1,
    cost_per_bed: Number(r.cost_per_bed) || 0,
    is_active: r.is_active !== undefined ? r.is_active : true
  });
  isEditingRoom.value = true;
  editingRoomId.value = r.id;
  showRoomModal.value = true;
};

const closeRoomModal = () => { showRoomModal.value = false; };

const saveRoom = async () => {
  if (!selectedBranchId.value) {
    showError('No branch selected');
    return;
  }
  if (!roomForm.room_number?.trim()) {
    showError('Room number is required');
    return;
  }
  if (!roomForm.hostel_id) {
    showError('Hostel is required');
    return;
  }
  if (!roomForm.room_type_id) {
    showError('Room type is required');
    return;
  }
  isSubmitting.value = true;
  try {
    const payload = {
      ...roomForm,
      number_of_beds: Number(roomForm.number_of_beds) || 1,
      cost_per_bed: Number(roomForm.cost_per_bed) || 0,
      branch_id: selectedBranchId.value
    };
    if (!isEditingRoom.value) {
      payload.school_id = currentSchool.value?.id || user.value?.school_id;
      await RoomsAPI.create(payload);
    } else {
      await RoomsAPI.update(editingRoomId.value, payload);
    }
    closeRoomModal();
    loadRooms();
    showSuccess(`Room ${isEditingRoom.value ? 'updated' : 'created'}`);
  } catch (e: any) {
    showError(apiErrorMessage(e, 'Error saving room'));
  } finally {
    isSubmitting.value = false;
  }
};

const deleteRoom = async (id: string) => {
  if (!confirm('Are you sure you want to delete this room?')) return;
  try {
    await RoomsAPI.delete(id);
    loadRooms();
    showSuccess('Room deleted');
  } catch (e: any) {
    showError(apiErrorMessage(e, 'Error deleting room'));
  }
};

const openTypeModal = () => {
  Object.assign(typeForm, { type_name: '', description: '', is_active: true });
  isEditingType.value = false;
  editingTypeId.value = null;
  showTypeModal.value = true;
};

const editType = (t: any) => {
  Object.assign(typeForm, { type_name: t.type_name || '', description: t.description || '', is_active: t.is_active !== undefined ? t.is_active : true });
  isEditingType.value = true;
  editingTypeId.value = t.id;
  showTypeModal.value = true;
};

const closeTypeModal = () => { showTypeModal.value = false; };

const saveType = async () => {
  if (!selectedBranchId.value) {
    showError('No branch selected');
    return;
  }
  if (!typeForm.type_name?.trim()) {
    showError('Type name is required');
    return;
  }
  isSubmitting.value = true;
  try {
    const payload = { ...typeForm, branch_id: selectedBranchId.value };
    if (!isEditingType.value) {
      payload.school_id = currentSchool.value?.id || user.value?.school_id;
      await RoomTypesAPI.create(payload);
    } else {
      await RoomTypesAPI.update(editingTypeId.value, payload);
    }
    closeTypeModal();
    loadHostelsAndTypes();
    showSuccess(`Room Type ${isEditingType.value ? 'updated' : 'created'}`);
  } catch (e: any) {
    showError(apiErrorMessage(e, 'Error saving room type'));
  } finally {
    isSubmitting.value = false;
  }
};

const deleteType = async (id: string) => {
  if (!confirm('Are you sure you want to delete this room type?')) return;
  try {
    await RoomTypesAPI.delete(id);
    loadHostelsAndTypes();
    showSuccess('Room type deleted');
  } catch (e: any) {
    showError(apiErrorMessage(e, 'Error deleting room type'));
  }
};

const initialLoad = async () => {
  await loadHostelsAndTypes();
  await loadRooms();
};

onMounted(initialLoad);
watch(selectedBranchId, () => {
  roomPagination.page = 1;
  initialLoad();
});
</script>
