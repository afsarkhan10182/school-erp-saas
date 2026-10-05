<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="sm:flex sm:items-center sm:justify-between">
      <div class="mb-4 sm:mb-0">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Attendance Reports
        </h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Student attendance tracking and analytics
        </p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3">
          <!-- Column Selector -->
          <div class="relative column-selector-dropdown">
            <button
              @click="toggleColumnSelector"
              class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-200 shadow-sm cursor-pointer"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              Columns
              <svg
                class="ml-1 h-4 w-4 transition-transform duration-200"
                :class="{ 'rotate-180': showColumnSelector }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <!-- Column Selector Dropdown -->
            <div
              v-show="showColumnSelector"
              class="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 transition-all duration-200 ease-in-out"
              style="transform-origin: top right"
            >
              <div class="p-4">
                <div class="flex items-center justify-between mb-3">
                  <h3 class="text-sm font-medium text-gray-900 dark:text-white">Select Columns</h3>
                  <div class="flex gap-2">
                    <button
                      @click="selectAllColumns"
                      class="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      Select All
                    </button>
                    <button
                      @click="deselectAllColumns"
                      class="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div class="space-y-2 max-h-48 overflow-y-auto">
                  <label
                    v-for="column in availableColumns"
                    :key="column.key"
                    class="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded"
                  >
                    <input
                      v-model="column.visible"
                      type="checkbox"
                      class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span class="text-sm text-gray-700 dark:text-gray-300">{{ column.label }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <button
            @click="printAttendanceReport"
            :disabled="loading || records.length === 0"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print Report
          </button>

          <!-- Download Dropdown -->
          <div class="relative download-dropdown">
            <button
              @click="toggleDownloadDropdown"
              :disabled="loading || records.length === 0"
              class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download
              <svg
                class="ml-2 h-4 w-4 transition-transform duration-200"
                :class="{ 'rotate-180': showDownloadDropdown }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <!-- Dropdown Menu -->
            <div
              v-show="showDownloadDropdown"
              class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 transition-all duration-200 ease-in-out"
              style="transform-origin: top right"
            >
              <div class="py-1">
                <button
                  @click="downloadPDFReport"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 flex items-center"
                >
                  <svg class="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  PDF
                </button>
                <button
                  @click="downloadExcelReport"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 flex items-center"
                >
                  <svg class="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 012-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Excel
                </button>
                <button
                  @click="downloadCSVReport"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 flex items-center"
                >
                  <svg class="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  CSV
                </button>
              </div>
            </div>
          </div>

          <button
            class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            @click="showNotificationModal = true"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6zM4 5h6V4a1 1 0 00-1-1H5a1 1 0 00-1 1v1zM20 5V4a1 1 0 00-1-1h-1a1 1 0 00-1 1v1h3z"
              ></path>
            </svg>
            Notifications
          </button>
        </div>
      </div>
      <!-- Filters -->
      <FilterCard>
        <template #header>
          <div class="ml-auto">
            <button
              @click="resetFilters"
              :disabled="loading"
              class="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium disabled:opacity-50"
            >
              Reset Filters
            </button>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >From Date</label
            >
            <input
              v-model="filters.date_from"
              type="date"
              :disabled="loading"
              class="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >To Date</label
            >
            <input
              v-model="filters.date_to"
              type="date"
              :disabled="loading"
              class="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >Class</label
            >
            <EnhancedDropdown
              :options="classOptions"
              v-model="filters.class_id"
              placeholder="All Classes"
              @update:modelValue="onClassChange"
              :disabled="loading"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >Section</label
            >
            <EnhancedDropdown
              :options="sectionOptions"
              v-model="filters.section_id"
              placeholder="All Sections"
              :disabled="loading || !filters.class_id"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >Academic Year</label
            >
            <input
              v-model="filters.academic_year"
              type="text"
              :disabled="loading"
              class="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="2024-25"
            />
          </div>

          <!-- Apply Filters Button -->
          <div class="flex items-end">
            <button
              @click="() => load(1)"
              :disabled="loading"
              class="w-full inline-flex justify-center items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
              {{ loading ? 'Loading...' : 'Apply Filters' }}
            </button>
          </div>
        </div>
      </FilterCard>

      <!-- Summary Cards -->
      <div v-if="summary" class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div
          class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div class="text-sm font-medium text-gray-500 dark:text-gray-400">Total</div>
          <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ summary.total }}</div>
        </div>
        <div
          class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div class="text-sm font-medium text-green-600 dark:text-green-400">Present</div>
          <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ summary.present }}</div>
        </div>
        <div
          class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div class="text-sm font-medium text-red-600 dark:text-red-400">Absent</div>
          <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ summary.absent }}</div>
        </div>
        <div
          class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div class="text-sm font-medium text-yellow-600 dark:text-yellow-400">Late</div>
          <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ summary.late }}</div>
        </div>
        <div
          class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div class="text-sm font-medium text-indigo-600 dark:text-indigo-400">Excused</div>
          <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ summary.excused }}</div>
        </div>
      </div>

      <div
        v-if="!loading && (!records || records.length === 0)"
        class="border border-gray-200 dark:border-gray-700 rounded p-6 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
      >
        <div class="font-medium mb-2 text-gray-900 dark:text-white">No attendance records</div>
        <p>Adjust the report filters and try again.</p>
      </div>

      <!-- Fallback Table if DataTable doesn't work -->
      <div
        v-if="records.length > 0"
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
      >
        <div class="overflow-x-auto">
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
                  Admission No.
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Student Name
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Class
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Section
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
                v-for="(record, index) in records"
                :key="index"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {{ record.date }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {{ record.admission_number }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {{ record.student_name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {{ record.class }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {{ record.section }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    :class="{
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300':
                        record.status === 'present',
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300':
                        record.status === 'absent',
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300':
                        record.status === 'late',
                      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300':
                        record.status === 'excused'
                    }"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
                  >
                    {{ record.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {{ record.remarks || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <Pagination
        v-if="pagination.total_records > 0"
        :pagination="pagination"
        item-label="attendance records"
        @page-changed="changePage"
        @page-size-changed="handlePageSizeChange"
        class="mt-4"
      />

      <!-- Original DataTable (commented out for now) -->
      <!-- <DataTable v-else :items="records" :columns="columns" :loading="loading">
        <template #status="{ item }">
          <span
            :class="{
              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300':
                item.status === 'present',
              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300': item.status === 'absent',
              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300':
                item.status === 'late',
              'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300':
                item.status === 'excused'
            }"
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
          >
            {{ item.status }}
          </span>
        </template>
      </DataTable> -->

      <!-- Notification Modal -->
      <Modal :show="showNotificationModal" @close="showNotificationModal = false">
        <template #header>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Send Attendance Notifications
          </h3>
        </template>

        <template #body>
          <form @submit.prevent="sendNotifications" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >Notification Type</label
              >
              <EnhancedDropdown
                v-model="notificationForm.type"
                :options="[
                  { label: 'Select notification type', value: '' },
                  { label: 'Send Absence Notifications', value: 'absence' },
                  { label: 'Send Late Arrival Notifications', value: 'late' },
                  { label: 'Send Daily Summary', value: 'summary' }
                ]"
                placeholder="Select notification type"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >Select Date</label
              >
              <input
                v-model="notificationForm.date"
                type="date"
                required
                class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                :max="new Date().toISOString().split('T')[0]"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >Select Class</label
              >
              <EnhancedDropdown
                v-model="notificationForm.class_id"
                :options="[{ label: 'Choose a class', value: '' }, ...classOptions]"
                placeholder="Choose a class"
                required
                @update:model-value="loadNotificationSections"
              />
            </div>

            <div v-if="notificationSectionOptions.length > 0">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >Select Section (Optional)</label
              >
              <EnhancedDropdown
                v-model="notificationForm.section_id"
                :options="[{ label: 'All sections', value: '' }, ...notificationSectionOptions]"
                placeholder="All sections"
              />
            </div>

            <div
              class="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4"
            >
              <div class="flex">
                <svg class="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                    How it works
                  </h3>
                  <div class="mt-2 text-sm text-indigo-700 dark:text-indigo-300">
                    <p>{{ getNotificationDescription() }}</p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </template>

        <template #footer>
          <button
            type="button"
            @click="showNotificationModal = false"
            class="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            @click="sendNotifications"
            :disabled="
              isNotificationLoading ||
              !notificationForm.type ||
              !notificationForm.date ||
              !notificationForm.class_id
            "
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isNotificationLoading ? 'Sending...' : 'Send Notifications' }}
          </button>
        </template>
      </Modal>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useToast } from '~/composables/useToast';
import { useAuth } from '~/composables/useAuth';
import { useAuthStore } from '~/stores/auth';
import { useAcademics } from '~/composables/useAcademics';
import { useSchools } from '~/composables/useSchools';
import { useExportService } from '~/composables/useExportService';
import { usePrintReport } from '~/composables/usePrintReport';
import { Attendance, AttendanceNotifications, Sections } from '~/api';
import Modal from '~/components/ui/Modal.vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import FilterCard from '~/components/ui/FilterCard.vue';
import DataTable from '~/components/ui/DataTable.vue';
import Pagination from '~/components/ui/Pagination.vue';

const authStore = useAuthStore();
const { selectedBranchId, currentSchool } = useGlobalBranch();

const filters = ref<any>({
  date_from: new Date().toISOString().slice(0, 10),
  date_to: new Date().toISOString().slice(0, 10),
  school_id: authStore.currentSchool?.id || '',
  branch_id: selectedBranchId.value || '',
  academic_year: '',
  class_id: '',
  section_id: ''
});
const loading = ref(false);
const records = ref<any[]>([]);
const summary = ref<any>(null);

// Watch for global branch or school change
watch(selectedBranchId, async newVal => {
  filters.value.branch_id = newVal || '';
  filters.value.class_id = '';
  filters.value.section_id = '';
  await loadClasses();
  await load(1);
});

watch(currentSchool, async () => {
  filters.value.school_id = authStore.currentSchool?.id || '';
  filters.value.branch_id = selectedBranchId.value || '';
  filters.value.class_id = '';
  filters.value.section_id = '';
  await loadClasses();
  await load(1);
});

// Pagination state
const pagination = ref({
  page: 1,
  current_page: 1,
  total_pages: 1,
  total: 0,
  total_records: 0,
  per_page: 10,
  limit: 10
});

// Auth composables
const { isSuperAdmin, isAdmin } = useAuth();

// Export and print services
const { generateReport, isGenerating } = useExportService();
const { printReport: printReportCommon } = usePrintReport();

// Academic composables
const { classes, sections, fetchClasses, fetchSections } = useAcademics();
const { schools, fetchSchools } = useSchools();

// Computed options
const schoolOptions = computed(() =>
  schools.value.map((school: any) => ({
    value: school.id,
    label: school.name
  }))
);
const classOptions = computed(() =>
  classes.value.map((cls: any) => ({
    value: cls.id,
    label: cls.name
  }))
);
const sectionOptions = computed(() =>
  sections.value.map((section: any) => ({
    value: section.id,
    label: section.name
  }))
);

// Notification modal state
const showNotificationModal = ref(false);
const isNotificationLoading = ref(false);
const notificationSectionOptions = ref<any[]>([]);
const notificationForm = ref({
  type: '',
  date: new Date().toISOString().slice(0, 10),
  class_id: '',
  section_id: ''
});

// Dropdown states
const showDownloadDropdown = ref(false);
const showColumnSelector = ref(false);

// Available columns for reports
const availableColumns = ref([
  { key: 'date', label: 'Date', visible: true },
  { key: 'admission_number', label: 'Admission No.', visible: true },
  { key: 'student_name', label: 'Student Name', visible: true },
  { key: 'class', label: 'Class', visible: true },
  { key: 'section', label: 'Section', visible: true },
  { key: 'status', label: 'Status', visible: true },
  { key: 'remarks', label: 'Remarks', visible: true }
]);

// Table columns for DataTable component
const columns = [
  { key: 'date', label: 'Date' },
  { key: 'admission_number', label: 'Admission No.' },
  { key: 'student_name', label: 'Student Name' },
  { key: 'class', label: 'Class' },
  { key: 'section', label: 'Section' },
  { key: 'status', label: 'Status' },
  { key: 'remarks', label: 'Remarks' }
];

// Computed property to filter visible columns
const displayedColumns = computed(() => {
  return availableColumns.value.filter(column => column.visible);
});

const loadSchools = async () => {
  if (isSuperAdmin.value) {
    await fetchSchools();
  }
};


const loadClasses = async () => {
  const options: any = {};

  // Filter by branch if selected
  if (filters.value.branch_id) {
    options.branchId = filters.value.branch_id;
  }

  // Filter by school if selected (for super admin)
  if (filters.value.school_id) {
    options.schoolId = filters.value.school_id;
  }

  await fetchClasses(options);
};

const loadSections = async () => {
  const options: any = {};

  // Filter by class if selected
  if (filters.value.class_id) {
    options.classId = filters.value.class_id;
  }

  // Filter by branch if selected
  if (filters.value.branch_id) {
    options.branchId = filters.value.branch_id;
  }

  // Filter by school if selected (for super admin)
  if (filters.value.school_id) {
    options.schoolId = filters.value.school_id;
  }

  await fetchSections(options);
};

const loadDropdowns = async () => {
  await loadClasses();
  await loadSections();
};

const onSchoolChange = async () => {
  filters.value.branch_id = ''; // Reset branch when school changes
  filters.value.class_id = ''; // Reset class when school changes
  filters.value.section_id = ''; // Reset section when school changes
  await loadClasses(); // Reload classes for selected school
  sections.value = []; // Clear sections
};

const onBranchChange = async () => {
  filters.value.class_id = ''; // Reset class when branch changes
  filters.value.section_id = ''; // Reset section when branch changes

  await loadClasses(); // Reload classes for selected branch
  sections.value = []; // Clear sections
};

const onClassChange = async () => {
  filters.value.section_id = ''; // Reset section when class changes
  await loadSections(); // Reload sections for selected class
};

const resetFilters = async () => {
  filters.value = {
    date_from: new Date().toISOString().slice(0, 10),
    date_to: new Date().toISOString().slice(0, 10),
    school_id: '',
    branch_id: '',
    academic_year: '',
    class_id: '',
    section_id: ''
  };

  // Clear current records and summary
  records.value = [];
  summary.value = null;

  // Reset dropdowns
  classes.value = [];
  sections.value = [];

  // Reload initial data
  await loadClasses();
  if (isSuperAdmin.value) {
    await loadSchools();
  }
  if (isSuperAdmin.value || isAdmin.value) {
  }

  showToast('Filters reset successfully', 'success');
};

const { showToast } = useToast();

const load = async (page = 1, exportAll = false) => {
  if (!exportAll) {
    loading.value = true;
  }

  try {
    // Validate date_from is provided
    if (!filters.value.date_from) {
      showToast('From Date is required to load data', 'error');
      if (!exportAll) {
        loading.value = false;
      }
      return;
    }

    // Build proper parameters for the API
    const params: any = {
      date_from: filters.value.date_from,
      date_to: filters.value.date_to || filters.value.date_from // Use date_from if date_to is not provided
    };

    if (exportAll) {
      params.export_all = true;
    } else {
      params.page = page;
      params.limit = pagination.value.per_page;
    }

    if (filters.value.school_id) params.school_id = filters.value.school_id;
    if (filters.value.branch_id) params.branch_id = filters.value.branch_id;
    if (filters.value.class_id) params.class_id = filters.value.class_id;
    if (filters.value.section_id) params.section_id = filters.value.section_id;
    if (filters.value.academic_year) params.academic_year = filters.value.academic_year;

    const res = await Attendance.getReport(params);
    const data = (res as any).data || res;

    // Transform the records to match our column structure
    const transformedRecords = data.records.map((record: any) => {
      // Handle the actual API response structure
      const transformed = {
        date: record.date,
        admission_number: record.student?.admission_number,
        student_name: record.student
          ? `${record.student.first_name || ''} ${record.student.last_name || ''}`.trim()
          : '',
        class: record.class?.name,
        section: record.section?.name,
        status: record.status,
        remarks: record.remarks,
        // Keep original data for reference
        original: record
      };

      return transformed;
    });

    if (exportAll) {
      // For export/print, return the data directly
      return transformedRecords;
    } else {
      // For normal page display, update the reactive data
      records.value = transformedRecords;
      summary.value = data.summary;

      // Update pagination data
      const paginationData = data.pagination;
      pagination.value = {
        page: paginationData.current_page,
        current_page: paginationData.current_page,
        total: paginationData.total_records,
        total_records: paginationData.total_records,
        total_pages: paginationData.total_pages,
        per_page: paginationData.per_page,
        limit: paginationData.per_page || 10
      };
    }

    // Don't show toast for empty results - the UI already shows "No attendance records" message
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || 'Failed to load attendance report';
    if (exportAll) {
      return [];
    } else {
      showToast(msg, 'error');
    }
  } finally {
    if (!exportAll) {
      loading.value = false;
    }
  }
};

// Pagination handlers
const changePage = (page: number) => {
  if (page >= 1 && page <= pagination.value.total_pages) {
    pagination.value.current_page = page;
    pagination.value.page = page;
    load(page);
  }
};

const handlePageSizeChange = (newPageSize: number) => {
  pagination.value.per_page = newPageSize;
  pagination.value.limit = newPageSize;
  load(1);
};

// Common download function following DRY principle
const downloadReport = async (format: string) => {
  try {
    closeDownloadDropdown();

    if (!validateColumnVisibility('export') || !validateDataAvailability('export')) {
      return;
    }

    if (!filters.value.date_from) {
      showToast('From Date is required for export', 'error');
      return;
    }

    const exportFilters: any = {
      date_from: filters.value.date_from,
      date_to: filters.value.date_to || filters.value.date_from,
      school_id: filters.value.school_id,
      branch_id: filters.value.branch_id,
      class_id: filters.value.class_id,
      section_id: filters.value.section_id,
      academic_year: filters.value.academic_year,
      export_all: true
    };

    // Remove undefined values
    Object.keys(exportFilters).forEach(key => {
      if (exportFilters[key] === undefined || exportFilters[key] === '') {
        delete exportFilters[key];
      }
    });

    const selectedColumns = displayedColumns.value.map(col => ({
      key: col.key,
      header: col.label
    }));

    await generateReport({
      report_type: 'attendance',
      format,
      filters: exportFilters,
      columns: selectedColumns
    });
  } catch (error: any) {
    showToast(`Failed to export ${format.toUpperCase()} report`, 'error');
  }
};

const downloadPDFReport = () => downloadReport('pdf');
const downloadExcelReport = () => downloadReport('excel');
const downloadCSVReport = () => downloadReport('csv');

// Validation functions
const validateColumnVisibility = (action = 'export') => {
  if (displayedColumns.value.length === 0) {
    showToast(`No columns selected. Please select at least one column to ${action}.`, 'warning');
    return false;
  }
  return true;
};

const validateDataAvailability = (action = 'export') => {
  if (records.value.length === 0) {
    showToast(
      `No data available to ${action}. Please load some attendance records first.`,
      'warning'
    );
    return false;
  }
  return true;
};

// Print functionality
const printAttendanceReport = async () => {
  try {
    if (!validateColumnVisibility('print')) {
      return;
    }

    // Get all data for printing (not just current page)
    const allRecords = await load(1, true);

    if (!allRecords || allRecords.length === 0) {
      showToast('No data to print. Please load some attendance records first.', 'warning');
      return;
    }

    const formattedData = allRecords.map((record: any) => ({
      date: record.date,
      admission_number: record.admission_number,
      student_name: record.student_name,
      class: record.class,
      section: record.section,
      status: record.status,
      remarks: record.remarks
    }));

    const reportData = {
      title: 'Attendance Report',
      data: formattedData,
      columns: displayedColumns.value.map(col => ({
        key: col.key,
        header: col.label
      })),
      filters: {
        'From Date': filters.value.date_from,
        'To Date': filters.value.date_to || filters.value.date_from,
        Branch: filters.value.branch_id
          ? (filters.value.branch_id ? 'Selected Branch' : 'All Branches')
          : 'All Branches',
        Class: filters.value.class_id
          ? classOptions.value.find(c => c.value === filters.value.class_id)?.label || 'All Classes'
          : 'All Classes',
        Section: filters.value.section_id
          ? sectionOptions.value.find(s => s.value === filters.value.section_id)?.label ||
            'All Sections'
          : 'All Sections',
        'Academic Year': filters.value.academic_year || 'All Years'
      },
      totalRecords: allRecords.length,
      reportType: 'attendance'
    };

    await printReportCommon(reportData, {
      showHeader: true,
      showSummary: true,
      showFilters: true,
      showFooter: true,
      autoPrint: true
    });
  } catch (error) {
    showToast('Error printing report', 'error');
  }
};

// Dropdown control methods
const toggleDownloadDropdown = () => {
  showDownloadDropdown.value = !showDownloadDropdown.value;
};

const closeDownloadDropdown = () => {
  showDownloadDropdown.value = false;
};

const toggleColumnSelector = () => {
  showColumnSelector.value = !showColumnSelector.value;
};

const selectAllColumns = () => {
  availableColumns.value.forEach(col => (col.visible = true));
};

const deselectAllColumns = () => {
  availableColumns.value.forEach(col => (col.visible = false));
};

// Click outside handler for dropdowns
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.download-dropdown')) {
    showDownloadDropdown.value = false;
  }
  if (!target.closest('.column-selector-dropdown')) {
    showColumnSelector.value = false;
  }
};

// Notification functions
const loadNotificationSections = async () => {
  if (!notificationForm.value.class_id) {
    notificationSectionOptions.value = [];
    return;
  }

  try {
    const sections = await Sections.getAll({
      page: 1,
      limit: 100,
      is_active: 'true',
      class_id: notificationForm.value.class_id
    });
    notificationSectionOptions.value = (sections.data?.rows || sections.data).map((s: any) => ({
      label: s.name,
      value: s.id
    }));
  } catch (error) {
    // Error handled silently
  }
};

const getNotificationDescription = () => {
  const descriptions = {
    absence:
      'This will send absence notifications to parents of students who were marked absent for the selected date and class.',
    late: 'This will send late arrival notifications to parents of students who arrived late for the selected date and class.',
    summary:
      'This will send a daily attendance summary to all parents for the selected date and class.'
  };
  return (
    descriptions[notificationForm.value.type as keyof typeof descriptions] ||
    'Select a notification type to see details.'
  );
};

const sendNotifications = async () => {
  try {
    isNotificationLoading.value = true;

    // First, find attendance sessions for the selected date and class
    const sessionsResponse = await Attendance.listSessions({
      page: 1,
      limit: 10,
      date_from: notificationForm.value.date,
      date_to: notificationForm.value.date,
      class_id: notificationForm.value.class_id,
      status: 'published'
    });

    const sessions = sessionsResponse.data;
    if (sessions.length === 0) {
      showToast('No published attendance sessions found for the selected date and class', 'error');
      return;
    }

    // Use the first session found
    const session = sessions[0];

    // Get session details to find absent/late students
    const sessionDetails = await Attendance.getSession(session.id);
    const attendanceRecords = sessionDetails.data.records;

    let response;
    if (notificationForm.value.type === 'absence') {
      const absentStudents = attendanceRecords
        .filter((record: any) => record.status === 'absent')
        .map((record: any) => ({ student_id: record.student_id, remarks: record.remarks }));

      if (absentStudents.length === 0) {
        showToast('No absent students found for the selected session', 'warning');
        return;
      }

      response = await AttendanceNotifications.sendAbsenceNotifications({
        absentStudents,
        sessionData: {
          date: notificationForm.value.date,
          class_id: notificationForm.value.class_id,
          section_id: notificationForm.value.section_id,
          attendance_type: session.attendance_type,
          period_number: session.period_number
        }
      });
    } else if (notificationForm.value.type === 'late') {
      const lateStudents = attendanceRecords
        .filter((record: any) => record.status === 'late')
        .map((record: any) => ({
          student_id: record.student_id,
          arrival_time: record.arrival_time || 'Not specified',
          remarks: record.remarks
        }));

      if (lateStudents.length === 0) {
        showToast('No late students found for the selected session', 'warning');
        return;
      }

      response = await AttendanceNotifications.sendLateArrivalNotifications({
        lateStudents,
        sessionData: {
          date: notificationForm.value.date,
          class_id: notificationForm.value.class_id,
          section_id: notificationForm.value.section_id,
          attendance_type: session.attendance_type,
          period_number: session.period_number
        }
      });
    } else if (notificationForm.value.type === 'summary') {
      const totalStudents = attendanceRecords.length;
      const presentCount = attendanceRecords.filter((r: any) => r.status === 'present').length;
      const absentCount = attendanceRecords.filter((r: any) => r.status === 'absent').length;
      const lateCount = attendanceRecords.filter((r: any) => r.status === 'late').length;
      const attendancePercentage =
        totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

      response = await AttendanceNotifications.sendAttendanceSummary({
        classData: {
          totalStudents,
          presentCount,
          absentCount,
          lateCount,
          attendancePercentage,
          className: session.Class?.name || 'Unknown',
          sectionName: session.Section?.name || 'All'
        },
        sessionData: {
          date: notificationForm.value.date,
          class_id: notificationForm.value.class_id,
          section_id: notificationForm.value.section_id,
          attendance_type: session.attendance_type,
          period_number: session.period_number
        }
      });
    }

    showToast(
      `Notifications sent successfully! ${response.data.emailsSent} emails sent.`,
      'success'
    );
    showNotificationModal.value = false;
    notificationForm.value = {
      type: '',
      date: new Date().toISOString().slice(0, 10),
      class_id: '',
      section_id: ''
    };
  } catch (error: any) {
    // Parse error and show user-friendly message
    let userMessage = 'Unable to send notifications. Please try again.';

    // Handle specific error scenarios with user-friendly messages
    if (error.response?.status === 404) {
      userMessage =
        'No attendance records found for the selected date and class. Please ensure attendance is marked and published first.';
    } else if (error.response?.status === 400) {
      const errorMsg = error.response?.data?.message;
      if (
        errorMsg.includes('students data is required') ||
        errorMsg.includes('No absent students')
      ) {
        userMessage =
          'No absent students found for the selected session. Please check the attendance records.';
      } else if (errorMsg.includes('do not belong to your school')) {
        userMessage = 'Access denied: You can only send notifications for students in your school.';
      } else if (
        errorMsg.includes('Session data') ||
        errorMsg.includes('date and class_id is required')
      ) {
        userMessage = 'Invalid session data. Please select a valid date and class.';
      } else if (errorMsg.includes('No published attendance sessions found')) {
        userMessage =
          'No attendance sessions found for the selected date and class. Please ensure attendance is marked and saved first.';
      } else {
        userMessage = 'Invalid request. Please check your selections and try again.';
      }
    } else if (error.response?.status === 403) {
      userMessage = 'You do not have permission to send notifications for this class.';
    } else if (error.response?.status === 500) {
      userMessage = 'Server error occurred. Please contact your administrator if this persists.';
    } else if (error.response?.status === 401) {
      userMessage = 'Session expired. Please log in again and try again.';
    } else if (!error.response) {
      userMessage = 'Network error. Please check your internet connection and try again.';
    }

    showToast(userMessage, 'error');
  } finally {
    isNotificationLoading.value = false;
  }
};

// Lifecycle hooks
onMounted(async () => {
  try {
    await loadSchools(); // Load schools first (for super admin)
    await loadClasses(); // Load classes
    await load(); // Load initial data

    // Add click outside listener for dropdowns
    document.addEventListener('click', handleClickOutside);
  } catch (error) {
    // Error handled silently
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped></style>
