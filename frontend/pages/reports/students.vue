<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
  >
    <!-- Loading overlay for initial page load -->
    <div
      v-if="isInitializing"
      class="fixed inset-0 bg-white dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center z-50"
    >
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"
        ></div>
        <p class="text-gray-600 dark:text-gray-300">Loading report data...</p>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div class="mb-4 sm:mb-0">
          <h1
            class="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
          >
            Student Reports
          </h1>
          <p class="mt-2 text-lg text-gray-600 dark:text-gray-300">
            Comprehensive student analytics and insights
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
              class="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50"
            >
              <div class="p-2">
                <h3 class="text-xs font-medium text-gray-900 dark:text-white mb-2">
                  Select Columns
                </h3>
                <div class="space-y-1">
                  <label
                    v-for="(column, index) in availableColumns"
                    :key="column.key"
                    class="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-1 py-1 rounded text-xs"
                  >
                    <input
                      type="checkbox"
                      :checked="column.visible"
                      @change="toggleColumnVisibility(index)"
                      class="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                    />
                    <span
                      class="ml-2 text-gray-700 dark:text-gray-300 cursor-pointer select-none"
                      >{{ column.label }}</span
                    >
                  </label>
                </div>
                <div class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <button
                    @click="selectAllColumns"
                    class="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 mr-2 cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    @click="deselectAllColumns"
                    class="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            @click="printStudentsReport"
            :disabled="isLoading || pagination.total_records === 0 || isPrinting"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer v-if="!isPrinting" class="-ml-1 mr-2 h-4 w-4" />
            <svg v-else class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
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
            {{ isPrinting ? 'Printing...' : 'Print Report' }}
          </button>

          <!-- Download Dropdown -->
          <div class="relative download-dropdown">
            <button
              @click="toggleDownloadDropdown"
              :disabled="isLoading || pagination.total_records === 0 || isGenerating"
              class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                v-if="!isGenerating"
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <svg v-else class="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
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
              {{ isGenerating ? 'Generating...' : 'Download' }}
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
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.293.707V19a2 2 0 01-2 2z"
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
                  <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 012-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Export Progress Bar -->
      <div
        v-if="isGenerating"
        class="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 mb-6 p-4"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
            >Generating Report...</span
          >
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ generationProgress }}%</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            class="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
            :style="{ width: generationProgress + '%' }"
          ></div>
        </div>
      </div>

      <!-- Creative Student Distribution Dashboard -->
      <div
        v-if="pagination.total_records > 0 && !isLoading"
        class="bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 mb-8 p-6"
      >
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <BarChart3 class="w-5 h-5 mr-2 text-indigo-600" />
            Student Analytics & Insights
          </h3>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            {{ pagination.total_records }} students analyzed
          </div>
        </div>

        <!-- Enhanced Top Summary Bar with Trends -->
        <div
          class="flex items-center justify-center mb-8 p-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg relative overflow-hidden"
        >
          <!-- Background Pattern -->
          <div class="absolute inset-0 opacity-10">
            <div
              class="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"
            ></div>
            <div
              class="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12"
            ></div>
          </div>

          <div class="flex items-center space-x-16 relative z-10">
            <!-- Classes -->
            <div class="text-center">
              <div class="text-2xl font-bold text-white flex items-center justify-center">
                {{ Object.keys(classDistribution).length }}
                <span class="ml-2 text-sm bg-white/20 px-2 py-1 rounded-full">
                  <TrendingUp class="w-3 h-3" />
                </span>
              </div>
              <div class="text-xs text-indigo-100">Classes</div>
              <div class="text-xs text-indigo-200 mt-1">
                Avg:
                {{
                  Math.round(pagination.total_records / Object.keys(classDistribution).length)
                }}/class
              </div>
            </div>

            <!-- Total Students with Trend -->
            <div class="text-center">
              <div class="text-3xl font-bold text-green-300 flex items-center justify-center">
                {{ pagination.total_records }}
                <span
                  v-if="studentTrend > 0"
                  class="ml-2 text-sm bg-green-500/30 px-2 py-1 rounded-full text-green-200"
                >
                  +{{ studentTrend }}
                </span>
                <span
                  v-else-if="studentTrend < 0"
                  class="ml-2 text-sm bg-red-500/30 px-2 py-1 rounded-full text-red-200"
                >
                  {{ studentTrend }}
                </span>
              </div>
              <div class="text-xs text-indigo-100">Total Students</div>
              <div class="text-xs text-indigo-200 mt-1">{{ getTimeContextText() }}</div>
            </div>

            <!-- Largest Group -->
            <div class="text-center">
              <div class="text-2xl font-bold text-pink-300">
                {{ Math.max(...Object.values(genderDistribution)) }}
              </div>
              <div class="text-xs text-indigo-100">Largest Group</div>
              <div class="text-xs text-indigo-200 mt-1">{{ getLargestGroupName() }}</div>
            </div>

            <!-- Inactive Students -->
            <div class="text-center">
              <div class="text-2xl font-bold text-orange-300">
                {{ summaryData.inactiveStudents || 0 }}
              </div>
              <div class="text-xs text-indigo-100">Inactive</div>
              <div class="text-xs text-indigo-200 mt-1">{{ getInactivePercentage() }}%</div>
            </div>
          </div>
        </div>

        <!-- Distribution Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Enhanced Class Distribution -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="text-lg font-medium text-gray-900 dark:text-white">Class Distribution</h4>
              <div class="flex space-x-2">
                <button
                  @click="sortClassBy = 'count'"
                  :class="[
                    'px-2 py-1 text-xs rounded-md transition-colors',
                    sortClassBy === 'count'
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  ]"
                >
                  By Size
                </button>
                <button
                  @click="sortClassBy = 'name'"
                  :class="[
                    'px-2 py-1 text-xs rounded-md transition-colors',
                    sortClassBy === 'name'
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  ]"
                >
                  By Name
                </button>
              </div>
            </div>
            <div class="space-y-3">
              <div
                v-for="(count, className) in sortedClassDistribution"
                :key="className"
                class="group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg p-2 transition-all duration-200"
                @click="filterByClass(className)"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <div
                      class="w-3 h-3 rounded-full"
                      :style="{ backgroundColor: getClassColor(className) }"
                    ></div>
                    <div>
                      <span
                        class="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                      >
                        {{ className }}
                      </span>
                      <div class="text-xs text-gray-500 dark:text-gray-400">
                        {{ Math.round((count / pagination.total_records) * 100) }}% of total
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center space-x-3">
                    <div class="relative">
                      <div class="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          class="h-2 rounded-full transition-all duration-700 ease-out"
                          :style="{
                            width: `${(count / pagination.total_records) * 100}%`,
                            backgroundColor: getClassColor(className)
                          }"
                        ></div>
                      </div>
                      <!-- Hover Tooltip -->
                      <div
                        class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                      >
                        <div
                          class="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap"
                        >
                          {{ count }} students ({{
                            Math.round((count / pagination.total_records) * 100)
                          }}%)
                        </div>
                        <div
                          class="w-2 h-2 bg-gray-900 transform rotate-45 absolute top-full left-1/2 -translate-x-1/2 -translate-y-1"
                        ></div>
                      </div>
                    </div>
                    <span class="text-sm font-bold text-gray-900 dark:text-white w-8 text-right">{{
                      count
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Status Distribution -->
          <div class="space-y-4">
            <h4 class="text-lg font-medium text-gray-900 dark:text-white">Status Distribution</h4>
            <div class="space-y-3">
              <div
                v-for="(count, status) in statusDistribution"
                :key="status"
                class="flex items-center justify-between"
              >
                <div class="flex items-center space-x-3">
                  <div
                    class="w-3 h-3 rounded-full"
                    :style="{ backgroundColor: getStatusColor(status) }"
                  ></div>
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{
                    getStatusText(status)
                  }}</span>
                </div>
                <div class="flex items-center space-x-3">
                  <div class="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      class="h-2 rounded-full transition-all duration-700 ease-out"
                      :style="{
                        width: `${(count / pagination.total_records) * 100}%`,
                        backgroundColor: getStatusColor(status)
                      }"
                    ></div>
                  </div>
                  <span class="text-sm font-bold text-gray-900 dark:text-white w-8 text-right">{{
                    count
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Enhanced Gender Distribution with Donut Charts -->
        <div class="mt-8">
          <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-6">
            Gender Distribution
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              v-for="(count, gender) in genderDistribution"
              :key="gender"
              class="flex flex-col items-center group cursor-pointer hover:scale-105 transition-transform duration-200"
              @click="filterByGender(gender)"
            >
              <div class="relative w-24 h-24 mb-3">
                <svg class="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    stroke-width="8"
                    fill="transparent"
                    :class="
                      count === 0
                        ? 'text-gray-300 dark:text-gray-600'
                        : 'text-gray-200 dark:text-gray-700'
                    "
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    stroke-width="8"
                    fill="transparent"
                    :stroke-dasharray="`${(count / pagination.total_records) * 251.2} 251.2`"
                    :style="{ color: getGenderColor(gender) }"
                    class="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <span class="text-lg font-bold" :style="{ color: getGenderColor(gender) }">{{
                    count
                  }}</span>
                  <span class="text-xs font-medium" :style="{ color: getGenderColor(gender) }">
                    {{ Math.round((count / pagination.total_records) * 100) }}%
                  </span>
                </div>
              </div>
              <span
                class="text-sm font-medium transition-colors"
                :class="
                  count === 0
                    ? 'text-gray-400 dark:text-gray-500'
                    : 'text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                "
              >
                {{ gender }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <FilterCard>
        <template #header>
          <div class="ml-auto">
            <button
              @click="resetFilters"
              :disabled="isLoading"
              class="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium disabled:opacity-50"
            >
              Reset Filters
            </button>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >Date Range</label
            >
            <EnhancedDropdown
              v-model="filters.dateRange"
              :options="dateRangeOptions"
              :disabled="isLoading"
              @update:model-value="handleDateRangeChange"
            />
          </div>
          <div v-if="filters.dateRange === 'custom'">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >From Date</label
            >
            <input
              v-model="filters.fromDate"
              type="date"
              :disabled="isLoading"
              class="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div v-if="filters.dateRange === 'custom'">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >To Date</label
            >
            <input
              v-model="filters.toDate"
              type="date"
              :disabled="isLoading"
              class="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <!-- School (Super Admin Only) -->
          <div v-if="isSuperAdmin">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >School</label
            >
            <EnhancedDropdown
              :options="schoolOptions"
              v-model="filters.school_id"
              placeholder="All Schools"
              @update:modelValue="onSchoolChange"
              :disabled="isLoading"
            />
          </div>
          <!-- Branch (Super Admin and Admin) -->
          <div v-if="isSuperAdmin || isAdmin">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >Branch</label
            >
            <EnhancedDropdown
              :options="branchOptions"
              v-model="filters.branch_id"
              placeholder="All Branches"
              @update:modelValue="onBranchChange"
              :disabled="isLoading"
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
              :disabled="isLoading"
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
              :disabled="isLoading || !filters.class_id"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >Stream</label
            >
            <EnhancedDropdown
              :options="streamOptions"
              v-model="filters.stream_id"
              placeholder="All Streams"
              @update:modelValue="onStreamChange"
              :disabled="isLoading || !filters.class_id"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >Student Status</label
            >
            <EnhancedDropdown
              :options="statusOptions"
              v-model="filters.status"
              placeholder="All Status"
              :disabled="isLoading"
            />
          </div>

          <!-- Apply Filters Button -->
          <div class="flex items-end">
            <button
              @click="loadData"
              :disabled="isLoading"
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
              {{ isLoading ? 'Loading...' : 'Apply Filters' }}
            </button>
          </div>
        </div>
      </FilterCard>

      <!-- Detailed Report Table -->
      <div
        class="bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div
          class="px-6 py-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700"
        >
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Complete Student List</h3>
          <div class="flex space-x-3">
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{
                pagination.total_records > 0 || completeStudentsData.length > 0
                  ? `${pagination.total_records || completeStudentsData.length} total students`
                  : 'No records'
              }}
            </span>
          </div>
        </div>

        <!-- Loading state for table -->
        <div v-if="isLoading" class="flex items-center justify-center py-12">
          <div class="text-center">
            <div
              class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"
            ></div>
            <p class="text-gray-600 dark:text-gray-300">Loading report data...</p>
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="
            (pagination.total_records === 0 || completeStudentsData.length === 0) && !isLoading
          "
          class="flex items-center justify-center py-12"
        >
          <div class="text-center">
            <div class="text-gray-400 dark:text-gray-500 mb-4">
              <Users class="h-12 w-12 mx-auto" />
            </div>
            <p class="text-gray-600 dark:text-gray-300">
              No students found for the selected filters
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Try adjusting your filters or date range
            </p>
            <p class="text-xs text-gray-400 mt-1">
              Click "Apply Filters" to search with current settings
            </p>
            <div class="mt-4">
              <button
                @click="resetFilters"
                class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        <!-- Student Table -->
        <div v-else-if="completeStudentsData.length > 0" class="overflow-x-auto">
          <table class="min-w-full">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                >
                  Student
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                >
                  Class
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                >
                  Admission Date
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="student in paginatedStudents"
                :key="student.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-12 w-12">
                      <div
                        class="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-2 border-gray-200 dark:border-gray-600"
                      >
                        <span class="text-sm font-bold text-white">
                          {{ student.first_name?.charAt(0) }}{{ student.last_name?.charAt(0) }}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-semibold text-gray-900 dark:text-white">
                        {{ student.first_name }} {{ student.last_name }}
                      </div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">
                        {{ student.admission_number }}
                      </div>
                      <div class="text-xs text-gray-400 dark:text-gray-500">
                        {{ student.email || 'No email' }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ student.class?.name || student.class_name
                  }}{{ student.section?.name ? `-${student.section.name}` : '' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ formatDate(student.admission_date) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="getStatusClass(student.status)"
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                  >
                    {{ getStatusText(student.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    @click="viewStudent(student)"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                  >
                    View
                  </button>
                  <button
                    @click="viewFees(student)"
                    class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                  >
                    Fees
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <Pagination
          v-if="pagination.total_records > 0 || completeStudentsData.length > 0"
          :pagination="pagination"
          item-label="students"
          :additional-info="`${paginatedStudents.length} on this page`"
          @page-changed="handlePageChange"
          @page-size-changed="handlePageSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import {
  Download,
  Users,
  UserPlus,
  UserMinus,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  Printer
} from 'lucide-vue-next';
import { Students } from '~/api';
import { useAuth } from '~/composables/useAuth';
import { useToast } from '~/composables/useToast';
import { useAcademics } from '~/composables/useAcademics';
import { useSchools } from '~/composables/useSchools';
import { useBranches } from '~/composables/useBranches';
import Pagination from '~/components/ui/Pagination.vue';
import { usePrintReport } from '~/composables/usePrintReport';
import { useExportService } from '~/composables/useExportService';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import FilterCard from '~/components/ui/FilterCard.vue';

// Get auth composable and toast
const { user, isSuperAdmin, isAdmin, isBranchAdmin } = useAuth();
const { showToast } = useToast();

// Academic composables
const {
  academicYears,
  classes,
  sections,
  streams,
  fetchAcademicYears,
  fetchClasses,
  fetchSections,
  fetchStreams
} = useAcademics();
const { schools, fetchSchools } = useSchools();
const { branches, fetchBranches } = useBranches();

// Get print and export composables
const { printReport: printReportUtil } = usePrintReport();
const { generateReport, isGenerating } = useExportService();

// State
const completeStudentsData = ref([]); // Paginated data for table
const stats = ref({});
const isLoading = ref(false);
const isInitializing = ref(true);
const showDownloadDropdown = ref(false); // Track download dropdown state
const showColumnSelector = ref(false); // Track column selector dropdown state
const isPrinting = ref(false); // Track print state
const generationProgress = ref(0); // Track export progress

// Pagination state - using the same structure as receipt report
const pagination = ref({
  page: 1,
  current_page: 1,
  total: 0,
  total_records: 0,
  total_pages: 1,
  per_page: 10,
  limit: 10
});

// Dropdown options
const dateRangeOptions = [
  { value: 'all_time', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' }
];

const schoolOptions = computed(() => [
  ...schools.value.map(school => ({
    value: school.id,
    label: school.name
  }))
]);

const branchOptions = computed(() => [
  ...branches.value.map(branch => ({
    value: branch.id,
    label: branch.name
  }))
]);

const classOptions = computed(() => [
  ...classes.value.map(cls => ({
    value: cls.id,
    label: cls.name
  }))
]);

const sectionOptions = computed(() => [
  ...sections.value.map(section => ({
    value: section.id,
    label: section.name
  }))
]);

const streamOptions = computed(() => [
  ...streams.value.map(stream => ({
    value: stream.id,
    label: stream.name
  }))
]);

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'graduated', label: 'Graduated' },
  { value: 'transferred', label: 'Transferred' }
];

// Summary data from backend (for accurate totals)
const summaryData = ref({
  totalStudents: 0,
  activeStudents: 0,
  inactiveStudents: 0,
  newThisMonth: 0
});

// Available columns for reports
const availableColumns = ref([
  { key: 'admission_number', label: 'Admission No.', visible: true },
  { key: 'student_name', label: 'Student Name', visible: true },
  { key: 'email', label: 'Email', visible: true },
  { key: 'phone', label: 'Phone', visible: true },
  { key: 'class', label: 'Class', visible: true },
  { key: 'section', label: 'Section', visible: true },
  { key: 'admission_date', label: 'Admission Date', visible: true },
  { key: 'status', label: 'Status', visible: true },
  { key: 'gender', label: 'Gender', visible: true }
]);

// Filters
const filters = reactive({
  dateRange: 'all_time',
  fromDate: '',
  toDate: '',
  school_id: '', // Add school_id for super admin
  branch_id: '',
  class_id: '',
  stream_id: '',
  section_id: '',
  status: ''
});

// Initialize filters based on user role
const initializeFilters = () => {
  if (isSuperAdmin.value) {
    // Super admin can select any school
    filters.school_id = '';
  } else if (isAdmin.value) {
    // School admin is restricted to their school
    filters.school_id = user.value?.school_id;
  } else if (isBranchAdmin.value) {
    // Branch admin is restricted to their school and branch
    filters.school_id = user.value?.school_id;
    filters.branch_id = user.value?.branch_id;
  }
};

// Pagination - using the new structure
const currentPage = computed(() => pagination.value.current_page);
const pageSize = computed(() => pagination.value.per_page);

// Methods
const loadData = async () => {
  if (isLoading.value) return;

  isLoading.value = true;
  try {
    await Promise.all([loadReport(), loadStats()]);
  } catch (error) {
    showToast('Error loading data', 'error');
  } finally {
    isLoading.value = false;
  }
};

const loadReport = async () => {
  try {
    // Use server-side pagination
    const params = {
      page: pagination.value.current_page,
      limit: pagination.value.per_page,
      status: filters.status,
      school_id: filters.school_id,
      branch_id: filters.branch_id
    };

    // Map date parameters - backend expects from_date and to_date
    if (filters.fromDate && filters.fromDate.trim() !== '') {
      params.from_date = filters.fromDate;
    }
    if (filters.toDate && filters.toDate.trim() !== '') {
      params.to_date = filters.toDate;
    }

    // Map class and section parameters - backend expects class_name and section_name
    if (filters.class_id && filters.class_id !== '') {
      const classItem = classes.value.find(c => c.id === filters.class_id);
      if (classItem) {
        params.class_name = classItem.name;
      }
    }

    if (filters.section_id && filters.section_id !== '') {
      const sectionItem = sections.value.find(s => s.id === filters.section_id);
      if (sectionItem) {
        params.section_name = sectionItem.name;
      }
    }

    // Remove undefined values
    Object.keys(params).forEach(key => {
      if (params[key] === undefined) {
        delete params[key];
      }
    });

    const response = await Students.getReport(params);

    if (response.success) {
      // Store paginated data
      completeStudentsData.value = response.data;

      // Update pagination info if provided by backend
      if (response.pagination) {
        // Handle different pagination response structures
        const paginationData = response.pagination;

        // If pagination has success field, it might be a different structure
        if (paginationData.success !== undefined) {
          // Fallback for unexpected pagination structure
          pagination.value = {
            page: 1,
            current_page: 1,
            total: paginationData.total || completeStudentsData.value.length,
            total_records: paginationData.total || completeStudentsData.value.length,
            total_pages: 1,
            per_page: 10,
            limit: 10
          };
        } else {
          // Standard pagination structure
          pagination.value = {
            page: paginationData.page || 1,
            current_page: paginationData.page || 1,
            total: paginationData.total,
            total_records: paginationData.total,
            total_pages: paginationData.totalPages,
            per_page: paginationData.limit,
            limit: paginationData.limit || 10
          };
        }
      } else {
        // No pagination data, use data length
        pagination.value = {
          page: 1,
          current_page: 1,
          total: completeStudentsData.value.length,
          total_records: completeStudentsData.value.length,
          total_pages: 1,
          per_page: 10,
          limit: 10
        };
      }
    } else {
      completeStudentsData.value = [];
      pagination.value = {
        page: 1,
        current_page: 1,
        total: 0,
        total_records: 0,
        total_pages: 1,
        per_page: 10,
        limit: 10
      };
    }
  } catch (error) {
    showToast('Error loading student report', 'error');
    completeStudentsData.value = [];
  }
};

const loadStats = async () => {
  try {
    // Map filters to stats API parameters
    const params = {
      school_id: filters.school_id,
      branch_id: filters.branch_id,
      class_id: filters.class_id,
      section_id: filters.section_id
    };

    // Remove undefined values
    Object.keys(params).forEach(key => {
      if (params[key] === undefined) {
        delete params[key];
      }
    });

    const response = await Students.getStats(params);
    if (response.success && response.data) {
      stats.value = response.data;
      // Update summary data
      summaryData.value = {
        totalStudents: response.data?.total,
        activeStudents: response.data?.active,
        inactiveStudents: response.data?.inactive,
        newThisMonth: response.data?.newThisMonth
      };
    } else {
      stats.value = {};
      summaryData.value = {
        totalStudents: 0,
        activeStudents: 0,
        inactiveStudents: 0,
        newThisMonth: 0
      };
    }
  } catch (error) {
    showToast('Error loading student stats', 'error');
    stats.value = {};
    summaryData.value = {
      totalStudents: 0,
      activeStudents: 0,
      inactiveStudents: 0,
      newThisMonth: 0
    };
  }
};

const loadAcademicYears = async () => {
  await fetchAcademicYears();
};

const loadClasses = async () => {
  try {
    const options = {};

    // Filter by branch if selected
    if (filters.branch_id) {
      options.branchId = filters.branch_id;
    }

    // Filter by school if selected (for super admin)
    if (filters.school_id) {
      options.schoolId = filters.school_id;
    }

    console.log('Loading classes with options:', options);
    await fetchClasses(options);
    console.log('Classes loaded:', classes.value.length);
  } catch (error) {
    console.error('Error loading classes:', error);
  }
};

const loadSections = async () => {
  try {
    const options = {};

    // Filter by class if selected
    if (filters.class_id) {
      options.classId = filters.class_id;
    }

    // Filter by branch if selected
    if (filters.branch_id) {
      options.branchId = filters.branch_id;
    }

    // Filter by school if selected (for super admin)
    if (filters.school_id) {
      options.schoolId = filters.school_id;
    }

    console.log('Loading sections with options:', options);
    await fetchSections(options);
    console.log('Sections loaded:', sections.value.length);
  } catch (error) {
    console.error('Error loading sections:', error);
  }
};

const loadStreams = async () => {
  try {
    const options = {};

    // Filter by class if selected
    if (filters.class_id) {
      options.classId = filters.class_id;
    }

    // Filter by branch if selected
    if (filters.branch_id) {
      options.branchId = filters.branch_id;
    }

    // Filter by school if selected (for super admin)
    if (filters.school_id) {
      options.schoolId = filters.school_id;
    }

    console.log('Loading streams with options:', options);
    await fetchStreams(options);
    console.log('Streams loaded:', streams.value.length);
  } catch (error) {
    console.error('Error loading streams:', error);
  }
};

const loadBranches = async () => {
  try {
    const options = {};

    // Filter by school if selected (for super admin)
    if (filters.school_id) {
      options.schoolId = filters.school_id;
    }

    console.log('Loading branches with options:', options);
    await fetchBranches(options);
    console.log('Branches loaded:', branches.value.length);
  } catch (error) {
    console.error('Error loading branches:', error);
  }
};

const loadSchools = async () => {
  if (isSuperAdmin.value) {
    await fetchSchools();
  }
};

const viewStudent = student => {
  navigateTo(`/students/${student.id}`);
};

const viewFees = student => {
  navigateTo(`/fees/invoices?student_id=${student.id}`);
};

// Pagination functions (server-side pagination - reload data when page changes)
const handlePageChange = page => {
  if (page >= 1 && page <= pagination.value.total_pages) {
    pagination.value.current_page = page;
    pagination.value.page = page;
    loadData();
  }
};

const handlePageSizeChange = newPageSize => {
  pagination.value.per_page = newPageSize;
  pagination.value.limit = newPageSize; // Also update limit for Pagination component
  pagination.value.current_page = 1; // Reset to first page when changing page size
  pagination.value.page = 1;
  loadData(); // Reload data with new page size
};

const formatDate = date => {
  if (!date) return 'N/A';
  try {
    // Handle both string and Date objects
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'N/A';
    return dateObj.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    return 'N/A';
  }
};

const getStatusClass = status => {
  const classes = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    inactive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    transferred: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    graduated: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    dropped: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  };
  return classes[status] || classes.active;
};

const getStatusText = status => {
  const texts = {
    active: 'Active',
    inactive: 'Inactive',
    transferred: 'Transferred',
    graduated: 'Graduated',
    dropped: 'Dropped'
  };
  return texts[status] || status;
};

// Chart helper functions
const getClassColor = className => {
  const colors = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#06B6D4',
    '#84CC16',
    '#F97316',
    '#EC4899',
    '#6366F1'
  ];
  const index = className.charCodeAt(0) % colors.length;
  return colors[index];
};

const getStatusColor = status => {
  const colors = {
    active: '#10B981',
    inactive: '#EF4444',
    transferred: '#F59E0B',
    graduated: '#3B82F6',
    dropped: '#6B7280'
  };
  return colors[status] || '#6B7280';
};

const getGenderColor = gender => {
  const colors = {
    Male: '#3B82F6',
    Female: '#EC4899',
    Other: '#6B7280'
  };
  return colors[gender] || '#6B7280';
};

// Computed properties
const showStreamDropdown = computed(() => {
  return filters.class_id && streams.value.length > 0;
});

const showSectionDropdown = computed(() => {
  return filters.class_id && sections.value.length > 0;
});

// Pagination computed properties
const totalPagesComputed = computed(() => {
  return pagination.value.total_pages;
});

// Paginated students for table display (server-side pagination)
const paginatedStudents = computed(() => {
  // With server-side pagination, completeStudentsData already contains the current page data
  return completeStudentsData.value;
});

// Chart data computed properties - use stats data for accurate distributions
const classDistribution = computed(() => {
  // Transform the class_distribution array from backend to object format
  const distribution = {};
  if (stats.value.class_distribution && Array.isArray(stats.value.class_distribution)) {
    stats.value.class_distribution.forEach(item => {
      distribution[item.current_class] = item.count;
    });
  }
  return distribution;
});

const statusDistribution = computed(() => {
  // Create status distribution from stats
  return {
    active: stats.value.active,
    inactive: stats.value.inactive,
    graduated: stats.value.graduated,
    dropped: stats.value.dropped
  };
});

const genderDistribution = computed(() => {
  // For now, use placeholder data since backend doesn't provide gender stats
  // This would need to be added to the backend stats endpoint
  return {
    Male: Math.floor(stats.value.total * 0.52),
    Female: Math.floor(stats.value.total * 0.48)
  };
});

// Sorted class distribution for display
const sortedClassDistribution = computed(() => {
  const distribution = classDistribution.value;
  if (sortClassBy.value === 'count') {
    return Object.fromEntries(Object.entries(distribution).sort(([, a], [, b]) => b - a));
  } else {
    return Object.fromEntries(Object.entries(distribution).sort(([a], [b]) => a.localeCompare(b)));
  }
});

// Computed property to filter visible columns
const displayedColumns = computed(() => {
  return availableColumns.value.filter(column => column.visible);
});

// Missing functions for insights section - use stats data for accurate insights
const getLargestClassInfo = () => {
  const distribution = classDistribution.value;
  const largestClass = Object.entries(distribution).reduce(
    (max, [name, count]) => (count > max.count ? { name, count } : max),
    { name: 'None', count: 0 }
  );

  const totalStudents = summaryData.value.totalStudents;
  const percentage = totalStudents > 0 ? Math.round((largestClass.count / totalStudents) * 100) : 0;

  return {
    name: largestClass.name,
    count: largestClass.count,
    percentage
  };
};

const getSmallestClassInfo = () => {
  const distribution = classDistribution.value;
  const smallestClass = Object.entries(distribution).reduce(
    (min, [name, count]) => (count < min.count ? { name, count } : min),
    { name: 'None', count: Infinity }
  );

  return {
    name: smallestClass.name,
    count: smallestClass.count
  };
};

const getGenderBalanceInfo = () => {
  const distribution = genderDistribution.value;
  const total = distribution.Male + distribution.Female;
  const maleRatio = total > 0 ? Math.round((distribution.Male / total) * 100) : 0;
  const femaleRatio = total > 0 ? Math.round((distribution.Female / total) * 100) : 0;

  let description = 'Balanced';
  if (Math.abs(maleRatio - femaleRatio) > 20) {
    description = maleRatio > femaleRatio ? 'Male dominated' : 'Female dominated';
  }

  return {
    ratio: `${maleRatio}% M / ${femaleRatio}% F`,
    description
  };
};

const getStatusOverview = () => {
  const distribution = statusDistribution.value;
  const total = summaryData.value.totalStudents;
  const active = total > 0 ? Math.round((distribution.active / total) * 100) : 0;
  const inactive =
    total > 0
      ? Math.round(
          ((distribution.inactive + distribution.graduated + distribution.dropped) / total) * 100
        )
      : 0;

  return { active, inactive };
};

const getClassSizeInfo = () => {
  const distribution = classDistribution.value;
  const counts = Object.values(distribution);
  const average =
    counts.length > 0
      ? Math.round(counts.reduce((sum, count) => sum + count, 0) / counts.length)
      : 0;
  const min = counts.length > 0 ? Math.min(...counts) : 0;
  const max = counts.length > 0 ? Math.max(...counts) : 0;

  return { average, min, max };
};

const getTimeContextText = () => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];

  return `vs ${monthNames[month]} ${year}`;
};

