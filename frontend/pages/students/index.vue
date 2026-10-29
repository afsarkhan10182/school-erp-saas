<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {{ isTeacher ? 'View students assigned to your classes' : 'Manage student records and information' }}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          v-if="canManageStudents"
          @click="navigateTo('/students/create')"
          class="btn-primary flex items-center gap-2"
        >
          <PlusIcon class="h-4 w-4" />
          Add Student
        </button>
      </div>
    </div>

    <div v-if="stats" class="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Student totals">
      <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <p class="text-sm text-gray-500 dark:text-gray-400">Current session</p>
        <p class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.current_session_total }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">Enrolled in {{ stats.current_academic_year }}</p>
      </div>
      <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <p class="text-sm text-gray-500 dark:text-gray-400">All time</p>
        <p class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.all_time_total }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">Excludes deleted records</p>
      </div>
      <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <p class="text-sm text-gray-500 dark:text-gray-400">Unassigned this year</p>
        <p class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.unassigned_total }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">Active students not enrolled in this session</p>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="card">
        <div class="mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <svg
              class="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filter Students
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Filter students by enrollment, class, section, or search criteria, then click Apply Filters
          </p>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-7">
          <EnhancedDropdown
            v-model="selectedClass"
            :options="classOptions"
            label="Class (Optional)"
            placeholder="All Classes"
            id="class-filter"
            :loading="classesLoading"
            :disabled="isSuperAdmin ? !currentSchool?.id : !authStore.currentUser?.school_id"
            @update:modelValue="onClassChange"
          />

          <EnhancedDropdown
            v-model="selectedStream"
            :options="streamOptions"
            label="Stream (Optional)"
            placeholder="All Streams"
            id="stream-filter"
            :loading="streamsLoading"
            :disabled="!selectedClass"
            @update:modelValue="onStreamChange"
          />

          <EnhancedDropdown
            v-model="selectedSection"
            :options="sectionOptions"
            label="Section (Optional)"
            placeholder="All Sections"
            id="section-filter"
            :loading="sectionsLoading"
            :disabled="!selectedClass"
            @update:modelValue="onSectionChange"
          />

          <EnhancedDropdown
            v-model="filters.academic_year"
            :options="academicYearOptions"
            label="Academic Year"
            placeholder="All Years"
            id="academic-year"
          />

          <EnhancedDropdown
            v-model="filters.has_siblings"
            :options="siblingOptions"
            label="Siblings"
            placeholder="All Students"
            id="sibling-filter"
          />

          <EnhancedDropdown
            v-model="filters.enrollment"
            :options="enrollmentOptions"
            label="Enrollment"
            id="enrollment-filter"
          />

          <!-- Search -->
          <div class="relative">
            <label
              for="search"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              <svg
                class="w-4 h-4 inline mr-1 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Search
            </label>
            <input
              id="search"
              v-model="searchQuery"
              type="text"
              placeholder="Search students..."
              class="input-field"
            />
          </div>
        </div>

        <!-- Filter Buttons -->
        <div
          class="mt-6 flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          <button
            @click="applyFilters"
            :disabled="!canApplyFilters"
            class="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Users class="h-4 w-4" />
            Apply Filters
          </button>

          <button
            @click="resetFilters"
            class="inline-flex items-center px-4 py-3 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-all duration-200 ease-in-out"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Reset Filters
          </button>
        </div>
      </div>

      <!-- Students Table -->
      <div class="card overflow-hidden">
        <div
          class="px-4 py-4 border-b border-gray-200/80 dark:border-gray-700/80 bg-gray-50/50 dark:bg-gray-800/50 sm:px-6"
        >
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <svg
                  class="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
                Student List
              </h2>
              <p
                v-if="hasAppliedFilters"
                class="mt-2 text-sm text-gray-600 dark:text-gray-400 flex items-center"
              >
                <svg
                  class="w-4 h-4 mr-1 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Showing students for
                <span
                  v-if="isSuperAdmin && selectedSchoolName"
                  class="font-medium text-gray-900 dark:text-white ml-1"
                  >{{ selectedSchoolName }}</span
                >
                <span v-if="selectedBranchName" class="font-medium text-gray-900 dark:text-white"
                  >{{ isSuperAdmin && selectedSchoolName ? ' - ' : ''
                  }}{{ selectedBranchName }}</span
                >
                <span
                  v-if="selectedClassName && selectedClassName !== 'All Classes'"
                  class="font-medium text-gray-900 dark:text-white"
                >
                  - {{ selectedClassName }}</span
                >
                <span
                  v-if="selectedSectionName && selectedSectionName !== 'All Sections'"
                  class="font-medium text-gray-900 dark:text-white"
                >
                  - {{ selectedSectionName }}</span
                >
                <span
                  v-if="selectedStreamName && selectedStreamName !== 'All Streams'"
                  class="font-medium text-gray-900 dark:text-white"
                >
                  - {{ selectedStreamName }}</span
                >
                <span
                  v-if="filters.academic_year && filters.academic_year !== 'All Years'"
                  class="font-medium text-gray-900 dark:text-white"
                >
                  - {{ filters.academic_year }}</span
                >
                <span v-if="filters.has_siblings" class="font-medium text-gray-900 dark:text-white">
                  - {{ filters.has_siblings === 'yes' ? 'Has Siblings' : 'No Siblings' }}</span
                >
                <span v-if="filters.enrollment" class="font-medium text-gray-900 dark:text-white">
                  - {{ enrollmentLabel }}</span
                >
                <span v-if="searchQuery" class="font-medium text-gray-900 dark:text-white">
                  - Search: "{{ searchQuery }}"</span
                >
              </p>
              <p v-else class="mt-2 text-sm text-gray-600 dark:text-gray-400 flex items-center">
                <svg
                  class="w-4 h-4 mr-1 text-yellow-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                {{
                  isSuperAdmin
                    ? 'Select school and branch, then click Apply Filters to view students'
                    : isTeacher
                      ? 'Click Apply Filters to view students assigned to your classes'
                      : selectedBranch
                        ? 'Click Apply Filters to view students for the selected branch'
                        : 'Select a branch, then click Apply Filters to view students'
                }}
              </p>
            </div>
            <div v-if="students.length > 0" class="flex flex-col items-end gap-2">
              <div class="flex flex-wrap justify-end gap-2">
                <div class="inline-flex rounded-lg border border-gray-300 p-1 dark:border-gray-600" role="group" aria-label="Student view">
                  <button
                    type="button"
                    :aria-pressed="viewMode === 'list'"
                    class="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm"
                    :class="viewMode === 'list' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'"
                    @click="viewMode = 'list'"
                  >
                    <List class="h-4 w-4" /> List view
                  </button>
                  <button
                    type="button"
                    :aria-pressed="viewMode === 'grid'"
                    class="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm"
                    :class="viewMode === 'grid' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'"
                    @click="viewMode = 'grid'"
                  >
                    <LayoutGrid class="h-4 w-4" /> Grid view
                  </button>
                </div>
                <details v-if="viewMode === 'list'" class="relative">
                  <summary class="cursor-pointer list-none rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
                    Columns
                  </summary>
                  <div class="absolute right-0 z-20 mt-1 min-w-44 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    <label v-for="column in optionalStudentColumns" :key="column.key" class="flex items-center gap-2 py-1 text-sm text-gray-700 dark:text-gray-200">
                      <input v-model="visibleColumns[column.key]" type="checkbox" :aria-label="`Show ${column.label} column`" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      {{ column.label }}
                    </label>
                  </div>
                </details>
                <details v-if="canManageStudents" class="relative">
                  <summary class="cursor-pointer list-none rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
                    {{ isExporting ? `Exporting ${exportFormat.toUpperCase()}…` : 'Export' }}
                  </summary>
                  <div class="absolute right-0 z-20 mt-1 flex min-w-32 flex-col rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    <button v-for="format in exportFormats" :key="format.value" type="button" :disabled="isExporting || isLoading" class="rounded px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-200 dark:hover:bg-gray-700" @click="exportStudents(format.value)">
                      {{ format.label }}
                    </button>
                  </div>
                </details>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-500 dark:text-gray-400">Total Results</p>
                <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {{ totalItems }}
                </p>
              </div>
            </div>
          </div>
          <p v-if="exportError" role="alert" class="mt-2 text-sm text-red-600">{{ exportError }}</p>
        </div>

        <div v-if="isLoading" class="p-12 text-center">
          <div
            class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 dark:border-indigo-700 dark:border-t-indigo-400"
          ></div>
          <p class="mt-4 text-lg font-medium text-gray-900 dark:text-white">Loading students...</p>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Please wait while we fetch the data
          </p>
        </div>

        <div v-else-if="students.length === 0 && hasAppliedFilters" class="p-12 text-center">
          <div
            class="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6"
          >
            <Users class="h-12 w-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No students found</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {{
              canManageStudents
                ? 'No students match the selected criteria. Try adjusting your filters or adding new students.'
                : 'No students match the selected filters. Try adjusting your search criteria.'
            }}
          </p>
          <div class="flex justify-center space-x-4">
            <button
              @click="resetFilters"
              class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reset Filters
            </button>
            <button
              v-if="canManageStudents"
              @click="navigateTo('/students/create')"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors duration-200"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add Student
            </button>
          </div>
        </div>

        <div
          v-if="!isLoading && students.length > 0"
          class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg"
        >
          <p v-if="viewMode === 'list'" class="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 sm:hidden">
            Swipe the table horizontally to review every field and its actions.
          </p>
          <div v-if="viewMode === 'list'" class="overflow-x-auto">
            <div class="inline-block min-w-full align-middle">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead
                  class="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800"
                >
                  <tr>
                    <th
                      class="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                    >
                      <div class="flex items-center">
                        <svg
                          class="w-4 h-4 mr-2 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Student
                      </div>
                    </th>
                    <th
                      v-if="visibleColumns.admission"
                      class="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                    >
                      <div class="flex items-center">
                        <svg
                          class="w-4 h-4 mr-2 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Admission No.
                      </div>
                    </th>
                    <th
                      v-if="visibleColumns.classSection"
                      class="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                    >
                      <div class="flex items-center">
                        <svg
                          class="w-4 h-4 mr-2 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        Class & Section
                      </div>
                    </th>
                    <th
                      v-if="visibleColumns.status"
                      class="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                    >
                      <div class="flex items-center">
                        <svg
                          class="w-4 h-4 mr-2 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Status
                      </div>
                    </th>
                    <th
                      v-if="visibleColumns.parents"
                      class="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                    >
                      <div class="flex items-center">
                        <svg
                          class="w-4 h-4 mr-2 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        Parents
                      </div>
                    </th>
                    <th
                      v-if="canManageStudents && visibleColumns.totalBilled"
                      class="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300"
                    >
                      Billed (all years)
                    </th>
                    <th
                      v-if="canManageStudents && visibleColumns.totalDue"
                      class="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300"
                    >
                      Due (all years)
                    </th>
                    <th
                      class="sticky right-0 z-10 border-l border-gray-200 bg-gray-100 px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      <div class="flex items-center">
                        <svg
                          class="w-4 h-4 mr-2 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                          />
                        </svg>
                        Actions
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody
                  class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
                >
                  <tr
                    v-for="student in students"
                    :key="student.id"
                    class="group hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-12 w-12">
                          <UserAvatar
                            :image-url="student.photo"
                            :user="student"
                            size="lg"
                            :alt="student.first_name"
                            container-class="h-12 w-12"
                            image-class="h-12 w-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600"
                            fallback-class="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center ring-2 ring-indigo-100 dark:ring-indigo-900"
                          />
                        </div>
                        <div class="ml-4">
                          <div class="text-sm font-semibold text-gray-900 dark:text-white">
                            {{ getStudentFullName(student) }}
                          </div>
                          <div class="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            <svg
                              class="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            {{ student.email || 'No email' }}
                          </div>
                          <div
                            v-if="student.siblings?.length"
                            class="mt-1 text-xs text-gray-500 dark:text-gray-400"
                          >
                            {{ student.siblings.length }} sibling{{ student.siblings.length === 1 ? '' : 's' }}:
                            {{ getSiblingSummary(student) }}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td v-if="visibleColumns.admission" class="px-6 py-4 whitespace-nowrap">
                      <div
                        class="text-sm font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full inline-block"
                      >
                        {{ student.admission_number || 'N/A' }}
                      </div>
                    </td>
                    <td v-if="visibleColumns.classSection" class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900 dark:text-white">
                        <span class="font-medium">{{ student.current_class }}</span>
                        <span class="text-gray-500 dark:text-gray-400 mx-1">•</span>
                        <span class="text-gray-600 dark:text-gray-300">{{ student.section }}</span>
                      </div>
                    </td>
                    <td v-if="visibleColumns.status" class="px-6 py-4 whitespace-nowrap">
                      <span
                        :class="getStatusClass(student.status)"
                        class="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full"
                      >
                        <div
                          class="w-2 h-2 rounded-full mr-2"
                          :class="{
                            'bg-green-400': student.status === 'active',
                            'bg-red-400': student.status === 'inactive',
                            'bg-blue-400': student.status === 'graduated',
                            'bg-gray-400': student.status === 'dropped',
                            'bg-yellow-400': student.status === 'transferred'
                          }"
                        ></div>
                        {{ getStatusText(student.status) }}
                      </span>
                    </td>
                    <td v-if="visibleColumns.parents" class="px-6 py-4 whitespace-nowrap">
                      <div v-if="student.parents && student.parents.length > 0" class="text-sm">
                        <div
                          v-for="parent in student.parents.slice(0, 2)"
                          :key="parent.id"
                          class="text-gray-900 dark:text-white"
                        >
                          {{ parent.father_name || parent.mother_name || parent.guardian_name }}
                          <span
                            v-if="canManageStudents && (parent.father_phone || parent.mother_phone || parent.guardian_phone)"
                            class="block text-xs text-gray-500 dark:text-gray-400"
                          >
                            {{ parent.father_phone || parent.mother_phone || parent.guardian_phone }}
                          </span>
                        </div>
                        <div
                          v-if="student.parents.length > 2"
                          class="text-xs text-gray-500 dark:text-gray-400"
                        >
                          +{{ student.parents.length - 2 }} more
                        </div>
                      </div>
                      <span v-else class="text-gray-500 dark:text-gray-400 text-sm"
                        >No parents</span
                      >
                    </td>
                    <td
                      v-if="canManageStudents && visibleColumns.totalBilled"
                      class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700 dark:text-gray-300"
                    >
                      {{ formatFeeAmount(student.total_billed) }}
                    </td>
                    <td
                      v-if="canManageStudents && visibleColumns.totalDue"
                      class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white"
                    >
                      {{ formatFeeAmount(student.total_due) }}
                    </td>
                    <td
                      class="sticky right-0 z-[1] border-l border-gray-200 bg-white px-6 py-4 whitespace-nowrap text-sm font-medium group-hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:group-hover:bg-gray-700"
                    >
                      <div class="flex space-x-3">
                        <button
                          @click="viewStudent(student.id)"
                          class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:text-indigo-300 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 transition-colors duration-200"
                        >
                          <svg
                            class="w-3 h-3 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          View
                        </button>
                        <button
                          v-if="canManageStudents"
                          @click="editStudent(student.id)"
                          class="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
                        >
                          <svg
                            class="w-3 h-3 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-else class="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
            <article
              v-for="student in students"
              :key="student.id"
              class="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
            >
              <div class="flex items-center gap-3">
                <UserAvatar
                  :image-url="student.photo"
                  :user="student"
                  size="lg"
                  :alt="getStudentFullName(student)"
                  container-class="h-12 w-12"
                  image-class="h-12 w-12 rounded-full object-cover"
                  fallback-class="h-12 w-12 rounded-full bg-indigo-600 text-white flex items-center justify-center"
                />
                <div class="min-w-0">
                  <h3 class="truncate font-semibold text-gray-900 dark:text-white">
                    {{ getStudentFullName(student) }}
                  </h3>
                  <p class="truncate text-sm text-gray-500 dark:text-gray-400">
                    {{ student.admission_number || 'No admission number' }}
                    <span v-if="student.roll_number"> · Roll {{ student.roll_number }}</span>
                  </p>
                </div>
              </div>
              <dl class="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt class="text-gray-500 dark:text-gray-400">Class & section</dt>
                  <dd class="font-medium text-gray-900 dark:text-white">
                    {{ student.current_class || 'Unassigned' }}{{ student.section ? ` · ${student.section}` : '' }}
                  </dd>
                </div>
                <div>
                  <dt class="text-gray-500 dark:text-gray-400">Status</dt>
                  <dd>
                    <span :class="getStatusClass(student.status)" class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold">
                      {{ getStatusText(student.status) }}
                    </span>
                  </dd>
                </div>
                <div class="col-span-2">
                  <dt class="text-gray-500 dark:text-gray-400">Parent / guardian</dt>
                  <dd class="text-gray-900 dark:text-white">
                    {{ student.parents?.map(parent => parent.father_name || parent.mother_name || parent.guardian_name).filter(Boolean).slice(0, 2).join(', ') || 'No parent linked' }}
                    <span
                      v-if="canManageStudents && student.parents?.some(parent => parent.father_phone || parent.mother_phone || parent.guardian_phone)"
                      class="mt-1 block text-xs text-gray-500 dark:text-gray-400"
                    >
                      {{ student.parents.map(parent => parent.father_phone || parent.mother_phone || parent.guardian_phone).filter(Boolean).slice(0, 2).join(', ') }}
                    </span>
                  </dd>
                </div>
                <div class="col-span-2">
                  <dt class="text-gray-500 dark:text-gray-400">Siblings</dt>
                  <dd class="text-gray-900 dark:text-white">
                    {{ student.siblings?.length ? `${student.siblings.length}: ${getSiblingSummary(student)}` : '—' }}
                  </dd>
                </div>
                <div v-if="canManageStudents" class="col-span-2 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 dark:border-gray-700">
                  <div>
                    <dt class="text-gray-500 dark:text-gray-400">Billed (all years)</dt>
                    <dd class="font-medium text-gray-900 dark:text-white">{{ formatFeeAmount(student.total_billed) }}</dd>
                  </div>
                  <div>
                    <dt class="text-gray-500 dark:text-gray-400">Due (all years)</dt>
                    <dd class="font-medium text-gray-900 dark:text-white">{{ formatFeeAmount(student.total_due) }}</dd>
                  </div>
                </div>
              </dl>
              <div class="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
                <button
                  type="button"
                  class="rounded-md px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-900/30"
                  @click="viewStudent(student.id)"
                >
                  View
                </button>
                <button
                  v-if="canManageStudents"
                  type="button"
                  class="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                  @click="editStudent(student.id)"
                >
                  Edit
                </button>
              </div>
            </article>
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span class="ml-3 text-gray-600 dark:text-gray-400">Loading students...</span>
          </div>

          <!-- No Results State -->
          <div
            v-else-if="!isLoading && students.length === 0 && hasAppliedFilters"
            class="text-center py-12"
          >
            <div class="text-gray-500 dark:text-gray-400">
              <svg
                class="mx-auto h-12 w-12 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No students found
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Try adjusting your filters or search criteria.
              </p>
              <button
                @click="resetFilters"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Reset Filters
              </button>
            </div>
          </div>

          <!-- Initial State -->
          <div
            v-else-if="!isLoading && students.length === 0 && !hasAppliedFilters"
            class="text-center py-12"
          >
            <div class="text-gray-500 dark:text-gray-400">
              <svg
                class="mx-auto h-12 w-12 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Select filters to view students
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {{
                  isSuperAdmin
                    ? 'Choose a school and branch above, then click "Apply Filters" to view students.'
                    : isTeacher
                      ? 'Click "Apply Filters" to view students assigned to your classes.'
                      : 'Choose a branch above, then click "Apply Filters" to view students.'
                }}
              </p>
              <button
                v-if="canApplyFilters"
                @click="applyFilters"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Users class="-ml-1 mr-2 h-5 w-5" />
                Apply Filters & View Students
              </button>
              <div v-else class="text-xs text-gray-400 mt-2">
                {{
                  isSuperAdmin
                    ? 'Please select both school and branch to continue'
                    : 'Please select a branch to continue'
                }}
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <Pagination
            v-if="totalItems > 0"
            :pagination="{
              page: currentPage,
              limit: pageSize,
              total: totalItems
            }"
            item-label="students"
            @page-changed="goToPage"
            @page-size-changed="onPageSizeChange"
          />
        </div>
      </div>
    </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { Students } from '~/api';
