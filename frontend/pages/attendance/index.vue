<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-start">
      <div class="space-y-2">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Mark Today's Attendance</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Select class and mark student attendance
        </p>
        <!-- Cut-off Time Warning -->
        <div
          v-if="showCutoffWarning"
          class="mt-2 p-2 bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg"
        >
          <div class="flex items-center gap-2">
            <svg
              class="w-4 h-4 text-orange-600 dark:text-orange-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span class="text-sm text-orange-800 dark:text-orange-200">
              <strong>Cut-off Time:</strong> Attendance must be submitted before
              {{ timeSettings?.cutoffTime || attendanceSettings?.timeSettings?.cutoffTime }}
              today
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Setup Card -->
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            Select Class & Load Students
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Choose your class details to load student list
          </p>
        </div>
        <div class="flex items-center space-x-2">
          <span
            class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-green-100 to-green-200 text-green-800 dark:from-green-900 dark:to-green-800 dark:text-green-200 shadow-sm"
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              ></path>
            </svg>
            {{ students.length }} Students
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-6 gap-6">
        <!-- Date Picker -->
        <div>
          <label
            class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center"
          >
            <svg
              class="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              ></path>
            </svg>
            Attendance Date
          </label>
          <input
            v-model="form.date"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
            :max="new Date().toISOString().split('T')[0]"
          />
          <!-- Working Day Status - Reserved Space -->
          <div class="mt-1 h-6 flex items-center">
            <div
              v-if="workingDayStatus"
              class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs"
              :class="{
                'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300':
                  workingDayStatus.is_working_day && workingDayStatus.day_type === 'working',
                'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300':
                  workingDayStatus.day_type === 'holiday' ||
                  workingDayStatus.day_type === 'weekend',
                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300':
                  workingDayStatus.day_type === 'non-working',
                'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300':
                  workingDayStatus.day_type === 'invalid' ||
                  workingDayStatus.day_type === 'error' ||
                  workingDayStatus.day_type === 'future'
              }"
            >
              <svg
                v-if="workingDayStatus.is_working_day && workingDayStatus.day_type === 'working'"
                class="w-2.5 h-2.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <svg
                v-else-if="
                  workingDayStatus.day_type === 'holiday' || workingDayStatus.day_type === 'weekend'
                "
                class="w-2.5 h-2.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <svg v-else class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
              <span class="font-medium text-xs">{{
                workingDayStatus.day_type === 'invalid'
                  ? 'INVALID'
                  : workingDayStatus.day_type === 'error'
                    ? 'ERROR'
                    : workingDayStatus.day_type === 'holiday'
                      ? 'HOLIDAY'
                      : workingDayStatus.day_type === 'weekend'
                        ? 'HOLIDAY'
                        : workingDayStatus.day_type === 'non-working'
                          ? 'NON-WORKING'
                          : workingDayStatus.day_type === 'future'
                            ? 'FUTURE'
                            : workingDayStatus.day_type === 'working'
                              ? 'WORKING'
                              : workingDayStatus.day_type.toUpperCase()
              }}</span>
            </div>
          </div>
        </div>

        <!-- School Selector (Super Admin Only) -->
        <div v-if="isSuperAdmin">
          <label
            class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center"
          >
            <svg
              class="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              ></path>
            </svg>
            School
          </label>
          <EnhancedDropdown
            :options="schoolOptions"
            v-model="form.school_id"
            placeholder="All Schools"
            @update:modelValue="onSchoolChange"
            class="w-full"
          />
        </div>

        <!-- Branch Selector (Super Admin and Admin) -->
        <div v-if="isSuperAdmin || isAdmin">
          <label
            class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center"
          >
            <svg
              class="w-4 h-4 mr-2 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              ></path>
            </svg>
            Branch
          </label>
          <EnhancedDropdown
            :options="branchOptions"
            v-model="form.branch_id"
            placeholder="Select Branch"
            @update:modelValue="onBranchChange"
            class="w-full"
          />
        </div>

        <!-- Class Selector -->
        <div>
          <label
            class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center"
          >
            <svg
              class="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              ></path>
            </svg>
            Class
          </label>
          <EnhancedDropdown
            :options="classOptions as any[]"
            v-model="form.class_id"
            placeholder="Choose Class"
            @update:modelValue="onClassChange"
            class="w-full"
          />
        </div>

        <!-- Section Selector -->
        <div>
          <label
            class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center"
          >
            <svg
              class="w-4 h-4 mr-2 text-orange-600 dark:text-orange-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              ></path>
            </svg>
            Section
          </label>
          <EnhancedDropdown
            :options="sectionOptions as any[]"
            v-model="form.section_id"
            placeholder="Choose Section"
            :disabled="!form.class_id"
            class="w-full"
          />
        </div>

        <!-- Load Students Button -->
        <div class="flex items-center">
          <button
            @click="loadStudentsForAttendance"
            :disabled="!form.class_id || loading"
            class="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none whitespace-nowrap"
          >
            <span class="font-medium">{{ loading ? 'Loading Students...' : 'Load Students' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Attendance Marking Section -->
    <div
      v-if="students.length > 0"
      class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
    >
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">Mark Attendance</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Mark student attendance for {{ form.date }}. Use <strong>Save Draft</strong> to save
            progress or <strong>Submit & Notify</strong> to finalize and notify parents.
          </p>
        </div>

        <!-- Quick Actions -->
        <div class="flex items-center gap-2">
          <button
            @click="markAllPresent"
            class="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors text-sm flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            Mark All Present
          </button>
          <button
            @click="markAllAbsent"
            class="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors text-sm flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
            Mark All Absent
          </button>
        </div>
      </div>

      <!-- Search and Filter -->
      <div class="mb-4 flex gap-4">
        <div class="flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search students by name or roll number..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <EnhancedDropdown
            v-model="filterStatus"
            :options="statusOptions"
            placeholder="All Status"
          />
        </div>
      </div>

      <!-- Attendance Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div
          class="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800"
        >
          <div class="text-2xl font-bold text-green-600 dark:text-green-400">
            {{ presentCount }}
          </div>
          <div class="text-sm text-green-700 dark:text-green-300">Present</div>
        </div>
        <div
          class="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800"
        >
          <div class="text-2xl font-bold text-red-600 dark:text-red-400">{{ absentCount }}</div>
          <div class="text-sm text-red-700 dark:text-red-300">Absent</div>
        </div>
        <div
          class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800"
        >
          <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{{ lateCount }}</div>
          <div class="text-sm text-yellow-700 dark:text-yellow-300">Late</div>
        </div>
        <div
          class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800"
        >
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ totalStudents }}</div>
          <div class="text-sm text-blue-700 dark:text-blue-300">Total</div>
        </div>
      </div>

      <!-- Students List -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Student
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Roll No
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Remarks
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="student in filteredStudents"
              :key="student.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div
                      class="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center"
                    >
                      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {{ student.first_name?.charAt(0) }}{{ student.last_name?.charAt(0) }}
                      </span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ student.first_name }} {{ student.last_name }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ student.roll_number || student.admission_number }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <EnhancedDropdown
                  :model-value="(attendanceRecords as any)[student.id]?.status || defaultStatus"
                  @update:model-value="
                    (value: string) =>
                      updateStudentRecord(student.id, {
                        status: value as 'present' | 'absent' | 'late' | 'excused'
                      })
                  "
                  :options="statusOptions.filter(opt => opt.value !== '')"
                  placeholder="Select Status"
                  class="text-sm"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  :value="(attendanceRecords as any)[student.id]?.remarks || ''"
                  @input="
                    (event: Event) =>
                      updateStudentRecord(student.id, {
                        remarks: (event.target as HTMLInputElement)?.value || ''
                      })
                  "
                  type="text"
                  placeholder="Optional remarks..."
                  class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm w-full"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <Pagination
        v-if="totalStudents > pageSize"
        :pagination="pagination"
        item-label="students"
        @page-changed="handlePageChange"
        @page-size-changed="handlePageSizeChange"
      />

      <!-- Action Buttons -->
      <div
        class="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="text-sm text-gray-600 dark:text-gray-400">
          <p class="mb-1">
            <span class="font-medium">📊 Summary:</span>
            {{ presentCount }} Present, {{ absentCount }} Absent, {{ lateCount }} Late
          </p>
          <p class="text-xs">
            💡 <strong>Save:</strong> Records attendance for today |
            <strong>Submit:</strong> Finalizes attendance and notifies parents
          </p>
        </div>

        <div class="flex gap-3">
          <!-- Save Button (Draft) -->
          <button
            @click="saveAttendanceDraft"
            :disabled="!canSubmit || saving"
            class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <svg
              v-if="saving"
              class="w-4 h-4 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              ></path>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              ></path>
            </svg>
            {{ saving ? 'Saving...' : 'Save Draft' }}
          </button>

          <!-- Submit Button (Publish) -->
          <button
            @click="submitAttendance"
            :disabled="!canSubmit || saving"
            class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <svg
              v-if="saving"
              class="w-4 h-4 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              ></path>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            {{ saving ? 'Submitting...' : 'Submit & Notify' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, onUnmounted } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { useAuth } from '~/composables/useAuth';
