<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header Section -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="container mx-auto px-4 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Module Management</h1>
            <p class="text-gray-600 dark:text-gray-400 mt-2">
              {{ isSuperAdmin ? 'Manage school modules and subscriptions' : 'View your school modules and subscription' }}
            </p>
          </div>
          <div class="flex items-center space-x-3">
            <button
              v-if="isSuperAdmin"
              @click="showPlanSelector = true"
              class="btn-primary"
            >
              <Icon name="heroicons:plus" class="w-4 h-4 mr-2" />
              Update Subscription
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

    <!-- Subscription Plan Selector Modal (Super Admin Only) -->
    <Modal v-if="showPlanSelector" @close="showPlanSelector = false" size="lg">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Update School Subscription
        </h3>
      </template>
      
      <template #body>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Subscription Plan
            </label>
            <select
              v-model="selectedPlan"
              class="input-field"
            >
              <option value="">Select a plan...</option>
              <option
                v-for="plan in subscriptionPlans"
                :key="plan.key"
                :value="plan.key"
              >
                {{ plan.name }} - ₹{{ plan.price }}/month
              </option>
            </select>
          </div>

          <div v-if="selectedPlan" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 class="font-medium text-gray-900 dark:text-white mb-2">
              Plan Details:
            </h4>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              <p><strong>Price:</strong> ₹{{ selectedPlanDetails?.price }}/month</p>
              <p><strong>Max Students:</strong> {{ selectedPlanDetails?.max_students === -1 ? 'Unlimited' : selectedPlanDetails?.max_students }}</p>
              <p><strong>Max Branches:</strong> {{ selectedPlanDetails?.max_branches === -1 ? 'Unlimited' : selectedPlanDetails?.max_branches }}</p>
              <p><strong>Max Staff:</strong> {{ selectedPlanDetails?.max_staff === -1 ? 'Unlimited' : selectedPlanDetails?.max_staff }}</p>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <button
            @click="showPlanSelector = false"
            class="btn-secondary"
          >
            Cancel
          </button>
          <button
            @click="updateSubscription"
            :disabled="!selectedPlan || isUpdating"
            class="btn-primary"
          >
            <Icon v-if="isUpdating" name="heroicons:arrow-path" class="w-4 h-4 mr-2 animate-spin" />
            {{ isUpdating ? 'Updating...' : 'Update Subscription' }}
          </button>
        </div>
      </template>
    </Modal>

    <!-- Upgrade Request Modal (School Admin Only) -->
    <Modal v-if="showUpgradeModal" @close="showUpgradeModal = false" size="lg">
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
                :key="plan.key"
                :value="plan.key"
              >
                {{ plan.name }} - ₹{{ plan.price }}/month
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason for Upgrade
            </label>
            <textarea
              v-model="upgradeRequest.reason"
              rows="4"
              class="input-field"
              placeholder="Please explain why you need this upgrade..."
            ></textarea>
          </div>

          <div v-if="upgradeRequest.plan" class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 class="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Plan Comparison:
            </h4>
            <div class="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p><strong>Current:</strong> {{ currentPlan?.name }} ({{ enabledModules.length }} modules)</p>
              <p><strong>Upgrade to:</strong> {{ upgradeRequestDetails?.name }} ({{ upgradeRequestDetails?.modules?.length }} modules)</p>
              <p><strong>Additional Cost:</strong> ₹{{ upgradeRequestDetails?.price - (currentPlan?.price || 0) }}/month</p>
            </div>
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

// Modal states
const showPlanSelector = ref(false)
const showUpgradeModal = ref(false)
const selectedPlan = ref('')
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

const selectedPlanDetails = computed(() => 
  subscriptionPlans.value.find(plan => plan.key === selectedPlan.value)
)

const upgradeablePlans = computed(() => 
  subscriptionPlans.value.filter(plan => plan.price > (currentPlan.value?.price || 0))
)

const upgradeRequestDetails = computed(() => 
  subscriptionPlans.value.find(plan => plan.key === upgradeRequest.plan)
)

// Methods
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
    console.error('Error loading modules:', error)
    showError('Failed to load modules')
  } finally {
    isLoading.value = false
  }
}

const loadSubscriptionPlans = async () => {
  try {
    const response = await apiClient.schools.getSubscriptionPlans()
    
    if (response.success) {
      subscriptionPlans.value = response.data || []
    }
  } catch (error) {
    console.error('Error loading subscription plans:', error)
    showError('Failed to load subscription plans')
  }
}

const updateSubscription = async () => {
  if (!selectedPlan.value) return

  try {
    isUpdating.value = true
    const schoolId = user.value?.school_id
    
    const response = await apiClient.schools.updateModules(
      schoolId, 
      selectedPlanDetails.value.modules.map(m => m.key),
      selectedPlan.value
    )
    
    if (response.success) {
      showSuccess('Subscription updated successfully')
      showPlanSelector.value = false
      selectedPlan.value = ''
      await loadModules()
    }
  } catch (error) {
    console.error('Error updating subscription:', error)
    showError('Failed to update subscription')
  } finally {
    isUpdating.value = false
  }
}

const requestUpgrade = (moduleKey) => {
  // Find a plan that includes this module
  const plan = subscriptionPlans.value.find(p => 
    p.modules.some(m => m.key === moduleKey) && p.price > (currentPlan.value?.price || 0)
  )
  
  if (plan) {
    upgradeRequest.value.plan = plan.key
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
    console.error('Error submitting upgrade request:', error)
    showError('Failed to submit upgrade request')
  } finally {
    isSubmitting.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadModules(),
    loadSubscriptionPlans()
  ])
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

