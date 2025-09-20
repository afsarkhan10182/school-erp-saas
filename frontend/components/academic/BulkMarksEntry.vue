<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Bulk Marks Entry</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Import marks from Excel/CSV file or enter marks in bulk
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="downloadTemplate"
          class="bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm flex items-center gap-1"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            ></path>
          </svg>
          Download Template
        </button>
      </div>
    </div>

    <!-- File Upload Section -->
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">Import from File</h4>

      <div class="space-y-4">
        <!-- File Upload -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Excel/CSV File
          </label>
          <div
            class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
          >
            <div class="space-y-1 text-center">
              <svg
                class="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <div class="flex text-sm text-gray-600 dark:text-gray-400">
                <label
                  for="file-upload"
                  class="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>Upload a file</span>
                  <input
                    id="file-upload"
                    ref="fileInput"
                    type="file"
                    class="sr-only"
                    accept=".xlsx,.xls,.csv"
                    @change="handleFileUpload"
                  />
                </label>
                <p class="pl-1">or drag and drop</p>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Excel or CSV files up to 10MB</p>
            </div>
          </div>
        </div>

        <!-- Selected File Info -->
        <div
          v-if="selectedFile"
          class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
        >
          <div class="flex items-center">
            <svg
              class="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              ></path>
            </svg>
            <div class="flex-1">
              <p class="text-sm font-medium text-blue-900 dark:text-blue-100">
                {{ selectedFile.name }}
              </p>
              <p class="text-xs text-blue-700 dark:text-blue-300">
                {{ formatFileSize(selectedFile.size) }}
              </p>
            </div>
            <button
              @click="clearFile"
              class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Upload Button -->
        <div v-if="selectedFile" class="flex justify-end">
          <button
            @click="processFile"
            :disabled="processing"
            class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <svg
              v-if="processing"
              class="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
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
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
              ></path>
            </svg>
            {{ processing ? 'Processing...' : 'Process File' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Bulk Entry Form -->
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">Quick Bulk Entry</h4>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Default Marks -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Default Marks
          </label>
          <input
            v-model="bulkEntry.defaultMarks"
            type="number"
            :max="exam?.max_marks"
            min="0"
            step="0.01"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Enter default marks"
          />
        </div>

        <!-- Apply to -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Apply to
          </label>
          <select
            v-model="bulkEntry.applyTo"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Students</option>
            <option value="present">Present Students Only</option>
            <option value="absent">Absent Students Only</option>
            <option value="unmarked">Unmarked Students Only</option>
          </select>
        </div>

        <!-- Action Button -->
        <div class="flex items-end">
          <button
            @click="applyBulkMarks"
            :disabled="
              !bulkEntry.defaultMarks ||
              bulkEntry.defaultMarks < 0 ||
              bulkEntry.defaultMarks > exam?.max_marks
            "
            class="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Apply Marks
          </button>
        </div>
      </div>
    </div>

    <!-- Imported Data Preview -->
    <div
      v-if="importedData.length > 0"
      class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div class="flex justify-between items-center mb-4">
        <h4 class="text-md font-medium text-gray-900 dark:text-white">
          Imported Data Preview ({{ importedData.length }} records)
        </h4>
        <div class="flex items-center gap-2">
          <button
            @click="validateImportedData"
            class="bg-yellow-600 text-white px-3 py-2 rounded-md hover:bg-yellow-700 transition-colors text-sm flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            Validate
          </button>
          <button
            @click="applyImportedData"
            :disabled="validationErrors.length > 0"
            class="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            Apply All
          </button>
        </div>
      </div>

      <!-- Validation Errors -->
      <div v-if="validationErrors.length > 0" class="mb-4 space-y-2">
        <div
          v-for="error in validationErrors"
          :key="error"
          class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
        >
          <div class="flex">
            <svg
              class="w-5 h-5 text-red-400 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <p class="text-sm text-red-700 dark:text-red-300">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Data Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Student
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Admission No.
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Marks
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="(item, index) in importedData"
              :key="index"
              class="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ item.student_name || 'Unknown' }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ item.admission_number || 'N/A' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  v-model="item.marks_obtained"
                  type="number"
                  :max="exam?.max_marks"
                  min="0"
                  step="0.01"
                  class="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  :disabled="item.is_absent"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <label class="flex items-center">
                  <input
                    v-model="item.is_absent"
                    type="checkbox"
                    class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    @change="handleAbsentChange(item)"
                  />
                  <span class="ml-2 text-sm text-gray-900 dark:text-white">Absent</span>
                </label>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  @click="removeImportedItem(index)"
                  class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                >
                  Remove
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useToast } from '~/composables/useToast';
import { Exams } from '~/api';

// Props
const props = defineProps({
  exam: {
    type: Object,
    required: true
  },
  students: {
    type: Array,
    default: () => []
  }
});

// Emits
const emit = defineEmits(['marks-updated']);

// Composables
const { showToast } = useToast();

// Reactive data
const selectedFile = ref(null);
const processing = ref(false);
const importedData = ref([]);
const validationErrors = ref([]);

const bulkEntry = reactive({
  defaultMarks: '',
  applyTo: 'all'
});

// Methods
const handleFileUpload = event => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
  }
};

