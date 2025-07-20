<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Multiple Import</h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">Import multiple students from CSV file</p>
      </div>

      <!-- Instructions Card -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div class="p-6">
          <div class="flex justify-between items-start mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Instructions:</h2>
            <button
              @click="downloadSampleFile"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Download class="w-4 h-4 mr-2" />
              Download Sample Import File
            </button>
          </div>
          
          <ol class="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>Download the first sample file.</li>
            <li>Open the downloaded 'csv' file and carefully fill the details of the student.</li>
            <li>The date you are trying to enter the "Birthday" and "AdmissionDate" column make sure the date format is Y-m-d (2025-07-20).</li>
            <li>Do not import the duplicate "Roll Number" And "Register No".</li>
            <li>For student "Gender" use Male, Female value.</li>
            <li>If enable Automatically Generate login details, leave the "username" and "password" columns blank.</li>
            <li>For "CategoryID" use: 1=General, 2=OBC, 3=SC, 4=ST, 5=Other</li>
            <li>If a parent is existing / if you want to use the same parent information for multiple students only enter the "GuardianUsername" and leave other columns blank.</li>
          </ol>
        </div>
      </div>

      <!-- Import Form -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="p-6">
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- School Selection (Super Admin Only) -->
            <div v-if="authStore.currentUser?.role === 'super_admin'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                School <span class="text-red-500">*</span>
              </label>
              <EnhancedDropdown
                v-model="form.school_id"
                :options="schoolOptions"
                placeholder="Select School"
                :loading="schoolsLoading"
                @update:model-value="onSchoolChange"
              />
            </div>

            <!-- Branch Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Branch <span class="text-red-500">*</span>
              </label>
              <EnhancedDropdown
                v-model="form.branch_id"
                :options="branchOptions"
                :placeholder="authStore.currentUser?.role === 'super_admin' ? (form.school_id ? 'Select Branch' : 'Select School First') : 'Select Branch'"
                :loading="branchesLoading"
                :disabled="authStore.currentUser?.role === 'super_admin' && !form.school_id"
                @update:model-value="onBranchChange"
              />
            </div>

            <!-- Class Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Class <span class="text-red-500">*</span>
              </label>
              <EnhancedDropdown
                v-model="form.class_id"
                :options="classOptions"
                :placeholder="form.branch_id ? 'Select Class' : 'First Select The Branch'"
                :loading="academicsLoading"
                :disabled="!form.branch_id"
                @update:model-value="onClassChange"
              />
            </div>

            <!-- Section Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Section <span class="text-red-500">*</span>
              </label>
              <EnhancedDropdown
                v-model="form.section_id"
                :options="sectionOptions"
                :placeholder="form.class_id ? 'Select Section' : 'Select Class First'"
                :loading="sectionsLoading"
                :disabled="!form.class_id"
                @update:model-value="onSectionChange"
              />
            </div>

            <!-- File Upload -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select CSV File <span class="text-red-500">*</span>
              </label>
              <div
                @click="triggerFileInput"
                @dragover="handleDragOver"
                @dragenter="handleDragEnter"
                @dragleave="handleDragLeave"
                @drop="handleFileDrop"
                class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md cursor-pointer transition-all duration-200 ease-in-out drag-zone"
                :class="{
                  'border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-105 shadow-lg drag-over': isDragOver,
                  'hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700/50': !isDragOver
                }"
                style="min-height: 120px;"
              >
                <div class="space-y-1 text-center">
                  <!-- Upload Icon -->
                  <svg
                    v-if="!isDragOver"
                    class="mx-auto h-12 w-12 text-gray-400 transition-colors duration-200"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  
                  <!-- Drop Icon -->
                  <svg
                    v-else
                    class="mx-auto h-12 w-12 text-indigo-500 animate-pulse"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M24 8v20m0 0l-8-8m8 8l8-8"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  
                  <div class="flex text-sm text-gray-600 dark:text-gray-400">
                    <span class="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                      {{ isDragOver ? 'Drop your CSV file here' : 'Upload a file' }}
                    </span>
                    <p v-if="!isDragOver" class="pl-1">or drag and drop</p>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ isDragOver ? 'Release to upload' : 'CSV files only' }}
                  </p>
                </div>
              </div>
              
              <!-- Hidden file input -->
              <input
                ref="fileInput"
                type="file"
                class="hidden"
                accept=".csv,text/csv"
                @change="handleFileSelect"
                multiple="false"
                style="position: absolute; opacity: 0; pointer-events: none;"
              />
              
              <!-- Selected File Display -->
              <div v-if="selectedFile" class="mt-2 flex items-center space-x-2">
                <CheckCircle class="w-5 h-5 text-green-500" />
                <span class="text-sm text-gray-600 dark:text-gray-400">{{ selectedFile.name }}</span>
                <button
                  @click="removeFile"
                  type="button"
                  class="text-red-500 hover:text-red-700"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>



            <!-- Submit Button -->
            <div class="flex justify-end">
              <button
                type="submit"
                :disabled="!canSubmit || loading"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="loading" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Importing Students...
                </span>
                <span v-else>Import Students</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Results Modal -->
      <Modal v-if="showResults" @close="showResults = false">
        <template #header>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">Import Results</h3>
        </template>
        
        <template #body>
          <div class="space-y-4">
            <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Total Records:</span>
              <span class="text-sm text-gray-900 dark:text-white">{{ importResults.total }}</span>
            </div>
            
            <div class="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span class="text-sm font-medium text-green-700 dark:text-green-300">Successfully Imported:</span>
              <span class="text-sm text-green-900 dark:text-green-100">{{ importResults.successful }}</span>
            </div>
            
            <div class="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span class="text-sm font-medium text-red-700 dark:text-red-300">Failed:</span>
              <span class="text-sm text-red-900 dark:text-red-100">{{ importResults.failed }}</span>
            </div>
          </div>

          <!-- Error Details -->
          <div v-if="importResults.errors && importResults.errors.length > 0" class="mt-6">
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Error Details:</h4>
            <div class="max-h-60 overflow-y-auto space-y-2">
              <div
                v-for="error in importResults.errors"
                :key="error.row"
                class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
              >
                <div class="text-sm text-red-700 dark:text-red-300">
                  <span class="font-medium">Row {{ error.row }}:</span> {{ error.error }}
                </div>
                <!-- Show the data that caused the error -->
                <div v-if="error.data" class="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  <details>
                    <summary class="cursor-pointer hover:text-gray-800 dark:hover:text-gray-200">
                      View Data
                    </summary>
                    <pre class="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">{{ JSON.stringify(error.data, null, 2) }}</pre>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </template>
        
        <template #footer>
          <button
            @click="showResults = false"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Close
          </button>
        </template>
      </Modal>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useBranches } from '~/composables/useBranches';