import { Export } from '~/api/shared/export';
import { usePrintReport } from '~/composables/usePrintReport';
import { useAuthStore } from '~/stores/auth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useAcademics } from '~/composables/useAcademics';
import { useStudents } from '~/composables/useStudents';
import Pagination from '~/components/ui/Pagination.vue';
import UserAvatar from '~/components/shared/UserAvatar.vue';
import { PlusIcon, Users, CheckCircle, UserPlus, GraduationCap, LayoutGrid, List } from 'lucide-vue-next';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';

const authStore = useAuthStore();
const {
  selectedBranchId: globalBranchId,
  currentBranch,
  currentSchool
} = useGlobalBranch();
const {
  academicYears,
  classes,
  streams,
  sections,
  loading: academicsLoading,
  fetchAcademicYears,
  fetchClasses,
  fetchStreams,
  fetchSections
} = useAcademics();
const { students, loading: studentsLoading, loadStudents } = useStudents();

// Separate loading states for better UX
const classesLoading = ref(false);
const sectionsLoading = ref(false);
const streamsLoading = ref(false);
const isLoading = ref(false);
const searchQuery = ref('');
const stats = ref(null);
let statsRequestId = 0;
const hasAppliedFilters = ref(false);
const isExporting = ref(false);
const exportError = ref('');
const { printReport, openPrintWindow } = usePrintReport();
const viewMode = ref('list');
const optionalStudentColumns = [
  { key: 'admission', label: 'Admission No.' },
  { key: 'classSection', label: 'Class & section' },
  { key: 'status', label: 'Status' },
  { key: 'parents', label: 'Parents' },
  { key: 'totalBilled', label: 'Billed (all years)' },
  { key: 'totalDue', label: 'Due (all years)' }
];
const visibleColumns = reactive({
  admission: true,
  classSection: true,
  status: true,
  parents: true,
  totalBilled: true,
  totalDue: true
});
const exportFormats = [
  { value: 'print', label: 'Print' },
  { value: 'csv', label: 'CSV' },
  { value: 'excel', label: 'Excel' },
  { value: 'pdf', label: 'PDF' }
];
const exportFormat = ref('');
const exportColumns = computed(() => [
  { key: 'student_name', header: 'Student Name' },
  ...(visibleColumns.admission ? [{ key: 'admission_number', header: 'Admission No.' }] : []),
  ...(visibleColumns.classSection
    ? [
        { key: 'current_class', header: 'Class' },
        { key: 'section', header: 'Section' }
      ]
    : []),
  ...(visibleColumns.status ? [{ key: 'status', header: 'Status' }] : []),
  ...(visibleColumns.totalBilled ? [{ key: 'total_billed', header: 'Billed (All Years)' }] : []),
  ...(visibleColumns.totalDue ? [{ key: 'total_due', header: 'Due (All Years)' }] : []),
  ...(visibleColumns.parents
    ? [
        { key: 'guardian_name', header: 'Parent / Guardian' },
        { key: 'guardian_phone', header: 'Guardian Phone' },
        { key: 'guardian_email', header: 'Guardian Email' }
      ]
    : [])
]);
const escapePrintText = value => {
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value ?? '').replace(/[&<>"']/g, character => entities[character]);
};

// Pagination state
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);

