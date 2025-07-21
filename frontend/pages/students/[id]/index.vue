<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <nav class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
              <NuxtLink to="/students" class="hover:text-indigo-600 dark:hover:text-indigo-400">Students</NuxtLink>
              <span>/</span>
              <span class="text-gray-900 dark:text-white">Details</span>
            </nav>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Student Details</h1>
            <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
              View and manage student information
            </p>
          </div>
          <div class="flex space-x-3">
            <button
              @click="editStudent"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors duration-200"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Student
            </button>
            <NuxtLink
              :to="`/students/${student?.id}/fee-ledger`"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600 transition-colors duration-200"
            >
              <CreditCard class="h-4 w-4 mr-2" />
              Fee Ledger
            </NuxtLink>
            <button
              @click="$router.back()"
              class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 dark:border-indigo-700 dark:border-t-indigo-400"></div>
        <p class="mt-4 text-lg font-medium text-gray-900 dark:text-white">Loading student details...</p>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Please wait while we fetch the information</p>
      </div>

      <!-- Student Profile -->
      <div v-else-if="student" class="space-y-8">
        <!-- Profile Header Card -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-700 dark:to-indigo-800 px-6 py-4">
            <div class="flex items-center space-x-6">
              <!-- Profile Picture -->
              <div class="relative">
                <div v-if="student.photo" class="relative">
                  <img
                    :src="student.photo"
                    :alt="`${student.first_name} ${student.last_name}`"
                    class="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg"
                  />
                  <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 border-2 border-white dark:border-gray-700 rounded-full"></div>
                </div>
                <div
                  v-else
                  class="w-24 h-24 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-lg"
                >
                  <span class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {{ (student.first_name || '').charAt(0) }}{{ (student.last_name || '').charAt(0) }}
                  </span>
                </div>
              </div>
              
              <!-- Student Name and Basic Info -->
              <div class="flex-1">
                <h2 class="text-2xl font-bold text-white">
                  {{ student.first_name }} {{ student.middle_name ? student.middle_name + ' ' : '' }}{{ student.last_name }}
                </h2>
                <div class="flex items-center space-x-4 mt-2 text-indigo-100">
                  <span class="flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {{ student.admission_number }}
                  </span>
                  <span class="flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {{ student.current_class }}{{ student.section ? `-${student.section}` : '' }}
                  </span>
                  <span
                    :class="getStatusClass(student.status)"
                    class="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full"
                  >
                    <div class="w-2 h-2 rounded-full mr-2" :class="{
                      'bg-green-400': student.status === 'active',
                      'bg-red-400': student.status === 'inactive',
                      'bg-blue-400': student.status === 'graduated',
                      'bg-gray-400': student.status === 'dropped',
                      'bg-yellow-400': student.status === 'transferred'
                    }"></div>
                    {{ getStatusText(student.status) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Left Column - Personal & Academic Info -->
          <div class="lg:col-span-2 space-y-8">
            <!-- Personal Information -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div class="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-600">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <svg class="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Personal Information
                </h3>
              </div>
              <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-4">
                    <div>
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth</label>
                      <p class="text-sm text-gray-900 dark:text-white font-medium">{{ formatDate(student.date_of_birth) }}</p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Gender</label>
                      <p class="text-sm text-gray-900 dark:text-white font-medium capitalize">{{ student.gender }}</p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Blood Group</label>
                      <p class="text-sm text-gray-900 dark:text-white font-medium">{{ student.blood_group || 'Not specified' }}</p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Religion</label>
                      <p class="text-sm text-gray-900 dark:text-white font-medium">{{ student.religion || 'Not specified' }}</p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Category</label>
                      <p class="text-sm text-gray-900 dark:text-white font-medium capitalize">{{ student.category || 'Not specified' }}</p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Nationality</label>
                      <p class="text-sm text-gray-900 dark:text-white font-medium">{{ student.nationality }}</p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Mother Tongue</label>
                      <p class="text-sm text-gray-900 dark:text-white font-medium">{{ student.mother_tongue || 'Not specified' }}</p>
                    </div>
                  </div>
                  <div class="space-y-4">
                    <div>
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Roll Number</label>
                      <p class="text-sm text-gray-900 dark:text-white font-medium">{{ student.roll_number || 'Not assigned' }}</p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Academic Year</label>
                      <p class="text-sm text-gray-900 dark:text-white font-medium">{{ student.academic_year }}</p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Admission Date</label>
                      <p class="text-sm text-gray-900 dark:text-white font-medium">{{ formatDate(student.admission_date) }}</p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Admission Class</label>
                      <p class="text-sm text-gray-900 dark:text-white font-medium">{{ student.admission_class }}</p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Current Class</label>
                      <p class="text-sm text-gray-900 dark:text-white font-medium">{{ student.current_class }}</p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Section</label>
                      <p class="text-sm text-gray-900 dark:text-white font-medium">{{ student.section || 'Not assigned' }}</p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Country</label>
                      <p class="text-sm text-gray-900 dark:text-white font-medium">{{ student.country }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Contact Information -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div class="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-600">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <svg class="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Information
                </h3>
              </div>
              <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-4">
                    <div>
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Email Address</label>
                      <p class="text-sm text-gray-900 dark:text-white font-medium">{{ student.email || 'Not provided' }}</p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Phone Number</label>
                      <p class="text-sm text-gray-900 dark:text-white font-medium">{{ student.phone || 'Not provided' }}</p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Emergency Contact</label>
                      <p class="text-sm text-gray-900 dark:text-white font-medium">{{ student.emergency_contact || 'Not provided' }}</p>
                    </div>
                  </div>
                  <div class="space-y-4">
                    <div>
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Address</label>
                      <p class="text-sm text-gray-900 dark:text-white font-medium">{{ student.address || 'Not provided' }}</p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400">City</label>
                      <p class="text-sm text-gray-900 dark:text-white font-medium">{{ student.city || 'Not provided' }}</p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400">State</label>
                      <p class="text-sm text-gray-900 dark:text-white font-medium">{{ student.state || 'Not provided' }}</p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Postal Code</label>
                      <p class="text-sm text-gray-900 dark:text-white font-medium">{{ student.postal_code || 'Not provided' }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Parents/Guardians Information -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div class="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-600">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <svg class="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Parents & Guardians
                </h3>
              </div>
              <div class="p-6">
                <div v-if="student.parents && student.parents.length > 0" class="space-y-6">
                  <div
                    v-for="parent in student.parents"
                    :key="parent.id"
                    class="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700"
                  >
                    <div class="flex items-center justify-between mb-3">
                      <h4 class="font-medium text-gray-900 dark:text-white">
                        {{ parent.father_name || parent.mother_name || parent.guardian_name }}
                      </h4>
                      <span class="text-xs px-2 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 rounded-full capitalize">
                        {{ parent.relationship || 'Guardian' }}
                      </span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <label class="text-gray-500 dark:text-gray-400">Phone</label>
                        <p class="text-gray-900 dark:text-white font-medium">{{ parent.father_phone || parent.mother_phone || parent.guardian_phone || 'Not provided' }}</p>
                      </div>
                      <div>
                        <label class="text-gray-500 dark:text-gray-400">Email</label>
                        <p class="text-gray-900 dark:text-white font-medium">{{ parent.father_email || parent.mother_email || parent.guardian_email || 'Not provided' }}</p>
                      </div>
                      <div>
                        <label class="text-gray-500 dark:text-gray-400">Occupation</label>
                        <p class="text-gray-900 dark:text-white font-medium">{{ parent.father_occupation || parent.mother_occupation || 'Not provided' }}</p>
                      </div>
                      <div>
                        <label class="text-gray-500 dark:text-gray-400">Qualification</label>
                        <p class="text-gray-900 dark:text-white font-medium">{{ parent.father_qualification || parent.mother_qualification || 'Not provided' }}</p>
                      </div>
                      <div v-if="parent.father_income || parent.mother_income">
                        <label class="text-gray-500 dark:text-gray-400">Income</label>
                        <p class="text-gray-900 dark:text-white font-medium">{{ parent.father_income || parent.mother_income }}</p>
                      </div>
                      <div v-if="parent.guardian_relation">
                        <label class="text-gray-500 dark:text-gray-400">Relation</label>
                        <p class="text-gray-900 dark:text-white font-medium">{{ parent.guardian_relation }}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-center py-8">
                  <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No parent information</h3>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Parent or guardian details have not been added yet.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column - Additional Info -->
          <div class="space-y-8">
            <!-- Quick Stats -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div class="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-600">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <svg class="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Quick Stats
                </h3>
              </div>
              <div class="p-6">
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-500 dark:text-gray-400">Age</span>
                    <span class="text-sm font-medium text-gray-900 dark:text-white">{{ calculateAge(student.date_of_birth) }} years</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-500 dark:text-gray-400">Parents</span>
                    <span class="text-sm font-medium text-gray-900 dark:text-white">{{ student.parents?.length || 0 }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-500 dark:text-gray-400">Documents</span>
                    <span class="text-sm font-medium text-gray-900 dark:text-white">{{ getDocumentCount(student.documents) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Additional Information -->
            <div v-if="student.notes || (student.medical_info && Object.keys(student.medical_info).length)" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div class="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-600">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <svg class="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Additional Information
                </h3>
              </div>
              <div class="p-6">
                <div v-if="student.notes" class="mb-4">
                  <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</label>
                  <p class="text-sm text-gray-900 dark:text-white mt-1">{{ student.notes }}</p>
                </div>
                <div v-if="student.medical_info && Object.keys(student.medical_info).length">
                  <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Medical Information</label>
                  <div class="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <pre class="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ JSON.stringify(student.medical_info, null, 2) }}</pre>
                  </div>
                </div>
              </div>
            </div>

            <!-- Documents -->
            <div v-if="student.documents && Object.keys(student.documents).length" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div class="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-600">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <svg class="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Documents
                </h3>
              </div>
              <div class="p-6">
                <div class="space-y-2">
                  <div v-for="(doc, key) in student.documents" :key="key" class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span class="text-sm text-gray-700 dark:text-gray-300 capitalize">{{ key.replace(/_/g, ' ') }}</span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">{{ doc ? 'Uploaded' : 'Not uploaded' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Student not found</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">The student you're looking for doesn't exist or you don't have permission to view it.</p>
        <div class="mt-6">
          <button
            @click="$router.back()"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { CreditCard } from 'lucide-vue-next';
import { apiClient } from '~/utils/api';
import { useAuthStore } from '~/stores/auth';

const route = useRoute();
const studentId = route.params.id;

const student = ref(null);
const isLoading = ref(false);

const fetchStudent = async () => {
  isLoading.value = true;
  try {
    // Check if user is authenticated
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) {
      console.error('User not authenticated');
      throw new Error('User not authenticated. Please log in.');
    }
    
    console.log('Fetching student with ID:', studentId);

    
    const response = await apiClient.students.getById(studentId);
    student.value = response.data;
  } catch (error) {
    console.error('Error fetching student:', error);
    // Handle specific error cases
    if (error.response?.status === 401) {
      // User not authenticated, redirect to login
      await navigateTo('/login');
    } else if (error.response?.status === 403) {
      // User not authorized
      console.error('User not authorized to view this student');
    } else if (error.response?.status === 404) {
      // Student not found
      console.error('Student not found');
    }
  } finally {
    isLoading.value = false;
  }
};

const editStudent = () => {
  // Navigate to edit page
  navigateTo(`/students/${studentId}/edit`);
};

const formatDate = (date) => {
  if (!date) return 'Not provided';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return 'Unknown';
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

const getDocumentCount = (documents) => {
  if (!documents || typeof documents !== 'object') return 0;
  return Object.values(documents).filter(doc => doc).length;
};

const getStatusClass = (status) => {
  const classes = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    inactive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    graduated: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    dropped: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    transferred: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  };
  return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
};

const getStatusText = (status) => {
  const texts = {
    active: 'Active',
    inactive: 'Inactive',
    graduated: 'Graduated',
    dropped: 'Dropped',
    transferred: 'Transferred',
  };
  return texts[status] || status;
};

onMounted(() => {
  fetchStudent();
});
</script> 