import { useAcademics } from '~/composables/useAcademics';
import { useSchools } from '~/composables/useSchools';
import { useToast } from '~/composables/useToast';
import { apiClient } from '~/utils/api';
import { Download, CheckCircle, X } from 'lucide-vue-next';
import EnhancedDropdown from '~/components/EnhancedDropdown.vue';
import Modal from '~/components/Modal.vue';

// Meta
definePageMeta({
  middleware: 'auth',
  title: 'Multiple Import',
});

const authStore = useAuthStore();
const { branches, loading: branchesLoading, fetchBranches } = useBranches();
const { schools, loading: schoolsLoading, fetchSchools } = useSchools();
const { 
  classes, 
  sections, 
  loading: academicsLoading,
  fetchClasses, 
  fetchSections 
} = useAcademics();
const { showSuccess, showError, showWarning } = useToast();

// Form state
const loading = ref(false);
const sectionsLoading = ref(false);
const isDragOver = ref(false);
const selectedFile = ref(null);
const fileInput = ref(null);
const showResults = ref(false);
const importResults = ref({});

// Form data
const form = reactive({
  school_id: '',
  branch_id: '',
  class_id: '',
  section_id: '',
});

// Computed properties
const canSubmit = computed(() => {
  if (authStore.currentUser?.role === 'super_admin') {
    return form.school_id && form.branch_id && form.class_id && form.section_id && selectedFile.value;
  }
  return form.branch_id && form.class_id && form.section_id && selectedFile.value;
});

const schoolOptions = computed(() => {
  return schools.value.map(school => ({
    value: school.id,
    label: school.name
  }));
});

const branchOptions = computed(() => {
  return branches.value.map(branch => ({
    value: branch.id,
    label: branch.name
  }));
});

const classOptions = computed(() => {
  return classes.value.map(cls => ({
    value: cls.id,
    label: cls.name
  }));
});

const sectionOptions = computed(() => {
  return sections.value.map(section => ({
    value: section.id,
    label: section.name
  }));
});