import { useToast } from '~/composables/useToast';
import { useSchools } from '~/composables/useSchools';
import { useBranches } from '~/composables/useBranches';
import { useAcademicSettings } from '~/utils/settings';
import { useAttendance } from '~/composables/useAttendance';
import { useAcademics } from '~/composables/useAcademics';
import { Attendance } from '~/api';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import Pagination from '~/components/ui/Pagination.vue';

// Composables - Following common reusable patterns
const { showToast } = useToast();
const { user, isSuperAdmin, isAdmin, isBranchAdmin } = useAuth();
const { schools, fetchSchools } = useSchools();
const { branches, fetchAllBranches } = useBranches();
const { classOptions, sectionOptions, fetchClasses, fetchSections } = useAcademics();
const { getAttendanceSettings, getWorkingDays, getCutoffTime } = useAcademicSettings();

// Use the improved attendance composable directly
const {
  students,
  attendanceRecords,
  loading,
  saving,
  error,
  pagination,
  getAttendanceStats,
  hasChanges,
  loadStudents,
  saveAttendance,
  createSession,
  updateStudentRecord,
  getFilteredStudents
} = useAttendance();

// State - Use composable state directly
const workingDayStatus = ref<any>(null);
const showCutoffWarning = ref(false);

// School and branch data from composables
const schoolOptions = computed(() =>
  schools.value.map((school: any) => ({
    value: school.id,
    label: school.name
  }))
);
const branchOptions = computed(() =>
  branches.value.map((branch: any) => ({
    value: branch.id,
    label: branch.name
  }))
);