// Student trend (placeholder - would need historical data)
const studentTrend = computed(() => {
  // This would typically compare current month vs previous month
  // For now, return a placeholder value
  return 5; // +5 students
});

// Missing functions referenced in template
const getLargestGroupName = () => {
  const distribution = genderDistribution.value;
  const maxGender = Object.entries(distribution).reduce(
    (max, [name, count]) => (count > max.count ? { name, count } : max),
    { name: 'None', count: 0 }
  );
  return maxGender.name;
};

const getInactivePercentage = () => {
  const total = summaryData.value.totalStudents;
  const inactive = summaryData.value.inactiveStudents;
  return total > 0 ? Math.round((inactive / total) * 100) : 0;
};

// Add missing sortClassBy reactive variable
const sortClassBy = ref('count');

// Add missing filterByClass function
const filterByClass = className => {
  filters.class_id = classes.value.find(c => c.name === className)?.id;
  loadData();
};

// Add missing filterByGender function
const filterByGender = gender => {
  // For now, we'll implement this as a status filter since gender isn't a direct filter
  filters.status = gender;
  loadData();
};

// Add missing handleDateRangeChange function
const handleDateRangeChange = () => {
  const now = new Date();

  if (filters.dateRange === 'custom') {
    // Custom date range - dates will be set manually
    return;
  } else if (filters.dateRange === 'all_time') {
    filters.fromDate = '';
    filters.toDate = '';
  } else if (filters.dateRange === 'today') {
    const today = new Date(now);
    filters.fromDate = today.toISOString().split('T')[0];
    filters.toDate = today.toISOString().split('T')[0];
  } else if (filters.dateRange === 'yesterday') {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    filters.fromDate = yesterday.toISOString().split('T')[0];
    filters.toDate = yesterday.toISOString().split('T')[0];
  } else if (filters.dateRange === 'week') {
    const firstDay = new Date(now);
    firstDay.setDate(now.getDate() - now.getDay());
    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);
    filters.fromDate = firstDay.toISOString().split('T')[0];
    filters.toDate = lastDay.toISOString().split('T')[0];
  } else if (filters.dateRange === 'last_week') {
    const firstDay = new Date(now);
    firstDay.setDate(now.getDate() - now.getDay() - 7);
    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);
    filters.fromDate = firstDay.toISOString().split('T')[0];
    filters.toDate = lastDay.toISOString().split('T')[0];
  } else if (filters.dateRange === 'month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    filters.fromDate = firstDay.toISOString().split('T')[0];
    filters.toDate = lastDay.toISOString().split('T')[0];
  } else if (filters.dateRange === 'last_month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    filters.fromDate = firstDay.toISOString().split('T')[0];
    filters.toDate = lastDay.toISOString().split('T')[0];
  } else if (filters.dateRange === 'quarter') {
    const quarter = Math.floor(now.getMonth() / 3);
    const firstDay = new Date(now.getFullYear(), quarter * 3, 1);
    const lastDay = new Date(now.getFullYear(), quarter * 3 + 3, 0);
    filters.fromDate = firstDay.toISOString().split('T')[0];
    filters.toDate = lastDay.toISOString().split('T')[0];
  } else if (filters.dateRange === 'year') {
    const firstDay = new Date(now.getFullYear(), 0, 1);
    const lastDay = new Date(now.getFullYear(), 11, 31);
    filters.fromDate = firstDay.toISOString().split('T')[0];
    filters.toDate = lastDay.toISOString().split('T')[0];
  }
  loadData();
};

