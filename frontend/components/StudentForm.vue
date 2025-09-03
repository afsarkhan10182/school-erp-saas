<template>
  <div class="container mx-auto py-8 max-w-6xl">
    <!-- Header -->
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ isEditing ? 'Edit Student' : 'Create Student' }}</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">Fill in all required details for student {{ isEditing ? 'update' : 'creation' }}</p>
      </div>
      <NuxtLink to="/students" class="btn-secondary">Back to Students</NuxtLink>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="space-y-8">
      
      <!-- Validation Summary -->
      <FormValidationSummary 
        data-validation-summary
        :categorized-errors="getCategorizedErrors()"
        :has-errors="hasErrors"
        :error-count="errorCount"
        @clear-errors="clearErrors"
      />
      
      <!-- School and Branch Selection -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <span class="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center mr-3">1</span>
          {{ userRole === 'super_admin' ? 'Select School & Branch' : userRole === 'school_admin' ? 'Select Branch' : 'Academic Details' }}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- School Dropdown (Super Admin Only) -->
          <div v-if="userRole === 'super_admin'">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              School <span class="text-red-500">*</span>
            </label>
            <select 
              v-model="form.school_id" 
              @change="onSchoolChange" 
              required 
              class="input-field"
              :class="{ 'opacity-50': loadingSchools, 'border-red-500 focus:border-red-500 focus:ring-red-500': getFieldError('school_id') }"
              :disabled="loadingSchools"
            >
              <option value="">Loading schools...</option>
              <option v-for="school in schools" :key="school.id" :value="school.id">
                {{ school.name }}
              </option>
            </select>
            <div v-if="getFieldError('school_id')" class="mt-1 text-sm text-red-600 dark:text-red-400 flex items-start">
              <svg class="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              {{ getFieldError('school_id') }}
            </div>
            <p v-if="schools.length === 0 && !loadingSchools" class="mt-1 text-sm text-red-600">No schools found</p>
          </div>

          <!-- Branch Dropdown (Super Admin & School Admin) -->
          <div v-if="userRole !== 'branch_admin'">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Branch <span class="text-red-500">*</span>
            </label>
            <select 
              v-model="form.branch_id" 
              @change="onBranchChange" 
              required 
              class="input-field"
              :class="{ 'opacity-50': loadingBranches, 'border-red-500 focus:border-red-500 focus:ring-red-500': getFieldError('branch_id') }"
              :disabled="!form.school_id || loadingBranches"
            >
              <option value="">{{ loadingBranches ? 'Loading branches...' : 'Select Branch' }}</option>
              <option v-for="branch in branches" :key="branch.id" :value="branch.id">
                {{ branch.name }}
              </option>
            </select>
            <div v-if="getFieldError('branch_id')" class="mt-1 text-sm text-red-600 dark:text-red-400 flex items-start">
              <svg class="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              {{ getFieldError('branch_id') }}
            </div>
            <p v-if="branches.length === 0 && !loadingBranches && form.school_id" class="mt-1 text-sm text-red-600">No branches found for this school</p>
          </div>

          <!-- Auto-selected Branch Info (Branch Admin) -->
          <div v-if="userRole === 'branch_admin' && userBranch">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Branch</label>
            <div class="p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
              <p class="text-gray-800 dark:text-gray-200">{{ userBranch.name }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Auto-selected based on your role</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Academic Details -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <span class="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center mr-3">2</span>
          Academic Details
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField 
            id="academic_year_id"
            label="Academic Year"
            required
            :error-message="getFieldError('academic_year_id')"
          >
            <template #default="{ id, class: fieldClass }">
              <select 
                :id="id"
                v-model="form.academic_year_id" 
                :class="fieldClass"
                :disabled="academicsLoading"
              >
                <option value="">Select Academic Year</option>
                <option v-for="year in academicYears" :key="year.id" :value="year.id">
                  {{ year.name }} {{ year.is_current ? '(Current)' : '' }}
                </option>
              </select>
            </template>
          </FormField>
          
          <FormField 
            id="admission_number"
            label="Admission Number"
            required
            :error-message="getFieldError('admission_number')"
          >
            <template #default="{ id, class: fieldClass }">
              <input 
                :id="id"
                v-model="form.admission_number" 
                type="text" 
                :class="fieldClass" 
                placeholder="e.g., ISC-0001" 
              />
            </template>
          </FormField>
          
          <FormField 
            id="roll_number"
            label="Roll Number"
            :error-message="getFieldError('roll_number')"
          >
            <template #default="{ id, class: fieldClass }">
              <input 
                :id="id"
                v-model="form.roll_number" 
                type="text" 
                :class="[fieldClass, { 'border-red-500 focus:border-red-500 focus:ring-red-500': getFieldError('roll_number') }]" 
                placeholder="Student roll number" 
                @input="form.roll_number = form.roll_number.replace(/[^\d]/g, '')"
              />
            </template>
          </FormField>
          
          <FormField 
            id="admission_date"
            label="Admission Date"
            required
            :error-message="getFieldError('admission_date')"
          >
            <template #default="{ id, class: fieldClass }">
              <input 
                :id="id"
                v-model="form.admission_date" 
                type="date" 
                :class="fieldClass" 
              />
            </template>
          </FormField>
          
          <FormField 
            id="class_id"
            label="Class"
            required
            :error-message="getFieldError('class_id')"
          >
            <template #default="{ id, class: fieldClass }">
              <select 
                :id="id"
                v-model="form.class_id" 
                @change="onClassChange" 
                :class="fieldClass"
                :disabled="academicsLoading"
              >
                <option value="">{{ academicsLoading ? 'Loading classes...' : (activeClasses.length === 0 ? 'No classes found' : 'Select Class') }}</option>
                <option v-for="cls in activeClasses" :key="cls.id" :value="cls.id">
                  {{ cls.name }}
                </option>
              </select>
            </template>
          </FormField>
          
          <!-- Stream Selection - Only if class has streams -->
          <FormField 
            v-if="hasStreams"
            id="stream_id"
            label="Stream"
            required
            :error-message="getFieldError('stream_id')"
          >
            <template #default="{ id, class: fieldClass }">
              <select 
                :id="id"
                v-model="form.stream_id" 
                :class="fieldClass"
                :disabled="!form.class_id || streamsLoading" 
                @change="onStreamChange"
              >
                <option value="">{{ streamsLoading ? 'Loading streams...' : (activeStreamsForClass.length === 0 ? 'No streams found' : 'Select Stream') }}</option>
                <option v-for="stream in activeStreamsForClass" :key="stream.id" :value="stream.id">
                  {{ stream.name }} ({{ stream.code }})
                </option>
              </select>
            </template>
          </FormField>
          
          <!-- Section Selection - Only if class/stream has sections -->
          <FormField 
            v-if="hasSections"
            id="section_id"
            :label="hasStreams ? 'Section (for selected stream)' : 'Section'"
            :error-message="getFieldError('section_id')"
          >
            <template #default="{ id, class: fieldClass }">
              <select 
                :id="id"
                v-model="form.section_id" 
                :class="fieldClass"
                :disabled="!form.class_id || sectionsLoading || (hasStreams && !form.stream_id)" 
                @change="onSectionChange"
              >
                <option value="">{{ sectionsLoading ? 'Loading sections...' : (form.class_id && activeSectionsFiltered.length === 0 ? 'No sections found' : (hasStreams && !form.stream_id) ? 'Select stream first' : 'Select Section') }}</option>
                <option v-for="section in activeSectionsFiltered" :key="section.id" :value="section.id">
                  {{ section.name }}
                </option>
              </select>
            </template>
          </FormField>
          <div>
            <label for="category" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select id="category" v-model="form.category" class="input-field" :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': getFieldError('category') }">
              <option value="">Select Category</option>
              <option value="general">General</option>
              <option value="obc">OBC</option>
              <option value="sc">SC</option>
              <option value="st">ST</option>
              <option value="other">Other</option>
            </select>
            <div v-if="getFieldError('category')" class="mt-1 text-sm text-red-600 dark:text-red-400 flex items-start">
              <svg class="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              {{ getFieldError('category') }}
            </div>
          </div>
          <div>
            <label for="admission_type" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Admission Type
            </label>
            <select id="admission_type" v-model="form.admission_type" class="input-field" :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': getFieldError('admission_type') }">
              <option value="">Select Admission Type</option>
              <option value="new">New Admission</option>
              <option value="transfer">Transfer</option>
              <option value="readmission">Readmission</option>
            </select>
            <div v-if="getFieldError('admission_type')" class="mt-1 text-sm text-red-600 dark:text-red-400 flex items-start">
              <svg class="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              {{ getFieldError('admission_type') }}
            </div>
          </div>
        </div>
      </div>

      <!-- Student Details -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <span class="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center mr-3">3</span>
          Student Details
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField 
            id="student.first_name"
            label="First Name"
            required
            :error-message="getFieldError('student.first_name')"
          >
            <template #default="{ id, class: fieldClass }">
              <input 
                :id="id"
                v-model="form.student.first_name" 
                type="text" 
                :class="fieldClass" 
                placeholder="Enter first name" 
              />
            </template>
          </FormField>
          
          <FormField 
            id="student.last_name"
            label="Last Name"
            :error-message="getFieldError('student.last_name')"
          >
            <template #default="{ id, class: fieldClass }">
              <input 
                :id="id"
                v-model="form.student.last_name" 
                type="text" 
                :class="fieldClass" 
                placeholder="Enter last name" 
              />
            </template>
          </FormField>
          <div>
            <label for="student_gender" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Gender <span class="text-red-500">*</span>
            </label>
            <select id="student_gender" v-model="form.student.gender" required class="input-field" :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': getFieldError('student.gender') }">
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <div v-if="getFieldError('student.gender')" class="mt-1 text-sm text-red-600 dark:text-red-400 flex items-start">
              <svg class="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              {{ getFieldError('student.gender') }}
            </div>
          </div>
          <div>
            <label for="student_blood_group" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Blood Group</label>
            <select id="student_blood_group" v-model="form.student.blood_group" class="input-field">
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
            <label for="student_date_of_birth" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date of Birth <span class="text-red-500">*</span>
            </label>
            <input id="student_date_of_birth" v-model="form.student.date_of_birth" type="date" required class="input-field" :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': getFieldError('student.date_of_birth') }" />
            <div v-if="getFieldError('student.date_of_birth')" class="mt-1 text-sm text-red-600 dark:text-red-400 flex items-start">
              <svg class="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              {{ getFieldError('student.date_of_birth') }}
            </div>
          </div>

          <div>
            <label for="student_aadhaar_number" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aadhaar Number</label>
            <input id="student_aadhaar_number" v-model="form.student.aadhaar_number" type="text" class="input-field" placeholder="Enter 12-digit Aadhaar number" maxlength="12" />
            </div>
         
          <div>
            <label for="student_mother_tongue" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mother Tongue</label>
            <input id="student_mother_tongue" v-model="form.student.mother_tongue" type="text" class="input-field" placeholder="Enter mother tongue" />
          </div>
          <div>
            <label for="student_religion" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Religion</label>
            <input id="student_religion" v-model="form.student.religion" type="text" class="input-field" placeholder="Enter religion" />
          </div>
          <div>
            <label for="student_caste" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Caste</label>
            <input id="student_caste" v-model="form.student.caste" type="text" class="input-field" placeholder="Enter caste" />
          </div>
          <div>
            <label for="student_mobile_no" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mobile No
            </label>
            <input 
              id="student_mobile_no"
              v-model="form.student.mobile_no" 
              type="text" 
              class="input-field"
              placeholder="Enter mobile number" 
              @input="form.student.mobile_no = form.student.mobile_no.replace(/[^\d]/g, '')"
             />
          </div>
            <div>
              <label for="student_email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
              <input 
                 id="student_email"
                v-model="form.student.email" 
                type="email" 
                class="input-field"
                placeholder="Enter email address" 
              />
            </div>
          
          <div>
            <label for="student_city" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
            <input id="student_city" v-model="form.student.city" type="text" class="input-field" placeholder="Enter city" />
          </div>
          <div>
            <label for="student_state" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
            <input id="student_state" v-model="form.student.state" type="text" class="input-field" placeholder="Enter state" />
          </div>
          <div class="md:col-span-2">
            <label for="student_address" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
            <textarea id="student_address" v-model="form.student.address" class="input-field" rows="2" placeholder="Enter student address"></textarea>
          </div>

          <div>
            <label for="student_profile_picture" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profile Picture</label>
            <input id="student_profile_picture" ref="studentProfileInput" type="file" accept="image/*" class="input-field" @change="handleFileUpload('student_profile', $event)" />
          </div>
        </div>

        <!-- Student Login Details -->
        <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 class="text-md font-medium text-gray-900 dark:text-white mb-4">Student Login Details</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label for="student_login_username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
              <input id="student_login_username" v-model="form.login.username" type="text" class="input-field" placeholder="Enter username" />
            </div>
            <div>
              <label for="student_login_password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input id="student_login_password" v-model="form.login.password" type="password" class="input-field" placeholder="Enter password" />
            </div>
            <div>
              <label for="student_login_retype_password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Retype Password</label>
              <input id="student_login_retype_password" v-model="form.login.retype_password" type="password" class="input-field" placeholder="Retype password" />
            </div>
          </div>
        </div>
      </div>

      <!-- Previous Exam Details (Junior College) -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <span class="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center mr-3">4</span>
          Previous Exam Details
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Add details of previous examinations (SSC, FYJC, SYJC, etc.)</p>
        
        <!-- Previous Exam Entries -->
        <div v-for="(exam, index) in form.student.previous_exam_details" :key="index" class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-md font-medium text-gray-900 dark:text-white">Exam {{ index + 1 }}</h3>
            <button 
              type="button" 
              @click="removeExamDetail(index)" 
              class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label for="exam_name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exam Name</label>
              <input 
                id="exam_name"
                v-model="exam.exam_name" 
                type="text"   
                class="input-field" 
                placeholder="e.g., SSC, FYJC, SYJC" 
              />
            </div>
            <div>
              <label for="institution" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Institution</label>
              <input 
                id="institution"
                v-model="exam.institution" 
                type="text" 
                class="input-field" 
                placeholder="Institution last attended" 
              />
            </div>
            <div>
              <label for="board_university" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Board/University </label>
              <input 
                id="board_university"
                v-model="exam.board_university" 
                type="text" 
                class="input-field" 
                placeholder="Board or University" 
              />
            </div>
            <div>
              <label for="month_year" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Month & Year</label>
              <input 
                id="month_year"
                v-model="exam.month_year" 
                type="text" 
                class="input-field" 
                placeholder="e.g., March 2023" 
              />
            </div>
            <div>
              <label for="exam_seat_number" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exam Seat Number</label>
              <input 
                id="exam_seat_number"
                v-model="exam.exam_seat_number" 
                type="text" 
                class="input-field" 
                placeholder="Exam seat number" 
              />
            </div>
            <div>
              <label for="class_obtained" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class Obtained</label>
              <input 
                id="class_obtained"
                v-model="exam.class_obtained" 
                type="text" 
                class="input-field" 
                placeholder="e.g., First Class, Distinction" 
              />
            </div>
            <div>
              <label for="attempts" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No. of Attempts</label>
              <input 
                id="attempts"
                v-model.number="exam.attempts" 
                type="number" 
                min="1" 
                class="input-field" 
                placeholder="Number of attempts" 
              />
            </div>
            <div>
              <label for="percentage" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Percentage</label>
              <input 
                id="percentage"
                v-model.number="exam.percentage" 
                type="number" 
                min="0" 
                max="100" 
                step="0.01"
                class="input-field" 
                placeholder="Percentage obtained" 
              />
            </div>
          </div>
        </div>
        
        <!-- Add New Exam Button -->
        <button 
          type="button" 
          @click="addExamDetail" 
          class="w-full py-3 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
        >
          <div class="flex items-center justify-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Add Another Exam Detail
          </div>
        </button>
      </div>



      <!-- Guardian Details -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <span class="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center mr-3">5</span>
          Guardian Details
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label for="guardian_name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name <span class="text-red-500">*</span>
            </label>
            <input 
              id="guardian_name"
              v-model="form.guardian.name" 
              type="text" 
              required 
              class="input-field" 
              placeholder="Enter guardian name" 
            />
          </div>
          <div>
            <label for="guardian_relation" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Relation <span class="text-red-500">*</span>
            </label>
            <select 
              id="guardian_relation"
              v-model="form.guardian.relation" 
              required 
              class="input-field"
            >
              <option value="">Select Relation</option>
              <option value="father">Father</option>
              <option value="mother">Mother</option>
              <option value="guardian">Guardian</option>
              <option value="uncle">Uncle</option>
              <option value="aunt">Aunt</option>
              <option value="grandparent">Grandparent</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label for="father_name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Father Name</label>
            <input 
              id="father_name"
              v-model="form.guardian.father_name" 
              type="text" 
              class="input-field" 
              placeholder="Enter father name" 
            />
          </div>
          <div>
            <label for="mother_name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mother Name</label>
            <input 
              id="mother_name"
              v-model="form.guardian.mother_name" 
              type="text" 
              class="input-field" 
              placeholder="Enter mother name" 
            />
          </div>
          <div>
            <label for="guardian_occupation" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Occupation
            </label>
            <input 
              id="guardian_occupation"
              v-model="form.guardian.occupation" 
              type="text" 
              class="input-field" 
              placeholder="Enter occupation" 
            />
          </div>
          <div>
            <label for="guardian_income" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Income
            </label>
            <input 
              id="guardian_income"
              v-model="form.guardian.income" 
              type="number" 
              class="input-field" 
              placeholder="Enter annual income" 
            />
          </div>
          <div>
            <label for="guardian_education" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Education
            </label>
            <input 
              id="guardian_education"
              v-model="form.guardian.education" 
              type="text" 
              class="input-field" 
              placeholder="Enter education qualification" 
            />
          </div>
          <div>
            <label for="guardian_city" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
            <input 
              id="guardian_city"
              v-model="form.guardian.city" 
              type="text" 
              class="input-field" 
              placeholder="Enter city" 
            />
          </div>
          <div>
            <label for="guardian_state" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
            <input 
              id="guardian_state"
              v-model="form.guardian.state" 
              type="text" 
              class="input-field" 
              placeholder="Enter state" 
            />
          </div>
          <div>
            <label for="guardian_mobile_no" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mobile No <span class="text-red-500">*</span>
            </label>
            <input 
              id="guardian_mobile_no"
              v-model="form.guardian.mobile_no" 
              type="text" 
              required 
              :class="['input-field', { 'border-red-500 focus:border-red-500 focus:ring-red-500': getFieldError('guardian.mobile_no') }]"
              placeholder="Enter mobile number" 
              @input="form.guardian.mobile_no = form.guardian.mobile_no.replace(/[^\d]/g, '')"
            />
            <div v-if="getFieldError('guardian.mobile_no')" class="mt-1 text-sm text-red-600 dark:text-red-400 flex items-start">
              <svg class="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              {{ getFieldError('guardian.mobile_no') }}
            </div>
          </div>
          <FormField 
            id="guardian.email"
            label="Email"
            :error-message="getFieldError('guardian.email')"
          >
            <template #default="{ id, class: fieldClass }">
              <input 
                :id="id"
                v-model="form.guardian.email" 
                type="email" 
                :class="fieldClass" 
                placeholder="Enter email address" 
              />
            </template>
          </FormField>

          <div>
            <label for="guardian_picture" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Guardian Picture</label>
            <input id="guardian_picture" ref="guardianPictureInput" type="file" accept="image/*" class="input-field" @change="handleFileUpload('guardian_picture', $event)" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address <span class="text-red-500">*</span>
            </label>
            <textarea v-model="form.guardian.address" required class="input-field" rows="2" placeholder="Enter address"></textarea>
          </div>
        </div>

        <!-- Guardian Login Details -->
        <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 class="text-md font-medium text-gray-900 dark:text-white mb-4">Guardian Login Details</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label for="guardian_login_username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
              <input 
                id="guardian_login_username"
                v-model="form.guardian.login.username" 
                type="text" 
                class="input-field" 
                placeholder="Enter username" 
              />
            </div>
            <div>
              <label for="guardian_login_password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input 
                id="guardian_login_password"
                v-model="form.guardian.login.password" 
                type="password" 
                class="input-field" 
                placeholder="Enter password" 
              />
            </div>
            <div>
              <label for="guardian_login_retype_password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Retype Password</label>
              <input 
                id="guardian_login_retype_password"
                v-model="form.guardian.login.retype_password" 
                type="password" 
                class="input-field" 
                placeholder="Retype password" 
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-end space-x-4">
        <button type="button" @click="resetForm" class="btn-secondary">
          Reset Form
        </button>
        <button type="submit" :disabled="loading" class="btn-primary">
          <span v-if="loading" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isEditing ? 'Updating Student...' : 'Creating Student...' }}
          </span>
          <span v-else>{{ isEditing ? 'Update Student' : 'Create Student' }}</span>
        </button>
      </div>
    </form>

    <!-- Toast Notification -->
    <div v-if="showToast" class="fixed top-4 right-4 z-50">
      <div :class="['p-4 rounded-lg shadow-lg', toastType === 'success' ? 'bg-green-500' : 'bg-red-500']">
        <p class="text-white">{{ toastMessage }}</p>
      </div>
    </div>
  </div>