// Methods
const onSchoolChange = async () => {
  form.branch_id = '';
  form.class_id = '';
  form.section_id = '';
  branches.value = [];
  classes.value = [];
  sections.value = [];
  branchesLoading.value = true;
  
  if (form.school_id) {
    try {
      await fetchBranches(form.school_id);
      
      // Auto-select branch if there's only one
      if (branches.value.length === 1) {
        form.branch_id = branches.value[0].id;
        // Load classes for the auto-selected branch
        await onBranchChange();
      }
    } catch (error) {
      showError('Failed to load branches. Please try again.');
    } finally {
      branchesLoading.value = false;
    }
  } else {
    branchesLoading.value = false;
  }
};

const onBranchChange = async () => {
  form.class_id = '';
  form.section_id = '';
  classes.value = [];
  sections.value = [];
  academicsLoading.value = true;
  
  if (form.branch_id) {
    try {
      const schoolId = authStore.currentUser?.role === 'super_admin' ? form.school_id : authStore.currentUser?.school_id;
      
      await fetchClasses(schoolId, form.branch_id);
      
      // Auto-select class if there's only one
      if (classes.value.length === 1) {
        form.class_id = classes.value[0].id;
        // Load sections for the auto-selected class
        await onClassChange();
      }
    } catch (error) {
      showError('Failed to load classes. Please try again.');
    } finally {
      academicsLoading.value = false;
    }
  } else {
    academicsLoading.value = false;
  }
};

const onClassChange = async () => {
  form.section_id = '';
  sections.value = [];
  sectionsLoading.value = true;
  
  if (form.class_id) {
    try {
      const schoolId = authStore.currentUser?.role === 'super_admin' ? form.school_id : authStore.currentUser?.school_id;
      
      await fetchSections(schoolId, form.branch_id, form.class_id);
      
      // If no sections found and we're super admin, try without branch_id
      if (sections.value.length === 0 && authStore.currentUser?.role === 'super_admin') {
        await fetchSections(schoolId, null, form.class_id);
      }
      
      // Auto-select section if there's only one
      if (sections.value.length === 1) {
        form.section_id = sections.value[0].id;
      }
    } catch (error) {
      showError('Failed to load sections. Please try again.');
    } finally {
      sectionsLoading.value = false;
    }
  } else {
    sectionsLoading.value = false;
  }
};

const onSectionChange = () => {
  // Section changed
};

const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click();
  } else {
    // Try to find the file input again
    const input = document.querySelector('input[type="file"]');
    if (input) {
      input.click();
    }
  }
};

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  
  if (file) {
    if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
      selectedFile.value = file;
    } else {
      showError('Please select a valid CSV file');
      // Reset the input
      if (fileInput.value) {
        fileInput.value.value = '';
      }
    }
  }
};

const handleDragOver = (event) => {
  event.preventDefault();
  event.stopPropagation();
  isDragOver.value = true;
  
  // Set dataTransfer effect to allow drop
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy';
  }
};

const handleDragEnter = (event) => {
  event.preventDefault();
  event.stopPropagation();
  isDragOver.value = true;
  
  // Set dataTransfer effect to allow drop
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy';
  }
};

const handleDragLeave = (event) => {
  event.preventDefault();
  event.stopPropagation();
  
  // Only set isDragOver to false if we're leaving the drop zone entirely
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX;
  const y = event.clientY;
  
  if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
    isDragOver.value = false;
  }
};

const handleFileDrop = (event) => {
  event.preventDefault();
  event.stopPropagation();
  isDragOver.value = false;
  
  // Check if we have files in the dataTransfer
  if (!event.dataTransfer.files || event.dataTransfer.files.length === 0) {
    // Try to get files from items
    if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
      const items = Array.from(event.dataTransfer.items);
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        if (item.kind === 'file') {
          const file = item.getAsFile();
          
          if (file) {
            handleDroppedFile(file);
            return;
          }
        }
      }
    }
    
    showError('No file found in drop event');
    return;
  }
  
  const files = event.dataTransfer.files;
  
  if (files.length > 0) {
    const file = files[0];
    handleDroppedFile(file);
  } else {
    showError('No file found in drop event');
  }
};

const handleDroppedFile = (file) => {
  // Check if it's a CSV file
  if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
    // Set the selected file
    selectedFile.value = file;
    
    // Update the file input value for consistency
    if (fileInput.value) {
      try {
        // Create a new FileList-like object
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.value.files = dataTransfer.files;
      } catch (error) {
        // Fallback: just set the selected file without updating input
      }
    }
    
    // Show success message
    showSuccess(`File "${file.name}" selected successfully!`);
  } else {
    showError('Please drop a valid CSV file');
  }
};

