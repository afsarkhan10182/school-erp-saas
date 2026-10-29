<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Timetable Management</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage class schedules and timetables
        </p>
      </div>

      <!-- No Subjects Assigned Message -->
      <div
        v-if="hasNoSubjectsAssigned"
        class="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2"
      >
        <svg class="h-4 w-4 text-amber-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
        <span>No subjects assigned. Please assign subjects to this class first.</span>
      </div>
    </div>

    <p
      v-if="!selectedBranchId"
      role="status"
      class="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200"
    >
      Choose a specific branch in the global selector to view or manage its timetables.
    </p>

      <!-- Selection Controls -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-md mb-6">
        <div class="px-4 py-5 sm:px-6">
          <div class="flex flex-wrap items-end gap-4">
            <!-- Class Selection -->
            <div class="flex-shrink-0">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Class *
              </label>
              <EnhancedDropdown
                v-model="selectedClass"
                :options="classDropdownOptions"
                placeholder="Select Class"
                :disabled="!selectedBranchId"
                @update:model-value="onClassChange"
                class="w-40"
              />
            </div>

            <!-- Section Selection -->
            <div v-if="selectedClass && hasSections" class="flex-shrink-0">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Section *
              </label>
              <EnhancedDropdown
                v-model="selectedSection"
                :options="sectionDropdownOptions"
                placeholder="Select Section"
                @update:model-value="onSectionChange"
                class="w-40"
              />
            </div>

            <!-- Stream Selection -->
            <div v-if="selectedClass && hasStreams" class="flex-shrink-0">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stream
              </label>
              <EnhancedDropdown
                v-model="selectedStream"
                :options="streamOptions"
                placeholder="All Streams"
                @update:model-value="onStreamChange"
                class="w-40"
              />
            </div>

            <!-- Day Selection (for Manage Schedule only) -->
            <div class="flex-shrink-0">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Days*
              </label>
              <EnhancedDropdown
                v-model="selectedDay"
                :options="dayOptions"
                placeholder="Select Day to Edit"
                class="w-48"
              />
            </div>

            <!-- Apply Filters Button -->
            <div class="flex-shrink-0">
              <button
                @click="applyFilters"
                :disabled="!canApplyFilters"
                class="inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calendar class="w-4 h-4 mr-2" />
                Apply Filters
              </button>
            </div>

            <!-- Manage Schedule Button -->
            <div class="flex-shrink-0">
              <button
                @click="openAddSchedule"
                :disabled="!selectedBranchId || !selectedClass || !selectedDay"
                class="inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus class="w-4 h-4 mr-2" />
                {{ selectedDay ? `Edit ${getDayName(selectedDay)} Schedule` : 'Manage Schedule' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Schedule List -->
      <div
        v-if="hasAppliedFilters && canLoadSchedule"
        class="bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl rounded-xl border border-slate-700"
      >
        <div class="px-6 py-6 border-b border-slate-600">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="p-2 bg-blue-600 rounded-lg shadow-lg">
                <User class="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 class="text-xl font-bold text-white">Class Schedule</h3>
                <p class="text-sm text-slate-300">Weekly timetable overview</p>
              </div>
            </div>
            <div class="flex space-x-3">
              <button
                @click="printTimetable"
                class="p-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                title="Print Timetable"
              >
                <Printer class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Timetable Grid -->
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead class="bg-gradient-to-r from-slate-800 to-slate-700">
              <tr>
                <th
                  class="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider border-r border-slate-600"
                >
                  <div class="flex items-center space-x-2">
                    <Calendar class="w-4 h-4" />
                    <span>Day</span>
                  </div>
                </th>
                <th
                  v-for="(period, index) in periods"
                  :key="index"
                  class="px-3 py-3 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-slate-600 last:border-r-0"
                >
                  <div
                    class="bg-gradient-to-r from-blue-600 to-blue-700 rounded-md px-2 py-1 shadow-md"
                  >
                    Period {{ period.number }}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="bg-slate-900 divide-y divide-slate-700">
              <tr
                v-for="day in weekDays"
                :key="day.value"
                class="hover:bg-slate-800 transition-colors duration-200"
              >
                <td
                  class="px-6 py-6 whitespace-nowrap text-sm font-bold text-white border-r border-slate-700"
                >
                  <div class="flex items-center space-x-3">
                    <div class="w-2 h-2 bg-blue-500 rounded-full shadow-lg"></div>
                    <span class="text-lg">{{ day.label }}</span>
                  </div>
                </td>
                <td
                  v-for="(period, index) in periods"
                  :key="index"
                  class="px-4 py-4 text-center border-r border-slate-700 last:border-r-0"
                >
                  <div
                    v-if="getSlotForDayAndPeriod(day.value, index)"
                    class="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-4 shadow-lg"
                  >
                    <!-- Subject Name -->
                    <div
                      class="font-semibold text-white mb-2 text-center"
                      :class="{
                        'text-orange-400':
                          getSlotForDayAndPeriod(day.value, index).slot_type === 'break',
                        'text-white': getSlotForDayAndPeriod(day.value, index).slot_type !== 'break'
                      }"
                    >
                      {{
                        getSlotForDayAndPeriod(day.value, index).slot_type === 'break'
                          ? 'BREAK'
                          : getSlotForDayAndPeriod(day.value, index).subject?.name || 'N/A'
                      }}
                    </div>

                    <!-- Teacher Name (only for non-break slots) -->
                    <div
                      v-if="getSlotForDayAndPeriod(day.value, index).slot_type !== 'break'"
                      class="text-xs text-slate-300 mb-2 text-center"
                    >
                      <User class="w-3 h-3 inline mr-1" />
                      {{ getSlotForDayAndPeriod(day.value, index).teacher?.first_name }}
                      {{ getSlotForDayAndPeriod(day.value, index).teacher?.last_name }}
                    </div>

                    <!-- Time (for all slots) -->
                    <div class="text-xs text-center">
                      <div
                        v-if="getSlotForDayAndPeriod(day.value, index).slot_type !== 'break'"
                        class="text-blue-300 bg-blue-900/30 rounded px-2 py-1"
                      >
                        <Clock class="w-3 h-3 inline mr-1" />
                        {{ getSlotForDayAndPeriod(day.value, index).start_time?.substring(0, 5) }} -
                        {{ getSlotForDayAndPeriod(day.value, index).end_time?.substring(0, 5) }}
                      </div>
                      <div
                        v-if="getSlotForDayAndPeriod(day.value, index).slot_type === 'break'"
                        class="text-orange-300 bg-orange-900/30 rounded px-2 py-1"
                      >
                        <Clock class="w-3 h-3 inline mr-1" />
                        {{ getSlotForDayAndPeriod(day.value, index).start_time?.substring(0, 5) }} -
                        {{ getSlotForDayAndPeriod(day.value, index).end_time?.substring(0, 5) }}
                      </div>
                    </div>
                  </div>
                  <div
                    v-else
                    class="text-slate-500 p-4 bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-600"
                  >
                    <div class="text-center">
                      <div class="text-2xl mb-1">—</div>
                      <div class="text-xs">No Class</div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <Calendar class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          {{ hasAppliedFilters ? 'No Schedule Found' : 'Select Filters' }}
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{
            hasAppliedFilters
              ? 'No timetable found for the selected class' +
                (hasSections ? ' and section' : '') +
                '.'
              : 'Please select school, branch, class' +
                (hasSections ? ', and section' : '') +
                ', then click Apply Filters to view the schedule.'
          }}
        </p>
        <div v-if="!hasAppliedFilters" class="mt-4">
          <button
            @click="applyFilters"
            :disabled="!canApplyFilters"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calendar class="-ml-1 mr-2 h-5 w-5" />
            Apply Filters & View Schedule
          </button>
        </div>
      </div>
    </div>

    <!-- Add Schedule Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    >
      <div
        class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-3/4 xl:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800"
      >
        <div class="mt-3">
          <!-- Modal Header -->
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              Manage Schedule - {{ getClassName(form.class_id)
              }}{{ form.section_id ? ' ' + getSectionName(form.section_id) : '' }} -
              {{ getDayName(form.day_of_week) }}
            </h3>
            <button @click="closeAddModal" class="text-gray-400 hover:text-gray-600">
              <X class="w-6 h-6" />
            </button>
          </div>

          <!-- Quick Schedule Creation -->
          <div class="mb-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
                Set Parameters To Quickly Create Schedule
              </h4>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Starting Time *
                </label>
                <input
                  v-model="quickParams.startTime"
                  type="time"
                  class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration (min) *
                </label>
                <input
                  v-model="quickParams.duration"
                  type="number"
                  placeholder="45"
                  class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Interval (min)
                </label>
                <input
                  v-model="quickParams.interval"
                  type="number"
                  placeholder="5"
                  class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Class Room
                </label>
                <input
                  v-model="quickParams.room"
                  type="text"
                  placeholder="Room 101"
                  class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                />
              </div>
              <div>
                <button
                  @click="applyQuickSchedule"
                  class="w-full inline-flex items-center justify-center px-3 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                >
                  <Plus class="w-4 h-4 mr-2" />
                  Apply
                </button>
              </div>
            </div>
          </div>

          <!-- Subject Slots Table -->
          <div class="mb-8">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Schedule Slots</h4>
              <button
                @click="addSlot"
                class="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <Plus class="w-4 h-4 mr-2" />
                Add Slot
              </button>
            </div>

            <div
              class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div class="overflow-x-auto">
                <table class="min-w-full">
                  <thead class="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th
                        class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Break
                      </th>
                      <th
                        class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Subject *
                      </th>
                      <th
                        class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Teacher *
                      </th>
                      <th
                        class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Start Time *
                      </th>
                      <th
                        class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                      >
                        End Time *
                      </th>
                      <th
                        class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Room
                      </th>
                      <th
                        class="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
                  >
                    <tr
                      v-for="(slot, index) in form.slots"
                      :key="index"
                      class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      :class="{
                        'bg-orange-50 dark:bg-orange-900/20': slot.is_break
                      }"
                    >
                      <td class="px-4 py-4 text-center">
                        <input
                          v-model="slot.is_break"
                          type="checkbox"
                          class="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                          @change="handleBreakToggle(slot, index)"
                        />
                      </td>
                      <td class="px-4 py-4">
                        <EnhancedDropdown
                          v-model="slot.subject_id"
                          :options="filteredSubjectOptions"
                          placeholder="Select Subject"
                          :disabled="slot.is_break"
                          :class="{
                            'border-red-500': !slot.is_break && !slot.subject_id,
                            'border-gray-300': slot.is_break || slot.subject_id
                          }"
                        />
                      </td>
                      <td class="px-4 py-4">
                        <EnhancedDropdown
                          v-model="slot.teacher_id"
                          :options="filteredTeacherOptions"
                          placeholder="Select Teacher"
                          :disabled="slot.is_break"
                          :class="{
                            'border-red-500': !slot.is_break && !slot.teacher_id,
                            'border-gray-300': slot.is_break || slot.teacher_id
                          }"
                        />
                      </td>
                      <td class="px-4 py-4">
                        <input
                          v-model="slot.start_time"
                          type="time"
                          placeholder="Start Time"
                          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                          :class="{
                            'border-red-500': !slot.start_time,
                            'border-gray-300 dark:border-gray-600': slot.start_time
                          }"
                        />
                      </td>
                      <td class="px-4 py-4">
                        <input
                          v-model="slot.end_time"
                          type="time"
                          placeholder="End Time"
                          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                          :class="{
                            'border-red-500': !slot.end_time,
                            'border-gray-300 dark:border-gray-600': slot.end_time
                          }"
                        />
                      </td>
                      <td class="px-4 py-4">
                        <input
                          v-model="slot.room_number"
                          type="text"
                          placeholder="Room"
                          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                        />
                      </td>
                      <td class="px-4 py-4 text-center">
                        <button
                          @click="removeSlot(index)"
                          class="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <X class="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Modal Actions -->
            <div
              class="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700"
            >
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {{ form.slots.length }} slot{{ form.slots.length !== 1 ? 's' : '' }} configured
              </div>
              <div class="flex space-x-3">
                <button
                  @click="closeAddModal"
                  class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  @click="saveSchedule"
                  :disabled="loading || !isFormValid"
                  class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {{ loading ? 'Saving...' : 'Save Schedule' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Plus, X, Filter, User, Edit, Printer, Calendar, Home, Clock } from 'lucide-vue-next';
import { useToast } from '~/composables/useToast';
import { useTimetables } from '~/composables/useTimetables';
import { useAcademics } from '~/composables/useAcademics';
import { useAuth } from '~/composables/useAuth';
import { useAuthStore } from '~/stores/auth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { usePrintReport } from '~/composables/usePrintReport';
import { classSubjectAssignmentApi } from '~/api/academic/class-subject-assignment';
import { Timetables } from '~/api/academic/timetables';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';

const {
  currentBranch,
  currentSchool,
  effectiveBranchId: globalEffectiveBranchId,
  branchScopeParams
} = useGlobalBranch();

// Composables
const { showToast } = useToast();
const { isSuperAdmin, isAdmin, isBranchAdmin } = useAuth();
const authStore = useAuthStore();
const selectedBranchId = computed(() => globalEffectiveBranchId.value);
const { printReport } = usePrintReport();
const {
  // Timetables composable
  timetables,
  timetablesLoading,
  selectedAcademicYear,
  classes,
  sections,
  classDropdownOptions,
  sectionDropdownOptions,
  loadAcademicDataForBranch,
  loadTimetables,
  updateFilters,
  initialize
} = useTimetables();

const {
  streams,
  teachers,
  streamOptions,
  teacherOptions,
  fetchStreams,
  fetchTeachers,
  fetchSections
} = useAcademics();

// State
const selectedClass = ref('');
const selectedSection = ref('');
const selectedStream = ref('');
const selectedDay = ref('');
const classAssignments = ref([]);
const showAddModal = ref(false);
const loading = ref(false);
const schedule = ref([]);
const timetable = ref(null);
const hasAppliedFilters = ref(false);
const isEditingExistingSlots = ref(false);
const checkingSubjects = ref(false);
const hasCheckedSubjects = ref(false);

// Form state
const form = ref({
  class_id: '',
  section_id: '',
  day_of_week: '',
  slots: []
});

// Quick schedule parameters
const quickParams = ref({
  startTime: '09:00',
  duration: 45,
  interval: 5,
  room: ''
});

// Week days
const weekDays = [
  { value: 1, label: 'MONDAY' },
  { value: 2, label: 'TUESDAY' },
  { value: 3, label: 'WEDNESDAY' },
  { value: 4, label: 'THURSDAY' },
  { value: 5, label: 'FRIDAY' },
  { value: 6, label: 'SATURDAY' },
  { value: 7, label: 'SUNDAY' }
];

// Dynamic periods based on chronological order of time slots
const periods = computed(() => {
  if (!schedule.value || schedule.value.length === 0) {
    return [];
  }

  // Get all unique time slots and sort them chronologically
  const timeSlots = schedule.value
    .map(slot => ({
      startTime: slot.start_time,
      endTime: slot.end_time,
      periodNumber: slot.period_number
    }))
    .filter(
      (slot, index, self) =>
        // Remove duplicates based on start and end time
        index === self.findIndex(s => s.startTime === slot.startTime && s.endTime === slot.endTime)
    )
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Create period objects with chronological numbering
  return timeSlots.map((slot, index) => ({
    number: index + 1, // Chronological period number (1, 2, 3...)
    originalPeriodNumber: slot.periodNumber, // Keep original for reference
    startTime: slot.startTime,
    endTime: slot.endTime,
    name: `Period ${index + 1}`
  }));
});

// Computed - Academic year is now automatic via useTimetables composable

const dayOptions = computed(() => weekDays.map(day => ({ value: day.value, label: day.label })));

// Role-based visibility
const shouldShowSchoolFilter = computed(() => isSuperAdmin.value);

// Conditional visibility for sections and streams
const hasSections = computed(() => sections.value.length > 0);
const hasStreams = computed(() => streams.value.length > 0);

// Filtered options for modal based on selected branch and class
const filteredTeacherOptions = computed(() => {
  if (!selectedBranchId.value) return teacherOptions.value;
  return teachers.value
    .filter(teacher => teacher.branch_id === selectedBranchId.value)
    .map(teacher => ({
      value: teacher.id,
      label: `${teacher.first_name || 'Unknown'} ${teacher.last_name || 'Teacher'} (${teacher.email || 'No Email'})`
    }));
});

const filteredSubjectOptions = computed(() => {
  // If no class selected, return empty array
  if (!selectedClass.value) {
    return [];
  }

  // If no class assignments loaded, return empty array
  if (!classAssignments.value || classAssignments.value.length === 0) {
    return [];
  }

  // Filter assignments by section if section is selected
  const filtered = classAssignments.value
    .filter(assignment => {
      const matchesSection =
        !selectedSection.value ||
        assignment.section_id === selectedSection.value ||
        !assignment.section_id;
      return matchesSection;
    })
    .map(assignment => ({
      value: assignment.subject_id,
      label: `${assignment.subject?.name || 'Unknown'} (${assignment.subject?.code || 'N/A'})`,
      category: assignment.subject?.category,
      credit_hours: assignment.subject?.credit_hours
    }));

  return filtered;
});

// Check if class has no subjects assigned
const hasNoSubjectsAssigned = computed(() => {
  // Only show warning if we've completed checking and confirmed no assignments
  return (
    selectedClass.value &&
    hasCheckedSubjects.value &&
    !checkingSubjects.value &&
    classAssignments.value &&
    classAssignments.value.length === 0
  );
});

// Check if the form is valid
const isFormValid = computed(() => {
  if (!form.value.slots || form.value.slots.length === 0) {
    return false;
  }

  for (const slot of form.value.slots) {
    // Check time fields (required for all slots)
    if (!slot.start_time || !slot.end_time) {
      return false;
    }

    // Check required fields for non-break slots
    if (!slot.is_break) {
      if (!slot.subject_id || !slot.teacher_id) {
        return false;
      }
    }
  }

  return true;
});

// Filter validation
const canApplyFilters = computed(() => !!selectedBranchId.value);

// Check if we can proceed with schedule loading
const canLoadSchedule = computed(() => {
  return selectedClass.value && (!hasSections.value || selectedSection.value);
});

// Methods

watch(selectedBranchId, async newVal => {
  selectedClass.value = '';
  selectedSection.value = '';
  selectedStream.value = '';
  schedule.value = [];
  timetable.value = null;
  hasAppliedFilters.value = false;
  if (!newVal) return;

  await loadAcademicDataForBranch();
  await fetchTeachers({ branchId: newVal });
});

const onClassChange = async () => {
  selectedSection.value = '';
  selectedStream.value = '';
  schedule.value = [];
  hasAppliedFilters.value = false;
};

const onSectionChange = () => {
  loadSchedule();
};

const onStreamChange = () => {
  loadSchedule();
};

// Helper functions to get names
const getDayName = dayValue => {
  // Convert string to number if needed
  const numericValue = typeof dayValue === 'string' ? parseInt(dayValue) : dayValue;
  const day = weekDays.find(d => d.value === numericValue);
  return day ? day.label : 'Unknown Day';
};

const getClassName = classId => {
  const classItem = classes.value.find(c => c.id === classId);
  return classItem ? classItem.name : 'Unknown Class';
};

const getSectionName = sectionId => {
  const section = sections.value.find(s => s.id === sectionId);
  return section ? section.name : 'Unknown Section';
};

// Day selection is now handled by clicking day buttons - no onDayChange needed

const applyFilters = async () => {
  if (canApplyFilters.value) {
    hasAppliedFilters.value = true;
    await loadSchedule();
  }
};

const loadSchedule = async () => {
  if (!canLoadSchedule.value) return;

  try {
    loading.value = true;

    // Update filters with current selections and load timetables
    updateFilters({
      class_id: selectedClass.value,
      section_id: selectedSection.value || '',
      academic_year: selectedAcademicYear.value
    });

    // Wait for the composable to finish loading
    while (timetablesLoading.value) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    if (timetables.value.length > 0) {
      // Get the first timetable (backend should return only matching timetables)
      timetable.value = timetables.value[0];
      schedule.value = timetable.value.slots || [];
    } else {
      // No timetable exists for this class/section
      timetable.value = null;
      schedule.value = [];
    }
  } catch (error) {
    console.error('Error loading schedule:', error);
    showToast('Failed to load schedule', 'error');
    timetable.value = null;
    schedule.value = [];
  } finally {
    loading.value = false;
  }
};

// Chronological period-based slot lookup - find by day and chronological period
const getSlotForDayAndPeriod = (day, periodIndex) => {
  // Get the chronological period info from the column
  const period = periods.value[periodIndex];
  if (!period) return null;

  // Get all slots for this day and sort them chronologically
  const daySlots = schedule.value
    .filter(slot => String(slot.day_of_week) === String(day))
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Return the slot at the chronological position
  return daySlots[periodIndex] || null;
};

const openAddSchedule = async () => {
  // Use the editDay function which handles all the logic
  await editDay();
  showAddModal.value = true;
};

// Helper function to clear form state when switching contexts
const clearFormState = () => {
  form.value = {
    class_id: '',
    section_id: '',
    day_of_week: '',
    slots: []
  };
  isEditingExistingSlots.value = false;
};

const closeAddModal = () => {
  showAddModal.value = false;
  clearFormState();
};

// BRUTE FORCE: Simple edit day - no automatic slot creation
const editDay = async () => {
  // Ensure we have the latest schedule data
  await loadSchedule();

  // Get all existing slots for the selected day
  const existingSlots = schedule.value.filter(
    slot => String(slot.day_of_week) === String(selectedDay.value)
  );

  // If there are existing slots, pre-fill with them
  if (existingSlots.length > 0) {
    form.value = {
      class_id: selectedClass.value,
      section_id: selectedSection.value || '',
      day_of_week: selectedDay.value,
      slots: existingSlots.map(slot => ({
        id: slot.id,
        subject_id: slot.subject_id,
        teacher_id: slot.teacher_id,
        start_time: slot.start_time || '',
        end_time: slot.end_time || '',
        room_number: slot.room_number || '',
        is_break: slot.slot_type === 'break',
        period_number: slot.period_number ?? 1
      }))
    };
    isEditingExistingSlots.value = true;
  } else {
    // Create empty slots for manual assignment
    const slots = [
      {
        subject_id: '',
        teacher_id: '',
        start_time: '',
        end_time: '',
        room_number: '',
        is_break: false,
        period_number: 1
      }
    ];

    form.value = {
      class_id: selectedClass.value,
      section_id: selectedSection.value || '',
      day_of_week: selectedDay.value,
      slots: slots
    };
    isEditingExistingSlots.value = false;
  }

  showAddModal.value = true;
};

// Function to get or create period for a specific time slot
const getOrCreatePeriod = (startTime, endTime) => {
  const existingPeriod = periods.value.find(
    p => p.startTime === startTime && p.endTime === endTime
  );

  if (existingPeriod) {
    return existingPeriod;
  }

  // Create new period if it doesn't exist
  const newPeriodNumber = Math.max(...periods.value.map(p => p.number)) + 1;
  return {
    number: newPeriodNumber,
    startTime: startTime,
    endTime: endTime
  };
};

// NEW DESIGN: Add slot function - now works with subjects
const addSlot = () => {
  if (!showAddModal.value) return;

  // Find the next available period number
  const usedPeriods = form.value.slots.map(slot => slot.period_number);
  const nextPeriodNumber = Math.max(...usedPeriods, 0) + 1;

  form.value.slots.push({
    subject_id: '',
    teacher_id: '',
    start_time: '',
    end_time: '',
    room_number: '',
    is_break: false,
    period_number: nextPeriodNumber
  });
};

const removeSlot = index => {
  form.value.slots.splice(index, 1);
};

const handleBreakToggle = (slot, index) => {
  if (slot.is_break) {
    // Clear subject and teacher when marking as break
    slot.subject_id = '';
    slot.teacher_id = '';
  }
};

// NEW DESIGN: Quick schedule - works with fixed periods
const applyQuickSchedule = () => {
  if (form.value.slots.length === 0) {
    showToast('Please add slots first using the "Add Slot" button', 'warning');
    return;
  }

  // Validate quick params
  if (!quickParams.value.startTime || !quickParams.value.duration) {
    return;
  }

  // Apply quick schedule to existing slots
  form.value.slots = form.value.slots.map((slot, index) => {
    if (!slot.is_break) {
      // Calculate start time for this slot
      const interval = parseInt(quickParams.value.interval) || 0;
      const startTime = addMinutes(
        quickParams.value.startTime,
        index * (parseInt(quickParams.value.duration) + interval)
      );
      const endTime = addMinutes(startTime, parseInt(quickParams.value.duration));

      return {
        ...slot,
        start_time: startTime,
        end_time: endTime,
        room_number: quickParams.value.room
      };
    }
    return slot;
  });
};

const addMinutes = (time, minutes) => {
  const [hours, mins] = time.split(':').map(Number);

  // Calculate total minutes from midnight
  let totalMinutes = hours * 60 + mins + minutes;

  // Handle day overflow (keep within 24 hours)
  totalMinutes = totalMinutes % (24 * 60);

  // Convert back to hours and minutes
  const newHours = Math.floor(totalMinutes / 60);
  const newMins = totalMinutes % 60;

  const result = `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;

  return result;
};

// Check for time conflicts between new slots and existing slots
const checkTimeConflicts = (newSlots, existingSlots) => {
  const conflicts = [];

  for (let i = 0; i < newSlots.length; i++) {
    const newSlot = newSlots[i];
    if (!newSlot.start_time || !newSlot.end_time) {
      continue;
    }

    for (let j = 0; j < existingSlots.length; j++) {
      const existingSlot = existingSlots[j];
      if (!existingSlot.start_time || !existingSlot.end_time) {
        continue;
      }

      // Check if times overlap: (newStart < existingEnd) && (newEnd > existingStart)
      // Adjacent times (9:00-10:00 and 10:00-11:00) should NOT conflict
      const hasOverlap =
        newSlot.start_time < existingSlot.end_time && newSlot.end_time > existingSlot.start_time;

      if (hasOverlap) {
        const conflictMsg = `New slot (${newSlot.start_time}-${newSlot.end_time}) conflicts with existing slot (${existingSlot.start_time}-${existingSlot.end_time})`;
        conflicts.push(conflictMsg);
      }
    }
  }

  return conflicts;
};

// Removed generateQuickSlots function - no longer needed

// BRUTE FORCE: Simple save - just save what's in the form
const saveSchedule = async () => {
  try {
    loading.value = true;

    let timetableId;

    // BRUTE FORCE: Use existing timetable or create new one
    if (timetable.value && timetable.value.id) {
      timetableId = timetable.value.id;
    } else {
      const timetableData = {
        name: `${getClassName(form.value.class_id)} ${selectedSection.value || 'All Sections'} Timetable`,
        class_id: form.value.class_id,
        section_id: form.value.section_id || null,
        academic_year: selectedAcademicYear.value,
        is_active: true
      };

      const timetableResponse = await Timetables.create(timetableData);
      if (timetableResponse.success) {
        timetableId = timetableResponse.data.timetable.id;
      } else {
        showToast('Failed to create timetable', 'error');
        return;
      }
    }

    // BRUTE FORCE: Simple validation - just check required fields
    for (let i = 0; i < form.value.slots.length; i++) {
      const slot = form.value.slots[i];
      if (!slot.start_time || !slot.end_time) {
        showToast(`Slot ${i + 1}: Please fill in start and end times`, 'error');
        return;
      }
      if (!slot.is_break && (!slot.subject_id || !slot.teacher_id)) {
        showToast(`Slot ${i + 1}: Please select subject and teacher`, 'error');
        return;
      }
    }

    // BRUTE FORCE: Save each slot one by one
    for (const slot of form.value.slots) {
      const slotData = {
        day_of_week: form.value.day_of_week,
        period_number: slot.period_number || 1,
        start_time: slot.start_time.substring(0, 5),
        end_time: slot.end_time.substring(0, 5),
        subject_id: slot.is_break ? null : slot.subject_id,
        teacher_id: slot.is_break ? null : slot.teacher_id,
        room_number: slot.room_number || '',
        slot_type: slot.is_break ? 'break' : 'regular'
      };

      try {
        await Timetables.createSlot({
          timetable_id: timetableId,
          ...slotData
        });
      } catch (error) {
        console.error('❌ BRUTE FORCE: Slot save failed:', error);
        showToast(`Error saving slot: ${error.message}`, 'error');
        return;
      }
    }

    showToast('Schedule saved successfully', 'success');
    closeAddModal();

    // Force refresh the schedule data
    await loadSchedule();
  } catch (error) {
    console.error('❌ BRUTE FORCE: Save failed:', error);
    showToast('Error saving schedule', 'error');
  } finally {
    loading.value = false;
  }
};

// Fetch class-subject assignments for the selected class
const fetchClassAssignments = async () => {
  if (!selectedClass.value || !selectedAcademicYear.value || !selectedBranchId.value) {
    classAssignments.value = [];
    checkingSubjects.value = false;
    hasCheckedSubjects.value = false;
    return;
  }

  try {
    checkingSubjects.value = true;
    hasCheckedSubjects.value = false;

    // Use selectedSchoolId if available, otherwise fall back to auth store school_id
    const schoolId = selectedSchoolId.value || authStore.currentUser?.school_id;

    const response = await classSubjectAssignmentApi.getAll({
      class_id: selectedClass.value,
      academic_year: selectedAcademicYear.value,
      school_id: schoolId,
      branch_id: selectedBranchId.value
    });

    // Handle different response structures
    if (response.data?.assignments) {
      classAssignments.value = response.data.assignments;
    } else if (response.assignments) {
      classAssignments.value = response.assignments;
    } else if (Array.isArray(response.data)) {
      classAssignments.value = response.data;
    } else {
      classAssignments.value = [];
    }
  } catch (error) {
    console.error('Error fetching class assignments:', error);
    classAssignments.value = [];
  } finally {
    checkingSubjects.value = false;
    hasCheckedSubjects.value = true;
  }
};

// Note: fetchClassAssignments is now handled in the main selectedClass watcher above

// Academic year is now automatic - no watcher needed
// Removed redundant watchers for branch and school - only class change triggers fetchClassAssignments

// Watch for class changes to fetch sections, streams, and class assignments
watch(selectedClass, async newClass => {
  if (newClass && selectedBranchId.value) {
    const schoolId = isSuperAdmin.value ? selectedSchool.value : authStore.currentUser?.school_id;

    // Fetch sections, streams, and class assignments in parallel
    await Promise.all([
      fetchSections({ schoolId, branchId: selectedBranchId.value, classId: newClass }),
      fetchStreams({ schoolId, branchId: selectedBranchId.value, classId: newClass }),
      fetchClassAssignments()
    ]);

    // Reset section and stream selections
    selectedSection.value = '';
    selectedStream.value = '';
    selectedDay.value = '';
  } else {
    // Clear selections when no class
    selectedSection.value = '';
    selectedStream.value = '';
    selectedDay.value = '';
    classAssignments.value = [];
    hasCheckedSubjects.value = false;
  }
});

// Watch for day/class changes to clear form state
watch([selectedDay, selectedClass, selectedSection], () => {
  if (showAddModal.value) {
    clearFormState();
  }
});

// Print function using common print report
const printTimetable = async () => {
  try {
    if (!schedule.value || schedule.value.length === 0) {
      showToast('No timetable data to print', 'warning');
      return;
    }

    // Prepare timetable data for printing
    const timetableData = prepareTimetableForPrint();

    // Use the common print report system with timetable-specific options
    await printReport(timetableData, {
      showHeader: true,
      showSummary: false,
      showFilters: true,
      showFooter: true,
      autoPrint: true
    });
  } catch (error) {
    console.error('Error printing timetable:', error);
    showToast('Error printing timetable', 'error');
  }
};

// Prepare timetable data for printing using common print system
const prepareTimetableForPrint = () => {
  // Create timetable grid data that matches the UI
  const printData = [];

  // Create one row per day with all periods as columns
  weekDays.forEach(day => {
    const dayRow = {
      day: day.label
    };

    // Add each period as a column
    periods.value.forEach((period, index) => {
      const slot = getSlotForDayAndPeriod(day.value, index);
      const periodKey = `period_${period.number}`;

      if (slot) {
        if (slot.slot_type === 'break') {
          dayRow[periodKey] = 'BREAK';
        } else if (slot.subject?.name) {
          const teacherName = slot.teacher?.first_name
            ? `${slot.teacher.first_name} ${slot.teacher.last_name || ''}`.trim()
            : '';
          const roomInfo = slot.room_number ? ` (${slot.room_number})` : '';
          const timeInfo =
            slot.start_time && slot.end_time
              ? ` [${slot.start_time.substring(0, 5)}-${slot.end_time.substring(0, 5)}]`
              : '';

          dayRow[periodKey] =
            `${slot.subject.name}${teacherName ? ` - ${teacherName}` : ''}${roomInfo}${timeInfo}`;
        } else {
          dayRow[periodKey] = 'N/A';
        }
      } else {
        dayRow[periodKey] = 'N/A';
      }
    });

    printData.push(dayRow);
  });

  // Create columns for the grid with period times
  const columns = [
    { key: 'day', header: 'Day' },
    ...periods.value.map(period => ({
      key: `period_${period.number}`,
      header: `Period ${period.number}${period.startTime ? ` (${period.startTime.substring(0, 5)}-${period.endTime.substring(0, 5)})` : ''}`
    }))
  ];

  // Calculate timetable statistics
  const totalPeriods = periods.value.length;
  const totalDays = printData.length;
  const totalSubjects = new Set();
  const totalTeachers = new Set();

  // Count unique subjects and teachers
  schedule.value.forEach(slot => {
    if (slot.subject?.name && slot.slot_type !== 'break') {
      totalSubjects.add(slot.subject.name);
    }
    if (slot.teacher?.first_name && slot.slot_type !== 'break') {
      totalTeachers.add(`${slot.teacher.first_name} ${slot.teacher.last_name || ''}`.trim());
    }
  });

  return {
    title: `Timetable - ${getClassName(selectedClass.value)}${selectedSection.value ? ' ' + getSectionName(selectedSection.value) : ''}`,
    data: printData,
    columns: columns,
    filters: {
      class: getClassName(selectedClass.value),
      section: selectedSection.value ? getSectionName(selectedSection.value) : 'All Sections',
      academic_year: selectedAcademicYear.value,
      branch: selectedBranch.value?.name || 'Unknown Branch'
    },
    reportType: 'timetable',
    // Add timetable-specific metadata for better summary
    timetableStats: {
      totalPeriods,
      totalDays,
      totalSubjects: totalSubjects.size,
      totalTeachers: totalTeachers.size
    }
  };
};

// Initialize
onMounted(async () => {
  if (authStore.currentUser?.role === 'teacher') {
    await navigateTo('/academic/timetables', { replace: true });
    return;
  }

  // Initialize the timetables composable
  await initialize();
});
</script>