</template> 

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { useAuth } from '~/composables/useAuth';
import { useAcademics } from '~/composables/useAcademics';
import { useBranches } from '~/composables/useBranches';
import { useSchools } from '~/composables/useSchools';
import { fetchStreamsAPI } from '~/api/streams';
import { useToast } from '~/composables/useToast';
import { Students } from '~/api';
import { useRoute, useRouter } from 'vue-router';

// Props
const props = defineProps({
  isEditing: Boolean,
  studentId: {
    type: [String, Number],
    default: null
  },
  initialData: {
    type: Object,
    default: () => ({})
  },
  redirectTo: {
    type: String,
    default: '/students'
  },
  isAdmission: {
    type: Boolean,
    default: false
  }
});

// Router
const route = useRoute();
const router = useRouter();

// Auth context
const { user } = useAuth();
const userRole = computed(() => user.value?.role);

// Check if selected class has streams enabled
const hasStreams = computed(() => {
  if (!form.class_id) return false;
  const hasStreamsResult = activeStreamsForClass.value.length > 0;
  console.log('🔍 hasStreams computed - class_id:', form.class_id, 'activeStreamsForClass.length:', activeStreamsForClass.value.length, 'result:', hasStreamsResult);
  return hasStreamsResult;
});

// Check if selected class/stream has sections
const hasSections = computed(() => {
  if (!form.class_id) return false;
  return activeSectionsFiltered.value.length > 0;
});