// Status filter options
// Status options - will be loaded from database settings later
const statusOptions = ref([
  { value: '', label: 'All Status' },
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'excused', label: 'Excused' }
]);

// Form
const form = reactive({
  date: new Date().toISOString().slice(0, 10),
  school_id: '',
  branch_id: '',
  class_id: '',
  section_id: '',
  academic_year: ''
});

const searchQuery = ref('');
const filterStatus = ref('');

// Settings state
const attendanceSettings = ref<any>(null);
const workingDays = ref<any>(null);
const validationRules = ref<any>(null);
const timeSettings = ref<any>(null);

// Load status options from database settings
const loadStatusOptions = async () => {
  try {
    const settings = await getAttendanceSettings();
    if (settings?.statusOptions && Array.isArray(settings.statusOptions)) {
      statusOptions.value = [
        { value: '', label: 'All Status' },
        ...settings.statusOptions.map((option: any) => ({
          value: option.value,
          label: option.label
        }))
      ];
    }
  } catch (error) {
    // No fallback - will use default status options
  }
};

// Pagination
const currentPage = ref(1);
const pageSize = ref(10);

// Computed - Use composable statistics
const attendanceStats = computed(() => getAttendanceStats.value);
const presentCount = computed(() => attendanceStats.value.present);
const absentCount = computed(() => attendanceStats.value.absent);
const lateCount = computed(() => attendanceStats.value.late);

// Default status from database settings
const defaultStatus = computed(() => {
  return attendanceSettings.value?.defaultStatus;
});
const totalStudents = computed(() => {
  // Use server pagination data instead of client-side filtering
  return pagination.total;
});