const clearFile = () => {
  selectedFile.value = null;
  importedData.value = [];
  validationErrors.value = [];
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const formatFileSize = bytes => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const processFile = async () => {
  if (!selectedFile.value) return;

  try {
    processing.value = true;

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', selectedFile.value);
    formData.append('exam_id', props.exam.id);

    // Upload and process file
    const response = await Exams.uploadMarksFile(formData);
    importedData.value = response.data.records || [];

    showToast('File processed successfully', 'success');
  } catch (error) {
    showToast('Failed to process file', 'error');
    console.error('Error processing file:', error);
  } finally {
    processing.value = false;
  }
};

const downloadTemplate = async () => {
  try {
    const response = await Exams.downloadMarksTemplate(props.exam.id);

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `marks-template-${props.exam.name}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    showToast('Template downloaded successfully', 'success');
  } catch (error) {
    showToast('Failed to download template', 'error');
    console.error('Error downloading template:', error);
  }
};

const applyBulkMarks = () => {
  if (!bulkEntry.defaultMarks) return;

  const marks = parseFloat(bulkEntry.defaultMarks);
  let targetStudents = [];

  switch (bulkEntry.applyTo) {
    case 'all':
      targetStudents = props.students;
      break;
    case 'present':
      targetStudents = props.students.filter(s => !s.is_absent);
      break;
    case 'absent':
      targetStudents = props.students.filter(s => s.is_absent);
      break;
    case 'unmarked':
      targetStudents = props.students.filter(s => !s.marks_obtained && !s.is_absent);
      break;
  }

  targetStudents.forEach(student => {
    if (!student.is_absent) {
      student.marks_obtained = marks;
      student.percentage = props.exam.max_marks > 0 ? (marks / props.exam.max_marks) * 100 : 0;
    }
  });

  showToast(`Applied marks to ${targetStudents.length} students`, 'success');
  emit('marks-updated');
};

const validateImportedData = () => {
  const errors = [];

  importedData.value.forEach((item, index) => {
    const marks = parseFloat(item.marks_obtained);

    if (item.is_absent) {
      item.marks_obtained = 0;
      return;
    }

    if (isNaN(marks) || marks < 0) {
      errors.push(`Row ${index + 1}: Invalid marks entered`);
    } else if (marks > props.exam.max_marks) {
      errors.push(`Row ${index + 1}: Marks exceed maximum (${props.exam.max_marks})`);
    }
  });

  validationErrors.value = errors;

  if (errors.length === 0) {
    showToast('All imported data is valid', 'success');
  } else {
    showToast(`Found ${errors.length} validation errors`, 'error');
  }
};

const applyImportedData = () => {
  if (validationErrors.value.length > 0) {
    showToast('Please fix validation errors before applying', 'error');
    return;
  }

  // Apply imported data to students
  importedData.value.forEach(importedItem => {
    const student = props.students.find(
      s =>
        s.admission_number === importedItem.admission_number ||
        `${s.first_name} ${s.last_name}`.toLowerCase() === importedItem.student_name?.toLowerCase()
    );

    if (student) {
      student.marks_obtained = parseFloat(importedItem.marks_obtained) || 0;
      student.is_absent = importedItem.is_absent || false;
      student.percentage = student.is_absent
        ? 0
        : (student.marks_obtained / props.exam.max_marks) * 100;
    }
  });

  showToast('Imported data applied successfully', 'success');
  emit('marks-updated');

  // Clear imported data
  importedData.value = [];
  validationErrors.value = [];
};

const handleAbsentChange = item => {
  if (item.is_absent) {
    item.marks_obtained = 0;
  }
};

const removeImportedItem = index => {
  importedData.value.splice(index, 1);
};
</script>
