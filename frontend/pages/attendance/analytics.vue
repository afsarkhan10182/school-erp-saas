<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-start">
      <div class="space-y-2">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Attendance Analytics</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Comprehensive attendance analytics and insights
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="handleExportAnalytics"
          :disabled="loading"
          class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            ></path>
          </svg>
          Export Analytics
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <!-- School (for Super Admin) -->
        <div v-if="isSuperAdmin">
          <EnhancedDropdown
            v-model="filters.school_id"
            :options="schoolOptions"
            label="School"
            placeholder="All Schools"
            @change="onSchoolChange"
          />
        </div>

        <!-- Period -->
        <div>
          <EnhancedDropdown
            v-model="filters.period"
            :options="periodOptions"
            label="Period"
            @change="loadAnalyticsData"
          />
        </div>

        <!-- Class -->
        <div>
          <EnhancedDropdown
            v-model="filters.class_id"
            :options="classOptions"
            label="Class"
            placeholder="All Classes"
            @change="loadAnalyticsData"
          />
        </div>

        <!-- Section -->
        <div>
          <EnhancedDropdown
            v-model="filters.section_id"
            :options="sectionOptions"
            label="Section"
            placeholder="All Sections"
            @change="loadAnalyticsData"
          />
        </div>

        <!-- Academic Year -->
        <div>
          <EnhancedDropdown
            v-model="filters.academic_year"
            :options="academicYearOptions"
            label="Academic Year"
            placeholder="All Years"
            @change="loadAnalyticsData"
          />
        </div>

        <!-- Refresh Button -->
        <div class="flex items-end">
          <button
            @click="loadAnalyticsData"
            :disabled="loading"
            class="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <svg
              v-if="loading"
              class="animate-spin h-4 w-4"
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
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              ></path>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <!-- Custom Date Range -->
      <div v-if="filters.period === 'custom'" class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >Start Date</label
          >
          <input
            v-model="filters.custom_start_date"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            @change="loadAnalyticsData"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >End Date</label
          >
          <input
            v-model="filters.custom_end_date"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            @change="loadAnalyticsData"
          />
        </div>
      </div>
    </div>

    <!-- Alerts -->
    <div v-if="analytics?.alerts?.length > 0" class="space-y-3">
      <div
        v-for="alert in analytics.alerts"
        :key="alert.metric"
        :class="[
          'p-4 rounded-lg border-l-4',
          alert.type === 'error'
            ? 'bg-red-50 border-red-400 text-red-700 dark:bg-red-900/20 dark:text-red-400'
            : alert.type === 'warning'
              ? 'bg-yellow-50 border-yellow-400 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
              : 'bg-indigo-50 border-indigo-400 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
        ]"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <svg
              v-if="alert.type === 'error'"
              class="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
            <svg
              v-else-if="alert.type === 'warning'"
              class="h-5 w-5 text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            <svg v-else class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium">{{ alert.message }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Overview Cards -->
    <div v-if="analytics?.overview" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Total Students -->
      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div
              class="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-5 h-5 text-indigo-600 dark:text-indigo-400"
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
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">
              {{ analytics.overview.current.total }}
            </p>
            <div v-if="analytics.overview.comparison.total" class="flex items-center mt-1">
              <span
                :class="[
                  'text-xs font-medium',
                  analytics.overview.comparison.total.trend === 'up'
                    ? 'text-green-600 dark:text-green-400'
                    : analytics.overview.comparison.total.trend === 'down'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400'
                ]"
              >
                {{ analytics.overview.comparison.total.changePercentage }}%
              </span>
              <svg
                v-if="analytics.overview.comparison.total.trend === 'up'"
                class="w-3 h-3 text-green-600 dark:text-green-400 ml-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              <svg
                v-else-if="analytics.overview.comparison.total.trend === 'down'"
                class="w-3 h-3 text-red-600 dark:text-red-400 ml-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Attendance Rate -->
      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div
              class="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-5 h-5 text-green-600 dark:text-green-400"
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
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Attendance Rate</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">
              {{ analytics.overview.current.attendanceRate.toFixed(1) }}%
            </p>
            <div v-if="analytics.overview.comparison.attendanceRate" class="flex items-center mt-1">
              <span
                :class="[
                  'text-xs font-medium',
                  analytics.overview.comparison.attendanceRate.trend === 'up'
                    ? 'text-green-600 dark:text-green-400'
                    : analytics.overview.comparison.attendanceRate.trend === 'down'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400'
                ]"
              >
                {{ analytics.overview.comparison.attendanceRate.changePercentage }}%
              </span>
              <svg
                v-if="analytics.overview.comparison.attendanceRate.trend === 'up'"
                class="w-3 h-3 text-green-600 dark:text-green-400 ml-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              <svg
                v-else-if="analytics.overview.comparison.attendanceRate.trend === 'down'"
                class="w-3 h-3 text-red-600 dark:text-red-400 ml-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Present Students -->
      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div
              class="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-5 h-5 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Present</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">
              {{ analytics.overview.current.present }}
            </p>
            <div v-if="analytics.overview.comparison.present" class="flex items-center mt-1">
              <span
                :class="[
                  'text-xs font-medium',
                  analytics.overview.comparison.present.trend === 'up'
                    ? 'text-green-600 dark:text-green-400'
                    : analytics.overview.comparison.present.trend === 'down'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400'
                ]"
              >
                {{ analytics.overview.comparison.present.changePercentage }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Absent Students -->
      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div
              class="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-5 h-5 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Absent</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">
              {{ analytics.overview.current.absent }}
            </p>
            <div v-if="analytics.overview.comparison.absent" class="flex items-center mt-1">
              <span
                :class="[
                  'text-xs font-medium',
                  analytics.overview.comparison.absent.trend === 'up'
                    ? 'text-red-600 dark:text-red-400'
                    : analytics.overview.comparison.absent.trend === 'down'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-400'
                ]"
              >
                {{ analytics.overview.comparison.absent.changePercentage }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts and Detailed Analytics -->
    <div v-if="analytics" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Class Performance -->
      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Class Performance</h3>
        <div v-if="analytics.classPerformance?.length > 0" class="space-y-3">
          <div
            v-for="(classData, index) in analytics.classPerformance.slice(0, 5)"
            :key="classData.class.id"
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div class="flex items-center">
              <div
                class="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mr-3"
              >
                <span class="text-sm font-medium text-indigo-600 dark:text-indigo-400">{{
                  index + 1
                }}</span>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ classData.class.name }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ classData.total }} students
                </p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ classData.attendanceRate.toFixed(1) }}%
              </p>
              <div class="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                <div
                  class="bg-indigo-600 h-2 rounded-full"
                  :style="{ width: `${classData.attendanceRate}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
          No class performance data available
        </div>
      </div>

      <!-- Top Performers -->
      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Top Performing Students
        </h3>
        <div v-if="analytics.studentPerformance?.topPerformers?.length > 0" class="space-y-3">
          <div
            v-for="(student, index) in analytics.studentPerformance.topPerformers.slice(0, 5)"
            :key="student.student.id"
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div class="flex items-center">
              <div
                class="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-3"
              >
                <span class="text-sm font-medium text-green-600 dark:text-green-400">{{
                  index + 1
                }}</span>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ student.student.first_name }} {{ student.student.last_name }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ student.student.admission_number }}
                </p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ student.attendanceRate.toFixed(1) }}%
              </p>
              <div class="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                <div
                  class="bg-green-600 h-2 rounded-full"
                  :style="{ width: `${student.attendanceRate}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
          No student performance data available
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!analytics" class="text-center py-12">
      <svg
        class="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No analytics data</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Select filters and click refresh to load analytics.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useToast } from '~/composables/useToast';
