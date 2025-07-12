<template>
  <client-only>
    <div class="card">
      <h1 class="text-2xl font-bold mb-4">Employee List</h1>
      <!-- Role Tabs -->
      <div class="flex gap-2 mb-4">
        <button
          v-for="role in roleTabs"
          :key="role.key"
          @click="selectedRole = role.key"
          :class="['px-4 py-2 rounded-full font-medium', selectedRole === role.key ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700']"
        >
          {{ role.label }} ({{ role.count }})
        </button>
      </div>
      <!-- Search Bar -->
      <div class="mb-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name, email, branch..."
          class="w-full px-4 py-2 border rounded-lg"
        />
      </div>
      <!-- Users Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white rounded-lg">
          <thead>
            <tr>
              <th class="px-4 py-2">Photo</th>
              <th class="px-4 py-2">Branch</th>
              <th class="px-4 py-2">Staff ID</th>
              <th class="px-4 py-2">Name</th>
              <th class="px-4 py-2">Email</th>
              <th class="px-4 py-2">Mobile No</th>
              <th class="px-4 py-2">Role</th>
              <th class="px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td class="px-4 py-2">
                <img
                  :src="user.profile_image || '/default-avatar.png'"
                  alt="Profile"
                  class="w-10 h-10 rounded-full object-cover"
                />
              </td>
              <td class="px-4 py-2">{{ user.branch?.name || '-' }}</td>
              <td class="px-4 py-2">{{ user.id.slice(-6) }}</td>
              <td class="px-4 py-2">{{ user.first_name }} {{ user.last_name }}</td>
              <td class="px-4 py-2">{{ user.email }}</td>
              <td class="px-4 py-2">{{ user.phone || '-' }}</td>
              <td class="px-4 py-2">{{ user.role }}</td>
              <td class="px-4 py-2">
                <NuxtLink :to="`/users/${user.id}/edit`" class="text-blue-600 hover:underline mr-2">Edit</NuxtLink>
                <button @click="confirmDelete(user)" class="text-red-600 hover:underline">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
        <div class="bg-white p-6 rounded-lg shadow-lg">
          <h2 class="text-lg font-bold mb-2">Confirm Delete</h2>
          <p>Are you sure you want to delete this user?</p>
          <div class="mt-4 flex gap-2 justify-end">
            <button @click="showDeleteModal = false" class="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            <button @click="deleteUser" class="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </client-only>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '~/stores/auth';
import apiClient from '~/utils/api';

const users = ref([]);
const searchQuery = ref('');
const selectedRole = ref('all');
const showDeleteModal = ref(false);
const userToDelete = ref(null);
const router = useRouter();
const authStore = useAuthStore();

const roleTabs = ref([
  { key: 'all', label: 'All', count: 0 },
  { key: 'super_admin', label: 'Admin', count: 0 },
  { key: 'teacher', label: 'Teacher', count: 0 },
  { key: 'accountant', label: 'Accountant', count: 0 },
  { key: 'librarian', label: 'Librarian', count: 0 },
  { key: 'receptionist', label: 'Receptionist', count: 0 },
]);

const fetchUsers = async () => {
  try {
    const res = await apiClient.users.getAll();
    users.value = res.data?.users || [];
    // Update role counts
    roleTabs.value.forEach(tab => {
      if (tab.key === 'all') {
        tab.count = users.value.length;
      } else {
        tab.count = users.value.filter(u => u.role === tab.key).length;
      }
    });
  } catch (e) {
    users.value = [];
  }
};

onMounted(() => {
  fetchUsers();
});

const filteredUsers = computed(() => {
  let filtered = users.value;
  if (selectedRole.value !== 'all') {
    filtered = filtered.filter(u => u.role === selectedRole.value);
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    filtered = filtered.filter(u =>
      u.first_name?.toLowerCase().includes(q) ||
      u.last_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.branch?.name?.toLowerCase().includes(q)
    );
  }
  return filtered;
});

function confirmDelete(user) {
  userToDelete.value = user;
  showDeleteModal.value = true;
}

async function deleteUser() {
  if (!userToDelete.value) return;
  try {
    await apiClient.users.delete(userToDelete.value.id);
    showDeleteModal.value = false;
    userToDelete.value = null;
    fetchUsers();
  } catch (e) {
    // handle error
  }
}
</script>

<style scoped>
.input-field {
  @apply block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm;
}
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}
.btn-secondary {
  @apply bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500;
}
</style> 