// Active streams for the selected class - now handled by useAcademics composable

// Active streams filtered for the selected class
const activeStreamsForClass = computed(() => {
  if (!form.class_id) return [];
  console.log('🔍 activeStreamsForClass computed - class_id:', form.class_id, 'all streams:', activeStreams.value.length);
  console.log('🔍 All streams before filtering:', activeStreams.value.map(s => ({ id: s.id, name: s.name, code: s.code, class_id: s.class_id, class: s.class })));
  
  const filteredStreams = activeStreams.value.filter(stream => {
    // Check both direct class_id and nested class.id
    const streamClassId = stream.class_id || stream.class?.id;
    const matches = streamClassId === form.class_id && stream.is_active !== false;
    console.log('🔍 Stream filtering - stream:', stream.name, 'streamClassId:', streamClassId, 'form.class_id:', form.class_id, 'matches:', matches);
    return matches;
  });
  
  console.log('🔍 filtered streams:', filteredStreams.length);
  console.log('🔍 filtered streams:', filteredStreams.map(s => ({ id: s.id, name: s.name, code: s.code, class_id: s.class_id, class: s.class })));
  return filteredStreams;
});

// Active sections filtered by stream (if stream is selected)
const activeSectionsFiltered = computed(() => {
  let filteredSections = activeSections.value;
  
  // If a stream is selected, filter sections by stream
  if (form.stream_id) {
    filteredSections = filteredSections.filter(section => section.stream_id === form.stream_id);
  }
  
  return filteredSections;
});

// Academic data
const {
  academicYears,
  classes,
  streams,
  sections,
  loading: academicsLoading,
  fetchAcademicYears,
  fetchClasses,
  fetchStreams,
  fetchSections,
  loadSectionsByClass,
  loadStreamsByClass,
  currentAcademicYear,
  activeAcademicYears,
  activeClasses,
  activeStreams,
  activeSections,
} = useAcademics();

// Branch/School data
const { schools, fetchSchools } = useSchools();
const { branches, fetchBranches } = useBranches();

// Toast
const { showSuccess, showError } = useToast();

// Form validation
const {
  fieldErrors,
  isSubmitting,
  hasErrors,
  errorCount,
  validationState,
  clearErrors,
  clearFieldError,
  setFieldError,
  setFieldErrors,
  handleApiError,
  hasFieldError,
  getFieldError,
  getAllErrors,
  getCategorizedErrors
} = useFormValidation();

// Form state
const loading = ref(false);
const sectionsLoading = ref(false);
const streamsLoading = ref(false);
const loadingSchools = ref(false);
const loadingBranches = ref(false);
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
const userBranch = ref(null);

// Streams data - now handled by useAcademics composable

// Form data
const form = reactive({
  // Branch selection (for super admin)
  school_id: user.value?.school_id || '',
  branch_id: user.value?.branch_id || '',

  // Academic details
  academic_year_id: '',
  admission_number: '',
  roll_number: '',
  admission_date: new Date().toISOString().split('T')[0],
  class_id: '',
  stream_id: '',
  section_id: '',
  category: '',
  admission_type: '',
  
  // Temporary fields for mapping names to IDs in edit mode
  _temp_class_name: '',
  _temp_section_name: '',
  _temp_stream_name: '',
  _temp_academic_year_name: '',

  // Student details
  student: {
    first_name: '',
    last_name: '',
    gender: '',
    blood_group: '',
    date_of_birth: '',
    mother_tongue: '',
    religion: '',
    caste: '',
    mobile_no: '',
    email: '',
    city: '',
    state: '',
    address: '',
    profile_picture: null,
    aadhaar_number: '',
    previous_exam_details: [],
  },

  // Login details
  login: {
    username: '',
    password: '',
    retype_password: '',
  },

  // Guardian details
  guardian: {
    name: '',
    relation: '',
    father_name: '',
    mother_name: '',
    occupation: '',
    income: '',
    education: '',
    city: '',
    state: '',
    mobile_no: '',
    email: '',
    address: '',
    picture: null,
    login: {
      username: '',
      password: '',
      retype_password: '',
    },
  },
});

// Track if user has manually changed class/section
const userChangedClass = ref(false);
const userChangedSection = ref(false);

