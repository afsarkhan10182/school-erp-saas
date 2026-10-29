<template>
  <div class="container mx-auto py-6 sm:py-8">
    <!-- Header -->
    <div class="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="min-w-0">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">SaaS Dashboard</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          Overview of school subscriptions and platform metrics
        </p>
      </div>
      <div class="flex w-full flex-wrap gap-3 sm:w-auto">
        <NuxtLink to="/saas/plans" class="btn-secondary whitespace-nowrap"> Manage Plans </NuxtLink>
        <NuxtLink to="/saas/renewal-requests" class="btn-secondary whitespace-nowrap"> Renewal Requests </NuxtLink>
        <NuxtLink to="/saas/schools/create" class="btn-primary whitespace-nowrap"> Add School </NuxtLink>
      </div>
    </div>

    <!-- Access Denied Message -->
    <div
      v-if="user?.role !== 'super_admin'"
      class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6"
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
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Access Denied</h3>
          <p class="mt-1 text-sm text-red-700 dark:text-red-300">
            You need super admin privileges to access subscription management. Your current role is:
            <strong>{{ user?.role || 'Not logged in' }}</strong>
          </p>
        </div>
      </div>
    </div>

    <!-- Platform Overview Metrics -->
    <div v-if="user?.role === 'super_admin'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Schools</p>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ overviewReport?.totalSchools ?? '...' }}</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span class="text-emerald-600 font-semibold">{{ overviewReport?.activeSchools ?? 0 }} active</span> · {{ overviewReport?.trialSchools ?? 0 }} trial
            </p>
          </div>
          <div class="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
            <Building2 class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Branches</p>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ overviewReport?.totalBranches ?? '...' }}</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Across all school tenants</p>
          </div>
          <div class="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
            <Layers class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Platform Users</p>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ overviewReport?.totalUsers ?? '...' }}</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Admins, teachers, parents, students</p>
          </div>
          <div class="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
            <Users class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Expiring Trials</p>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ (overviewReport?.expiringTrials || []).length }}</h3>
            <p class="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">Need renewal or upgrade</p>
          </div>
          <div class="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
            <AlertTriangle class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Subscription Revenue (Month)</p>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mt-1 break-words">{{ formatSubscriptionRevenue(overviewReport?.subscriptionRevenueByCurrency) }}</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Completed platform payments</p>
          </div>
          <div class="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
            <CreditCard class="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>

    <!-- Discoverable shortcuts to existing platform workflows -->
    <section v-if="user?.role === 'super_admin'" class="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Platform tools</h2>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Find a workspace or jump to a common platform task.</p>
        </div>
        <label class="relative block w-full sm:max-w-xs">
          <span class="sr-only">Search platform tools</span>
          <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input v-model="toolSearch" type="search" aria-label="Search platform tools" placeholder="Search platform tools..." class="form-input w-full pl-9" />
        </label>
      </div>
      <div v-if="filteredPlatformTools.length" class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <NuxtLink
          v-for="tool in filteredPlatformTools"
          :key="tool.to"
          :to="tool.to"
          class="group flex items-start gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/60 dark:border-gray-700 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/20"
        >
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
            <component :is="tool.icon" class="h-5 w-5" />
          </span>
          <span class="min-w-0">
            <span class="block text-sm font-semibold text-gray-900 group-hover:text-indigo-700 dark:text-white dark:group-hover:text-indigo-300">{{ tool.title }}</span>
            <span class="mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400">{{ tool.description }}</span>
          </span>
          <ArrowRight class="ml-auto mt-1 h-4 w-4 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600" />
        </NuxtLink>
      </div>
      <p v-else class="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500 dark:bg-gray-900/40 dark:text-gray-400">No platform tools match “{{ toolSearch }}”.</p>
    </section>

    <!-- Quick School Audit Switcher Bar -->
    <div
      v-if="user?.role === 'super_admin'"
      class="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 p-4 dark:border-indigo-900/40 dark:from-indigo-950/20 dark:to-purple-950/20"
    >
      <div class="flex items-center gap-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
          <ShieldCheck class="h-5 w-5" />
        </div>
        <div>
          <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Cross-Tenant School Inspection</h4>
          <p class="text-xs text-gray-600 dark:text-gray-400">View real-time operational attendance, fees, exams, and student records inside school tenants.</p>
        </div>
      </div>
      <NuxtLink
        to="/dashboard"
        class="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-indigo-700 shadow-sm ring-1 ring-inset ring-indigo-200 hover:bg-indigo-50 dark:bg-gray-800 dark:text-indigo-300 dark:ring-indigo-800"
      >
        <span>Open School Operations</span>
        <ArrowRight class="h-3.5 w-3.5" />
      </NuxtLink>
    </div>

    <!-- Filters -->
    <div
      v-if="user?.role === 'super_admin'"
      class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6"
    >
      <div class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >Search</label
          >
          <input
            v-model="filters.search"
            @input="debouncedSearch"
            type="text"
            placeholder="Search schools..."
            class="form-input"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >Status</label
          >
          <select v-model="filters.status" @change="applySchoolFilters" class="form-select">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expiring">Expiring within 30 days</option>
            <option value="trial">Trial</option>
            <option value="suspended">Suspended</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >Plan</label
          >
          <select v-model="filters.subscription_plan" @change="applySchoolFilters" class="form-select">
            <option value="">All Plans</option>
            <option v-for="plan in plans" :key="plan.code" :value="plan.code">
              {{ plan.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Registered</label>
          <select v-model="filters.registered_period" @change="applySchoolFilters" class="form-select">
            <option value="">Any time</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="365d">Last year</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort</label>
          <select v-model="filters.sort" @change="applySchoolFilters" class="form-select">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name_asc">Name A–Z</option>
            <option value="name_desc">Name Z–A</option>
            <option value="expiry_soonest">Expiry soonest</option>
          </select>
        </div>
        <div class="flex items-end">
          <button @click="clearFilters" class="btn-secondary w-full">Clear Filters</button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div v-if="user?.role === 'super_admin'" class="bg-white dark:bg-gray-800 rounded-lg shadow">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-8">
        <div
          class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
        ></div>
        <p class="mt-2 text-gray-600 dark:text-gray-400">Loading schools...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-8">
        <div class="text-red-600 dark:text-red-400 mb-4">
          <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            ></path>
          </svg>
        </div>
        <p class="text-gray-600 dark:text-gray-400">{{ error }}</p>
        <button @click="fetchSchools" class="btn-primary mt-4">Retry</button>
      </div>

      <!-- Schools Table -->
      <div v-else>
        <p class="mb-2 text-xs text-gray-500 dark:text-gray-400 sm:hidden">
          Swipe the table horizontally to review every school field and its actions.
        </p>
        <div
          class="overflow-x-auto"
          role="region"
          aria-label="School directory table"
          tabindex="0"
        >
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  School
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Plan
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Admin
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Period
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="school in schools"
                :key="school.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <!-- School Info -->
                <td class="px-6 py-4">
                  <div>
                    <div
                      class="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]"
                      :title="school.name"
                    >
                      {{ school.name }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">{{ school.code }}</div>
                    <div
                      class="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]"
                      :title="school.email"
                    >
                      {{ school.email }}
                    </div>
                  </div>
                </td>

                <!-- Plan Info -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div v-if="school.plan_details">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ school.plan_details.name }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      ₹{{ school.plan_details.price }}/{{ school.plan_details.billing_cycle }}
                    </div>
                    <div class="text-xs text-gray-400 dark:text-gray-500">
                      {{ school.plan_details.max_students < 0 ? 'Unlimited' : school.plan_details.max_students }} students,
                      {{ school.plan_details.max_branches < 0 ? 'Unlimited' : school.plan_details.max_branches }} branches
                    </div>
                  </div>
                  <div v-else class="text-sm text-gray-500 dark:text-gray-400">
                    {{ school.subscription_plan }}
                  </div>
                </td>

                <!-- Admin Info -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div v-if="school.admin_user">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ school.admin_user.first_name }} {{ school.admin_user.last_name }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ school.admin_user.email }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ school.admin_user.phone }}
                    </div>
                  </div>
                  <div v-else class="text-sm text-gray-500 dark:text-gray-400">
                    No admin assigned
                  </div>
                </td>

                <!-- Subscription Period -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    <div>Start: {{ formatDate(school.subscription_start_date) }}</div>
                    <div>End: {{ formatDate(school.subscription_end_date) }}</div>
                  </div>
                  <div
                    v-if="
                      getDaysRemaining(school.subscription_end_date) !== null &&
                      getDaysRemaining(school.subscription_end_date) <= 30
                    "
                    class="text-xs text-orange-600 dark:text-orange-400 font-medium"
                  >
                    {{ getDaysRemaining(school.subscription_end_date) }} days remaining
                  </div>
                  <div
                    v-else-if="getDaysRemaining(school.subscription_end_date) === null"
                    class="text-xs text-green-600 dark:text-green-400 font-medium"
                  >
                    Lifetime Plan
                  </div>
                </td>

                <!-- Status -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="getStatusClass(school.status)"
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                  >
                    {{ school.status }}
                  </span>
                </td>

                <!-- Actions -->
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex space-x-2">
                    <button
                      type="button"
                      @click="inspectSchool(school)"
                      class="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 font-semibold"
                      title="Inspect school operations, students, and finances"
                    >
                      Inspect Operations
                    </button>
                    <NuxtLink
                      :to="`/saas/schools/${school.id}`"
                      class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                    >
                      View
                    </NuxtLink>
                    <NuxtLink
                      :to="`/saas/schools/${school.id}/edit`"
                      class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                    >
                      Edit
                    </NuxtLink>
                    <NuxtLink
                      :to="`/saas/schools/${school.id}/transactions`"
                      class="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                    >
                      Transactions
                    </NuxtLink>
                    <button
                      v-if="school.status === 'active'"
                      @click="suspendSchoolAction(school.id)"
                      class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                    >
                      Suspend
                    </button>
                    <button
                      v-else-if="school.status === 'suspended'"
                      @click="reactivateSchoolAction(school.id)"
                      class="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                    >
                      Reactivate
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-if="!loading && !error && schools.length === 0" class="text-center py-8">
          <div class="text-gray-400 dark:text-gray-500 mb-4">
            <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              ></path>
            </svg>
          </div>
          <p class="text-gray-600 dark:text-gray-400">No schools found</p>
          <NuxtLink to="/saas/schools/create" class="btn-primary mt-4"> Add First School </NuxtLink>
        </div>

        <!-- Enhanced Pagination -->
        <Pagination
          v-if="pagination && pagination.pages > 1"
          :pagination="{
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total
          }"
          item-label="schools"
          @page-changed="changePage"
          @page-size-changed="onPageSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { Building2, Users, AlertTriangle, ArrowRight, Layers, ShieldCheck, Search, CreditCard, ClipboardList, GitBranch, Settings, Plus } from 'lucide-vue-next';
