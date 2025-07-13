<template>
  <div class="container mx-auto py-8 max-w-4xl">
    <!-- Header -->
    <div class="mb-8">
      <nav class="flex mb-4" aria-label="Breadcrumb">
        <ol class="flex items-center space-x-4">
          <li>
            <div>
              <NuxtLink to="/students" class="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400">
                <UsersIcon class="flex-shrink-0 h-5 w-5" />
                <span class="sr-only">Students</span>
              </NuxtLink>
            </div>
          </li>
          <li>
            <div class="flex items-center">
              <ChevronRightIcon class="flex-shrink-0 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <span class="ml-4 text-sm font-medium text-gray-500 dark:text-gray-400">New Admission</span>
            </div>
          </li>
        </ol>
      </nav>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Student Admission</h1>
      <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">Add a new student to the school</p>
    </div>

    <!-- Form -->
    <form @submit.prevent="submitForm" class="space-y-8">
      <!-- Student Information -->
      <div class="card">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-6">Student Information</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label for="first_name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name *</label>
              <input
                id="first_name"
                v-model="form.first_name"
                type="text"
                required
                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                :class="{'border-red-300': errors.first_name}"
              />
              <p v-if="errors.first_name" class="mt-1 text-sm text-red-600">{{ errors.first_name }}</p>
            </div>

            <div>
              <label for="middle_name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Middle Name</label>
              <input
                id="middle_name"
                v-model="form.middle_name"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label for="last_name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name *</label>
              <input
                id="last_name"
                v-model="form.last_name"
                type="text"
                required
                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                :class="{'border-red-300': errors.last_name}"
              />
              <p v-if="errors.last_name" class="mt-1 text-sm text-red-600">{{ errors.last_name }}</p>
            </div>

            <div>
              <label for="admission_number" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Admission Number *</label>
              <input
                id="admission_number"
                v-model="form.admission_number"
                type="text"
                required
                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                :class="{'border-red-300': errors.admission_number}"
              />
              <p v-if="errors.admission_number" class="mt-1 text-sm text-red-600">{{ errors.admission_number }}</p>
            </div>

            <div>
              <label for="roll_number" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Roll Number</label>
              <input
                id="roll_number"
                v-model="form.roll_number"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label for="date_of_birth" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth *</label>
              <input
                id="date_of_birth"
                v-model="form.date_of_birth"
                type="date"
                required
                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                :class="{'border-red-300': errors.date_of_birth}"
              />
              <p v-if="errors.date_of_birth" class="mt-1 text-sm text-red-600">{{ errors.date_of_birth }}</p>
            </div>

            <div>
              <label for="gender" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender *</label>
              <select
                id="gender"
                v-model="form.gender"
                required
                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                :class="{'border-red-300': errors.gender}"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <p v-if="errors.gender" class="mt-1 text-sm text-red-600">{{ errors.gender }}</p>
            </div>

            <div>
              <label for="blood_group" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Blood Group</label>
              <select
                id="blood_group"
                v-model="form.blood_group"
                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label for="religion" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Religion</label>
              <input
                id="religion"
                v-model="form.religion"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label for="category" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
              <select
                id="category"
                v-model="form.category"
                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select Category</option>
                <option value="general">General</option>
                <option value="obc">OBC</option>
                <option value="sc">SC</option>
                <option value="st">ST</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label for="nationality" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Nationality</label>
              <input
                id="nationality"
                v-model="form.nationality"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label for="mother_tongue" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Mother Tongue</label>
              <input
                id="mother_tongue"
                v-model="form.mother_tongue"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

      <!-- Academic Information -->
      <div class="card">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-6">Academic Information</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label for="admission_date" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Admission Date *</label>
              <input
                id="admission_date"
                v-model="form.admission_date"
                type="date"
                required
                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                :class="{'border-red-300': errors.admission_date}"
              />
              <p v-if="errors.admission_date" class="mt-1 text-sm text-red-600">{{ errors.admission_date }}</p>
            </div>

            <div>
              <label for="admission_class" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Admission Class *</label>
              <select
                id="admission_class"
                v-model="form.admission_class"
                required
                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                :class="{'border-red-300': errors.admission_class}"
              >
                <option value="">Select Class</option>
                <option value="Nursery">Nursery</option>
                <option value="LKG">LKG</option>
                <option value="UKG">UKG</option>
                <option value="1st">1st</option>
                <option value="2nd">2nd</option>
                <option value="3rd">3rd</option>
                <option value="4th">4th</option>
                <option value="5th">5th</option>
                <option value="6th">6th</option>
                <option value="7th">7th</option>
                <option value="8th">8th</option>
                <option value="9th">9th</option>
                <option value="10th">10th</option>
                <option value="11th">11th</option>
                <option value="12th">12th</option>
              </select>
              <p v-if="errors.admission_class" class="mt-1 text-sm text-red-600">{{ errors.admission_class }}</p>
            </div>

            <div>
              <label for="current_class" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Class *</label>
              <select
                id="current_class"
                v-model="form.current_class"
                required
                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                :class="{'border-red-300': errors.current_class}"
              >
                <option value="">Select Class</option>
                <option value="Nursery">Nursery</option>
                <option value="LKG">LKG</option>
                <option value="UKG">UKG</option>
                <option value="1st">1st</option>
                <option value="2nd">2nd</option>
                <option value="3rd">3rd</option>
                <option value="4th">4th</option>
                <option value="5th">5th</option>
                <option value="6th">6th</option>
                <option value="7th">7th</option>
                <option value="8th">8th</option>
                <option value="9th">9th</option>
                <option value="10th">10th</option>
                <option value="11th">11th</option>
                <option value="12th">12th</option>
              </select>
              <p v-if="errors.current_class" class="mt-1 text-sm text-red-600">{{ errors.current_class }}</p>
            </div>

            <div>
              <label for="section" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Section</label>
              <select
                id="section"
                v-model="form.section"
                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select Section</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>

            <div>
              <label for="academic_year" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Academic Year *</label>
              <select
                id="academic_year"
                v-model="form.academic_year"
                required
                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                :class="{'border-red-300': errors.academic_year}"
              >
                <option value="">Select Academic Year</option>
                <option value="2024-25">2024-25</option>
                <option value="2025-26">2025-26</option>
              </select>
              <p v-if="errors.academic_year" class="mt-1 text-sm text-red-600">{{ errors.academic_year }}</p>
            </div>
          </div>
        </div>

      <!-- Contact Information -->
      <div class="card">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-6">Contact Information</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700">Phone</label>
              <input
                id="phone"
                v-model="form.phone"
                type="tel"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div class="md:col-span-2">
              <label for="address" class="block text-sm font-medium text-gray-700">Address</label>
              <textarea
                id="address"
                v-model="form.address"
                rows="3"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              ></textarea>
            </div>

            <div>
              <label for="city" class="block text-sm font-medium text-gray-700">City</label>
              <input
                id="city"
                v-model="form.city"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label for="state" class="block text-sm font-medium text-gray-700">State</label>
              <input
                id="state"
                v-model="form.state"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label for="postal_code" class="block text-sm font-medium text-gray-700">Postal Code</label>
              <input
                id="postal_code"
                v-model="form.postal_code"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label for="country" class="block text-sm font-medium text-gray-700">Country</label>
              <input
                id="country"
                v-model="form.country"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

      <!-- Parent Information -->
      <div class="card">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-6">Parent Information</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Father Information -->
            <div>
              <h3 class="text-base font-medium text-gray-900 mb-4">Father Information</h3>
              <div class="space-y-4">
                <div>
                  <label for="father_name" class="block text-sm font-medium text-gray-700">Father Name</label>
                  <input
                    id="father_name"
                    v-model="form.parent.father_name"
                    type="text"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label for="father_phone" class="block text-sm font-medium text-gray-700">Father Phone</label>
                  <input
                    id="father_phone"
                    v-model="form.parent.father_phone"
                    type="tel"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label for="father_email" class="block text-sm font-medium text-gray-700">Father Email</label>
                  <input
                    id="father_email"
                    v-model="form.parent.father_email"
                    type="email"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label for="father_occupation" class="block text-sm font-medium text-gray-700">Father Occupation</label>
                  <input
                    id="father_occupation"
                    v-model="form.parent.father_occupation"
                    type="text"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <!-- Mother Information -->
            <div>
              <h3 class="text-base font-medium text-gray-900 mb-4">Mother Information</h3>
              <div class="space-y-4">
                <div>
                  <label for="mother_name" class="block text-sm font-medium text-gray-700">Mother Name</label>
                  <input
                    id="mother_name"
                    v-model="form.parent.mother_name"
                    type="text"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label for="mother_phone" class="block text-sm font-medium text-gray-700">Mother Phone</label>
                  <input
                    id="mother_phone"
                    v-model="form.parent.mother_phone"
                    type="tel"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label for="mother_email" class="block text-sm font-medium text-gray-700">Mother Email</label>
                  <input
                    id="mother_email"
                    v-model="form.parent.mother_email"
                    type="email"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label for="mother_occupation" class="block text-sm font-medium text-gray-700">Mother Occupation</label>
                  <input
                    id="mother_occupation"
                    v-model="form.parent.mother_occupation"
                    type="text"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="primary_contact" class="block text-sm font-medium text-gray-700">Primary Contact *</label>
              <select
                id="primary_contact"
                v-model="form.parent.primary_contact"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                :class="{'border-red-300': errors.primary_contact}"
              >
                <option value="">Select Primary Contact</option>
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="guardian">Guardian</option>
              </select>
              <p v-if="errors.primary_contact" class="mt-1 text-sm text-red-600">{{ errors.primary_contact }}</p>
            </div>

            <div>
              <label for="primary_phone" class="block text-sm font-medium text-gray-700">Primary Phone *</label>
              <input
                id="primary_phone"
                v-model="form.parent.primary_phone"
                type="tel"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                :class="{'border-red-300': errors.primary_phone}"
              />
              <p v-if="errors.primary_phone" class="mt-1 text-sm text-red-600">{{ errors.primary_phone }}</p>
            </div>
          </div>
        </div>

      <!-- Documents Section -->
      <div class="card">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-6">Required Documents</h2>
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Student Photo *
              </label>
              <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                <div class="space-y-1 text-center">
                  <div v-if="!form.documents.student_photo" class="text-gray-400">
                    <svg class="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </div>
                  <div v-else class="relative">
                    <img :src="form.documents.student_photo.preview" class="h-24 w-24 rounded-lg object-cover mx-auto" />
                    <button @click="removeFile('student_photo')" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">
                      ×
                    </button>
                  </div>
                  <div class="flex text-sm text-gray-600 dark:text-gray-400">
                    <label for="student_photo" class="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                      <span>Upload a photo</span>
                      <input id="student_photo" name="student_photo" type="file" class="sr-only" @change="handleFileUpload('student_photo', $event)" accept="image/*">
                    </label>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF up to 5MB</p>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Birth Certificate *
              </label>
              <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                <div class="space-y-1 text-center">
                  <div v-if="!form.documents.birth_certificate" class="text-gray-400">
                    <svg class="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </div>
                  <div v-else class="relative">
                    <div class="flex items-center space-x-2">
                      <svg class="h-8 w-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 3a2 2 0 00-2 2v1.5h16V5a2 2 0 00-2-2H4z"/>
                        <path fill-rule="evenodd" d="M2 7.5V14a2 2 0 002 2h12a2 2 0 002-2V7.5H2zm8 3.5a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0v-2.5A.75.75 0 0110 11z" clip-rule="evenodd"/>
                      </svg>
                      <span class="text-sm text-gray-600 dark:text-gray-400">{{ form.documents.birth_certificate.name }}</span>
                    </div>
                    <button @click="removeFile('birth_certificate')" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">
                      ×
                    </button>
                  </div>
                  <div class="flex text-sm text-gray-600 dark:text-gray-400">
                    <label for="birth_certificate" class="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                      <span>Upload certificate</span>
                      <input id="birth_certificate" name="birth_certificate" type="file" class="sr-only" @change="handleFileUpload('birth_certificate', $event)" accept=".pdf,.jpg,.jpeg,.png">
                    </label>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">PDF, JPG, PNG up to 10MB</p>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Previous School Records
              </label>
              <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                <div class="space-y-1 text-center">
                  <div v-if="!form.documents.previous_school_records" class="text-gray-400">
                    <svg class="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </div>
                  <div v-else class="relative">
                    <div class="flex items-center space-x-2">
                      <svg class="h-8 w-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 3a2 2 0 00-2 2v1.5h16V5a2 2 0 00-2-2H4z"/>
                        <path fill-rule="evenodd" d="M2 7.5V14a2 2 0 002 2h12a2 2 0 002-2V7.5H2zm8 3.5a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0v-2.5A.75.75 0 0110 11z" clip-rule="evenodd"/>
                      </svg>
                      <span class="text-sm text-gray-600 dark:text-gray-400">{{ form.documents.previous_school_records.name }}</span>
                    </div>
                    <button @click="removeFile('previous_school_records')" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">
                      ×
                    </button>
                  </div>
                  <div class="flex text-sm text-gray-600 dark:text-gray-400">
                    <label for="previous_school_records" class="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                      <span>Upload records</span>
                      <input id="previous_school_records" name="previous_school_records" type="file" class="sr-only" @change="handleFileUpload('previous_school_records', $event)" accept=".pdf,.jpg,.jpeg,.png">
                    </label>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">PDF, JPG, PNG up to 10MB</p>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Address Proof
              </label>
              <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                <div class="space-y-1 text-center">
                  <div v-if="!form.documents.address_proof" class="text-gray-400">
                    <svg class="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </div>
                  <div v-else class="relative">
                    <div class="flex items-center space-x-2">
                      <svg class="h-8 w-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 3a2 2 0 00-2 2v1.5h16V5a2 2 0 00-2-2H4z"/>
                        <path fill-rule="evenodd" d="M2 7.5V14a2 2 0 002 2h12a2 2 0 002-2V7.5H2zm8 3.5a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0v-2.5A.75.75 0 0110 11z" clip-rule="evenodd"/>
                      </svg>
                      <span class="text-sm text-gray-600 dark:text-gray-400">{{ form.documents.address_proof.name }}</span>
                    </div>
                    <button @click="removeFile('address_proof')" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">
                      ×
                    </button>
                  </div>
                  <div class="flex text-sm text-gray-600 dark:text-gray-400">
                    <label for="address_proof" class="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                      <span>Upload proof</span>
                      <input id="address_proof" name="address_proof" type="file" class="sr-only" @change="handleFileUpload('address_proof', $event)" accept=".pdf,.jpg,.jpeg,.png">
                    </label>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">PDF, JPG, PNG up to 10MB</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="card">
        <div class="flex justify-end space-x-3">
          <button
            type="button"
            @click="navigateTo('/students')"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <span v-if="isSubmitting">Submitting...</span>
            <span v-else>Submit Admission</span>
          </button>
        </div>
      </div>
      </form>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { apiClient } from '~/utils/api';