// If editing, populate form with initialData
watch(() => props.initialData, async (newData) => {
  if (props.isEditing && newData && Object.keys(newData).length > 0) {
    // Set flag to prevent change handlers from interfering
    isSettingFormValues.value = true;
    console.log('🔍 Setting isSettingFormValues to true for initial data loading');
    
    // Academic details
    if (newData.school_id) form.school_id = newData.school_id;
    if (newData.branch_id) form.branch_id = newData.branch_id;
    if (newData.admission_number) form.admission_number = newData.admission_number;
    if (newData.roll_number) {
      form.roll_number = newData.roll_number;
      console.log('🔍 Set roll_number from initial data:', newData.roll_number);
    }
    if (newData.admission_date) {
      const date = new Date(newData.admission_date);
      form.admission_date = date.toISOString().split('T')[0];
    }
    if (newData.category) form.category = newData.category;
    
    // Use class and section IDs directly from API response if available
    if (newData.class_id) {
      form.class_id = newData.class_id;
      console.log('🔍 Set class_id directly from API field:', newData.class_id);
    } else if (newData.class && newData.class.id) {
      form.class_id = newData.class.id;
      console.log('🔍 Set class_id from class association:', newData.class.id);
    } else if (newData.current_class) {
      form._temp_class_name = newData.current_class;
      console.log('🔍 Set temp class name:', newData.current_class);
    }
    
    // Debug: Log the full student data structure to see what's available
    console.log('🔍 Full student data structure:', {
      class_id: newData.class_id,
      class: newData.class,
      stream_id: newData.stream_id,
      stream: newData.stream,
      section_id: newData.section_id,
      section: newData.section,
      sectionInfo: newData.sectionInfo
    });
    
    // Handle stream_id mapping
    if (newData.stream_id) {
      form.stream_id = newData.stream_id;
      console.log('🔍 Set stream_id directly from API field:', newData.stream_id);
    } else if (newData.stream && newData.stream.id) {
      form.stream_id = newData.stream.id;
      console.log('🔍 Set stream_id from stream association:', newData.stream.id);
    } else if (newData.stream) {
      form._temp_stream_name = newData.stream;
      console.log('🔍 Set temp stream name:', newData.stream);
    }
    
    if (newData.section_id) {
      form.section_id = newData.section_id;
      console.log('🔍 Set section_id directly from API field:', newData.section_id);
    } else if (newData.sectionInfo && newData.sectionInfo.id) {
      form.section_id = newData.sectionInfo.id;
      console.log('🔍 Set section_id from sectionInfo association:', newData.sectionInfo.id);
    } else if (newData.section) {
      form._temp_section_name = newData.section;
      console.log('🔍 Set temp section name:', newData.section);
    }
    
    // If we have class_id but no temp names, we need to load sections for the dropdown
    if (form.class_id && !form._temp_class_name && !form._temp_section_name) {
      console.log('🔍 Class ID set directly, will load sections after academic data is loaded');
    }
    
    // If we have class_id and stream_id but no temp names, we need to load streams for the dropdown
    if (form.class_id && form.stream_id && !form._temp_class_name && !form._temp_stream_name) {
      console.log('🔍 Class ID and stream_id set directly, will load streams after academic data is loaded');
    }
    
    if (newData.academic_year) {
      form._temp_academic_year_name = newData.academic_year;
      console.log('🔍 Set temp academic year name:', newData.academic_year);
    }
    
    // Also set academic_year_id if available (for backward compatibility)
    if (newData.academic_year_id) {
      form.academic_year_id = newData.academic_year_id;
      console.log('🔍 Set academic_year_id directly:', newData.academic_year_id);
    }
    
    // Student details
    if (newData.first_name) form.student.first_name = newData.first_name;
    if (newData.last_name) form.student.last_name = newData.last_name;
    if (newData.gender) form.student.gender = newData.gender;
    if (newData.blood_group) form.student.blood_group = newData.blood_group;
    if (newData.date_of_birth) {
      const date = new Date(newData.date_of_birth);
      form.student.date_of_birth = date.toISOString().split('T')[0];
    }
    if (newData.mother_tongue) form.student.mother_tongue = newData.mother_tongue;
    if (newData.religion) form.student.religion = newData.religion;
    if (newData.caste) form.student.caste = newData.caste;
    if (newData.phone) form.student.mobile_no = newData.phone;
    if (newData.email) form.student.email = newData.email;
    if (newData.city) form.student.city = newData.city;
    if (newData.state) form.student.state = newData.state;
    if (newData.address) form.student.address = newData.address;
    if (newData.aadhaar_number) form.student.aadhaar_number = newData.aadhaar_number;
    
    if (newData.previous_exam_details) {
      // Handle both string and array formats
      if (typeof newData.previous_exam_details === 'string') {
        try {
          form.student.previous_exam_details = JSON.parse(newData.previous_exam_details);
        } catch (e) {
          console.warn('Failed to parse previous_exam_details JSON:', e);
          form.student.previous_exam_details = [];
        }
      } else {
        form.student.previous_exam_details = newData.previous_exam_details || [];
      }
    }
    
    // Guardian details
    if (newData.parents && newData.parents.length > 0) {
      const parent = newData.parents[0];
      
      if (parent) {
        // Set guardian name based on relation
        if (parent.guardian_name) {
          form.guardian.name = parent.guardian_name;
          form.guardian.relation = parent.guardian_relation || 'guardian';
        } else if (parent.father_name) {
          form.guardian.name = parent.father_name;
          form.guardian.relation = 'father';
        } else if (parent.mother_name) {
          form.guardian.name = parent.mother_name;
          form.guardian.relation = 'mother';
        }
        
        form.guardian.father_name = parent.father_name || '';
        form.guardian.mother_name = parent.mother_name || '';
        form.guardian.occupation = parent.father_occupation || parent.mother_occupation || '';
        form.guardian.income = parent.father_income || parent.mother_income || '';
        form.guardian.education = parent.father_qualification || parent.mother_qualification || '';
        form.guardian.city = parent.city || '';
        form.guardian.state = parent.state || '';
        form.guardian.mobile_no = parent.father_phone || parent.mother_phone || parent.guardian_phone || '';
        form.guardian.email = parent.father_email || parent.mother_email || parent.guardian_email || '';
        form.guardian.address = parent.address || '';
      }
    }
    
    // Set admission type
    if (newData.admission_type) {
      form.admission_type = newData.admission_type;
    } else {
      let documents = {};
      if (newData.documents) {
        // Handle both string and object formats
        if (typeof newData.documents === 'string') {
          try {
            documents = JSON.parse(newData.documents);
          } catch (e) {
            console.warn('Failed to parse documents JSON:', e);
            documents = {};
          }
        } else {
          documents = newData.documents;
        }
      }
      form.admission_type = documents.transfer_certificate ? 'transfer' : 'new';
    }
    
    // If we have school and branch info, load academic data for mapping
    if (props.isEditing && form.school_id && form.branch_id) {
      try {
        await loadAcademicData();
        
        // If we have temp names, map them to IDs
        if (form._temp_class_name || form._temp_section_name || form._temp_stream_name || form._temp_academic_year_name) {
          console.log('🔍 Initial data loaded, mapping names to IDs');
          await mapClassAndSectionNames();
        }
        // If we have class_id directly, always load sections for dropdown
        else if (form.class_id) {
          console.log('🔍 Class ID set directly, loading sections for dropdown');
          
          // Always load streams for the class to show dropdown (even if student doesn't have stream_id)
          console.log('🔍 Loading streams for class to show dropdown');
          await loadStreamsByClass(form.class_id, form.school_id, form.branch_id);
          console.log('🔍 Streams loaded for dropdown:', streams.value.length);
          
          await loadSectionsByClass(form.class_id, form.school_id, form.branch_id);
          console.log('🔍 Sections loaded for dropdown:', sections.value.length);
          
          // Small delay to ensure sections are fully loaded before resetting the flag
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error('Failed to load academic data for mapping:', error);
      }
    }
    
    // Reset the flag after initial data loading is complete
    isSettingFormValues.value = false;
    console.log('🔍 Setting isSettingFormValues to false after initial data loading');
  }
}, { immediate: true });

// File upload handler
const handleFileUpload = (type, event) => {
  const file = event.target.files[0];
  if (file) {
    if (type === 'student_profile') {
      form.student.profile_picture = file;
    } else if (type === 'guardian_picture') {
      form.guardian.picture = file;
    }
  }
};

// Add new exam detail
const addExamDetail = () => {
  form.student.previous_exam_details.push({
    exam_name: '',
    institution: '',
    board_university: '',
    month_year: '',
    exam_seat_number: '',
    class_obtained: '',
    attempts: 1,
    percentage: 0,
  });
};

// Remove exam detail
const removeExamDetail = (index) => {
  form.student.previous_exam_details.splice(index, 1);
};

// School change handler
const onSchoolChange = async () => {
  console.log('🔍 onSchoolChange called with school_id:', form.school_id);
  form.branch_id = '';
  form.class_id = '';
  form.section_id = '';
  if (form.school_id) {
    loadingBranches.value = true;
    try {
      await fetchBranches(form.school_id);
      console.log('🔍 Branches loaded:', branches.value.length);
      // Only auto-select branch if in edit mode
      if (branches.value.length === 1 && props.isEditing) {
        form.branch_id = branches.value[0].id;
        console.log('🔍 Auto-selecting single branch (edit mode):', form.branch_id);
        await onBranchChange();
      }
    } catch (error) {
      showError('Failed to load branches');
    } finally {
      loadingBranches.value = false;
    }
  }
};

// Branch change handler
const onBranchChange = async () => {
  console.log('🔍 StudentForm onBranchChange called with branch_id:', form.branch_id, 'isSettingFormValues:', isSettingFormValues.value);
  
  // Skip clearing values if we're setting form values (edit mode initialization)
  if (!isSettingFormValues.value) {
    form.class_id = '';
    form.section_id = '';
    form.stream_id = '';
  }
  
  if (form.branch_id) {
    try {
      console.log('🔍 Loading academic data for branch:', form.branch_id);
      await loadAcademicData();
      console.log('🔍 Academic data loaded - Years:', academicYears.value?.length, 'Classes:', classes.value?.length, 'Active Classes:', activeClasses.value?.length);
      
      // Debug: Log all classes to see what's available
      console.log('🔍 All classes:', classes.value);
      console.log('🔍 Active classes:', activeClasses.value);
      
      if (academicYears.value && academicYears.value.length > 0) {
        const currentYear = academicYears.value.find(y => y.is_current) || academicYears.value[0];
        if (currentYear) {
          form.academic_year_id = currentYear.id;
          console.log('🔍 Set academic year:', form.academic_year_id);
        }
      }
      
      // Only auto-select class if in edit mode
      if (classes.value && classes.value.length === 1 && props.isEditing) {
        form.class_id = classes.value[0].id;
        console.log('🔍 Auto-selecting single class (edit mode):', form.class_id);
        await onClassChange(true); // Mark as auto-selection
      }
    } catch (error) {
      console.error('❌ Error loading academic data:', error);
      showError('Failed to load academic data');
    }
  } else {
    // Clear classes when no branch is selected
    classes.value = [];
    sections.value = [];
    streams.value = [];
  }
};

// Load streams for the selected class - now handled by useAcademics composable

// Class change handler
const onClassChange = async (isAutoSelection = false) => {
  console.log('🔍 onClassChange called with class_id:', form.class_id, 'isAutoSelection:', isAutoSelection, 'isSettingFormValues:', isSettingFormValues.value);
  
  // Skip processing if we're setting form values (edit mode initialization)
  if (isSettingFormValues.value) {
    console.log('🔍 Skipping onClassChange during form initialization');
    return;
  }
  
  // Only mark as user-changed if it's not an auto-selection
  if (!isAutoSelection) {
    userChangedClass.value = true;
    console.log('🔍 Marked class as user-changed');
  }
  
  // Clear section_id and stream_id when class changes (not during initialization)
  if (!isAutoSelection && !isSettingFormValues.value) {
    form.section_id = '';
    form.stream_id = '';
    userChangedSection.value = false; // Reset section flag since class changed
  }
  
  if (form.class_id) {
    sectionsLoading.value = true;
    streamsLoading.value = true;
    try {
      // Always load streams for the selected class
      console.log('🔍 Loading streams for class:', form.class_id, 'school:', form.school_id, 'branch:', form.branch_id);
      await loadStreamsByClass(form.class_id, form.school_id, form.branch_id);
      console.log('🔍 Streams loaded:', streams.value?.length);
      console.log('🔍 All streams data:', streams.value);
      
      // Load sections for this class
      await loadSectionsByClass(form.class_id, form.school_id, form.branch_id);
      console.log('🔍 Sections loaded:', sections.value?.length);
      
      // If no sections found, try without branch_id (for super admin or cross-branch sections)
      if (!sections.value || sections.value.length === 0) {
        await loadSectionsByClass(form.class_id, form.school_id, null);
        console.log('🔍 Sections loaded (without branch):', sections.value?.length);
      }
      
      // Auto-select section if only one section is available and no streams
      if (activeStreamsForClass.value.length === 0 && activeSectionsFiltered.value && activeSectionsFiltered.value.length === 1 && !isSettingFormValues.value) {
        form.section_id = activeSectionsFiltered.value[0].id;
        console.log('🔍 Auto-selecting single section for class without streams:', form.section_id);
      }
    } catch (error) {
      console.error('❌ Error loading academic data:', error);
      showError('Failed to load academic data');
    } finally {
      sectionsLoading.value = false;
      streamsLoading.value = false;
    }
  } else {
    sections.value = [];
    streams.value = [];
  }
};

// Stream change handler
const onStreamChange = async () => {
  console.log('🔍 onStreamChange called with stream_id:', form.stream_id, 'isSettingFormValues:', isSettingFormValues.value);
  
  // Only mark as user-changed if not setting form values
  if (!isSettingFormValues.value) {
    userChangedSection.value = true;
    console.log('🔍 Marked stream as user-changed');
  }
  
  // Clear section when stream changes
  if (!isSettingFormValues.value) {
    form.section_id = '';
  }
  
  // If stream is selected and we have sections loaded, filter them by stream
  if (form.stream_id && sections.value && sections.value.length > 0) {
    console.log('🔍 Filtering sections by stream:', form.stream_id);
    // The activeSectionsFiltered computed property will automatically filter by stream_id
    console.log('🔍 Sections after stream filter:', activeSectionsFiltered.value.length);
    
    // Auto-select section if only one section is available for this stream
    if (activeSectionsFiltered.value.length === 1 && !isSettingFormValues.value) {
      form.section_id = activeSectionsFiltered.value[0].id;
      console.log('🔍 Auto-selecting single section for stream:', form.section_id);
    }
  }
};

// Section change handler
const onSectionChange = () => {
  console.log('🔍 onSectionChange called, isSettingFormValues:', isSettingFormValues.value);
  // Only mark as user-changed if not setting form values
  if (!isSettingFormValues.value) {
    userChangedSection.value = true;
    console.log('🔍 Marked section as user-changed');
  }
};

// Load academic data
const loadAcademicData = async () => {
  try {
    if (!form.school_id || !form.branch_id) {
      console.log('🔍 loadAcademicData: Missing school_id or branch_id');
      return;
    }
    console.log('🔍 loadAcademicData: Loading for school_id:', form.school_id, 'branch_id:', form.branch_id);
    academicsLoading.value = true;
    
    // Load academic years and classes in parallel
    const [academicYearsResult, classesResult] = await Promise.all([
      fetchAcademicYears(form.school_id),
      fetchClasses(form.school_id, form.branch_id)
    ]);
    
    console.log('🔍 loadAcademicData: Academic years loaded:', academicYears.value?.length);
    console.log('🔍 loadAcademicData: Classes loaded:', classes.value?.length);
    console.log('🔍 loadAcademicData: Active classes:', activeClasses.value?.length);
    
    // Set current academic year if available
    if (academicYears.value?.length > 0) {
      const currentYear = academicYears.value.find(y => y.is_current) || academicYears.value[0];
      if (currentYear) {
        form.academic_year_id = currentYear.id;
        console.log('🔍 loadAcademicData: Set academic year:', form.academic_year_id);
      }
    }
    
    // Don't auto-select class in create mode - let user choose
    // Auto-selection only happens in edit mode through onBranchChange
  } catch (error) {
    console.error('❌ loadAcademicData error:', error);
    showError('Failed to load academic data');
  } finally {
    academicsLoading.value = false;
  }
};

// Validation functions for numeric fields
const validateRollNumber = () => {
  clearFieldError('roll_number');
  if (form.roll_number && form.roll_number < 1) {
    setFieldError('roll_number', 'Roll number must be a positive number');
  }
};

const validateMobileNumber = () => {
  clearFieldError('student.mobile_no');
  if (form.student.mobile_no) {
    const mobileStr = form.student.mobile_no.toString();
    if (mobileStr.length < 10 || mobileStr.length > 12) {
      setFieldError('student.mobile_no', 'Mobile number must be between 10 and 12 digits');
    } else if (mobileStr.length === 10 && !mobileStr.startsWith('6') && !mobileStr.startsWith('7') && !mobileStr.startsWith('8') && !mobileStr.startsWith('9')) {
      setFieldError('student.mobile_no', 'Mobile number should start with 6, 7, 8, or 9');
    }
  }
};

const validateGuardianMobileNumber = () => {
  clearFieldError('guardian.mobile_no');
  if (form.guardian.mobile_no) {
    const mobileStr = form.guardian.mobile_no.toString();
    if (mobileStr.length < 10 || mobileStr.length > 12) {
      setFieldError('guardian.mobile_no', 'Mobile number must be between 10 and 12 digits');
    } else if (mobileStr.length === 10 && !mobileStr.startsWith('6') && !mobileStr.startsWith('7') && !mobileStr.startsWith('8') && !mobileStr.startsWith('9')) {
      setFieldError('guardian.mobile_no', 'Mobile number should start with 6, 7, 8, or 9');
    }
  }
};

// Form validation (same as admission form)
const validateForm = () => {
  // Validate numeric fields
  validateRollNumber();
  validateMobileNumber();
  validateGuardianMobileNumber();
  
  if (form.login.username || form.login.password || form.login.retype_password) {
    if (!form.login.username) {
      showError('Student username is required if providing login details');
      return false;
    }
    if (!form.login.password) {
      showError('Student password is required if providing login details');
      return false;
    }
    if (!form.login.retype_password) {
      showError('Student password confirmation is required if providing login details');
      return false;
    }
    if (form.login.password !== form.login.retype_password) {
      showError('Student login passwords do not match');
      return false;
    }
  }
  if (form.guardian.login.username || form.guardian.login.password || form.guardian.login.retype_password) {
    if (!form.guardian.login.username) {
      showError('Guardian username is required if providing login details');
      return false;
    }
    if (!form.guardian.login.password) {
      showError('Guardian password is required if providing login details');
      return false;
    }
    if (!form.guardian.login.retype_password) {
      showError('Guardian password confirmation is required if providing login details');
      return false;
    }
    if (form.guardian.login.password !== form.guardian.login.retype_password) {
      showError('Guardian login passwords do not match');
      return false;
    }
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (form.student.email && !emailRegex.test(form.student.email)) {
    showError('Please enter a valid student email address');
    return false;
  }
  if (form.guardian.email && !emailRegex.test(form.guardian.email)) {
    showError('Please enter a valid guardian email address');
    return false;
  }
  return true;
};

// Email validation function
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Form submission
const handleSubmit = async () => {
  // Clear any previous errors
  clearErrors();
  
  // Validate mandatory fields - Academic Details
  if (!form.branch_id) {
    setFieldError('branch_id', 'Branch is required');
  }

  if (!form.academic_year_id) {
    setFieldError('academic_year_id', 'Academic year is required');
  }

  if (!form.admission_number) {
    setFieldError('admission_number', 'Admission number is required');
  }
  if (!form.admission_date) {
    setFieldError('admission_date', 'Admission date is required');
  }
  if (!form.class_id) {
    setFieldError('class_id', 'Class is required');
  }
  
  // Validate stream if class has streams
  if (hasStreams.value && !form.stream_id) {
    setFieldError('stream_id', 'Stream is required for this class');
  }
  
  // Section is now optional - no validation required

  
  // Validate mandatory fields - Student Details
  if (!form.student.first_name) {
    setFieldError('student.first_name', 'First name is required');
  }
  if (!form.student.gender) {
    setFieldError('student.gender', 'Gender is required');
  }
  if (!form.student.date_of_birth) {
    setFieldError('student.date_of_birth', 'Date of birth is required');
  }
  
  // Validate mandatory fields - Guardian Details
  if (!form.guardian.name) {
    setFieldError('guardian.name', 'Guardian name is required');
  }
  if (!form.guardian.relation) {
    setFieldError('guardian.relation', 'Guardian relation is required');
  }

  if (!form.guardian.mobile_no) {
    setFieldError('guardian.mobile_no', 'Guardian mobile number is required');
  }

  if (!form.guardian.address) {
    setFieldError('guardian.address', 'Guardian address is required');
  }
  
  // Validate email formats (only if provided)
  if (form.student.email && !isValidEmail(form.student.email)) {
    setFieldError('student.email', 'Please enter a valid email address');
  }
  if (form.guardian.email && !isValidEmail(form.guardian.email)) {
    setFieldError('guardian.email', 'Please enter a valid email address');
  }
  
  // Check if there are any validation errors
  if (hasErrors.value) {
    // Scroll to validation summary and show toast
    await nextTick();
    scrollToValidationSummary();
    showError(`Please fix ${errorCount.value} validation error${errorCount.value > 1 ? 's' : ''} below`);
    return;
  }

  loading.value = true;
  isSubmitting.value = true;
  
  try {
    const formData = new FormData();
    
    // Prepare data structure
    const dataStructure = {
      school_id: form.school_id,
      branch_id: form.branch_id,
      academic_year_id: form.academic_year_id,
      admission_number: form.admission_number,
      roll_number: form.roll_number,
      admission_date: form.admission_date,
      class_id: form.class_id,
      stream_id: form.stream_id,
      section_id: form.section_id,
      category: form.category,
      admission_type: form.admission_type,
      student: { 
        ...form.student,
        category: form.category, // Add category to student object
        admission_date: form.admission_date, // Add admission_date to student object
      },
      login: form.login,
      guardian: { ...form.guardian },
    };
    
    console.log('🔍 Form submission - roll_number:', form.roll_number);
    console.log('🔍 Form submission - dataStructure:', dataStructure);
    
    // Always use student API since admissions are now handled through student creation
    formData.append('studentData', JSON.stringify(dataStructure));
    
    if (form.student.profile_picture) {
      formData.append('student_profile_picture', form.student.profile_picture);
    }
    if (form.guardian.picture) {
      formData.append('guardian_picture', form.guardian.picture);
    }
    
    let response;
    if (props.isEditing && props.studentId) {
      response = await Students.updateWithFormData(props.studentId, formData);
    } else {
      response = await Students.createWithFormData(formData);
    }
    if (response.success) {
      showSuccess(`Student ${props.isEditing ? 'updated' : 'created'} successfully!`);
      
      // If updating, update form with response data instead of resetting
      if (props.isEditing && response.data) {
        await updateFormWithResponseData(response.data);
      } else {
        resetForm();
      }
      
      setTimeout(() => {
        router.push(props.redirectTo);
      }, 2000);
    } else {
      // Handle API validation errors
      console.error('❌ API returned error response:', response);
      
      if (response.errors && typeof response.errors === 'object') {
        setFieldErrors(response.errors);
      }
      
      // Show error message and scroll to validation summary
      const errorMessage = response.message || response.error || `Failed to ${props.isEditing ? 'update' : 'create'} student`;
      showError(errorMessage);
      
      // Scroll to validation summary if there are field errors
      if (response.errors && Object.keys(response.errors).length > 0) {
        await nextTick();
        scrollToValidationSummary();
      }
    }
  } catch (error) {
    // Handle network or other errors
    console.error('❌ Form submission error:', error);
    
    // Extract error message from different error formats
    let errorMessage = `An error occurred while ${props.isEditing ? 'updating' : 'creating'} the student`;
    
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;
      
      console.error('❌ Server error response:', { status, data });
      
      if (data && data.message) {
        errorMessage = data.message;
      } else if (data && data.error) {
        errorMessage = data.error;
      } else if (status === 500) {
        errorMessage = 'Server error occurred. Please try again or contact support.';
      } else if (status === 400) {
        errorMessage = 'Invalid request. Please check your input and try again.';
      } else if (status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
      } else if (status === 404) {
        errorMessage = 'Resource not found.';
      } else {
        errorMessage = `Server error (${status}). Please try again.`;
      }
      
      // Handle field-specific errors
      if (data && data.errors && typeof data.errors === 'object') {
        setFieldErrors(data.errors);
      }
    } else if (error.request) {
      // Network error
      errorMessage = 'Network error. Please check your connection and try again.';
    } else if (error.message) {
      // Other error
      errorMessage = error.message;
    }
    
    // Show the error message
    showError(errorMessage);
    
    // Also handle API errors for field validation
    handleApiError(error);
    
    // Scroll to validation summary if there are field errors
    if (hasErrors.value) {
      await nextTick();
      scrollToValidationSummary();
    }
  } finally {
    loading.value = false;
    isSubmitting.value = false;
  }
};

// Scroll to validation summary when errors occur
const scrollToValidationSummary = () => {
  const validationSummary = document.querySelector('[data-validation-summary]');
  if (validationSummary) {
    validationSummary.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
    
    // Add a subtle highlight effect
    validationSummary.style.transition = 'box-shadow 0.3s ease';
    validationSummary.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.3)';
    setTimeout(() => {
      validationSummary.style.boxShadow = '';
    }, 2000);
  }
  
  // Focus on the first error field if possible
  focusFirstErrorField();
};

