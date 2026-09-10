<template>
  <div class="space-y-6">
    <!-- Templates List -->
    <div class="table-container">
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
                      v-if="getFullImageUrl(template.background_image, template)"
                      class="w-12 h-8 rounded border border-gray-300 dark:border-gray-600 overflow-hidden"
                    >
                      <img
                        :src="getFullImageUrl(template.background_image, template)"
                        :alt="template.name"
                        class="w-full h-full object-cover"
                        @error="
                          e => {
                            e.target.style.display = 'none';
                            e.target.parentNode.querySelector('.fallback-bg').style.display =
                              'flex';
                          }
                        "
                      />
                      <div
                        class="fallback-bg hidden w-full h-full bg-gray-100 dark:bg-gray-700 items-center justify-center"
                      >
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
              class="inline-block align-bottom rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full"
              :class="['bg-white dark:bg-gray-800']"
            >
              <!-- Modal header -->
              <div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <Eye class="h-6 w-6 text-white" />
                    <div>
                      <h3 class="text-lg font-bold text-white">Certificate Preview</h3>
                      <p class="text-sm text-indigo-100 mt-0.5">
                        {{ selectedTemplate?.name || 'Certificate Template' }}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                    @click="showPreviewModal = false"
                  >
                    <X class="h-5 w-5" />
                  </button>
                </div>
              </div>

              <!-- Modal body -->
              <div
                class="px-6 py-6 max-h-[80vh] overflow-y-auto transition-colors"
                :class="['bg-gray-50 dark:bg-gray-900']"
              >
                <div v-if="selectedTemplate" class="flex flex-col items-center">
                  <!-- Certificate Preview -->
                  <div class="w-full flex justify-center">
                    <div
                      class="certificate-preview-container rounded-lg shadow-2xl overflow-hidden border-2 transition-colors"
                      :class="[
                        selectedTemplate.page_layout === 'landscape'
                          ? 'w-[800px] h-[565px]'
                          : 'w-[595px] h-[842px]',
                        'bg-white dark:bg-gray-800',
                        'border-gray-300 dark:border-gray-700'
                      ]"
                      :style="{
                        transform: `scale(${zoomLevel / 100})`,
                        transformOrigin: 'top center',
                        transition: 'transform 0.2s ease',
                        maxWidth: '100%'
                      }"
                    >
                      <!-- Certificate Background -->
                      <div
                        class="relative h-full w-full transition-colors"
                        :class="[
                          getFullImageUrl(selectedTemplate.background_image, selectedTemplate)
                            ? ''
                            : 'bg-white dark:bg-gray-800'
                        ]"
                        :style="
                          getFullImageUrl(selectedTemplate.background_image, selectedTemplate)
                            ? `background-image: url('${getFullImageUrl(selectedTemplate.background_image, selectedTemplate)}'); background-size: cover; background-position: center; background-repeat: no-repeat;`
                            : ''
                        "
                      >
                        <!-- Certificate Content -->
                        <div
                          class="relative h-full w-full p-10 flex flex-col transition-colors"
                          :class="[
                            getFullImageUrl(selectedTemplate.background_image, selectedTemplate)
                              ? ''
                              : 'bg-white dark:bg-gray-800'
                          ]"
                        >
                          <!-- Header with Logo and Certificate Number -->
                          <div class="flex items-start justify-between mb-8">
                            <div
                              v-if="getFullImageUrl(selectedTemplate.logo_image, selectedTemplate)"
                              class="w-16 h-16 flex-shrink-0"
                            >
                              <img
                                :src="getFullImageUrl(selectedTemplate.logo_image, selectedTemplate)"
                                alt="Logo"
                                class="w-full h-full object-contain"
                                @error="
                                  e => {
                                    e.target.style.display = 'none';
                                  }
                                "
                              />
                            </div>
                            <div
                              v-else
                              class="w-16 h-16 rounded flex items-center justify-center flex-shrink-0 transition-colors"
                              :class="['bg-gray-200 dark:bg-gray-700']"
                            >
                              <Building
                                class="h-8 w-8 transition-colors"
                                :class="['text-gray-500 dark:text-gray-400']"
                              />
                            </div>
                          </div>

                          <!-- Certificate Title -->
                          <div class="text-center mb-6">
                            <div
                              class="inline-block border-b pb-2 transition-colors"
                              :class="['border-purple-600 dark:border-purple-400']"
                            >
                              <h2
                                class="text-lg font-bold uppercase tracking-wide transition-colors"
                                :class="['text-gray-900 dark:text-gray-200']"
                              >
                                Certificate of Achievement
                              </h2>
                            </div>
                          </div>

                          <!-- Main Content -->
                          <div class="flex-1 flex items-center justify-center py-2">
                            <div
                              class="w-full rounded-lg p-6 transition-colors"
                              :class="[
                                getFullImageUrl(selectedTemplate.background_image, selectedTemplate)
                                  ? 'bg-white/90 dark:bg-gray-900/80'
                                  : 'bg-gray-50 dark:bg-gray-700/50'
                              ]"
                            >
                              <div
                                class="certificate-content certificate-preview-content"
                                :class="['text-gray-800 dark:text-gray-200']"
                                v-html="renderPreviewContent(selectedTemplate.content)"
                              ></div>
                            </div>
                          </div>

                          <!-- Footer -->
                          <div
                            class="flex justify-between items-end mt-6 pt-4 border-t transition-colors"
                            :class="['border-gray-300 dark:border-gray-700']"
                          >
                            <div class="text-left">
                              <div
                                class="text-xs mb-1 transition-colors"
                                :class="['text-gray-500 dark:text-gray-400']"
                              >
                                Date
                              </div>
                              <div
                                class="text-xs font-medium transition-colors"
                                :class="['text-gray-700 dark:text-gray-300']"
                              >
                                {{ new Date().toLocaleDateString() }}
                              </div>
                            </div>
                            <div class="text-center">
                              <div
                                class="w-20 h-10 rounded flex items-center justify-center mx-auto mb-1 transition-colors"
                                :class="['bg-gray-100 dark:bg-gray-700']"
                              >
                                <span
                                  class="text-xs transition-colors"
                                  :class="['text-gray-500 dark:text-gray-400']"
                                  >QR</span
                                >
                              </div>
                            </div>
                            <div class="text-right">
                              <div
                                class="w-20 border-t mb-1 mx-auto transition-colors"
                                :class="['border-gray-400 dark:border-gray-600']"
                              ></div>
                              <div
                                class="text-xs mb-1 transition-colors"
                                :class="['text-gray-500 dark:text-gray-400']"
                              >
                                Signature
                              </div>
                              <div
                                class="text-xs font-medium transition-colors"
                                :class="['text-gray-700 dark:text-gray-300']"
                              >
                                Principal
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Zoom Controls -->
                  <div
                    class="mt-6 flex items-center gap-3 rounded-lg px-4 py-2 shadow-sm border transition-colors"
                    :class="['bg-white dark:bg-gray-800', 'border-gray-200 dark:border-gray-700']"
                  >
                    <button
                      type="button"
                      @click="zoomOut"
                      class="p-2 rounded transition-colors"
                      :class="['hover:bg-gray-100 dark:hover:bg-gray-700']"
                      title="Zoom Out"
                    >
                      <ZoomOut
                        class="h-4 w-4 transition-colors"
                        :class="['text-gray-600 dark:text-gray-400']"
                      />
                    </button>
                    <span
                      class="text-sm font-medium min-w-[3rem] text-center transition-colors"
                      :class="['text-gray-700 dark:text-gray-300']"
                      >{{ zoomLevel }}%</span
                    >
                    <button
                      type="button"
                      @click="zoomIn"
                      class="p-2 rounded transition-colors"
                      :class="['hover:bg-gray-100 dark:hover:bg-gray-700']"
                      title="Zoom In"
                    >
                      <ZoomIn
                        class="h-4 w-4 transition-colors"
                        :class="['text-gray-600 dark:text-gray-400']"
                      />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Modal footer -->
              <div
                class="px-6 py-4 border-t transition-colors"
                :class="['bg-gray-50 dark:bg-gray-800', 'border-gray-200 dark:border-gray-700']"
              >
                <div class="flex justify-end">
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                    :class="[
                      'bg-gray-600 dark:bg-gray-700',
                      'text-white dark:text-gray-100',
                      'hover:bg-gray-700 dark:hover:bg-gray-600',
                      'focus:ring-gray-500 dark:focus:ring-gray-400'
                    ]"
                    @click="showPreviewModal = false"
                  >
                    <X class="h-4 w-4" />
                    Close
                  </button>
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
import { ref, onMounted, computed, watch } from 'vue';
import {
  FileText,
  Edit,
  Trash2,
  Users,
  Layout,
  Building,
  Eye,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-vue-next';
import Pagination from '~/components/ui/Pagination.vue';
import { useCertificateTemplates } from '~/composables/useCertificateTemplates';
import { useBranches } from '~/composables/useBranches';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useToast } from '~/composables/useToast';
import { getCertificateUrl } from '~/utils/image';
import { useAuthStore } from '~/stores/auth';

