<template>
  <div class="container mx-auto py-8 max-w-6xl">
    <!-- Header -->
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Create Admission</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">Fill in all required details for student admission</p>
      </div>
      <NuxtLink to="/admissions" class="btn-secondary">Back to Admissions</NuxtLink>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="space-y-8">
      
      <!-- School and Branch Selection -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <span class="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center mr-3">1</span>
          {{ userRole === 'super_admin' ? 'Select School & Branch' : userRole === 'school_admin' ? 'Select Branch' : 'Academic Details' }}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- School Dropdown (Super Admin Only) -->
          <div v-if="userRole === 'super_admin'">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">School *</label>
            <select 
              v-model="form.school_id" 
              @change="onSchoolChange" 
              required 
              class="input-field"
              :class="{ 'opacity-50': loadingSchools }"
              :disabled="loadingSchools"
            >
              <option value="">Loading schools...</option>
              <option v-for="school in schools" :key="school.id" :value="school.id">
                {{ school.name }}
              </option>
            </select>
            <p v-if="schools.length === 0 && !loadingSchools" class="mt-1 text-sm text-red-600">No schools found</p>
          </div>

          <!-- Branch Dropdown (Super Admin & School Admin) -->
          <div v-if="userRole !== 'branch_admin'">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Branch *</label>
            <select 
              v-model="form.branch_id" 
              @change="onBranchChange" 
              required 
              class="input-field"
              :class="{ 'opacity-50': loadingBranches }"
              :disabled="!form.school_id || loadingBranches"
            >
              <option value="">{{ loadingBranches ? 'Loading branches...' : 'Select Branch' }}</option>
              <option v-for="branch in branches" :key="branch.id" :value="branch.id">
                {{ branch.name }}
              </option>
            </select>
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
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Academic Year *</label>
            <select v-model="form.academic_year_id" required class="input-field" :disabled="academicsLoading">
              <option value="">Select Academic Year</option>
              <option v-for="year in activeAcademicYears" :key="year.id" :value="year.id">
                {{ year.name }} {{ year.is_current ? '(Current)' : '' }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Register No *</label>
            <input v-model="form.register_no" type="text" required class="input-field" placeholder="e.g., ISC-0001" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Roll Number</label>
            <input v-model="form.roll_number" type="text" class="input-field" placeholder="Student roll number" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admission Date *</label>
            <input v-model="form.admission_date" type="date" required class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class *</label>
            <select v-model="form.class_id" @change="onClassChange" required class="input-field" :disabled="academicsLoading">
              <option value="">Select Class</option>
              <option v-for="cls in activeClasses" :key="cls.id" :value="cls.id">
                {{ cls.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Section *</label>
            <select v-model="form.section_id" required class="input-field" :disabled="!form.class_id || sectionsLoading">
              <option value="">Select Section</option>
              <option v-for="section in activeSections" :key="section.id" :value="section.id">
                {{ section.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
            <select v-model="form.category" required class="input-field">
              <option value="">Select Category</option>
              <option value="general">General</option>
              <option value="obc">OBC</option>
              <option value="sc">SC</option>
              <option value="st">ST</option>
              <option value="other">Other</option>
            </select>
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
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name *</label>
            <input v-model="form.student.first_name" type="text" required class="input-field" placeholder="Enter first name" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name *</label>
            <input v-model="form.student.last_name" type="text" required class="input-field" placeholder="Enter last name" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender *</label>
            <select v-model="form.student.gender" required class="input-field">
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Blood Group</label>
            <select v-model="form.student.blood_group" class="input-field">
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
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth *</label>
            <input v-model="form.student.date_of_birth" type="date" required class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mother Tongue</label>
            <input v-model="form.student.mother_tongue" type="text" class="input-field" placeholder="Enter mother tongue" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Religion</label>
            <input v-model="form.student.religion" type="text" class="input-field" placeholder="Enter religion" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Caste</label>
            <input v-model="form.student.caste" type="text" class="input-field" placeholder="Enter caste" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile No</label>
            <input v-model="form.student.mobile_no" type="tel" class="input-field" placeholder="Enter mobile number" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input v-model="form.student.email" type="email" class="input-field" placeholder="Enter email address" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
            <input v-model="form.student.city" type="text" class="input-field" placeholder="Enter city" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
            <input v-model="form.student.state" type="text" class="input-field" placeholder="Enter state" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Present Address</label>
            <textarea v-model="form.student.present_address" class="input-field" rows="2" placeholder="Enter present address"></textarea>
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Permanent Address</label>
            <textarea v-model="form.student.permanent_address" class="input-field" rows="2" placeholder="Enter permanent address"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profile Picture</label>
            <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
              <div class="space-y-1 text-center">
                <svg v-if="!form.student.profile_picture_preview" class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <img v-else :src="form.student.profile_picture_preview" class="mx-auto h-32 w-32 object-cover rounded-lg" />
                <div class="flex text-sm text-gray-600">
                  <label class="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500">
                    <span>{{ form.student.profile_picture_preview ? 'Change' : 'Upload' }} file</span>
                    <input ref="studentProfileInput" type="file" class="sr-only" accept="image/*" @change="handleFileUpload('student_profile', $event)" />
                  </label>
                  <p class="pl-1">or drag and drop</p>
                </div>
                <p class="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Login Details -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <span class="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center mr-3">4</span>
          Login Details
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username *</label>
            <input v-model="form.login.username" type="text" required class="input-field" placeholder="Enter username" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label>
            <input v-model="form.login.password" type="password" required class="input-field" placeholder="Enter password" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Retype Password *</label>
            <input v-model="form.login.retype_password" type="password" required class="input-field" placeholder="Retype password" />
          </div>
        </div>
      </div>

      <!-- Guardian Details -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <span class="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center mr-3">5</span>
          Guardian Details
        </h2>
        
        <div class="mb-4">
          <label class="flex items-center">
            <input v-model="form.guardian.already_exists" type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Guardian Already Exists</span>
          </label>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
            <input v-model="form.guardian.name" type="text" required class="input-field" placeholder="Enter guardian name" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Relation *</label>
            <select v-model="form.guardian.relation" required class="input-field">
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
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Father Name</label>
            <input v-model="form.guardian.father_name" type="text" class="input-field" placeholder="Enter father name" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mother Name</label>
            <input v-model="form.guardian.mother_name" type="text" class="input-field" placeholder="Enter mother name" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Occupation *</label>
            <input v-model="form.guardian.occupation" type="text" required class="input-field" placeholder="Enter occupation" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Income *</label>
            <input v-model="form.guardian.income" type="number" required class="input-field" placeholder="Enter annual income" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Education *</label>
            <input v-model="form.guardian.education" type="text" required class="input-field" placeholder="Enter education qualification" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
            <input v-model="form.guardian.city" type="text" class="input-field" placeholder="Enter city" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
            <input v-model="form.guardian.state" type="text" class="input-field" placeholder="Enter state" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile No *</label>
            <input v-model="form.guardian.mobile_no" type="tel" required class="input-field" placeholder="Enter mobile number" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
            <input v-model="form.guardian.email" type="email" required class="input-field" placeholder="Enter email address" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address *</label>
            <textarea v-model="form.guardian.address" required class="input-field" rows="2" placeholder="Enter address"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Guardian Picture</label>
            <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
              <div class="space-y-1 text-center">
                <svg v-if="!form.guardian.picture_preview" class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <img v-else :src="form.guardian.picture_preview" class="mx-auto h-32 w-32 object-cover rounded-lg" />
                <div class="flex text-sm text-gray-600">
                  <label class="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500">
                    <span>{{ form.guardian.picture_preview ? 'Change' : 'Upload' }} file</span>
                    <input ref="guardianPictureInput" type="file" class="sr-only" accept="image/*" @change="handleFileUpload('guardian_picture', $event)" />
                  </label>
                  <p class="pl-1">or drag and drop</p>
                </div>
                <p class="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Guardian Login Details -->
        <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 class="text-md font-medium text-gray-900 dark:text-white mb-4">Guardian Login Details</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username *</label>
              <input v-model="form.guardian.login.username" type="text" required class="input-field" placeholder="Enter username" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label>
              <input v-model="form.guardian.login.password" type="password" required class="input-field" placeholder="Enter password" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Retype Password *</label>
              <input v-model="form.guardian.login.retype_password" type="password" required class="input-field" placeholder="Retype password" />
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
            Creating Admission...
          </span>
          <span v-else>Create Admission</span>
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
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useAuth } from '~/composables/useAuth';
import { useAcademics } from '~/composables/useAcademics';
import { useBranches } from '~/composables/useBranches';
import { useSchools } from '~/composables/useSchools';
import { useToast } from '~/composables/useToast';

// Auth context
const { user } = useAuth();
const userRole = computed(() => user.value?.role);

// Academic data
const {
  academicYears,
  classes,
  sections,
  loading: academicsLoading,
  fetchAcademicYears,
  fetchClasses,
  fetchSections,
  loadSectionsByClass,
  currentAcademicYear,
  activeAcademicYears,
  activeClasses,
  activeSections,
} = useAcademics();

// Branch/School data
const { schools, fetchSchools } = useSchools();
const { branches, fetchBranches } = useBranches();

// Toast
const { showSuccess, showError } = useToast();

// Form state
const loading = ref(false);
const sectionsLoading = ref(false);
const loadingSchools = ref(false);
const loadingBranches = ref(false);
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
const userBranch = ref(null);

// Form data
const form = reactive({
  // Branch selection (for super admin)
  school_id: user.value?.school_id || '',
  branch_id: user.value?.branch_id || '',

  // Academic details
  academic_year_id: '',
  register_no: '',
  roll_number: '',
  admission_date: new Date().toISOString().split('T')[0],
  class_id: '',
  section_id: '',
  category: '',

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
    present_address: '',
    permanent_address: '',
    profile_picture: null,
    profile_picture_preview: null,
  },

  // Login details
  login: {
    username: '',
    password: '',
    retype_password: '',
  },

  // Guardian details
  guardian: {
    already_exists: false,
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
    picture_preview: null,
    login: {
      username: '',
      password: '',
      retype_password: '',
    },
  },


});

// File upload handler
const handleFileUpload = (type, event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === 'student_profile') {
        form.student.profile_picture = file;
        form.student.profile_picture_preview = e.target.result;
      } else if (type === 'guardian_picture') {
        form.guardian.picture = file;
        form.guardian.picture_preview = e.target.result;
      }
    };
    reader.readAsDataURL(file);
  }
};

