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
    </form>

    <!-- Toast Notifications -->
    <div v-if="showToast" :class="toastClasses" class="fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <svg v-if="toastType === 'success'" class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <svg v-else class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium">{{ toastMessage }}</p>
        </div>
        <div class="ml-auto pl-3">
          <button @click="hideToast" class="inline-flex text-gray-400 hover:text-gray-600">
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSubscriptions } from '~/composables/useSubscriptions';

const route = useRoute();
const router = useRouter();
const { fetchPlans, updateSchoolSubscription, fetchSchoolsWithSubscriptions } = useSubscriptions();

const plans = ref([]);
const loading = ref(false);
const error = ref('');
const formError = ref('');

// Toast notification state
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

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
    admin_phone: '',
    payment_amount: null,
    payment_currency: 'INR',
    payment_method: 'offline_cash'
  }
});

const selectedPlan = computed(() => {
  return plans.value.find(plan => plan.code === form.value.subscriptionData.plan_code);
});

// Toast notification methods
const showToastNotification = (message, type = 'success') => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => {
    hideToast();
  }, 5000);
};

const hideToast = () => {
  showToast.value = false;
};

const toastClasses = computed(() => {
  return toastType.value === 'success' 
    ? 'bg-green-50 border border-green-200 text-green-800' 
    : 'bg-red-50 border border-red-200 text-red-800';
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
      admin_phone: school.admin_user?.phone || '',
      payment_amount: school.payment_amount || null,
      payment_currency: school.payment_currency || 'INR',
      payment_method: school.payment_method || 'offline_cash'
    };
  } catch (e) {
    error.value = e?.message || 'Failed to load school details';
    showToastNotification(error.value, 'error');
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  formError.value = '';
  loading.value = true;
  try {
    // Send all form data - school, admin, and subscription
    const payload = {
      // Subscription data
      plan_code: form.value.subscriptionData.plan_code,
      status: form.value.subscriptionData.status,
      start_date: form.value.subscriptionData.start_date,
      end_date: form.value.subscriptionData.end_date,
      payment_amount: form.value.subscriptionData.payment_amount || null,
      payment_currency: form.value.subscriptionData.payment_currency || 'INR',
      payment_method: form.value.subscriptionData.payment_method || 'offline_cash',
      
      // School data (for updating school details)
      school: {
        name: form.value.schoolData.name,
        code: form.value.schoolData.code,
        email: form.value.schoolData.email,
        phone: form.value.schoolData.phone,
        address: form.value.schoolData.address,
        city: form.value.schoolData.city,
        state: form.value.schoolData.state,
        country: form.value.schoolData.country,
        postal_code: form.value.schoolData.postal_code,
        website: form.value.schoolData.website
      },
      
      // Admin data (for updating admin user)
      admin: {
        first_name: form.value.subscriptionData.admin_first_name,
        last_name: form.value.subscriptionData.admin_last_name,
        email: form.value.subscriptionData.admin_email,
        phone: form.value.subscriptionData.admin_phone
      }
    };

    console.log('Sending complete payload:', payload); // Debug log

    const result = await updateSchoolSubscription(route.params.id, payload);
    if (result) {
      // Show success toast and redirect
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('show-toast', {
          detail: {
            message: 'School and subscription updated successfully!',
            type: 'success'
          }
        });
        window.dispatchEvent(event);
      }
      // Redirect to list page
      setTimeout(() => {
        router.push('/subscriptions');
      }, 1000);
    }
  } catch (e) {
    const errorMsg = e?.message || 'Failed to update school subscription';
    formError.value = errorMsg;
    // Show error toast
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('show-toast', {
        detail: {
          message: errorMsg,
          type: 'error'
        }
      });
      window.dispatchEvent(event);
    }
  } finally {
    loading.value = false;
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