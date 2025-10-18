<template>
  <div class="container mx-auto py-8 max-w-4xl">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Add New School</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        Create a new school with subscription plan and admin user
      </p>
      <div
        class="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">
              What happens when you create a school?
            </h3>
            <div class="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <ul class="list-disc list-inside space-y-1">
                <li>A new school record is created in the schools table</li>
                <li>
                  A first branch is automatically created (e.g., "Main Branch" or your specified
                  name)
                </li>
                <li>A default academic year is created based on your starting month setting</li>
                <li>A school admin user is created with the credentials you provide</li>
                <li>Additional branches can be added later via the Branches section</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600 dark:text-gray-400">Creating school...</p>
    </div>

    <!-- Plans Loading State -->
    <div v-else-if="plansLoading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600 dark:text-gray-400">Loading subscription plans...</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6"
    >
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
          <p class="mt-1 text-sm text-red-700 dark:text-red-300">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Form -->
    <form
      v-if="!loading && !plansLoading && !error"
      @submit.prevent="handleSubmit"
      class="space-y-8"
    >
      <!-- School Information -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">School Information</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >School Name *</label
            >
            <input
              v-model="form.schoolData.name"
              type="text"
              required
              class="input-field"
              placeholder="Enter school name"
            />
          </div>
          <div>
            <div class="flex justify-between items-center mb-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >School Code *</label
              >
              <span
                v-if="form.schoolData.code && !isSchoolCodeValid"
                class="text-xs text-red-600 dark:text-red-400"
              >
                Must be 2-20 uppercase letters and numbers only
              </span>
            </div>
            <input
              v-model="form.schoolData.code"
              type="text"
              required
              :class="[
                'input-field',
                form.schoolData.code && !isSchoolCodeValid
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : ''
              ]"
              placeholder="e.g., TEST01 (uppercase letters and numbers only)"
              @input="validateSchoolCode"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Branch Name (First Branch) *</label
            >
            <input
              v-model="form.schoolData.branch_name"
              type="text"
              required
              class="input-field"
              placeholder="Enter first branch name"
            />
          </div>
          <div>
            <div class="flex justify-between items-center mb-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >Email *</label
              >
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
            <p
              v-if="!emailError && form.schoolData.email"
              class="mt-1 text-xs text-green-600 dark:text-green-400"
            >
              ✓ Valid email format
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Currency</label
            >
            <input
              v-model="form.schoolData.currency"
              type="text"
              class="input-field"
              placeholder="e.g. INR, USD"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Currency Symbol</label
            >
            <input
              v-model="form.schoolData.currency_symbol"
              type="text"
              class="input-field"
              placeholder="e.g. ₹, $"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Academic Year Starting Month</label
            >
            <select v-model="form.schoolData.starting_month" class="input-field">
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June (Default)</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              This determines when the academic year starts and how payment months are calculated
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Default Payment Model</label
            >
            <select v-model="form.schoolData.default_payment_model" class="input-field">
              <option value="class_based">Class-based (Default)</option>
              <option value="monthly">Monthly</option>
              <option value="term_based">Term-based</option>
            </select>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Default payment model for new fee structures
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Academic Year Type</label
            >
            <select v-model="form.schoolData.academic_year_start" class="input-field">
              <option value="academic">Academic Year (Custom starting month)</option>
              <option value="calendar">Calendar Year (January-December)</option>
            </select>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Academic: June-May or custom starting month, Calendar: January-December
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >City *</label
            >
            <input
              v-model="form.schoolData.city"
              type="text"
              required
              class="input-field"
              placeholder="Enter city"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >State *</label
            >
            <input
              v-model="form.schoolData.state"
              type="text"
              required
              class="input-field"
              placeholder="Enter state"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >System Logo</label
            >
            <input
              ref="systemLogoInput"
              type="file"
              accept="image/*"
              class="input-field"
              @change="onFileChange('system_logo', $event)"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Text Logo</label
            >
            <input
              ref="textLogoInput"
              type="file"
              accept="image/*"
              class="input-field"
              @change="onFileChange('text_logo', $event)"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Printing Logo</label
            >
            <input
              ref="printingLogoInput"
              type="file"
              accept="image/*"
              class="input-field"
              @change="onFileChange('printing_logo', $event)"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Report Card Design (optional)</label
            >
            <input
              ref="reportCardInput"
              type="file"
              accept="image/*,application/pdf"
              class="input-field"
              @change="onFileChange('report_card_design', $event)"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Phone</label
            >
            <input
              v-model="form.schoolData.phone"
              type="tel"
              class="input-field"
              placeholder="Enter phone number"
            />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Address</label
            >
            <textarea
              v-model="form.schoolData.address"
              rows="3"
              class="input-field"
              placeholder="Enter school address"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Country</label
            >
            <input
              v-model="form.schoolData.country"
              type="text"
              class="input-field"
              placeholder="Enter country"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Postal Code</label
            >
            <input
              v-model="form.schoolData.postal_code"
              type="text"
              class="input-field"
              placeholder="Enter postal code"
            />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Website</label
            >
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
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Subscription Information
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
              >Subscription Plan *</label
            >
            <select
              v-model="form.subscriptionData.plan_code"
              required
              class="input-field"
              :disabled="plansLoading"
            >
              <option value="">{{ plansLoading ? 'Loading plans...' : 'Select a plan' }}</option>
              <option v-for="plan in plans" :key="plan.code" :value="plan.code">
                {{ plan.name }} - ₹{{ plan.price }}/{{ plan.billing_cycle }}
              </option>
            </select>
          </div>
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Status *</label>
            <select
              v-model="form.subscriptionData.status"
              required
              class="input-field"
              @change="handleStatusChange"
            >
              <option value="trial">Trial</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div v-if="form.subscriptionData.status === 'trial'">
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
              >Trial Days *</label
            >
            <input
              v-model.number="form.subscriptionData.trial_days"
              type="number"
              min="1"
              class="input-field"
              :placeholder="selectedPlan?.trial_days || '30'"
              @input="autoSetTrialEndDate"
            />
          </div>
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
              >Start Date *</label
            >
            <input
              v-model="form.subscriptionData.start_date"
              type="date"
              required
              class="input-field"
              @change="autoSetTrialEndDate"
            />
          </div>
          <div
            v-if="
              form.subscriptionData.status !== 'lifetime' &&
              selectedPlan?.billing_cycle !== 'lifetime' &&
              selectedPlan?.code !== 'LIFETIME'
            "
          >
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">End Date</label>
            <input
              v-model="form.subscriptionData.end_date"
              type="date"
              :readonly="true"
              class="input-field bg-gray-100 dark:bg-gray-700"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Auto-calculated based on billing cycle
            </p>
          </div>
        </div>

        <!-- Plan Details Preview -->
        <div v-if="selectedPlan" class="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Plan Details</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">Price:</span>
              <span class="font-medium text-gray-900 dark:text-white"
                >₹{{ selectedPlan.price }}/{{ selectedPlan.billing_cycle }}</span
              >
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">Max Students:</span>
              <span class="font-medium text-gray-900 dark:text-white">{{
                selectedPlan.max_students
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">Max Staff:</span>
              <span class="font-medium text-gray-900 dark:text-white">{{
                selectedPlan.max_staff
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">Max Branches:</span>
              <span class="font-medium text-gray-900 dark:text-white">{{
                selectedPlan.max_branches
              }}</span>
            </div>
          </div>
          <div class="mt-3">
            <span class="text-gray-500 dark:text-gray-400 text-sm">Modules:</span>
            <div class="flex flex-wrap gap-2 mt-2">
              <span
                v-for="module in selectedPlan.modules"
                :key="module.code || module"
                class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-600 dark:bg-blue-700 text-white"
              >
                {{ module.name || module }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Admin User -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mt-8">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Admin User</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
              >First Name *</label
            >
            <input
              v-model="form.subscriptionData.admin_first_name"
              type="text"
              required
              class="input-field"
            />
          </div>
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
              >Last Name *</label
            >
            <input
              v-model="form.subscriptionData.admin_last_name"
              type="text"
              required
              class="input-field"
            />
          </div>
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Email *</label>
            <input
              v-model="form.subscriptionData.admin_email"
              type="email"
              required
              class="input-field"
              @blur="validateUniqueEmail('admin')"
            />
            <span v-if="adminEmailError" class="text-red-500 text-xs">{{ adminEmailError }}</span>
          </div>
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Phone</label>
            <input
              v-model="form.subscriptionData.admin_phone"
              type="text"
              class="input-field"
              @input="
                form.subscriptionData.admin_phone = form.subscriptionData.admin_phone.replace(
                  /[^\d]/g,
                  ''
                )
              "
            />
          </div>
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Password</label>
            <div class="relative">
              <input
                :type="showAdminPassword ? 'text' : 'password'"
                v-model="form.subscriptionData.admin_password"
                class="input-field pr-10"
                placeholder="Enter password or leave blank for auto-generation"
              />
              <button
                type="button"
                @click="toggleAdminPassword"
                class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
              >
                <component :is="showAdminPassword ? EyeOff : Eye" class="w-5 h-5" />
              </button>
            </div>
            <button type="button" class="btn-secondary mt-2" @click="generatePassword">
              Generate
            </button>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              <strong>Note:</strong> Enter a password or click "Generate" to auto-generate one. This
              password will be used for admin login.
            </p>
          </div>
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300">Role</label>
            <select v-model="form.subscriptionData.admin_role" class="input-field">
              <option value="admin">Admin</option>
              <option value="accountant">Accountant</option>
              <option value="admission_clerk">Admission Clerk</option>
              <option value="custom">Custom Role</option>
            </select>
          </div>
          <div class="col-span-2 flex items-center mt-2">
            <input type="checkbox" v-model="form.subscriptionData.send_email" class="mr-2" />
            <span class="text-gray-700 dark:text-gray-300">Send credentials to email</span>
          </div>
        </div>
      </div>

      <!-- Payment Information (Optional) -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mt-8">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Payment Information (Optional)
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
              >Payment Amount</label
            >
            <input
              v-model="form.subscriptionData.payment_amount"
              type="number"
              step="0.01"
              class="input-field"
              placeholder="Enter amount"
            />
          </div>
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
              >Payment Method</label
            >
            <select v-model="form.subscriptionData.payment_method" class="input-field">
              <option value="offline_cash">Cash</option>
              <option value="offline_cheque">Cheque</option>
              <option value="offline_bank_transfer">Bank Transfer</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
            </select>
          </div>
          <div>
            <label class="block font-medium mb-1 text-gray-300 dark:text-gray-300">Currency</label>
            <select
              v-model="form.subscriptionData.payment_currency"
              class="input-field"
              @change="autoFillCurrencySymbol"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
          <div>
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
              >TRX ID (optional)</label
            >
            <input
              v-model="form.subscriptionData.trx_id"
              type="text"
              class="input-field"
              placeholder="Transaction ID, Cheque No, etc."
            />
          </div>
          <div class="col-span-2">
            <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
              >Notes (optional)</label
            >
            <textarea
              v-model="form.subscriptionData.notes"
              class="input-field"
              rows="2"
              placeholder="Bank reference, remarks, etc."
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Submit Buttons -->
      <div class="flex justify-end gap-3">
        <NuxtLink to="/saas" class="btn-secondary"> Cancel </NuxtLink>
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Creating...' : 'Create School' }}
        </button>
      </div>
    </form>

    <!-- Toast Notifications -->
    <div
      v-if="showToast"
      :class="toastClasses"
      class="fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm"
    >
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <svg
            v-if="toastType === 'success'"
            class="h-5 w-5 text-green-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
          <svg v-else class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium">{{ toastMessage }}</p>
        </div>
        <div class="ml-auto pl-3">
          <button @click="hideToast" class="inline-flex text-gray-400 hover:text-gray-600">
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useSubscriptions } from '~/composables/useSubscriptions';
import { useAuthStore } from '~/stores/auth';
import { useToast } from '~/composables/useToast';
import { Eye, EyeOff } from 'lucide-vue-next';

const authStore = useAuthStore();
const { showError, showApiError } = useToast();

// Access control - only Super Admin can access school subscription management
const user = authStore.user;
if (user?.role !== 'super_admin') {
  showError('Access denied. Only Super Admin can manage school subscriptions.');
  await navigateTo('/dashboard');
}

const { createSchoolWithSubscription, plans, fetchPlans, loading, error } = useSubscriptions();
const adminEmailError = ref('');
const isSchoolCodeValid = ref(true);
const plansLoading = ref(false);

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
    currency: 'INR',
    currency_symbol: '₹',
    starting_month: 6,
    academic_year_start: 'academic',
    default_payment_model: 'class_based',
    timezone: 'Asia/Kolkata',
    locale: 'en-IN',
    date_format: 'DD/MM/YYYY',
    time_format: '12h'
  },
  subscriptionData: {
    plan_code: '',
    status: 'trial',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    payment_amount: '',
    payment_method: 'offline_cash',
    payment_currency: 'INR',
    trial_days: 30,
    trx_id: '',
    notes: '',
    // Admin fields moved here
    admin_first_name: '',
    admin_last_name: '',
    admin_email: '',
    admin_phone: '',
    admin_password: '',
    admin_role: 'admin', // Added for role
    send_email: true // Added for send_email
  }
});

const showSuccessModal = ref(false);
const createdSchool = ref(null);
const systemLogoInput = ref(null);
const textLogoInput = ref(null);
const printingLogoInput = ref(null);
const reportCardInput = ref(null);

// Toast notification state
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
const emailError = ref('');

const fileInputs = ref({});
const onFileChange = (field, event) => {
  fileInputs.value[field] = event.target.files[0];
};

// Computed property for selected plan
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
        form.value.subscriptionData.end_date = ''; // Lifetime plans have no end date
        return;
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

// Auto-fill currency symbol when currency is selected
const autoFillCurrencySymbol = () => {
  if (form.value.schoolData.currency === 'INR') {
    form.value.schoolData.currency_symbol = '₹';
  } else if (form.value.schoolData.currency === 'USD') {
    form.value.schoolData.currency_symbol = '$';
  } else if (form.value.schoolData.currency === 'EUR') {
    form.value.schoolData.currency_symbol = '€';
  } else {
    form.value.schoolData.currency_symbol = ''; // Default or empty
  }
};

// School code validation
const validateSchoolCode = () => {
  const code = form.value.schoolData.code;
  if (!code) {
    isSchoolCodeValid.value = false;
    return false;
  }
  // Convert to uppercase and validate - backend requires uppercase letters and numbers only
  const upperCode = code.toUpperCase();
  form.value.schoolData.code = upperCode; // Auto-convert to uppercase
  const codeRegex = /^[A-Z0-9]{2,20}$/;
  isSchoolCodeValid.value = codeRegex.test(upperCode);
  return isSchoolCodeValid.value;
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

// Handle status change to update end date
const handleStatusChange = () => {
  if (form.value.subscriptionData.status === 'trial') {
    const startDate = new Date(form.value.subscriptionData.start_date);
    const trialDays = form.value.subscriptionData.trial_days;
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + trialDays);
    form.value.subscriptionData.end_date = endDate.toISOString().split('T')[0];
  } else if (
    form.value.subscriptionData.status === 'active' &&
    selectedPlan?.billing_cycle === 'monthly'
  ) {
    const startDate = new Date(form.value.subscriptionData.start_date);
    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + 1);
    form.value.subscriptionData.end_date = endDate.toISOString().split('T')[0];
  } else if (
    form.value.subscriptionData.status === 'active' &&
    selectedPlan?.billing_cycle === 'yearly'
  ) {
    const startDate = new Date(form.value.subscriptionData.start_date);
    const endDate = new Date(startDate);
    endDate.setFullYear(startDate.getFullYear() + 1);
    form.value.subscriptionData.end_date = endDate.toISOString().split('T')[0];
  } else if (
    form.value.subscriptionData.status === 'active' &&
    (selectedPlan?.billing_cycle === 'lifetime' || selectedPlan?.code === 'LIFETIME')
  ) {
    // Lifetime plans have no end date
    form.value.subscriptionData.end_date = '';
  }
};

