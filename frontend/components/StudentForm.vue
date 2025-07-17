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
              <option v-for="year in academicYears" :key="year.id" :value="year.id">
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
            <select v-model="form.class_id" @change="onClassChange" required class="input-field">
              <option value="">Select Class</option>
              <option v-for="cls in activeClasses" :key="cls.id" :value="cls.id">
                {{ cls.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Section *</label>
            <select v-model="form.section_id" required class="input-field" :disabled="!form.class_id || sectionsLoading" @change="onSectionChange">
              <option value="">{{ sectionsLoading ? 'Loading sections...' : (form.class_id && activeSections.length === 0 ? 'No sections found' : 'Select Section') }}</option>
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
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admission Type *</label>
            <select v-model="form.admission_type" required class="input-field">
              <option value="">Select Admission Type</option>
              <option value="new">New Admission</option>
              <option value="transfer">Transfer</option>
              <option value="readmission">Readmission</option>
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
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
            <input v-model="form.student.email" type="email" required class="input-field" placeholder="Enter email address" />
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
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
            <input v-model="form.student.city" type="text" class="input-field" placeholder="Enter city" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
            <input v-model="form.student.state" type="text" class="input-field" placeholder="Enter state" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
            <textarea v-model="form.student.address" class="input-field" rows="2" placeholder="Enter student address"></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profile Picture</label>
            <input ref="studentProfileInput" type="file" accept="image/*" class="input-field" @change="handleFileUpload('student_profile', $event)" />
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
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
            <input v-model="form.login.username" type="text" class="input-field" placeholder="Enter username" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input v-model="form.login.password" type="password" class="input-field" placeholder="Enter password" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Retype Password</label>
            <input v-model="form.login.retype_password" type="password" class="input-field" placeholder="Retype password" />
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

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Guardian Picture</label>
            <input ref="guardianPictureInput" type="file" accept="image/*" class="input-field" @change="handleFileUpload('guardian_picture', $event)" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address *</label>
            <textarea v-model="form.guardian.address" required class="input-field" rows="2" placeholder="Enter address"></textarea>
          </div>
        </div>

        <!-- Guardian Login Details -->
        <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 class="text-md font-medium text-gray-900 dark:text-white mb-4">Guardian Login Details</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
              <input v-model="form.guardian.login.username" type="text" class="input-field" placeholder="Enter username" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input v-model="form.guardian.login.password" type="password" class="input-field" placeholder="Enter password" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Retype Password</label>
              <input v-model="form.guardian.login.retype_password" type="password" class="input-field" placeholder="Retype password" />
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
import { useToast } from '~/composables/useToast';
import { apiClient } from '~/utils/api';
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
  admission_type: '',
  
  // Temporary fields for mapping names to IDs in edit mode
  _temp_class_name: '',
  _temp_section_name: '',
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
    
    // Academic details
    if (newData.school_id) form.school_id = newData.school_id;
    if (newData.branch_id) form.branch_id = newData.branch_id;
    if (newData.admission_number) form.register_no = newData.admission_number;
    if (newData.roll_number) form.roll_number = newData.roll_number;
    if (newData.admission_date) {
      const date = new Date(newData.admission_date);
      form.admission_date = date.toISOString().split('T')[0];
    }
    if (newData.category) form.category = newData.category;
    
    // Store the class and section names for later mapping
    // We'll map these to IDs after academic data is loaded
    if (newData.current_class) {
      form._temp_class_name = newData.current_class;
    }
    if (newData.section) {
      form._temp_section_name = newData.section;
    }
    if (newData.academic_year) {
      form._temp_academic_year_name = newData.academic_year;
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
        if (form._temp_class_name || form._temp_section_name || form._temp_academic_year_name) {
          console.log('🔍 Initial data loaded, mapping names to IDs');
          await mapClassAndSectionNames();
        }
      } catch (error) {
        console.error('Failed to load academic data for mapping:', error);
      }
    }
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
  console.log('🔍 onBranchChange called with branch_id:', form.branch_id);
  form.class_id = '';
  form.section_id = '';
  if (form.branch_id) {
    try {
      await loadAcademicData();
      console.log('🔍 Academic data loaded - Years:', academicYears.value?.length, 'Classes:', classes.value?.length);
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
      showError('Failed to load academic data');
    }
  }
};

