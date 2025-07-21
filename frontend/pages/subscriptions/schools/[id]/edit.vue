<template>
  <div class="container mx-auto py-8 max-w-4xl">
    <!-- Header -->
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Edit School Subscription</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">Update school and subscription details</p>
      </div>
      <NuxtLink to="/subscriptions" class="btn-secondary">Back to List</NuxtLink>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600 dark:text-gray-400">Loading school details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
          <p class="mt-1 text-sm text-red-700 dark:text-red-300">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="handleSubmit" class="space-y-8">
      <!-- School Information -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">School Information</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">School Name *</label>
            <input v-model="form.schoolData.name" type="text" required class="input-field" placeholder="Enter school name" />
          </div>
          <div>
            <div class="flex justify-between items-center mb-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">School Code *</label>
              <span v-if="form.schoolData.code && !isSchoolCodeValid" class="text-xs text-red-600 dark:text-red-400">
                Must be 2-20 alphanumeric characters
              </span>
            </div>
            <input 
              v-model="form.schoolData.code" 
              type="text" 
              required 
              :class="[
                'input-field', 
                form.schoolData.code && !isSchoolCodeValid ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
              ]" 
              placeholder="e.g., SCHOOL001" 
              @input="validateSchoolCode"
            />
          </div>
          <div>
            <div class="flex justify-between items-center mb-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email *</label>
              <span v-if="emailError" class="text-xs text-red-600 dark:text-red-400">
                {{ emailError }}
              </span>
            </div>
            <input
              v-model="form.schoolData.email"
              type="email"
              required
              :class="[
                'input-field',
                emailError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
              ]"
              placeholder="Enter school email"
              @input="validateSchoolEmail"
              @blur="validateSchoolEmail"
            />
            <p v-if="!emailError && form.schoolData.email" class="mt-1 text-xs text-green-600 dark:text-green-400">
              ✓ Valid email format
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <input
              v-model="form.schoolData.phone"
              type="tel"
              class="input-field"
              placeholder="Enter phone number"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
            <select v-model="form.schoolData.currency" class="input-field" @change="autoFillCurrencySymbol">
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency Symbol</label>
            <input v-model="form.schoolData.currency_symbol" type="text" class="input-field" placeholder="e.g. ₹, $" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">System Logo</label>
            <input ref="systemLogoInput" type="file" accept="image/*" class="input-field" @change="onFileChange('system_logo', $event)" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Text Logo</label>
            <input ref="textLogoInput" type="file" accept="image/*" class="input-field" @change="onFileChange('text_logo', $event)" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Printing Logo</label>
            <input ref="printingLogoInput" type="file" accept="image/*" class="input-field" @change="onFileChange('printing_logo', $event)" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Report Card Design (optional)</label>
            <input ref="reportCardInput" type="file" accept="image/*,application/pdf" class="input-field" @change="onFileChange('report_card_design', $event)" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
            <textarea
              v-model="form.schoolData.address"
              rows="3"
              class="input-field"
              placeholder="Enter school address"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
            <input
              v-model="form.schoolData.city"
              type="text"
              class="input-field"
              placeholder="Enter city"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
            <input
              v-model="form.schoolData.state"
              type="text"
              class="input-field"
              placeholder="Enter state"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
            <input
              v-model="form.schoolData.country"
              type="text"
              class="input-field"
              placeholder="Enter country"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Postal Code</label>
            <input
              v-model="form.schoolData.postal_code"
              type="text"
              class="input-field"
              placeholder="Enter postal code"
            />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
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
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mt-8">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Subscription Information</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Subscription Plan *</label>
            <select v-model="form.subscriptionData.plan_code" required class="input-field">
              <option value="">Select a plan</option>
              <option v-for="plan in plans" :key="plan.code" :value="plan.code">
                {{ plan.name }} - ₹{{ plan.price }}/{{ plan.billing_cycle }}
              </option>
            </select>
          </div>
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Status *</label>
            <select v-model="form.subscriptionData.status" required class="input-field">
              <option value="trial">Trial</option>
              <option value="active">Active</option>
              <option value="lifetime">Lifetime</option>
              <option value="suspended">Suspended</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div v-if="form.subscriptionData.status === 'trial'">
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Trial Days</label>
            <input v-model.number="form.subscriptionData.trial_days" type="number" min="1" class="input-field" @input="autoSetTrialEndDate" />
          </div>
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Start Date *</label>
            <input v-model="form.subscriptionData.start_date" type="date" required class="input-field" @change="autoSetTrialEndDate" />
          </div>
          <div v-if="form.subscriptionData.status !== 'lifetime'">
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">End Date</label>
            <input v-model="form.subscriptionData.end_date" type="date" class="input-field" />
          </div>
        </div>

        <!-- Plan Details Preview -->
        <div v-if="selectedPlan" class="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Plan Details</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span class="text-gray-500 dark:text-gray-400">Price:</span>
              <span class="font-medium text-gray-900 dark:text-white">₹{{ selectedPlan.price }}/{{ selectedPlan.billing_cycle }}</span>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Max Students:</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ selectedPlan.max_students }}</span>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Max Staff:</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ selectedPlan.max_staff }}</span>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Max Branches:</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ selectedPlan.max_branches }}</span>
            </div>
          </div>
          <div class="mt-2">
            <span class="text-gray-500 dark:text-gray-400 text-sm">Modules:</span>
            <div class="flex flex-wrap gap-1 mt-1">
              <span
                v-for="module in selectedPlan.modules"
                :key="module"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
              >
                {{ module }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- School Admin User -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mt-8">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">School Admin User</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">First Name *</label>
            <input v-model="form.subscriptionData.admin_first_name" type="text" required class="input-field" />
          </div>
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Last Name *</label>
            <input v-model="form.subscriptionData.admin_last_name" type="text" required class="input-field" />
          </div>
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Email *</label>
            <input v-model="form.subscriptionData.admin_email" type="email" required class="input-field" @blur="validateUniqueEmail('admin')" />
            <span v-if="adminEmailError" class="text-red-500 text-xs">{{ adminEmailError }}</span>
          </div>
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Phone</label>
            <input v-model="form.subscriptionData.admin_phone" type="text" class="input-field" @input="form.subscriptionData.admin_phone = form.subscriptionData.admin_phone.replace(/[^\d]/g, '')" />
          </div>
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">New Password (optional)</label>
            <div class="relative">
              <input :type="showAdminPassword ? 'text' : 'password'" v-model="form.subscriptionData.admin_password" class="input-field pr-10" placeholder="Leave blank to keep current password" />
              <button type="button" @click="toggleAdminPassword" class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none">
                <component :is="showAdminPassword ? EyeOff : Eye" class="w-5 h-5" />
              </button>
            </div>
            <button type="button" class="btn-secondary mt-2" @click="generatePassword">Generate New Password</button>
          </div>
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Role</label>
            <select v-model="form.subscriptionData.admin_role" class="input-field">
              <option value="school_admin">School Admin</option>
              <option value="accountant">Accountant</option>
              <option value="admission_clerk">Admission Clerk</option>
              <option value="custom">Custom Role</option>
            </select>
          </div>
          <div class="col-span-2 flex items-center mt-2">
            <input type="checkbox" v-model="form.subscriptionData.send_email" class="mr-2" />
            <span class="text-gray-700 dark:text-gray-300">Send new password to email (if password changed)</span>
          </div>
        </div>
      </div>

      <!-- Payment Information (Optional) -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mt-8">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Payment Information (Optional)</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Payment Amount</label>
            <input v-model="form.subscriptionData.payment_amount" type="number" step="0.01" class="input-field" placeholder="Enter amount" />
          </div>
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Payment Method</label>
            <select v-model="form.subscriptionData.payment_method" class="input-field">
              <option value="offline_cash">Cash</option>
              <option value="offline_cheque">Cheque</option>
              <option value="offline_bank_transfer">Bank Transfer</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
            </select>
          </div>
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Currency</label>
            <select v-model="form.subscriptionData.payment_currency" class="input-field">
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">TRX ID (optional)</label>
            <input v-model="form.subscriptionData.trx_id" type="text" class="input-field" placeholder="Transaction ID, Cheque No, etc." />
          </div>
          <div class="col-span-2">
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Notes (optional)</label>
            <textarea v-model="form.subscriptionData.notes" class="input-field" rows="2" placeholder="Bank reference, remarks, etc."></textarea>
          </div>
        </div>
      </div>

      <!-- Submit Buttons -->
      <div class="flex justify-end gap-3">
        <NuxtLink to="/subscriptions" class="btn-secondary">
          Cancel
        </NuxtLink>
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Saving...' : 'Save Changes' }}
        </button>
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
import { Eye, EyeOff } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const { plans, fetchPlans, fetchSchoolsWithSubscriptions, updateSchoolSubscription } = useSubscriptions();

const loading = ref(false);
const error = ref('');
const formError = ref('');
const emailError = ref('');
const adminEmailError = ref('');
const isSchoolCodeValid = ref(true);

// Toast notification state
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

// File inputs
const systemLogoInput = ref(null);
const textLogoInput = ref(null);
const printingLogoInput = ref(null);
const reportCardInput = ref(null);
const fileInputs = ref({});

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
    website: '',
    currency: 'INR',
    currency_symbol: '₹'
  },
  subscriptionData: {
    plan_code: '',
    status: '',
    start_date: '',
    end_date: '',
    trial_days: 30,
    admin_first_name: '',
    admin_last_name: '',
    admin_email: '',
    admin_phone: '',
    admin_password: '',
    admin_role: 'school_admin',
    send_email: false,
    payment_amount: '',
    payment_currency: 'INR',
    payment_method: 'offline_cash',
    trx_id: '',
    notes: ''
  }
});

