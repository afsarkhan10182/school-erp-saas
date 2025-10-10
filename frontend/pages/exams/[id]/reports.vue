<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Breadcrumb -->
      <nav class="flex mb-6" aria-label="Breadcrumb">
        <ol class="inline-flex items-center space-x-1 md:space-x-3">
          <li class="inline-flex items-center">
            <NuxtLink
              to="/exams"
              class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
            >
              <BookOpen class="w-4 h-4 mr-2" />
              Exams
            </NuxtLink>
          </li>
          <li>
            <div class="flex items-center">
              <ChevronRight class="w-4 h-4 text-gray-400" />
              <span class="ml-1 text-sm font-medium text-gray-500 md:ml-2 dark:text-gray-400">
                {{ exam?.name || 'Loading...' }}
              </span>
            </div>
          </li>
          <li aria-current="page">
            <div class="flex items-center">
              <ChevronRight class="w-4 h-4 text-gray-400" />
              <span class="ml-1 text-sm font-medium text-gray-700 md:ml-2 dark:text-gray-300">
                Generate Reports
              </span>
            </div>
          </li>
        </ol>
      </nav>

      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Generate Reports</h1>
        <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Generate and download report cards for students
        </p>
      </div>

      <!-- Exam Details Card -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Exam Details</h3>
        <div v-if="loading" class="text-center py-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
        <div v-else-if="exam" class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Exam Name</span>
            <p class="mt-1 text-sm font-medium text-gray-900 dark:text-white">{{ exam.name }}</p>
          </div>
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Exam Type</span>
            <p class="mt-1 text-sm font-medium text-gray-900 dark:text-white">
              {{ exam.exam_type?.name || 'N/A' }}
            </p>
          </div>
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Academic Year</span>
            <p class="mt-1 text-sm font-medium text-gray-900 dark:text-white">
              {{ exam.academic_year || 'N/A' }}
            </p>
          </div>
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Status</span>
            <span
              :class="[
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                getStatusBadgeClass(exam.status)
              ]"
            >
              {{ getStatusText(exam.status) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Report Configuration -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Report Configuration</h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Report Template
            </label>
            <EnhancedDropdown
              v-model="reportConfig.template_id"
              :options="templateOptions"
              placeholder="Select template"
              :loading="templatesLoading"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Class
            </label>
            <EnhancedDropdown
              v-model="reportConfig.class_id"
              :options="classOptions"
              placeholder="All classes"
              :loading="classesLoading"
              @update:model-value="onClassChange"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Section
            </label>
            <EnhancedDropdown
              v-model="reportConfig.section_id"
              :options="sectionOptions"
              placeholder="All sections"
              :loading="sectionsLoading"
            />
          </div>
        </div>

        <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Include Fields
            </label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  v-model="reportConfig.include_photo"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Student Photo</span>
              </label>
              <label class="flex items-center">
                <input
                  v-model="reportConfig.include_remarks"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Teacher Remarks</span>
              </label>
              <label class="flex items-center">
                <input
                  v-model="reportConfig.include_signatures"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Signatures</span>
              </label>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Output Format
            </label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  v-model="reportConfig.format"
                  type="radio"
                  value="pdf"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">PDF</span>
              </label>
              <label class="flex items-center">
                <input
                  v-model="reportConfig.format"
                  type="radio"
                  value="excel"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Excel</span>
              </label>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end space-x-4">
          <button
            @click="previewReport"
            :disabled="generating"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            <Eye class="w-4 h-4 mr-2" />
            Preview
          </button>
          <button
            @click="generateReport"
            :disabled="generating"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <FileText class="w-4 h-4 mr-2" />
            Generate Report
          </button>
        </div>
      </div>

      <!-- Generated Reports -->
      <div v-if="generatedReports.length > 0" class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Generated Reports ({{ generatedReports.length }})
          </h3>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  Report Name
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  Template
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  Class & Section
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  Format
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  Generated At
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="report in generatedReports" :key="report.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ report.name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ report.template?.name || 'N/A' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ report.class?.name }} - {{ report.section?.name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {{ report.format?.toUpperCase() }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ formatDate(report.created_at) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex items-center space-x-2">
                    <button
                      @click="downloadReport(report)"
                      class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Download class="w-4 h-4" />
                    </button>
                    <button
                      @click="deleteReport(report.id)"
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Actions -->
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            @click="navigateTo('/exams')"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Back to Exams
          </button>
          <button
            @click="completeReportGeneration"
            :disabled="generating"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            <CheckCircle class="w-4 h-4 mr-2" />
            Complete Report Generation
          </button>
        </div>
      </div>

      <!-- No Reports Message -->
      <div v-else class="bg-white dark:bg-gray-800 shadow rounded-lg p-12 text-center">
        <FileText class="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No reports generated yet
        </h3>
        <p class="text-gray-500 dark:text-gray-400">
          Configure and generate reports using the form above.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { navigateTo } from '#app';
import {
  BookOpen,
  ChevronRight,
  Eye,
  FileText,
  Download,
  Trash2,
  CheckCircle
} from 'lucide-vue-next';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { useToast } from '~/composables/useToast';
import { useAcademics } from '~/composables/useAcademics';

const route = useRoute();
const { showToast } = useToast();

// Composables
const {
  classes,
  sections,
  loading: classesLoading,
  sectionsLoading,
  fetchClasses,
  fetchSections
} = useAcademics();

// State
const exam = ref(null);
const templates = ref([]);
const generatedReports = ref([]);
const loading = ref(false);
const templatesLoading = ref(false);
const generating = ref(false);

// Report configuration
const reportConfig = reactive({
  template_id: '',
  class_id: '',
  section_id: '',
  include_photo: true,
  include_remarks: true,
  include_signatures: true,
  format: 'pdf'
});

// Computed
const classOptions = computed(() =>
  classes.value.map(cls => ({
    value: cls.id,
    label: cls.name
  }))
);

const sectionOptions = computed(() =>
  sections.value.map(section => ({
    value: section.id,
    label: section.name
  }))
);

const templateOptions = computed(() =>
  templates.value.map(template => ({
    value: template.id,
    label: template.name
  }))
);

// Methods
const loadExam = async () => {
  loading.value = true;
  try {
    const { examApi } = await import('~/api/academic/exams');
    const response = await examApi.getById(route.params.id);
    exam.value = response.data;
  } catch (error) {
    showToast('Failed to load exam', 'error');
    navigateTo('/exams');
  } finally {
    loading.value = false;
  }
};

const loadTemplates = async () => {
  templatesLoading.value = true;
  try {
    const { reportTemplateApi } = await import('~/api/academic/report-templates');
    const response = await reportTemplateApi.getAll();
    templates.value = response.data || [];
  } catch (error) {
    showToast('Failed to load templates', 'error');
  } finally {
    templatesLoading.value = false;
  }
};

const loadGeneratedReports = async () => {
  try {
    const { examReportApi } = await import('~/api/academic/exam-reports');
    const response = await examReportApi.getByExamId(route.params.id);
    generatedReports.value = response.data || [];
  } catch (error) {
    showToast('Failed to load generated reports', 'error');
  }
};

const onClassChange = async () => {
  reportConfig.section_id = '';

  if (reportConfig.class_id) {
    await fetchSections({ classId: reportConfig.class_id });
  }
};

const previewReport = async () => {
  try {
    const { examReportApi } = await import('~/api/academic/exam-reports');
    const response = await examReportApi.preview(route.params.id, reportConfig);

    // Open preview in new window
    const previewWindow = window.open('', '_blank');
    previewWindow.document.write(response.data);
  } catch (error) {
    showToast('Failed to preview report', 'error');
  }
};

const generateReport = async () => {
  try {
    generating.value = true;

    const { examReportApi } = await import('~/api/academic/exam-reports');
    const response = await examReportApi.generate(route.params.id, reportConfig);

    if (response.success) {
      showToast('Report generated successfully', 'success');
      await loadGeneratedReports();
    }
  } catch (error) {
    showToast('Failed to generate report', 'error');
  } finally {
    generating.value = false;
  }
};

const downloadReport = async report => {
  try {
    const { examReportApi } = await import('~/api/academic/exam-reports');
    const response = await examReportApi.download(report.id);

    // Create download link
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.name}.${report.format}`;
    link.click();
    window.URL.revokeObjectURL(url);

    showToast('Report downloaded successfully', 'success');
  } catch (error) {
    showToast('Failed to download report', 'error');
  }
};

const deleteReport = async reportId => {
  if (!confirm('Are you sure you want to delete this report?')) {
    return;
  }

  try {
    const { examReportApi } = await import('~/api/academic/exam-reports');
    const response = await examReportApi.delete(reportId);

    if (response.success) {
      showToast('Report deleted successfully', 'success');
      await loadGeneratedReports();
    }
  } catch (error) {
    showToast('Failed to delete report', 'error');
  }
};

const completeReportGeneration = async () => {
  try {
    generating.value = true;

    const { examApi } = await import('~/api/academic/exams');
    const response = await examApi.update(route.params.id, { status: 'completed' });

    if (response.success) {
      showToast('Report generation completed successfully', 'success');
      navigateTo('/exams');
    }
  } catch (error) {
    showToast('Failed to complete report generation', 'error');
  } finally {
    generating.value = false;
  }
};

const formatDate = date => {
  return new Date(date).toLocaleDateString('en-IN');
};

const getStatusBadgeClass = status => {
  const classes = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    marks_entered: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    grades_calculated: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  };
  return classes[status] || classes.draft;
};

const getStatusText = status => {
  const texts = {
    draft: 'Draft',
    scheduled: 'Scheduled',
    marks_entered: 'Marks Entered',
    grades_calculated: 'Grades Calculated',
    completed: 'Completed'
  };
  return texts[status] || 'Unknown';
};

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadExam(),
    loadTemplates(),
    loadGeneratedReports(),
    fetchClasses(),
    fetchSubjects()
  ]);
});
</script>
