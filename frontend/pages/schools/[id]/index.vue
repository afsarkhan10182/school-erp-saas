<template>
  <div class="container mx-auto py-8 max-w-xl">
    <div v-if="school">
      <h1 class="text-2xl font-bold mb-6">{{ school.name }}</h1>
      <div class="bg-white p-6 rounded shadow space-y-2">
        <div><strong>Code:</strong> {{ school.code }}</div>
        <div><strong>Email:</strong> {{ school.email }}</div>
        <div><strong>Phone:</strong> {{ school.phone }}</div>
        <div><strong>Address:</strong> {{ school.address }}</div>
        <div><strong>City:</strong> {{ school.city }}</div>
        <div><strong>State:</strong> {{ school.state }}</div>
        <div><strong>Country:</strong> {{ school.country }}</div>
        <div><strong>Postal Code:</strong> {{ school.postal_code }}</div>
        <div><strong>Website:</strong> <a :href="school.website" target="_blank" class="text-blue-600 hover:underline">{{ school.website }}</a></div>
      </div>
      <NuxtLink :to="`/schools/${school.id}/edit`" class="btn-primary mt-6 inline-block">Edit School</NuxtLink>
    </div>
    <div v-else-if="error" class="text-red-600">{{ error }}</div>
    <div v-else class="text-gray-500">Loading...</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useSchools } from '~/composables/useSchools';

const { getSchoolById, error } = useSchools();
const route = useRoute();
const school = ref(null);

onMounted(async () => {
  school.value = await getSchoolById(route.params.id);
});
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
</style> 