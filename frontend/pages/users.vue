<template>
  <client-only>
    <div class="card">
      <h1 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Employee List</h1>
      <!-- Role Tabs -->
      <div class="flex gap-2 mb-4">
        <button
          v-for="role in roleTabs"
          :key="role.key"
          @click="selectedRole = role.key"
          :class="['px-4 py-2 rounded-full font-medium', selectedRole === role.key ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300']"
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
          class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>
      <!-- Users Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white dark:bg-gray-800 rounded-lg">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Photo</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Branch</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Staff ID</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mobile No</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="px-4 py-2">
                <div v-if="user.profile_image" class="w-10 h-10 rounded-full overflow-hidden">
                  <img
                    :src="user.profile_image"
                    alt="Profile"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div v-else class="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                  {{ getUserInitials(user) }}
                </div>
              </td>
              <td class="px-4 py-2 text-gray-900 dark:text-white">{{ user.branch?.name || '-' }}</td>
              <td class="px-4 py-2 text-gray-900 dark:text-white">{{ user.id.slice(-6) }}</td>
              <td class="px-4 py-2 text-gray-900 dark:text-white">{{ user.first_name }} {{ user.last_name }}</td>
              <td class="px-4 py-2 text-gray-900 dark:text-white">{{ user.email }}</td>
              <td class="px-4 py-2 text-gray-900 dark:text-white">{{ user.phone || '-' }}</td>
              <td class="px-4 py-2 text-gray-900 dark:text-white">{{ user.role }}</td>
              <td class="px-4 py-2">
                <NuxtLink :to="`/users/${user.id}/edit`" class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:underline mr-2">Edit</NuxtLink>
                <button @click="confirmDelete(user)" class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:underline">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 dark:bg-black dark:bg-opacity-60 z-50">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 class="text-lg font-bold mb-2 text-gray-900 dark:text-white">Confirm Delete</h2>
          <p class="text-gray-700 dark:text-gray-300">Are you sure you want to delete this user?</p>
          <div class="mt-4 flex gap-2 justify-end">
            <button @click="showDeleteModal = false" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
            <button @click="deleteUser" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
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

const getUserInitials = (user) => {
  const firstName = user.first_name || '';
  const lastName = user.last_name || '';
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';
};

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
  @apply block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white sm:text-sm;
}
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}
.btn-secondary {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500;
}
</style> 