// Focus on the first error field
const focusFirstErrorField = () => {
  // Get the first field with an error
  const firstErrorField = document.querySelector('.border-red-500');
  if (firstErrorField) {
    // Add a subtle focus effect
    firstErrorField.style.transition = 'box-shadow 0.3s ease';
    firstErrorField.style.boxShadow = '0 0 0 2px rgba(239, 68, 68, 0.4)';
    
    // Focus the field
    firstErrorField.focus();
    
    // Remove the highlight after 3 seconds
    setTimeout(() => {
      firstErrorField.style.boxShadow = '';
    }, 3000);
  }
};

// Reset form
const resetForm = () => {
  // Reset user change flags
  userChangedClass.value = false;
  userChangedSection.value = false;
  hasMappedNames.value = false; // Reset mapping flag
  isMappingNames.value = false; // Reset mapping flag
  isSettingFormValues.value = false; // Reset form values flag
  mappingRetryCount.value = 0; // Reset retry count
  
  Object.assign(form, {
    school_id: user.value?.school_id || '',
    branch_id: user.value?.branch_id || '',
    academic_year_id: '',
    admission_number: '',
    roll_number: '',
    admission_date: new Date().toISOString().split('T')[0],
    class_id: '',
    section_id: '',
    category: '',
    admission_type: '',
    _temp_class_name: '',
    _temp_section_name: '',
    _temp_stream_name: '',
    _temp_academic_year_name: '',
    student: {
      first_name: '',
      last_name: '',
      gender: '',
      blood_group: '',
      date_of_birth: '',
      mother_tongue: '',
      religion: '',
      caste: '',
      mobile_no: '',
      email: '',
      city: '',
      state: '',
      address: '',
      profile_picture: null,
      aadhaar_number: '',

      previous_exam_details: [],
    },
    login: {
      username: '',
      password: '',
      retype_password: '',
    },
    guardian: {
      name: '',
      relation: '',
      father_name: '',
      mother_name: '',
      occupation: '',
      income: '',
      education: '',
      city: '',
      state: '',
      mobile_no: '',
      email: '',
      address: '',
      picture: null,
      login: {
        username: '',
        password: '',
        retype_password: '',
      },
    },
  });
};

