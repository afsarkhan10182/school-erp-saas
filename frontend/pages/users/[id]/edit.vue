<template>
  <div class="container mx-auto py-8 max-w-2xl">
    <h1 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Edit User</h1>
    <div v-if="loading" class="text-gray-500 dark:text-gray-400">Loading...</div>
    <div v-else-if="error" class="text-red-600 dark:text-red-400">{{ error }}</div>
    <form v-else @submit.prevent="handleSubmit" class="space-y-6 bg-white dark:bg-gray-800 p-6 rounded shadow">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">First Name *</label>
          <input v-model="form.firstName" type="text" required class="input-field" />
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Last Name *</label>
          <input v-model="form.lastName" type="text" required class="input-field" />
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Email *</label>
          <input v-model="form.email" type="email" required class="input-field" />
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Phone</label>
          <input v-model="form.phone" type="text" class="input-field" @input="form.phone = form.phone.replace(/[^\d]/g, '')" />
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Role *</label>
          <select v-model="form.role" required class="input-field">
            <option value="super_admin">Super Admin</option>
            <option value="school_admin">School Admin</option>
            <option value="branch_admin">Branch Admin</option>
            <option value="teacher">Teacher</option>
            <option value="accountant">Accountant</option>
            <option value="librarian">Librarian</option>
            <option value="receptionist">Receptionist</option>
            <option value="hr">HR</option>
            <option value="student">Student</option>
            <option value="parent">Parent</option>
            <option value="alumni">Alumni</option>
            <option value="transport_manager">Transport Manager</option>
          </select>
        </div>
      </div>
      <div class="flex justify-end gap-3">
        <NuxtLink to="/users" class="btn-secondary">Cancel</NuxtLink>
        <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Saving...' : 'Save Changes' }}</button>
      </div>
      <div v-if="success" class="text-green-600 dark:text-green-400 mt-4">User updated successfully!</div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient from '~/utils/api';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const error = ref('');
const saving = ref(false);
const success = ref(false);
const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: ''
});

const fetchUser = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await apiClient.users.getById(route.params.id);
    if (res.success) {
      Object.assign(form.value, res.data);
    } else {
      error.value = res.message || 'Failed to load user.';
    }
  } catch (e) {
    error.value = 'Failed to load user.';
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  saving.value = true;
  success.value = false;
  try {
    const res = await apiClient.users.update(route.params.id, form.value);
    if (res.success) {
      success.value = true;
      setTimeout(() => router.push('/users'), 1000);
    } else {
      error.value = res.message || 'Failed to update user.';
    }
  } catch (e) {
    error.value = 'Failed to update user.';
  } finally {
    saving.value = false;
  }
};

onMounted(fetchUser);
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