import { UsersIcon, ChevronRightIcon } from 'lucide-vue-next';

const isSubmitting = ref(false);
const errors = ref({});

const form = reactive({
  // Student basic info
  first_name: '',
  middle_name: '',
  last_name: '',
  admission_number: '',
  roll_number: '',
  date_of_birth: '',
  gender: '',
  blood_group: '',
  religion: '',
  category: '',
  nationality: 'Indian',
  mother_tongue: '',
  
  // Academic info
  admission_date: new Date().toISOString().split('T')[0],
  admission_class: '',
  current_class: '',
  section: '',
  academic_year: '2024-25',
  
  // Contact info
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'India',
  
  // Parent info
  parent: {
    father_name: '',
    father_phone: '',
    father_email: '',
    father_occupation: '',
    mother_name: '',
    mother_phone: '',
    mother_email: '',
    mother_occupation: '',
    primary_contact: 'father',
    primary_phone: '',
  },

  // Documents
  documents: {
    student_photo: null,
    birth_certificate: null,
    previous_school_records: null,
    address_proof: null,
  }
});

const validateForm = () => {
  errors.value = {};
  
  // Required field validation
  if (!form.first_name) errors.value.first_name = 'First name is required';
  if (!form.last_name) errors.value.last_name = 'Last name is required';
  if (!form.admission_number) errors.value.admission_number = 'Admission number is required';
  if (!form.date_of_birth) errors.value.date_of_birth = 'Date of birth is required';
  if (!form.gender) errors.value.gender = 'Gender is required';
  if (!form.admission_date) errors.value.admission_date = 'Admission date is required';
  if (!form.admission_class) errors.value.admission_class = 'Admission class is required';
  if (!form.current_class) errors.value.current_class = 'Current class is required';
  if (!form.academic_year) errors.value.academic_year = 'Academic year is required';
  if (!form.parent.primary_contact) errors.value.primary_contact = 'Primary contact is required';
  if (!form.parent.primary_phone) errors.value.primary_phone = 'Primary phone is required';
  
  return Object.keys(errors.value).length === 0;
};

