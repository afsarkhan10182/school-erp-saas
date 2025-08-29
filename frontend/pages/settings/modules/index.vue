<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header Section -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="container mx-auto px-4 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Module Management</h1>
            <p class="text-gray-600 dark:text-gray-400 mt-2">
              {{ isSuperAdmin ? 'Manage all schools and their module access' : 'View your school modules and subscription' }}
            </p>
          </div>
          <div class="flex items-center space-x-3">
            <button
              v-if="isSuperAdmin"
              @click="showSchoolSelector = true"
              class="btn-primary"
            >
              <Icon name="heroicons:plus" class="w-4 h-4 mr-2" />
              Manage School Modules
            </button>
            <button
              v-if="!isSuperAdmin"
              @click="showUpgradeModal = true"
              class="btn-primary"
            >
              <Icon name="heroicons:arrow-up" class="w-4 h-4 mr-2" />
              Request Upgrade
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container mx-auto px-4 py-8">
      <!-- Super Admin View -->
      <div v-if="isSuperAdmin">
        <!-- Schools Overview -->
        <div class="mb-8">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Schools Overview
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div class="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {{ schools.length }}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  Total Schools
                </div>
              </div>
              <div class="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                  {{ activeSchools.length }}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  Active Schools
                </div>
              </div>
              <div class="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {{ subscriptionPlans.length }}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  Available Plans
                </div>
              </div>
              <div class="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {{ allModules.length }}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  Total Modules
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Schools List -->
        <div class="mb-8">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                Schools and Their Module Access
              </h2>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      School
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Plan
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Active Modules
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  <tr v-for="school in schools" :key="school.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                          <div class="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                            <span class="text-sm font-medium text-indigo-600 dark:text-indigo-300">
                              {{ school.name.charAt(0).toUpperCase() }}
                            </span>
                          </div>
                        </div>
                        <div class="ml-4">
                          <div class="text-sm font-medium text-gray-900 dark:text-white">
                            {{ school.name }}
                          </div>
                          <div class="text-sm text-gray-500 dark:text-gray-400">
                            {{ school.email }}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900 dark:text-white">
                        {{ getPlanName(school.subscription_plan) }}
                      </div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">
                        ₹{{ getPlanPrice(school.subscription_plan) }}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex flex-wrap gap-1">
                        <span
                          v-for="module in getSchoolModules(school.id)"
                          :key="module.code"
                          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        >
                          {{ module.name || module.code }}
                        </span>
                        <span v-if="getSchoolModules(school.id).length === 0" class="text-xs text-gray-500">
                          No modules
                        </span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        :class="[
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          school.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        ]"
                      >
                        {{ school.is_active ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        @click="manageSchoolModules(school)"
                        class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Manage Modules
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- All Available Modules -->
        <div class="mb-8">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              All Available Modules
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div
                v-for="module in allModules"
                :key="module.code"
                class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
              >
                <div class="flex items-center space-x-3">
                  <div class="text-2xl">{{ module.icon }}</div>
                  <div class="flex-1">
                    <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ module.name }}
                    </h3>
                    <p class="text-xs text-gray-600 dark:text-gray-400">
                      {{ module.description }}
                    </p>
                  </div>
                  <span
                    :class="[
                      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                      module.is_core 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                    ]"
                  >
                    {{ module.is_core ? 'Core' : 'Optional' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- School Admin View (Existing) -->
      <div v-else>
        <!-- Current Subscription Info -->
        <div class="mb-8">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Current Subscription
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {{ currentPlan?.name || 'Trial' }}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  Subscription Plan
                </div>
              </div>
              <div class="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                  {{ enabledModules.length }}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  Active Modules
                </div>
              </div>
              <div class="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  ₹{{ currentPlan?.price || 0 }}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  Monthly Price
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modules Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="module in modules"
            :key="module.key"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-md"
            :class="{
              'ring-2 ring-green-500': module.enabled,
              'opacity-75': !module.enabled
            }"
          >
            <!-- Module Header -->
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center space-x-3">
                <div class="text-3xl">{{ module.icon }}</div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ module.name }}
                  </h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ module.description }}
                  </p>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <!-- Status Badge -->
                <span
                  v-if="module.enabled"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                >
                  <Icon name="heroicons:check-circle" class="w-3 h-3 mr-1" />
                  Active
                </span>
                <span
                  v-else
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                >
                  <Icon name="heroicons:lock-closed" class="w-3 h-3 mr-1" />
                  Locked
                </span>
              </div>
            </div>

            <!-- Module Features -->
            <div class="mb-4">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Features:
              </h4>
              <ul class="space-y-1">
                <li
                  v-for="feature in module.features"
                  :key="feature"
                  class="text-xs text-gray-600 dark:text-gray-400 flex items-center"
                >
                  <Icon name="heroicons:check" class="w-3 h-3 mr-1 text-green-500" />
                  {{ feature }}
                </li>
              </ul>
            </div>

            <!-- Action Button -->
            <div v-if="!module.enabled && !isSuperAdmin" class="mt-4">
              <button
                @click="requestUpgrade(module.key)"
                class="w-full text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Upgrade to unlock →
              </button>
            </div>
          </div>
        </div>

        <!-- Upgrade Info for School Admin -->
        <div v-if="!isSuperAdmin" class="mt-8">
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div class="flex items-start">
              <Icon name="heroicons:information-circle" class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" />
              <div>
                <h3 class="text-lg font-medium text-blue-900 dark:text-blue-100">
                  Need More Features?
                </h3>
                <p class="text-blue-700 dark:text-blue-300 mt-1">
                  Contact us to upgrade your subscription and unlock additional modules like Attendance, Exams, Library, and more.
                </p>
                <button
                  @click="showUpgradeModal = true"
                  class="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Request Upgrade
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- School Module Management Modal (Super Admin Only) -->
    <Modal :show="showSchoolSelector" @close="showSchoolSelector = false">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Manage School Modules: {{ selectedSchool?.name }}
        </h3>
      </template>
      
      <template #body>
        <div v-if="selectedSchool" class="space-y-6">
          <!-- Current Plan Info -->
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 class="font-medium text-gray-900 dark:text-white mb-2">
              Current Plan: {{ getPlanName(selectedSchool.subscription_plan) }}
            </h4>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Price: ₹{{ getPlanPrice(selectedSchool.subscription_plan) }} | 
              Max Students: {{ getPlanMaxStudents(selectedSchool.subscription_plan) }} |
              Max Branches: {{ getPlanMaxBranches(selectedSchool.subscription_plan) }}
            </p>
          </div>

          <!-- Plan Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Change Subscription Plan
            </label>
            <select
              v-model="selectedPlanForSchool"
              class="input-field"
            >
              <option value="">Keep current plan</option>
              <option
                v-for="plan in subscriptionPlans"
                :key="plan.code"
                :value="plan.code"
              >
                {{ plan.name }} - ₹{{ plan.price }}/month
              </option>
            </select>
          </div>

          <!-- Module Toggle -->
          <div>
            <h4 class="font-medium text-gray-900 dark:text-white mb-3">
              Module Access Control
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                v-for="module in allModules"
                :key="module.code"
                class="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div class="flex items-center space-x-3">
                  <div class="text-xl">{{ module.icon }}</div>
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ module.name }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      {{ module.description }}
                    </div>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <span
                    :class="[
                      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                      module.is_core 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                    ]"
                  >
                    {{ module.is_core ? 'Core' : 'Optional' }}
                  </span>
                  <input
                    type="checkbox"
                    :checked="selectedSchoolModules.includes(module.code)"
                    @change="toggleModule(module.code)"
                    class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    :disabled="module.is_core"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <button
            @click="showSchoolSelector = false"
            class="btn-secondary"
          >
            Cancel
          </button>
          <button
            @click="updateSchoolModules"
            :disabled="isUpdating"
            class="btn-primary"
          >
            <Icon v-if="isUpdating" name="heroicons:arrow-path" class="w-4 h-4 mr-2 animate-spin" />
            {{ isUpdating ? 'Updating...' : 'Update School Modules' }}
          </button>
        </div>
      </template>
    </Modal>

    <!-- Upgrade Request Modal (School Admin Only) -->
    <Modal :show="showUpgradeModal" @close="showUpgradeModal = false">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Request Subscription Upgrade
        </h3>
      </template>
      
      <template #body>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Desired Plan
            </label>
            <select
              v-model="upgradeRequest.plan"
              class="input-field"
            >
              <option value="">Select a plan...</option>
              <option
                v-for="plan in upgradeablePlans"
                :key="plan.code"
                :value="plan.code"
              >
                {{ plan.name }} - ₹{{ plan.price }}/month
              </option>
            </select>
          </div>

          <div v-if="upgradeRequestDetails" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 class="font-medium text-gray-900 dark:text-white mb-2">
              Plan Details:
            </h4>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              <p><strong>Price:</strong> ₹{{ upgradeRequestDetails.price }}/month</p>
              <p><strong>Max Students:</strong> {{ upgradeRequestDetails.max_students === -1 ? 'Unlimited' : upgradeRequestDetails.max_students }}</p>
              <p><strong>Max Branches:</strong> {{ upgradeRequestDetails.max_branches === -1 ? 'Unlimited' : upgradeRequestDetails.max_branches }}</p>
              <p><strong>Max Staff:</strong> {{ upgradeRequestDetails.max_staff === -1 ? 'Unlimited' : upgradeRequestDetails.max_staff }}</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason for Upgrade
            </label>
            <textarea
              v-model="upgradeRequest.reason"
              rows="3"
              class="input-field"
              placeholder="Please explain why you need this upgrade..."
            ></textarea>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <button
            @click="showUpgradeModal = false"
            class="btn-secondary"
          >
            Cancel
          </button>
          <button
            @click="submitUpgradeRequest"
            :disabled="!upgradeRequest.plan || !upgradeRequest.reason || isSubmitting"
            class="btn-primary"
          >
            <Icon v-if="isSubmitting" name="heroicons:arrow-path" class="w-4 h-4 mr-2 animate-spin" />
            {{ isSubmitting ? 'Submitting...' : 'Submit Request' }}
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useToast } from '~/composables/useToast'
import { apiClient } from '~/utils/api'

