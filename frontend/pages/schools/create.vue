<template>
  <div class="container mx-auto py-8 max-w-xl">
    <h1 class="text-2xl font-bold mb-6">Add New School</h1>
    <form @submit.prevent="handleSubmit" class="space-y-4 bg-white p-6 rounded shadow">
      <div v-for="field in fields" :key="field.key">
        <label :for="field.key" class="block font-medium mb-1">{{ field.label }}</label>
        <input v-model="form[field.key]" :id="field.key" :type="field.type || 'text'" class="input-field" required />
      </div>
      <div v-if="error" class="text-red-600">{{ error }}</div>
      <button type="submit" class="btn-primary">Create School</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSchools } from '~/composables/useSchools';

const { createSchool, loading, error } = useSchools();
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

const handleSubmit = async () => {
  const result = await createSchool(form.value);
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