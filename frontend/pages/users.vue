<template>
  <div class="card">
    <h1 class="text-2xl font-bold mb-4">Users Management</h1>
    <div v-if="loading" class="text-gray-500">Loading users...</div>
    <div v-else-if="error" class="text-red-600">{{ error }}</div>
    <div v-else>
      <table class="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">School</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-100">
          <tr v-for="user in users" :key="user._id">
            <td class="px-4 py-2 font-medium text-gray-900">{{ user.first_name }} {{ user.last_name }}</td>
            <td class="px-4 py-2">{{ user.email }}</td>
            <td class="px-4 py-2">{{ user.role }}</td>
            <td class="px-4 py-2">{{ user.school?.name || user.school_name || '-' }}</td>
            <td class="px-4 py-2">{{ user.branch?.name || user.branch_name || '-' }}</td>
            <td class="px-4 py-2">
              <span :class="user.status === 'active' ? 'text-green-600' : 'text-gray-500'">
                {{ user.status || 'active' }}
              </span>
            </td>
            <td class="px-4 py-2">
              <!-- Placeholder for future actions -->
              <NuxtLink :to="`/users/${user._id}`" class="text-blue-600 hover:underline">View</NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="users.length === 0" class="text-gray-500 py-4">No users found.</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
const config = useRuntimeConfig();
const apiBase = config.public.apiBase;

const users = ref([]);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  loading.value = true;
  error.value = '';
  try {
    const token = localStorage.getItem('auth-token');
    const res = await fetch(`${apiBase}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (data.success) {
      users.value = data.data.items || data.data;
    } else {
      error.value = data.message || 'Failed to fetch users.';
    }
  } catch (e) {
    error.value = 'Network error.';
  } finally {
    loading.value = false;
  }
});

useHead({ title: 'Users - School ERP' });
</script> 