// Role-based state
const isSuperAdmin = computed(() => authStore.currentUser?.role === 'super_admin');
const isAdmin = computed(() => authStore.currentUser?.role === 'admin');
const isBranchAdmin = computed(() => authStore.currentUser?.role === 'branch_admin');
const isTeacher = computed(() => authStore.currentUser?.role === 'teacher');
const canManageStudents = computed(
  () => isSuperAdmin.value || isAdmin.value || isBranchAdmin.value
);

// Selection state
const selectedBranch = ref(globalBranchId.value || '');
const selectedClass = ref('');
const selectedSection = ref('');
const selectedStream = ref('');

const canApplyFilters = computed(() => {
  return true;
});

const selectedSchoolName = computed(() => {
  return currentSchool.value?.name || '';
});

const selectedBranchName = computed(() => {
  const branch = currentBranch.value;
  return (
    branch?.name ||
    (!globalBranchId.value && (isAdmin.value || isSuperAdmin.value) ? 'All Branches' : '')
  );
});

const selectedClassName = computed(() => {
  const cls = classes.value.find(c => c.id === selectedClass.value);
  return cls?.name || '';
});

const selectedSectionName = computed(() => {
  const section = sections.value.find(s => s.id === selectedSection.value);
  return section?.name || '';
});

const selectedStreamName = computed(() => {
  const stream = streams.value.find(s => s.id === selectedStream.value);
  return stream?.name || '';
});

