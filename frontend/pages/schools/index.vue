<template>
  <div class="container mx-auto py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Schools</h1>
      <NuxtLink to="/schools/create" class="btn-primary">Add School</NuxtLink>
    </div>
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
          <tr v-for="school in schools" :key="school.id">
            <td class="px-4 py-2 font-medium text-gray-900">{{ school.name }}</td>
            <td class="px-4 py-2">{{ school.createdBy?.first_name }} {{ school.createdBy?.last_name }}</td>
            <td class="px-4 py-2">{{ school.createdBy?.email }}</td>
            <td class="px-4 py-2">
              <NuxtLink :to="`/schools/${school.id}/edit`" class="btn-secondary mr-2">Edit</NuxtLink>
              <button @click="handleDelete(school.id)" class="btn-danger">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="schools.length === 0" class="text-gray-500 py-4">No schools found.</div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSchools } from '~/composables/useSchools';

const { schools, loading, error, fetchSchools, deleteSchool } = useSchools();
const router = useRouter();

onMounted(fetchSchools);

const handleDelete = async (id) => {
  if (confirm('Are you sure you want to delete this school?')) {
    const success = await deleteSchool(id);
    if (success) {
      fetchSchools();
    }
  }
};
</script>

<style scoped>
.btn-primary {
  background: #2563eb;
  color: #fff;
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
}
.btn-secondary {
  background: #e0e7ef;
  color: #2563eb;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
}
.btn-danger {
  background: #ef4444;
  color: #fff;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
}
</style> 