// Auto-hide toast
watch(showToast, (newValue) => {
  if (newValue) {
    setTimeout(() => {
      showToast.value = false;
    }, 5000);
  }
});

// Watch for form data changes in edit mode to load academic data
watch([() => form.school_id, () => form.branch_id], async ([newSchoolId, newBranchId], [oldSchoolId, oldBranchId]) => {
  if (props.isEditing && newSchoolId && newBranchId && (!oldSchoolId || !oldBranchId)) {
    console.log('🔍 Loading academic data for edit mode');
    hasMappedNames.value = false; // Reset the flag when school/branch changes
    isMappingNames.value = false; // Reset the mapping flag
    isSettingFormValues.value = false; // Reset the form values flag
    await loadAcademicData();
    // Map class and section names to IDs after loading academic data
    await mapClassAndSectionNames();
  }
}, { immediate: false });

// Watch for branch changes in create mode
watch(() => form.branch_id, async (newBranchId, oldBranchId) => {
  if (!props.isEditing && newBranchId && newBranchId !== oldBranchId) {
    console.log('🔍 Branch changed in create mode:', oldBranchId, '->', newBranchId);
    await onBranchChange();
  }
}, { immediate: false });

// Watch for initial data changes to reset mapping flags (simplified)
watch(() => props.initialData, async (newData) => {
  if (props.isEditing && newData && Object.keys(newData).length > 0) {
    console.log('🔍 Initial data changed, resetting mapping flags');
    hasMappedNames.value = false;
    isMappingNames.value = false;
    isSettingFormValues.value = false;
    userChangedClass.value = false;
    userChangedSection.value = false;
    mappingRetryCount.value = 0; // Reset retry count
  }
}, { deep: true });

