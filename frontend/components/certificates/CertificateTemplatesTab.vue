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
                      v-if="getFullImageUrl(template.background_image)"
                      class="w-12 h-8 rounded border border-gray-300 dark:border-gray-600 overflow-hidden"
                    >
                      <img
                        :src="getFullImageUrl(template.background_image)"
                        :alt="template.name"
                        class="w-full h-full object-cover"
                        @error="(e) => { e.target.style.display = 'none'; e.target.parentNode.querySelector('.fallback-bg').style.display = 'flex'; }"
                      />
                      <div class="fallback-bg hidden w-full h-full bg-gray-100 dark:bg-gray-700 items-center justify-center">
                        <FileText class="h-3 w-3 text-gray-400" />
                      </div>
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
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showPreviewModal"
        class="fixed inset-0 z-50 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div
          class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
        >
          <!-- Background overlay -->
          <div
            class="fixed inset-0 bg-black bg-opacity-50 transition-opacity backdrop-blur-sm"
            aria-hidden="true"
            @click="showPreviewModal = false"
          ></div>

          <!-- Modal panel -->
          <transition
            enter-active-class="transition ease-out duration-200"
            enter-from-class="transform opacity-0 scale-95"
            enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95"
          >
            <div
              v-if="showPreviewModal"
              class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full"
            >
              <!-- Modal header -->
              <div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 pt-6 pb-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-xl leading-6 font-bold text-white flex items-center gap-2">
                      <Eye class="h-6 w-6" />
                      Certificate Preview
                    </h3>
                    <p class="text-sm text-indigo-100 mt-1">
                      {{ selectedTemplate?.name || 'Certificate Template' }}
                    </p>
                  </div>
                  <button
                    type="button"
                    class="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                    @click="showPreviewModal = false"
                  >
                    <X class="h-6 w-6" />
                  </button>
                </div>
              </div>

              <!-- Modal body -->
              <div class="bg-gray-50 dark:bg-gray-900 px-6 py-6 max-h-[75vh] overflow-y-auto">
                <div v-if="selectedTemplate">
                  <!-- Info Bar -->
                  <div class="flex items-center justify-between mb-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                    <div class="flex items-center gap-4 text-sm">
                      <span class="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Layout class="h-4 w-4" />
                        <span class="font-medium">{{ selectedTemplate.page_layout === 'portrait' ? 'A4 Portrait' : 'A4 Landscape' }}</span>
                      </span>
                      <span class="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Users class="h-4 w-4" />
                        <span class="font-medium">{{ selectedTemplate.user_type === 'student' ? 'Student' : 'Employee' }}</span>
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        @click="zoomOut"
                        class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Zoom Out"
                      >
                        <ZoomOut class="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <span class="text-sm font-medium text-gray-600 dark:text-gray-400">{{ zoomLevel }}%</span>
                      <button
                        type="button"
                        @click="zoomIn"
                        class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Zoom In"
                      >
                        <ZoomIn class="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>

                  <!-- Certificate Preview -->
                  <div class="flex justify-center">
                    <div
                      class="certificate-preview-container bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border-4 border-gray-200 dark:border-gray-700"
                      :style="{
                        transform: `scale(${zoomLevel / 100})`,
                        transformOrigin: 'top center',
                        transition: 'transform 0.2s ease'
                      }"
                      :class="selectedTemplate.page_layout === 'landscape' ? 'w-[800px] h-[565px]' : 'w-[565px] h-[800px]'"
                    >
                      <!-- Certificate Background -->
                      <div
                        class="relative h-full p-12"
                        :style="getFullImageUrl(selectedTemplate.background_image) ? `background-image: url('${getFullImageUrl(selectedTemplate.background_image)}'); background-size: cover; background-position: center; background-repeat: no-repeat;` : 'background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);'"
                      >
                        <!-- Border decoration -->
                        <div class="absolute inset-4 border-4 border-double border-indigo-300 dark:border-indigo-600 rounded-lg pointer-events-none"></div>
                        
                        <!-- Certificate Content with semi-transparent background for better text readability -->
                        <div class="relative h-full flex flex-col z-10 p-6 bg-white/80 dark:bg-gray-900/80 rounded-lg">
                          <!-- Header with Logo -->
                          <div class="flex items-start justify-between mb-6">
                            <div v-if="getFullImageUrl(selectedTemplate.logo_image)" class="w-20 h-20">
                              <img 
                                :src="getFullImageUrl(selectedTemplate.logo_image)" 
                                alt="Logo" 
                                class="w-full h-full object-contain" 
                                @error="(e) => { e.target.style.display = 'none' }"
                              />
                            </div>
                            <div v-else class="w-20 h-20 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                              <Building class="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div class="text-right">
                              <div class="text-xs text-gray-500 dark:text-gray-400">Certificate No.</div>
                              <div class="text-sm font-bold text-gray-700 dark:text-gray-300">CERT-2024-001</div>
                            </div>
                          </div>

                          <!-- Institute Name -->
                          <div class="text-center mb-6">
                            <h1 class="text-3xl font-bold text-indigo-900 dark:text-indigo-200 mb-2">
                              Sample Institute Name
                            </h1>
                            <p class="text-sm text-gray-600 dark:text-gray-400">
                              info@institute.com | +123 456 7890
                            </p>
                            <p class="text-sm text-gray-600 dark:text-gray-400">
                              123 Education Street, City, Country
                            </p>
                          </div>

                          <!-- Certificate Title -->
                          <div class="text-center mb-8">
                            <div class="inline-block">
                              <h2 class="text-2xl font-bold uppercase tracking-wider text-purple-900 dark:text-purple-200 border-b-4 border-purple-500 pb-2">
                                Certificate of Achievement
                              </h2>
                            </div>
                          </div>

                          <!-- Main Content -->
                          <div class="flex-1">
                            <div class="bg-white/50 dark:bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                              <div
                                class="certificate-content prose prose-sm max-w-none text-center"
                                :class="[
                                  'text-gray-800 dark:text-gray-200',
                                  'prose-headings:text-gray-900 dark:prose-headings:text-white',
                                  'prose-p:text-gray-700 dark:prose-p:text-gray-300',
                                  'prose-strong:text-gray-900 dark:prose-strong:text-white'
                                ]"
                                v-html="renderPreviewContent(selectedTemplate.content)"
                              ></div>
                            </div>
                          </div>

                          <!-- Footer with Signature -->
                          <div class="flex justify-between items-end mt-8 pt-6 border-t border-gray-300 dark:border-gray-600">
                            <div class="text-left">
                              <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Date of Issue</div>
                              <div class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {{ new Date().toLocaleDateString() }}
                              </div>
                            </div>
                            <div class="text-center">
                              <div class="w-32 h-16 bg-gray-100 dark:bg-gray-700 rounded mb-1 flex items-center justify-center">
                                <span class="text-xs text-gray-400">QR Code</span>
                              </div>
                            </div>
                            <div class="text-right">
                              <div class="w-32 border-t-2 border-gray-400 mb-1"></div>
                              <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Authorized Signature</div>
                              <div class="text-sm font-semibold text-gray-700 dark:text-gray-300">Principal</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Modal footer -->
              <div class="bg-white dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div class="flex justify-between items-center">
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    @click="showPreviewModal = false"
                  >
                    <X class="h-4 w-4" />
                    Close
                  </button>
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      @click="editTemplate(selectedTemplate)"
                      class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                      <Edit class="h-4 w-4" />
                      Edit Template
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { FileText, Edit, Trash2, Users, Layout, Building, Eye, X, ZoomIn, ZoomOut } from 'lucide-vue-next';