// Composables
const { user } = useAuth()
const { showSuccess, showError } = useToast()

// Reactive data
const modules = ref([])
const subscriptionPlans = ref([])
const currentPlan = ref(null)
const isLoading = ref(false)
const isUpdating = ref(false)
const isSubmitting = ref(false)

// Super admin specific data
const schools = ref([])
const allModules = ref([])
const selectedSchool = ref(null)
const selectedPlanForSchool = ref('')
const selectedSchoolModules = ref([])

// Modal states
const showSchoolSelector = ref(false)
const showUpgradeModal = ref(false)
const upgradeRequest = ref({
  plan: '',
  reason: ''
})

// Computed properties
const isSuperAdmin = computed(() => user.value?.role === 'super_admin')
const isSchoolAdmin = computed(() => user.value?.role === 'school_admin')

const enabledModules = computed(() => 
  modules.value.filter(module => module.enabled)
)

const activeSchools = computed(() => 
  schools.value.filter(school => school.is_active)
)

const upgradeablePlans = computed(() => 
  subscriptionPlans.value.filter(plan => plan.price > (currentPlan.value?.price || 0))
)

const upgradeRequestDetails = computed(() => 
  subscriptionPlans.value.find(plan => plan.code === upgradeRequest.plan)
)

// Methods for super admin
const loadSchools = async () => {
  try {
    const response = await apiClient.schools.getAll()
    if (response.success) {
      // Handle both paginated and direct response formats
      schools.value = response.data?.schools || response.data || []
    } else {
      showError('Failed to load schools: ' + response.message)
    }
  } catch (error) {
    console.error('Error loading schools:', error)
    showError('Failed to load schools')
  }
}

