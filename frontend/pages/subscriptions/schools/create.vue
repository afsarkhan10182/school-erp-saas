<template>
  <div class="container mx-auto py-8 max-w-4xl">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Add New School</h1>
      <p class="text-gray-600 mt-1">Create a new school with subscription plan and admin user</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600">Creating school...</p>
    </div>

    <!-- Error State -->
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

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="space-y-8">
      <!-- School Information -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-lg font-medium text-gray-900 mb-4">School Information</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">School Name *</label>
            <input v-model="form.schoolData.name" type="text" required class="input-field" placeholder="Enter school name" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">School Code *</label>
            <input v-model="form.schoolData.code" type="text" required class="input-field" placeholder="Enter school code" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Branch Name (First Branch) *</label>
            <input v-model="form.schoolData.branch_name" type="text" required class="input-field" placeholder="Enter first branch name" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Currency *</label>
            <input v-model="form.schoolData.currency" type="text" required class="input-field" placeholder="e.g. INR, USD" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Currency Symbol *</label>
            <input v-model="form.schoolData.currency_symbol" type="text" required class="input-field" placeholder="e.g. ₹, $" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">System Logo</label>
            <input ref="systemLogoInput" type="file" accept="image/*" class="input-field" @change="onFileChange('system_logo', $event)" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Text Logo</label>
            <input ref="textLogoInput" type="file" accept="image/*" class="input-field" @change="onFileChange('text_logo', $event)" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Printing Logo</label>
            <input ref="printingLogoInput" type="file" accept="image/*" class="input-field" @change="onFileChange('printing_logo', $event)" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Report Card Design (optional)</label>
            <input ref="reportCardInput" type="file" accept="image/*,application/pdf" class="input-field" @change="onFileChange('report_card_design', $event)" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              v-model="form.schoolData.email"
              type="email"
              required
              class="input-field"
              placeholder="Enter school email"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              v-model="form.schoolData.phone"
              type="tel"
              class="input-field"
              placeholder="Enter phone number"
            />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              v-model="form.schoolData.address"
              rows="3"
              class="input-field"
              placeholder="Enter school address"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              v-model="form.schoolData.city"
              type="text"
              class="input-field"
              placeholder="Enter city"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input
              v-model="form.schoolData.state"
              type="text"
              class="input-field"
              placeholder="Enter state"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input
              v-model="form.schoolData.country"
              type="text"
              class="input-field"
              placeholder="Enter country"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
            <input
              v-model="form.schoolData.postal_code"
              type="text"
              class="input-field"
              placeholder="Enter postal code"
            />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input
              v-model="form.schoolData.website"
              type="url"
              class="input-field"
              placeholder="Enter website URL"
            />
          </div>
        </div>
      </div>

      <!-- Subscription Information -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Subscription Information</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Subscription Plan *</label>
            <select
              v-model="form.subscriptionData.plan_code"
              required
              class="input-field"
              @change="onPlanChange"
            >
              <option value="">Select a plan</option>
              <option v-for="plan in plans" :key="plan.code" :value="plan.code">
                {{ plan.name }} - ₹{{ plan.price }}/{{ plan.billing_cycle }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status *</label>
            <select
              v-model="form.subscriptionData.status"
              required
              class="input-field"
            >
              <option value="trial">Trial</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
            <input
              v-model="form.subscriptionData.start_date"
              type="date"
              required
              class="input-field"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
            <input
              v-model="form.subscriptionData.end_date"
              type="date"
              required
              class="input-field"
            />
          </div>
        </div>

        <!-- Plan Details Preview -->
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
              <span
                v-for="module in selectedPlan.modules"
                :key="module"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
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
            <input
              v-model="form.subscriptionData.admin_first_name"
              type="text"
              required
              class="input-field"
              placeholder="Enter first name"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            <input
              v-model="form.subscriptionData.admin_last_name"
              type="text"
              required
              class="input-field"
              placeholder="Enter last name"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              v-model="form.subscriptionData.admin_email"
              type="email"
              required
              class="input-field"
              placeholder="Enter admin email"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              v-model="form.subscriptionData.admin_phone"
              type="tel"
              class="input-field"
              placeholder="Enter phone number"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div class="flex gap-2">
              <input
                v-model="form.subscriptionData.admin_password"
                type="text"
                class="input-field flex-1"
                placeholder="Enter password or leave blank for auto-generation"
              />
              <button
                type="button"
                @click="generatePassword"
                class="btn-secondary whitespace-nowrap"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Information (Optional) -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Payment Information (Optional)</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
            <input
              v-model="form.subscriptionData.payment_amount"
              type="number"
              step="0.01"
              class="input-field"
              placeholder="Enter amount"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              v-model="form.subscriptionData.payment_method"
              class="input-field"
            >
              <option value="offline_cash">Cash</option>
              <option value="offline_cheque">Cheque</option>
              <option value="offline_bank_transfer">Bank Transfer</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select
              v-model="form.subscriptionData.payment_currency"
              class="input-field"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Submit Buttons -->
      <div class="flex justify-end gap-3">
        <NuxtLink to="/subscriptions" class="btn-secondary">
          Cancel
        </NuxtLink>
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Creating...' : 'Create School' }}
        </button>
      </div>
    </form>

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3 text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mt-4">School Created Successfully!</h3>
          <div class="mt-4 text-sm text-gray-600">
            <p><strong>School:</strong> {{ createdSchool?.name }}</p>
            <p><strong>Admin Email:</strong> {{ createdSchool?.admin_user?.email }}</p>
            <p v-if="createdSchool?.admin_user?.password" class="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <strong>Admin Password:</strong> {{ createdSchool.admin_user.password }}
            </p>
          </div>
          <div class="mt-6 flex justify-center gap-3">
            <button @click="closeSuccessModal" class="btn-secondary">
              Close
            </button>
            <NuxtLink to="/subscriptions" class="btn-primary">
              View All Schools
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSubscriptions } from '~/composables/useSubscriptions';