import { useAuth } from '~/composables/useAuth';
import { useAcademics } from '~/composables/useAcademics';
import { useSchools } from '~/composables/useSchools';
import { useAttendance } from '~/composables/useAttendance';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';

// Composables
const { showToast } = useToast();
const { user, isSuperAdmin, isAdmin, isBranchAdmin } = useAuth();
const { selectedBranchId } = useGlobalBranch();
const { schools, fetchSchools } = useSchools();
const {
  classOptions,
  sectionOptions,
  academicYears,
  fetchClasses,
  fetchSections,
  fetchAcademicYears
} = useAcademics();

// Use attendance composable for analytics
const { analytics, analyticsLoading: loading, loadAnalytics, exportAnalytics } = useAttendance();

// Filters
const filters = ref({
  period: 'this_month',
  school_id: '',
  branch_id: selectedBranchId.value || '',
  class_id: '',
  section_id: '',
  academic_year: '',
  custom_start_date: '',
  custom_end_date: ''
});

watch(selectedBranchId, async newBranchId => {
  filters.value.branch_id = newBranchId || '';
  filters.value.class_id = '';
  filters.value.section_id = '';
  if (newBranchId) {
    await fetchClasses({ branchId: newBranchId });
  }
  await loadAnalyticsData();
});

// Computed options for dropdowns
const schoolOptions = computed(() =>
  schools.value.map((school: any) => ({
    value: school.id,
    label: school.name
  }))
);