import { useSubscriptions } from '~/composables/useSubscriptions';
import { useAuth } from '~/composables/useAuth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useToast } from '~/composables/useToast';
import { Dashboard } from '~/api/shared/dashboard';
import Pagination from '~/components/ui/Pagination.vue';

const { isSuperAdmin, user } = useAuth();
const { switchSchool } = useGlobalBranch();
const router = useRouter();
const { showError } = useToast();

const inspectSchool = async school => {
  switchSchool({ id: school.id, name: school.name });
  await router.push('/dashboard');
};

// Access control - only Super Admin can access subscriptions

const {
  schools,
  plans,
  loading,
  error,
  fetchSchoolsWithSubscriptions,
  fetchPlans,
  suspendSchool,
  reactivateSchool
} = useSubscriptions();

const filters = ref({
  search: '',
  status: '',
  subscription_plan: '',
  registered_period: '',
  sort: 'newest',
  page: 1,
  limit: 10
});

const pagination = ref(null);
const toolSearch = ref('');
const platformTools = [
  { title: 'Schools Directory', description: 'Search tenants and manage school subscriptions.', to: '/saas', icon: Building2 },
  { title: 'Subscription Plans', description: 'Review and configure plans and module limits.', to: '/saas/plans', icon: CreditCard },
  { title: 'Renewal Requests', description: 'Review schools requesting a subscription renewal.', to: '/saas/renewal-requests', icon: ClipboardList },
  { title: 'Add School', description: 'Onboard a new school tenant.', to: '/saas/schools/create', icon: Plus },
  { title: 'Branches Directory', description: 'Review branch records across school tenants.', to: '/branches', icon: GitBranch },
  { title: 'Bulk Operations', description: 'Open platform-level administrative operations.', to: '/saas/admin', icon: Layers },
  { title: 'Platform Configuration', description: 'Manage shared platform settings.', to: '/admin/config', icon: Settings }
];
const filteredPlatformTools = computed(() => {
  const query = toolSearch.value.trim().toLowerCase();
  return query
    ? platformTools.filter(tool => `${tool.title} ${tool.description}`.toLowerCase().includes(query))
    : platformTools;
});