// School change handler
const onSchoolChange = async () => {
  form.branch_id = '';
  form.class_id = '';
  form.section_id = '';
  
  if (form.school_id) {
    loadingBranches.value = true;
    try {
      await fetchBranches(form.school_id);
      
      // If there's only one branch, select it automatically
      if (branches.value.length === 1) {
        form.branch_id = branches.value[0].id;
        await onBranchChange();
      }
    } catch (error) {
      console.error('Error loading branches:', error);
      showError('Failed to load branches');
    } finally {
      loadingBranches.value = false;
    }
  }
};

// Branch change handler
const onBranchChange = async () => {
  form.class_id = '';
  form.section_id = '';
  
  if (form.branch_id) {
    try {
      // Load academic data for the selected branch
      await loadAcademicData();
      
      // If there's only one academic year, select it automatically
      if (academicYears.value && academicYears.value.length > 0) {
        const currentYear = academicYears.value.find(y => y.is_current) || academicYears.value[0];
        if (currentYear) {
          form.academic_year_id = currentYear.id;
        }
      }
      
      // If there's only one class, select it automatically
      if (classes.value && classes.value.length === 1) {
        form.class_id = classes.value[0].id;
        await onClassChange();
      }
    } catch (error) {
      console.error('Error loading academic data:', error);
      showError('Failed to load academic data');
    }
  }
};

