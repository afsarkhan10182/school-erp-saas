<template>
  <div class="space-y-6 max-w-5xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Multiple Import</h1>
      <p class="text-sm text-gray-600 dark:text-gray-400">Import students from CSV or Excel</p>
    </div>

    <!-- Instructions Card -->
    <div class="card">
      <div>
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Instructions</h2>
          <div class="relative" data-dropdown="download">
            <button
              @click="showDownloadDropdown = !showDownloadDropdown"
              class="btn-primary flex items-center gap-2"
            >
              <Download class="w-4 h-4" />
              Download Student Sample Data
              <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </button>

            <!-- Dropdown Menu -->
            <div
              v-if="showDownloadDropdown"
              class="absolute top-full right-0 mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 min-w-[220px] p-1 overflow-hidden"
            >
              <div class="space-y-0.5">
                <button
                  @click="
                    downloadTemplate('required');
                    showDownloadDropdown = false;
                  "
                  class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 rounded-lg flex items-center gap-2"
                >
                  <Download class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Mandatory/Required Fields only
                </button>
                <button
                  @click="
                    downloadTemplate('complete');
                    showDownloadDropdown = false;
                  "
                  class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 rounded-lg flex items-center gap-2"
                >
                  <Download class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  All Fields
                </button>
              </div>
            </div>
          </div>
        </div>

          <ol class="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>Choose your preferred template:</li>
            <ul class="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>
                <strong>Download Required Fields:</strong> Contains only mandatory fields with
                sample data for quick imports
              </li>
              <li>
                <strong>Download Complete Template:</strong> Contains all fields (mandatory +
                optional) with sample data for reference
              </li>
            </ul>
            <li>Open the downloaded CSV file and carefully fill the details of the students.</li>
            <li>
              For dates (Birthday, AdmissionDate), use the format YYYY-MM-DD (e.g., 2005-06-15).
            </li>
            <li>
              <strong>Mandatory Student Fields:</strong> FirstName, Gender, Birthday, AdmissionDate,
              AdmissionNumber
            </li>
            <li>
              <strong>Mandatory Guardian Fields:</strong> GuardianName, GuardianRelation,
              GuardianMobileNo, GuardianAddress
            </li>
            <li>
              <strong>Optional Fields:</strong> LastName, Roll, BloodGroup, Phone, City, State,
              Address, StudentEmail, AadhaarNumber, Stream, PreviousExams, MotherTongue, Religion,
              Caste, FatherName, MotherName, House, PEN, APAARID, SRNo, PreviousSoftwareID
            </li>
            <li>Do not import duplicate "Roll Number" or "Admission Number".</li>
            <li>For "Gender" use: male, female, other</li>
          </ol>
        </div>
      </div>

      <!-- Import Form -->
      <div class="card">
        <div>
          <form @submit.prevent="handlePreview" class="space-y-6">
            <!-- Branch / School Context -->
            <div
              v-if="currentBranch || currentSchool"
              class="p-4 bg-blue-50 dark:bg-gray-700/50 rounded-lg border border-blue-200 dark:border-gray-600 flex items-center justify-between"
            >
              <div class="flex items-center space-x-3">
                <span
                  class="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm"
                >
                  {{ (currentBranch?.name || currentSchool?.name || 'B').charAt(0).toUpperCase() }}
                </span>
                <div>
                  <div class="flex items-center space-x-2">
                    <span class="text-sm font-semibold text-gray-900 dark:text-white">
                      {{ currentBranch?.name || (selectedBranchId ? 'Active Branch' : 'All Branches') }}
                    </span>
                    <span
                      class="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-full font-medium"
                    >
                      {{ selectedBranchId ? 'Active Branch' : 'All Branches' }}
                    </span>
                  </div>
                  <p v-if="currentSchool" class="text-xs text-gray-500 dark:text-gray-400">
                    {{ currentSchool.name }}
                  </p>
                </div>
              </div>
              <span class="text-xs text-gray-500 dark:text-gray-400 italic hidden sm:block">
                Top Navigation Context
              </span>
            </div>

            <p
              v-if="!form.branch_id"
              role="status"
              class="text-sm text-amber-800 dark:text-amber-200"
            >
              Select a specific branch from the top navigation before importing students.
            </p>

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

            <!-- Stream Selection - Only if class has streams -->
            <div v-if="hasStreams">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stream <span class="text-red-500">*</span>
              </label>
              <EnhancedDropdown
                v-model="form.stream_id"
                :options="streamOptions"
                :placeholder="form.class_id ? 'Select Stream' : 'Select Class First'"
                :loading="streamsLoading"
                :disabled="!form.class_id"
                @update:model-value="onStreamChange"
              />
            </div>

            <!-- Section Selection - Only if class/stream has sections -->
            <div v-if="hasSections">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Section
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
                Select CSV or Excel File <span class="text-red-500">*</span>
              </label>
              <div
                @click="triggerFileInput"
                @dragover="handleDragOver"
                @dragenter="handleDragEnter"
                @dragleave="handleDragLeave"
                @drop="handleFileDrop"
                class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md cursor-pointer transition-all duration-200 ease-in-out drag-zone"
                :class="{
                  'border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-105 shadow-lg drag-over':
                    isDragOver,
                  'hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700/50':
                    !isDragOver
                }"
                style="min-height: 120px"
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
                    <span
                      class="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      {{ isDragOver ? 'Drop your file here' : 'Upload a file' }}
                    </span>
                    <p v-if="!isDragOver" class="pl-1">or drag and drop</p>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ isDragOver ? 'Release to upload' : 'CSV, XLS, or XLSX files' }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Up to 10 MB and 20,000 student rows. A title line above the headings is
                    supported.
                  </p>
                </div>
              </div>

              <!-- Hidden file input -->
              <input
                ref="fileInput"
                type="file"
                class="hidden"
                accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                @change="handleFileSelect"
                style="position: absolute; opacity: 0; pointer-events: none"
              />

              <!-- Selected File Display -->
              <div v-if="selectedFile" class="mt-2 flex items-center space-x-2">
                <CheckCircle class="w-5 h-5 text-green-500" />
                <span class="text-sm text-gray-600 dark:text-gray-400">{{
                  selectedFile.name
                }}</span>
                <button @click="removeFile" type="button" class="text-red-500 hover:text-red-700">
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <section
              v-if="importHeaders.length"
              class="space-y-3 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">Match file columns</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Headings were found on row {{ importHeaderRow }}. Choose a column for every
                  required field. Map either First name or Full name; optional fields can be left unmapped.
                </p>
              </div>
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label v-for="field in importFields" :key="field.field" class="text-sm">
                  <span class="mb-1 block text-gray-700 dark:text-gray-300">
                    {{ field.label }}<span v-if="field.required" class="text-red-500"> *</span>
                  </span>
                  <select v-model="columnMapping[field.field]" class="input w-full">
                    <option value="">{{ field.required ? 'Select a column' : 'Not mapped' }}</option>
                    <option v-for="header in importHeaders" :key="header.index" :value="String(header.index)">
                      {{ header.label }}
                    </option>
                  </select>
                </label>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ importRowCount }} student rows detected. Only the first worksheet is read.
              </p>
            </section>

            <!-- Submit Button -->
            <div class="flex justify-end">
              <button
                type="submit"
                :disabled="!canSubmit || loading || (importHeaders.length > 0 && !isMappingComplete)"
                class="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="loading" class="flex items-center gap-2">
                  <svg
                    class="animate-spin h-4 w-4 text-white"
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
                  {{ isPreviewRequest ? 'Checking rows...' : 'Importing Students...' }}
                </span>
                <span v-else>{{ importHeaders.length ? 'Preview Import' : 'Read headings and match columns' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <section class="card space-y-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Earlier imports</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Recent runs and row-level errors for this school/branch.
            </p>
          </div>
          <button
            type="button"
            class="btn-secondary"
            :disabled="historyLoading"
            @click="loadImportHistory"
          >
            {{ historyLoading ? 'Refreshing…' : 'Refresh' }}
          </button>
        </div>
        <p v-if="historyError" class="text-sm text-amber-700 dark:text-amber-300">
          {{ historyError }}
        </p>
        <p v-else-if="historyLoading" class="text-sm text-gray-500 dark:text-gray-400">
          Loading recent imports…
        </p>
        <p v-else-if="!importHistory.length" class="text-sm text-gray-500 dark:text-gray-400">
          No imports recorded for this scope yet.
        </p>
        <div v-else class="space-y-3">
          <article
            v-for="batch in importHistory"
            :key="batch.id"
            class="rounded-lg border border-gray-200 dark:border-gray-700 p-3"
          >
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p class="font-medium text-gray-900 dark:text-white">{{ batch.file_name }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ new Date(batch.created_at).toLocaleString() }}
                </p>
              </div>
              <span class="text-sm capitalize text-gray-700 dark:text-gray-300">{{ batch.status }}</span>
            </div>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {{ batch.successful_rows }} imported · {{ batch.failed_rows }} failed ·
              {{ batch.total_rows }} total
            </p>
            <div v-if="batch.undone_at" class="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Undo completed {{ new Date(batch.undone_at).toLocaleString() }}
            </div>
            <button
              v-else-if="batch.undo_ready"
              type="button"
              class="btn-danger mt-3"
              :disabled="Boolean(undoingBatchId)"
              @click="pendingUndoBatch = batch"
            >
              {{ undoingBatchId === batch.id ? 'Undoing…' : 'Undo this import' }}
            </button>
            <details v-if="batch.row_errors?.length" class="mt-2 text-sm">
              <summary class="cursor-pointer text-red-700 dark:text-red-300">
                Review {{ batch.row_errors.length }} row errors
              </summary>
              <ul class="mt-2 max-h-40 list-disc space-y-1 overflow-auto pl-5 text-gray-600 dark:text-gray-300">
                <li v-for="error in batch.row_errors" :key="`${batch.id}-${error.row}`">
                  Row {{ error.row }}: {{ error.error }}
                </li>
              </ul>
              <p v-if="batch.failed_rows > batch.row_errors.length" class="mt-1 text-xs text-gray-500">
                Showing the first {{ batch.row_errors.length }} errors.
              </p>
            </details>
          </article>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Import history cannot be edited. Eligible imports can be undone while they meet the safety
          checks.
        </p>
      </section>

      <ConfirmDialog
        :show="Boolean(pendingUndoBatch)"
        title="Undo this student import?"
        :message="`This removes ${pendingUndoBatch?.successful_rows || 0} imported students only if they have not been edited or used by attendance, exams, fees, homework, library, transport, hostel, or other records. The action cannot be reversed. Any shared or updated guardian records will be preserved.`"
        confirm-label="Undo import"
        @close="pendingUndoBatch = null"
        @confirm="undoImportBatch"
      />

      <!-- Results Modal -->
      <Modal :show="showResults" @close="showResults = false">
        <template #header>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            {{ previewOnly ? 'Review Student Import' : 'Import Results' }}
          </h3>
        </template>

        <template #body>
          <div class="space-y-4">
            <div
              class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >Total Records:</span
              >
              <span class="text-sm font-bold text-gray-900 dark:text-white">{{
                importResults.total || 0
              }}</span>
            </div>

            <div
              class="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg"
            >
              <span class="text-sm font-medium text-green-700 dark:text-green-300">
                {{ previewOnly ? 'Ready to import:' : 'Successfully Imported:' }}
              </span>
              <span class="text-sm font-bold text-green-600 dark:text-green-400">{{
                importResults.successful || 0
              }}</span>
            </div>

            <div
              v-if="importResults.failed > 0"
              class="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg"
            >
              <span class="text-sm font-medium text-red-700 dark:text-red-300">Failed:</span>
              <span class="text-sm font-bold text-red-600 dark:text-red-400">{{
                importResults.failed || 0
              }}</span>
            </div>

            <p v-if="previewOnly" class="text-sm text-gray-600 dark:text-gray-300">
              Nothing has been saved. The eligible rows below will be revalidated when you confirm;
              rows with errors will be skipped. Completed imports may be undone from history when
              the imported records still meet the undo safety checks.
            </p>

            <div
              v-if="previewOnly && importResults.previewRows?.length"
              class="max-h-56 overflow-auto rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <table class="min-w-full text-sm">
                <thead class="sticky top-0 bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th class="px-3 py-2 text-left">Row</th>
                    <th class="px-3 py-2 text-left">Student</th>
                    <th class="px-3 py-2 text-left">Admission No.</th>
                    <th class="px-3 py-2 text-left">Class / Section</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in importResults.previewRows"
                    :key="row.row"
                    class="border-t border-gray-100 dark:border-gray-700"
                  >
                    <td class="px-3 py-2">{{ row.row }}</td>
                    <td class="px-3 py-2">{{ row.student_name }}</td>
                    <td class="px-3 py-2">{{ row.admission_number }}</td>
                    <td class="px-3 py-2">
                      {{ row.class }}{{ row.section ? ` / ${row.section}` : '' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Error Details -->
            <div v-if="importResults.errors && importResults.errors.length > 0" class="mt-4">
              <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Error Details:</h4>
              <div class="max-h-60 overflow-y-auto space-y-2">
                <div
                  v-for="(error, index) in importResults.errors"
                  :key="index"
                  class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm"
                >
                  <div class="font-medium text-red-800 dark:text-red-200">
                    Row {{ error.row }}: {{ error.error || error.message }}
                  </div>
                  <!-- Show the data that caused the error -->
                  <div v-if="error.data" class="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <details>
                      <summary class="cursor-pointer hover:text-gray-800 dark:hover:text-gray-200">
                        View Data
                      </summary>
                      <pre
                        class="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto"
                        >{{ JSON.stringify(error.data, null, 2) }}</pre
                      >
                    </details>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template #footer>
          <button @click="showResults = false" class="btn-secondary">
            Close
          </button>
          <button
            v-if="previewOnly && importResults.successful > 0"
            :disabled="loading"
            @click="handleSubmit"
            class="btn-primary disabled:opacity-50"
          >
            {{
              loading
                ? 'Importing...'
                : `Confirm and import ${importResults.successful} valid rows`
            }}
          </button>
        </template>
      </Modal>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useAuth } from '~/composables/useAuth';
import { useAcademics } from '~/composables/useAcademics';
import { useSchools } from '~/composables/useSchools';
import { useToast } from '~/composables/useToast';
import { Students } from '~/api';
import { Streams } from '~/api';
import { Download, CheckCircle, X } from 'lucide-vue-next';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import Modal from '~/components/ui/Modal.vue';
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue';
import { useAuthStore } from '~/stores/auth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';

// Meta
definePageMeta({
  // Global auth middleware handles authentication
  title: 'Multiple Import'
});

const authStore = useAuthStore();
const { selectedBranchId, currentBranch, currentSchool } = useGlobalBranch();
const { user, isSuperAdmin, isAdmin, isBranchAdmin } = useAuth();
const { schools, loading: schoolsLoading, fetchSchools } = useSchools();
const {
  classes,
  sections,
  academicYears,
  currentAcademicYear,
  loading: academicsLoading,
  fetchClasses,
  fetchSections,
  fetchAcademicYears,
  getCurrentAcademicYear
} = useAcademics();
const { showSuccess, showError, showWarning } = useToast();

// Form state
const loading = ref(false);
const sectionsLoading = ref(false);
const streamsLoading = ref(false);
const isDragOver = ref(false);
const selectedFile = ref(null);
const importHeaders = ref([]);
const importFields = ref([]);
const importHeaderRow = ref(1);
const importRowCount = ref(0);
const columnMapping = reactive({});
const fileInput = ref(null);
const showResults = ref(false);
const importResults = ref({});
const importHistory = ref([]);
const historyLoading = ref(false);
const historyError = ref('');
const pendingUndoBatch = ref(null);
const undoingBatchId = ref('');
const previewOnly = ref(false);
const isPreviewRequest = ref(false);
const showDownloadDropdown = ref(false);
const userBranch = ref(null);

// Streams data
const streams = ref([]);

// Form data
const form = reactive({
  school_id: '',
  branch_id: '',
  class_id: '',
  stream_id: '',
  section_id: '',
  academic_year_id: '' // Will be auto-populated with current academic year
});

// Computed properties
const canSubmit = computed(() => {
  const hasBasicFields = form.branch_id && form.class_id && selectedFile.value;

  if (isSuperAdmin.value) {
    if (!form.school_id) return false;
  }

  // Stream is required if class has streams
  if (hasStreams.value && !form.stream_id) {
    return false;
  }

  return hasBasicFields;
});
const isMappingComplete = computed(() => {
  const required = importFields.value.filter(field => field.required);
  const nameIndex = columnMapping.FirstName || columnMapping.FullName;
  const indexes = [...required.map(field => columnMapping[field.field]), nameIndex];
  return Boolean(nameIndex) && indexes.every(Boolean) && new Set(indexes).size === indexes.length;
});

const loadImportHistory = async () => {
  const schoolId = isSuperAdmin.value ? form.school_id : user.value?.school_id;
  if (!schoolId) return;
  historyLoading.value = true;
  historyError.value = '';
  const params = { school_id: schoolId };
  if (form.branch_id) params.branch_id = form.branch_id;
  try {
    const response = await Students.getImportHistory(params);
    importHistory.value = response.data || [];
  } catch (error) {
    historyError.value = 'Could not load import history. Confirm migrations are current and retry.';
  } finally {
    historyLoading.value = false;
  }
};

const undoImportBatch = async () => {
  const batch = pendingUndoBatch.value;
  if (!batch || undoingBatchId.value) return;
  undoingBatchId.value = batch.id;
  try {
    const params = { school_id: isSuperAdmin.value ? form.school_id : user.value?.school_id };
    if (form.branch_id) params.branch_id = form.branch_id;
    const response = await Students.undoImportHistory(batch.id, params);
    pendingUndoBatch.value = null;
    showSuccess(response.message || 'Import undone.');
    await loadImportHistory();
  } catch (error) {
    showError(error.response?.data?.message || error.message || 'Could not undo this import.');
  } finally {
    undoingBatchId.value = '';
  }
};

const schoolOptions = computed(() => {
  return schools.value.map(school => ({
    value: school.id,
    label: school.name
  }));
});


const classOptions = computed(() => {
  return classes.value.map(cls => ({
    value: cls.id,
    label: cls.name
  }));
});

// Check if selected class has streams
const hasStreams = computed(() => {
  if (!form.class_id) return false;
  return activeStreams.value.length > 0;
});

// Check if selected class/stream has sections
const hasSections = computed(() => {
  if (!form.class_id) return false;
  return activeSectionsFiltered.value.length > 0;
});

// Active streams for the selected class
const activeStreams = computed(() => {
  if (!form.class_id) return [];
  return streams.value.filter(
    stream => stream.class_id === form.class_id && stream.is_active !== false
  );
});

// Active sections filtered by stream (if stream is selected)
const activeSectionsFiltered = computed(() => {
  let filteredSections = sections.value;

  // If a stream is selected, filter sections by stream
  if (form.stream_id) {
    filteredSections = filteredSections.filter(section => section.stream_id === form.stream_id);
  }

  return filteredSections;
});

const streamOptions = computed(() => {
  return activeStreams.value.map(stream => ({
    value: stream.id,
    label: `${stream.name} (${stream.code})`
  }));
});

const sectionOptions = computed(() => {
  return activeSectionsFiltered.value.map(section => ({
    value: section.id,
    label: section.name
  }));
});

// Methods

const onBranchChange = async () => {
  form.class_id = '';
  form.section_id = '';
  classes.value = [];
  sections.value = [];
  academicsLoading.value = true;

  if (!form.branch_id) {
    academicsLoading.value = false;
    return;
  }

  try {
    const schoolId = isSuperAdmin.value ? form.school_id : user.value?.school_id;
    await fetchClasses({ schoolId, branchId: form.branch_id });
    if (classes.value.length === 1) {
      form.class_id = classes.value[0].id;
      await onClassChange();
    }
  } catch (error) {
    showError('Failed to load classes. Please try again.');
  } finally {
    academicsLoading.value = false;
  }
};

watch(selectedBranchId, async (newBranchId) => {
  form.branch_id = newBranchId || '';
  form.class_id = '';
  form.section_id = '';
  classes.value = [];
  sections.value = [];
  academicsLoading.value = true;

  if (newBranchId) {
    try {
      const schoolId = isSuperAdmin.value ? form.school_id : user.value?.school_id;

      await fetchClasses({
        schoolId: schoolId,
        branchId: newBranchId
      });

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
}, { immediate: true });

// Load streams for the selected class
const loadStreamsForClass = async classId => {
  if (!classId) {
    streams.value = [];
    return;
  }

  streamsLoading.value = true;
  try {
    const params = {
      class_id: classId,
      is_active: 'true'
    };

    // Add role-based filters
    if (isSuperAdmin.value) {
      if (form.school_id) params.school_id = form.school_id;
      if (form.branch_id) params.branch_id = form.branch_id;
    } else if (isAdmin.value) {
      params.school_id = user.value?.school_id;
      if (form.branch_id) params.branch_id = form.branch_id;
    } else if (isBranchAdmin.value) {
      params.school_id = user.value?.school_id;
      params.branch_id = user.value?.branch_id;
    }

    const response = await Streams.getAll(params);
    streams.value = response.data || [];
  } catch (error) {
    console.error('Error loading streams:', error);
    streams.value = [];
  } finally {
    streamsLoading.value = false;
  }
};

const onClassChange = async () => {
  form.stream_id = '';
  form.section_id = '';
  streams.value = [];
  sections.value = [];
  streamsLoading.value = true;
  sectionsLoading.value = true;

  if (form.class_id) {
    try {
      // Load streams for the selected class
      await loadStreamsForClass(form.class_id);

      const schoolId = isSuperAdmin.value ? form.school_id : user.value?.school_id;

      await fetchSections({ schoolId, branchId: form.branch_id, classId: form.class_id });

      // If no sections found and we're super admin, try without branch_id
      if (sections.value.length === 0 && isSuperAdmin.value) {
        await fetchSections({ schoolId, classId: form.class_id });
      }

      // Auto-select section if there's only one
      if (sections.value.length === 1) {
        form.section_id = sections.value[0].id;
      }
    } catch (error) {
      showError('Failed to load streams/sections. Please try again.');
    } finally {
      streamsLoading.value = false;
      sectionsLoading.value = false;
    }
  } else {
    streamsLoading.value = false;
    sectionsLoading.value = false;
  }
};

const onStreamChange = () => {
  // Clear section when stream changes
  form.section_id = '';
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

const handleFileSelect = event => {
  const file = event.target.files[0];

  if (file) {
    if (/\.(csv|xls|xlsx)$/i.test(file.name)) {
      selectedFile.value = file;
      importHeaders.value = [];
      Object.keys(columnMapping).forEach(key => delete columnMapping[key]);
    } else {
      showError('Please select a CSV, XLS, or XLSX file');
      // Reset the input
      if (fileInput.value) {
        fileInput.value.value = '';
      }
    }
  }
};

const handleDragOver = event => {
  event.preventDefault();
  event.stopPropagation();
  isDragOver.value = true;

  // Set dataTransfer effect to allow drop
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy';
  }
};

const handleDragEnter = event => {
  event.preventDefault();
  event.stopPropagation();
  isDragOver.value = true;

  // Set dataTransfer effect to allow drop
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy';
  }
};

const handleDragLeave = event => {
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

const handleFileDrop = event => {
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

const handleDroppedFile = file => {
  if (/\.(csv|xls|xlsx)$/i.test(file.name)) {
    // Set the selected file
    selectedFile.value = file;
    importHeaders.value = [];
    Object.keys(columnMapping).forEach(key => delete columnMapping[key]);

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
    showError('Please drop a CSV, XLS, or XLSX file');
  }
};

const removeFile = () => {
  selectedFile.value = null;
  importHeaders.value = [];
  Object.keys(columnMapping).forEach(key => delete columnMapping[key]);
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const downloadTemplate = async (type = 'complete') => {
  try {
    const response = await Students.getImportTemplate(type);

    // Check if the response is successful (axios response structure)
    if (response.status !== 200) {
      throw new Error('Failed to download template');
    }

    // For axios with responseType: 'blob', the data is already a blob
    const blob = response.data;
    const url = window.URL.createObjectURL(blob);

    // Create download link
    const a = document.createElement('a');
    a.href = url;

    // Set filename based on type
    if (type === 'required') {
      a.download = 'Student-Import-Template-Required-Fields.csv';
    } else {
      a.download = 'Student-Import-Template-Complete-with-Sample-Data.csv';
    }

    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    // Show success message
    showSuccess(
      `${type === 'required' ? 'Required fields' : 'Complete'} template downloaded successfully!`
    );
  } catch (error) {
    console.error('Error downloading template:', error);
    showError('Failed to download template file. Please try again.');
  }
};

const buildImportFormData = () => {
  const formData = new FormData();
  formData.append('csv_file', selectedFile.value);
  if (importHeaders.value.length) {
    formData.append('column_mapping', JSON.stringify(columnMapping));
  }

  if (isBranchAdmin.value) {
    formData.append('branch_id', user.value?.branch_id);
  } else {
    formData.append('branch_id', form.branch_id);
  }

  formData.append('class_id', form.class_id);
  formData.append('stream_id', form.stream_id);
  formData.append('section_id', form.section_id);
  formData.append('academic_year_id', form.academic_year_id);

  if (isSuperAdmin.value) formData.append('school_id', form.school_id);
  return formData;
};

const handlePreview = () => (importHeaders.value.length ? runImport(true) : discoverImportHeaders());
const handleSubmit = () => runImport(false);

const discoverImportHeaders = async () => {
  if (!canSubmit.value) return;
  loading.value = true;
  try {
    const response = await Students.discoverBulkImportHeaders(buildImportFormData());
    if (!response.success) throw new Error(response.message || 'Could not read file headings');
    importHeaders.value = response.data.headers;
    importFields.value = response.data.fields;
    importHeaderRow.value = response.data.header_row;
    importRowCount.value = response.data.total_rows;
    Object.keys(columnMapping).forEach(key => delete columnMapping[key]);
    const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    importFields.value.forEach(field => {
      const header = importHeaders.value.find(item => normalize(item.label) === normalize(field.field));
      columnMapping[field.field] = header ? String(header.index) : '';
    });
    showSuccess('File headings loaded. Match the required fields, then preview the import.');
  } catch (error) {
    showError(error.response?.data?.message || error.message || 'Could not read file headings');
  } finally {
    loading.value = false;
  }
};

const runImport = async preview => {
  if (!canSubmit.value) return;

  loading.value = true;
  isPreviewRequest.value = preview;
  try {
    const formData = buildImportFormData();
    const response = preview
      ? await Students.previewBulkImport(formData)
      : await Students.bulkImport(formData);

    if (response.success) {
      previewOnly.value = Boolean(response.previewOnly);
      importResults.value = response.data;
      showResults.value = true;

      if (preview) {
        if (response.data.failed > 0) showWarning(response.message);
        else showSuccess(response.message);
        return;
      }

      await loadImportHistory();
      if (response.history_saved === false) {
        showWarning('Import completed, but its history summary could not be saved.');
      }

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
        importHeaders.value = [];
        Object.keys(columnMapping).forEach(key => delete columnMapping[key]);
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
    isPreviewRequest.value = false;
    loading.value = false;
  }
};

// Initialize form data
async function initializeForm() {
  // Auto-sync with global school and branch
  form.school_id =
    currentSchool.value?.id || authStore.currentBranch?.school_id || user.value?.school_id || '';
  form.branch_id = selectedBranchId.value || '';

  // Fetch and auto-select current academic year
  await fetchAcademicYears(form.school_id || null);

  // Auto-select current academic year
  if (currentAcademicYear.value) {
    form.academic_year_id = currentAcademicYear.value.id;
  }

  if (form.branch_id) {
    await onBranchChange();
  }

  // Add click outside handler for dropdown
  const handleClickOutside = event => {
    const dropdown = document.querySelector('[data-dropdown="download"]');
    if (dropdown && !dropdown.contains(event.target)) {
      showDownloadDropdown.value = false;
    }
  };

  // Use nextTick to ensure DOM is ready
  await nextTick();
  document.addEventListener('click', handleClickOutside);

  // Cleanup event listener
  onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside);
  });
}

// Watch global branch changes from top navigation
watch(selectedBranchId, async newVal => {
  if (newVal && newVal !== form.branch_id) {
    form.school_id =
      currentSchool.value?.id || authStore.currentBranch?.school_id || user.value?.school_id || '';
    form.branch_id = newVal;
    await onBranchChange();
  }
});

// Initialize data
watch(
  () => [form.school_id, form.branch_id],
  () => loadImportHistory()
);

onMounted(() => {
  initializeForm();
  loadImportHistory();
});
</script>

<style scoped>
/* Custom styles for drag and drop */
.border-dashed {
  border-style: dashed;
}

/* Drag and drop animations */
@keyframes pulse {
  0%,
  100% {
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
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
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
input[type='file'] {
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
