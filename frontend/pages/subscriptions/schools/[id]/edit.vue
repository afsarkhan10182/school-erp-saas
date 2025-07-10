<template>
  <div class="container mx-auto py-8 max-w-4xl">
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Edit School Subscription</h1>
        <p class="text-gray-600 mt-1">View and update school and subscription details</p>
      </div>
      <NuxtLink to="/subscriptions" class="btn-secondary">Back to List</NuxtLink>
    </div>

    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600">Loading school details...</p>
    </div>
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <p class="mt-1 text-sm text-red-700">{{ error }}</p>
        </div>
      </div>
    </div>
    <form v-else @submit.prevent="handleSubmit" class="space-y-8">
      <!-- School Information -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-lg font-medium text-gray-900 mb-4">School Information</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">School Name *</label>
            <input v-model="form.schoolData.name" type="text" required class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">School Code *</label>
            <input v-model="form.schoolData.code" type="text" required class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input v-model="form.schoolData.email" type="email" required class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input v-model="form.schoolData.phone" type="tel" class="input-field" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea v-model="form.schoolData.address" rows="3" class="input-field"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input v-model="form.schoolData.city" type="text" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input v-model="form.schoolData.state" type="text" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input v-model="form.schoolData.country" type="text" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
            <input v-model="form.schoolData.postal_code" type="text" class="input-field" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input v-model="form.schoolData.website" type="url" class="input-field" />
          </div>
        </div>
      </div>
      <!-- Subscription Information -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Subscription Information</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Subscription Plan *</label>
            <select v-model="form.subscriptionData.plan_code" required class="input-field">
              <option value="">Select a plan</option>
              <option v-for="plan in plans" :key="plan.code" :value="plan.code">
                {{ plan.name }} - ₹{{ plan.price }}/{{ plan.billing_cycle }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status *</label>
            <select v-model="form.subscriptionData.status" required class="input-field">
              <option value="trial">Trial</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
            <input v-model="form.subscriptionData.start_date" type="date" required class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
            <input v-model="form.subscriptionData.end_date" type="date" required class="input-field" />
          </div>
        </div>
        <div v-if="selectedPlan" class="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 class="text-sm font-medium text-gray-900 mb-2">Plan Details</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span class="text-gray-500">Price:</span>
              <span class="font-medium">₹{{ selectedPlan.price }}/{{ selectedPlan.billing_cycle }}</span>
            </div>
            <div>
              <span class="text-gray-500">Max Students:</span>
              <span class="font-medium">{{ selectedPlan.max_students }}</span>
            </div>
            <div>
              <span class="text-gray-500">Max Staff:</span>
              <span class="font-medium">{{ selectedPlan.max_staff }}</span>
            </div>
            <div>
              <span class="text-gray-500">Max Branches:</span>
              <span class="font-medium">{{ selectedPlan.max_branches }}</span>
            </div>
          </div>
          <div class="mt-2">
            <span class="text-gray-500 text-sm">Modules:</span>
            <div class="flex flex-wrap gap-1 mt-1">
              <span v-for="module in selectedPlan.modules" :key="module" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {{ module }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <!-- Admin User Information -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-lg font-medium text-gray-900 mb-4">School Admin User</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            <input v-model="form.subscriptionData.admin_first_name" type="text" required class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            <input v-model="form.subscriptionData.admin_last_name" type="text" required class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input v-model="form.subscriptionData.admin_email" type="email" required class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input v-model="form.subscriptionData.admin_phone" type="tel" class="input-field" />
          </div>
        </div>
      </div>
      <!-- Submit Buttons -->
      <div class="flex justify-end gap-3">
        <NuxtLink to="/subscriptions" class="btn-secondary">Cancel</NuxtLink>
        <button type="submit" class="btn-primary" :disabled="loading">{{ loading ? 'Saving...' : 'Save Changes' }}</button>
      </div>
      <div v-if="success" class="text-green-600 mt-4">School updated successfully!</div>
      <div v-if="formError" class="text-red-600 mt-4">{{ formError }}</div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSubscriptions } from '~/composables/useSubscriptions';

const route = useRoute();
const router = useRouter();
const { fetchPlans, updateSchoolSubscription, fetchSchoolsWithSubscriptions } = useSubscriptions();

const plans = ref([]);
const loading = ref(false);
const error = ref('');
const success = ref(false);
const formError = ref('');

const form = ref({
  schoolData: {
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
  },
  subscriptionData: {
    plan_code: '',
    status: '',
    start_date: '',
    end_date: '',
    admin_first_name: '',
    admin_last_name: '',
    admin_email: '',
    admin_phone: ''
  }
});

const selectedPlan = computed(() => {
  return plans.value.find(plan => plan.code === form.value.subscriptionData.plan_code);
});

const loadSchool = async () => {
  loading.value = true;
  error.value = '';
  try {
    // Fetch plans
    const plansData = await fetchPlans({ is_active: true });
    plans.value = plansData?.plans || [];
    // Fetch school details
    const schoolsData = await fetchSchoolsWithSubscriptions({ id: route.params.id });
    const school = schoolsData?.schools?.[0];
    if (!school) throw new Error('School not found');
    // Populate form
    form.value.schoolData = {
      name: school.name,
      code: school.code,
      email: school.email,
      phone: school.phone,
      address: school.address,
      city: school.city,
      state: school.state,
      country: school.country,
      postal_code: school.postal_code,
      website: school.website
    };
    form.value.subscriptionData = {
      plan_code: school.subscription_plan,
      status: school.status,
      start_date: school.subscription_start_date?.split('T')[0] || '',
      end_date: school.subscription_end_date?.split('T')[0] || '',
      admin_first_name: school.admin_user?.first_name || '',
      admin_last_name: school.admin_user?.last_name || '',
      admin_email: school.admin_user?.email || '',
      admin_phone: school.admin_user?.phone || ''
    };
  } catch (e) {
    error.value = e?.message || 'Failed to load school details';
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  formError.value = '';
  success.value = false;
  try {
    // Only update subscription details (not school info for now)
    const result = await updateSchoolSubscription(route.params.id, form.value.subscriptionData);
    if (result) {
      success.value = true;
      setTimeout(() => success.value = false, 2000);
    }
  } catch (e) {
    formError.value = e?.message || 'Failed to update school';
  }
};

onMounted(loadSchool);
</script>

<style scoped>
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}
.btn-secondary {
  @apply bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500;
}
.input-field {
  @apply block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm;
}
</style> 