// Class change handler
const onClassChange = async (isAutoSelection = false) => {
  console.log('🔍 onClassChange called with class_id:', form.class_id, 'isAutoSelection:', isAutoSelection, 'isSettingFormValues:', isSettingFormValues.value);
  // Only mark as user-changed if it's not an auto-selection and not setting form values
  if (!isAutoSelection && !isSettingFormValues.value) {
    userChangedClass.value = true;
  }
  
  form.section_id = '';
  userChangedSection.value = false; // Reset section flag since class changed
  
  if (form.class_id) {
    sectionsLoading.value = true;
    try {
      // Try loading sections with current context first
      await loadSectionsByClass(form.class_id, form.school_id, form.branch_id);
      console.log('🔍 Sections loaded:', sections.value?.length);
      
      // If no sections found, try without branch_id (for super admin or cross-branch sections)
      if (!sections.value || sections.value.length === 0) {
        await loadSectionsByClass(form.class_id, form.school_id, null);
        console.log('🔍 Sections loaded (without branch):', sections.value?.length);
      }
      
      if (sections.value && sections.value.length === 1) {
        form.section_id = sections.value[0].id;
        console.log('🔍 Auto-selecting single section:', form.section_id);
      }
    } catch (error) {
      console.error('❌ Error loading sections:', error);
      showError('Failed to load sections');
    } finally {
      sectionsLoading.value = false;
    }
  } else {
    sections.value = [];
  }
};

// Section change handler
const onSectionChange = () => {
  console.log('🔍 onSectionChange called, isSettingFormValues:', isSettingFormValues.value);
  // Only mark as user-changed if not setting form values
  if (!isSettingFormValues.value) {
    userChangedSection.value = true;
  }
};

// Load academic data
const loadAcademicData = async () => {
  try {
    if (!form.school_id || !form.branch_id) return;
    academicsLoading.value = true;
    await Promise.all([
      fetchAcademicYears(form.school_id),
      fetchClasses(form.school_id, form.branch_id)
    ]);
    if (academicYears.value?.length > 0) {
      const currentYear = academicYears.value.find(y => y.is_current) || academicYears.value[0];
      if (currentYear) {
        form.academic_year_id = currentYear.id;
      }
    }
    // Don't auto-select class in create mode - let user choose
    // Auto-selection only happens in edit mode through onBranchChange
  } catch (error) {
    showError('Failed to load academic data');
  } finally {
    academicsLoading.value = false;
  }
};

