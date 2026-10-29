<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="loading || isLoadingSettings" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <span class="ml-3 text-gray-600 dark:text-gray-400">Loading fee configuration...</span>
    </div>

    <div v-else-if="loadError" class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <p>{{ loadError }}</p>
      <button type="button" class="mt-2 underline" @click="loadFeeSettings">Retry</button>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- General Fee Settings -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          General Fee Settings
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
              >Currency Symbol</label
            >
            <input
              v-model="feeSettings.currencySymbol"
              type="text"
              class="input-field"
              placeholder="₹"
              maxlength="5"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Currency is set in School Information tab
            </p>
          </div>
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
              >Default Payment Due Days</label
            >
            <input
              v-model="feeSettings.defaultPaymentDueDays"
              type="number"
              :class="['input-field', fieldErrors.defaultPaymentDueDays ? 'border-red-500' : '']"
              placeholder="15"
              min="1"
              max="90"
            />
            <p v-if="fieldErrors.defaultPaymentDueDays" class="mt-1 text-xs text-red-600">
              {{ fieldErrors.defaultPaymentDueDays }}
            </p>
          </div>
        </div>
      </div>

      <!-- Fee Structure Defaults -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Fee Structure Defaults
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
              >Default Payment Model</label
            >
            <select v-model="feeSettings.defaultPaymentModel" class="input-field">
              <option value="class_based">Class-based (Default)</option>
              <option value="monthly">Monthly</option>
              <option value="term_based">Term-based</option>
            </select>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Default payment model for new fee structures
            </p>
          </div>
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
              >Default Installments Count</label
            >
            <input
              v-model="feeSettings.defaultInstallmentsCount"
              type="number"
              class="input-field"
              placeholder="4"
              min="2"
              max="12"
            />
          </div>
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
              >Default Monthly Months</label
            >
            <input
              v-model="feeSettings.defaultMonthlyMonths"
              type="number"
              class="input-field"
              placeholder="12"
              min="1"
              max="12"
            />
          </div>
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
              >Late Fee Percentage</label
            >
            <div class="relative">
              <input
                v-model="feeSettings.lateFeePercentage"
                type="number"
                :class="['input-field pr-8', fieldErrors.lateFeePercentage ? 'border-red-500' : '']"
                placeholder="5"
                min="0"
                max="50"
                step="0.1"
              />
              <span class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >%</span
              >
            </div>
            <p v-if="fieldErrors.lateFeePercentage" class="mt-1 text-xs text-red-600">
              {{ fieldErrors.lateFeePercentage }}
            </p>
          </div>
        </div>
      </div>

      <!-- Payment Settings -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Settings</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
              >Default Payment Methods</label
            >
            <div class="space-y-2">
              <div class="flex items-center">
                <input
                  v-model="feeSettings.paymentMethods.cash"
                  type="checkbox"
                  id="cash"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label for="cash" class="ml-2 text-sm text-gray-700 dark:text-gray-300">Cash</label>
              </div>
              <div class="flex items-center">
                <input
                  v-model="feeSettings.paymentMethods.bank_transfer"
                  type="checkbox"
                  id="bank_transfer"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label for="bank_transfer" class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                  >Bank Transfer</label
                >
              </div>
              <div class="flex items-center">
                <input
                  v-model="feeSettings.paymentMethods.cheque"
                  type="checkbox"
                  id="cheque"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label for="cheque" class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                  >Cheque</label
                >
              </div>
              <div class="flex items-center">
                <input
                  v-model="feeSettings.paymentMethods.online"
                  type="checkbox"
                  id="online"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label for="online" class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                  >Online Payment</label
                >
                <p class="ml-6 text-xs text-gray-500 dark:text-gray-400">
                  Adds Online to staff payment entry; gateway checkout and verification are not connected.
                </p>
              </div>
            </div>
          </div>
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
              >Payment Validation</label
            >
            <div class="space-y-2">
              <div class="flex items-center">
                <input
                  v-model="feeSettings.paymentValidation.requireTransactionId"
                  type="checkbox"
                  id="requireTransactionId"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  for="requireTransactionId"
                  class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  Require Transaction ID
                </label>
              </div>
              <div class="flex items-center">
                <input
                  v-model="feeSettings.paymentValidation.allowPartialPayments"
                  type="checkbox"
                  id="allowPartialPayments"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  for="allowPartialPayments"
                  class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  Allow Partial Payments
                </label>
              </div>
              <div class="flex items-center">
                <input
                  v-model="feeSettings.paymentValidation.autoGenerateReceipts"
                  type="checkbox"
                  id="autoGenerateReceipts"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  for="autoGenerateReceipts"
                  class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  Auto-generate Receipts
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Fee Categories & Types -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Fee Categories & Types
        </h3>
        <div class="space-y-4">
          <div>
            <label class="block font-medium mb-2 text-gray-700 dark:text-gray-300"
              >Default Fee Categories</label
            >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400"
                  >Tuition Fees</label
                >
                <input
                  v-model="feeSettings.defaultCategories.tuition"
                  type="text"
                  class="input-field"
                  placeholder="Tuition Fees"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400"
                  >Transportation</label
                >
                <input
                  v-model="feeSettings.defaultCategories.transportation"
                  type="text"
                  class="input-field"
                  placeholder="Transportation Fees"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400"
                  >Library</label
                >
                <input
                  v-model="feeSettings.defaultCategories.library"
                  type="text"
                  class="input-field"
                  placeholder="Library Fees"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400"
                  >Laboratory</label
                >
                <input
                  v-model="feeSettings.defaultCategories.laboratory"
                  type="text"
                  class="input-field"
                  placeholder="Laboratory Fees"
                />
              </div>
            </div>
          </div>
          <div>
            <label class="block font-medium mb-2 text-gray-700 dark:text-gray-300"
              >Fee Type Options</label
            >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400"
                  >One-time</label
                >
                <input
                  v-model="feeSettings.feeTypeOptions.oneTime"
                  type="text"
                  class="input-field"
                  placeholder="One-time"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400"
                  >Recurring</label
                >
                <input
                  v-model="feeSettings.feeTypeOptions.recurring"
                  type="text"
                  class="input-field"
                  placeholder="Recurring"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400"
                  >Variable</label
                >
                <input
                  v-model="feeSettings.feeTypeOptions.variable"
                  type="text"
                  class="input-field"
                  placeholder="Variable"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400"
                  >Optional</label
                >
                <input
                  v-model="feeSettings.feeTypeOptions.optional"
                  type="text"
                  class="input-field"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Invoice & Receipt Settings -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Invoice & Receipt Settings
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
              >Invoice Number Prefix</label
            >
            <input
              v-model="feeSettings.invoiceSettings.prefix"
              type="text"
              class="input-field"
              placeholder="INV"
              maxlength="10"
            />
          </div>
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
              >Receipt Number Prefix</label
            >
            <input
              v-model="feeSettings.invoiceSettings.receiptPrefix"
              type="text"
              class="input-field"
              placeholder="RCP"
              maxlength="10"
            />
          </div>
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
              >Auto-generate Invoice Numbers</label
            >
            <div class="flex items-center">
              <input
                v-model="feeSettings.invoiceSettings.autoGenerateNumbers"
                type="checkbox"
                id="autoGenerateNumbers"
                class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                for="autoGenerateNumbers"
                class="ml-2 text-sm text-gray-700 dark:text-gray-300"
              >
                Enable automatic numbering
              </label>
            </div>
          </div>
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
              >Invoice Due Date Calculation</label
            >
            <select v-model="feeSettings.invoiceSettings.dueDateCalculation" class="input-field">
              <option value="fixed_days">Fixed days from invoice date</option>
              <option value="month_end">End of month</option>
              <option value="next_month">Next month same date</option>
              <option value="custom">Custom calculation</option>
            </select>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Explicit fee-structure dates take precedence. Custom requires a date on the fee structure.
            </p>
          </div>
        </div>
      </div>

      <!-- Error Summary -->
      <div v-if="hasErrors" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 class="text-sm font-medium text-red-800 mb-2">Please correct the following errors:</h4>
        <ul class="text-sm text-red-700 space-y-1">
          <li v-for="(error, field) in fieldErrors" :key="field">• {{ error }}</li>
        </ul>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end">
        <button @click="saveSettings" class="btn-primary" :disabled="isSaving || hasErrors">
          <span
            v-if="isSaving"
            class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
          ></span>
          {{ isSaving ? 'Saving...' : 'Save Fee Configuration' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useFormValidation } from '~/composables/useFormValidation';
import { validationRules, validateForm } from '~/utils/validators';
import { Settings } from '~/api/administration/settings';

// Props
const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['save', 'update:loading']);