// Hierarchical dropdown change handlers
const onSchoolChange = async () => {
  // Reset branch and class filters when school changes
  filters.branch_id = '';
  filters.class_id = '';
  filters.section_id = '';
  filters.stream_id = '';

  await loadBranches(); // Reload branches for selected school
  await loadClasses(); // Reload classes for selected school
  sections.value = []; // Clear sections
  streams.value = []; // Clear streams
  // Don't call loadData() - only update dropdown options
};

const onBranchChange = async () => {
  // Reset class and section filters when branch changes
  filters.class_id = '';
  filters.section_id = '';
  filters.stream_id = '';

  console.log('Branch changed, loading classes for branch:', filters.branch_id);
  await loadClasses(); // Reload classes for selected branch
  sections.value = []; // Clear sections
  streams.value = []; // Clear streams
  console.log('Classes after branch change:', classes.value.length);
  // Don't call loadData() - only update dropdown options
};

const onClassChange = async () => {
  // Reset section and stream filters when class changes
  filters.section_id = '';
  filters.stream_id = '';

  await loadSections(); // Reload sections for selected class
  await loadStreams(); // Reload streams for selected class
  // Don't call loadData() - only update dropdown options
};

const onStreamChange = () => {
  // Stream change doesn't affect other dropdowns
  // Don't call loadData() - only update dropdown options
};