// Form validation (same as admission form)
const validateForm = () => {
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

// Form submission
const handleSubmit = async () => {
  if (!validateForm()) return;
  loading.value = true;
  try {
    const formData = new FormData();
    
    // Prepare data structure
    const dataStructure = {
      school_id: form.school_id,
      branch_id: form.branch_id,
      academic_year_id: form.academic_year_id,
      register_no: form.register_no,
      roll_number: form.roll_number,
      admission_date: form.admission_date,
      class_id: form.class_id,
      section_id: form.section_id,
      category: form.category,
      admission_type: form.admission_type,
      student: { 
        ...form.student,
        roll_number: form.roll_number, // Add roll_number to student object
        category: form.category, // Add category to student object
        admission_date: form.admission_date, // Add admission_date to student object
      },
      login: form.login,
      guardian: { ...form.guardian },
    };
    
    // Use different field names for different APIs
    if (props.isAdmission) {
      formData.append('admissionData', JSON.stringify(dataStructure));
    } else {
      formData.append('studentData', JSON.stringify(dataStructure));
    }
    
    if (form.student.profile_picture) {
      formData.append('student_profile_picture', form.student.profile_picture);
    }
    if (form.guardian.picture) {
      formData.append('guardian_picture', form.guardian.picture);
    }
    let response;
    if (props.isAdmission) {
      // Use admission API for admissions
      response = await apiClient.admissions.createWithFormData(formData);
    } else {
      // Use student API for students
      if (props.isEditing && props.studentId) {
        response = await apiClient.students.updateWithFormData(props.studentId, formData);
      } else {
        response = await apiClient.students.createWithFormData(formData);
      }
    }
    if (response.success) {
      const entityType = props.isAdmission ? 'Admission' : 'Student';
      showSuccess(`${entityType} ${props.isEditing ? 'updated' : 'created'} successfully!`);
      
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
      const entityType = props.isAdmission ? 'admission' : 'student';
      showError(response.message || `Failed to ${props.isEditing ? 'update' : 'create'} ${entityType}`);
    }
  } catch (error) {
    showError(`An error occurred while ${props.isEditing ? 'updating' : 'creating'} the student`);
  } finally {
    loading.value = false;
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
    admission_type: '',
    _temp_class_name: '',
    _temp_section_name: '',
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

// Track if we've already mapped the names to prevent infinite loops
const hasMappedNames = ref(false);
const isMappingNames = ref(false);
const isSettingFormValues = ref(false);

// Watch for academic data changes to map names to IDs in edit mode
watch([() => classes.value, () => sections.value, () => academicYears.value], async () => {
  if (props.isEditing && !hasMappedNames.value && !isMappingNames.value && (form._temp_class_name || form._temp_section_name || form._temp_academic_year_name)) {
    console.log('🔍 Academic data loaded, mapping names to IDs');
    await mapClassAndSectionNames();
  }
}, { immediate: false });

// Update form with response data after successful update
const updateFormWithResponseData = async (data) => {
  
  // Update basic fields
  form.register_no = data.admission_number || form.register_no;
  form.roll_number = data.roll_number || form.roll_number;
  form.admission_date = data.admission_date || form.admission_date;
  form.category = data.category || form.category;
  
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
  
  // Mark as mapping to prevent infinite loops
  isMappingNames.value = true;
  isSettingFormValues.value = true;
  
  // Map class code/name to class_id (only if user hasn't changed it)
  if (form._temp_class_name && classes.value.length > 0 && !userChangedClass.value) {
    const classRecord = classes.value.find(cls => 
      cls.name === form._temp_class_name || 
      cls.code === form._temp_class_name
    );
    if (classRecord) {
      console.log('🔍 Setting class_id to:', classRecord.id);
      form.class_id = classRecord.id;
      console.log('🔍 Set class_id to:', form.class_id);
      
      // Only load sections if we don't already have sections for this class
      const hasSectionsForClass = sections.value.some(sec => sec.class_id === classRecord.id);
      console.log('🔍 Has sections for class:', hasSectionsForClass);
      if (!hasSectionsForClass) {
        try {
          await loadSectionsByClass(classRecord.id, form.school_id, form.branch_id);
          console.log('🔍 Loaded sections for class');
        } catch (error) {
          console.warn('Failed to load sections for class:', error);
        }
      }
    }
  }
  
  // Map section name to section_id (only if user hasn't changed it)
  if (form._temp_section_name && sections.value.length > 0 && !userChangedSection.value) {
    console.log('🔍 Attempting to map section name:', form._temp_section_name);
    const sectionRecord = sections.value.find(sec => 
      sec.name === form._temp_section_name
    );
    console.log('🔍 Found section record:', sectionRecord);
    if (sectionRecord) {
      console.log('🔍 Setting section_id to:', sectionRecord.id);
      form.section_id = sectionRecord.id;
      console.log('🔍 Set section_id to:', form.section_id);
    }
  }
  
  // Map academic year name to academic_year_id
  if (form._temp_academic_year_name && academicYears.value.length > 0) {
    const yearRecord = academicYears.value.find(year => 
      year.name === form._temp_academic_year_name
    );
    if (yearRecord) {
      form.academic_year_id = yearRecord.id;
    }
  }
  
  // Mark as mapped to prevent future calls
  hasMappedNames.value = true;
  isMappingNames.value = false;
  isSettingFormValues.value = false;
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
      await new Promise(resolve => setTimeout(resolve, 100));
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
    if (props.isEditing && (form._temp_class_name || form._temp_section_name || form._temp_academic_year_name)) {
      await mapClassAndSectionNames();
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
</script> 