// Helper function to get full image URL for certificate images
// Structure: uploads/schools/{schoolCode}/{year}/certificates/{filename}
const getFullImageUrl = (path, template = null) => {
  if (!path) return null;
  
  // If it's already a full URL or data URL, return as is
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  
  // Get school code from multiple sources (priority order):
  // 1. Template's branch school code (if template has branch with school)
  // 2. Selected branch's school code (from availableBranches)
  // 3. Current school from auth store
  let schoolCode = '';
  
  // Try from template's branch if available
  if (template?.branch?.school?.code) {
    schoolCode = template.branch.school.code;
  } else if (template?.branch?.school_code) {
    schoolCode = template.branch.school_code;
  }
  
  // Try from available branches if template has branch_id
  if (!schoolCode && template?.branch_id) {
    const branch = availableBranches.value.find(b => b.id === template.branch_id);
    if (branch?.school?.code) {
      schoolCode = branch.school.code;
    } else if (branch?.school_code) {
      schoolCode = branch.school_code;
    }
  }
  
  // Fallback to current school from auth store
  if (!schoolCode && authStore.currentSchool?.code) {
    schoolCode = authStore.currentSchool.code;
  }
  
  if (!schoolCode) {
    console.warn('⚠️ Could not determine school code for certificate image URL');
    return null;
  }
  
  // Construct the certificate URL: uploads/schools/{schoolCode}/{year}/certificates/{filename}
  return getCertificateUrl(path, schoolCode);
};