const canSubmit = computed(() => {
  // Allow submission if we have students and it's not a future date
  if (students.value.length === 0) return false;

  const selectedDate = new Date(form.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);

  // For previous days, always allow submission
  if (selectedDate < today) {
    return true;
  }

  // For today, check if it's a working day and cut-off time
  if (selectedDate.getTime() === today.getTime()) {
    // If working day status is not loaded yet, allow submission
    if (!workingDayStatus.value) {
      return true;
    }

    // Check working day enforcement
    const enforceWorkingDays = validationRules.value?.enforceWorkingDays === true;
    if (enforceWorkingDays && !workingDayStatus.value.is_working_day) {
      return false;
    }

    // Check cut-off time using settings from API
    const enforceCutoffTime = validationRules.value?.enforceCutoffTime === true;
    if (!enforceCutoffTime) {
      return true;
    }
    const currentTime = new Date();
    const cutoffTimeDate = new Date();
    const cutoffTimeString =
      timeSettings.value?.cutoffTime || attendanceSettings.value?.timeSettings?.cutoffTime;
    const [cutoffHour, cutoffMinute] = cutoffTimeString.split(':').map(Number);
    cutoffTimeDate.setHours(cutoffHour, cutoffMinute, 0, 0);

    return currentTime <= cutoffTimeDate;
  }

  return false;
});

const filteredStudents = computed(() => {
  let filtered = students.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (student: any) =>
        student.first_name?.toLowerCase().includes(query) ||
        student.last_name?.toLowerCase().includes(query) ||
        student.admission_number?.toLowerCase().includes(query)
    );
  }

  if (filterStatus.value) {
    filtered = filtered.filter(
      (student: any) => attendanceRecords.value[student.id]?.status === filterStatus.value
    );
  }

  // No client-side pagination - server handles it
  return filtered;
});

// Methods
const checkWorkingDay = async () => {
  try {
    // Use already loaded settings (loaded in onMounted)
    if (!attendanceSettings.value) {
      return;
    }

    const selectedDate = new Date(form.date);
    const dayOfWeek = selectedDate.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];

    // Always check working days from database settings
    const isWorkingDay = workingDays.value?.[dayName] === true;
    let dayType = isWorkingDay ? 'working' : 'non-working';
    let description = isWorkingDay ? 'Working Day' : 'Non-Working Day';

    // Check if working days enforcement is enabled (for blocking vs warning)
    const enforceWorkingDays = validationRules.value?.enforceWorkingDays === true;

    workingDayStatus.value = {
      is_working_day: isWorkingDay,
      day_type: dayType,
      description: description
    };

    // Only show cut-off warning for today's attendance AND if enforceCutoffTime is enabled
    const selectedDateForWarning = new Date(form.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDateForWarning.setHours(0, 0, 0, 0);

    if (selectedDateForWarning.getTime() === today.getTime()) {
      // Check if enforceCutoffTime is enabled in settings
      const enforceCutoffTime = validationRules.value?.enforceCutoffTime === true;

      if (enforceCutoffTime) {
        const currentTime = new Date();
        const warningTime = new Date();
        const cutoffTime =
          timeSettings.value?.cutoffTime || attendanceSettings.value?.timeSettings?.cutoffTime;
        const [warningHour, warningMinute] = cutoffTime.split(':').map(Number);
        warningTime.setHours(warningHour - 1, warningMinute, 0, 0);
        showCutoffWarning.value = currentTime > warningTime;
      } else {
        showCutoffWarning.value = false;
      }
    } else {
      showCutoffWarning.value = false;
    }
  } catch (error) {
    workingDayStatus.value = {
      is_working_day: false,
      day_type: 'error',
      description: 'Unable to check working day status'
    };
  }
};

const markAllPresent = () => {
  students.value.forEach(student => {
    updateStudentRecord(student.id, { status: 'present' });
  });
};

const markAllAbsent = () => {
  students.value.forEach(student => {
    updateStudentRecord(student.id, { status: 'absent' });
  });
};

const markAllDefault = () => {
  students.value.forEach(student => {
    updateStudentRecord(student.id, { status: defaultStatus.value });
  });
};

const onSchoolChange = async (schoolId: string) => {
  // Only Super Admins can change school
  if (!isSuperAdmin.value) return;

  form.school_id = schoolId;
  form.branch_id = '';
  form.class_id = '';
  form.section_id = '';

  try {
    await fetchAllBranches({ school_id: schoolId });

    // Clear students when school changes
    students.value = [];
    Object.keys(attendanceRecords.value).forEach(key => {
      delete attendanceRecords.value[key];
    });
  } catch (error) {
    showToast('Error loading branches', 'error');
  }
};