// Computed properties for dropdown options with "Select All" options
const classOptions = computed(() => {
  const options = classes.value.map(cls => ({
    value: cls.id,
    label: cls.name
  }));
  return options;
});

const sectionOptions = computed(() => {
  const options = sections.value.map(section => ({
    value: section.id,
    label: section.name
  }));
  return options;
});

const streamOptions = computed(() => {
  const options = streams.value.map(stream => ({
    value: stream.id,
    label: stream.name
  }));
  return options;
});

const academicYearOptions = computed(() => {
  const options = academicYears.value.map(year => ({
    value: year.name,
    label: year.name
  }));
  return options;
});

const siblingOptions = [
  { value: 'yes', label: 'Has Siblings' },
  { value: 'no', label: 'No Siblings' }
];

const enrollmentOptions = [
  { value: 'currently_studying', label: 'Currently Studying' },
  { value: 'full_register', label: 'Full Register' },
  { value: 'unassigned', label: 'Unassigned This Year' }
];

const filters = reactive({
  academic_year: '',
  has_siblings: '',
  enrollment: 'currently_studying',
  class: '',
  section: ''
});
const enrollmentLabel = computed(
  () => enrollmentOptions.find(option => option.value === filters.enrollment)?.label || ''
);

// Methods
watch(globalBranchId, async (newBranchId) => {
  selectedBranch.value = newBranchId || '';
  selectedClass.value = '';
  selectedSection.value = '';
  selectedStream.value = '';
  filters.academic_year = '';
  hasAppliedFilters.value = false;
  students.value = [];

  if (newBranchId) {
    classesLoading.value = true;
    try {
      await Promise.all([
        fetchClasses({ branchId: newBranchId }),
        fetchAcademicYears({ branchId: newBranchId })
      ]);
    } catch (error) {
      console.error('Error loading data for branch:', error);
    } finally {
      classesLoading.value = false;
    }
  }
}, { immediate: true });

