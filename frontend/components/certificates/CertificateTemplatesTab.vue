<template>
  <div class="space-y-6">
    <!-- Templates List -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="templates.length === 0" class="text-center py-12">
        <FileText class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No templates found</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Get started by creating a new certificate template.
        </p>
      </div>

      <!-- Templates Table -->
      <div v-else class="overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Sl
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Certificate Name
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Branch
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Applicable User
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Page Layout
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Background Image
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Created At
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="(template, index) in templates"
                :key="template.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <!-- Serial Number -->
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
                >
                  {{ index + 1 }}
                </td>

                <!-- Certificate Name -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ template.name }}
                  </div>
                </td>

                <!-- Branch -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <Building class="h-4 w-4 mr-2 text-gray-400" />
                    <span class="text-sm text-gray-900 dark:text-white">
                      {{ template.branch?.name || 'N/A' }}
                    </span>
                  </div>
                </td>

                <!-- Applicable User -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="
                      template.user_type === 'student'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    "
                  >
                    <Users class="h-3 w-3 mr-1" />
                    {{ template.user_type === 'student' ? 'Student' : 'Employee' }}
                  </span>
                </td>

                <!-- Page Layout -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <div class="flex items-center">
                    <Layout class="h-4 w-4 mr-2 text-gray-400" />
                    A4 ({{ template.page_layout === 'portrait' ? 'Portrait' : 'Landscape' }})
                  </div>
                </td>

                <!-- Background Image -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div
                      v-if="template.background_image"
                      class="w-12 h-8 rounded border border-gray-300 dark:border-gray-600 overflow-hidden"
                    >
                      <img
                        :src="template.background_image"
                        :alt="template.name"
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <div
                      v-else
                      class="w-12 h-8 bg-gray-200 dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center"
                    >
                      <FileText class="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </td>

                <!-- Created At -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDate(template.created_at) }}
                </td>

                <!-- Actions -->
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex items-center space-x-2">
                    <button
                      @click="viewTemplate(template)"
                      class="text-gray-400 hover:text-blue-600 transition-colors"
                      title="View template"
                    >
                      <Eye class="h-4 w-4" />
                    </button>
                    <button
                      @click="editTemplate(template)"
                      class="text-gray-400 hover:text-indigo-600 transition-colors"
                      title="Edit template"
                    >
                      <Edit class="h-4 w-4" />
                    </button>
                    <button
                      @click="deleteTemplate(template)"
                      class="text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete template"
                    >
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="pagination.total_pages > 1"
        class="px-6 py-4 border-t border-gray-200 dark:border-gray-700"
      >
        <Pagination
          :current-page="pagination.current_page"
          :total-pages="pagination.total_pages"
          :total-items="pagination.total_items"
          :items-per-page="pagination.items_per_page"
          @page-change="handlePageChange"
        />
      </div>
    </div>

    <!-- Certificate Preview Modal -->
    <div
      v-if="showPreviewModal"
      class="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
      >
        <!-- Background overlay -->
        <div
          class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          @click="showPreviewModal = false"
        ></div>

        <!-- Modal panel -->
        <div
          class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
        >
          <!-- Modal header -->
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Certificate View
              </h3>
              <button
                type="button"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                @click="showPreviewModal = false"
              >
                <X class="h-6 w-6" />
              </button>
            </div>
          </div>

          <!-- Modal body -->
          <div class="bg-white dark:bg-gray-800 px-4 pb-4 sm:p-6">
            <div v-if="selectedTemplate" class="certificate-preview">
              <!-- Certificate Preview -->
              <div
                class="bg-gray-100 dark:bg-gray-700 p-8 rounded-lg border-2 border-gray-300 dark:border-gray-600"
              >
                <div class="certificate-content text-center space-y-4">
                  <!-- Institute Header -->
                  <div class="space-y-2">
                    <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">
                      {institute_name}
                    </h1>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      {institute_email} | {mobileno}
                    </p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">{institute_address}</p>
                  </div>

                  <!-- Student Info -->
                  <div class="flex justify-between items-center mt-6">
                    <div class="text-left">
                      <p class="text-sm font-medium">Registration No: {register_no}</p>
                    </div>
                    <div
                      class="w-24 h-24 bg-gray-300 dark:bg-gray-600 rounded border-2 border-dashed border-gray-400 dark:border-gray-500 flex items-center justify-center"
                    >
                      <span class="text-xs text-gray-500 dark:text-gray-400">{student_photo}</span>
                    </div>
                    <div class="text-right">
                      <p class="text-sm font-medium">Admission On: {admission_date}</p>
                    </div>
                  </div>

                  <!-- Certificate Title -->
                  <div class="mt-8">
                    <h2 class="text-xl font-bold uppercase text-gray-800 dark:text-gray-200">
                      SCHOOL CERTIFICATE EXAMINATION-2020
                    </h2>
                  </div>

                  <!-- Certificate Body -->
                  <div class="mt-6 text-left">
                    <div class="bg-white dark:bg-gray-800 p-6 rounded border">
                      <p
                        class="text-sm leading-relaxed text-gray-700 dark:text-gray-300 font-serif"
                      >
                        {{ selectedTemplate.content }}
                      </p>
                    </div>
                  </div>

                  <!-- Footer -->
                  <div class="flex justify-between items-center mt-8">
                    <div class="text-left">
                      <p class="text-sm font-medium">Date of Publication of Result: {print_date}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-sm font-medium">Principal signature {signature}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal footer -->
          <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
              @click="showPreviewModal = false"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { FileText, Edit, Trash2, Users, Layout, Building, Eye, X } from 'lucide-vue-next';
import Pagination from '~/components/ui/Pagination.vue';
import { useCertificateTemplates } from '~/composables/useCertificateTemplates';
import { useBranches } from '~/composables/useBranches';
import { useToast } from '~/composables/useToast';

// Composables
const {
  templates,
  loading,
  pagination,
  loadTemplates,
  deleteTemplate: deleteTemplateApi
} = useCertificateTemplates();
const { availableBranches, fetchBranchesForUser } = useBranches();
const { showToast } = useToast();

// Preview modal state
const showPreviewModal = ref(false);
const selectedTemplate = ref(null);

// Methods
const handlePageChange = page => {
  loadTemplates({ page });
};

const editTemplate = template => {
  // Emit event to parent to open edit modal
  emit('edit', template);
};

const viewTemplate = template => {
  selectedTemplate.value = template;
  showPreviewModal.value = true;
};

const deleteTemplate = async template => {
  if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
    try {
      await deleteTemplateApi(template.id);
      showToast('Template deleted successfully', 'success');
      loadTemplates();
    } catch (error) {
      showToast('Failed to delete template', 'error');
    }
  }
};

const formatDate = dateString => {
  return new Date(dateString).toLocaleDateString();
};

// Emits
const emit = defineEmits(['edit', 'refresh', 'success']);

// Expose methods for parent component
defineExpose({
  loadTemplates: () => loadTemplates()
});

onMounted(async () => {
  await fetchBranchesForUser();
  loadTemplates();
});
</script>
