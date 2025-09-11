<template>
  <div class="p-4">
    <h2 class="text-xl font-semibold mb-4">Bulk Import Attendance</h2>

    <!-- Instructions Card -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <h3 class="font-semibold text-blue-800 mb-2">Instructions</h3>
      <ul class="text-sm text-blue-700 space-y-1">
        <li>• Upload a CSV or Excel file (.csv, .xlsx, .xls) with attendance records</li>
        <li>• Required columns: Date, Class (name), AdmissionNo, Status</li>
        <li>• Optional columns: Section (name), Type (daily/period), PeriodNumber</li>
        <li>• Use class names like "Class 11" or "Grade 10" - no technical IDs needed!</li>
        <li>• Use admission numbers like "3492" or student names</li>
        <li>• Status values: present, absent, late, excused</li>
        <li>• Date format: YYYY-MM-DD (e.g., 2025-08-11)</li>
      </ul>
    </div>

    <!-- File Upload Section -->
    <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h3 class="font-semibold mb-4">Upload File</h3>

      <div class="flex items-center justify-center w-full">
        <label
          for="dropzone-file"
          class="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
          :class="{ 'border-blue-400 bg-blue-50': dragOver }"
          @drop="handleDrop"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
        >
          <div class="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              class="w-8 h-8 mb-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              ></path>
            </svg>
            <p class="mb-2 text-sm text-gray-500">
              <span class="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p class="text-xs text-gray-500">CSV or Excel files only</p>
            <p v-if="selectedFile" class="text-sm text-blue-600 mt-2">
              Selected: {{ selectedFile.name }}
            </p>
          </div>
          <input
            id="dropzone-file"
            type="file"
            class="hidden"
            accept=".csv,.xlsx,.xls"
            @change="handleFileSelect"
          />
        </label>
      </div>
    </div>

    <!-- Upload Button -->
    <div class="flex gap-4 mb-6">
      <button
        @click="uploadFile"
        :disabled="!selectedFile || uploading"
        class="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ uploading ? 'Processing...' : 'Upload & Import' }}
      </button>

      <button @click="downloadTemplate" class="bg-green-600 text-white px-6 py-2 rounded">
        Download Excel Template
      </button>

      <NuxtLink to="/attendance" class="bg-gray-600 text-white px-6 py-2 rounded">
        Back to Attendance
      </NuxtLink>
    </div>

    <!-- Results Section -->
    <div v-if="results" class="bg-white border border-gray-200 rounded-lg p-6">
      <h3 class="font-semibold mb-4">Import Results</h3>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div class="bg-green-50 border border-green-200 rounded p-4">
          <div class="text-2xl font-bold text-green-700">{{ results.imported || 0 }}</div>
          <div class="text-sm text-green-600">Records Imported</div>
        </div>

        <div class="bg-yellow-50 border border-yellow-200 rounded p-4">
          <div class="text-2xl font-bold text-yellow-700">{{ results.skipped || 0 }}</div>
          <div class="text-sm text-yellow-600">Skipped</div>
        </div>

        <div class="bg-red-50 border border-red-200 rounded p-4">
          <div class="text-2xl font-bold text-red-700">{{ results.errors?.length || 0 }}</div>
          <div class="text-sm text-red-600">Errors</div>
        </div>

        <div class="bg-blue-50 border border-blue-200 rounded p-4">
          <div class="text-2xl font-bold text-blue-700">{{ results.totalRows || 0 }}</div>
          <div class="text-sm text-blue-600">Total Rows Processed</div>
        </div>
      </div>

      <!-- Error Details -->
      <div v-if="results.errors && results.errors.length > 0" class="mt-4">
        <h4 class="font-semibold text-red-700 mb-2">Errors:</h4>
        <div class="bg-red-50 border border-red-200 rounded p-4 max-h-60 overflow-y-auto">
          <ul class="text-sm text-red-700 space-y-1">
            <li v-for="(error, index) in results.errors" :key="index">
              Row {{ error.row }}: {{ error.message }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Summary Message -->
      <div v-if="results.summary" class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <p class="text-blue-700">{{ results.summary }}</p>
      </div>

      <!-- Success Message -->
      <div v-if="results.imported > 0" class="mt-4 p-4 bg-green-50 border border-green-200 rounded">
        <p class="text-green-700">
          Successfully imported {{ results.imported }} attendance records.
          <NuxtLink to="/attendance" class="underline">View attendance sessions</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useToast } from '~/composables/useToast';
import { Attendance } from '~/api';

const { showSuccess, showError, showWarning } = useToast();

const dragOver = ref(false);
const selectedFile = ref<File | null>(null);
const uploading = ref(false);
const results = ref<any>(null);

const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
  dragOver.value = true;
};

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault();
  dragOver.value = false;
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  dragOver.value = false;

  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    const file = files[0];
    if (isValidFile(file)) {
      selectedFile.value = file;
    } else {
      showError('Please select a CSV or Excel file');
    }
  }
};

const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];

  if (file && isValidFile(file)) {
    selectedFile.value = file;
  } else if (file) {
    showError('Please select a CSV or Excel file');
  }
};

const isValidFile = (file: File) => {
  const validTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  return (
    validTypes.includes(file.type) ||
    file.name.endsWith('.csv') ||
    file.name.endsWith('.xlsx') ||
    file.name.endsWith('.xls')
  );
};

const uploadFile = async () => {
  if (!selectedFile.value) {
    showError('Please select a file to upload');
    return;
  }

  uploading.value = true;
  results.value = null;

  try {
    const formData = new FormData();
    formData.append('file', selectedFile.value);

    const response = await Attendance.uploadBulkImportFile(selectedFile.value);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Upload failed');
    }

    const data = await response.json();
    results.value = {
      imported: data.data?.imported || 0,
      skipped: data.data?.skipped || 0,
      totalRows: data.data?.totalRows || 0,
      errors: data.data?.errors || [],
      summary: data.data?.summary || ''
    };

    if (results.value.imported > 0) {
      showSuccess(`Successfully imported ${results.value.imported} attendance records`);
    } else {
      showWarning('No records were imported. Please check the file format and data.');
    }
  } catch (error: any) {
    console.error('Upload error:', error);
    showError(error.message || 'Failed to upload file');
    results.value = {
      imported: 0,
      skipped: 0,
      totalRows: 0,
      errors: [{ row: 'File', message: error.message }],
      summary: 'Upload failed'
    };
  } finally {
    uploading.value = false;
  }
};

const downloadTemplate = async () => {
  try {
    const response = await Attendance.getImportTemplate();

    // Check if the response is successful (axios response structure)
    if (response.status !== 200) {
      throw new Error('Failed to generate template');
    }

    // For axios with responseType: 'blob', the data is already a blob
    const blob = response.data;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-import-template-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    showSuccess('Template downloaded successfully!');
  } catch (error) {
    console.error('Error downloading template:', error);
    showError('Failed to download template. Please try again.');
  }
};
</script>

<style scoped>
/* Additional styles for drag and drop */
</style>