const loadAllModules = async () => {
  try {
    const response = await apiClient.saas.getAvailableModules()
    if (response.success) {
      allModules.value = response.data || []
    } else {
      showError('Failed to load modules: ' + response.message)
    }
  } catch (error) {
    console.error('Error loading modules:', error)
    showError('Failed to load modules')
  }
}

const getPlanName = (planCode) => {
  const plan = subscriptionPlans.value.find(p => p.code === planCode)
  return plan?.name || planCode
}

const getPlanPrice = (planCode) => {
  const plan = subscriptionPlans.value.find(p => p.code === planCode)
  return plan?.price || 0
}

const getPlanMaxStudents = (planCode) => {
  const plan = subscriptionPlans.value.find(p => p.code === planCode)
  return plan?.max_students === -1 ? 'Unlimited' : plan?.max_students || 0
}

const getPlanMaxBranches = (planCode) => {
  const plan = subscriptionPlans.value.find(p => p.code === planCode)
  return plan?.max_branches === -1 ? 'Unlimited' : plan?.max_branches || 0
}

const getSchoolModules = (schoolId) => {
  // For now, return modules based on the school's subscription plan
  // This is a simplified approach - in a real implementation, you'd load from API
  const school = schools.value.find(s => s.id === schoolId)
  if (!school) return []
  
  const plan = subscriptionPlans.value.find(p => p.code === school.subscription_plan)
  if (!plan) return []
  
  return plan.modules || []
}

