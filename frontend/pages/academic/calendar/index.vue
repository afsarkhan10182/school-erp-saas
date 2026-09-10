<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Academic Calendar</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage academic year events, holidays, terms, and important dates
          </p>
        </div>
        <div class="mt-4 sm:mt-0">
          <button
            @click="openCreateEvent"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus class="-ml-1 mr-2 h-5 w-5" />
            Add Event
          </button>
        </div>
      </div>

      <!-- Tab Navigation -->
      <ScrollableTabs
        :tabs="calendarTabs"
        :active-tab="activeTab"
        @tab-change="activeTab = $event"
      />

      <!-- Filters -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6"
      >
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <!-- Academic Year -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >Academic Year</label
            >
            <select
              v-model="filters.academic_year"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              @change="loadCalendar"
            >
              <option value="">All Years</option>
              <option v-for="year in academicYearOptions" :key="year.value" :value="year.value">
                {{ year.label }}
              </option>
            </select>
          </div>

          <!-- Day Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >Day Type</label
            >
            <select
              v-model="filters.day_type"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              @change="loadCalendar"
            >
              <option value="">All Types</option>
              <option value="working">Working Day</option>
              <option value="holiday">Holiday</option>
              <option value="weekend">Weekend</option>
              <option value="exam">Exam Day</option>
              <option value="event">Event</option>
            </select>
          </div>

          <!-- Date Range -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >From Date</label
            >
            <input
              v-model="filters.start_date"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              @change="loadCalendar"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >To Date</label
            >
            <input
              v-model="filters.end_date"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              @change="loadCalendar"
            />
          </div>
        </div>
      </div>

      <!-- Calendar Events Tab -->
      <div
        v-if="activeTab === 'calendar'"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Calendar Events</h3>
            <button
              @click="openCreateEvent"
              class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus class="-ml-1 mr-2 h-4 w-4" />
              Add Event
            </button>
          </div>
        </div>

        <!-- Filters -->
        <div
          class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700"
        >
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <!-- Academic Year Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Academic Year
              </label>
              <select v-model="filters.academic_year" class="input-field" @change="loadCalendar">
                <option value="">All Years</option>
                <option v-for="year in academicYearOptions" :key="year.value" :value="year.value">
                  {{ year.label }}
                </option>
              </select>
            </div>

            <!-- Day Type Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Day Type
              </label>
              <select v-model="filters.day_type" class="input-field" @change="loadCalendar">
                <option value="">All Types</option>
                <option value="working">Working Day</option>
                <option value="holiday">Holiday</option>
                <option value="weekend">Weekend</option>
                <option value="exam">Exam Day</option>
                <option value="event">Event</option>
              </select>
            </div>

            <!-- Start Date Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                v-model="filters.start_date"
                type="date"
                class="input-field"
                @change="loadCalendar"
              />
            </div>

            <!-- End Date Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                v-model="filters.end_date"
                type="date"
                class="input-field"
                @change="loadCalendar"
              />
            </div>
          </div>

          <!-- Reset Filters -->
          <div class="mt-4">
            <button
              @click="resetFilters"
              class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div v-if="loading" class="p-8 text-center">
          <div
            class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500 hover:bg-blue-400 transition ease-in-out duration-150 cursor-not-allowed"
          >
            <svg
              class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading calendar events...
          </div>
        </div>

        <div v-else-if="calendarEvents.length === 0" class="p-8 text-center">
          <div class="text-gray-500 dark:text-gray-400">
            <Calendar class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No calendar events found
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new calendar event.
            </p>
            <div class="mt-6">
              <button
                @click="openCreateEvent"
                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus class="-ml-1 mr-2 h-5 w-5" />
                Add Event
              </button>
            </div>
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
                  Day Type
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Description
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Academic Year
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
                v-for="event in calendarEvents"
                :key="event.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ formatDate(event.date) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="{
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200':
                        event.day_type === 'working',
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200':
                        event.day_type === 'holiday',
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300':
                        event.day_type === 'weekend',
                      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200':
                        event.day_type === 'exam',
                      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200':
                        event.day_type === 'event'
                    }"
                  >
                    {{ event.day_type.replace('_', ' ').toUpperCase() }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {{ event.description || 'No description' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ event.academic_year }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex space-x-2">
                    <button
                      @click="editEvent(event)"
                      class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      Edit
                    </button>
                    <button
                      @click="deleteEvent(event)"
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Terms & Semesters Tab -->
      <div
        v-if="activeTab === 'terms'"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Terms & Semesters</h3>
            <button
              @click="openCreateTerm"
              class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus class="-ml-1 mr-2 h-4 w-4" />
              Add Term
            </button>
          </div>
        </div>

        <!-- Term Filters -->
        <div
          class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700"
        >
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Academic Year Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Academic Year
              </label>
              <select
                v-model="termFilters.academic_year_id"
                class="input-field"
                @change="loadTerms"
              >
                <option value="">All Years</option>
                <option v-for="year in academicYearOptions" :key="year.value" :value="year.value">
                  {{ year.label }}
                </option>
              </select>
            </div>

            <!-- Status Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select v-model="termFilters.status" class="input-field" @change="loadTerms">
                <option value="">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <!-- Reset Filters -->
            <div class="flex items-end">
              <button
                @click="resetTermFilters"
                class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        <!-- Terms List -->
        <div v-if="loading" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>

        <div
          v-else-if="terms.length === 0"
          class="p-8 text-center text-gray-500 dark:text-gray-400"
        >
          <Calendar class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No terms found</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating a new term or semester.
          </p>
          <div class="mt-6">
            <button
                @click="openCreateTerm"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus class="-ml-1 mr-2 h-5 w-5" />
              Add Term
            </button>
          </div>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Academic Year
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Start Date
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  End Date
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="term in terms"
                :key="term.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ term.name }}
                  </div>
                  <div v-if="term.description" class="text-sm text-gray-500 dark:text-gray-400">
                    {{ term.description }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ term.academicYear?.name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ formatDate(term.start_date) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ formatDate(term.end_date) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getStatusBadgeClass(term.status, 'general')">
                    {{ getStatusLabel(term.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end space-x-2">
                    <button
                      @click="editTerm(term)"
                      class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      <Edit class="h-4 w-4" />
                    </button>
                    <button
                      @click="deleteTerm(term)"
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create/Edit Event Modal -->
    <Modal :show="showCreateModal" @close="closeModal">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ isEditing ? 'Edit Calendar Event' : 'Create Calendar Event' }}
        </h3>
      </template>

      <template #body>
        <CalendarEventForm
          :event="editingEvent"
          :academic-years="academicYearOptions"
          @submit="handleEventSubmit"
          @cancel="closeModal"
        />
      </template>
    </Modal>

    <!-- Create/Edit Term Modal -->
    <Modal :show="showCreateTermModal" @close="closeTermModal">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ isEditingTerm ? 'Edit Term' : 'Create Term' }}
        </h3>
      </template>

      <template #body>
        <TermForm
          :term="editingTerm"
          :academic-year-options="academicYearOptions"
          @submit="handleTermSubmit"
          @cancel="closeTermModal"
        />
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { Calendar, Clock } from 'lucide-vue-next';
import { useToast } from '~/composables/useToast';
import { useSchoolBranchScope } from '~/composables/useSchoolBranchScope';
import ScrollableTabs from '~/components/ui/ScrollableTabs.vue';
import { useAcademics } from '~/composables/useAcademics';
import { formatDate, getStatusBadgeClass, getStatusLabel } from '~/utils/formatters';
import { AcademicCalendar } from '~/api';
import { examTermApi } from '~/api/academic/exam-terms';
import Modal from '~/components/ui/Modal.vue';
import CalendarEventForm from '~/components/forms/CalendarEventForm.vue';
import TermForm from '~/components/forms/TermForm.vue';
import { Plus, Edit, Trash2 } from 'lucide-vue-next';

// Composables
const { showToast } = useToast();
const { branchOptions, selectedBranchId, showBranchDropdown, scopeParams, loadScope } = useSchoolBranchScope();
const { academicYears, fetchAcademicYears } = useAcademics();
// formatDate, getStatusBadgeClass, getStatusLabel imported directly from utils

// Reactive data
const loading = ref(false);
const calendarEvents = ref([]);
const terms = ref([]);
const showCreateModal = ref(false);
const showCreateTermModal = ref(false);
const isEditing = ref(false);
const isEditingTerm = ref(false);
const editingEvent = ref(null);
const editingTerm = ref(null);
const activeTab = ref('calendar');

// Tab configuration
const calendarTabs = [
  { id: 'calendar', name: 'Calendar Events', icon: Calendar },
  { id: 'terms', name: 'Terms & Semesters', icon: Clock }
];

// Filters
const filters = ref({
  academic_year: '',
  day_type: '',
  start_date: '',
  end_date: ''
});

const termFilters = ref({
  academic_year_id: '',
  status: ''
});

// Computed
const academicYearOptions = computed(() => {
  return academicYears.value.map(year => ({
    value: year.name,
    label: year.name + (year.is_current ? ' (Current)' : '')
  }));
});

// Methods
const loadCalendar = async () => {
  try {
    loading.value = true;
    const response = await AcademicCalendar.getAll({ ...filters.value, ...scopeParams.value });
    calendarEvents.value = response.data.events || response.data.rows || [];
  } catch (error) {
    showToast('Failed to load calendar events', 'error');
    console.error('Error loading calendar events:', error);
  } finally {
    loading.value = false;
  }
};

const editEvent = event => {
  isEditing.value = true;
  editingEvent.value = event;
  showCreateModal.value = true;
};

const needsBranch = () => showBranchDropdown.value && !selectedBranchId.value;

const openCreateEvent = () => {
  if (needsBranch()) return showToast('Please select a branch first', 'warning');
  showCreateModal.value = true;
};

const openCreateTerm = () => {
  if (needsBranch()) return showToast('Please select a branch first', 'warning');
  showCreateTermModal.value = true;
};

const deleteEvent = async event => {
  if (!confirm(`Are you sure you want to delete this calendar event?`)) return;

  try {
    await AcademicCalendar.delete(event.id);
    showToast('Calendar event deleted successfully', 'success');
    loadCalendar();
  } catch (error) {
    showToast('Failed to delete calendar event', 'error');
    console.error('Error deleting calendar event:', error);
  }
};

const handleEventSubmit = async eventData => {
  try {
    if (editingEvent.value) {
      await AcademicCalendar.update(editingEvent.value.id, { ...eventData, ...scopeParams.value });
      showToast('Calendar event updated successfully', 'success');
    } else {
      await AcademicCalendar.create({ ...eventData, ...scopeParams.value });
      showToast('Calendar event created successfully', 'success');
    }
    closeModal();
    loadCalendar();
  } catch (error) {
    showToast(error.response?.data?.message || 'Failed to save calendar event', 'error');
    console.error('Error in handleEventSubmit:', error);
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  editingEvent.value = null;
  isEditing.value = false;
};

const closeTermModal = () => {
  showCreateTermModal.value = false;
  isEditingTerm.value = false;
  editingTerm.value = null;
};

const loadTerms = async () => {
  try {
    loading.value = true;
    const response = await examTermApi.getAll({ ...termFilters.value, ...scopeParams.value });
    terms.value = response.data.terms || [];
  } catch (error) {
    showToast('Failed to load terms', 'error');
    console.error('Error loading terms:', error);
  } finally {
    loading.value = false;
  }
};

const editTerm = term => {
  isEditingTerm.value = true;
  editingTerm.value = term;
  showCreateTermModal.value = true;
};

const deleteTerm = async term => {
  if (!confirm(`Are you sure you want to delete the term "${term.name}"?`)) {
    return;
  }

  try {
    await examTermApi.delete(term.id);
    showToast('Term deleted successfully', 'success');
    loadTerms();
  } catch (error) {
    showToast('Failed to delete term', 'error');
    console.error('Error deleting term:', error);
  }
};

const handleTermSubmit = async formData => {
  try {
    if (isEditingTerm.value) {
      await examTermApi.update(editingTerm.value.id, { ...formData, ...scopeParams.value });
      showToast('Term updated successfully', 'success');
    } else {
      await examTermApi.create({ ...formData, ...scopeParams.value });
      showToast('Term created successfully', 'success');
    }

    closeTermModal();
    loadTerms();
  } catch (error) {
    showToast(`Failed to ${isEditingTerm.value ? 'update' : 'create'} term`, 'error');
    console.error('Error submitting term:', error);
  }
};

const resetFilters = () => {
  filters.value = {
    academic_year: '',
    day_type: '',
    start_date: '',
    end_date: ''
  };
  loadCalendar();
};

const resetTermFilters = () => {
  termFilters.value = {
    academic_year_id: '',
    status: ''
  };
  loadTerms();
};

const loadScopedCalendar = async () => {
  await Promise.all([loadCalendar(), loadTerms()]);
};

// Lifecycle
onMounted(async () => {
  await loadScope();
  await fetchAcademicYears();
  await loadCalendar();
  await loadTerms();
});

watch(selectedBranchId, async () => {
  await loadScopedCalendar();
});
</script>