// Composables
const {
  templates,
  loading,
  pagination,
  loadTemplates,
  deleteTemplate: deleteTemplateApi
} = useCertificateTemplates();
const { availableBranches } = useBranches();
const { selectedBranchId, currentSchool } = useGlobalBranch();
const { showToast } = useToast();
const authStore = useAuthStore();

// Preview modal state
const showPreviewModal = ref(false);
const selectedTemplate = ref(null);
const zoomLevel = ref(100);

// Methods
const handlePageChange = page => {
  loadTemplates({ page, ...(selectedBranchId.value ? { branch_id: selectedBranchId.value } : {}) });
};

const loadSelectedTemplates = () => {
  loadTemplates(selectedBranchId.value ? { branch_id: selectedBranchId.value } : {});
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
      loadSelectedTemplates();
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

const renderPreviewContent = content => {
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
    institute_email: 'info@institute.com',
    institute_address: '123 Education Street, City, Country',
    institute_mobile_no: '+123 456 7890',
    logo: '🏫',
    signature: '✍️',
    qr_code: '📱',
    print_date: new Date().toLocaleDateString()
  };

  let previewContent = content;

  // First, handle dynamic tags that might be wrapped in span tags from the editor
  // Match patterns like: <span class="dynamic-tag" data-tag="name">{name}</span>
  Object.keys(sampleData).forEach(tag => {
    const tagRegex = new RegExp(
      `<span[^>]*class=["']dynamic-tag["'][^>]*data-tag=["']${tag}["'][^>]*>\\{${tag}\\}</span>`,
      'gi'
    );
    previewContent = previewContent.replace(
      tagRegex,
      `<span class="preview-tag">${sampleData[tag]}</span>`
    );
  });

  // Then replace plain {tag} patterns with sample data (preserves HTML structure)
  Object.keys(sampleData).forEach(tag => {
    const regex = new RegExp(`\\{${tag}\\}`, 'g');
    previewContent = previewContent.replace(
      regex,
      `<span class="preview-tag">${sampleData[tag]}</span>`
    );
  });

  return previewContent;
};

// Emits
const emit = defineEmits(['edit', 'refresh', 'success']);

// Expose methods for parent component
defineExpose({
  loadTemplates: loadSelectedTemplates
});

watch(selectedBranchId, () => {
  loadSelectedTemplates();
});

watch(currentSchool, () => {
  loadSelectedTemplates();
});

onMounted(() => {
  loadSelectedTemplates();
});
</script>

<style scoped>
/* Preview tag styles */
.certificate-preview-content :deep(.preview-tag) {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 500;
  margin: 0 2px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* Preserve HTML formatting in preview */
.certificate-preview-content {
  line-height: 1.6;
}

.certificate-preview-content :deep(p) {
  margin: 0.75em 0;
  font-size: 0.95rem;
  color: inherit;
}

.certificate-preview-content :deep(strong) {
  font-weight: 600;
  color: inherit;
}

.certificate-preview-content :deep(em) {
  font-style: italic;
}

.certificate-preview-content :deep(u) {
  text-decoration: underline;
}

.certificate-preview-content :deep([style*='text-align: center']) {
  text-align: center !important;
}

.certificate-preview-content :deep([style*='text-align: right']) {
  text-align: right !important;
}

.certificate-preview-content :deep([style*='text-align: left']) {
  text-align: left !important;
}

.certificate-preview-content :deep([style*='text-align: justify']) {
  text-align: justify !important;
}

.certificate-preview-content :deep(ul),
.certificate-preview-content :deep(ol) {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.certificate-preview-content :deep(li) {
  margin: 0.25em 0;
}

.certificate-preview-content :deep(h1) {
  font-size: 1.5rem;
  font-weight: 700;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  line-height: 1.3;
}

.certificate-preview-content :deep(h2) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  line-height: 1.3;
}

.certificate-preview-content :deep(h3) {
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  line-height: 1.3;
}

.certificate-preview-content :deep(div) {
  margin: 0;
}

/* Preserve inline styles from templates */
.certificate-preview-content :deep([style]) {
  /* All inline styles are preserved */
}
</style>
