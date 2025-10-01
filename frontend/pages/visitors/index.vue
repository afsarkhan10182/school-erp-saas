<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Visitor Management</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Track and manage school visitors
          </p>
        </div>
        <div class="mt-4 sm:mt-0 sm:flex sm:space-x-3">
          <button
            @click="openCreateModal"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus class="-ml-1 mr-2 h-5 w-5" />
            Add Visitor
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <Users class="h-6 w-6 text-blue-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Visitors
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ stats.totalVisitors || 0 }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <Clock class="h-6 w-6 text-yellow-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Currently Inside
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ stats.currentlyInside || 0 }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <CheckCircle class="h-6 w-6 text-green-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Today's Visitors
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ stats.todayVisitors || 0 }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <Calendar class="h-6 w-6 text-purple-400" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    This Week
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ stats.weekVisitors || 0 }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
        <div class="px-4 py-5 sm:p-6">
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >Status</label
              >
              <select
                v-model="filters.status"
                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">All Status</option>
                <option value="inside">Inside</option>
                <option value="left">Left</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >Purpose</label
              >
              <select
                v-model="filters.purpose"
                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">All Purposes</option>
                <option value="meeting">Meeting</option>
                <option value="interview">Interview</option>
                <option value="delivery">Delivery</option>
                <option value="parent_visit">Parent Visit</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >Date Range</label
              >
              <select
                v-model="filters.dateRange"
                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            <div v-if="filters.dateRange === 'custom'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >From Date</label
              >
              <input
                v-model="filters.fromDate"
                type="date"
                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div class="flex items-end">
              <button
                @click="fetchVisitors"
                class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Search class="-ml-1 mr-2 h-4 w-4" />
                Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Visitors Table -->
      <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Visitor Records
          </h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Visitor
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Purpose
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Contact Person
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Entry Time
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Exit Time
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
                v-for="visitor in visitors"
                :key="visitor.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div
                        class="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center"
                      >
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {{ visitor.name?.charAt(0) }}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ visitor.name }}
                      </div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">
                        {{ visitor.phone }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <span class="capitalize">{{ visitor.purpose }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ visitor.contact_person }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ formatDateTime(visitor.entry_time) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ visitor.exit_time ? formatDateTime(visitor.exit_time) : '-' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="getStatusClass(visitor.status)"
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                  >
                    {{ getStatusText(visitor.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    @click="viewVisitor(visitor)"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                  >
                    View
                  </button>
                  <button
                    v-if="visitor.status === 'inside'"
                    @click="markExit(visitor)"
                    class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3"
                  >
                    Mark Exit
                  </button>
                  <button
                    @click="editVisitor(visitor)"
                    class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <Pagination
          v-if="totalItems > 0"
          :pagination="{
            page: currentPage,
            limit: pageSize,
            total: totalItems
          }"
          item-label="visitors"
          @page-changed="goToPage"
          @page-size-changed="onPageSizeChange"
        />
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    >
      <div
        class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800"
      >
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ isEditing ? 'Edit Visitor' : 'Add New Visitor' }}
          </h3>

          <form @submit.prevent="saveVisitor">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >Name *</label
              >
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter visitor name"
              />
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >Phone *</label
              >
              <input
                v-model="form.phone"
                type="tel"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter phone number"
                @input="form.phone = form.phone.replace(/[^\d+]/g, '')"
              />
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >Purpose *</label
              >
              <select
                v-model="form.purpose"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select purpose</option>
                <option value="meeting">Meeting</option>
                <option value="interview">Interview</option>
                <option value="delivery">Delivery</option>
                <option value="parent_visit">Parent Visit</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >Contact Person *</label
              >
              <input
                v-model="form.contact_person"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter contact person name"
              />
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >Notes</label
              >
              <textarea
                v-model="form.notes"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter any additional notes"
              ></textarea>
            </div>

            <div class="flex justify-end space-x-3">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {{ isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Add' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { Plus, Users, Clock, CheckCircle, Calendar, Search } from 'lucide-vue-next';
import Pagination from '~/components/ui/Pagination.vue';
import { useToast } from '~/composables/useToast';

const { showSuccess } = useToast();

// State
const visitors = ref([]);
const stats = ref({});
const isLoading = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const isSubmitting = ref(false);
const editingId = ref(null);

// Pagination
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);

// Filters
const filters = reactive({
  status: '',
  purpose: '',
  dateRange: 'today',
  fromDate: '',
  toDate: ''
});

// Forms
const form = reactive({
  name: '',
  phone: '',
  purpose: '',
  contact_person: '',
  notes: ''
});

// Methods
const fetchVisitors = async () => {
  isLoading.value = true;
  try {
    // Mock data for now - replace with actual API call
    const mockVisitors = [
      {
        id: 1,
        name: 'John Doe',
        phone: '+1234567890',
        purpose: 'meeting',
        contact_person: 'Principal Smith',
        entry_time: new Date().toISOString(),
        exit_time: null,
        status: 'inside',
        notes: 'Meeting about school partnership'
      },
      {
        id: 2,
        name: 'Jane Smith',
        phone: '+0987654321',
        purpose: 'parent_visit',
        contact_person: 'Teacher Johnson',
        entry_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        exit_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        status: 'left',
        notes: 'Parent-teacher meeting'
      }
    ];

    visitors.value = mockVisitors;
    totalItems.value = mockVisitors.length;
  } catch (error) {
    console.error('Error fetching visitors:', error);
  } finally {
    isLoading.value = false;
  }
};

const fetchStats = async () => {
  try {
    // Mock stats - replace with actual API call
    stats.value = {
      totalVisitors: 25,
      currentlyInside: 3,
      todayVisitors: 8,
      weekVisitors: 45
    };
  } catch (error) {
    console.error('Error fetching visitor stats:', error);
  }
};

const openCreateModal = () => {
  resetForm();
  isEditing.value = false;
  showModal.value = true;
};

const editVisitor = visitor => {
  Object.assign(form, {
    name: visitor.name,
    phone: visitor.phone,
    purpose: visitor.purpose,
    contact_person: visitor.contact_person,
    notes: visitor.notes || ''
  });
  editingId.value = visitor.id;
  isEditing.value = true;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  resetForm();
  editingId.value = null;
};

const resetForm = () => {
  Object.assign(form, {
    name: '',
    phone: '',
    purpose: '',
    contact_person: '',
    notes: ''
  });
};

const saveVisitor = async () => {
  isSubmitting.value = true;
  try {
    // Mock save - replace with actual API call
    if (isEditing.value) {
      // Update existing visitor
      const index = visitors.value.findIndex(v => v.id === editingId.value);
      if (index !== -1) {
        visitors.value[index] = { ...visitors.value[index], ...form };
      }
    } else {
      // Add new visitor
      const newVisitor = {
        id: Date.now(),
        ...form,
        entry_time: new Date().toISOString(),
        exit_time: null,
        status: 'inside'
      };
      visitors.value.unshift(newVisitor);
    }

    closeModal();
    await fetchStats();

    // Show success message
    showSuccess(`Visitor ${isEditing.value ? 'updated' : 'added'} successfully!`);
  } catch (error) {
    console.error('Error saving visitor:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const markExit = async visitor => {
  try {
    // Mock exit - replace with actual API call
    const index = visitors.value.findIndex(v => v.id === visitor.id);
    if (index !== -1) {
      visitors.value[index].exit_time = new Date().toISOString();
      visitors.value[index].status = 'left';
    }

    await fetchStats();

    // Show success message
    showSuccess('Visitor exit marked successfully!');
  } catch (error) {
    console.error('Error marking exit:', error);
  }
};

const viewVisitor = visitor => {
  // Navigate to visitor detail page
  navigateTo(`/visitors/${visitor.id}`);
};

const goToPage = page => {
  if (page >= 1) {
    currentPage.value = page;
    fetchVisitors();
  }
};

const onPageSizeChange = newPageSize => {
  pageSize.value = newPageSize;
  currentPage.value = 1; // Reset to first page when page size changes
  fetchVisitors();
};

const formatDateTime = dateTime => {
  if (!dateTime) return '-';
  return new Date(dateTime).toLocaleString('en-IN');
};

const getStatusClass = status => {
  const classes = {
    inside: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    left: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  };
  return classes[status] || classes.left;
};

const getStatusText = status => {
  const texts = {
    inside: 'Inside',
    left: 'Left',
    scheduled: 'Scheduled'
  };
  return texts[status] || status;
};

onMounted(async () => {
  await Promise.all([fetchVisitors(), fetchStats()]);
});
</script>