// VueUse debounced search
const debouncedSearch = useDebounceFn(() => {
  filters.value.page = 1;
  fetchSchools();
}, 300);

// Fetch schools with current filters
const fetchSchools = async () => {
  const result = await fetchSchoolsWithSubscriptions(filters.value);
  if (result) {
    pagination.value = result.pagination;
  }
};

const applySchoolFilters = () => {
  filters.value.page = 1;
  fetchSchools();
};

// Fetch plans for filter dropdown
const fetchPlansData = async () => {
  await fetchPlans({ is_active: true });
};

// Change page
const changePage = page => {
  if (pagination.value && page >= 1 && page <= pagination.value.pages) {
    filters.value.page = page;
    fetchSchools();
  }
};

const onPageSizeChange = newLimit => {
  filters.value.limit = newLimit;
  filters.value.page = 1; // Reset to first page when page size changes
  fetchSchools();
};

// Clear filters
const clearFilters = () => {
  filters.value = {
    search: '',
    status: '',
    subscription_plan: '',
    registered_period: '',
    sort: 'newest',
    page: 1,
    limit: 10
  };
  fetchSchools();
};

// Get page numbers for pagination
const getPageNumbers = () => {
  if (!pagination.value) return [];

  const pages = [];
  const current = pagination.value.page;
  const total = pagination.value.pages;

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(total);
    } else if (current >= total - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = total - 4; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(total);
    }
  }

  return pages;
};