// Track if we've already mapped the names to prevent infinite loops
const hasMappedNames = ref(false);
const isMappingNames = ref(false);
const isSettingFormValues = ref(false);
const mappingRetryCount = ref(0);
const maxMappingRetries = 3;

// Watch for academic data changes to map names to IDs in edit mode (simplified)
watch([() => classes.value, () => sections.value, () => academicYears.value], async () => {
      if (props.isEditing && !hasMappedNames.value && !isMappingNames.value && !isSettingFormValues.value && (form._temp_class_name || form._temp_section_name || form._temp_stream_name || form._temp_academic_year_name)) {
      console.log('🔍 Academic data loaded, mapping names to IDs');
      await mapClassAndSectionNames();
    }
}, { immediate: false });

// Removed HACK watcher to prevent conflicts

// Watch for when class_id is set directly to load sections (only in edit mode)
watch(() => form.class_id, async (newClassId, oldClassId) => {
  console.log('🔍 Class ID changed from', oldClassId, 'to', newClassId, 'isSettingFormValues:', isSettingFormValues.value);
  // Only load sections if this is a real change (not during initialization) and we're in edit mode
  if (props.isEditing && newClassId && newClassId !== oldClassId && form.school_id && form.branch_id && !isSettingFormValues.value) {
    console.log('🔍 Class ID set directly, loading sections for class:', newClassId);
    try {
      await loadSectionsByClass(newClassId, form.school_id, form.branch_id);
      console.log('🔍 Sections loaded for class:', sections.value.length);
    } catch (error) {
      console.warn('Failed to load sections for class:', error);
    }
  }
}, { immediate: false });

// Watch section_id changes to track when it gets cleared
watch(() => form.section_id, (newSectionId, oldSectionId) => {
  console.log('🔍 Section ID changed from', oldSectionId, 'to', newSectionId, 'isSettingFormValues:', isSettingFormValues.value);
  if (oldSectionId && !newSectionId && !isSettingFormValues.value) {
    console.warn('🔍 WARNING: Section ID was cleared unexpectedly!');
    console.trace('🔍 Stack trace for section ID clear');
  }
}, { immediate: false });

// Update form with response data after successful update
const updateFormWithResponseData = async (data) => {
  
  // Update basic fields
  form.admission_number = data.admission_number || form.admission_number;
  form.roll_number = data.roll_number || form.roll_number;
  form.admission_date = data.admission_date || form.admission_date;
  form.category = data.category || form.category;
  
  console.log('🔍 Updating form with response data - roll_number:', data.roll_number);
  
  // Update student fields
  if (data.first_name) form.student.first_name = data.first_name;
  if (data.last_name) form.student.last_name = data.last_name;
  if (data.gender) form.student.gender = data.gender;
  if (data.blood_group) form.student.blood_group = data.blood_group;
  if (data.date_of_birth) form.student.date_of_birth = data.date_of_birth;
  if (data.mother_tongue) form.student.mother_tongue = data.mother_tongue;
  if (data.religion) form.student.religion = data.religion;
  if (data.caste) form.student.caste = data.caste;
  if (data.phone) form.student.mobile_no = data.phone;
  if (data.email) form.student.email = data.email;
  if (data.city) form.student.city = data.city;
  if (data.state) form.student.state = data.state;
  if (data.address) form.student.address = data.address;
  if (data.aadhaar_number) form.student.aadhaar_number = data.aadhaar_number;
  
  if (data.previous_exam_details) {
    // Handle both string and array formats
    if (typeof data.previous_exam_details === 'string') {
      try {
        form.student.previous_exam_details = JSON.parse(data.previous_exam_details);
      } catch (e) {
        console.warn('Failed to parse previous_exam_details JSON:', e);
        form.student.previous_exam_details = [];
      }
    } else {
      form.student.previous_exam_details = data.previous_exam_details || [];
    }
  }
  
  // Map class and section names to IDs
  if (data.current_class && classes.value.length > 0) {
    const classRecord = classes.value.find(cls => 
      cls.name === data.current_class || 
      cls.code === data.current_class
    );
    if (classRecord) {
      form.class_id = classRecord.id;
    }
  }
  
  // Map stream name to ID if it's a higher class
  if (data.stream && streams.value.length > 0) {
    const streamRecord = streams.value.find(stream => 
      stream.name === data.stream || 
      stream.code === data.stream
    );
    if (streamRecord) {
      form.stream_id = streamRecord.id;
    }
  }
  
  if (data.section && sections.value.length > 0) {
    const sectionRecord = sections.value.find(sec => 
      sec.name === data.section
    );
    if (sectionRecord) {
      form.section_id = sectionRecord.id;
    }
  }
  
  if (data.academic_year && academicYears.value.length > 0) {
    const yearRecord = academicYears.value.find(year => 
      year.name === data.academic_year
    );
    if (yearRecord) {
      form.academic_year_id = yearRecord.id;
    }
  }
  
  // Reset user change flags since we're updating with server data
  userChangedClass.value = false;
  userChangedSection.value = false;
};