const onClassChange = async () => {
  selectedSection.value = '';
  selectedStream.value = '';
  sections.value = [];
  streams.value = [];

  if (selectedClass.value) {
    sectionsLoading.value = true;
    streamsLoading.value = true;
    try {
      const schoolId = isSuperAdmin.value ? currentSchool.value?.id : authStore.currentUser?.school_id;
      await Promise.all([
        fetchSections({ schoolId, branchId: globalBranchId.value, classId: selectedClass.value }),
        fetchStreams({ schoolId, branchId: globalBranchId.value, classId: selectedClass.value })
      ]);
    } finally {
      sectionsLoading.value = false;
      streamsLoading.value = false;
    }
  }
};

const onSectionChange = () => {
  // No auto-fetch, just update the selection
};

const onStreamChange = () => {
  // No auto-fetch, just update the selection
};

const applyFilters = async () => {
  if (canApplyFilters.value) {
    await fetchStudents();
  }
};

const resetFilters = async () => {
  selectedBranch.value = globalBranchId.value || (isBranchAdmin.value ? authStore.currentUser?.branch_id : '') || '';
  selectedClass.value = '';
  selectedSection.value = '';
  selectedStream.value = '';
  filters.academic_year = '';
  filters.has_siblings = '';
  filters.enrollment = 'currently_studying';
  searchQuery.value = '';
  currentPage.value = 1;
  pageSize.value = 10; // Reset to default page size
  await fetchStudents(1);
};

