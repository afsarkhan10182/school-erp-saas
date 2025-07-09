<template>
  <div class="container mx-auto py-8 max-w-xl">
    <h1 class="text-2xl font-bold mb-6">Edit School</h1>
    <form v-if="loaded" @submit.prevent="handleSubmit" class="space-y-4 bg-white p-6 rounded shadow">
      <div v-for="field in fields" :key="field.key">
        <label :for="field.key" class="block font-medium mb-1">{{ field.label }}</label>
        <input v-model="form[field.key]" :id="field.key" :type="field.type || 'text'" class="input-field" required />
      </div>
      <div v-if="error" class="text-red-600">{{ error }}</div>
      <button type="submit" class="btn-primary">Update School</button>
    </form>
    <div v-else class="text-gray-500">Loading...</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSchools } from '~/composables/useSchools';

const { getSchoolById, updateSchool, loading, error } = useSchools();
const route = useRoute();
const router = useRouter();

const form = ref({
  name: '',
  code: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  country: '',
  postal_code: '',
  website: ''
});
const loaded = ref(false);

const fields = [
  { key: 'name', label: 'School Name' },
  { key: 'code', label: 'School Code' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'phone', label: 'Phone' },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'country', label: 'Country' },
  { key: 'postal_code', label: 'Postal Code' },
  { key: 'website', label: 'Website' }
];

onMounted(async () => {
  const school = await getSchoolById(route.params.id);
  if (school) {
    Object.assign(form.value, school);
    loaded.value = true;
  }
});

const handleSubmit = async () => {
  const result = await updateSchool(route.params.id, form.value);
  if (result) {
    router.push('/schools');
  }
};
</script>

<style scoped>
.input-field {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}
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