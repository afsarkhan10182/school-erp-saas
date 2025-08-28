<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-start">
      <div class="space-y-2">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Mark Today's Attendance</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">Select class and mark student attendance</p>
        <!-- Cut-off Time Warning -->
        <div v-if="showCutoffWarning" class="mt-2 p-2 bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span class="text-sm text-orange-800 dark:text-orange-200">
              <strong>Cut-off Time:</strong> Attendance must be submitted before 4:00 PM today
            </span>
          </div>
        </div>
      </div>
      <div class="flex gap-2">
        <button 
          @click="showBulkImport = true"
          class="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
          </svg>
          Import from Excel/CSV
        </button>
      </div>
    </div>

    <!-- Quick Setup Card -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Select Class & Load Students</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Choose your class details to load student list</p>
        </div>
        <div class="flex items-center space-x-2">
          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-green-100 to-green-200 text-green-800 dark:from-green-900 dark:to-green-800 dark:text-green-200 shadow-sm">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            {{ students.length }} Students
          </span>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-6 gap-6">
        <!-- Date Picker -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
            <svg class="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
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
            <div v-if="workingDayStatus" class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs" :class="{
              'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300': workingDayStatus.is_working_day && workingDayStatus.day_type === 'working',
              'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300': workingDayStatus.day_type === 'holiday' || workingDayStatus.day_type === 'weekend',
              'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300': workingDayStatus.day_type === 'non-working',
              'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300': workingDayStatus.day_type === 'invalid' || workingDayStatus.day_type === 'error' || workingDayStatus.day_type === 'future'
            }">
              <svg v-if="workingDayStatus.is_working_day && workingDayStatus.day_type === 'working'" class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <svg v-else-if="workingDayStatus.day_type === 'holiday' || workingDayStatus.day_type === 'weekend'" class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <svg v-else class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              <span class="font-medium text-xs">{{ 
                workingDayStatus.day_type === 'invalid' ? 'INVALID' :
                workingDayStatus.day_type === 'error' ? 'ERROR' :
                workingDayStatus.day_type === 'holiday' ? 'HOLIDAY' :
                workingDayStatus.day_type === 'weekend' ? 'HOLIDAY' :
                workingDayStatus.day_type === 'non-working' ? 'NON-WORKING' :
                workingDayStatus.day_type === 'future' ? 'FUTURE' :
                workingDayStatus.day_type === 'working' ? 'WORKING' :
                workingDayStatus.day_type.toUpperCase()
              }}</span>
            </div>
          </div>
        </div>
        
        <!-- School Selector (Super Admin Only) -->
        <div v-if="isSuperAdmin">
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
            <svg class="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
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
        
        <!-- Branch Selector (Super Admin and School Admin) -->
        <div v-if="isSuperAdmin || isSchoolAdmin">
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
            <svg class="w-4 h-4 mr-2 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
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
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
            <svg class="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
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
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
            <svg class="w-4 h-4 mr-2 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
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
            @click="loadStudents"
            :disabled="!form.class_id || loading"
            class="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none whitespace-nowrap"
          >
            <span class="font-medium">{{ loading ? 'Loading Students...' : 'Load Students' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Attendance Marking Section -->
    <div v-if="students.length > 0" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">Mark Attendance</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Mark student attendance for {{ form.date }}. Use <strong>Save Draft</strong> to save progress or <strong>Submit & Notify</strong> to finalize and notify parents.
          </p>
        </div>
        
        <!-- Quick Actions -->
        <div class="flex items-center gap-2">
          <button 
            @click="markAllPresent"
            class="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors text-sm flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Mark All Present
          </button>
          <button 
            @click="markAllAbsent"
            class="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors text-sm flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
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
          <select 
            v-model="filterStatus" 
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="excused">Excused</option>
          </select>
        </div>
      </div>

      <!-- Attendance Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
          <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ presentCount }}</div>
          <div class="text-sm text-green-700 dark:text-green-300">Present</div>
        </div>
        <div class="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
          <div class="text-2xl font-bold text-red-600 dark:text-red-400">{{ absentCount }}</div>
          <div class="text-sm text-red-700 dark:text-red-300">Absent</div>
        </div>
        <div class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{{ lateCount }}</div>
          <div class="text-sm text-yellow-700 dark:text-yellow-300">Late</div>
        </div>
        <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ totalStudents }}</div>
          <div class="text-sm text-blue-700 dark:text-blue-300">Total</div>
        </div>
      </div>

      <!-- Students List -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Student
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Roll No
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Remarks
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="student in filteredStudents" :key="student.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
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
                {{ student.admission_number }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <select 
                  v-model="attendanceRecords[student.id].status"
                  class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="excused">Excused</option>
                </select>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <input 
                  v-model="attendanceRecords[student.id].remarks"
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
        :current-page="currentPage"
        :total-items="totalStudents"
        :page-size="pageSize"
        @page-changed="handlePageChange"
      />

      <!-- Action Buttons -->
      <div class="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
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
            <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
            </svg>
            {{ saving ? 'Saving...' : 'Save Draft' }}
          </button>
          
          <!-- Submit Button (Publish) -->
          <button 
            @click="submitAttendance"
            :disabled="!canSubmit || saving"
            class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            {{ saving ? 'Submitting...' : 'Submit & Notify' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Bulk Import Modal -->
    <div v-if="showBulkImport" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Import Attendance from Excel/CSV</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Upload an Excel or CSV file with attendance data. The file should contain columns for Date, Class, Student ID, and Status.
        </p>
        <input type="file" accept=".xlsx,.xls,.csv" class="w-full mb-4" />
        <div class="flex justify-end gap-3">
          <button @click="showBulkImport = false" class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
            Cancel
          </button>
          <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Import
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, onUnmounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useToast } from '~/composables/useToast'
import { useSchools } from '~/composables/useSchools'
import { useBranches } from '~/composables/useBranches'
import { useAttendanceValidation } from '~/composables/useAttendanceValidation'
import { useDropdowns } from '~/composables/useDropdowns'
import { useAuth } from '~/composables/useAuth'
import { apiClient } from '~/utils/api'
import EnhancedDropdown from '~/components/EnhancedDropdown.vue'
import Pagination from '~/components/Pagination.vue'

const { showToast } = useToast()
const authStore = useAuthStore()
const { schools, fetchSchools } = useSchools()
const { branches, fetchAllBranches } = useBranches()
const { classOptions, sectionOptions, loadClasses, loadSections } = useDropdowns()
const { 
  attendanceSettings, 
  loadAttendanceSettings, 
  validateAttendanceSubmission,
  getTimeSettings,
  getValidationRules
} = useAttendanceValidation()

const { isSuperAdmin, isSchoolAdmin } = useAuth()

// State
const loading = ref(false)
const saving = ref(false)
const students = ref<any[]>([])
const showBulkImport = ref(false)
const workingDayStatus = ref<any>(null)
const showCutoffWarning = ref(false)

// School and branch data from composables
const schoolOptions = computed(() => schools.value.map((school: any) => ({
  value: school.id,
  label: school.name
})))
const branchOptions = computed(() => branches.value.map((branch: any) => ({
  value: branch.id,
  label: branch.name
})))

// Form
const form = reactive({
  date: new Date().toISOString().slice(0, 10),
  school_id: '',
  branch_id: '',
  class_id: '',
  section_id: '',
  academic_year: ''
})

// Attendance records
const attendanceRecords = reactive<Record<string, { status: 'present' | 'absent' | 'late' | 'excused'; remarks: string }>>({})
const searchQuery = ref('')
const filterStatus = ref('')

// Pagination
const currentPage = ref(1)
const pageSize = ref(20)

// Computed
const presentCount = computed(() => 
  Object.values(attendanceRecords).filter(r => r.status === 'present').length
)
const absentCount = computed(() => 
  Object.values(attendanceRecords).filter(r => r.status === 'absent').length
)
const lateCount = computed(() => 
  Object.values(attendanceRecords).filter(r => r.status === 'late').length
)

const totalStudents = computed(() => students.value.length)

const hasChanges = computed(() => 
  Object.keys(attendanceRecords).length > 0
)

const canSubmit = computed(() => {
  if (!workingDayStatus.value?.is_working_day) return false
  
  // For previous days, always allow submission
  const selectedDate = new Date(form.date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  selectedDate.setHours(0, 0, 0, 0)
  
  if (selectedDate < today) {
    return true // ✅ Allow submission for previous days
  }
  
  // For today, check cut-off time
  if (selectedDate.getTime() === today.getTime()) {
    const timeSettings = getTimeSettings.value
    const currentTime = new Date()
    const cutoffTime = new Date()
    const [cutoffHour, cutoffMinute] = timeSettings.cutoffTime.split(':').map(Number)
    cutoffTime.setHours(cutoffHour, cutoffMinute, 0, 0)
    
    return currentTime <= cutoffTime
  }
  
  return false // ❌ Don't allow future dates
})

const filteredStudents = computed(() => {
  let filtered = students.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(student => 
      student.first_name?.toLowerCase().includes(query) ||
      student.last_name?.toLowerCase().includes(query) ||
      student.admission_number?.toLowerCase().includes(query)
    )
  }

  if (filterStatus.value) {
    filtered = filtered.filter(student => 
      attendanceRecords[student.id]?.status === filterStatus.value
    )
  }

  return filtered
})

// Methods
const checkWorkingDay = async () => {
  try {
    // Debug: Log the attendance settings
    console.log('Current attendance settings:', attendanceSettings.value)
    
    const workingDayValidation = validateAttendanceSubmission(form.date, [], false)
    console.log('Working day validation result:', workingDayValidation)
    
    if (!workingDayValidation.isValid) {
      // Provide more descriptive status based on the validation message
      let dayType = 'invalid';
      let description = workingDayValidation.message;
      
      // Try to determine a better day type based on the validation message
      if (workingDayValidation.message.toLowerCase().includes('weekend')) {
        dayType = 'weekend';
        description = 'Weekend - No classes scheduled';
      } else if (workingDayValidation.message.toLowerCase().includes('holiday')) {
        dayType = 'holiday';
        description = 'Holiday - School closed';
      } else if (workingDayValidation.message.toLowerCase().includes('non-working')) {
        dayType = 'non-working';
        description = 'Non-working day';
      } else if (workingDayValidation.message.toLowerCase().includes('future')) {
        dayType = 'future';
        description = 'Future date - Planning mode';
      } else if (workingDayValidation.message.toLowerCase().includes('past')) {
        dayType = 'invalid';
        description = 'Past date - Cannot mark attendance';
      } else if (workingDayValidation.message.toLowerCase().includes('sunday')) {
        dayType = 'holiday';
        description = 'Sunday - Holiday';
      } else if (workingDayValidation.message.toLowerCase().includes('saturday')) {
        dayType = 'holiday';
        description = 'Saturday - Holiday';
      } else if (workingDayValidation.message.toLowerCase().includes('monday') || 
                 workingDayValidation.message.toLowerCase().includes('tuesday') || 
                 workingDayValidation.message.toLowerCase().includes('wednesday') || 
                 workingDayValidation.message.toLowerCase().includes('thursday') || 
                 workingDayValidation.message.toLowerCase().includes('friday')) {
        dayType = 'non-working';
        description = 'Non-working day';
      }
      
      workingDayStatus.value = {
        is_working_day: false,
        day_type: dayType,
        description: description
      }
      return
    }
    
    const response = await apiClient.academicCalendar.checkWorkingDay({
      date: form.date,
      academic_year: form.academic_year
    })
    workingDayStatus.value = response.data
    
    // Only show cut-off warning for today's attendance AND if enforceCutoffTime is enabled
    const selectedDate = new Date(form.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    selectedDate.setHours(0, 0, 0, 0)
    
    if (selectedDate.getTime() === today.getTime()) {
      // Check if enforceCutoffTime is enabled in settings
      const enforceCutoffTime = attendanceSettings.value?.validationRules?.enforceCutoffTime === true
      
      if (enforceCutoffTime) {
        const timeSettings = getTimeSettings.value
        const currentTime = new Date()
        const warningTime = new Date()
        const [warningHour, warningMinute] = timeSettings.cutoffTime.split(':').map(Number)
        warningTime.setHours(warningHour - 1, warningMinute, 0, 0)
        showCutoffWarning.value = currentTime > warningTime
      } else {
        showCutoffWarning.value = false // Don't show warning if enforceCutoffTime is disabled
      }
    } else {
      showCutoffWarning.value = false // Don't show warning for previous days
    }
  } catch (error) {
    workingDayStatus.value = {
      is_working_day: false,
      day_type: 'error',
      description: 'Unable to check working day status'
    }
  }
}

const markAllPresent = () => {
  students.value.forEach(student => {
    if (attendanceRecords[student.id]) {
      attendanceRecords[student.id].status = 'present'
    }
  })
}

const markAllAbsent = () => {
  students.value.forEach(student => {
    if (attendanceRecords[student.id]) {
      attendanceRecords[student.id].status = 'absent'
    }
  })
}

const onSchoolChange = async (schoolId: string) => {
  form.school_id = schoolId
  form.branch_id = ''
  await fetchAllBranches(schoolId)
}

const onBranchChange = async (branchId: string) => {
  form.branch_id = branchId
  form.class_id = ''
  form.section_id = ''
  await loadClasses()
}

const onClassChange = async (classId: string) => {
  form.class_id = classId
  form.section_id = ''
  await loadSections(classId)
}

const loadStudents = async () => {
  if (!form.class_id) {
    showToast('Please select a class first', 'error')
    return
  }

  loading.value = true
  try {
    // Check if it's a working day using validation service
    await checkWorkingDay()
    
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
        showToast(errorMessage, 'warning')
        // Continue with loading students
      } else if (dayType === 'invalid') {
        errorMessage = workingDayStatus.value?.description || 'Invalid date for attendance';
        showToast(errorMessage, 'error')
        return
      }
      
      if (dayType !== 'future') {
        showToast(errorMessage, 'error')
        return
      }
    }

    // Check if attendance already exists for this date and class
    try {
      const existingSessionResponse = await apiClient.attendance.listSessions({
        date_from: form.date,
        date_to: form.date,
        class_id: form.class_id,
        section_id: form.section_id || undefined,
        status: 'published'
      })
      
      if (existingSessionResponse.success && existingSessionResponse.data?.items && existingSessionResponse.data.items.length > 0) {
        const existingSession = existingSessionResponse.data.items[0]
        showToast(`⚠️ Attendance already exists for ${form.date}. Loading existing data for editing.`, 'warning')
        
        // Load existing attendance data
        const sessionResponse = await apiClient.attendance.getSession(existingSession.id)
        if (sessionResponse.success && sessionResponse.data) {
          const existingRecords = sessionResponse.data.records || []
          
          // Load students first
          const response = await apiClient.students.getAll({
            class_id: form.class_id,
            section: form.section_id,
            branch_id: form.branch_id,
            page: currentPage.value,
            limit: pageSize.value
          })

          if (response.success && response.data) {
            students.value = Array.isArray(response.data) ? response.data : []
            
            // Initialize attendance records with existing data
            students.value.forEach(student => {
              const existingRecord = existingRecords.find((record: any) => record.student_id === student.id)
              attendanceRecords[student.id] = {
                status: existingRecord?.status || 'present',
                remarks: existingRecord?.remarks || ''
              }
            })
            
            showToast(`Loaded ${students.value.length} students with existing attendance data`, 'success')
            loading.value = false
            return
          }
        }
      }
    } catch (error) {
      // If check fails, continue with normal flow
      console.log('Could not check existing attendance:', error)
    }

    const response = await apiClient.students.getAll({
      class_id: form.class_id,
      section: form.section_id,
      branch_id: form.branch_id,
      page: currentPage.value,
      limit: pageSize.value
    })

    if (response.success && response.data) {
      students.value = Array.isArray(response.data) ? response.data : []
    } else {
      students.value = []
    }

    // Initialize attendance records
    students.value.forEach(student => {
      if (!attendanceRecords[student.id]) {
        attendanceRecords[student.id] = {
          status: 'present',
          remarks: ''
        }
      }
    })

    showToast(`Loaded ${students.value.length} students`, 'success')
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Failed to load students'
    showToast(message, 'error')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  loadStudents()
}

const saveAttendanceDraft = async () => {
  if (!hasChanges.value) {
    showToast('No changes to save', 'warning')
    return
  }

  if (!canSubmit.value) {
    showToast('Cannot save draft after cutoff time or on non-working days', 'error')
    return
  }

  try {
    saving.value = true
    const records = students.value.map(student => ({
      student_id: student.id,
      status: attendanceRecords[student.id]?.status || 'present',
      remarks: attendanceRecords[student.id]?.remarks || ''
    }))

    const validation = validateAttendanceSubmission(form.date, records, false)
    if (!validation.isValid) {
      showToast(validation.message, 'error')
      return
    }

    await saveAttendance('temp', records, false) // false = draft mode
    showToast('Attendance draft saved successfully', 'success')
    
    // Don't clear form for draft - allow further editing
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Failed to save attendance draft'
    showToast(message, 'error')
  } finally {
    saving.value = false
  }
}

const submitAttendance = async () => {
  if (!hasChanges.value) {
    showToast('No changes to submit', 'warning')
    return
  }

  if (!canSubmit.value) {
    showToast('Cannot submit attendance after cutoff time or on non-working days', 'error')
    return
  }

  try {
    saving.value = true
    const records = students.value.map(student => ({
      student_id: student.id,
      status: attendanceRecords[student.id]?.status || 'present',
      remarks: attendanceRecords[student.id]?.remarks || ''
    }))

    const validation = validateAttendanceSubmission(form.date, records, true)
    if (!validation.isValid) {
      showToast(validation.message, 'error')
      return
    }

    await saveAttendance('temp', records, true) // true = publish mode
    showToast('Attendance submitted successfully - Parents will be notified', 'success')
    
    // Clear form after successful submission
    students.value = []
    Object.keys(attendanceRecords).forEach(key => {
      delete attendanceRecords[key]
    })
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Failed to submit attendance'
    showToast(message, 'error')
  } finally {
    saving.value = false
  }
}

const saveAttendance = async (sessionId: string, records: any[], publish: boolean) => {
  // First, create or get the attendance session
  let actualSessionId = sessionId
  
  if (sessionId === 'temp') {
    try {
      const sessionResponse = await apiClient.attendance.upsertSession({
        date: form.date,
        attendance_type: 'daily',
        class_id: form.class_id,
        section_id: form.section_id || null,
        academic_year: form.academic_year || undefined,
      })
      
      if (sessionResponse.success && sessionResponse.data) {
        actualSessionId = sessionResponse.data.id
      } else {
        throw new Error('Failed to create attendance session')
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to create attendance session'
      throw new Error(message)
    }
  }
  
  // Now save the records with the actual session ID
  const response = await apiClient.attendance.saveRecords({
    session_id: actualSessionId,
    records,
    publish
  })
  return response
}

// Watch for date changes with debounce
let dateChangeTimeout: NodeJS.Timeout | null = null
watch(() => form.date, () => {
  // Clear previous timeout
  if (dateChangeTimeout) {
    clearTimeout(dateChangeTimeout)
  }
  
  // Set new timeout to debounce the API call
  dateChangeTimeout = setTimeout(() => {
    checkWorkingDay()
  }, 300) // 300ms delay
})

// Initialize
onMounted(async () => {
  try {
    // Load attendance settings first
    await loadAttendanceSettings()
    
    // Load initial data
    await fetchSchools()
    await loadClasses()
    await checkWorkingDay()
    
    // Set academic year from current date
    const currentYear = new Date().getFullYear()
    form.academic_year = `${currentYear}-${currentYear + 1}`
  } catch (error) {
    showToast('Error initializing attendance page', 'error')
  }
})

// Cleanup timeout on unmount
onUnmounted(() => {
  if (dateChangeTimeout) {
    clearTimeout(dateChangeTimeout)
  }
})
</script>

<style scoped></style>