const onBranchChange = async (branchId: string) => {
  // Only Super Admins and Admins can change branch
  if (!isSuperAdmin.value && !isAdmin.value) return;

  form.branch_id = branchId;
  form.class_id = '';
  form.section_id = '';

  try {
    await fetchClasses({ branchId });

    // Clear students when branch changes
    students.value = [];
    Object.keys(attendanceRecords.value).forEach(key => {
      delete attendanceRecords.value[key];
    });
  } catch (error) {
    showToast('Error loading classes', 'error');
  }
};

const onClassChange = async (classId: string) => {
  form.class_id = classId;
  form.section_id = '';

  try {
    await fetchSections({ classId });

    // Clear students when class changes
    students.value = [];
    Object.keys(attendanceRecords.value).forEach(key => {
      delete attendanceRecords.value[key];
    });
  } catch (error) {
    showToast('Error loading sections', 'error');
  }
};

const onSectionChange = async (sectionId: string) => {
  form.section_id = sectionId;

  // Clear students when section changes
  students.value = [];
  Object.keys(attendanceRecords.value).forEach(key => {
    delete attendanceRecords.value[key];
  });
};

const loadStudentsForAttendance = async () => {
  if (!form.class_id) {
    showToast('Please select a class first', 'error');
    return;
  }

  // Validate required fields based on user role
  if (isSuperAdmin.value && (!form.school_id || !form.branch_id)) {
    showToast('Please select school and branch first', 'error');
    return;
  } else if (isAdmin.value && !form.branch_id) {
    showToast('Please select branch first', 'error');
    return;
  }
  // Branch Admin doesn't need additional validation as they have fixed school and branch

  try {
    // Check if it's a working day using validation service
    await checkWorkingDay();

    if (!workingDayStatus.value?.is_working_day) {
      const dayType = workingDayStatus.value?.day_type;
      let errorMessage = 'Attendance cannot be marked on this day';

      if (dayType === 'weekend') {
        errorMessage = 'Attendance cannot be marked on holidays';
      } else if (dayType === 'holiday') {
        errorMessage = 'Attendance cannot be marked on holidays';
      } else if (dayType === 'non-working') {
        errorMessage = 'Attendance cannot be marked on non-working days';
      } else if (dayType === 'future') {
        errorMessage = 'Future date selected - Attendance will be marked in planning mode';
        // Allow future dates but show warning
        showToast(errorMessage, 'warning');
        // Continue with loading students
      } else if (dayType === 'invalid') {
        errorMessage = workingDayStatus.value?.description || 'Invalid date for attendance';
        showToast(errorMessage, 'error');
        return;
      }

      if (dayType !== 'future') {
        showToast(errorMessage, 'error');
        return;
      }
    }

    // Optimized: Load students and check sessions in parallel
    const [studentsResult, existingSessionResponse] = await Promise.all([
      loadStudents(form.class_id, form.section_id, currentPage.value, pageSize.value),
      Attendance.listSessions({
        date_from: form.date,
        date_to: form.date,
        class_id: form.class_id,
        section_id: form.section_id || undefined
      }).catch(() => ({ success: false, data: [] })) // Graceful fallback
    ]);

    // Check if attendance already exists
    if (
      existingSessionResponse.success &&
      existingSessionResponse.data &&
      existingSessionResponse.data.length > 0
    ) {
      const existingSession = existingSessionResponse.data[0];
      const sessionStatus = existingSession.status === 'published' ? 'published' : 'draft';
      showToast(
        `⚠️ Attendance ${sessionStatus} already exists for ${form.date}. Loading existing data for editing.`,
        'warning'
      );

      // Load existing attendance data
      const sessionResponse = await Attendance.getSession(existingSession.id);
      if (sessionResponse.success && sessionResponse.data) {
        const existingRecords = sessionResponse.data.records || [];

        // Clear existing attendance records and populate with existing data
        attendanceRecords.value = {};
        students.value.forEach(student => {
          const existingRecord = existingRecords.find(
            (record: any) => record.student_id === student.id
          );
          attendanceRecords.value[student.id] = {
            student_id: student.id,
            status: existingRecord?.status || defaultStatus.value,
            remarks: existingRecord?.remarks || ''
          };
        });

        showToast(
          `Loaded ${students.value.length} students with existing attendance data`,
          'success'
        );
        return;
      }
    }

    showToast(`Loaded ${students.value.length} students`, 'success');
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Failed to load students';
    showToast(message, 'error');
    students.value = [];
  }
};