const removeFile = () => {
  selectedFile.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};



const downloadSampleFile = () => {
  const csvContent = `FirstName,LastName,BloodGroup,Gender,Birthday,MotherTongue,Religion,Caste,Phone,City,State,PresentAddress,PermanentAddress,CategoryID,Roll,RegisterNo,AdmissionDate,StudentEmail,StudentUsername,StudentPassword,GuardianName,GuardianRelation,FatherName,MotherName,GuardianOccupation,GuardianMobileNo,GuardianAddress,GuardianEmail,GuardianUsername,GuardianPassword
student fname,student lname,,Female,2008-09-01,Urdu,Muslim,General,1234567890,Bhiwandi,Maharashtra,Address ,permanent Address,1,1,100,2008-09-01,studentemail@tezt.com,,,Guardionname,Father,Saleem,Amna,,1234567890,address guardion,guardian@gmail.com,,`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Student-Admission-template.csv';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  showSuccess('Sample file downloaded successfully!');
};

const handleSubmit = async () => {
  if (!canSubmit.value) return;

  loading.value = true;
  try {
    const formData = new FormData();
    formData.append('csv_file', selectedFile.value);
    formData.append('branch_id', form.branch_id);
    formData.append('class_id', form.class_id);
    formData.append('section_id', form.section_id);

    // Add school_id for super admin
    if (authStore.currentUser?.role === 'super_admin') {
      formData.append('school_id', form.school_id);
    }

    const response = await apiClient.students.bulkImport(formData);
    
    if (response.success) {
      importResults.value = response.data;
      showResults.value = true;
      
      // Check if there were any failures
      if (response.data.failed > 0) {
        // Show warning if some failed, success if all succeeded
        if (response.data.successful === 0) {
          // All failed - show error
          showError(response.message);
        } else {
          // Partial success - show warning
          showWarning(response.message);
        }
      } else {
        // All successful
        showSuccess(response.message);
      }
      
      // Reset form only if all imports were successful
      if (response.data.failed === 0) {
        selectedFile.value = null;
        if (fileInput.value) {
          fileInput.value.value = '';
        }
      }
    } else {
      showError(response.message || 'Import failed');
    }
  } catch (error) {
    console.error('Error importing students:', error);
    showError(error.response?.data?.message || 'Import failed. Please try again.');
  } finally {
    loading.value = false;
  }
};

// Initialize data
onMounted(async () => {
  if (authStore.currentUser?.role === 'super_admin') {
    // Load schools for super admin
    await fetchSchools();
    
    // Auto-select school if there's only one
    if (schools.value.length === 1) {
      form.school_id = schools.value[0].id;
      await onSchoolChange();
    }
  } else {
    // For school admin and branch admin, load branches directly
    await fetchBranches(authStore.currentUser?.school_id);
    
    // Auto-select branch if there's only one
    if (branches.value.length === 1) {
      form.branch_id = branches.value[0].id;
      await onBranchChange();
    }
  }
});
</script>

<style scoped>
/* Custom styles for drag and drop */
.border-dashed {
  border-style: dashed;
}

/* Drag and drop animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Smooth transitions for drag states */
.transition-all {
  transition: all 0.2s ease-in-out;
}

/* Scale animation for drag over */
.scale-105 {
  transform: scale(1.05);
}

/* Enhanced shadow for drag over state */
.shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Improved drag and drop zone styling */
.drag-zone {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.drag-zone.drag-over {
  transform: scale(1.02);
  border-color: #6366f1 !important;
  background-color: rgba(99, 102, 241, 0.1) !important;
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.3) !important;
}

.drag-zone::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent 30%, rgba(99, 102, 241, 0.1) 50%, transparent 70%);
  background-size: 200% 200%;
  animation: shimmer 2s infinite;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.drag-zone.drag-over::before {
  opacity: 1;
}

/* Better visual feedback for drag states */
.drag-over .text-gray-400 {
  color: #6366f1 !important;
}

.drag-over .text-gray-500 {
  color: #6366f1 !important;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* File input styling */
input[type="file"] {
  position: absolute !important;
  opacity: 0 !important;
  pointer-events: none !important;
  width: 1px !important;
  height: 1px !important;
  overflow: hidden !important;
}

/* Enhanced focus states */
.drag-zone:focus-within {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Loading states */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.dark .loading-overlay {
  background: rgba(0, 0, 0, 0.8);
}
</style> 