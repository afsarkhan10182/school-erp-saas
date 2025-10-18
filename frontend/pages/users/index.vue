<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Header -->
      <div class="mb-6">
        <!-- Breadcrumb -->
        <nav class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
          <NuxtLink to="/dashboard" class="hover:text-indigo-600 dark:hover:text-indigo-400"
            >Dashboard</NuxtLink
          >
          <span>/</span>
          <span class="text-gray-900 dark:text-white font-medium">{{
            isAdmin ? 'School Staff' : 'User Management'
          }}</span>
        </nav>

        <!-- Main Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1
              class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              {{ isAdmin ? 'School Staff' : 'User Management' }}
            </h1>
            <p class="mt-1 sm:mt-2 text-sm text-gray-700 dark:text-gray-300">
              Manage staff members and user accounts
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center space-x-3">
            <button
              @click="navigateTo('/users/create')"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clip-rule="evenodd"
                />
              </svg>
              Add Staff
            </button>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="space-y-4">
        <!-- Role Tabs -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-3">
          <div class="flex gap-2 overflow-x-auto pb-1">
            <button
              v-for="role in filteredRoleTabs"
              :key="role.key"
              @click="selectedRole = role.key"
              :class="[
                'px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors',
                selectedRole === role.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              ]"
            >
              {{ role.label }} ({{ roleCounts[role.key] }})
            </button>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-3">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                class="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by name, email, branch..."
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        <!-- Loading State -->
        <div v-if="isLoading" class="bg-white dark:bg-gray-800 shadow rounded-lg p-12">
          <div class="flex justify-center items-center">
            <div
              class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"
            ></div>
          </div>
        </div>

        <!-- No Users Found -->
        <div
          v-else-if="!isLoading && filteredUsers.length === 0"
          class="bg-white dark:bg-gray-800 shadow rounded-lg p-12"
        >
          <div class="text-center">
            <div class="mx-auto w-24 h-24 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <h3 class="mt-2 text-lg font-medium text-gray-900 dark:text-white">
              No staff members found
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{
                searchQuery
                  ? 'Try adjusting your search or filter'
                  : 'Get started by adding a new staff member'
              }}
            </p>
            <div class="mt-6">
              <button
                @click="navigateTo('/users/create')"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg
                  class="-ml-1 mr-2 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                    clip-rule="evenodd"
                  />
                </svg>
                Add Staff
              </button>
            </div>
          </div>
        </div>

        <!-- Users Table -->
        <div v-else class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Name
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Role
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Email
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Phone
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Branch
                  </th>
                  <th
                    class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
              >
                <tr
                  v-for="user in filteredUsers"
                  :key="user.id"
                  class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ user.first_name }} {{ user.last_name }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      ID: {{ user.id.slice(-6) }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      :class="{
                        'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': [
                          'admin',
                          'super_admin'
                        ].includes(user.role),
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200':
                          user.role === 'teacher',
                        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200':
                          user.role === 'accountant',
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200':
                          user.role === 'librarian',
                        'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200':
                          user.role === 'receptionist',
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200': ![
                          'admin',
                          'super_admin',
                          'teacher',
                          'accountant',
                          'librarian',
                          'receptionist'
                        ].includes(user.role)
                      }"
                    >
                      {{ formatRole(user.role) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div class="truncate max-w-xs">{{ user.email }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {{ user.phone || '-' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {{ user.branch?.name || '-' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex items-center justify-end space-x-2">
                      <NuxtLink
                        :to="`/users/${user.id}/edit`"
                        class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 transition-colors"
                        title="Edit"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
                          />
                        </svg>
                      </NuxtLink>
                      <button
                        v-if="!isAdmin || (user.role !== 'admin' && user.id !== user.value?.id)"
                        @click="confirmDelete(user)"
                        class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
                        title="Delete"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation Modal -->
  <div
    v-if="showDeleteModal"
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
  >
    <div
      class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800"
    >
      <div class="mt-3 text-center">
        <div
          class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900"
        >
          <svg
            class="h-6 w-6 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mt-4">Delete User</h3>
        <div class="mt-2 px-7 py-3">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to delete
            <strong>{{ userToDelete?.first_name }} {{ userToDelete?.last_name }}</strong
            >? This action cannot be undone.
          </p>
        </div>
        <div class="items-center px-4 py-3">
          <button
            @click="deleteUser"
            class="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            Delete
          </button>
          <button
            @click="showDeleteModal = false"
            class="mt-2 px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '~/composables/useAuth';
import { Users, Branches } from '~/api';
import { useToast } from 'vue-toastification';

const { isSuperAdmin, isAdmin, user } = useAuth();

// Access control - only Super Admin and Admin can access user management
if (!isSuperAdmin.value && !isAdmin.value) {
  // Show error toast
  useToast().error('Access denied. Only Super Admin and Admin can manage users.');
  await navigateTo('/dashboard');
}
const users = ref([]);
const branches = ref([]);
const searchQuery = ref('');
const selectedRole = ref('all');
const showDeleteModal = ref(false);
const userToDelete = ref(null);
const isLoading = ref(true);
const router = useRouter();
const route = useRoute();

const newStaff = ref({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  role: 'teacher',
  school_id: user.value?.school_id,
  branch_id: ''
});

// Format role for display
const formatRole = role => {
  const roleMap = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    teacher: 'Teacher',
    accountant: 'Accountant',
    librarian: 'Librarian',
    receptionist: 'Receptionist'
  };
  return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1);
};

const roleTabs = ref([
  { key: 'all', label: 'All Staff', count: 0 },
  { key: 'teacher', label: 'Teachers', count: 0 },
  { key: 'accountant', label: 'Accountants', count: 0 },
  { key: 'librarian', label: 'Librarians', count: 0 },
  { key: 'receptionist', label: 'Receptionists', count: 0 },
  { key: 'branch_admin', label: 'Branch Admins', count: 0 },
  { key: 'admin', label: 'Admins', count: 0 },
  { key: 'super_admin', label: 'Super Admins', count: 0 }
]);

const roleCounts = ref({});

const filteredRoleTabs = computed(() => {
  if (isAdmin.value) {
    return roleTabs.value.filter(tab =>
      ['all', 'teacher', 'accountant', 'librarian', 'receptionist', 'branch_admin'].includes(
        tab.key
      )
    );
  }
  return roleTabs.value;
});

const filteredUsers = computed(() => {
  let result = [...users.value];

  // If current user is Admin, exclude other Admin users
  if (isAdmin.value) {
    result = result.filter(user => user.role !== 'admin');
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      user =>
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query) ||
        user.branch?.name?.toLowerCase().includes(query)
    );
  }

  // Filter by role
  if (selectedRole.value !== 'all') {
    result = result.filter(user => user.role === selectedRole.value);
  }

  return result;
});

const updateRoleCounts = () => {
  // Filter users based on current user's role
  let filteredUsers = [...users.value];

  // If current user is Admin, exclude other Admin users from counts
  if (isAdmin.value) {
    filteredUsers = filteredUsers.filter(user => user.role !== 'admin');
  }

  const counts = { all: filteredUsers.length };

  roleTabs.value.forEach(tab => {
    if (tab.key !== 'all') {
      counts[tab.key] = filteredUsers.filter(user => user.role === tab.key).length;
    }
  });

  roleCounts.value = counts;
};

const fetchBranches = async () => {
  try {
    if (user.value?.school_id) {
      const response = await Branches.getForDropdown({ school_id: user.value.school_id });
      branches.value = response.data;
    }
  } catch (error) {
    // Error handled silently
  }
};

const fetchUsers = async (showLoading = true) => {
  try {
    if (showLoading) {
      isLoading.value = true;
    }

    let response;
    if (isAdmin.value) {
      // Use the users endpoint with school_id filter for school admins
      response = await Users.getAll({
        schoolId: user.value.school_id,
        role: selectedRole.value === 'all' ? undefined : selectedRole.value,
        search: searchQuery.value
      });
    } else {
      // Super admin can see all users
      response = await Users.getAll({
        role: selectedRole.value === 'all' ? undefined : selectedRole.value,
        search: searchQuery.value
      });
    }

    // Handle response structure from backend
    if (response.data && response.data.users && Array.isArray(response.data.users)) {
      users.value = response.data.users;
    } else if (response.data && Array.isArray(response.data)) {
      users.value = response.data;
    } else {
      users.value = [];
    }

    updateRoleCounts();
    if (showLoading) {
      useToast().success('Users list updated');
    }
  } catch (error) {
    useToast().error(error.response?.data?.message || 'Failed to fetch users. Please try again.');
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchUsers();
  fetchBranches();
});

// Watch for route changes to refresh when returning from edit
watch(
  () => route.path,
  (newPath, oldPath) => {
    if (
      newPath === '/users' &&
      oldPath &&
      oldPath.startsWith('/users/') &&
      oldPath.includes('/edit')
    ) {
      // User returned from edit page, refresh the list
      fetchUsers(false);
    }
  }
);

// Watch for search and role filter changes
// VueUse debounced search
const debouncedFetchUsers = useDebounceFn(() => {
  fetchUsers(false); // Don't show loading indicator for filter changes
}, 300);

watch([searchQuery, selectedRole], debouncedFetchUsers);

const confirmDelete = user => {
  userToDelete.value = user;
  showDeleteModal.value = true;
};

async function deleteUser() {
  if (!userToDelete.value) return;
  const userIdToDelete = userToDelete.value.id;
  try {
    await Users.delete(userIdToDelete);
    useToast().success('User deleted successfully');
    showDeleteModal.value = false;
    userToDelete.value = null;
    // Remove the user from the local list instead of refetching
    users.value = users.value.filter(user => user.id !== userIdToDelete);
    updateRoleCounts();
  } catch (error) {
    useToast().error(error.response?.data?.message || 'Failed to delete user');
  }
}
</script>