// File handling
const onFileChange = (field, event) => {
  fileInputs.value[field] = event.target.files[0];
};

// School code validation
const validateSchoolCode = () => {
  const code = form.value.schoolData.code;
  if (!code) {
    isSchoolCodeValid.value = false;
    return false;
  }
  const codeRegex = /^[a-zA-Z0-9]{2,20}$/;
  isSchoolCodeValid.value = codeRegex.test(code);
  return isSchoolCodeValid.value;
};

// School email validation
const validateSchoolEmail = () => {
  const email = form.value.schoolData.email;
  if (!email) {
    emailError.value = 'Email is required';
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    emailError.value = 'Please enter a valid email address';
    return false;
  }
  
  emailError.value = '';
  return true;
};

// Admin email validation
const validateAdminEmail = () => {
  const email = form.value.subscriptionData.admin_email;
  if (!email) {
    adminEmailError.value = 'Admin email is required';
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    adminEmailError.value = 'Please enter a valid email address';
    return false;
  }
  
  adminEmailError.value = '';
  return true;
};

// Validate unique email (frontend only)
const validateUniqueEmail = (type) => {
  const email = form.value.subscriptionData.admin_email;
  const schoolCode = form.value.schoolData.code;
  const schoolName = form.value.schoolData.name;

  if (type === 'admin') {
    if (email.toLowerCase() === schoolCode.toLowerCase() || email.toLowerCase() === schoolName.toLowerCase()) {
      adminEmailError.value = 'Email cannot be the same as School Code or Name.';
      return false;
    }
  }
  adminEmailError.value = '';
  return true;
};

