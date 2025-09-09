<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Scroll Progress Bar -->
    <div class="fixed top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 z-50">
      <div
        class="h-full bg-indigo-600 transition-all duration-150 ease-out"
        :style="{ width: `${scrollProgress}%` }"
      ></div>
    </div>

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Enhanced Header with Breadcrumb -->
      <div class="mb-8">
        <!-- Breadcrumb -->
        <nav class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <span>Dashboard</span>
          <ChevronRight class="h-4 w-4" />
          <span class="text-gray-900 dark:text-white font-medium">Settings</span>
        </nav>

        <!-- Main Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1
              class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center"
            >
              <Settings class="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3 text-indigo-600" />
              Settings
            </h1>
            <p class="mt-1 sm:mt-2 text-sm text-gray-700 dark:text-gray-300">
              Manage your school configuration and system preferences
            </p>
          </div>

          <!-- Quick Stats -->
          <div class="flex items-center space-x-4 sm:space-x-6">
            <div class="text-center">
              <div class="text-lg sm:text-2xl font-bold text-indigo-600">
                {{ settingsTabs.length }}
              </div>
              <div class="text-xs text-gray-500">Sections</div>
            </div>
            <div class="text-center">
              <div class="text-lg sm:text-2xl font-bold text-green-600">
                {{ completedSections }}
              </div>
              <div class="text-xs text-gray-500">Configured</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Clean Tab Navigation -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <!-- Tab Header -->
        <div class="border-b border-gray-200 dark:border-gray-700">
          <nav
            class="flex space-x-1 sm:space-x-4 px-2 sm:px-6 overflow-x-auto scrollbar-hide"
            aria-label="Settings tabs"
          >
            <button
              v-for="tab in settingsTabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :disabled="loadingStates[tab.id]"
              :class="[
                'group relative inline-flex items-center py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300',
                loadingStates[tab.id] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              ]"
            >
              <component
                :is="tab.icon"
                :class="[
                  'mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 transition-colors duration-200',
                  activeTab === tab.id
                    ? 'text-indigo-500 dark:text-indigo-400'
                    : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400'
                ]"
              />
              <span class="hidden sm:inline">{{ tab.name }}</span>

              <!-- Status indicators -->
              <span
                v-if="loadingStates[tab.id]"
                class="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600"
              ></span>
              <CheckCircle
                v-else-if="getTabProgress(tab.id) === 100"
                class="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 text-green-500"
              />
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="p-4 sm:p-6">
          <!-- Settings Content with transition -->
          <transition name="tab-fade" mode="out-in">
            <div key="activeTab" class="space-y-4 sm:space-y-6">
              <!-- School Information Tab -->
              <div v-if="activeTab === 'school'" class="space-y-6">
                <!-- Loading State -->
                <div v-if="loadingStates.school" class="flex justify-center items-center py-12">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <span class="ml-3 text-gray-600 dark:text-gray-400"
                    >Loading school settings...</span
                  >
                </div>

                <!-- Content -->
                <div v-else class="space-y-6">
                  <div class="space-y-6">
                    <!-- School Information -->
                    <div
                      class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                    >
                      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        School Information
                      </h3>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                            >School Name *</label
                          >
                          <input
                            v-model="schoolInfo.name"
                            type="text"
                            required
                            class="input-field"
                            placeholder="Enter school name"
                          />
                        </div>
                        <div>
                          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                            >School Code *</label
                          >
                          <input
                            v-model="schoolInfo.code"
                            type="text"
                            required
                            class="input-field"
                            placeholder="Enter school code"
                          />
                        </div>
                        <div>
                          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                            >School Type</label
                          >
                          <select v-model="schoolInfo.type" class="input-field">
                            <option value="">Select school type</option>
                            <option value="primary">Primary School</option>
                            <option value="secondary">Secondary School</option>
                            <option value="high_school">High School</option>
                            <option value="college">College</option>
                            <option value="university">University</option>
                            <option value="international">International School</option>
                          </select>
                        </div>
                        <div>
                          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                            >Establishment Year</label
                          >
                          <input
                            v-model="schoolInfo.establishmentYear"
                            type="number"
                            class="input-field"
                            placeholder="e.g., 1995"
                            min="1900"
                            :max="new Date().getFullYear()"
                          />
                        </div>
                        <div>
                          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                            >Principal Name</label
                          >
                          <input
                            v-model="schoolInfo.principalName"
                            type="text"
                            class="input-field"
                            placeholder="Enter principal name"
                          />
                        </div>
                        <div>
                          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                            >Principal Email</label
                          >
                          <input
                            v-model="schoolInfo.principalEmail"
                            type="email"
                            class="input-field"
                            placeholder="principal@school.com"
                          />
                        </div>
                      </div>
                    </div>

                    <!-- Contact Information -->
                    <div
                      class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                    >
                      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Contact Information
                      </h3>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                            >Phone Number</label
                          >
                          <input
                            v-model="contactInfo.phone"
                            type="text"
                            class="input-field"
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                        <div>
                          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                            >Email Address</label
                          >
                          <input
                            v-model="contactInfo.email"
                            type="email"
                            class="input-field"
                            placeholder="info@school.com"
                          />
                        </div>
                        <div>
                          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                            >Website</label
                          >
                          <input
                            v-model="contactInfo.website"
                            type="url"
                            class="input-field"
                            placeholder="https://www.school.com"
                          />
                        </div>
                        <div>
                          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                            >Address</label
                          >
                          <input
                            v-model="contactInfo.address"
                            type="text"
                            class="input-field"
                            placeholder="123 School Street, City, State"
                          />
                        </div>
                      </div>
                    </div>

                    <!-- Operational Settings -->
                    <div
                      class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                    >
                      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Operational Settings
                      </h3>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                            >Default Currency</label
                          >
                          <select v-model="operationalSettings.defaultCurrency" class="input-field">
                            <option value="USD">US Dollar ($)</option>
                            <option value="EUR">Euro (€)</option>
                            <option value="GBP">British Pound (£)</option>
                            <option value="INR">Indian Rupee (₹)</option>
                          </select>
                        </div>
                        <div>
                          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                            >Time Zone</label
                          >
                          <select v-model="operationalSettings.timezone" class="input-field">
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">Eastern Time</option>
                            <option value="America/Chicago">Central Time</option>
                            <option value="America/Los_Angeles">Pacific Time</option>
                            <option value="Europe/London">London</option>
                            <option value="Asia/Dubai">Dubai</option>
                            <option value="Asia/Kolkata">Mumbai</option>
                          </select>
                        </div>
                        <div>
                          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                            >Date Format</label
                          >
                          <select v-model="operationalSettings.dateFormat" class="input-field">
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <!-- Save Button -->
                    <div class="flex justify-end">
                      <button @click="saveSchoolSettings" class="btn-primary" :disabled="isSaving">
                        {{ isSaving ? 'Saving...' : 'Save Settings' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Academic Settings Tab -->
              <div v-if="activeTab === 'academic'" class="space-y-6">
                <!-- Loading State -->
                <div v-if="loadingStates.academic" class="flex justify-center items-center py-12">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <span class="ml-3 text-gray-600 dark:text-gray-400"
                    >Loading academic settings...</span
                  >
                </div>

                <!-- Content -->
                <div v-else class="space-y-6">
                  <div class="space-y-6">
                    <!-- Academic Year -->
                    <div
                      class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                    >
                      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Academic Year
                      </h3>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                            >Academic Year Name</label
                          >
                          <input
                            v-model="academicYear.name"
                            type="text"
                            class="input-field"
                            placeholder="e.g., 2024-2025"
                          />
                        </div>
                        <div>
                          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                            >Status</label
                          >
                          <select v-model="academicYear.status" class="input-field">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="upcoming">Upcoming</option>
                          </select>
                        </div>
                        <div>
                          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                            >Start Date</label
                          >
                          <input v-model="academicYear.startDate" type="date" class="input-field" />
                        </div>
                        <div>
                          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                            >End Date</label
                          >
                          <input v-model="academicYear.endDate" type="date" class="input-field" />
                        </div>
                      </div>
                    </div>

                    <!-- Academic Year Configuration -->
                    <div
                      class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                    >
                      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Academic Year Configuration
                      </h3>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                            >Academic Year Starting Month</label
                          >
                          <select v-model="academicSettings.startingMonth" class="input-field">
                            <option value="1">January</option>
                            <option value="2">February</option>
                            <option value="3">March</option>
                            <option value="4">April</option>
                            <option value="5">May</option>
                            <option value="6">June (Default)</option>
                            <option value="7">July</option>
                            <option value="8">August</option>
                            <option value="9">September</option>
                            <option value="10">October</option>
                            <option value="11">November</option>
                            <option value="12">December</option>
                          </select>
                          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            This determines when the academic year starts and how payment months are
                            calculated
                          </p>
                        </div>
                        <div>
                          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                            >Academic Year Type</label
                          >
                          <select v-model="academicSettings.academicYearStart" class="input-field">
                            <option value="academic">Academic Year (Custom starting month)</option>
                            <option value="calendar">Calendar Year (January-December)</option>
                          </select>
                          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            How academic years are calculated and displayed
                          </p>
                        </div>
                      </div>
                    </div>

                    <!-- Term Settings -->
                    <div
                      class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                    >
                      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Term Configuration
                      </h3>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                            >Number of Terms</label
                          >
                          <input
                            v-model="termSettings.numberOfTerms"
                            type="number"
                            class="input-field"
                            min="1"
                            max="4"
                          />
                        </div>
                        <div>
                          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                            >Term Duration (weeks)</label
                          >
                          <input
                            v-model="termSettings.termDuration"
                            type="number"
                            class="input-field"
                            min="8"
                            max="20"
                          />
                        </div>
                      </div>
                    </div>

                    <!-- Grading System -->
                    <div
                      class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                    >
                      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Grading System
                      </h3>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                            >Grading Scale</label
                          >
                          <select v-model="gradingSystem.scale" class="input-field">
                            <option value="percentage">Percentage (0-100)</option>
                            <option value="letter">Letter Grades (A-F)</option>
                            <option value="gpa">GPA (0-4.0)</option>
                          </select>
                        </div>
                        <div>
                          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                            >Passing Percentage</label
                          >
                          <input
                            v-model="gradingSystem.passingPercentage"
                            type="number"
                            class="input-field"
                            min="0"
                            max="100"
                          />
                        </div>
                      </div>
                    </div>

                    <!-- Attendance Settings -->
                    <div
                      class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                    >
                      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Attendance Settings
                      </h3>

                      <!-- Basic Settings -->
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                            >Minimum Attendance %</label
                          >
                          <input
                            v-model="attendanceSettings.minimumPercentage"
                            type="number"
                            class="input-field"
                            min="0"
                            max="100"
                          />
                        </div>
                        <div>
                          <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                            >Cut-off Time</label
                          >
                          <input
                            v-model="attendanceSettings.timeSettings.cutoffTime"
                            type="time"
                            class="input-field"
                          />
                          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            When attendance must be submitted
                          </p>
                        </div>
                      </div>

                      <!-- Simple Rules -->
                      <div class="border-t border-gray-200 dark:border-gray-600 pt-4">
                        <h4 class="text-md font-medium text-gray-900 dark:text-white mb-3">
                          Rules
                        </h4>
                        <div class="space-y-4">
                          <div class="flex items-center">
                            <input
                              v-model="attendanceSettings.validationRules.enforceCutoffTime"
                              type="checkbox"
                              class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                              >Enforce cut-off time</label
                            >
                          </div>
                          <div class="flex items-center">
                            <input
                              v-model="attendanceSettings.validationRules.enforceWorkingDays"
                              type="checkbox"
                              class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                              >Enforce working days</label
                            >
                          </div>
                        </div>
                      </div>

                      <!-- Working Days (only show if enforce working days is checked) -->
                      <div
                        v-if="attendanceSettings.validationRules.enforceWorkingDays"
                        class="border-t border-gray-200 dark:border-gray-600 pt-4"
                      >
                        <h4 class="text-md font-medium text-gray-900 dark:text-white mb-3">
                          Working Days
                        </h4>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
                          Select which days attendance can be marked
                        </p>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div class="flex items-center">
                            <input
                              v-model="attendanceSettings.workingDays.monday"
                              type="checkbox"
                              class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                              >Monday</label
                            >
                          </div>
                          <div class="flex items-center">
                            <input
                              v-model="attendanceSettings.workingDays.tuesday"
                              type="checkbox"
                              class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                              >Tuesday</label
                            >
                          </div>
                          <div class="flex items-center">
                            <input
                              v-model="attendanceSettings.workingDays.wednesday"
                              type="checkbox"
                              class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                              >Wednesday</label
                            >
                          </div>
                          <div class="flex items-center">
                            <input
                              v-model="attendanceSettings.workingDays.thursday"
                              type="checkbox"
                              class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                              >Thursday</label
                            >
                          </div>
                          <div class="flex items-center">
                            <input
                              v-model="attendanceSettings.workingDays.friday"
                              type="checkbox"
                              class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                              >Friday</label
                            >
                          </div>
                          <div class="flex items-center">
                            <input
                              v-model="attendanceSettings.workingDays.saturday"
                              type="checkbox"
                              class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                              >Saturday</label
                            >
                          </div>
                          <div class="flex items-center">
                            <input
                              v-model="attendanceSettings.workingDays.sunday"
                              type="checkbox"
                              class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                              >Sunday</label
                            >
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Save Button -->
                    <div class="flex justify-end">
                      <button
                        @click="saveAcademicSettings"
                        class="btn-primary"
                        :disabled="isSavingAcademic"
                      >
                        {{ isSavingAcademic ? 'Saving...' : 'Save Settings' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Fee Configuration Tab -->
              <div v-if="activeTab === 'fees'" class="space-y-6">
                <!-- Loading State -->
                <div v-if="loadingStates.fees" class="flex justify-center items-center py-12">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <span class="ml-3 text-gray-600 dark:text-gray-400"
                    >Loading fee configuration...</span
                  >
                </div>

                <!-- Content -->
                <div v-else class="space-y-6">
                  <!-- General Fee Settings -->
                  <div
                    class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      General Fee Settings
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                          >Currency Symbol</label
                        >
                        <input
                          v-model="feeSettings.currencySymbol"
                          type="text"
                          class="input-field"
                          placeholder="₹"
                          maxlength="5"
                        />
                        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Currency is set in School Information tab
                        </p>
                      </div>
                      <div>
                        <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                          >Default Payment Due Days</label
                        >
                        <input
                          v-model="feeSettings.defaultPaymentDueDays"
                          type="number"
                          class="input-field"
                          placeholder="15"
                          min="1"
                          max="90"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Fee Structure Defaults -->
                  <div
                    class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Fee Structure Defaults
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                          >Default Payment Model</label
                        >
                        <select v-model="feeSettings.defaultPaymentModel" class="input-field">
                          <option value="class_based">Class-based (Default)</option>
                          <option value="monthly">Monthly</option>
                          <option value="term_based">Term-based</option>
                        </select>
                        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Default payment model for new fee structures
                        </p>
                      </div>
                      <div>
                        <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                          >Default Installments Count</label
                        >
                        <input
                          v-model="feeSettings.defaultInstallmentsCount"
                          type="number"
                          class="input-field"
                          placeholder="4"
                          min="2"
                          max="12"
                        />
                      </div>
                      <div>
                        <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                          >Default Monthly Months</label
                        >
                        <input
                          v-model="feeSettings.defaultMonthlyMonths"
                          type="number"
                          class="input-field"
                          placeholder="12"
                          min="1"
                          max="12"
                        />
                      </div>
                      <div>
                        <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                          >Late Fee Percentage</label
                        >
                        <div class="relative">
                          <input
                            v-model="feeSettings.lateFeePercentage"
                            type="number"
                            class="input-field pr-8"
                            placeholder="5"
                            min="0"
                            max="50"
                            step="0.1"
                          />
                          <span
                            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                            >%</span
                          >
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Payment Settings -->
                  <div
                    class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Payment Settings
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                          >Default Payment Methods</label
                        >
                        <div class="space-y-2">
                          <div class="flex items-center">
                            <input
                              v-model="feeSettings.paymentMethods.cash"
                              type="checkbox"
                              id="cash"
                              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label for="cash" class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                              >Cash</label
                            >
                          </div>
                          <div class="flex items-center">
                            <input
                              v-model="feeSettings.paymentMethods.bank_transfer"
                              type="checkbox"
                              id="bank_transfer"
                              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label
                              for="bank_transfer"
                              class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                              >Bank Transfer</label
                            >
                          </div>
                          <div class="flex items-center">
                            <input
                              v-model="feeSettings.paymentMethods.cheque"
                              type="checkbox"
                              id="cheque"
                              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label
                              for="cheque"
                              class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                              >Cheque</label
                            >
                          </div>
                          <div class="flex items-center">
                            <input
                              v-model="feeSettings.paymentMethods.online"
                              type="checkbox"
                              id="online"
                              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label
                              for="online"
                              class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                              >Online Payment</label
                            >
                          </div>
                        </div>
                      </div>
                      <div>
                        <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                          >Payment Validation</label
                        >
                        <div class="space-y-2">
                          <div class="flex items-center">
                            <input
                              v-model="feeSettings.paymentValidation.requireTransactionId"
                              type="checkbox"
                              id="requireTransactionId"
                              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label
                              for="requireTransactionId"
                              class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                              >Require Transaction ID</label
                            >
                          </div>
                          <div class="flex items-center">
                            <input
                              v-model="feeSettings.paymentValidation.allowPartialPayments"
                              type="checkbox"
                              id="allowPartialPayments"
                              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label
                              for="allowPartialPayments"
                              class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                              >Allow Partial Payments</label
                            >
                          </div>
                          <div class="flex items-center">
                            <input
                              v-model="feeSettings.paymentValidation.autoGenerateReceipts"
                              type="checkbox"
                              id="autoGenerateReceipts"
                              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label
                              for="autoGenerateReceipts"
                              class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                              >Auto-generate Receipts</label
                            >
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Fee Categories & Types -->
                  <div
                    class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Fee Categories & Types
                    </h3>
                    <div class="space-y-4">
                      <div>
                        <label class="block font-medium mb-2 text-gray-700 dark:text-gray-300"
                          >Default Fee Categories</label
                        >
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label
                              class="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400"
                              >Tuition Fees</label
                            >
                            <input
                              v-model="feeSettings.defaultCategories.tuition"
                              type="text"
                              class="input-field"
                              placeholder="Tuition Fees"
                            />
                          </div>
                          <div>
                            <label
                              class="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400"
                              >Transportation</label
                            >
                            <input
                              v-model="feeSettings.defaultCategories.transportation"
                              type="text"
                              class="input-field"
                              placeholder="Transportation Fees"
                            />
                          </div>
                          <div>
                            <label
                              class="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400"
                              >Library</label
                            >
                            <input
                              v-model="feeSettings.defaultCategories.library"
                              type="text"
                              class="input-field"
                              placeholder="Library Fees"
                            />
                          </div>
                          <div>
                            <label
                              class="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400"
                              >Laboratory</label
                            >
                            <input
                              v-model="feeSettings.defaultCategories.laboratory"
                              type="text"
                              class="input-field"
                              placeholder="Laboratory Fees"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label class="block font-medium mb-2 text-gray-700 dark:text-gray-300"
                          >Fee Type Options</label
                        >
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label
                              class="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400"
                              >One-time</label
                            >
                            <input
                              v-model="feeSettings.feeTypeOptions.oneTime"
                              type="text"
                              class="input-field"
                              placeholder="One-time"
                            />
                          </div>
                          <div>
                            <label
                              class="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400"
                              >Recurring</label
                            >
                            <input
                              v-model="feeSettings.feeTypeOptions.recurring"
                              type="text"
                              class="input-field"
                              placeholder="Recurring"
                            />
                          </div>
                          <div>
                            <label
                              class="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400"
                              >Variable</label
                            >
                            <input
                              v-model="feeSettings.feeTypeOptions.variable"
                              type="text"
                              class="input-field"
                              placeholder="Variable"
                            />
                          </div>
                          <div>
                            <label
                              class="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400"
                              >Optional</label
                            >
                            <input
                              v-model="feeSettings.feeTypeOptions.optional"
                              type="text"
                              class="input-field"
                              placeholder="Optional"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Invoice & Receipt Settings -->
                  <div
                    class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Invoice & Receipt Settings
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                          >Invoice Number Prefix</label
                        >
                        <input
                          v-model="feeSettings.invoiceSettings.prefix"
                          type="text"
                          class="input-field"
                          placeholder="INV"
                          maxlength="10"
                        />
                      </div>
                      <div>
                        <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                          >Receipt Number Prefix</label
                        >
                        <input
                          v-model="feeSettings.invoiceSettings.receiptPrefix"
                          type="text"
                          class="input-field"
                          placeholder="RCP"
                          maxlength="10"
                        />
                      </div>
                      <div>
                        <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                          >Auto-generate Invoice Numbers</label
                        >
                        <div class="flex items-center">
                          <input
                            v-model="feeSettings.invoiceSettings.autoGenerateNumbers"
                            type="checkbox"
                            id="autoGenerateNumbers"
                            class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label
                            for="autoGenerateNumbers"
                            class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                            >Enable automatic numbering</label
                          >
                        </div>
                      </div>
                      <div>
                        <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                          >Invoice Due Date Calculation</label
                        >
                        <select
                          v-model="feeSettings.invoiceSettings.dueDateCalculation"
                          class="input-field"
                        >
                          <option value="fixed_days">Fixed days from invoice date</option>
                          <option value="month_end">End of month</option>
                          <option value="next_month">Next month same date</option>
                          <option value="custom">Custom calculation</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <!-- Save Button -->
                  <div class="flex justify-end">
                    <button @click="saveFeeSettings" class="btn-primary" :disabled="isSavingFees">
                      <span v-if="isSavingFees">Saving...</span>
                      <span v-else>Save Fee Configuration</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Branding & Receipt Tab -->
              <div v-if="activeTab === 'branding'" class="space-y-6">
                <!-- Loading State -->
                <div v-if="loadingStates.branding" class="flex justify-center items-center py-12">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <span class="ml-3 text-gray-600 dark:text-gray-400"
                    >Loading branding settings...</span
                  >
                </div>

                <!-- Content -->
                <div v-else class="space-y-6">
                  <!-- Basic Receipt Settings -->
                  <div
                    class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Basic Settings
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                          >School Name</label
                        >
                        <input
                          v-model="receiptSettings.schoolName"
                          type="text"
                          class="input-field"
                          placeholder="School name for receipts"
                        />
                      </div>
                      <div>
                        <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                          >Receipt Title</label
                        >
                        <input
                          v-model="receiptSettings.defaultReceiptTitle"
                          type="text"
                          class="input-field"
                          placeholder="Fee Receipt"
                        />
                      </div>
                      <div>
                        <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                          >School Logo</label
                        >
                        <div class="flex items-center gap-3">
                          <input
                            type="file"
                            @change="handleSchoolLogoUpload"
                            accept="image/*"
                            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                          />
                          <div v-if="receiptSettings.schoolLogo" class="flex-shrink-0">
                            <img
                              :src="getImageUrl(receiptSettings.schoolLogo)"
                              alt="School Logo"
                              class="w-12 h-12 object-cover rounded border-2 border-gray-200"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                          >Receipt Logo</label
                        >
                        <div class="flex items-center gap-3">
                          <input
                            type="file"
                            @change="handleReceiptLogoUpload"
                            accept="image/*"
                            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                          />
                          <div v-if="receiptSettings.receiptLogo" class="flex-shrink-0">
                            <img
                              :src="getImageUrl(receiptSettings.receiptLogo)"
                              alt="Receipt Logo"
                              class="w-16 h-10 object-contain rounded border-2 border-gray-200"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                          >Trust Name</label
                        >
                        <input
                          v-model="receiptSettings.trustName"
                          type="text"
                          class="input-field"
                          placeholder="HAJI OMAR MOOSA EDUCATIONAL TRUST"
                        />
                      </div>
                      <div>
                        <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                          >Footer Text</label
                        >
                        <textarea
                          v-model="receiptSettings.receiptFooter"
                          rows="2"
                          class="input-field"
                          placeholder="Footer text for receipts"
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  <!-- Display Options -->
                  <div
                    class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Display Options
                    </h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div class="flex items-center">
                        <input
                          v-model="receiptSettings.showSchoolLogo"
                          type="checkbox"
                          id="showLogo"
                          class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label for="showLogo" class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                          >Show School Logo</label
                        >
                      </div>
                      <div class="flex items-center">
                        <input
                          v-model="receiptSettings.showReceiptLogo"
                          type="checkbox"
                          id="showReceiptLogo"
                          class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label
                          for="showReceiptLogo"
                          class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                          >Show Receipt Logo</label
                        >
                      </div>
                      <div class="flex items-center">
                        <input
                          v-model="receiptSettings.showSchoolAddress"
                          type="checkbox"
                          id="showAddress"
                          class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label
                          for="showAddress"
                          class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                          >Show Address</label
                        >
                      </div>
                      <div class="flex items-center">
                        <input
                          v-model="receiptSettings.showSchoolContact"
                          type="checkbox"
                          id="showContact"
                          class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label
                          for="showContact"
                          class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                          >Show Contact</label
                        >
                      </div>
                      <div class="flex items-center">
                        <input
                          v-model="receiptSettings.showBranchInfo"
                          type="checkbox"
                          id="showBranch"
                          class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label
                          for="showBranch"
                          class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                          >Show Branch</label
                        >
                      </div>
                    </div>
                  </div>

                  <!-- Branch Settings -->
                  <div
                    class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Branch Settings
                    </h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Customize each branch's receipt appearance
                    </p>

                    <div
                      v-for="branch in branches"
                      :key="branch.id"
                      class="border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-4"
                    >
                      <h4 class="font-medium text-gray-900 dark:text-white mb-3">
                        {{ branch.name }}
                      </h4>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label
                            class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
                            >Display Name</label
                          >
                          <input
                            v-model="branch.receiptName"
                            type="text"
                            class="input-field"
                            :placeholder="`${branch.name} Receipt`"
                          />
                        </div>
                        <div>
                          <label
                            class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
                            >Logo</label
                          >
                          <div class="flex items-center gap-3">
                            <input
                              type="file"
                              @change="event => handleBranchLogoUpload(event, branch)"
                              accept="image/*"
                              class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                            <div v-if="branch.receiptLogo" class="flex-shrink-0">
                              <img
                                :src="getImageUrl(branch.receiptLogo)"
                                alt="Branch Logo"
                                class="w-10 h-10 object-cover rounded border-2 border-gray-200"
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label
                            class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
                            >Address</label
                          >
                          <input
                            v-model="branch.receiptAddress"
                            type="text"
                            class="input-field"
                            :placeholder="branch.address || 'Branch address'"
                          />
                        </div>
                        <div>
                          <label
                            class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
                            >Contact</label
                          >
                          <input
                            v-model="branch.receiptContact"
                            type="text"
                            class="input-field"
                            :placeholder="branch.phone || 'Branch contact'"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Save Button -->
                  <div class="flex justify-end">
                    <button
                      @click="saveBrandingSettings"
                      class="btn-primary"
                      :disabled="isSavingBranding"
                    >
                      <span v-if="isSavingBranding">Saving...</span>
                      <span v-else>Save Branding Settings</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- System Preferences Tab -->
              <div v-if="activeTab === 'system'" class="space-y-6">
                <!-- Loading State -->
                <div v-if="loadingStates.system" class="flex justify-center items-center py-12">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <span class="ml-3 text-gray-600 dark:text-gray-400"
                    >Loading system preferences...</span
                  >
                </div>

                <!-- Content -->
                <div v-else class="space-y-6">
                  <!-- Language & Localization -->
                  <div
                    class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Language & Localization
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                          >Default Language</label
                        >
                        <select v-model="systemSettings.defaultLanguage" class="input-field">
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                          <option value="hi">Hindi</option>
                          <option value="ar">Arabic</option>
                        </select>
                      </div>
                      <div>
                        <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                          >Time Format</label
                        >
                        <select v-model="systemSettings.timeFormat" class="input-field">
                          <option value="12h">12 Hour (AM/PM)</option>
                          <option value="24h">24 Hour</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <!-- Appearance Settings -->
                  <div
                    class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Appearance
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                          >Default Theme</label
                        >
                        <select v-model="systemSettings.defaultTheme" class="input-field">
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="auto">Auto (System)</option>
                        </select>
                      </div>
                      <div>
                        <label class="block font-medium mb-1 text-gray-700 dark:text-gray-300"
                          >Default Pagination Size</label
                        >
                        <select v-model="systemSettings.defaultPaginationSize" class="input-field">
                          <option value="10">10 rows</option>
                          <option value="25">25 rows</option>
                          <option value="50">50 rows</option>
                          <option value="100">100 rows</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <!-- Module Management -->
                  <div
                    class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Module Management
                    </h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Enable or disable system modules based on your school's needs
                    </p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div class="flex items-center">
                        <input
                          v-model="systemSettings.enabledModules.hostel"
                          type="checkbox"
                          id="hostel"
                          class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label for="hostel" class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                          >Hostel Management</label
                        >
                      </div>
                      <div class="flex items-center">
                        <input
                          v-model="systemSettings.enabledModules.transport"
                          type="checkbox"
                          id="transport"
                          class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label for="transport" class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                          >Transport Management</label
                        >
                      </div>
                      <div class="flex items-center">
                        <input
                          v-model="systemSettings.enabledModules.library"
                          type="checkbox"
                          id="library"
                          class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label for="library" class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                          >Library Management</label
                        >
                      </div>
                      <div class="flex items-center">
                        <input
                          v-model="systemSettings.enabledModules.inventory"
                          type="checkbox"
                          id="inventory"
                          class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label for="inventory" class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                          >Inventory Management</label
                        >
                      </div>
                      <div class="flex items-center">
                        <input
                          v-model="systemSettings.enabledModules.cafeteria"
                          type="checkbox"
                          id="cafeteria"
                          class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label for="cafeteria" class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                          >Cafeteria Management</label
                        >
                      </div>
                      <div class="flex items-center">
                        <input
                          v-model="systemSettings.enabledModules.visitors"
                          type="checkbox"
                          id="visitors"
                          class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label for="visitors" class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                          >Visitor Management</label
                        >
                      </div>
                    </div>
                  </div>

                  <!-- Save Button -->
                  <div class="flex justify-end">
                    <button
                      @click="saveSystemSettings"
                      class="btn-primary"
                      :disabled="isSavingSystem"
                    >
                      {{ isSavingSystem ? 'Saving...' : 'Save System Preferences' }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Notifications Tab -->
              <div v-if="activeTab === 'notifications'" class="space-y-4 sm:space-y-6">
                <div class="text-center py-12">
                  <div
                    class="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6"
                  >
                    <Bell class="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Notification Settings
                  </h3>
                  <p class="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">
                    Configure email and SMS notification preferences.
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-500">Coming Soon</p>
                </div>
              </div>

              <!-- Security Tab -->
              <div v-if="activeTab === 'security'" class="space-y-4 sm:space-y-6">
                <div class="text-center py-12">
                  <div
                    class="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6"
                  >
                    <Shield class="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Security Settings
                  </h3>
                  <p class="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">
                    Manage password policies and security settings.
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-500">Coming Soon</p>
                </div>
              </div>

              <!-- Integrations Tab -->
              <div v-if="activeTab === 'integrations'" class="space-y-4 sm:space-y-6">
                <div class="text-center py-12">
                  <div
                    class="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6"
                  >
                    <Link class="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Integrations
                  </h3>
                  <p class="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">
                    Configure third-party integrations and APIs.
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-500">Coming Soon</p>
                </div>
              </div>

              <!-- Backup Tab -->
              <div v-if="activeTab === 'backup'" class="space-y-4 sm:space-y-6">
                <div class="text-center py-12">
                  <div
                    class="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6"
                  >
                    <Download class="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Backup & Export
                  </h3>
                  <p class="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">
                    Manage data backup and export options.
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-500">Coming Soon</p>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <!-- Quick Actions -->
      <div
        class="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6"
      >
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4"
        >
          <div>
            <h3
              class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center"
            >
              <Zap class="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-indigo-600" />
              Quick Actions
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage your settings efficiently
            </p>
          </div>
          <div class="flex items-center space-x-2 text-sm text-gray-500">
            <Clock class="h-4 w-4" />
            <span>Last saved: {{ lastSavedTime }}</span>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <button
            @click="exportSettings"
            class="group bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-500 transition-all duration-200 hover:shadow-sm"
          >
            <div class="flex flex-col items-center text-center">
              <div
                class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors mb-2"
              >
                <Download class="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
              </div>
              <div class="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">Export</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Download</div>
            </div>
          </button>

          <button
            @click="importSettings"
            class="group bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200 hover:shadow-sm"
          >
            <div class="flex flex-col items-center text-center">
              <div
                class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors mb-2"
              >
                <Upload class="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div class="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">Import</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Upload</div>
            </div>
          </button>

          <button
            @click="resetToDefaults"
            class="group bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-500 transition-all duration-200 hover:shadow-sm"
          >
            <div class="flex flex-col items-center text-center">
              <div
                class="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors mb-2"
              >
                <RotateCcw class="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
              </div>
              <div class="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">Reset</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Defaults</div>
            </div>
          </button>

          <button
            @click="showSettingsHelp"
            class="group bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 transition-all duration-200 hover:shadow-sm"
          >
            <div class="flex flex-col items-center text-center">
              <div
                class="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors mb-2"
              >
                <HelpCircle class="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div class="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">Help</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Assistance</div>
            </div>
          </button>
        </div>
      </div>

      <!-- Scroll to Top Button -->
      <transition name="fade">
        <div v-if="showScrollButton" class="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
          <button
            @click="scrollToTop"
            class="bg-indigo-600 hover:bg-indigo-700 text-white p-2 sm:p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            title="Scroll to top"
          >
            <ChevronUp class="h-4 w-4 sm:h-6 sm:w-6" />
          </button>
        </div>
      </transition>

      <!-- Progress Notification -->
      <transition name="slide-up">
        <div
          v-if="completedSections > 0"
          class="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 max-w-xs sm:max-w-sm"
        >
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <CheckCircle class="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
            </div>
            <div class="ml-2 sm:ml-3">
              <p class="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                {{ completedSections }}/{{ settingsTabs.length }} configured
              </p>
              <div class="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2">
                <div
                  class="bg-green-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                  :style="{ width: `${(completedSections / settingsTabs.length) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useToast } from '~/composables/useToast';
import { createApiInstance } from '~/utils/api';
import {
  Building2,
  GraduationCap,
  DollarSign,
  Receipt,
  Settings,
  Bell,
  Shield,
  Link,
  Download,
  Upload,
  RotateCcw,
  User,
  Puzzle,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Zap,
  Clock,
  HelpCircle,
  ChevronUp
} from 'lucide-vue-next';

const authStore = useAuthStore();
const { showToast } = useToast();

// State
const activeTab = ref('school');
const isSaving = ref(false);
const isSavingAcademic = ref(false);
const isSavingBranding = ref(false);
const isSavingFees = ref(false);
const isSavingSystem = ref(false);
const lastSavedTime = ref('Never');
const tabProgress = reactive({
  school: 0,
  academic: 0,
  fees: 0,
  branding: 0,
  system: 0,
  notifications: 0,
  security: 0,
  integrations: 0,
  backup: 0
});

// Loading states for each tab
const loadingStates = reactive({
  school: false,
  academic: false,
  fees: false,
  branding: false,
  system: false,
  notifications: false,
  security: false,
  integrations: false,
  backup: false
});

// Data cache to avoid reloading
const dataCache = reactive({
  school: null,
  academic: null,
  fees: null,
  branding: null,
  system: null
});

// School Configuration Data
const schoolInfo = reactive({
  name: '',
  code: '',
  type: '',
  establishmentYear: '',
  principalName: '',
  principalEmail: ''
});

const contactInfo = reactive({
  phone: '',
  email: '',
  website: '',
  address: ''
});

const operationalSettings = reactive({
  defaultCurrency: 'USD',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY'
});

// Academic Settings Data
const academicYear = reactive({
  name: '',
  status: 'active',
  startDate: '',
  endDate: ''
});

const termSettings = reactive({
  numberOfTerms: 3,
  termDuration: 12
});

const academicSettings = reactive({
  startingMonth: 6,
  academicYearStart: 'academic'
});

const gradingSystem = reactive({
  scale: 'percentage',
  passingPercentage: 40
});

const attendanceSettings = reactive({
  minimumPercentage: 75,
  timeSettings: {
    cutoffTime: '16:00'
  },
  validationRules: {
    enforceWorkingDays: false,
    enforceCutoffTime: false
  },
  workingDays: {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false
  }
});

// Receipt Customization Data
const receiptSettings = reactive({
  schoolName: '',
  schoolLogo: '',
  schoolLogoFile: null,
  receiptLogo: '',
  receiptLogoFile: null,
  trustName: 'HAJI OMAR MOOSA EDUCATIONAL TRUST',
  defaultReceiptTitle: 'Fee Receipt',
  showSchoolLogo: true,
  showReceiptLogo: true,
  showSchoolAddress: true,
  showSchoolContact: true,
  showBranchInfo: true,
  receiptFooter: '',
  branchSpecificSettings: []
});

const currentBranch = ref(null);
const branches = ref([]);

// Fee Configuration Data
const feeSettings = reactive({
  currencySymbol: '₹',
  defaultPaymentDueDays: 15,
  defaultPaymentModel: 'monthly',
  defaultInstallmentsCount: 4,
  defaultMonthlyMonths: 12,
  lateFeePercentage: 5.0,
  paymentMethods: {
    cash: true,
    bank_transfer: true,
    cheque: true,
    online: false
  },
  paymentValidation: {
    requireTransactionId: false,
    allowPartialPayments: true,
    autoGenerateReceipts: true
  },
  defaultCategories: {
    tuition: 'Tuition Fees',
    transportation: 'Transportation Fees',
    library: 'Library Fees',
    laboratory: 'Laboratory Fees'
  },
  feeTypeOptions: {
    oneTime: 'One-time',
    recurring: 'Recurring',
    variable: 'Variable',
    optional: 'Optional'
  },
  invoiceSettings: {
    prefix: 'INV',
    receiptPrefix: 'RCP',
    autoGenerateNumbers: true,
    dueDateCalculation: 'fixed_days'
  }
});

// System Settings Data
const systemSettings = reactive({
  defaultLanguage: 'en',
  timeFormat: '12h',
  defaultTheme: 'light',
  defaultPaginationSize: 25,
  enabledModules: {
    hostel: false,
    transport: false,
    library: false,
    inventory: false,
    cafeteria: false,
    visitors: true
  }
});

// Computed properties
const isSuperAdmin = computed(() => authStore.currentUser?.role === 'super_admin');

const completedSections = computed(() => {
  return Object.values(tabProgress).filter(progress => progress === 100).length;
});

// Methods
const getTabProgress = tabId => {
  return tabProgress[tabId] || 0;
};

const updateLastSavedTime = () => {
  const now = new Date();
  lastSavedTime.value = now.toLocaleTimeString();
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Show/hide scroll button based on scroll position
const showScrollButton = ref(false);
const scrollProgress = ref(0);

const handleScroll = () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPercent = (scrollTop / docHeight) * 100;

  showScrollButton.value = scrollTop > 300;
  scrollProgress.value = Math.min(scrollPercent, 100);
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

const showSettingsHelp = () => {
  showToast('Help documentation will be available soon!', 'info');
};

// Settings tabs configuration
const settingsTabs = computed(() => {
  const tabs = [
    {
      id: 'school',
      name: 'School Information',
      icon: Building2
    },
    {
      id: 'academic',
      name: 'Academic Settings',
      icon: GraduationCap
    },
    {
      id: 'fees',
      name: 'Fee & Finance Settings',
      icon: DollarSign
    },
    {
      id: 'branding',
      name: 'Branding & Receipt',
      icon: Receipt
    },
    {
      id: 'system',
      name: 'System Preferences',
      icon: Settings
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: Bell
    },
    {
      id: 'security',
      name: 'Security',
      icon: Shield
    },
    {
      id: 'integrations',
      name: 'Integrations',
      icon: Link
    },
    {
      id: 'backup',
      name: 'Backup & Export',
      icon: Download
    }
  ];

  return tabs;
});

// Methods
const loadTabData = async tabName => {
  // Set loading state
  loadingStates[tabName] = true;

  try {
    // Check if user is authenticated
    if (!authStore.isLoggedIn) {
      return;
    }

    // Check if user has required role
    if (!authStore.isSchoolAdmin && !authStore.isSuperAdmin) {
      return;
    }

    const api = createApiInstance();
    let response;

    switch (tabName) {
      case 'school':
        response = await api.get('/settings/school');
        if (response.data.success) {
          Object.assign(schoolInfo, response.data.data.schoolInfo || {});
          Object.assign(contactInfo, response.data.data.contactInfo || {});
          Object.assign(operationalSettings, response.data.data.operationalSettings || {});
          dataCache.school = true; // Mark as loaded
        }
        break;

      case 'academic':
        response = await api.get('/settings/academic');
        if (response.data.success) {
          Object.assign(academicYear, response.data.data.academicYear || {});
          Object.assign(termSettings, response.data.data.termSettings || {});
          Object.assign(gradingSystem, response.data.data.gradingSystem || {});
          Object.assign(attendanceSettings, response.data.data.attendanceSettings || {});
          Object.assign(academicSettings, response.data.data.academicSettings || {});
          dataCache.academic = true; // Mark as loaded
        }
        break;

      case 'fees':
        response = await api.get('/settings/fee');
        if (response.data.success) {
          Object.assign(feeSettings, response.data.data.feeSettings || {});
          dataCache.fees = true;
        }
        break;

      case 'branding':
        response = await api.get('/settings/branding');
        if (response.data.success) {
          const settings = response.data.data.receiptSettings || {};
          Object.assign(receiptSettings, {
            ...settings,
            schoolLogoFile: null // Reset file property on load
          });
          // Add file property to each branch for logo uploads
          branches.value = (response.data.data.branches || []).map(branch => ({
            ...branch,
            receiptLogoFile: null
          }));
          dataCache.branding = true;
        }
        break;

      case 'system':
        response = await api.get('/settings/system');
        if (response.data.success) {
          Object.assign(systemSettings, response.data.data.systemSettings || {});
          dataCache.system = true;
        }
        break;

      case 'notifications':
        // TODO: Implement when notification settings endpoint is ready
        dataCache.notifications = true;
        break;

      case 'security':
        // TODO: Implement when security settings endpoint is ready
        dataCache.security = true;
        break;

      case 'integrations':
        // TODO: Implement when integrations endpoint is ready
        dataCache.integrations = true;
        break;

      case 'backup':
        // TODO: Implement when backup endpoint is ready
        dataCache.backup = true;
        break;

      default:
        // Unknown tab - skip loading
        break;
    }
  } catch (error) {
    // Only show error toast if it's not an authentication error
    if (error.response?.status !== 401 && error.response?.status !== 403) {
      showToast(`Failed to load ${tabName} settings`, 'error');
    }
  } finally {
    // Clear loading state
    loadingStates[tabName] = false;
  }
};

// Legacy methods for backward compatibility (can be removed later)
const loadSchoolData = async () => {
  await loadTabData('school');
};

const loadAcademicData = async () => {
  await loadTabData('academic');
};

const saveSchoolSettings = async () => {
  isSaving.value = true;
  try {
    // Check if user is authenticated
    if (!authStore.isLoggedIn) {
      showToast('Please log in to save settings', 'error');
      return;
    }

    // Check if user has required role
    if (!authStore.isSchoolAdmin && !authStore.isSuperAdmin) {
      showToast('You do not have permission to save settings', 'error');
      return;
    }

    const api = createApiInstance();
    const response = await api.put('/settings/school', {
      schoolInfo,
      contactInfo,
      operationalSettings
    });

    if (response.data.success) {
      showToast('School settings saved successfully', 'success');
      // Clear cache to ensure fresh data on next load
      dataCache.school = null;
      // Update progress and last saved time
      tabProgress.school = 100;
      updateLastSavedTime();
    }
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      showToast('Authentication required to save settings', 'error');
    } else {
      showToast('Failed to save school settings', 'error');
    }
  } finally {
    isSaving.value = false;
  }
};

const saveAcademicSettings = async () => {
  isSavingAcademic.value = true;
  try {
    // Check if user is authenticated
    if (!authStore.isLoggedIn) {
      showToast('Please log in to save settings', 'error');
      return;
    }

    // Check if user has required role
    if (!authStore.isSchoolAdmin && !authStore.isSuperAdmin) {
      showToast('You do not have permission to save settings', 'error');
      return;
    }

    const api = createApiInstance();
    const response = await api.put('/settings/academic', {
      academicYear,
      termSettings,
      gradingSystem,
      attendanceSettings,
      academicSettings
    });

    if (response.data.success) {
      showToast('Academic settings saved successfully', 'success');
      // Clear cache to ensure fresh data on next load
      dataCache.academic = null;
      // Update progress and last saved time
      tabProgress.academic = 100;
      updateLastSavedTime();
    }
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      showToast('Authentication required to save settings', 'error');
    } else {
      showToast('Failed to save academic settings', 'error');
    }
  } finally {
    isSavingAcademic.value = false;
  }
};

// Image upload handling methods
const handleSchoolLogoUpload = event => {
  const file = event.target.files[0];
  if (file) {
    // Create a preview URL
    const reader = new FileReader();
    reader.onload = e => {
      receiptSettings.schoolLogo = e.target.result;
    };
    reader.readAsDataURL(file);

    // Store the file for upload
    receiptSettings.schoolLogoFile = file;
  }
};

const handleReceiptLogoUpload = event => {
  const file = event.target.files[0];
  if (file) {
    // Create a preview URL
    const reader = new FileReader();
    reader.onload = e => {
      receiptSettings.receiptLogo = e.target.result;
    };
    reader.readAsDataURL(file);

    // Store the file for upload
    receiptSettings.receiptLogoFile = file;
  }
};

const handleBranchLogoUpload = (event, branch) => {
  const file = event.target.files[0];
  if (file) {
    // Create a preview URL
    const reader = new FileReader();
    reader.onload = e => {
      branch.receiptLogo = e.target.result;
    };
    reader.readAsDataURL(file);

    // Store the file for upload
    branch.receiptLogoFile = file;
  }
};

const getImageUrl = filename => {
  if (!filename) return '';
  if (filename.startsWith('data:')) return filename;
  const config = useRuntimeConfig();
  const apiBase = config.public?.apiBase || 'http://localhost:8000/api';
  const backendBase = apiBase.replace('/api', '');
  return `${backendBase}/uploads/logos/${filename}`;
};

const saveBrandingSettings = async () => {
  isSavingBranding.value = true;
  try {
    // Check if user is authenticated
    if (!authStore.isLoggedIn) {
      showToast('Please log in to save settings', 'error');
      return;
    }

    // Check if user has required role
    if (!authStore.isSchoolAdmin && !authStore.isSuperAdmin) {
      showToast('You do not have permission to save settings', 'error');
      return;
    }

    const api = createApiInstance();

    // Create FormData for file uploads
    const formData = new FormData();

    // Add receipt settings
    formData.append('receiptSettings', JSON.stringify(receiptSettings));

    // Add school logo if uploaded
    if (receiptSettings.schoolLogoFile) {
      formData.append('schoolLogo', receiptSettings.schoolLogoFile);
    }

    // Add receipt logo if uploaded
    if (receiptSettings.receiptLogoFile) {
      formData.append('receiptLogo', receiptSettings.receiptLogoFile);
    }

    // Add branches data
    formData.append('branches', JSON.stringify(branches.value));

    // Add branch logos if uploaded
    branches.value.forEach(branch => {
      if (branch.receiptLogoFile) {
        formData.append('branchLogos', branch.receiptLogoFile);
      }
    });

    const response = await api.put('/settings/branding', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.data.success) {
      showToast('Branding settings saved successfully', 'success');
      // Clear cache to ensure fresh data on next load
      dataCache.branding = null;
      // Update progress and last saved time
      tabProgress.branding = 100;
      updateLastSavedTime();
    }
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      showToast('Authentication required to save settings', 'error');
    } else {
      showToast('Failed to save branding settings', 'error');
    }
  } finally {
    isSavingBranding.value = false;
  }
};

const saveFeeSettings = async () => {
  isSavingFees.value = true;
  try {
    // Check if user is authenticated
    if (!authStore.isLoggedIn) {
      showToast('Please log in to save settings', 'error');
      return;
    }

    // Check if user has required role
    if (!authStore.isSchoolAdmin && !authStore.isSuperAdmin) {
      showToast('You do not have permission to save settings', 'error');
      return;
    }

    const api = createApiInstance();
    const response = await api.put('/settings/fee', {
      feeSettings
    });

    if (response.data.success) {
      showToast('Fee configuration saved successfully', 'success');
      // Clear cache to ensure fresh data on next load
      dataCache.fees = null;
      // Update progress and last saved time
      tabProgress.fees = 100;
      updateLastSavedTime();
    }
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      showToast('Authentication required to save settings', 'error');
    } else {
      showToast('Failed to save fee configuration', 'error');
    }
  } finally {
    isSavingFees.value = false;
  }
};

const saveSystemSettings = async () => {
  isSavingSystem.value = true;
  try {
    // Check if user is authenticated
    if (!authStore.isLoggedIn) {
      showToast('Please log in to save settings', 'error');
      return;
    }

    // Check if user has required role
    if (!authStore.isSchoolAdmin && !authStore.isSuperAdmin) {
      showToast('You do not have permission to save settings', 'error');
      return;
    }

    const api = createApiInstance();
    const response = await api.put('/settings/system', {
      systemSettings
    });

    if (response.data.success) {
      showToast('System preferences saved successfully', 'success');
      // Clear cache to ensure fresh data on next load
      dataCache.system = null;
      // Update progress and last saved time
      tabProgress.system = 100;
      updateLastSavedTime();
    }
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      showToast('Authentication required to save settings', 'error');
    } else {
      showToast('Failed to save system preferences', 'error');
    }
  } finally {
    isSavingSystem.value = false;
  }
};

const importSettings = () => {
  showToast('Import functionality will be implemented', 'info');
};

const resetToDefaults = () => {
  showToast('Reset functionality will be implemented', 'info');
};

// Method to refresh current tab data
const refreshCurrentTab = () => {
  dataCache[activeTab.value] = null;
  loadTabData(activeTab.value);
};

// Lifecycle
onMounted(async () => {
  // Wait for auth store to initialize
  if (authStore.isInitializing) {
    await new Promise(resolve => {
      const checkInit = () => {
        if (!authStore.isInitializing) {
          resolve(true);
        } else {
          setTimeout(checkInit, 50);
        }
      };
      checkInit();
    });
  }

  // Only load data for the active tab if user is authenticated and has required role
  if (authStore.isLoggedIn && (authStore.isSchoolAdmin || authStore.isSuperAdmin)) {
    loadTabData(activeTab.value);
  } else if (authStore.isLoggedIn) {
    showToast('You do not have permission to access settings', 'error');
  }
});

// Watch for active tab changes to load data lazily
watch(activeTab, async newTab => {
  if (!authStore.isLoggedIn || (!authStore.isSchoolAdmin && !authStore.isSuperAdmin)) {
    return;
  }

  // Only load if not already cached and not currently loading
  if (!dataCache[newTab] && !loadingStates[newTab]) {
    await loadTabData(newTab);
  }
});

// Watch for authentication state changes
watch(
  () => authStore.isLoggedIn,
  isLoggedIn => {
    if (isLoggedIn && (authStore.isSchoolAdmin || authStore.isSuperAdmin)) {
      // Load data for the currently active tab only
      loadTabData(activeTab.value);
    }
  }
);
</script>

<style scoped>
.btn-primary {
  @apply inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200;
}

.btn-secondary {
  @apply inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200;
}

/* Hide scrollbar for tab navigation */
.scrollbar-hide {
  -ms-overflow-style: none; /* Internet Explorer 10+ */
  scrollbar-width: none; /* Firefox */
}

.scrollbar-hide::-webkit-scrollbar {
  display: none; /* Safari and Chrome */
}

/* Responsive improvements */
@media (max-width: 640px) {
  .btn-primary,
  .btn-secondary {
    @apply text-sm px-3 py-2;
  }
}

/* Smooth tab transitions */
.tab-content {
  transition: opacity 0.2s ease-in-out;
}

/* Active tab indicator */
.tab-active {
  position: relative;
}

.tab-active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 1px;
}

/* Form styles */
.input-field {
  @apply block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white sm:text-sm;
}

.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed;
}

/* Tab transition animations */
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition:
    opacity 0.2s ease-in-out,
    transform 0.2s ease-in-out;
}

.tab-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* GitHub-style tab improvements */
.tab-fade-enter-active {
  transition-delay: 0.1s;
}

/* Enhanced animations */
@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes bounce {
  0%,
  20%,
  53%,
  80%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  40%,
  43% {
    transform: translate3d(0, -8px, 0);
  }
  70% {
    transform: translate3d(0, -4px, 0);
  }
  90% {
    transform: translate3d(0, -2px, 0);
  }
}

/* Enhanced hover effects */
.group:hover .group-hover\:scale-105 {
  transform: scale(1.05);
}

.group:hover .group-hover\:scale-110 {
  transform: scale(1.1);
}

/* Floating action button animation */
.fixed button:hover {
  animation: bounce 0.6s ease-in-out;
}

/* Progress indicator animation */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Smooth scroll behavior */
html {
  scroll-behavior: smooth;
}

/* Enhanced focus states */
button:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}

/* Gradient text effect */
.gradient-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Slide up transition for notifications */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease-out;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Fade transition for scroll button */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
