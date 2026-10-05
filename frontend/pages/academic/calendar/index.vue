<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Academic Calendar</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage academic year events, holidays, terms, and important dates
        </p>
      </div>
      <div>
        <button
          v-if="activeTab === 'calendar'"
          @click="openCreateEvent"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-150"
        >
          <Plus class="w-4 h-4" />
          Add Event
        </button>
        <button
          v-else-if="activeTab === 'terms'"
          @click="openCreateTerm"
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-150"
        >
          <Plus class="w-4 h-4" />
          Add Term
        </button>
      </div>
    </div>

    <!-- Tab Navigation -->
    <ScrollableTabs
      :tabs="calendarTabs"
      :active-tab="activeTab"
      @tab-change="activeTab = $event"
    />

    <!-- Calendar Events Tab -->
    <div
      v-if="activeTab === 'calendar'"
      class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden space-y-4"
    >
      <!-- Filters -->
      <div
        class="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Academic Year Filter -->
          <div>
            <EnhancedDropdown
              v-model="filters.academic_year"
              label="Academic Year"
              :options="[{ label: 'All Years', value: '' }, ...academicYearOptions]"
              placeholder="All Years"
              @update:model-value="loadCalendar"
            />
          </div>

          <!-- Day Type Filter -->
          <div>
            <EnhancedDropdown
              v-model="filters.day_type"
              label="Day Type"
              :options="[
                { label: 'All Types', value: '' },
                { label: 'Working Day', value: 'working' },
                { label: 'Holiday', value: 'holiday' },
                { label: 'Weekend', value: 'weekend' },
                { label: 'Exam Day', value: 'exam' },
                { label: 'Event', value: 'event' }
              ]"
              placeholder="All Types"
              @update:model-value="loadCalendar"
            />
          </div>

          <!-- Start Date Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
        <div class="mt-3 flex justify-end">
          <button
            @click="resetFilters"
            class="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div v-if="loading" class="p-8 text-center text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
        <span class="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
        Loading calendar events...
      </div>

      <div v-else-if="calendarEvents.length === 0" class="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
        No calendar events found.
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
              <EnhancedDropdown
                v-model="termFilters.academic_year_id"
                :options="[{ label: 'All Years', value: '' }, ...academicYearOptions]"
                placeholder="All Years"
                @update:model-value="loadTerms"
              />
            </div>

            <!-- Status Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <EnhancedDropdown
                v-model="termFilters.status"
                :options="[
                  { label: 'All Status', value: '' },
                  { label: 'Upcoming', value: 'upcoming' },
                  { label: 'Active', value: 'active' },
                  { label: 'Completed', value: 'completed' },
                  { label: 'Cancelled', value: 'cancelled' }
                ]"
                placeholder="All Status"
                @update:model-value="loadTerms"
              />
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
    <ConfirmDialog
      :open="deleteDialog.open"
      :title="deleteDialog.type === 'term' ? 'Delete term' : 'Delete calendar event'"
      :message="deleteDialog.type === 'term' ? 'Are you sure you want to delete this term?' : 'Are you sure you want to delete this calendar event?'"
      confirm-label="Delete"
      @confirm="confirmDelete"
      @cancel="deleteDialog.open = false"
    />
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { Calendar, Clock } from 'lucide-vue-next';
import { useToast } from '~/composables/useToast';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import ScrollableTabs from '~/components/ui/ScrollableTabs.vue';
import { useAcademics } from '~/composables/useAcademics';
import { formatDate, getStatusBadgeClass, getStatusLabel } from '~/utils/formatters';
import { AcademicCalendar } from '~/api';
import { examTermApi } from '~/api/academic/exam-terms';
import Modal from '~/components/ui/Modal.vue';
import CalendarEventForm from '~/components/forms/CalendarEventForm.vue';
import TermForm from '~/components/forms/TermForm.vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { Plus, Edit, Trash2 } from 'lucide-vue-next';
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue';

// Composables
const { showToast } = useToast();
const { selectedBranchId, branchScopeParams: scopeParams } = useGlobalBranch();
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
const deleteDialog = reactive({ open: false, type: '', id: '' });

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
  deleteDialog.id = event.id;
  deleteDialog.type = 'event';
  deleteDialog.open = true;
};

const confirmDelete = async () => {
  try {
    if (deleteDialog.type === 'term') {
      await examTermApi.delete(deleteDialog.id);
      showToast('Term deleted successfully', 'success');
      loadTerms();
    } else {
      await AcademicCalendar.delete(deleteDialog.id);
      showToast('Calendar event deleted successfully', 'success');
      loadCalendar();
    }
  } catch (error) {
    showToast(`Failed to delete ${deleteDialog.type}`, 'error');
    console.error('Error deleting calendar event:', error);
  } finally {
    deleteDialog.open = false;
    deleteDialog.type = '';
    deleteDialog.id = '';
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
  deleteDialog.id = term.id;
  deleteDialog.type = 'term';
  deleteDialog.open = true;
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
  await fetchAcademicYears();
  await loadCalendar();
  await loadTerms();
});

watch(selectedBranchId, async () => {
  await loadScopedCalendar();
});
</script>