// Class change handler
const onClassChange = async () => {
  form.section_id = '';
  if (form.class_id) {
    sectionsLoading.value = true;
    try {
      // Use the imported loadSectionsByClass function
      await loadSectionsByClass(form.class_id, form.school_id, form.branch_id);
      
      // If there's only one section, select it automatically
      if (sections.value && sections.value.length === 1) {
        form.section_id = sections.value[0].id;
      }
    } catch (error) {
      console.error('Error loading sections:', error);
      showError('Failed to load sections');
    } finally {
      sectionsLoading.value = false;
    }
  }
};

  // Load academic data
const loadAcademicData = async () => {
  try {
    console.log('🔍 Loading academic data for school:', form.school_id, 'branch:', form.branch_id);
    if (!form.school_id || !form.branch_id) {
      console.warn('Missing school_id or branch_id, cannot load academic data');
      return;
    }

    academicsLoading.value = true;
    
    // Load academic years and classes in parallel
    await Promise.all([
      fetchAcademicYears(form.school_id),
      fetchClasses(form.school_id, form.branch_id)
    ]);
    
    // Auto-select current academic year if available
    if (academicYears.value?.length > 0) {
      const currentYear = academicYears.value.find(y => y.is_current) || academicYears.value[0];
      if (currentYear) {
        form.academic_year_id = currentYear.id;
        console.log('Selected academic year:', currentYear.name);
      }
    }

    // Auto-select class if only one is available
    if (classes.value?.length === 1) {
      form.class_id = classes.value[0].id;
      console.log('Auto-selected class:', classes.value[0].name);
      await onClassChange(); // Load sections for selected class
    }
    
    console.log('✅ Academic data loaded:', {
      years: academicYears.value?.length || 0,
      classes: classes.value?.length || 0,
      selectedYear: form.academic_year_id,
      selectedClass: form.class_id
    });
  } catch (error) {
    console.error('❌ Error loading academic data:', error);
    showError('Failed to load academic data');
  } finally {
    academicsLoading.value = false;
  }
};