// Format date
const formatDate = dateString => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

// Get days remaining
const getDaysRemaining = dateString => {
  if (!dateString) return null; // Return null for lifetime plans
  const endDate = new Date(dateString);
  const today = new Date();
  const diffTime = endDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Get status class
const getStatusClass = status => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'trial':
      return 'bg-indigo-100 text-indigo-800';
    case 'suspended':
      return 'bg-red-100 text-red-800';
    case 'expired':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const suspendSchoolAction = async schoolId => {
  if (confirm('Are you sure you want to suspend this school?')) {
    await suspendSchool(schoolId);
    fetchSchools();
  }
};

const reactivateSchoolAction = async schoolId => {
  if (confirm('Are you sure you want to reactivate this school?')) {
    await reactivateSchool(schoolId);
    fetchSchools();
  }
};

const overviewReport = ref(null);
const loadingOverview = ref(false);

const formatSubscriptionRevenue = rows => {
  if (!rows?.length) return '—';
  return rows
    .map(({ currency, amount }) => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(amount) || 0))
    .join(' · ');
};

const fetchOverview = async () => {
  if (user.value?.role !== 'super_admin') return;
  try {
    loadingOverview.value = true;
    const res = await Dashboard.getOverviewReport();
    if (res && res.success) {
      overviewReport.value = res.data;
    }
  } catch (err) {
    console.error('Failed to fetch SaaS overview report:', err);
  } finally {
    loadingOverview.value = false;
  }
};

// Watch for user role changes and load data
watch(
  () => user.value?.role,
  role => {
    if (role === 'super_admin') {
      fetchSchools();
      fetchPlansData();
      fetchOverview();
    } else if (role && role !== 'super_admin') {
      showError('Access denied. Only Super Admin can manage subscriptions.');
      navigateTo('/dashboard');
    }
  },
  { immediate: true }
);

onMounted(() => {
  // Initial load if user is already available
  if (user.value?.role === 'super_admin') {
    fetchSchools();
    fetchPlansData();
    fetchOverview();
  }
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