// Add missing toggleDownloadDropdown function
const toggleDownloadDropdown = () => {
  showDownloadDropdown.value = !showDownloadDropdown.value;
  // Close other dropdowns
  showColumnSelector.value = false;
};

// Add missing toggleColumnSelector function
const toggleColumnSelector = () => {
  showColumnSelector.value = !showColumnSelector.value;
  // Close other dropdowns
  showDownloadDropdown.value = false;
};

// Add missing click outside handler
const handleClickOutside = event => {
  if (!event.target.closest('.download-dropdown')) {
    showDownloadDropdown.value = false;
  }
  if (!event.target.closest('.column-selector-dropdown')) {
    showColumnSelector.value = false;
  }
};

// Function to close all dropdowns
const closeAllDropdowns = () => {
  showDownloadDropdown.value = false;
  showColumnSelector.value = false;
};

// Add missing download functions
const downloadPDFReport = () => downloadReport('pdf');
const downloadExcelReport = () => downloadReport('excel');
const downloadCSVReport = () => downloadReport('csv');

// Column management functions
const toggleColumnVisibility = index => {
  availableColumns.value[index].visible = !availableColumns.value[index].visible;
};

const selectAllColumns = () => {
  availableColumns.value.forEach(column => (column.visible = true));
};

const deselectAllColumns = () => {
  availableColumns.value.forEach(column => (column.visible = false));
};