const fetchStudents = async (page = 1) => {
  if (isSuperAdmin.value && !currentSchool.value?.id) {
    students.value = [];
    totalItems.value = 0;
    hasAppliedFilters.value = false;
    stats.value = null;
    statsRequestId++;
    return;
  }

  const currentStatsRequestId = ++statsRequestId;
  const statsParams = {
    ...(isSuperAdmin.value && { school_id: currentSchool.value.id }),
    ...(selectedBranch.value && { branch_id: selectedBranch.value }),
    ...(filters.academic_year && { academic_year: filters.academic_year })
  };
  const statsRequest = Students.getStats(statsParams)
    .then(response => {
      if (currentStatsRequestId === statsRequestId) stats.value = response.data || null;
    })
    .catch(() => {
      if (currentStatsRequestId === statsRequestId) stats.value = null;
    });

  isLoading.value = true;
  hasAppliedFilters.value = true;

  try {
    const params = {
      page: page,
      limit: pageSize.value
    };

    // Add search if present
    if (searchQuery.value) {
      params.search = searchQuery.value;
    }

    // Add academic year filter
    if (filters.academic_year) {
      params.academic_year = filters.academic_year;
    }
    if (filters.has_siblings) params.has_siblings = filters.has_siblings;
    if (filters.enrollment) params.enrollment = filters.enrollment;

    // Add school filter for Super Admin
    if (isSuperAdmin.value) {
      params.school_id = currentSchool.value.id;
    }

    // Add branch filter
    if (selectedBranch.value) {
      params.branch_id = selectedBranch.value;
    }

    // Add class filter (only if not "All Classes")
    if (selectedClass.value) {
      params.class_id = selectedClass.value;
    }

    // Add section filter (only if not "All Sections")
    if (selectedSection.value) {
      params.section_id = selectedSection.value;
    }

    // Add stream filter (only if not "All Streams")
    if (selectedStream.value) {
      params.stream_id = selectedStream.value;
    }

    const result = await loadStudents(params);

    if (result.data && result.pagination) {
      // Handle paginated response from backend
      students.value = result.data || [];
      currentPage.value = result.pagination.current_page || page;
      pageSize.value = result.pagination.limit || pageSize.value;
      totalItems.value = result.pagination.total_count || 0;

      // Reset to page 1 if no data and we're not on page 1
      if (students.value.length === 0 && currentPage.value > 1) {
        currentPage.value = 1;
      }
    } else {
      students.value = [];
      totalItems.value = 0;
      currentPage.value = 1;
    }
  } catch (error) {
    students.value = [];
    totalItems.value = 0;
    currentPage.value = 1;
  } finally {
    await statsRequest;
    isLoading.value = false;
  }
};

