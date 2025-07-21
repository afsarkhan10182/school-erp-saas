<template>
  <client-only>
    <div class="card">
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center gap-4">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ isSchoolAdmin ? 'School Staff' : 'User Management' }}
          </h1>
          <button 
            @click="fetchUsers" 
            :disabled="isLoading" 
            class="p-1.5 rounded-full text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh users"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
        <button 
          @click="navigateTo('/users/create')"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          Add Staff
        </button>
      </div>
      
      <!-- Role Tabs -->
      <div class="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button
          v-for="role in filteredRoleTabs"
          :key="role.key"
          @click="selectedRole = role.key"
          :class="[
            'px-4 py-2 rounded-full font-medium whitespace-nowrap', 
            selectedRole === role.key 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          ]"
        >
          {{ role.label }} ({{ roleCounts[role.key] || 0 }})
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
      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
      
      <!-- No Users Found -->
      <div v-else-if="!isLoading && filteredUsers.length === 0" class="text-center py-12">
        <div class="mx-auto w-24 h-24 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h3 class="mt-2 text-lg font-medium text-gray-900 dark:text-white">No staff members found</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ searchQuery ? 'Try adjusting your search or filter' : 'Get started by adding a new staff member' }}
        </p>
        <div class="mt-6">
          <button @click="navigateTo('/users/create')"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            Add Staff
          </button>
        </div>
      </div>
      
      <!-- Users Table -->
      <div v-else class="overflow-x-auto">
        <table class="min-w-full bg-white dark:bg-gray-800 rounded-lg">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Photo</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Phone</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Branch</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="px-4 py-4 whitespace-nowrap">
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
              <td class="px-4 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ user.first_name }} {{ user.last_name }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">ID: {{ user.id.slice(-6) }}</div>
              </td>
              <td class="px-4 py-4 whitespace-nowrap">
                <span 
                  :class="{
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                    'bg-green-100 text-green-800': ['admin', 'super_admin'].includes(user.role),
                    'bg-blue-100 text-blue-800': user.role === 'teacher',
                    'bg-purple-100 text-purple-800': user.role === 'accountant',
                    'bg-yellow-100 text-yellow-800': user.role === 'librarian',
                    'bg-indigo-100 text-indigo-800': user.role === 'receptionist',
                    'bg-gray-100 text-gray-800': !['admin', 'super_admin', 'teacher', 'accountant', 'librarian', 'receptionist'].includes(user.role),
                  }"
                >
                  {{ formatRole(user.role) }}
                </span>
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                <div class="truncate max-w-xs">{{ user.email }}</div>
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ user.phone || '-' }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ user.branch?.name || '-' }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                <!-- <div class="flex items-center justify-end space-x-2">
                  <NuxtLink 
                    :to="`/users/${user.id}/edit`" 
                    class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                    title="Edit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </NuxtLink>
                  <button 
                    @click="confirmDelete(user)" 
                    class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                    title="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div> -->
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </client-only>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '~/stores/auth';
import apiClient from '~/utils/api';
import { useToast } from 'vue-toastification';

const { user } = useAuthStore();
const users = ref([]);
const branches = ref([]);
const searchQuery = ref('');
const selectedRole = ref('all');
const showDeleteModal = ref(false);
const userToDelete = ref(null);
const isLoading = ref(true);
const router = useRouter();
const authStore = useAuthStore();

const newStaff = ref({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  role: 'teacher',
  school_id: authStore.user?.school_id,
  branch_id: ''
});

const isSchoolAdmin = computed(() => authStore.user?.role === 'school_admin');

// Format role for display
const formatRole = (role) => {
  const roleMap = {
    'super_admin': 'Super Admin',
    'school_admin': 'School Admin',
    'teacher': 'Teacher',
    'accountant': 'Accountant',
    'librarian': 'Librarian',
    'receptionist': 'Receptionist',
  };
  return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1);
};

const roleTabs = ref([
  { key: 'all', label: 'All Staff', count: 0 },
  { key: 'teacher', label: 'Teachers', count: 0 },
  { key: 'accountant', label: 'Accountants', count: 0 },
  { key: 'librarian', label: 'Librarians', count: 0 },
  { key: 'receptionist', label: 'Receptionists', count: 0 },
  { key: 'school_admin', label: 'School Admins', count: 0 },
  { key: 'super_admin', label: 'Super Admins', count: 0 },
]);

const roleCounts = ref({});

const filteredRoleTabs = computed(() => {
  if (isSchoolAdmin.value) {
    return roleTabs.value.filter(tab => 
      ['all', 'teacher', 'accountant', 'librarian', 'receptionist', 'school_admin'].includes(tab.key)
    );
  }
  return roleTabs.value;
});

const getUserInitials = (user) => {
  const firstName = user.first_name || '';
  const lastName = user.last_name || '';
  return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase() || '?';
};

const filteredUsers = computed(() => {
  let result = [...users.value];
  
  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(user => 
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
  const counts = { all: users.value.length };
  
  roleTabs.value.forEach(tab => {
    if (tab.key !== 'all') {
      counts[tab.key] = users.value.filter(user => user.role === tab.key).length;
    }
  });
  
  roleCounts.value = counts;
};

const fetchBranches = async () => {
  try {

    if (authStore.user?.school_id) {
      const response = await apiClient.branches.getAll(authStore.user.school_id);
      console.log('Branches response:', response);
      branches.value = response.data || [];
      console.log('Branches loaded:', branches.value);
    } else {
      console.log('No school_id found for user');
    }
  } catch (error) {
    console.error('Error fetching branches:', error);
  }
};

const fetchUsers = async (showLoading = true) => {
  try {
    if (showLoading) {
      isLoading.value = true;
    }
    
    if (isSchoolAdmin.value) {
      // Use the school staff endpoint for school admins
      const response = await apiClient.schools.getStaff(authStore.user.school_id, {
        role: selectedRole.value === 'all' ? undefined : selectedRole.value,
        search: searchQuery.value || undefined,
      });
      users.value = response.data.users || response.data;
    } else {
      // Super admin can see all users
      const response = await apiClient.users.getAll({
        role: selectedRole.value === 'all' ? undefined : selectedRole.value,
        search: searchQuery.value || undefined,
      });
      users.value = response.data.users || response.data;
    }
    
    updateRoleCounts();
    useToast().success('Users list updated');
  } catch (error) {
    console.error('Error fetching users:', error);
    useToast().error(error.response?.data?.message || 'Failed to fetch users. Please try again.');
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  console.log('User info:', {
    role: authStore.user?.role,
    school_id: authStore.user?.school_id,
    branch_id: authStore.user?.branch_id,
    email: authStore.user?.email
  });
  fetchUsers();
  fetchBranches();
});

const confirmDelete = (user) => {
  userToDelete.value = user;
  showDeleteModal.value = true;
}

async function deleteUser() {
  if (!userToDelete.value) return;
  try {
    await apiClient.users.delete(userToDelete.value.id);
    useToast().success('User deleted successfully');
    showDeleteModal.value = false;
    userToDelete.value = null;
    fetchUsers();
  } catch (error){
    console.error('Error deleting user:', error);
    useToast().error(error.response?.data?.message || 'Failed to delete user');
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