// Map class and section names to IDs for edit mode
const mapClassAndSectionNames = async () => {
  if (!props.isEditing || hasMappedNames.value || isMappingNames.value) return;
  
  console.log('🔍 Starting name mapping...');
      console.log('🔍 Current class_id:', form.class_id);
    console.log('🔍 Current stream_id:', form.stream_id);
    console.log('🔍 Current section_id:', form.section_id);
    console.log('🔍 Current academic_year_id:', form.academic_year_id);
    console.log('🔍 Temp class name:', form._temp_class_name);
    console.log('🔍 Temp stream name:', form._temp_stream_name);
    console.log('🔍 Temp section name:', form._temp_section_name);
    console.log('🔍 Temp academic year name:', form._temp_academic_year_name);
  console.log('🔍 Available classes:', classes.value.length);
  console.log('🔍 Available sections:', sections.value.length);
  console.log('🔍 Available academic years:', academicYears.value.length);
  
  // If we already have the IDs set directly from API, we still need to load sections for the dropdown
  if (form.class_id && form.section_id && !form._temp_class_name && !form._temp_section_name) {
    console.log('🔍 Class and section IDs already set directly from API, loading sections for dropdown');
    // Load sections for the class to populate the dropdown
    try {
      // Always load streams for the class to show dropdown (even if student doesn't have stream_id)
      console.log('🔍 Loading streams for class to show dropdown');
      await loadStreamsByClass(form.class_id, form.school_id, form.branch_id);
      console.log('🔍 Streams loaded for dropdown:', streams.value.length);
      
      await loadSectionsByClass(form.class_id, form.school_id, form.branch_id);
      console.log('🔍 Sections loaded for dropdown:', sections.value.length);
      hasMappedNames.value = true;
      isMappingNames.value = false;
      isSettingFormValues.value = false;
      return;
    } catch (error) {
      console.warn('Failed to load sections for dropdown:', error);
    }
  }
  
  // If we have class_id but no section_id, load sections for the dropdown
  if (form.class_id && !form.section_id && !form._temp_class_name && !form._temp_section_name) {
    console.log('🔍 Class ID set but no section ID, loading sections for dropdown');
    try {
      // Always load streams for the class to show dropdown (even if student doesn't have stream_id)
      console.log('🔍 Loading streams for class to show dropdown');
      await loadStreamsByClass(form.class_id, form.school_id, form.branch_id);
      console.log('🔍 Streams loaded for dropdown:', streams.value.length);
      
      await loadSectionsByClass(form.class_id, form.school_id, form.branch_id);
      console.log('🔍 Sections loaded for dropdown:', sections.value.length);
      hasMappedNames.value = true;
      isMappingNames.value = false;
      isSettingFormValues.value = false;
      return;
    } catch (error) {
      console.warn('Failed to load sections for dropdown:', error);
    }
  }
  
  // Check if we have the necessary data
  if (classes.value.length === 0 && academicYears.value.length === 0) {
    console.log('🔍 No academic data available yet, skipping mapping');
    return;
  }
  
  // Mark as mapping to prevent infinite loops
  isMappingNames.value = true;
  isSettingFormValues.value = true;
  
  // HACK: Force load classes and sections if they're empty
  if (classes.value.length === 0 && form.school_id && form.branch_id) {
    console.log('🔍 HACK: Force loading classes...');
    try {
      await fetchClasses(form.school_id, form.branch_id);
      console.log('🔍 HACK: Classes loaded:', classes.value.length);
    } catch (error) {
      console.error('❌ HACK: Failed to load classes:', error);
    }
  }
  
  // Map academic year name to academic_year_id first
  if (form._temp_academic_year_name && academicYears.value.length > 0) {
    const yearRecord = academicYears.value.find(year => 
      year.name === form._temp_academic_year_name
    );
    if (yearRecord) {
      form.academic_year_id = yearRecord.id;
      console.log('🔍 Set academic_year_id to:', yearRecord.id);
    }
  }
  
  // Map class code/name to class_id
  if (form._temp_class_name && classes.value.length > 0) {
    const classRecord = classes.value.find(cls => 
      cls.name === form._temp_class_name || 
      cls.code === form._temp_class_name
    );
    if (classRecord) {
      console.log('🔍 Setting class_id to:', classRecord.id);
      form.class_id = classRecord.id;
      console.log('🔍 Set class_id to:', form.class_id);
      
      // Load streams and sections for this class
      try {
        // Check if class has streams and load them
        const selectedClass = activeClasses.value.find(cls => cls.id === classRecord.id);
        const classHasStreams = selectedClass?.has_stream === true;
        
        if (classHasStreams) {
          await loadStreamsByClass(classRecord.id, form.school_id, form.branch_id);
          console.log('🔍 Loaded streams for class:', streams.value.length);
        }
        
        await loadSectionsByClass(classRecord.id, form.school_id, form.branch_id);
        console.log('🔍 Loaded sections for class:', sections.value.length);
        
        // Wait a bit for data to be fully loaded
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Map stream name to stream_id if class has streams
        if (hasStreams.value && form._temp_stream_name && streams.value.length > 0) {
          console.log('🔍 Attempting to map stream name:', form._temp_stream_name);
          const streamRecord = streams.value.find(stream => 
            stream.name === form._temp_stream_name ||
            stream.code === form._temp_stream_name
          );
          console.log('🔍 Found stream record:', streamRecord);
          if (streamRecord) {
            console.log('🔍 Setting stream_id to:', streamRecord.id);
            form.stream_id = streamRecord.id;
            console.log('🔍 Set stream_id to:', form.stream_id);
          } else {
            console.log('🔍 No matching stream found for:', form._temp_stream_name);
            console.log('🔍 Available streams:', streams.value.map(s => s.name));
          }
        }
        
        // Now map section name to section_id after sections are loaded
        if (form._temp_section_name && sections.value.length > 0) {
          console.log('🔍 Attempting to map section name:', form._temp_section_name);
          const sectionRecord = sections.value.find(sec => 
            sec.name === form._temp_section_name
          );
          console.log('🔍 Found section record:', sectionRecord);
          if (sectionRecord) {
            console.log('🔍 Setting section_id to:', sectionRecord.id);
            form.section_id = sectionRecord.id;
            console.log('🔍 Set section_id to:', form.section_id);
          } else {
            console.log('🔍 No matching section found for:', form._temp_section_name);
            console.log('🔍 Available sections:', sections.value.map(s => s.name));
          }
        }
      } catch (error) {
        console.warn('Failed to load streams/sections for class:', error);
      }
    } else {
      console.log('🔍 No matching class found for:', form._temp_class_name);
      console.log('🔍 Available classes:', classes.value.map(c => ({ name: c.name, code: c.code })));
    }
  } else if (form._temp_class_name && classes.value.length === 0) {
    // HACK: If we have temp class name but no classes loaded, try again after a delay
    console.log('🔍 HACK: Retrying class mapping after delay...');
    setTimeout(async () => {
      if (!hasMappedNames.value) {
        isMappingNames.value = false;
        isSettingFormValues.value = false;
        await mapClassAndSectionNames();
      }
    }, 1000);
    return;
  }
  
  // Check if mapping was successful
  const mappingSuccessful = form.class_id || form.section_id || form.academic_year_id;
  
  if (!mappingSuccessful && mappingRetryCount.value < maxMappingRetries) {
    console.log('🔍 Mapping incomplete, will retry...');
    mappingRetryCount.value++;
    isMappingNames.value = false;
    isSettingFormValues.value = false;
    
    // Retry after a delay
    setTimeout(async () => {
      console.log('🔍 Retrying mapping (attempt', mappingRetryCount.value, 'of', maxMappingRetries, ')');
      await mapClassAndSectionNames();
    }, 1000);
    return;
  }
  
  // HACK: If mapping still failed after retries, try direct assignment
  if (!mappingSuccessful && mappingRetryCount.value >= maxMappingRetries) {
    console.log('🔍 HACK: Mapping failed after retries, trying direct assignment...');
    
    // Try to find class by name in all available classes
    if (form._temp_class_name && classes.value.length > 0) {
      const classRecord = classes.value.find(cls => 
        cls.name === form._temp_class_name || 
        cls.code === form._temp_class_name ||
        cls.name.toLowerCase().includes(form._temp_class_name.toLowerCase()) ||
        cls.code.toLowerCase().includes(form._temp_class_name.toLowerCase())
      );
      if (classRecord) {
        console.log('🔍 HACK: Direct class assignment successful:', classRecord.id);
        form.class_id = classRecord.id;
      }
    }
    
    // Try to find section by name in all available sections
    if (form._temp_section_name && sections.value.length > 0) {
      const sectionRecord = sections.value.find(sec => 
        sec.name === form._temp_section_name ||
        sec.name.toLowerCase().includes(form._temp_section_name.toLowerCase())
      );
      if (sectionRecord) {
        console.log('🔍 HACK: Direct section assignment successful:', sectionRecord.id);
        form.section_id = sectionRecord.id;
      }
    }
  }
  
  // Mark as mapped to prevent future calls
  hasMappedNames.value = true;
  isMappingNames.value = false;
  isSettingFormValues.value = false;
  mappingRetryCount.value = 0; // Reset retry count
  
  console.log('🔍 Name mapping completed');
  console.log('🔍 Final form values - class_id:', form.class_id, 'section_id:', form.section_id, 'academic_year_id:', form.academic_year_id);
};

// Load schools for super admin
const loadSchools = async () => {
  try {
    loadingSchools.value = true;
    await fetchSchools(true);
    if (!schools.value || schools.value.length === 0) {
      showError('No schools found. Please create a school first.');
      return;
    }
    // Only auto-select school if in edit mode
    if (schools.value.length === 1 && props.isEditing) {
      form.school_id = schools.value[0].id;
      // Use onSchoolChange to ensure proper flow
      await onSchoolChange();
    }
  } catch (error) {
    showError('Failed to load schools. Please check your connection and try again.');
  } finally {
    loadingSchools.value = false;
  }
};

// Load data on component mount
onMounted(async () => {
  try {
    if (!user.value) {
      showError('Please log in to access this page');
      router.push('/login');
      return;
    }
    
    // If editing, wait for initial data to be loaded first
    if (props.isEditing) {
      // Wait a bit for the initial data to be populated
      await new Promise(resolve => setTimeout(resolve, 200));
      console.log('🔍 onMounted: After delay, initial data:', props.initialData);
    } else {
      form.branch_id = '';
    }
    
    if (userRole.value === 'super_admin') {
      await loadSchools();
    } else if (userRole.value === 'school_admin') {
      if (user.value?.school_id) {
        form.school_id = user.value.school_id;
        loadingBranches.value = true;
        try {
          await fetchBranches(user.value.school_id);
          if (branches.value?.length > 0) {
            // Only auto-select branch if in edit mode
            if (branches.value.length === 1 && props.isEditing) {
              const branch = branches.value[0];
              form.branch_id = branch.id;
              // Use onBranchChange to ensure proper flow
              await onBranchChange();
            } else {
                // ✅ CREATE MODE → keep empty → forces placeholder
             
            }
          } else {
            showError('No branches found for your school');
          }
        } catch (error) {
          showError('Failed to load branch data');
        } finally {
          loadingBranches.value = false;
        }
      } else {
        showError('School information not found');
      }
    } else if (userRole.value === 'branch_admin') {
      if (user.value?.branch_id && user.value?.school_id) {
        form.school_id = user.value.school_id;
        // Only auto-select branch if in edit mode
        if (props.isEditing) {
          form.branch_id = user.value.branch_id;
          userBranch.value = {
            id: user.value.branch_id,
            name: user.value.branch_name || 'Your Branch'
          };
          // Use onBranchChange to ensure proper flow
          await onBranchChange();
        } else {
          // In create mode, just set the user branch info but don't auto-select
          userBranch.value = {
            id: user.value.branch_id,
            name: user.value.branch_name || 'Your Branch'
          };
        }
      } else {
        showError('Branch information not found');
      }
    }
    
    // If editing, map class and section names to IDs
    if (props.isEditing && (form._temp_class_name || form._temp_section_name || form._temp_stream_name || form._temp_academic_year_name)) {
          console.log('🔍 onMounted: Attempting to map names to IDs');
    console.log('🔍 onMounted: Temp values - class:', form._temp_class_name, 'section:', form._temp_section_name, 'stream:', form._temp_stream_name, 'year:', form._temp_academic_year_name);
    console.log('🔍 onMounted: Direct IDs - class_id:', form.class_id, 'stream_id:', form.stream_id, 'section_id:', form.section_id);
      
      // Wait a bit more to ensure all data is loaded
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if we have the necessary data loaded
      if (classes.value.length > 0 || sections.value.length > 0 || academicYears.value.length > 0) {
        await mapClassAndSectionNames();
      } else {
        console.log('🔍 onMounted: Academic data not yet loaded, will be handled by watcher');
      }
      
      // HACK: Final attempt after a longer delay
      setTimeout(async () => {
        if (props.isEditing && !hasMappedNames.value && (form._temp_class_name || form._temp_section_name || form._temp_stream_name)) {
          console.log('🔍 HACK: Final attempt to map names after delay');
          hasMappedNames.value = false; // Reset flag
          isMappingNames.value = false; // Reset flag
          isSettingFormValues.value = false; // Reset flag
          await mapClassAndSectionNames();
        }
      }, 2000);
    }
    
    // Set current academic year if not already set
    if (!form.academic_year_id && academicYears.value && academicYears.value.length > 0) {
      const currentYear = academicYears.value.find(y => y.is_current);
      if (currentYear) {
        form.academic_year_id = currentYear.id;
      }
    }
  } catch (error) {
    showError('Failed to load initial data');
  }
});

// Remove the problematic watcher - it was interfering with normal flow
</script> 