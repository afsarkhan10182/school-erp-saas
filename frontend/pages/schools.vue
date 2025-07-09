<template>
  <div class="card">
    <h1 class="text-2xl font-bold mb-4">Schools Management</h1>
    <div v-if="loading" class="text-gray-500">Loading schools...</div>
    <div v-else-if="error" class="text-red-600">{{ error }}</div>
    <div v-else>
      <table class="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">School Name</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Admin Name</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Admin Email</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-100">
          <tr v-for="school in schools" :key="school._id">
            <td class="px-4 py-2 font-medium text-gray-900">{{ school.name }}</td>
            <td class="px-4 py-2">{{ school.admin?.first_name }} {{ school.admin?.last_name }}</td>
            <td class="px-4 py-2">{{ school.admin?.email }}</td>
            <td class="px-4 py-2">
              <NuxtLink :to="`/schools/${school._id}`" class="text-blue-600 hover:underline">View</NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="schools.length === 0" class="text-gray-500 py-4">No schools found.</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
const config = useRuntimeConfig();
const apiBase = config.public.apiBase;

const schools = ref([]);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  loading.value = true;
  error.value = '';
  try {
    const token = localStorage.getItem('auth-token');
    const res = await fetch(`${apiBase}/schools`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (data.success) {
      // Assume each school has an 'admin' field with user info
      schools.value = data.data.items || data.data;
    } else {
      error.value = data.message || 'Failed to fetch schools.';
    }
  } catch (e) {
    error.value = 'Network error.';
  } finally {
    loading.value = false;
  }
});

useHead({ title: 'Schools - School ERP' });
</script> 