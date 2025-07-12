<template>
  <div class="container mx-auto py-8 max-w-3xl">
    <h1 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Edit Branch</h1>
    <form v-if="loaded" @submit.prevent="handleSubmit" class="space-y-8 bg-white dark:bg-gray-800 p-6 rounded shadow">
      <!-- School (read-only) -->
      <div>
        <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">School</label>
        <input :value="branch.school?.name || branch.school_name || '-'" class="input-field" readonly />
      </div>
      <!-- Branch Info -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Branch Name *</label>
          <input v-model="form.name" type="text" required class="input-field" />
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Email</label>
          <input v-model="form.email" type="email" class="input-field" />
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Mobile No</label>
          <input v-model="form.phone" type="text" class="input-field" />
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Currency *</label>
          <input v-model="form.currency" type="text" required class="input-field" />
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Currency Symbol *</label>
          <input v-model="form.currency_symbol" type="text" required class="input-field" />
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">City *</label>
          <input v-model="form.city" type="text" required class="input-field" />
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">State *</label>
          <input v-model="form.state" type="text" required class="input-field" />
        </div>
      </div>
      <div>
        <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Address</label>
        <textarea v-model="form.address" class="input-field" rows="2"></textarea>
      </div>
      <!-- File Uploads -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">System Logo</label>
          <input ref="systemLogoInput" type="file" accept="image/*" class="input-field" @change="onFileChange('system_logo', $event)" />
          <div v-if="branch.settings?.system_logo" class="mt-1"><img :src="branch.settings.system_logo" alt="System Logo" class="w-12 h-12 rounded border" /></div>
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Text Logo</label>
          <input ref="textLogoInput" type="file" accept="image/*" class="input-field" @change="onFileChange('text_logo', $event)" />
          <div v-if="branch.settings?.text_logo" class="mt-1"><img :src="branch.settings.text_logo" alt="Text Logo" class="w-12 h-12 rounded border" /></div>
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Printing Logo</label>
          <input ref="printingLogoInput" type="file" accept="image/*" class="input-field" @change="onFileChange('printing_logo', $event)" />
          <div v-if="branch.settings?.printing_logo" class="mt-1"><img :src="branch.settings.printing_logo" alt="Printing Logo" class="w-12 h-12 rounded border" /></div>
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Report Card Design (optional)</label>
          <input ref="reportCardInput" type="file" accept="image/*,application/pdf" class="input-field" @change="onFileChange('report_card_design', $event)" />
          <div v-if="branch.settings?.report_card_design" class="mt-1"><a :href="branch.settings.report_card_design" target="_blank" class="text-blue-600 dark:text-blue-400 underline">Download/View</a></div>
        </div>
      </div>
      <!-- Submit -->
      <div class="flex justify-end gap-3">
        <NuxtLink :to="`/branches/${branchId}`" class="btn-secondary">Cancel</NuxtLink>
        <button type="submit" class="btn-primary" :disabled="loading">{{ loading ? 'Saving...' : 'Save Changes' }}</button>
      </div>
      <div v-if="error" class="text-red-600 dark:text-red-400 mt-4">{{ error }}</div>
      <div v-if="success" class="text-green-600 dark:text-green-400 mt-4">Branch updated successfully!</div>
    </form>
    <div v-else class="text-gray-500 dark:text-gray-400">Loading...</div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBranches } from '~/composables/useBranches';

const route = useRoute();
const router = useRouter();
const branchId = route.params.id;
const { loading, error } = useBranches();
const branch = ref({});
const loaded = ref(false);
const success = ref(false);

const form = ref({
  name: '',
  email: '',
  phone: '',
  currency: '',
  currency_symbol: '',
  city: '',
  state: '',
  address: ''
});

const fileInputs = ref({});
const systemLogoInput = ref(null);
const textLogoInput = ref(null);
const printingLogoInput = ref(null);
const reportCardInput = ref(null);

const onFileChange = (field, event) => {
  fileInputs.value[field] = event.target.files[0];
};

const fetchBranch = async () => {
  try {
    const token = localStorage.getItem('auth-token');
    const config = useRuntimeConfig();
    const apiBase = config.public.apiBase;
    const res = await fetch(`${apiBase}/branches/${branchId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (data.success) {
      branch.value = data.data.branch || data.data;
      
      // Map basic fields
      Object.assign(form.value, {
        name: branch.value.name,
        email: branch.value.email,
        phone: branch.value.phone,
        city: branch.value.city,
        state: branch.value.state,
        address: branch.value.address
      });
      
      // Map settings fields
      if (branch.value.settings) {
        form.value.currency = branch.value.settings.currency || '';
        form.value.currency_symbol = branch.value.settings.currency_symbol || '';
      }
      
      loaded.value = true;
    }
  } catch (e) {
    // error handled by composable
  }
};

const handleSubmit = async () => {
  success.value = false;
  const formData = new FormData();
  formData.append('name', form.value.name);
  formData.append('email', form.value.email);
  formData.append('phone', form.value.phone);
  formData.append('currency', form.value.currency);
  formData.append('currency_symbol', form.value.currency_symbol);
  formData.append('city', form.value.city);
  formData.append('state', form.value.state);
  formData.append('address', form.value.address);
  if (fileInputs.value.system_logo) formData.append('system_logo', fileInputs.value.system_logo);
  if (fileInputs.value.text_logo) formData.append('text_logo', fileInputs.value.text_logo);
  if (fileInputs.value.printing_logo) formData.append('printing_logo', fileInputs.value.printing_logo);
  if (fileInputs.value.report_card_design) formData.append('report_card_design', fileInputs.value.report_card_design);
  try {
    const token = localStorage.getItem('auth-token');
    const config = useRuntimeConfig();
    const apiBase = config.public.apiBase;
    const res = await fetch(`${apiBase}/branches/${branchId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
        // Do not set Content-Type for FormData
      },
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      // Show success toast and redirect
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('show-toast', {
          detail: {
            message: 'Branch updated successfully!',
            type: 'success'
          }
        });
        window.dispatchEvent(event);
      }
      // Redirect to list page
      setTimeout(() => {
        router.push('/branches');
      }, 1000);
    }
  } catch (e) {
    // error handled by composable
  }
};

onMounted(fetchBranch);
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