const periodOptions = computed(() => [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' }
]);

// Computed
const academicYearOptions = computed(() => {
  return academicYears.value.map(year => ({
    value: year.name,
    label: year.name + (year.is_current ? ' (Current)' : '')
  }));
});

// Methods
const onSchoolChange = async () => {
  filters.value.branch_id = '';
  filters.value.class_id = '';
  filters.value.section_id = '';

  if (filters.value.school_id) {
  } else {
      }
};

const onBranchChange = async () => {
  filters.value.class_id = '';
  filters.value.section_id = '';

  if (filters.value.branch_id) {
    await fetchClasses({ branchId: filters.value.branch_id });
  } else {
    classOptions.value = [];
  }
};

const loadAnalyticsData = async () => {
  try {
    const params = { ...filters.value };

    // Remove empty values
    Object.keys(params).forEach(key => {
      if (params[key as keyof typeof params] === '') {
        delete params[key as keyof typeof params];
      }
    });

    // Check if we have minimum required parameters
    if (!params.school_id && !user.value?.school_id) {
      return;
    }

    // Ensure we have school_id from user if not in params
    if (!params.school_id && user.value?.school_id) {
      params.school_id = user.value.school_id;
    }

    await loadAnalytics(params);
  } catch (error) {
    // Error handling is done in the composable
  }
};

const handleExportAnalytics = async () => {
  try {
    const params = { ...filters.value };

    // Remove empty values
    Object.keys(params).forEach(key => {
      if (params[key as keyof typeof params] === '') {
        delete params[key as keyof typeof params];
      }
    });

    await exportAnalytics(params);
  } catch (error) {
    // Error handling is done in the composable
  }
};

// Lifecycle
onMounted(async () => {
  try {
    // Load academic years first
    await fetchAcademicYears();

    // Set default academic year
    const currentYear = academicYears.value.find(year => year.is_current);
    if (currentYear) {
      filters.value.academic_year = currentYear.name;
    }

    // Initialize based on user role
    if (isSuperAdmin.value) {
      // Super Admin: Load schools, then branches will be loaded when school is selected
      await fetchSchools();
    } else if (isAdmin.value) {
      // Admin: Load branches for their school directly
      filters.value.school_id = user.value?.school_id || '';
    } else if (isBranchAdmin.value) {
      // Branch Admin: Load classes for their branch directly
      filters.value.school_id = user.value?.school_id || '';
      filters.value.branch_id = user.value?.branch_id || '';
      await fetchClasses({ branchId: filters.value.branch_id });
    }

    // Load analytics with current filters (only if we have required filters)
    if (filters.value.school_id || user.value?.school_id) {
      await loadAnalyticsData();
    }
  } catch (error) {
    showToast('Error loading analytics data', 'error');
  }
});
</script>