const loadSchoolModules = async (schoolId) => {
  try {
    const response = await apiClient.schools.getModules(schoolId)
    if (response.success) {
      return response.data.modules || []
    }
    return []
  } catch (error) {
    console.error('Error loading school modules:', error)
    showError('Failed to load school modules')
    return []
  }
}

const manageSchoolModules = async (school) => {
  selectedSchool.value = school
  selectedPlanForSchool.value = school.subscription_plan
  
  // Load the school's current modules
  const schoolModules = await loadSchoolModules(school.id)
  selectedSchoolModules.value = schoolModules
    .filter(module => module.enabled)
    .map(module => module.key || module.code)
  
  showSchoolSelector.value = true
}

const toggleModule = (moduleCode) => {
  const index = selectedSchoolModules.value.indexOf(moduleCode)
  if (index > -1) {
    selectedSchoolModules.value.splice(index, 1)
  } else {
    selectedSchoolModules.value.push(moduleCode)
  }
}

const updateSchoolModules = async () => {
  if (!selectedSchool.value) return

  try {
    isUpdating.value = true
    
    // Update school subscription plan if changed
    if (selectedPlanForSchool.value && selectedPlanForSchool.value !== selectedSchool.value.subscription_plan) {
      await apiClient.schools.updateModules(
        selectedSchool.value.id,
        selectedSchoolModules.value,
        selectedPlanForSchool.value
      )
    } else {
      // Update only modules for current plan
      await apiClient.schools.updateModules(
        selectedSchool.value.id,
        selectedSchoolModules.value
      )
    }
    
    showSuccess('School modules updated successfully')
    showSchoolSelector.value = false
    selectedSchool.value = null
    selectedPlanForSchool.value = ''
    selectedSchoolModules.value = []
    
    // Reload schools to get updated data
    await loadSchools()
  } catch (error) {
    showError('Failed to update school modules')
  } finally {
    isUpdating.value = false
  }
}

// Methods for school admin (existing)
const loadModules = async () => {
  try {
    isLoading.value = true
    const schoolId = user.value?.school_id
    
    if (!schoolId) {
      showError('No school assigned to your account')
      return
    }

    const response = await apiClient.schools.getModules(schoolId)
    
    if (response.success) {
      modules.value = response.data.modules || []
      currentPlan.value = response.data.plan_comparison?.find(plan => plan.isCurrentPlan)
    }
  } catch (error) {
    showError('Failed to load modules')
  } finally {
    isLoading.value = false
  }
}

const loadSubscriptionPlans = async () => {
  try {
    const response = await apiClient.saas.getActivePlansForSchools()
    
    if (response.success) {
      subscriptionPlans.value = response.data.plans || response.data || []
    } else {
      showError('Failed to load subscription plans: ' + response.message)
    }
  } catch (error) {
    console.error('Error loading subscription plans:', error)
    showError('Failed to load subscription plans')
  }
}

const requestUpgrade = (moduleKey) => {
  // Find a plan that includes this module
  const plan = subscriptionPlans.value.find(p => 
    p.modules.some(m => m.code === moduleKey) && p.price > (currentPlan.value?.price || 0)
  )
  
  if (plan) {
    upgradeRequest.value.plan = plan.code
    upgradeRequest.value.reason = `Need access to ${moduleKey} module`
    showUpgradeModal.value = true
  }
}

const submitUpgradeRequest = async () => {
  if (!upgradeRequest.value.plan || !upgradeRequest.value.reason) return

  try {
    isSubmitting.value = true
    const schoolId = user.value?.school_id
    
    const response = await apiClient.schools.requestUpgrade(
      schoolId,
      upgradeRequest.value.plan,
      upgradeRequest.value.reason
    )
    
    if (response.success) {
      showSuccess('Upgrade request submitted successfully')
      showUpgradeModal.value = false
      upgradeRequest.value = { plan: '', reason: '' }
    }
  } catch (error) {
    showError('Failed to submit upgrade request')
  } finally {
    isSubmitting.value = false
  }
}

// Lifecycle
onMounted(async () => {
  if (isSuperAdmin.value) {
    // Load data for super admin
    await Promise.all([
      loadSchools(),
      loadAllModules(),
      loadSubscriptionPlans()
    ])
  } else {
    // Load data for school admin
    await Promise.all([
      loadModules(),
      loadSubscriptionPlans()
    ])
  }
})
</script>

<style scoped>
.container {
  max-width: 1200px;
}

/* Smooth transitions */
.transition-all {
  transition: all 0.2s ease-in-out;
}
</style>

