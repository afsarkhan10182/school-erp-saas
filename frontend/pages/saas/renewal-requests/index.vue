<template>
  <div class="container mx-auto py-8 max-w-7xl">
    <!-- Header -->
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Renewal Requests</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">Manage subscription renewal requests from schools</p>
      </div>
      <div class="flex items-center space-x-4">
        <div class="text-sm text-gray-600 dark:text-gray-400">
          <span class="font-medium">{{ pendingCount }}</span> pending requests
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-end">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
        <select v-model="filters.status" class="input-field">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Request Type</label>
        <select v-model="filters.request_type" class="input-field">
          <option value="">All Types</option>
          <option value="renewal">Renewal</option>
          <option value="upgrade">Upgrade</option>
          <option value="downgrade">Downgrade</option>
          <option value="change_plan">Change Plan</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">School</label>
        <select v-model="filters.school_id" class="input-field">
          <option value="">All Schools</option>
          <option v-for="school in schools" :key="school.id" :value="school.id">
            {{ school.name }}
          </option>
        </select>
      </div>
      <div>
        <button @click="loadRequests" class="btn-primary">Apply Filters</button>
        <button @click="clearFilters" class="btn-secondary ml-2">Clear</button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600 dark:text-gray-400">Loading renewal requests...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <div class="text-red-600 dark:text-red-400 mb-4">
        <AlertCircle class="w-12 h-12 mx-auto" />
      </div>
      <p class="text-gray-600 dark:text-gray-400">{{ error }}</p>
      <button @click="loadRequests" class="btn-primary mt-4">Retry</button>
    </div>

    <!-- Requests List -->
    <div v-else class="space-y-4">
      <div v-if="requests.length === 0" class="text-center py-12">
        <div class="text-gray-400 mb-4">
          <FileText class="w-16 h-16 mx-auto" />
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No renewal requests found</h3>
        <p class="text-gray-600 dark:text-gray-400">There are no renewal requests matching your criteria.</p>
      </div>

      <div v-else>
        <div 
          v-for="request in requests" 
          :key="request.id"
          class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4"
          :class="{
            'border-yellow-500': request.status === 'pending',
            'border-green-500': request.status === 'approved',
            'border-red-500': request.status === 'rejected',
            'border-gray-500': request.status === 'cancelled'
          }"
        >
          <div class="flex justify-between items-start mb-4">
            <div class="flex-1">
              <div class="flex items-center space-x-3 mb-2">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ request.school?.name }}
                </h3>
                <span :class="statusClass(request.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                  {{ request.status }}
                </span>
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  {{ request.request_type }}
                </span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Requested by {{ request.requestedBy?.first_name }} {{ request.requestedBy?.last_name }} 
                on {{ formatDate(request.created_at) }}
              </p>
            </div>
            <div v-if="request.status === 'pending'" class="flex space-x-2">
              <button @click="reviewRequest(request, 'approved')" class="btn-success">
                Approve
              </button>
              <button @click="reviewRequest(request, 'rejected')" class="btn-danger">
                Reject
              </button>
            </div>
          </div>

          <!-- Plan Change Details -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 class="font-medium text-gray-900 dark:text-white mb-2">Current Plan</h4>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Plan:</span>
                  <span class="font-medium text-gray-900 dark:text-white">{{ request.current_plan_code }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Ends:</span>
                  <span class="font-medium text-gray-900 dark:text-white">{{ formatDate(request.current_subscription_end_date) }}</span>
                </div>
              </div>
            </div>

            <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 class="font-medium text-gray-900 dark:text-white mb-2">Requested Plan</h4>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Plan:</span>
                  <span class="font-medium text-gray-900 dark:text-white">{{ request.requested_plan_code }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Billing:</span>
                  <span class="font-medium text-gray-900 dark:text-white">{{ request.billing_cycle }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Period:</span>
                  <span class="font-medium text-gray-900 dark:text-white">
                    {{ formatDate(request.requested_start_date) }} - {{ formatDate(request.requested_end_date) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Request Reason -->
          <div v-if="request.request_reason" class="mb-4">
            <h4 class="font-medium text-gray-900 dark:text-white mb-2">Reason for Request</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded">
              {{ request.request_reason }}
            </p>
          </div>

          <!-- Admin Response (if reviewed) -->
          <div v-if="request.admin_response" class="mb-4">
            <h4 class="font-medium text-gray-900 dark:text-white mb-2">Admin Response</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded">
              {{ request.admin_response }}
            </p>
          </div>

          <!-- Review Info -->
          <div v-if="request.reviewedBy" class="text-xs text-gray-500 dark:text-gray-400">
            Reviewed by {{ request.reviewedBy?.first_name }} {{ request.reviewedBy?.last_name }} 
            on {{ formatDate(request.reviewed_at) }}
          </div>
        </div>

        <!-- Enhanced Pagination -->
        <Pagination 
          v-if="pagination && pagination.pages > 1"
          :pagination="{
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total
          }"
          item-label="requests"
          @page-changed="changePage"
          @page-size-changed="onPageSizeChange"
        />
      </div>
    </div>

    <!-- Review Modal -->
    <Modal :show="showReviewModal" @close="showReviewModal = false">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ reviewAction }} Renewal Request</h3>
      </template>
      <template #body>
        <form @submit.prevent="submitReview" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ reviewAction === 'Approve' ? 'Approval' : 'Rejection' }} Notes
            </label>
            <textarea 
              v-model="reviewForm.admin_response" 
              rows="4" 
              class="input-field"
              :placeholder="reviewAction === 'Approve' ? 'Optional notes for approval...' : 'Please provide reason for rejection...'"
            ></textarea>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button type="button" @click="showReviewModal = false" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" :disabled="submitting" class="btn-primary">
              <span v-if="submitting">Processing...</span>
              <span v-else>{{ reviewAction }}</span>
            </button>
          </div>
        </form>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSubscriptions } from '~/composables/useSubscriptions';