// Validate unique email (frontend only)
const validateUniqueEmail = type => {
  const email = form.value.subscriptionData.admin_email;
  const schoolCode = form.value.schoolData.code;
  const schoolName = form.value.schoolData.name;

  if (type === 'admin') {
    if (
      email.toLowerCase() === schoolCode.toLowerCase() ||
      email.toLowerCase() === schoolName.toLowerCase()
    ) {
      adminEmailError.value = 'Email cannot be the same as School Code or Name.';
      return false;
    }
  }
  adminEmailError.value = '';
  return true;
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

// Form validation
const validateForm = () => {
  const isSchoolEmailValid = validateSchoolEmail();
  const isAdminEmailValid = validateAdminEmail();
  const isCodeValid = validateSchoolCode();

  return isSchoolEmailValid && isAdminEmailValid && isCodeValid;
};

// Handle form submission
const handleSubmit = async () => {
  // Validate form before submission
  if (!validateForm()) {
    showToastNotification('Please fix the validation errors', 'error');
    return;
  }

  // Note: loading state is managed by the composable during createSchoolWithSubscription
  error.value = '';
  try {
    const formData = new FormData();
    // Append nested objects as JSON strings
    formData.append('schoolData', JSON.stringify(form.value.schoolData));
    formData.append('subscriptionData', JSON.stringify(form.value.subscriptionData));

    // File fields
    if (fileInputs.value.system_logo) formData.append('system_logo', fileInputs.value.system_logo);
    if (fileInputs.value.text_logo) formData.append('text_logo', fileInputs.value.text_logo);
    if (fileInputs.value.printing_logo)
      formData.append('printing_logo', fileInputs.value.printing_logo);
    if (fileInputs.value.report_card_design)
      formData.append('report_card_design', fileInputs.value.report_card_design);
    // Call composable
    const result = await createSchoolWithSubscription(formData);
    if (result) {
      createdSchool.value = result;
      let successMessage = `School "${result.school.name}" created successfully with branch "${result.branch.name}" and academic year "${result.academic_year.name}"!`;

      // Add admin credentials if available
      if (result.admin_user && result.admin_user.password) {
        successMessage += ` Admin email: ${result.admin_user.email}, Password: ${result.admin_user.password}`;
      }

      showToastNotification(successMessage, 'success');
      // Reset form after successful creation
      setTimeout(() => {
        try {
          // Clear any previous email error
          emailError.value = '';
          // Reset form data
          form.value = {
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
              currency: 'INR',
              currency_symbol: '₹',
              starting_month: 6,
              academic_year_start: 'academic',
              timezone: 'Asia/Kolkata',
              locale: 'en-IN',
              date_format: 'DD/MM/YYYY',
              time_format: '12h'
            },
            subscriptionData: {
              plan_code: '',
              status: 'trial',
              start_date: new Date().toISOString().split('T')[0],
              end_date: '',
              payment_amount: '',
              payment_method: 'offline_cash',
              payment_currency: 'INR',
              trial_days: 30,
              trx_id: '',
              notes: '',
              admin_first_name: '',
              admin_last_name: '',
              admin_email: '',
              admin_phone: '',
              admin_password: generatePassword(),
              admin_role: 'admin',
              send_email: true
            }
          };

          // Clear file inputs
          fileInputs.value = {};
          if (systemLogoInput.value) systemLogoInput.value.value = '';
          if (textLogoInput.value) textLogoInput.value.value = '';
          if (printingLogoInput.value) printingLogoInput.value.value = '';
          if (reportCardInput.value) reportCardInput.value.value = '';

          // Reset validation states
          emailError.value = '';
          adminEmailError.value = '';
          isSchoolCodeValid.value = true;
        } catch (error) {
          console.error('Error resetting form:', error);
        }
      }, 2000);
    }
  } catch (err) {
    console.error('Error creating school:', err);
    showApiError(err, 'Failed to create school');
  }
};

// Close success modal
const closeSuccessModal = () => {
  showSuccessModal.value = false;
  createdSchool.value = null;
};

// Fetch plans on mount
onMounted(async () => {
  plansLoading.value = true;
  try {
    await fetchPlans({ is_active: true });
  } finally {
    plansLoading.value = false;
  }
});

// Password visibility toggle
const showAdminPassword = ref(false);
const toggleAdminPassword = () => {
  showAdminPassword.value = !showAdminPassword.value;
};
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