const { plans, loading, error, createSchoolWithSubscription, fetchPlans } = useSubscriptions();

const form = ref({
  schoolData: {
    name: '',
    code: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    postal_code: '',
    website: '',
    branch_name: '',
    currency: '',
    currency_symbol: ''
  },
  subscriptionData: {
    plan_code: '',
    status: 'trial',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    admin_first_name: '',
    admin_last_name: '',
    admin_email: '',
    admin_phone: '',
    admin_password: '',
    payment_amount: '',
    payment_method: 'offline_cash',
    payment_currency: 'INR'
  }
});

const showSuccessModal = ref(false);
const createdSchool = ref(null);
const systemLogoInput = ref(null);
const textLogoInput = ref(null);
const printingLogoInput = ref(null);
const reportCardInput = ref(null);

const fileInputs = ref({});
const onFileChange = (field, event) => {
  fileInputs.value[field] = event.target.files[0];
};

// Computed property for selected plan
const selectedPlan = computed(() => {
  return plans.value.find(plan => plan.code === form.value.subscriptionData.plan_code);
});

// On plan change, set end date based on billing cycle
const onPlanChange = () => {
  if (selectedPlan.value) {
    const startDate = new Date(form.value.subscriptionData.start_date);
    let endDate = new Date(startDate);
    
    switch (selectedPlan.value.billing_cycle) {
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      case 'lifetime':
        endDate.setFullYear(endDate.getFullYear() + 100); // Set to far future
        break;
    }
    
    form.value.subscriptionData.end_date = endDate.toISOString().split('T')[0];
  }
};

// Generate random password
const generatePassword = () => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  form.value.subscriptionData.admin_password = password;
};

// Handle form submission
const handleSubmit = async () => {
  try {
    const formData = new FormData();
    // School fields
    for (const [key, value] of Object.entries(form.value.schoolData)) {
      formData.append(key, value ?? '');
    }
    // Subscription fields (flattened for backend compatibility)
    for (const [key, value] of Object.entries(form.value.subscriptionData)) {
      formData.append(key, value ?? '');
    }
    // File fields
    if (fileInputs.value.system_logo) formData.append('system_logo', fileInputs.value.system_logo);
    if (fileInputs.value.text_logo) formData.append('text_logo', fileInputs.value.text_logo);
    if (fileInputs.value.printing_logo) formData.append('printing_logo', fileInputs.value.printing_logo);
    if (fileInputs.value.report_card_design) formData.append('report_card_design', fileInputs.value.report_card_design);
    // Call composable
    const result = await createSchoolWithSubscription(formData);
    if (result) {
      createdSchool.value = result;
      showSuccessModal.value = true;
    }
  } catch (err) {
    console.error('Error creating school:', err);
  }
};

// Close success modal
const closeSuccessModal = () => {
  showSuccessModal.value = false;
  createdSchool.value = null;
};

// Fetch plans on mount
onMounted(async () => {
  await fetchPlans({ is_active: true });
});

// Set page title
useHead({
  title: 'Add School - School ERP'
});
</script>

<style scoped>
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500;
}

.input-field {
  @apply block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm;
}
</style> 