<template>
  <div class="space-y-6">
    <!-- Unified Certificate Generation Card -->
    <div
      class="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 p-6"
    >
      <!-- Form Fields -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">


        <!-- Class Selection -->
        <div class="space-y-2">
          <EnhancedDropdown
            id="class"
            v-model="filters.class_id"
            :options="classes.map(classItem => ({ value: classItem.id, label: classItem.name }))"
            label="Class"
            placeholder="Select Class"
            required
            :disabled="!filters.branch_id"
            @change="loadStreamsAndSections"
          />
        </div>

        <!-- Stream Selection (only if class has streams) -->
        <div v-if="filters.class_id && hasStreams" class="space-y-2">
          <EnhancedDropdown
            id="stream"
            v-model="filters.stream_id"
            :options="streams.map(stream => ({ value: stream.id, label: stream.name }))"
            label="Stream"
            placeholder="Select Stream"
            @change="loadSections"
          />
        </div>

        <!-- Section Selection (only if class is selected) -->
        <div v-if="filters.class_id" class="space-y-2">
          <EnhancedDropdown
            id="section"
            v-model="filters.section_id"
            :options="[{ value: '', label: 'All Sections' }, ...sections.map(section => ({ value: section.id, label: section.name }))]"
            label="Section"
            placeholder="Select Section"
            @change="loadStudents"
          />
        </div>

        <!-- Template Selection -->
        <div class="space-y-2">
          <EnhancedDropdown
            id="template"
            v-model="filters.template_id"
            :options="templates.map(template => ({ value: template.id, label: template.name }))"
            label="Certificate Template"
            placeholder="Select Template"
            required
          />
        </div>

        <!-- Print Date -->
        <div class="space-y-2">
          <label for="printDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Print Date
          </label>
          <input
            id="printDate"
            v-model="filters.print_date"
            type="date"
            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out hover:border-indigo-300 dark:hover:border-indigo-500"
          />
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 mb-6">
        <button
          @click="loadStudents"
          :disabled="!filters.branch_id || !filters.class_id"
          class="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <Search class="h-4 w-4 mr-2" />
          Load Students
        </button>

        <button
          @click="generateCertificates"
          :disabled="selectedStudents.length === 0 || !filters.template_id || loading"
          class="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <FileText class="h-4 w-4 mr-2" />
          {{ loading ? 'Generating...' : 'Generate Certificates' }}
        </button>
      </div>

      <!-- Students List or Empty State -->
      <div v-if="students.length > 0" class="border-t border-gray-200 dark:border-gray-700 pt-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Users class="h-5 w-5 mr-2 text-green-600" />
              Select Students
            </h3>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {{ students.length }} students found - Select the ones you want to generate
              certificates for
            </p>
          </div>
          <div class="flex items-center space-x-3">
            <div class="bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2 rounded-lg">
              <span class="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                {{ selectedStudents.length }} of {{ students.length }} selected
              </span>
            </div>
            <div class="flex items-center space-x-2">
              <button
                @click="selectAll"
                class="inline-flex items-center px-3 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              >
                <Users class="h-4 w-4 mr-1" />
                Select All
              </button>
              <button
                @click="deselectAll"
                class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X class="h-4 w-4 mr-1" />
                Deselect All
              </button>
            </div>
          </div>
        </div>

        <div class="overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th class="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      :checked="allSelected"
                      @change="toggleAll"
                      class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-colors"
                    />
                  </th>
                  <th
                    class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Student Name
                  </th>
                  <th
                    class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Register No
                  </th>
                  <th
                    class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Roll No
                  </th>
                  <th
                    class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Mobile
                  </th>
                  <th
                    class="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody
                class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
              >
                <tr
                  v-for="student in students"
                  :key="student.id"
                  class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td class="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      :checked="selectedStudents.includes(student.id)"
                      @change="toggleStudent(student.id)"
                      class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-colors"
                    />
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div
                        class="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center"
                      >
                        <span class="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                          {{ getStudentInitial(student) }}
                        </span>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          {{ getStudentName(student) }}
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                          {{ student.class?.name || 'No Class' }}
                          <span v-if="student.section?.name"> - {{ student.section.name }}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      {{ student.admission_number || student.register_no || 'N/A' }}
                    </span>
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium"
                  >
                    {{ student.roll_number || student.roll || 'N/A' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <span v-if="student.phone || student.mobile_no">
                      {{ student.phone || student.mobile_no }}
                    </span>
                    <span v-else class="text-gray-400 italic">No phone</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      :class="{
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200':
                          student.status === 'active' || student.is_active !== false,
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200':
                          student.status === 'inactive' || student.is_active === false,
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200':
                          student.status === 'pending',
                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200':
                          !student.status
                      }"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    >
                      {{ student.status || (student.is_active !== false ? 'Active' : 'Inactive') }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!loading" class="border-t border-gray-200 dark:border-gray-700 pt-6">
        <div class="text-center py-12">
          <div
            class="mx-auto h-20 w-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4"
          >
            <GraduationCap class="h-10 w-10 text-gray-400" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No students found
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
            Please select a branch and class, then click "Load Students" to see available students
            for certificate generation.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { Search, FileText, GraduationCap, Users, X } from 'lucide-vue-next';
import { useBranches } from '~/composables/useBranches';
import { useStudents } from '~/composables/useStudents';
import { useCertificateTemplates } from '~/composables/useCertificateTemplates';
import { useAcademics } from '~/composables/useAcademics';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useToast } from '~/composables/useToast';
import { usePrintReport } from '~/composables/usePrintReport';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';

// Composables
const { branches, availableBranches, fetchBranchesForUser } = useBranches();
const { selectedBranchId } = useGlobalBranch();
const { students, loadStudents: loadStudentsApi } = useStudents();
const { templates, loadTemplates, generateStudentCertificates } = useCertificateTemplates();
const {
  classes,
  sections,
  streams,
  fetchClasses,
  fetchSections,
  fetchStreams,
  loadSectionsByClass,
  loadStreamsByClass
} = useAcademics();
const { showToast } = useToast();
const { printReport } = usePrintReport();

// Reactive data
const loading = ref(false);
const selectedStudents = ref([]);
const filters = reactive({
  branch_id: selectedBranchId.value || '',
  class_id: '',
  stream_id: '',
  section_id: '',
  template_id: '',
  print_date: new Date().toISOString().split('T')[0]
});

watch(selectedBranchId, async (newVal) => {
  filters.branch_id = newVal || '';
  await handleBranchChange();
});

// Computed
const allSelected = computed(() => {
  return students.value.length > 0 && selectedStudents.value.length === students.value.length;
});

const hasStreams = computed(() => {
  return streams.value.length > 0;
});
const branchChoices = computed(() => availableBranches.value.length ? availableBranches.value : branches.value);
const showBranchDropdown = computed(() => branchChoices.value.length > 1);

const handleBranchChange = async () => {
  filters.template_id = '';
  await Promise.all([
    loadClasses(),
    loadTemplates({ user_type: 'student', branch_id: filters.branch_id || undefined })
  ]);
};

// Methods
const loadClasses = async () => {
  if (!filters.branch_id) return;

  try {
    console.log('Loading classes for branch:', filters.branch_id);
    await fetchClasses({ branchId: filters.branch_id });
    console.log('Classes loaded:', classes.value);
    // Reset dependent selections
    filters.class_id = '';
    filters.stream_id = '';
    filters.section_id = '';
    students.value = [];
    selectedStudents.value = [];
  } catch (error) {
    console.error('Error loading classes:', error);
    showToast('Failed to load classes', 'error');
  }
};

const loadStreamsAndSections = async () => {
  if (!filters.class_id) return;

  try {
    console.log('Loading streams and sections for class:', filters.class_id);

    // Load streams for the class
    await loadStreamsByClass(filters.class_id, undefined, filters.branch_id);
    console.log('Streams loaded:', streams.value);

    // Load sections for the class
    await loadSectionsByClass(filters.class_id, undefined, filters.branch_id);
    console.log('Sections loaded:', sections.value);

    // Reset dependent selections
    filters.stream_id = '';
    filters.section_id = '';
    students.value = [];
    selectedStudents.value = [];
  } catch (error) {
    console.error('Error loading streams and sections:', error);
    showToast('Failed to load streams and sections', 'error');
  }
};

const loadSections = async () => {
  if (!filters.class_id) return;

  try {
    console.log('Loading sections for class:', filters.class_id, 'stream:', filters.stream_id);
    await loadSectionsByClass(filters.class_id, undefined, filters.branch_id);
    console.log('Sections loaded:', sections.value);
    // Reset dependent selections
    filters.section_id = '';
    students.value = [];
    selectedStudents.value = [];
  } catch (error) {
    console.error('Error loading sections:', error);
    showToast('Failed to load sections', 'error');
  }
};

const loadStudents = async () => {
  if (!filters.branch_id || !filters.class_id) {
    showToast('Please select branch and class', 'warning');
    return;
  }

  try {
    loading.value = true;

    const studentFilters = {
      branch_id: filters.branch_id,
      class_id: filters.class_id
    };

    // Add optional filters if selected
    if (filters.stream_id) {
      studentFilters.stream_id = filters.stream_id;
    }
    if (filters.section_id) {
      studentFilters.section_id = filters.section_id;
    }

    await loadStudentsApi(studentFilters);
  } catch (error) {
    console.error('Error loading students:', error);
    showToast('Failed to load students', 'error');
  } finally {
    loading.value = false;
  }
};

const selectAll = () => {
  selectedStudents.value = students.value.map(student => student.id);
};

const deselectAll = () => {
  selectedStudents.value = [];
};

const toggleAll = () => {
  if (allSelected.value) {
    deselectAll();
  } else {
    selectAll();
  }
};

const toggleStudent = studentId => {
  const index = selectedStudents.value.indexOf(studentId);
  if (index > -1) {
    selectedStudents.value.splice(index, 1);
  } else {
    selectedStudents.value.push(studentId);
  }
};

// Helper functions for student display
const getStudentName = student => {
  if (student.first_name && student.last_name) {
    return `${student.first_name} ${student.last_name}`;
  }
  if (student.name) {
    return student.name;
  }
  if (student.first_name) {
    return student.first_name;
  }
  return 'Unknown Student';
};

const getStudentInitial = student => {
  const name = getStudentName(student);
  return name.charAt(0).toUpperCase();
};

const generateCertificates = async () => {
  if (selectedStudents.value.length === 0) {
    showToast('Please select at least one student', 'warning');
    return;
  }

  if (!filters.template_id) {
    showToast('Please select a certificate template', 'warning');
    return;
  }

  try {
    loading.value = true;

    const generationData = {
      student_ids: selectedStudents.value,
      template_id: filters.template_id,
      print_date: filters.print_date,
      branch_id: filters.branch_id || undefined,
      class_id: filters.class_id || undefined,
      section_id: filters.section_id && filters.section_id.trim() !== '' ? filters.section_id : undefined
    };

    console.log('Generating certificates with data:', generationData);

    const result = await generateStudentCertificates(generationData);

    console.log('Certificate generation result:', result);

    if (result.success) {
      showToast(`Successfully generated ${selectedStudents.value.length} certificates`, 'success');

      // Show print preview for certificates
      await printCertificates(selectedStudents.value, result.data);

      emit(
        'success',
        `Student certificates generated successfully for ${selectedStudents.value.length} students`
      );

      // Reset selections after successful generation
      selectedStudents.value = [];
    } else {
      showToast(result.message || 'Failed to generate certificates', 'error');
    }
  } catch (error) {
    console.error('Error generating certificates:', error);
    showToast('Failed to generate certificates. Please try again.', 'error');
  } finally {
    loading.value = false;
  }
};

const printCertificates = async (studentIds, certificateData) => {
  try {
    // Get selected students data
    const selectedStudentsData = students.value.filter(student => studentIds.includes(student.id));

    if (selectedStudentsData.length === 0) {
      showToast('No student data found for printing', 'error');
      return;
    }

    // Get the selected template
    const selectedTemplate = templates.value.find(t => t.id === filters.template_id);
    if (!selectedTemplate) {
      showToast('Template not found', 'error');
      return;
    }

    // Check template content
    if (!selectedTemplate.content) {
      showToast('Selected template has no content. Please check the template.', 'error');
      return;
    }

    // Generate individual certificates for each student
    const certificateHTMLs = selectedStudentsData.map(student => {
      return generateCertificateHTML(student, selectedTemplate);
    });

    // Create a combined HTML document for all certificates
    const combinedHTML = createCombinedCertificateHTML(certificateHTMLs, selectedTemplate.name);

    // Open print preview with the certificate HTML
    await openCertificatePrintPreview(combinedHTML, selectedTemplate.name);
  } catch (error) {
    console.error('Error printing certificates:', error);
    showToast('Error opening print preview', 'error');
  }
};

// Generate HTML for a single certificate using the template
const generateCertificateHTML = (student, template) => {
  // Check if template has content
  if (!template.content) {
    console.error('Template has no content:', template);
    return '<div style="padding: 20px; text-align: center; color: red;">Template content not found</div>';
  }

  // Replace dynamic tags in template content with actual student data
  let certificateContent = template.content;

  // Replace common dynamic tags
  const replacements = {
    '{name}':
      student.first_name && student.last_name
        ? `${student.first_name} ${student.last_name}`
        : student.name || 'N/A',
    '{first_name}': student.first_name || 'N/A',
    '{last_name}': student.last_name || 'N/A',
    '{register_no}': student.admission_number || student.register_no || 'N/A',
    '{admission_number}': student.admission_number || student.register_no || 'N/A',
    '{roll}': student.roll_number || student.roll || 'N/A',
    '{roll_number}': student.roll_number || student.roll || 'N/A',
    '{mobile_no}': student.phone || student.mobile_no || 'N/A',
    '{phone}': student.phone || student.mobile_no || 'N/A',
    '{email}': student.email || 'N/A',
    '{class}': student.class?.name || 'N/A',
    '{section}': student.section?.name || 'N/A',
    '{stream}': student.stream?.name || 'N/A',
    '{print_date}': filters.print_date,
    '{current_date}': new Date().toLocaleDateString(),
    '{certificate_id}': `CERT-${Date.now()}-${student.id.slice(-4)}`
  };

  // Replace all dynamic tags
  Object.entries(replacements).forEach(([tag, value]) => {
    certificateContent = certificateContent.replace(new RegExp(tag, 'g'), value);
  });

  return certificateContent;
};

// Create combined HTML document for all certificates
const createCombinedCertificateHTML = (certificateHTMLs, templateName) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${templateName} - Certificates</title>
      <style>
        @media print {
          @page {
            size: A4;
            margin: 0.5in;
          }
          .certificate-page {
            page-break-after: always;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .certificate-page:last-child {
            page-break-after: avoid;
          }
        }
        
        body {
          font-family: 'Times New Roman', serif;
          margin: 0;
          padding: 20px;
          background: #f5f5f5;
        }
        
        .certificate-page {
          background: white;
          margin: 20px 0;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .certificate-content {
          width: 100%;
          max-width: 800px;
          text-align: center;
        }
        
        .print-controls {
          position: fixed;
          top: 20px;
          right: 20px;
          background: white;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          z-index: 1000;
        }
        
        .print-controls button {
          margin: 0 8px;
          padding: 10px 20px;
          border: 1px solid #ddd;
          background: #f8f9fa;
          cursor: pointer;
          border-radius: 6px;
          font-size: 12px;
        }
        
        .print-controls button:hover {
          background: #e9ecef;
        }
        
        .print-controls button.primary {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }
        
        .print-controls button.success {
          background: #28a745;
          color: white;
          border-color: #28a745;
        }
      </style>
    </head>
    <body>
      <div class="print-controls">
        <button onclick="window.print()" class="primary">Print Certificates</button>
        <button onclick="window.print()" class="success">Save as PDF</button>
        <button onclick="window.close()">Close</button>
      </div>
      
      ${certificateHTMLs
        .map(
          html => `
        <div class="certificate-page">
          <div class="certificate-content">
            ${html}
          </div>
        </div>
      `
        )
        .join('')}
    </body>
    </html>
  `;
};

// Open certificate print preview
const openCertificatePrintPreview = async (htmlContent, title) => {
  try {
    const previewWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!previewWindow) {
      throw new Error('Please allow popups to view print preview');
    }

    previewWindow.document.write(htmlContent);
    previewWindow.document.close();
    previewWindow.focus();
  } catch (error) {
    console.error('Error opening certificate print preview:', error);
    throw error;
  }
};

// Emits
const emit = defineEmits(['success']);

onMounted(async () => {
  await fetchBranchesForUser();
  if (branchChoices.value.length === 1) {
    filters.branch_id = branchChoices.value[0].id;
    await loadClasses();
  }
  await loadTemplates({ user_type: 'student', branch_id: filters.branch_id || undefined });
});
</script>