// Validation
const { fieldErrors, hasErrors, clearErrors, setFieldError, handleApiError } = useFormValidation();

// Reactive data
const feeSettings = reactive({
  currencySymbol: '₹',
  defaultPaymentDueDays: 15,
  defaultPaymentModel: 'monthly',
  defaultInstallmentsCount: 4,
  defaultMonthlyMonths: 12,
  lateFeePercentage: 5.0,
  paymentMethods: {
    cash: true,
    bank_transfer: true,
    cheque: true,
    online: false
  },
  paymentValidation: {
    requireTransactionId: false,
    allowPartialPayments: true,
    autoGenerateReceipts: true
  },
  defaultCategories: {
    tuition: 'Tuition Fees',
    transportation: 'Transportation Fees',
    library: 'Library Fees',
    laboratory: 'Laboratory Fees'
  },
  feeTypeOptions: {
    oneTime: 'One-time',
    recurring: 'Recurring',
    variable: 'Variable',
    optional: 'Optional'
  },
  invoiceSettings: {
    prefix: 'INV',
    receiptPrefix: 'RCP',
    autoGenerateNumbers: true,
    dueDateCalculation: 'fixed_days'
  }
});

const isSaving = ref(false);
const isLoadingSettings = ref(true);
const loadError = ref('');

