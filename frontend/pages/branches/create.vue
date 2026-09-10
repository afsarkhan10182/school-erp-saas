<template>
  <div class="container mx-auto py-8 max-w-3xl">
    <h1 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Add New Branch (Campus)</h1>
    <form
      @submit.prevent="handleSubmit"
      class="space-y-8 bg-white dark:bg-gray-800 p-6 rounded shadow"
    >
      <!-- School Selection -->
      <div>
        <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
          >Select School *</label
        >
        <div v-if="schoolsLoading" class="text-gray-500 dark:text-gray-400 mb-2">
          Loading schools...
        </div>
        <div v-else-if="schools.length === 0" class="text-red-600 dark:text-red-400 mb-2">
          No schools available. Please create a school first.
        </div>
        <select
          v-model="form.schoolId"
          required
          class="form-select"
          :disabled="schoolsLoading || schools.length === 0"
        >
          <option value="">Select a school</option>
          <option v-for="school in schools" :key="school.id" :value="school.id">
            {{ school.name }} ({{ school.code }})
          </option>
        </select>
      </div>
      <!-- Branch Info -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
            >Branch Name *</label
          >
          <input
            v-model="form.name"
            type="text"
            required
            class="form-input"
            placeholder="Enter branch name"
          />
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
            >Branch Code *</label
          >
          <input
            v-model="form.code"
            type="text"
            required
            class="form-input"
            placeholder="e.g., MAIN, NORTH, SOUTH"
          />
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Email *</label>
          <input
            v-model="form.email"
            type="email"
            required
            class="form-input"
            placeholder="Branch email"
          />
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Mobile No</label>
          <input
            v-model="form.phone"
            type="text"
            class="form-input"
            placeholder="Branch phone (optional)"
            @input="form.phone = form.phone.replace(/[^\d]/g, '')"
          />
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Currency *</label>
          <input
            v-model="form.currency"
            type="text"
            required
            class="form-input"
            placeholder="e.g. INR, USD"
          />
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
            >Currency Symbol *</label
          >
          <input
            v-model="form.currency_symbol"
            type="text"
            required
            class="form-input"
            placeholder="e.g. ₹, $"
          />
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">City *</label>
          <input
            v-model="form.city"
            type="text"
            required
            class="form-input"
            placeholder="Branch city"
          />
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">State *</label>
          <input
            v-model="form.state"
            type="text"
            required
            class="form-input"
            placeholder="Branch state"
          />
        </div>
      </div>
      <div>
        <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Address</label>
        <textarea
          v-model="form.address"
          class="form-input"
          rows="2"
          placeholder="Branch address (optional)"
        ></textarea>
      </div>
      <!-- File Uploads -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">System Logo</label>
          <input
            ref="systemLogoInput"
            type="file"
            accept="image/*"
            class="form-input"
            @change="onFileChange('system_logo', $event)"
          />
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Text Logo</label>
          <input
            ref="textLogoInput"
            type="file"
            accept="image/*"
            class="form-input"
            @change="onFileChange('text_logo', $event)"
          />
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
            >Printing Logo</label
          >
          <input
            ref="printingLogoInput"
            type="file"
            accept="image/*"
            class="form-input"
            @change="onFileChange('printing_logo', $event)"
          />
        </div>
        <div>
          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
            >Report Card Design (optional)</label
          >
          <input
            ref="reportCardInput"
            type="file"
            accept="image/*,application/pdf"
            class="form-input"
            @change="onFileChange('report_card_design', $event)"
          />
        </div>
      </div>
      <!-- Submit -->
      <div class="flex justify-end gap-3">
        <NuxtLink to="/branches" class="btn-secondary">Cancel</NuxtLink>
        <button
          type="submit"
          class="btn-primary"
          :disabled="
            loading ||
            !form.schoolId ||
            !form.name ||
            !form.code ||
            !form.email ||
            !form.currency ||
            !form.currency_symbol ||
            !form.city ||
            !form.state ||
            schoolsLoading ||
            schools.length === 0
          "
        >
          {{ loading ? 'Creating...' : 'Create Branch' }}
        </button>
      </div>
      <div v-if="error" class="text-red-600 dark:text-red-400 mt-4">{{ error }}</div>
      <div v-if="success" class="text-green-600 dark:text-green-400 mt-4">
        Branch created successfully!
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { useBranches } from '~/composables/useBranches';
import { useSubscriptions } from '~/composables/useSubscriptions';
import { useSchools } from '~/composables/useSchools';
import { useAuth } from '~/composables/useAuth';
import { useToast } from '~/composables/useToast';

const { isSuperAdmin } = useAuth();
const { showError } = useToast();

// Access control - only Super Admin can access branches
if (!isSuperAdmin.value) {
  showError('Access denied. Only Super Admin can manage branches.');
  await navigateTo('/dashboard');
}

const { createBranch, loading, error } = useBranches();
const { showError: toastError, showSuccess: toastSuccess } = useToast();
const { schools, fetchSchoolsWithSubscriptions } = useSubscriptions();

const form = ref({
  schoolId: '',
  name: '',
  code: '',
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
watch(
  () => form.value.schoolId,
  schoolId => {
    const school = schools.value.find(s => s.id === schoolId);
    if (school) {
      // Use subscription school data structure
      form.value.currency = school.currency || school.settings?.currency || 'INR';
      form.value.currency_symbol =
        school.currency_symbol || school.settings?.currency_symbol || '₹';
    }
  }
);

const handleSubmit = async () => {
  success.value = false;
  const formData = new FormData();
  formData.append('school_id', form.value.schoolId);
  formData.append('name', form.value.name);
  formData.append('code', form.value.code);
  formData.append('email', form.value.email);
  formData.append('phone', form.value.phone);
  formData.append('currency', form.value.currency);
  formData.append('currency_symbol', form.value.currency_symbol);
  formData.append('city', form.value.city);
  formData.append('state', form.value.state);
  formData.append('address', form.value.address);
  if (fileInputs.value.system_logo) formData.append('system_logo', fileInputs.value.system_logo);
  if (fileInputs.value.text_logo) formData.append('text_logo', fileInputs.value.text_logo);
  if (fileInputs.value.printing_logo)
    formData.append('printing_logo', fileInputs.value.printing_logo);
  if (fileInputs.value.report_card_design)
    formData.append('report_card_design', fileInputs.value.report_card_design);
  const result = await createBranch(formData);
  if (result) {
    toastSuccess('Branch created successfully');
    success.value = true;
    setTimeout(() => {
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('branch-updated'));
      success.value = false;
      navigateTo('/branches');
    }, 1500);
  } else if (error.value) {
    toastError(error.value);
  }
};

onMounted(async () => {
  schoolsLoading.value = true;
  await fetchSchoolsWithSubscriptions();
  schoolsLoading.value = false;
});
</script>

<style scoped>

.btn-primary {
  @apply bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500;
}
.btn-secondary {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500;
}
</style>