const viewStudent = id => {
  navigateTo(`/students/${id}`);
};

const editStudent = id => {
  navigateTo(`/students/${id}/edit`);
};

const goToPage = page => {
  if (page >= 1 && page !== currentPage.value) {
    currentPage.value = page;
    fetchStudents(page);
  }
};

const onPageSizeChange = async newPageSize => {
  pageSize.value = newPageSize;
  if (import.meta.client) {
    localStorage.setItem('studentsPageSize', pageSize.value.toString());
  }

  currentPage.value = 1;
  await fetchStudents(1);
};

const getStatusClass = status => {
  const classes = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    inactive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    graduated: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    dropped: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    transferred: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  };
  return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
};

const getStatusText = status => {
  const texts = {
    active: 'Active',
    inactive: 'Inactive',
    graduated: 'Graduated',
    dropped: 'Dropped',
    transferred: 'Transferred'
  };
  return texts[status] || status;
};

const getStudentFullName = student => {
  const firstName = student.first_name || '';
  const lastName = student.last_name || '';

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  } else if (firstName) {
    return firstName;
  } else if (lastName) {
    return lastName;
  } else {
    return 'Unknown Student';
  }
};

const getSiblingSummary = student =>
  (student.siblings || [])
    .map(sibling => {
      const name = [sibling.first_name, sibling.last_name].filter(Boolean).join(' ');
      return sibling.current_class ? `${name} (${sibling.current_class})` : name;
    })
    .filter(Boolean)
    .join(', ');

