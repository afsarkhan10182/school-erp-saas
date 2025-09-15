<template>
  <div class="container mx-auto py-8 max-w-7xl">
    <!-- Header (only show if title is provided) -->
    <div v-if="title" class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ title }}
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          {{ subtitle }}
        </p>
      </div>
      <div class="flex space-x-3">
        <button v-if="canRequestRenewal" @click="showRenewalModal = true" class="btn-primary">
          Request Renewal
        </button>
        <NuxtLink v-if="editSchoolUrl" :to="editSchoolUrl" class="btn-secondary">
          Edit School
        </NuxtLink>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600 dark:text-gray-400">Loading subscription details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <div class="text-red-600 dark:text-red-400 mb-4">
        <AlertCircle class="w-12 h-12 mx-auto" />
      </div>
      <p class="text-gray-600 dark:text-gray-400">{{ error }}</p>
      <button @click="loadData" class="btn-primary mt-4">Retry</button>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Current Plan Overview -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Plan</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Plan Details -->
          <div
            class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg"
          >
            <h3 class="font-medium text-gray-900 dark:text-white mb-2">
              {{ planSectionTitle }}
            </h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Plan Name:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{
                  school?.plan_details?.name || school?.subscription_plan || 'No Plan'
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Price:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{
                  school?.plan_details?.price !== null && school?.plan_details?.price !== undefined
                    ? `₹${school.plan_details.price}`
                    : 'N/A'
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Billing Cycle:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{
                  school?.plan_details?.billing_cycle
                    ? formatBillingCycle(school.plan_details.billing_cycle)
                    : 'N/A'
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Status:</span>
                <span
                  :class="statusClass(school?.status)"
                  class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                >
                  {{ formatStatus(school?.status) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Subscription Dates -->
          <div
            class="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg"
          >
            <h3 class="font-medium text-gray-900 dark:text-white mb-2">Subscription Period</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Start Date:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{
                  formatDate(school?.subscription_start_date)
                }}</span>
              </div>
              <div v-if="school?.plan_details?.billing_cycle !== 'lifetime'">
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">End Date:</span>
                  <span class="font-medium text-gray-900 dark:text-white">{{
                    formatDate(school?.subscription_end_date)
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Days Remaining:</span>
                  <span :class="daysRemainingClass" class="font-medium">{{ daysRemaining }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600 dark:text-gray-400">Progress:</span>
                  <div class="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      :class="progressBarClass"
                      class="h-2 rounded-full transition-all duration-300"
                      :style="{ width: subscriptionProgress + '%' }"
                    ></div>
                  </div>
                  <span class="text-xs text-gray-500">{{ Math.round(subscriptionProgress) }}%</span>
                </div>
              </div>
              <div v-else class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400">Plan Type:</span>
                <span class="text-xs text-gray-500 font-medium">Lifetime Access</span>
              </div>
            </div>
          </div>

          <!-- Limits -->
          <div
            class="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg"
          >
            <h3 class="font-medium text-gray-900 dark:text-white mb-2">
              {{ limitsSectionTitle }}
            </h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Max Students:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{
                  school?.max_students === -1 ? 'Unlimited' : school?.max_students || 'N/A'
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Max Staff:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{
                  school?.max_staff === -1 ? 'Unlimited' : school?.max_staff || 'N/A'
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Max Branches:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{
                  school?.max_branches === -1 ? 'Unlimited' : school?.max_branches || 'N/A'
                }}</span>
              </div>
              <div
                v-if="school?.current_usage"
                class="pt-2 border-t border-gray-200 dark:border-gray-600"
              >
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Current Usage:</span>
                  <span class="font-medium text-gray-900 dark:text-white"
                    >{{ school.current_usage.students || 0 }}/{{
                      school?.max_students === -1 ? '∞' : school?.max_students || 0
                    }}</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modules -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ modulesSectionTitle }}
          </h2>
        </div>

        <div v-if="availableModules.length === 0" class="text-center py-8">
          <div class="text-gray-400 mb-2">📦 No modules configured</div>
          <div class="text-sm text-gray-500 mb-4">
            {{
              user?.role === 'super_admin'
                ? 'This school has no modules enabled. Use the "Manage Modules" button above to configure modules.'
                : 'Contact your administrator to enable modules.'
            }}
          </div>
          <div v-if="user?.role === 'super_admin'" class="text-xs text-gray-400">
            Modules are configured based on the subscription plan and can be individually
            enabled/disabled.
          </div>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            v-for="module in availableModules"
            :key="module.id"
            class="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
            :class="{
              'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800':
                module.enabled,
              'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800': !module.enabled
            }"
          >
            <div class="mr-3">
              <div
                class="w-4 h-4 rounded-full flex items-center justify-center"
                :class="{
                  'bg-green-100 dark:bg-green-900': module.enabled,
                  'bg-red-100 dark:bg-red-900': !module.enabled
                }"
              >
                <Check v-if="module.enabled" class="w-3 h-3 text-green-600 dark:text-green-400" />
                <X v-else class="w-3 h-3 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div class="flex-1">
              <div class="flex items-center">
                <span class="text-lg mr-2">{{ module.icon || '📦' }}</span>
                <div>
                  <div class="font-medium text-gray-900 dark:text-white">{{ module.name }}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {{ module.description || 'Module description' }}
                  </div>
                </div>
              </div>
            </div>
            <div v-if="module.is_core" class="ml-2">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                Core
              </span>
            </div>
          </div>
        </div>

        <!-- Module Summary -->
        <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div class="flex justify-between items-center text-sm">
            <div class="flex gap-4">
              <span class="text-gray-500 dark:text-gray-400">
                Enabled:
                <span class="font-medium text-green-600 dark:text-green-400">{{
                  enabledModuleCount
                }}</span>
              </span>
              <span class="text-gray-500 dark:text-gray-400">
                Disabled:
                <span class="font-medium text-red-600 dark:text-red-400">{{
                  disabledModuleCount
                }}</span>
              </span>
              <span class="text-gray-500 dark:text-gray-400">
                Total:
                <span class="font-medium text-gray-900 dark:text-white">{{
                  availableModules.length
                }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Module Upgrade Suggestions -->
        <div
          v-if="user?.role === 'school_admin' && availablePlans.length > 1"
          class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
        >
          <h3 class="text-md font-medium text-gray-900 dark:text-white mb-3">Available Plans</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="plan in availablePlans"
              :key="plan.code"
              class="p-4 border rounded-lg"
              :class="
                plan.isCurrentPlan
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              "
            >
              <div class="flex justify-between items-start mb-2">
                <h4 class="font-medium text-gray-900 dark:text-white">{{ plan.name }}</h4>
                <span
                  v-if="plan.isCurrentPlan"
                  class="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full"
                  >Current</span
                >
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">{{ plan.description }}</p>
              <div class="text-sm text-gray-900 dark:text-white font-medium mb-2">
                ₹{{ plan.price }}/{{ formatBillingCycle(plan.billing_cycle) }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ plan.modules?.length || 0 }} modules included
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ transactionsSectionTitle }}
          </h2>
          <NuxtLink
            v-if="transactionsUrl"
            :to="transactionsUrl"
            class="text-blue-600 hover:text-blue-700 text-sm"
          >
            View All
          </NuxtLink>
        </div>
        <div v-if="transactions.length === 0" class="text-center py-8">
          <div class="text-gray-400 mb-2">📋 No subscription payments yet</div>
          <div class="text-sm text-gray-500">
            {{
              school?.plan_details?.billing_cycle === 'lifetime'
                ? 'This is a lifetime plan with no recurring payments.'
                : 'Subscription payments will appear here once made.'
            }}
          </div>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Amount
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Method
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Description
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="transaction in transactions" :key="transaction.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{
                    formatDate(
                      transaction.created_at || transaction.createdAt || transaction.payment_date
                    )
                  }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  ₹{{ transaction.amount }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ formatMethod(transaction.payment_method) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="statusClass(transaction.payment_status)"
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                  >
                    {{ formatStatus(transaction.payment_status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ transaction.description || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Renewal Requests -->
      <div
        v-if="renewalRequests.length > 0"
        class="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
      >
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ renewalRequestsSectionTitle }}
          </h2>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Current Plan
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Requested Plan
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Reason
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="request in renewalRequests" :key="request.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ formatDate(request.created_at) }}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white capitalize"
                >
                  {{ formatRequestType(request.request_type) }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  <div>
                    <div class="font-medium">
                      {{ request.current_plan_details?.name || request.current_plan_code || 'N/A' }}
                    </div>
                    <div class="text-xs text-gray-500">
                      ₹{{ request.current_plan_details?.price || 'N/A' }} /
                      {{ formatBillingCycle(request.current_plan_details?.billing_cycle) }}
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  <div>
                    <div class="font-medium">
                      {{
                        request.requested_plan_details?.name || request.requested_plan_code || 'N/A'
                      }}
                    </div>
                    <div class="text-xs text-gray-500">
                      ₹{{ request.requested_plan_details?.price || 'N/A' }} /
                      {{ formatBillingCycle(request.requested_plan_details?.billing_cycle) }}
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="statusClass(request.status)"
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                  >
                    {{ formatStatus(request.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {{ request.request_reason || 'No reason provided' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Renewal Request Modal -->
    <Modal :show="showRenewalModal" @close="showRenewalModal = false">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Request Subscription Renewal
        </h3>
      </template>

      <template #body>
        <form @submit.prevent="submitRenewalRequest" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Request Type</label
            >
            <select v-model="renewalForm.request_type" required class="input-field">
              <option value="renewal">Renewal</option>
              <option value="upgrade">Upgrade</option>
              <option value="downgrade">Downgrade</option>
              <option value="change_plan">Change Plan</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Requested Plan</label
            >
            <select v-model="renewalForm.requested_plan_code" required class="input-field">
              <option value="">Select Plan</option>
              <option v-for="plan in availablePlans" :key="plan.id" :value="plan.code">
                {{ plan.name }} - ₹{{ plan.price }}/{{ formatBillingCycle(plan.billing_cycle) }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Billing Cycle</label
            >
            <select v-model="renewalForm.billing_cycle" required class="input-field">
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="lifetime">Lifetime</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Reason for Request</label
            >
            <textarea
              v-model="renewalForm.request_reason"
              rows="3"
              class="input-field"
              placeholder="Please explain why you need this change..."
            ></textarea>
          </div>
        </form>
      </template>

      <template #footer>
        <button type="button" @click="showRenewalModal = false" class="btn-secondary">
          Cancel
        </button>
        <button
          type="button"
          @click="submitRenewalRequest"
          :disabled="submitting || !isFormValid"
          class="btn-primary"
        >
          <span v-if="submitting">Submitting...</span>
          <span v-else>Submit Request</span>
        </button>
      </template>
    </Modal>

    <!-- Plan Details Modal -->
    <Modal :show="showPlanDetailsModal" @close="showPlanDetailsModal = false">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Plan Details</h3>
      </template>

      <template #body>
        <div v-if="selectedPlanDetails" class="space-y-6">
          <!-- Plan Overview -->
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 class="font-medium text-gray-900 dark:text-white mb-2">
              {{ selectedPlanDetails.name }}
            </h4>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-600 dark:text-gray-400">Price:</span>
                <span class="font-medium text-gray-900 dark:text-white ml-2"
                  >₹{{ selectedPlanDetails.price }}</span
                >
              </div>
              <div>
                <span class="text-gray-600 dark:text-gray-400">Billing Cycle:</span>
                <span class="font-medium text-gray-900 dark:text-white ml-2">{{
                  formatBillingCycle(selectedPlanDetails.billing_cycle)
                }}</span>
              </div>
              <div>
                <span class="text-gray-600 dark:text-gray-400">Max Students:</span>
                <span class="font-medium text-gray-900 dark:text-white ml-2">{{
                  selectedPlanDetails.max_students === -1
                    ? 'Unlimited'
                    : selectedPlanDetails.max_students
                }}</span>
              </div>
              <div>
                <span class="text-gray-600 dark:text-gray-400">Max Staff:</span>
                <span class="font-medium text-gray-900 dark:text-white ml-2">{{
                  selectedPlanDetails.max_staff === -1 ? 'Unlimited' : selectedPlanDetails.max_staff
                }}</span>
              </div>
              <div>
                <span class="text-gray-600 dark:text-gray-400">Max Branches:</span>
                <span class="font-medium text-gray-900 dark:text-white ml-2">{{
                  selectedPlanDetails.max_branches === -1
                    ? 'Unlimited'
                    : selectedPlanDetails.max_branches
                }}</span>
              </div>
            </div>
          </div>

          <!-- Modules -->
          <div v-if="selectedPlanDetails.modules && selectedPlanDetails.modules.length > 0">
            <h4 class="font-medium text-gray-900 dark:text-white mb-3">Included Modules</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                v-for="module in selectedPlanDetails.modules"
                :key="module.id"
                class="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
              >
                <Check class="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
                <span class="text-sm text-gray-900 dark:text-white">{{ module.name }}</span>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div v-if="selectedPlanDetails.description">
            <h4 class="font-medium text-gray-900 dark:text-white mb-2">Description</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ selectedPlanDetails.description }}
            </p>
          </div>
        </div>
      </template>

      <template #footer>
        <button type="button" @click="showPlanDetailsModal = false" class="btn-primary">
          Close
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useSubscriptions } from '~/composables/useSubscriptions';
import { useAuthStore } from '~/stores/auth';
import { useToast } from '~/composables/useToast';
import { Check, AlertCircle, X } from 'lucide-vue-next';
import { Saas } from '~/api';
import Modal from '~/components/ui/Modal.vue';

// Types
interface School {
  id: string;
  name: string;
  code: string;
  status: string;
  subscription_plan: string;
  subscription_start_date: string;
  subscription_end_date: string;
  max_students: number;
  max_staff: number;
  max_branches: number;
  current_usage?: {
    students: number;
    staff: number;
    branches: number;
  };
  plan_details?: {
    name: string;
    price: number;
    billing_cycle: string;
    modules?: string[];
  };
  modules?: string[] | any[];
}

interface Transaction {
  id: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  transaction_status?: string;
  description?: string;
  created_at: string;
  createdAt?: string;
  payment_date?: string;
  transaction_id?: string;
  currency?: string;
  subscription_plan?: {
    name: string;
    code: string;
  };
}

interface RenewalRequest {
  id: string;
  request_type: string;
  requested_plan_code: string;
  current_plan_code?: string;
  status: string;
  request_reason?: string;
  created_at: string;
  current_plan_details?: {
    name: string;
    code: string;
    price: number;
    billing_cycle: string;
    max_students: number;
    max_staff: number;
    max_branches: number;
    description?: string;
  };
  requested_plan_details?: {
    name: string;
    code: string;
    price: number;
    billing_cycle: string;
    max_students: number;
    max_staff: number;
    max_branches: number;
    description?: string;
  };
}

interface Plan {
  id: string;
  name: string;
  code: string;
  price: number;
  billing_cycle: string;
  description?: string;
  modules?: any[];
  max_students?: number;
  max_staff?: number;
  max_branches?: number;
  isCurrentPlan?: boolean;
}

interface RenewalForm {
  request_type: string;
  requested_plan_code: string;
  billing_cycle: string;
  request_reason: string;
}

// Props
const props = defineProps<{
  schoolId: string;
  editSchoolUrl?: string;
  transactionsUrl?: string;
  // New props for role-agnostic behavior
  title?: string;
  subtitle?: string;
  planSectionTitle?: string;
  limitsSectionTitle?: string;
  modulesSectionTitle?: string;
  transactionsSectionTitle?: string;
  renewalRequestsSectionTitle?: string;
  canRequestRenewal?: boolean;
}>();

// Emits
const emit = defineEmits<{
  'data-loaded': [
    { school: School; transactions: Transaction[]; renewalRequests: RenewalRequest[] }
  ];
  'renewal-requested': [any];
}>();

const authStore = useAuthStore();
const {
  fetchSchoolsWithSubscriptions,
  fetchSchoolTransactions,
  fetchMyTransactions,
  fetchPlans,
  fetchRenewalRequests,
  fetchSchoolSubscriptionDetails,
  fetchSchoolRenewalRequests,
  createRenewalRequest
} = useSubscriptions();
const { showSuccess, showError: toastError } = useToast();

// Reactive data
const loading = ref(true);
const error = ref('');
const school = ref<School | null>(null);
const transactions = ref<Transaction[]>([]);
const renewalRequests = ref<RenewalRequest[]>([]);
const availablePlans = ref<Plan[]>([]);
const showRenewalModal = ref(false);
const submitting = ref(false);
const showPlanDetailsModal = ref(false);
const selectedPlanDetails = ref<Plan | null>(null);
const saving = ref(false);

// Renewal form
const renewalForm = ref<RenewalForm>({
  request_type: 'renewal',
  requested_plan_code: '',
  billing_cycle: 'yearly',
  request_reason: ''
});

// Computed properties
const user = computed(() => authStore.user);

// Default values for props
const title = computed(() => props.title || 'Subscription Details');
const subtitle = computed(() => props.subtitle || 'Subscription overview');
const planSectionTitle = computed(() => props.planSectionTitle || 'Plan Information');
const limitsSectionTitle = computed(() => props.limitsSectionTitle || 'Plan Limits');
const modulesSectionTitle = computed(() => props.modulesSectionTitle || 'Available Modules');
const transactionsSectionTitle = computed(
  () => props.transactionsSectionTitle || 'Recent Transactions'
);
const renewalRequestsSectionTitle = computed(
  () => props.renewalRequestsSectionTitle || 'Renewal Requests'
);
const canRequestRenewal = computed(() => props.canRequestRenewal ?? false);

const daysRemaining = computed(() => {
  if (!school.value?.subscription_end_date) return 'Not set';

  const endDate = new Date(school.value.subscription_end_date).getTime();
  const now = new Date().getTime();
  const diffTime = endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return `${diffDays} days`;
  } else if (diffDays === 0) {
    return 'Expires today';
  } else {
    return `${Math.abs(diffDays)} days expired`;
  }
});

const daysRemainingClass = computed(() => {
  if (!school.value?.subscription_end_date) return 'text-gray-900 dark:text-white';
  const endDate = new Date(school.value.subscription_end_date).getTime();
  const now = new Date().getTime();
  const diffTime = endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'text-red-600 dark:text-red-400';
  if (diffDays <= 30) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-green-600 dark:text-green-400';
});

const subscriptionProgress = computed(() => {
  if (!school.value?.subscription_start_date || !school.value?.subscription_end_date) return 0;

  const startDate = new Date(school.value.subscription_start_date).getTime();
  const endDate = new Date(school.value.subscription_end_date).getTime();
  const now = new Date().getTime();

  // Handle lifetime subscriptions
  if (school.value?.plan_details?.billing_cycle === 'lifetime') {
    return 0; // No progress bar for lifetime
  }

  const totalDuration = endDate - startDate;
  const elapsed = now - startDate;

  // Cap at 100% even if subscription is expired
  return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
});

const progressBarClass = computed(() => {
  // Don't show progress bar for lifetime subscriptions
  if (school.value?.plan_details?.billing_cycle === 'lifetime') {
    return 'hidden';
  }

  // Check if subscription is expired
  if (school.value?.subscription_end_date) {
    const endDate = new Date(school.value.subscription_end_date).getTime();
    const now = new Date().getTime();
    if (endDate < now) {
      return 'bg-red-500';
    }
  }

  if (subscriptionProgress.value > 80) return 'bg-red-500';
  if (subscriptionProgress.value > 60) return 'bg-yellow-500';
  return 'bg-green-500';
});

const availableModules = computed(() => {
  if (!school.value) return [];

  // Try to get modules from different possible locations
  let modules: any[] = [];

  // Check if modules exist in school.modules
  if (school.value.modules && Array.isArray(school.value.modules)) {
    modules = school.value.modules;
  }
  // Check if modules exist in plan_details.modules
  else if (school.value.plan_details?.modules && Array.isArray(school.value.plan_details.modules)) {
    modules = school.value.plan_details.modules;
  }

  // If no modules found, return empty array
  if (modules.length === 0) {
    return [];
  }

  // Module definitions with proper details
  const moduleDefinitions: Record<string, any> = {
    students: {
      name: 'Student Management',
      description: 'Admit students, manage profiles, class assignments, and student records',
      icon: '👥',
      is_core: true
    },
    fees: {
      name: 'Fee Management',
      description: 'Fee types, structures, invoices, payments, and collections',
      icon: '💰',
      is_core: true
    },
    attendance: {
      name: 'Attendance Management',
      description: 'Track student and staff attendance with reports and notifications',
      icon: '📊',
      is_core: false
    },
    exams: {
      name: 'Examination Management',
      description: 'Create and manage exams, results, and grade reports',
      icon: '📝',
      is_core: false
    },
    hr: {
      name: 'HR Management',
      description: 'Manage staff, payroll, and human resources',
      icon: '👨‍💼',
      is_core: false
    },
    transport: {
      name: 'Transport Management',
      description: 'Manage school transport, routes, and vehicle tracking',
      icon: '🚌',
      is_core: false
    },
    library: {
      name: 'Library Management',
      description: 'Manage books, borrowing, and library operations',
      icon: '📚',
      is_core: false
    },
    settings: {
      name: 'System Settings',
      description: 'Configure school settings, academic years, and system preferences',
      icon: '⚙️',
      is_core: true
    },
    reports: {
      name: 'Reports & Analytics',
      description: 'Generate reports, analytics, and insights',
      icon: '📈',
      is_core: false
    }
  };

  // Transform modules to display format with proper interface
  return modules.map((module: any) => {
    if (typeof module === 'string') {
      const moduleDef = moduleDefinitions[module] || {
        name: module.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        description: 'Module description',
        icon: '📦',
        is_core: false
      };

      return {
        id: module,
        code: module,
        name: moduleDef.name,
        enabled: true, // Default to enabled for string modules
        is_core: moduleDef.is_core,
        icon: moduleDef.icon,
        description: moduleDef.description
      };
    } else if (typeof module === 'object') {
      const moduleDef = moduleDefinitions[module.code || module.id || module.name] || {
        name: module.name || module.code || module.id,
        description: module.description || 'Module description',
        icon: module.icon || '📦',
        is_core: module.is_core || false
      };

      return {
        id: module.code || module.id || module.name,
        code: module.code || module.id || module.name,
        name: moduleDef.name,
        enabled: module.is_enabled !== false, // Use is_enabled from database
        is_core: moduleDef.is_core,
        icon: moduleDef.icon,
        description: moduleDef.description
      };
    }
    return {
      id: module,
      code: module,
      name: String(module),
      enabled: true,
      is_core: false,
      icon: '📦',
      description: 'Module description'
    };
  });
});

const isFormValid = computed(() => {
  return (
    renewalForm.value.request_type &&
    renewalForm.value.requested_plan_code &&
    renewalForm.value.billing_cycle
  );
});

// Methods
const statusClass = (status: string | undefined) => {
  if (!status) return 'bg-gray-100 text-gray-800';

  const classes: Record<string, string> = {
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    lifetime: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    processing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    trial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    expiring_soon: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    initiated: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    expired: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    suspended: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  };

  return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
};

const formatStatus = (status: string | undefined) => {
  if (!status) return 'N/A';

  const statuses: Record<string, string> = {
    completed: 'Completed',
    pending: 'Pending',
    failed: 'Failed',
    refunded: 'Refunded',
    cancelled: 'Cancelled',
    success: 'Success',
    processing: 'Processing',
    initiated: 'Initiated',
    active: 'Active',
    trial: 'Trial',
    expired: 'Expired',
    lifetime: 'Lifetime',
    expiring_soon: 'Expiring Soon',
    suspended: 'Suspended'
  };

  return statuses[status] || status.charAt(0).toUpperCase() + status.slice(1);
};

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A';

  // Handle lifetime subscriptions
  if (dateString === 'lifetime' || dateString === 'Lifetime') {
    return 'Lifetime';
  }

  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

const formatMethod = (method: string | undefined) => {
  if (!method) return 'N/A';

  const methods: Record<string, string> = {
    offline_cash: 'Cash',
    offline_cheque: 'Cheque',
    offline_bank_transfer: 'Bank Transfer',
    online: 'Online',
    card: 'Card',
    upi: 'UPI'
  };

  return methods[method] || method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ');
};

const formatBillingCycle = (cycle: string | undefined) => {
  if (!cycle) return 'Not set';

  const cycles: Record<string, string> = {
    monthly: 'Month',
    yearly: 'Year',
    lifetime: 'Lifetime'
  };

  return cycles[cycle] || cycle.charAt(0).toUpperCase() + cycle.slice(1);
};

const formatRequestType = (type: string | undefined) => {
  if (!type) return 'Not specified';

  const types: Record<string, string> = {
    renewal: 'Renewal',
    upgrade: 'Upgrade',
    downgrade: 'Downgrade',
    change_plan: 'Change Plan'
  };

  return types[type] || type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
};

const loadData = async () => {
  loading.value = true;
  error.value = '';

  try {
    const schoolId = props.schoolId;
    const userRole = user.value?.role;

    // Load school details based on user role
    if (userRole === 'super_admin') {
      // Super admin: use the schools with subscriptions endpoint
      const schoolResponse = await fetchSchoolsWithSubscriptions({ id: schoolId });
      if (schoolResponse && schoolResponse.data.schools.length > 0) {
        school.value = schoolResponse.data.schools[0];
      } else {
        throw new Error('School not found');
      }

      // Load renewal requests for super admin
      try {
        const requestsResponse = await fetchRenewalRequests({ school_id: schoolId });
        if (requestsResponse) {
          renewalRequests.value = requestsResponse.requests;
        }
      } catch (e) {
        console.warn('Could not load renewal requests:', e);
      }

      // Load available plans for super admin
      const plansResponse = await fetchPlans({ is_active: true });
      if (plansResponse?.success) {
        availablePlans.value = plansResponse.data.plans;
      }
    } else {
      // School admin: use the database-driven usage endpoint
      const usageResponse = await fetchSchoolSubscriptionDetails();
      if (usageResponse) {
        // Transform the database-driven data to match the expected format
        school.value = {
          id: schoolId,
          name: user.value?.school_name || 'My School',
          code: user.value?.school_id || '',
          status: usageResponse.subscription_status?.status || 'active',
          subscription_plan: usageResponse.current_plan,
          subscription_start_date:
            usageResponse.subscription_start_date || new Date().toISOString(),
          subscription_end_date: usageResponse.subscription_end_date || new Date().toISOString(),
          max_students: usageResponse.plan_details?.max_students,
          max_staff: usageResponse.plan_details?.max_staff,
          max_branches: usageResponse.plan_details?.max_branches,
          current_usage: usageResponse.current_usage,
          plan_details: {
            name: usageResponse.plan_details?.name,
            price: usageResponse.plan_details?.price,
            billing_cycle: usageResponse.plan_details?.billing_cycle,
            modules: usageResponse.plan_details?.modules || []
          },
          modules: usageResponse.plan_details?.modules || []
        };

        // Load renewal requests for school admin
        try {
          const requestsResponse = await fetchSchoolRenewalRequests({ limit: 10 });
          if (requestsResponse) {
            renewalRequests.value = requestsResponse.requests || [];
          }
        } catch (e) {
          console.warn('Could not load renewal requests:', e);
        }

        // Load available plans for school admin
        try {
          const plansResponse = await Saas.getActivePlansForSchools();
          if (plansResponse?.success) {
            availablePlans.value = plansResponse.data.plans;
          }
        } catch (e) {
          console.warn('Could not load active plans:', e);
          availablePlans.value = [];
        }
      } else {
        throw new Error('Failed to load subscription details');
      }
    }

    // Load transactions for both roles using the same endpoint
    // Backend handles permissions - school admins can only see their own transactions
    const transactionsResponse = await fetchSchoolTransactions(schoolId, { limit: 5 });
    if (transactionsResponse) {
      transactions.value = transactionsResponse.data.transactions;
    }

    // Emit data loaded event
    if (school.value) {
      emit('data-loaded', {
        school: school.value,
        transactions: transactions.value,
        renewalRequests: renewalRequests.value
      });
    }
  } catch (err: any) {
    console.error('Error loading subscription data:', err);
    error.value = err.message || 'Failed to load subscription data';
  } finally {
    loading.value = false;
  }
};

const submitRenewalRequest = async () => {
  if (!isFormValid.value) {
    toastError('Please fill in all required fields');
    return;
  }

  submitting.value = true;

  try {
    const schoolId = props.schoolId;

    const response = await createRenewalRequest({
      school_id: schoolId,
      ...renewalForm.value
    });

    if (response) {
      showSuccess('Renewal request submitted successfully');
      showRenewalModal.value = false;
      emit('renewal-requested', response);

      // Reset form
      renewalForm.value = {
        request_type: 'renewal',
        requested_plan_code: '',
        billing_cycle: 'yearly',
        request_reason: ''
      };

      await loadData(); // Reload to show the new request
    } else {
      toastError('Failed to submit renewal request');
    }
  } catch (err: any) {
    console.error('Error submitting renewal request:', err);
    toastError(err.message || 'Failed to submit renewal request');
  } finally {
    submitting.value = false;
  }
};

// Computed properties for module counts
const enabledModuleCount = computed(
  () => availableModules.value.filter((m: any) => m.enabled).length
);
const disabledModuleCount = computed(
  () => availableModules.value.filter((m: any) => !m.enabled).length
);

// Expose methods for parent components
defineExpose({
  loadData,
  submitRenewalRequest
});

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-secondary {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200;
}
.input-field {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white;
}
</style>