import { useAuthStore } from '~/stores/auth';
import { useToast } from '~/composables/useToast';
import { AlertCircle, FileText } from 'lucide-vue-next';
import Pagination from '~/components/Pagination.vue';

// Page meta
definePageMeta({
  // Global auth middleware handles authentication
  layout: 'default'
});

const authStore = useAuthStore();
const { showError, showSuccess } = useToast();

// Access control - only Super Admin can access renewal requests
const user = authStore.user;
if (user?.role !== 'super_admin') {
  showError('Access denied. Only Super Admin can manage renewal requests.');
  await navigateTo('/dashboard');
}

const { loading, error, fetchRenewalRequests, reviewRenewalRequest, fetchSchoolsWithSubscriptions } = useSubscriptions();

// Reactive data
const requests = ref([]);
const schools = ref([]);
const pagination = ref(null);
const showReviewModal = ref(false);
const submitting = ref(false);
const selectedRequest = ref(null);
const reviewAction = ref('');

// Filters
const filters = ref({
  page: 1,
  limit: 10,
  status: '',
  request_type: '',
  school_id: ''
});

// Review form
const reviewForm = ref({
  admin_response: ''
});

// Computed properties
const pendingCount = computed(() => {
  return requests.value.filter(req => req.status === 'pending').length;
});

// Methods
const statusClass = (status) => {
  const classes = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  };
  return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

const loadRequests = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    // Filter out empty values to avoid sending empty query parameters
    const cleanFilters = { ...filters.value };
    Object.keys(cleanFilters).forEach(key => {
      if (cleanFilters[key] === '' || cleanFilters[key] === null || cleanFilters[key] === undefined) {
        delete cleanFilters[key];
      }
    });
    
    const response = await fetchRenewalRequests(cleanFilters);
    
    if (response) {
      requests.value = response.requests;
      pagination.value = response.pagination;
    } else {
      throw new Error('Failed to load renewal requests');
    }
  } catch (err) {
    console.error('Error loading renewal requests:', err);
    error.value = 'Failed to load renewal requests';
    showError('Failed to load renewal requests');
  } finally {
    loading.value = false;
  }
};

const loadSchools = async () => {
  try {
    const response = await fetchSchoolsWithSubscriptions({ limit: 100 });
    if (response && response.data) {
      schools.value = response.data.schools;
    }
  } catch (err) {
    console.error('Error loading schools:', err);
  }
};

const clearFilters = () => {
  filters.value = {
    page: 1,
    limit: 10
  };
  loadRequests();
};

const changePage = (page) => {
  filters.value.page = page;
  loadRequests();
};

const onPageSizeChange = (limit) => {
  filters.value.limit = limit;
  loadRequests();
};

const reviewRequest = (request, action) => {
  selectedRequest.value = request;
  reviewAction.value = action === 'approved' ? 'Approve' : 'Reject';
  reviewForm.value.admin_response = '';
  showReviewModal.value = true;
};

const submitReview = async () => {
  if (!selectedRequest.value) return;
  
  submitting.value = true;
  
  try {
    const reviewData = {
      status: reviewAction.value.toLowerCase() === 'approve' ? 'approved' : 'rejected',
      admin_response: reviewForm.value.admin_response
    };
    
    const response = await reviewRenewalRequest(selectedRequest.value.id, reviewData);
    
    if (response) {
      showSuccess(`Request ${reviewAction.value.toLowerCase()}d successfully`);
      showReviewModal.value = false;
      selectedRequest.value = null;
      reviewForm.value.admin_response = '';
      await loadRequests(); // Reload to show updated status
    } else {
      showError(`Failed to ${reviewAction.value.toLowerCase()} request`);
    }
  } catch (err) {
    console.error('Error reviewing request:', err);
    showError(`Failed to ${reviewAction.value.toLowerCase()} request`);
  } finally {
    submitting.value = false;
  }
};

// Initialize
onMounted(async () => {
  await Promise.all([loadRequests(), loadSchools()]);
});
</script>

<style scoped>
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500;
}

.btn-success {
  @apply bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500;
}

.btn-danger {
  @apply bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500;
}

.input-field {
  @apply block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white sm:text-sm;
}
</style> 