const handlePageChange = async (page: number) => {
  currentPage.value = page;
  // Reload students with new page
  await loadStudents(form.class_id, form.section_id, currentPage.value, pageSize.value);
};

const handlePageSizeChange = async (newPageSize: number) => {
  pageSize.value = newPageSize;
  currentPage.value = 1; // Reset to first page when page size changes
  // Reload students with new page size
  await loadStudents(form.class_id, form.section_id, currentPage.value, pageSize.value);
};

const saveAttendanceDraft = async () => {
  if (!hasChanges.value) {
    showToast('No changes to save', 'warning');
    return;
  }

  if (!canSubmit.value) {
    showToast('Cannot save draft after cutoff time or on non-working days', 'error');
    return;
  }

  try {
    const records = students.value.map(student => ({
      student_id: student.id,
      status: attendanceRecords.value[student.id]?.status || defaultStatus.value,
      remarks: attendanceRecords.value[student.id]?.remarks || ''
    }));

    // Simple validation for draft submission
    if (records.length === 0) {
      showToast('No attendance records to save', 'error');
      return;
    }

    // Create session first, then save attendance
    const sessionId = await createAttendanceSession();
    await saveAttendance(sessionId, records, false);
    showToast('Attendance draft saved successfully', 'success');

    // Refresh data to show updated values
    await loadStudentsForAttendance();
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Failed to save attendance draft';
    showToast(message, 'error');
  }
};

const submitAttendance = async () => {
  if (!hasChanges.value) {
    showToast('No changes to submit', 'warning');
    return;
  }

  if (!canSubmit.value) {
    showToast('Cannot submit attendance after cutoff time or on non-working days', 'error');
    return;
  }

  try {
    const records = students.value.map(student => ({
      student_id: student.id,
      status: attendanceRecords.value[student.id]?.status || defaultStatus.value,
      remarks: attendanceRecords.value[student.id]?.remarks || ''
    }));

    // Simple validation for final submission
    if (records.length === 0) {
      showToast('No attendance records to submit', 'error');
      return;
    }

    // Create session first, then save attendance using composable
    const sessionId = await createAttendanceSession();
    await saveAttendance(sessionId, records, true);
    showToast('Attendance submitted successfully - Parents will be notified', 'success');

    // Refresh the current data to show updated values
    await loadStudentsForAttendance();
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Failed to submit attendance';
    showToast(message, 'error');
  }
};

const createAttendanceSession = async () => {
  try {
    const session = await createSession({
      date: form.date,
      attendance_type: 'daily',
      class_id: form.class_id,
      section_id: form.section_id || undefined,
      academic_year: form.academic_year || undefined
    });

    return session.id;
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error?.message || 'Failed to create attendance session';
    throw new Error(message);
  }
};

// VueUse debounced date change handler
const debouncedCheckWorkingDay = useDebounceFn(() => {
  checkWorkingDay();
}, 300);

watch(() => form.date, debouncedCheckWorkingDay);

// Note: Search and filter changes don't reset pagination with server-side pagination
// The server handles filtering and pagination

// Initialize
onMounted(async () => {
  try {
    // Load academic settings first
    attendanceSettings.value = await getAttendanceSettings();
    workingDays.value = await getWorkingDays();
    timeSettings.value = { cutoffTime: await getCutoffTime() };
    validationRules.value = attendanceSettings.value?.validationRules;

    // Load status options from database
    await loadStatusOptions();

    // Set academic year from current date
    const currentYear = new Date().getFullYear();
    form.academic_year = `${currentYear}-${currentYear + 1}`;

    // Initialize based on user role
    if (isSuperAdmin.value) {
      // Super Admin: Load schools, then branches will be loaded when school is selected
      await fetchSchools();
    } else if (isAdmin.value) {
      // Admin: Load branches for their school directly
      form.school_id = user.value?.school_id || '';
      await fetchAllBranches({ school_id: form.school_id });
    } else if (isBranchAdmin.value) {
      // Branch Admin: Load classes for their branch directly
      form.school_id = user.value?.school_id || '';
      form.branch_id = user.value?.branch_id || '';
      await fetchClasses({ branchId: form.branch_id });
    }

    // Check working day after settings are loaded
    await checkWorkingDay();
  } catch (error) {
    showToast('Error initializing attendance page', 'error');
  }
});

// VueUse handles cleanup automatically
</script>

<style scoped></style>