const formatFeeAmount = amount => {
  const value = Number(amount) || 0;
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currentSchool.value?.currency || 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch {
    return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};

const onBranchChange = async () => {
  selectedClass.value = '';
  selectedSection.value = '';
  selectedStream.value = '';
  sections.value = [];
  streams.value = [];
  const schoolId = isSuperAdmin.value ? currentSchool.value?.id : authStore.currentUser?.school_id;
  await Promise.all([
    fetchClasses({ schoolId, branchId: selectedBranch.value || undefined }),
    fetchAcademicYears(schoolId)
  ]);
};

const exportStudents = async format => {
  const printWindow = format === 'print' ? openPrintWindow() : null;
  if (format === 'print' && !printWindow) {
    exportError.value = 'Please allow popups to print the student list';
    return;
  }

  isExporting.value = true;
  exportFormat.value = format;
  exportError.value = '';
  try {
    const params = {
      report_type: 'students',
      format,
      columns: JSON.stringify(exportColumns.value),
      ...(selectedBranch.value && { branch_id: selectedBranch.value }),
      ...(selectedClass.value && { class_id: selectedClass.value }),
      ...(selectedSection.value && { section_id: selectedSection.value }),
      ...(selectedStream.value && { stream_id: selectedStream.value }),
      ...(filters.academic_year && { academic_year: filters.academic_year }),
      ...(filters.has_siblings && { has_siblings: filters.has_siblings }),
      ...(filters.enrollment && { enrollment: filters.enrollment }),
      ...(searchQuery.value && { search: searchQuery.value })
    };
    const response = await Export.exportData(params);
    if (format === 'print') {
      const payload = JSON.parse(await response.data.text());
      const printData = payload?.data?.data;
      if (!Array.isArray(printData?.data) || printData.data.length === 0) {
        printWindow?.close();
        exportError.value = 'No students match the selected filters';
        return;
      }
      await printReport(
        {
          title: 'Student List',
          data: printData.data.map(student =>
            Object.fromEntries(
              exportColumns.value.map(({ key }) => [
                key,
                typeof student[key] === 'string' ? escapePrintText(student[key]) : student[key]
              ])
            )
          ),
          columns: exportColumns.value,
          filters: {},
          reportType: 'students'
        },
        { showFilters: false, autoPrint: true, printWindow }
      );
      return;
    }
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `students-${new Date().toISOString().slice(0, 10)}.${format === 'excel' ? 'xlsx' : format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    printWindow?.close();
    exportError.value = error?.message || 'Failed to export students';
  } finally {
    isExporting.value = false;
    exportFormat.value = '';
  }
};

watch(currentSchool, school => {
  students.value = [];
  totalItems.value = 0;
  hasAppliedFilters.value = false;
  if (isSuperAdmin.value && school?.id) {
    onBranchChange().then(() => fetchStudents(1));
  }
});

// Initialize data
onMounted(async () => {
  if (import.meta.client) {
    if (window.matchMedia('(max-width: 639px)').matches) viewMode.value = 'grid';
    const savedPageSize = localStorage.getItem('studentsPageSize');
    const parsedPageSize = Number(savedPageSize);
    if ([10, 25, 50, 100].includes(parsedPageSize)) {
      pageSize.value = parsedPageSize;
    }
  }

  if (isBranchAdmin.value) {
    selectedBranch.value = authStore.currentUser?.branch_id;
  }

  if (isAdmin.value || isSuperAdmin.value) {
    await onBranchChange();
  } else {
    await fetchAcademicYears(authStore.currentUser?.school_id);
  }

  // Load classes and sections for branch admin users
  if (isBranchAdmin.value && selectedBranch.value) {
    await fetchClasses({
      schoolId: authStore.currentUser?.school_id,
      branchId: selectedBranch.value
    });
  }

  if (isBranchAdmin.value) {
    await fetchStudents(1);
  } else if (isAdmin.value) {
    await fetchStudents(1);
  } else if (isSuperAdmin.value) {
    await fetchStudents(1);
  }
});

// Watch for global branch changes from topbar
watch(globalBranchId, newBranch => {
  selectedBranch.value = newBranch || '';
  onBranchChange();
  fetchStudents(1);
});

// Watch for local branch changes
watch(selectedBranch, (newBranch, oldBranch) => {
  if (newBranch !== oldBranch && newBranch) {
    onBranchChange();
  }
});

// Watch search query for auto-refresh only when filters are applied
// VueUse debounced search function
const debouncedSearch = useDebounceFn(() => {
  if (hasAppliedFilters.value) {
    currentPage.value = 1;
    fetchStudents(1);
  }
}, 300);

watch(searchQuery, debouncedSearch);
</script>