// Form validation
const validateForm = () => {
  const isSchoolEmailValid = validateSchoolEmail();
  const isAdminEmailValid = validateAdminEmail();
  const isCodeValid = validateSchoolCode();
  
  return isSchoolEmailValid && isAdminEmailValid && isCodeValid;
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

// Auto-fill currency symbol when currency is selected
const autoFillCurrencySymbol = () => {
  if (form.value.schoolData.currency === 'INR') {
    form.value.schoolData.currency_symbol = '₹';
  } else if (form.value.schoolData.currency === 'USD') {
    form.value.schoolData.currency_symbol = '$';
  } else if (form.value.schoolData.currency === 'EUR') {
    form.value.schoolData.currency_symbol = '€';
  } else {
    form.value.schoolData.currency_symbol = '';
  }
};

// Auto-set end date for trial status
const autoSetTrialEndDate = () => {
  if (form.value.subscriptionData.status === 'trial') {
    const startDate = new Date(form.value.subscriptionData.start_date);
    const trialDays = form.value.subscriptionData.trial_days;
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + trialDays);
    form.value.subscriptionData.end_date = endDate.toISOString().split('T')[0];
  }
};

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
    await fetchPlans({ is_active: true });
    
    // Fetch school details
    const schoolsData = await fetchSchoolsWithSubscriptions({ id: route.params.id });
    const school = schoolsData?.data?.schools?.[0];
    if (!school) throw new Error('School not found');
    
    // Populate form
    form.value.schoolData = {
      name: school.name || '',
      code: school.code || '',
      email: school.email || '',
      phone: school.phone || '',
      address: school.address || '',
      city: school.city || '',
      state: school.state || '',
      country: school.country || 'India',
      postal_code: school.postal_code || '',
      website: school.website || '',
      currency: school.currency || 'INR',
      currency_symbol: school.settings?.currency_symbol || '₹'
    };
    
    form.value.subscriptionData = {
      plan_code: school.subscription_plan || '',
      status: school.status || '',
      start_date: school.subscription_start_date?.split('T')[0] || '',
      end_date: school.subscription_end_date?.split('T')[0] || '',
      trial_days: 30,
      admin_first_name: school.admin_user?.first_name || '',
      admin_last_name: school.admin_user?.last_name || '',
      admin_email: school.admin_user?.email || '',
      admin_phone: school.admin_user?.phone || '',
      admin_password: '',
      admin_role: school.admin_user?.role || 'school_admin',
      send_email: false,
      payment_amount: '',
      payment_currency: 'INR',
      payment_method: 'offline_cash',
      trx_id: '',
      notes: ''
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
  
  // Validate form before submission
  if (!validateForm()) {
    showToastNotification('Please fix the validation errors', 'error');
    return;
  }
  
  loading.value = true;
  try {
    // Use FormData for file uploads (exactly like create form)
    const formData = new FormData();
    
    // Append form data as JSON strings (same as create form)
    formData.append('schoolData', JSON.stringify(form.value.schoolData));
    formData.append('subscriptionData', JSON.stringify(form.value.subscriptionData));

    // File fields
    if (fileInputs.value.system_logo) formData.append('system_logo', fileInputs.value.system_logo);
    if (fileInputs.value.text_logo) formData.append('text_logo', fileInputs.value.text_logo);
    if (fileInputs.value.printing_logo) formData.append('printing_logo', fileInputs.value.printing_logo);
    if (fileInputs.value.report_card_design) formData.append('report_card_design', fileInputs.value.report_card_design);

    // Call composable (same pattern as create form)
    const result = await updateSchoolSubscription(route.params.id, formData);
    
    if (result) {
      showToastNotification('School and subscription updated successfully!', 'success');
      setTimeout(() => {
        router.push('/subscriptions');
      }, 1500);
    } else {
      throw new Error('Failed to update school subscription');
    }
  } catch (e) {
    const errorMsg = e?.message || 'Failed to update school subscription';
    formError.value = errorMsg;
    showToastNotification(errorMsg, 'error');
  } finally {
    loading.value = false;
  }
};

// Password visibility toggle
const showAdminPassword = ref(false);
const toggleAdminPassword = () => {
  showAdminPassword.value = !showAdminPassword.value;
};

onMounted(loadSchool);

// Set page title
useHead({
  title: 'Edit School - School ERP'
});
</script>

<style scoped>
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500;
}

.input-field {
  @apply block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white sm:text-sm;
}
</style> 