const loadFeeSettings = async () => {
  isLoadingSettings.value = true;
  loadError.value = '';
  try {
    const response = await Settings.getFeeSettings();
    const saved = response?.data?.feeSettings;
    if (!response?.success || !saved) throw new Error('Fee settings could not be loaded.');
    const nestedKeys = [
      'paymentMethods',
      'paymentValidation',
      'defaultCategories',
      'feeTypeOptions',
      'invoiceSettings'
    ];
    for (const [key, value] of Object.entries(saved)) {
      if (!nestedKeys.includes(key)) feeSettings[key] = value;
    }
    for (const key of nestedKeys) {
      if (saved[key]) feeSettings[key] = { ...feeSettings[key], ...saved[key] };
    }
  } catch (error) {
    loadError.value = error?.message || 'Fee settings could not be loaded.';
  } finally {
    isLoadingSettings.value = false;
  }
};

onMounted(loadFeeSettings);

// Validation schema
const validationSchema = {
  defaultPaymentDueDays: [
    val => validationRules.required(val, 'Default Payment Due Days'),
    val => {
      if (val < 1 || val > 90) {
        return 'Payment due days must be between 1 and 90';
      }
      return null;
    }
  ],
  lateFeePercentage: [
    val => validationRules.required(val, 'Late Fee Percentage'),
    val => {
      if (val < 0 || val > 50) {
        return 'Late fee percentage must be between 0 and 50';
      }
      return null;
    }
  ]
};

// Methods
const saveSettings = async () => {
  // Clear previous errors
  clearErrors();

  // Validate form data
  const errors = validateForm(feeSettings, validationSchema);

  if (Object.keys(errors).length > 0) {
    // Set field errors
    Object.entries(errors).forEach(([field, message]) => {
      setFieldError(field, message);
    });
    return;
  }

  isSaving.value = true;
  try {
    await emit('save', feeSettings);
  } catch (error) {
    handleApiError(error);
  } finally {
    isSaving.value = false;
  }
};

// Expose methods for parent component
defineExpose({
  feeSettings,
  saveSettings
});
</script>