// Form validation
const validateForm = () => {
  // Password validation
  if (form.login.password !== form.login.retype_password) {
    showError('Student login passwords do not match');
    return false;
  }
  
  if (form.guardian.login.password !== form.guardian.login.retype_password) {
    showError('Guardian login passwords do not match');
    return false;
  }

  // Email validation
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

// Form submission
const handleSubmit = async () => {
  if (!validateForm()) return;

  loading.value = true;
  try {
    // Prepare form data
    const formData = new FormData();
    
    // Add basic data
    formData.append('admissionData', JSON.stringify({
      // Branch data
      school_id: form.school_id,
      branch_id: form.branch_id,
      
      // Academic data
      academic_year_id: form.academic_year_id,
      register_no: form.register_no,
      roll_number: form.roll_number,
      admission_date: form.admission_date,
      class_id: form.class_id,
      section_id: form.section_id,
      category: form.category,
      
      // Student data
      student: {
        first_name: form.student.first_name,
        last_name: form.student.last_name,
        gender: form.student.gender,
        blood_group: form.student.blood_group,
        date_of_birth: form.student.date_of_birth,
        mother_tongue: form.student.mother_tongue,
        religion: form.student.religion,
        caste: form.student.caste,
        mobile_no: form.student.mobile_no,
        email: form.student.email,
        city: form.student.city,
        state: form.student.state,
        present_address: form.student.present_address,
        permanent_address: form.student.permanent_address,
      },
      
      // Login data
      login: form.login,
      
      // Guardian data
      guardian: {
        already_exists: form.guardian.already_exists,
        name: form.guardian.name,
        relation: form.guardian.relation,
        father_name: form.guardian.father_name,
        mother_name: form.guardian.mother_name,
        occupation: form.guardian.occupation,
        income: form.guardian.income,
        education: form.guardian.education,
        city: form.guardian.city,
        state: form.guardian.state,
        mobile_no: form.guardian.mobile_no,
        email: form.guardian.email,
        address: form.guardian.address,
        login: form.guardian.login,
      },
      

    }));

    // Add files
    if (form.student.profile_picture) {
      formData.append('student_profile_picture', form.student.profile_picture);
    }
    if (form.guardian.picture) {
      formData.append('guardian_picture', form.guardian.picture);
    }

    // Make API call
    const response = await $fetch('/api/admissions', {
      method: 'POST',
      body: formData,
    });

    if (response.success) {
      showSuccess('Admission created successfully!');
      resetForm();
      // Navigate to admissions list after short delay
      setTimeout(() => {
        navigateTo('/admissions');
      }, 2000);
    } else {
      showError(response.message || 'Failed to create admission');
    }
  } catch (error) {
    console.error('Error creating admission:', error);
    showError('An error occurred while creating the admission');
  } finally {
    loading.value = false;
  }
};

// Reset form
const resetForm = () => {
  // Reset all form fields to initial state
  Object.assign(form, {
    school_id: user.value?.school_id || '',
    branch_id: user.value?.branch_id || '',
    academic_year_id: '',
    register_no: '',
    roll_number: '',
    admission_date: new Date().toISOString().split('T')[0],
    class_id: '',
    section_id: '',
    category: '',
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
      present_address: '',
      permanent_address: '',
      profile_picture: null,
      profile_picture_preview: null,
    },
    login: {
      username: '',
      password: '',
      retype_password: '',
    },
    guardian: {
      already_exists: false,
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
      picture_preview: null,
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

// Load schools for super admin
const loadSchools = async () => {
  try {
    loadingSchools.value = true;
    // Fetch schools with subscription details
    await fetchSchools(true); // Pass true to include subscription details
    
    console.log('Schools loaded:', schools.value);
    
    // If there are no schools, show a message
    if (!schools.value || schools.value.length === 0) {
      console.warn('No schools found');
      showError('No schools found. Please create a school first.');
      return;
    }
    
    // If there's only one school, select it automatically
    if (schools.value.length === 1) {
      form.school_id = schools.value[0].id;
      await onSchoolChange();
    }
  } catch (error) {
    console.error('Error loading schools:', error);
    showError('Failed to load schools. Please check your connection and try again.');
  } finally {
    loadingSchools.value = false;
  }
};

// Load data on component mount
onMounted(async () => {
  try {
    // Debug authentication status
    console.log('🔍 Admission Create - Auth Debug:', {
      user: user.value,
      userRole: userRole.value,
      isAuthenticated: user.value ? 'yes' : 'no',
      token: useCookie('auth-token').value ? 'present' : 'missing'
    });

    // Check if user is authenticated
    if (!user.value) {
      console.error('❌ User not authenticated, redirecting to login');
      showError('Please log in to access this page');
navigateTo('/login');
      return;
    }

// Load initial data based on user role
    if (userRole.value === 'super_admin') {
      console.log('🔍 Loading data for super admin');
      await loadSchools();
    } else if (userRole.value === 'school_admin') {
      console.log('🔍 Loading data for school admin');
      if (user.value?.school_id) {
        console.log('School ID from user:', user.value.school_id);
        form.school_id = user.value.school_id;
        loadingBranches.value = true;
        try {
          console.log('Fetching branches for school:', user.value.school_id);
          await fetchBranches(user.value.school_id);
          console.log('Branches loaded:', branches.value?.length || 0);
          
          if (branches.value?.length > 0) {
            console.log('Found branches:', branches.value.length);
            
            // If only one branch, select it and load academic data
            if (branches.value.length === 1) {
              const branch = branches.value[0];
              console.log('Auto-selecting single branch:', branch.name);
              form.branch_id = branch.id;
              await loadAcademicData(); // Load academic data after setting branch
            }
          } else {
            console.warn('No branches found for school:', user.value.school_id);
            showError('No branches found for your school');
          }
        } catch (error) {
          console.error('Error loading branch data:', error);
          showError('Failed to load branch data');
        } finally {
          loadingBranches.value = false;
        }
      } else {
        console.error('School admin missing school_id');
        showError('School information not found');
      }
    } else if (userRole.value === 'branch_admin') {
      console.log('🔍 Loading data for branch admin');
      if (user.value?.branch_id && user.value?.school_id) {
        // Set school and branch IDs from user context
        form.school_id = user.value.school_id;
        form.branch_id = user.value.branch_id;
        
        // Set branch display info
        userBranch.value = {
          id: user.value.branch_id,
          name: user.value.branch_name || 'Your Branch'
        };
        
        console.log('Branch admin context:', {
          school_id: form.school_id,
          branch_id: form.branch_id,
          branch_name: userBranch.value.name
        });
        
        // Load academic data since both school and branch are set
        await loadAcademicData();
      } else {
        console.error('Branch admin missing required IDs');
        showError('Branch information not found');
      }
    }

    // Set current academic year if available
    if (currentAcademicYear.value) {
      form.academic_year_id = currentAcademicYear.value.id;
    }

    // Debug: Log the current state of the form and available data
    console.log('✅ Admission Create - Data loaded:', {
      form: JSON.parse(JSON.stringify(form)),
      schools: schools.value,
      branches: branches.value,
      academicYears: academicYears.value,
      classes: classes.value,
      sections: sections.value
    });
  } catch (error) {
    console.error('❌ Error initializing admission form:', error);
    showError('Failed to load initial data');
  }
});

// Meta
definePageMeta({
  middleware: 'auth',
  title: 'Create Admission',
});
</script>

<style scoped>
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500;
}

.input-field {
  @apply block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white sm:text-sm;
}
</style> 