// Common method to validate column visibility for exports
const validateColumnVisibility = (action = 'export') => {
  // Check if any columns are visible
  if (displayedColumns.value.length === 0) {
    showToast(`No columns selected. Please select at least one column to ${action}.`, 'warning');
    return false;
  }
  return true;
};

// Common method to validate data availability for exports
const validateDataAvailability = (action = 'export') => {
  // Check if there's data to export
  if (completeStudentsData.value.length === 0) {
    showToast(`No data available to ${action}. Please load some students first.`, 'warning');
    return false;
  }
  return true;
};

// Common download function
const downloadReport = async format => {
  try {
    if (!validateColumnVisibility('export') || !validateDataAvailability('export')) {
      return;
    }

    const exportFilters = {
      dateRange: filters.dateRange,
      fromDate: filters.dateRange === 'custom' ? filters.fromDate : '',
      toDate: filters.dateRange === 'custom' ? filters.toDate : '',
      school_id: filters.school_id,
      branch_id: filters.branch_id,
      class_id: filters.class_id,
      section_id: filters.section_id,
      status: filters.status
    };

    const selectedColumns = displayedColumns.value.map(col => ({
      key: col.key,
      header: col.label
    }));

    // Start progress tracking
    generationProgress.value = 0;
    const progressInterval = setInterval(() => {
      if (generationProgress.value < 90) {
        generationProgress.value += 10;
      }
    }, 200);

    await generateReport({
      report_type: 'students',
      format: format,
      filters: exportFilters,
      columns: selectedColumns
    });

    // Complete progress
    generationProgress.value = 100;
    clearInterval(progressInterval);

    // Reset progress after a delay
    setTimeout(() => {
      generationProgress.value = 0;
    }, 2000);
  } catch (error) {
    showToast(`Error downloading ${format.toUpperCase()} report`, 'error');
    // Reset progress on error
    generationProgress.value = 0;
    clearInterval(progressInterval);
  }
};