const handleFileUpload = (fieldName, event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  // File size validation
  const maxSize = fieldName === 'student_photo' ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB for photos, 10MB for documents
  if (file.size > maxSize) {
    alert(`File size must be less than ${fieldName === 'student_photo' ? '5MB' : '10MB'}`);
    return;
  }
  
  // File type validation
  const allowedTypes = fieldName === 'student_photo' 
    ? ['image/jpeg', 'image/png', 'image/gif']
    : ['application/pdf', 'image/jpeg', 'image/png'];
  
  if (!allowedTypes.includes(file.type)) {
    alert('Invalid file type. Please select a valid file.');
    return;
  }
  
  // Create preview URL for images
  const fileData = {
    file: file,
    name: file.name,
    size: file.size,
    type: file.type
  };
  
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      fileData.preview = e.target.result;
      form.documents[fieldName] = fileData;
    };
    reader.readAsDataURL(file);
  } else {
    form.documents[fieldName] = fileData;
  }
};

const removeFile = (fieldName) => {
  form.documents[fieldName] = null;
};

const submitForm = async () => {
  if (!validateForm()) {
    return;
  }
  
  isSubmitting.value = true;
  
  try {
    // Create FormData for file upload
    const formData = new FormData();
    
    // Add basic form data
    Object.keys(form).forEach(key => {
      if (key === 'documents' || key === 'parent') return;
      formData.append(key, form[key]);
    });
    
    // Add parent data
    Object.keys(form.parent).forEach(key => {
      formData.append(`parent.${key}`, form.parent[key]);
    });
    
    // Add documents
    Object.keys(form.documents).forEach(key => {
      if (form.documents[key]) {
        formData.append(key, form.documents[key].file);
      }
    });
    
    const response = await apiClient.students.create(formData);
    
    if (response.success) {
      // Show success message
      alert('Student admission successful!');
      navigateTo('/students');
    } else {
      alert('Error: ' + response.message);
    }
  } catch (error) {
    console.error('Error submitting form:', error);
    alert('Error submitting form. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};
</script>