// Helper function to get full image URL
const getFullImageUrl = (path) => {
  if (!path) return null;
  // If it's already a full URL, return as is
  if (path.startsWith('http') || path.startsWith('blob:')) {
    return path;
  }
  // Otherwise, prepend the API base URL if it's a relative path
  const baseUrl = process.env.NUXT_PUBLIC_API_BASE_URL || '';
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};
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
const zoomLevel = ref(100);

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

const zoomIn = () => {
  if (zoomLevel.value < 150) {
    zoomLevel.value += 10;
  }
};

const zoomOut = () => {
  if (zoomLevel.value > 50) {
    zoomLevel.value -= 10;
  }
};

const renderPreviewContent = (content) => {
  if (!content) return '<p class="text-gray-500">No content available</p>';
  
  // Sample data for preview
  const sampleData = {
    name: 'John Doe',
    gender: 'Male',
    father_name: 'Robert Doe',
    mother_name: 'Jane Doe',
    register_no: 'REG-2024-001',
    roll: '001',
    admission_date: '2024-01-15',
    class: '10th Grade',
    section: 'A',
    birthday: '2010-05-15',
    email: 'john.doe@example.com',
    mobileno: '+1234567890',
    staff_id: 'EMP-001',
    designation: 'Senior Teacher',
    department: 'Mathematics',
    joining_date: '2020-08-01',
    institute_name: 'Sample Institute',
    print_date: new Date().toLocaleDateString()
  };

  let previewContent = content;
  
  // Replace {tag} patterns with sample data
  Object.keys(sampleData).forEach(tag => {
    const regex = new RegExp(`\\{${tag}\\}`, 'g');
    previewContent = previewContent.replace(
      regex,
      `<span class="inline-block bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-2 py-0.5 rounded text-xs font-semibold">${sampleData[tag]}</span>`
    );
  });

  return previewContent;
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