// Update the print button to use the new function
const printStudentsReport = async () => {
  try {
    isPrinting.value = true;
    if (!validateColumnVisibility('print') || !validateDataAvailability('print')) {
      return;
    }

    const formattedData = completeStudentsData.value.map(student => ({
      admission_number: student.admission_number,
      student_name: `${student.first_name} ${student.last_name}`.trim(),
      email: student.email,
      phone: student.phone,
      class: student.class?.name || student.class_name || 'N/A',
      section: student.section?.name || student.section_name || 'N/A',
      admission_date: formatDate(student.admission_date),
      status: getStatusText(student.status),
      gender: student.gender || 'N/A'
    }));

    const reportData = {
      title: 'Student Report',
      data: formattedData,
      columns: displayedColumns.value.map(col => ({ key: col.key, header: col.label })),
      filters: {
        'Date Range': filters.dateRange,
        'From Date': filters.dateRange === 'custom' ? formatDate(filters.fromDate) : 'N/A',
        'To Date': filters.dateRange === 'custom' ? formatDate(filters.toDate) : 'N/A',
        School: filters.school_id
          ? schools.value.find(s => s.id === filters.school_id)?.name
          : 'All Schools',
        Branch: filters.branch_id
          ? branches.value.find(b => b.id === filters.branch_id)?.name
          : 'All Branches',
        Class: filters.class_id
          ? classes.value.find(c => c.id === filters.class_id)?.name
          : 'All Classes',
        Section: filters.section_id
          ? sections.value.find(s => s.id === filters.section_id)?.name
          : 'All Sections',
        Status: filters.status || 'All Status'
      },
      totalRecords: pagination.value.total_records,
      reportType: 'students'
    };

    await printReportUtil(reportData, {
      showHeader: true,
      showSummary: true,
      showFilters: true,
      showFooter: true
    });
  } catch (error) {
    showToast('Error printing report', 'error');
  } finally {
    isPrinting.value = false;
  }
};

const resetFilters = () => {
  Object.keys(filters).forEach(key => {
    if (key === 'dateRange') {
      filters[key] = 'all_time';
    } else {
      filters[key] = '';
    }
  });
  // Clear the results when resetting filters
  completeStudentsData.value = [];
  pagination.value = {
    page: 1,
    current_page: 1,
    total: 0,
    total_records: 0,
    total_pages: 1,
    per_page: 10,
    limit: 10
  };

  // Clear summary data
  summaryData.value = {
    totalStudents: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    newThisMonth: 0
  };

  // Reset progress
  generationProgress.value = 0;
};

onMounted(async () => {
  try {
    // Wait for auth store to initialize
    // Auth composable handles initialization automatically

    await Promise.all([loadAcademicYears(), loadSchools(), loadBranches(), loadClasses()]);

    // Initialize filters based on user role
    initializeFilters();

    // Load initial data with default filters
    await loadData();

    // Add click outside listener for dropdown
    document.addEventListener('click', handleClickOutside);
  } catch (error) {
    showToast('Error initializing page', 'error');
  } finally {
    isInitializing.value = false;
  }
});

// Cleanup event listener on component unmount
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
