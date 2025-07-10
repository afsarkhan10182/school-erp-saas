<template>
  <div class="container mx-auto py-8 max-w-3xl">
    <h1 class="text-2xl font-bold mb-6">Add New Branch (Campus)</h1>
    <form @submit.prevent="handleSubmit" class="space-y-8 bg-white p-6 rounded shadow">
      <!-- School Selection -->
      <div>
        <label class="block font-medium mb-1">Select School *</label>
        <div v-if="schoolsLoading" class="text-gray-500 mb-2">Loading schools...</div>
        <div v-else-if="schools.length === 0" class="text-red-600 mb-2">No schools available. Please create a school first.</div>
        <select v-model="form.schoolId" required class="input-field" :disabled="schoolsLoading || schools.length === 0">
          <option value="">Select a school</option>
          <option v-for="school in schools" :key="school.id" :value="school.id">
            {{ school.name }} ({{ school.code }})
          </option>
        </select>
      </div>
      <!-- Branch Info -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block font-medium mb-1">Branch Name *</label>
          <input v-model="form.name" type="text" required class="input-field" placeholder="Enter branch name" />
        </div>
        <div>
          <label class="block font-medium mb-1">Email</label>
          <input v-model="form.email" type="email" class="input-field" placeholder="Branch email (optional)" />
        </div>
        <div>
          <label class="block font-medium mb-1">Mobile No</label>
          <input v-model="form.phone" type="text" class="input-field" placeholder="Branch phone (optional)" />
        </div>
        <div>
          <label class="block font-medium mb-1">Currency *</label>
          <input v-model="form.currency" type="text" required class="input-field" placeholder="e.g. INR, USD" />
        </div>
        <div>
          <label class="block font-medium mb-1">Currency Symbol *</label>
          <input v-model="form.currency_symbol" type="text" required class="input-field" placeholder="e.g. ₹, $" />
        </div>
        <div>
          <label class="block font-medium mb-1">City *</label>
          <input v-model="form.city" type="text" required class="input-field" placeholder="Branch city" />
        </div>
        <div>
          <label class="block font-medium mb-1">State *</label>
          <input v-model="form.state" type="text" required class="input-field" placeholder="Branch state" />
        </div>
      </div>
      <div>
        <label class="block font-medium mb-1">Address</label>
        <textarea v-model="form.address" class="input-field" rows="2" placeholder="Branch address (optional)"></textarea>
      </div>
      <!-- File Uploads -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block font-medium mb-1">System Logo</label>
          <input ref="systemLogoInput" type="file" accept="image/*" class="input-field" @change="onFileChange('system_logo', $event)" />
        </div>
        <div>
          <label class="block font-medium mb-1">Text Logo</label>
          <input ref="textLogoInput" type="file" accept="image/*" class="input-field" @change="onFileChange('text_logo', $event)" />
        </div>
        <div>
          <label class="block font-medium mb-1">Printing Logo</label>
          <input ref="printingLogoInput" type="file" accept="image/*" class="input-field" @change="onFileChange('printing_logo', $event)" />
        </div>
        <div>
          <label class="block font-medium mb-1">Report Card Design (optional)</label>
          <input ref="reportCardInput" type="file" accept="image/*,application/pdf" class="input-field" @change="onFileChange('report_card_design', $event)" />
        </div>
      </div>
      <!-- Submit -->
      <div class="flex justify-end gap-3">
        <NuxtLink to="/branches" class="btn-secondary">Cancel</NuxtLink>
        <button type="submit" class="btn-primary" :disabled="loading || !form.schoolId || schoolsLoading || schools.length === 0">
          {{ loading ? 'Creating...' : 'Create Branch' }}
        </button>
      </div>
      <div v-if="error" class="text-red-600 mt-4">{{ error }}</div>
      <div v-if="success" class="text-green-600 mt-4">Branch created successfully!</div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useBranches } from '~/composables/useBranches';
import { useSchools } from '~/composables/useSchools';

const { createBranch, loading, error } = useBranches();
const { schools, fetchSchools } = useSchools();

const form = ref({
  schoolId: '',
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

const success = ref(false);
const schoolsLoading = ref(true);

const onFileChange = (field, event) => {
  fileInputs.value[field] = event.target.files[0];
};

// Inherit currency/currency_symbol from selected school
watch(() => form.value.schoolId, (schoolId) => {
  const school = schools.value.find(s => s.id === schoolId);
  if (school) {
    form.value.currency = school.currency || '';
    form.value.currency_symbol = school.currency_symbol || '';
  }
});

const handleSubmit = async () => {
  // Debug logging
  console.log('Submitting branch form');
  console.log('Selected schoolId:', form.value.schoolId);
  console.log('Schools:', schools.value);
  success.value = false;
  const formData = new FormData();
  formData.append('school_id', form.value.schoolId);
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
  const result = await createBranch(formData);
  if (result) {
    success.value = true;
    setTimeout(() => {
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('branch-updated'));
      success.value = false;
      window.location.href = '/branches';
    }, 1500);
  }
};

onMounted(async () => {
  schoolsLoading.value = true;
  await fetchSchools();
  schoolsLoading.value = false;
});
</script>

<style scoped>
.input-field {
  @apply block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm;
}
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}
.btn-secondary {
  @apply bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500;
}
</style> 