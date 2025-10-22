<template>
  <div
    v-if="show"
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
        @click="close"
      ></div>

      <!-- Modal panel -->
      <div
        class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
      >
        <form @submit.prevent="handleSubmit">
          <!-- Modal header -->
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                {{ isEdit ? 'Edit Certificate Template' : 'Create Certificate Template' }}
              </h3>
              <button
                type="button"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                @click="close"
              >
                <X class="h-6 w-6" />
              </button>
            </div>
          </div>

          <!-- Modal body -->
          <div class="bg-white dark:bg-gray-800 px-4 pb-4 sm:p-6">
            <div class="space-y-6">
              <!-- Basic Information -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Template Name -->
                <div>
                  <label
                    for="name"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Template Name *
                  </label>
                  <input
                    id="name"
                    v-model="form.name"
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter template name"
                  />
                </div>

                <!-- User Type -->
                <div>
                  <label
                    for="userType"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Applicable User *
                  </label>
                  <select
                    id="userType"
                    v-model="form.user_type"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select user type</option>
                    <option value="student">Student</option>
                    <option value="employee">Employee</option>
                  </select>
                </div>

                <!-- Page Layout -->
                <div>
                  <label
                    for="pageLayout"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Page Layout *
                  </label>
                  <select
                    id="pageLayout"
                    v-model="form.page_layout"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="portrait">A4 Portrait</option>
                    <option value="landscape">A4 Landscape</option>
                  </select>
                </div>

                <!-- Branch Selection -->
                <div>
                  <label
                    for="branchId"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Branch *
                  </label>
                  <select
                    id="branchId"
                    v-model="form.branch_id"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    :disabled="availableBranches.length === 0"
                  >
                    <option value="">
                      {{ availableBranches.length === 0 ? 'Loading branches...' : 'Select branch' }}
                    </option>
                    <option v-for="branch in availableBranches" :key="branch.id" :value="branch.id">
                      {{ branch.name }}
                    </option>
                  </select>
                  <div
                    v-if="availableBranches.length === 0"
                    class="mt-1 text-xs text-gray-500 dark:text-gray-400"
                  >
                    No branches available. Please check your permissions.
                  </div>
                </div>

                <!-- QR Code Text -->
                <div>
                  <label
                    for="qrCodeText"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    QR Code Text *
                  </label>
                  <select
                    id="qrCodeText"
                    v-model="form.qr_code_text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select QR code text</option>
                    <option v-if="form.user_type === 'student'" value="name">Student Name</option>
                    <option v-if="form.user_type === 'student'" value="register_no">
                      Register Number
                    </option>
                    <option v-if="form.user_type === 'student'" value="roll">Roll Number</option>
                    <option v-if="form.user_type === 'student'" value="birthday">
                      Date of Birth
                    </option>
                    <option v-if="form.user_type === 'employee'" value="staff_id">Staff ID</option>
                    <option v-if="form.user_type === 'employee'" value="name">Employee Name</option>
                    <option v-if="form.user_type === 'employee'" value="birthday">
                      Date of Birth
                    </option>
                    <option v-if="form.user_type === 'employee'" value="joining_date">
                      Joining Date
                    </option>
                  </select>
                </div>
              </div>

              <!-- Visual Settings -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- User Photo Style -->
                <div>
                  <label
                    for="photoStyle"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    User Photo Style *
                  </label>
                  <select
                    id="photoStyle"
                    v-model="form.user_photo_style"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="square">Square</option>
                    <option value="round">Round</option>
                  </select>
                </div>

                <!-- Photo Size -->
                <div>
                  <label
                    for="photoSize"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Photo Size (px) *
                  </label>
                  <input
                    id="photoSize"
                    v-model.number="form.photo_size"
                    type="number"
                    min="50"
                    max="300"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <!-- File Uploads -->
              <div>
                <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Images</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Logo Image -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Logo Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      @change="handleFileUpload($event, 'logo_image')"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <!-- Background Image -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Background Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      @change="handleFileUpload($event, 'background_image')"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <!-- Certificate Content -->
              <div>
                <label
                  for="content"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Certificate Content *
                </label>

                <!-- Rich Text Editor -->
                <RichTextEditor
                  v-model="form.content"
                  :available-tags="availableTags"
                  placeholder="Enter certificate content here. Use the toolbar to format text and insert dynamic content tags like {name}, {institute_name}, etc."
                />

                <!-- Preview Section -->
                <div v-if="form.content" class="mt-4">
                  <div class="flex items-center justify-between mb-2">
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Content Preview
                    </label>
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      This shows how your content will look with dynamic tags rendered
                    </span>
                  </div>
                  <div
                    class="border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                  >
                    <!-- Preview Header -->
                    <div
                      class="bg-gray-50 dark:bg-gray-700 px-3 py-2 border-b border-gray-200 dark:border-gray-600"
                    >
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-medium text-gray-600 dark:text-gray-400"
                          >Certificate Preview</span
                        >
                        <div class="flex items-center space-x-2">
                          <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                          <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    <!-- Preview Content -->
                    <div class="p-6 min-h-[200px] max-h-80 overflow-y-auto">
                      <div
                        class="certificate-preview prose prose-sm max-w-none"
                        :class="[
                          'text-gray-900 dark:text-white',
                          'prose-headings:text-gray-900 dark:prose-headings:text-white',
                          'prose-p:text-gray-700 dark:prose-p:text-gray-300',
                          'prose-strong:text-gray-900 dark:prose-strong:text-white'
                        ]"
                        v-html="getPreviewContent()"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal footer -->
          <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              :disabled="loading"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ loading ? 'Saving...' : isEdit ? 'Update Template' : 'Create Template' }}
            </button>
            <button
              type="button"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              @click="close"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { X } from 'lucide-vue-next';
import { useCertificateTemplates } from '~/composables/useCertificateTemplates';
import { useBranches } from '~/composables/useBranches';
import { useToast } from '~/composables/useToast';
import RichTextEditor from '~/components/ui/RichTextEditor.vue';

// Props
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  template: {
    type: Object,
    default: null
  }
});

// Emits
const emit = defineEmits(['close', 'success']);

// Composables
const { createTemplate, updateTemplate } = useCertificateTemplates();
const { availableBranches, fetchBranchesForUser, currentBranch } = useBranches();
const { showToast } = useToast();

// Reactive data
const loading = ref(false);
const form = reactive({
  name: '',
  user_type: '',
  page_layout: 'portrait',
  qr_code_text: '',
  user_photo_style: 'square',
  photo_size: 100,
  logo_image: null,
  background_image: null,
  content: '',
  branch_id: ''
});

// Computed
const isEdit = computed(() => !!props.template);

// Available tags based on user type
const availableTags = computed(() => {
  if (form.user_type === 'student') {
    return [
      'name',
      'gender',
      'father_name',
      'mother_name',
      'student_photo',
      'register_no',
      'roll',
      'admission_date',
      'class',
      'section',
      'category',
      'caste',
      'religion',
      'blood_group',
      'birthday',
      'email',
      'mobileno',
      'present_address',
      'permanent_address',
      'logo',
      'signature',
      'qr_code',
      'institute_name',
      'institute_email',
      'institute_address',
      'institute_mobile_no',
      'print_date'
    ];
  } else if (form.user_type === 'employee') {
    return [
      'name',
      'gender',
      'staff_id',
      'staff_photo',
      'designation',
      'department',
      'joining_date',
      'birthday',
      'email',
      'mobileno',
      'present_address',
      'permanent_address',
      'logo',
      'signature',
      'qr_code',
      'institute_name',
      'institute_email',
      'institute_address',
      'institute_mobile_no',
      'print_date'
    ];
  }
  return [];
});

// Methods
const close = () => {
  emit('close');
};

const handleFileUpload = (event, field) => {
  const file = event.target.files[0];
  if (file) {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Please select a valid image file (JPEG, PNG, or GIF)', 'error');
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      showToast('File size must be less than 5MB', 'error');
      return;
    }

    form[field] = file;
    showToast(`${field.replace('_', ' ')} uploaded successfully`, 'success');
  }
};

const getPreviewContent = () => {
  if (!form.content) return '';

  // Sample data for preview
  const sampleData = {
    name: 'John Doe',
    gender: 'Male',
    father_name: 'Robert Doe',
    mother_name: 'Jane Doe',
    student_photo: '👤',
    register_no: 'REG001',
    roll: '001',
    admission_date: '2024-01-15',
    class: '10th Grade',
    section: 'A',
    category: 'General',
    caste: 'General',
    religion: 'Hindu',
    blood_group: 'O+',
    birthday: '2010-05-15',
    email: 'john.doe@example.com',
    mobileno: '+1234567890',
    present_address: '123 Main St, City',
    permanent_address: '123 Main St, City',
    staff_id: 'EMP001',
    staff_photo: '👤',
    designation: 'Teacher',
    department: 'Mathematics',
    joining_date: '2020-08-01',
    logo: '🏫',
    signature: '✍️',
    qr_code: '📱',
    institute_name: 'Sample School',
    institute_email: 'info@school.com',
    institute_address: 'School Street, Education City',
    institute_mobile_no: '+1234567890',
    print_date: new Date().toLocaleDateString()
  };

  // Replace dynamic tags with sample data
  let previewContent = form.content;

  // Replace {tag} patterns with sample data
  Object.keys(sampleData).forEach(tag => {
    const regex = new RegExp(`\\{${tag}\\}`, 'g');
    previewContent = previewContent.replace(
      regex,
      `<span class="preview-tag">${sampleData[tag]}</span>`
    );
  });

  return previewContent;
};

const handleSubmit = async () => {
  try {
    loading.value = true;

    const formData = new FormData();

    // Add all form fields to FormData
    Object.keys(form).forEach(key => {
      if (form[key] !== null && form[key] !== '') {
        if (key.includes('_image') && form[key] instanceof File) {
          formData.append(key, form[key]);
        } else if (!key.includes('_image')) {
          formData.append(key, form[key]);
        }
      }
    });

    let result;
    if (isEdit.value) {
      result = await updateTemplate(props.template.id, formData);
    } else {
      result = await createTemplate(formData);
    }

    showToast(
      isEdit.value ? 'Template updated successfully' : 'Template created successfully',
      'success'
    );

    emit('success', result);
    close();
  } catch (error) {
    showToast('Failed to save template', 'error');
    console.error('Error saving template:', error);
  } finally {
    loading.value = false;
  }
};

// Load branches on mount
onMounted(async () => {
  try {
    console.log('Loading branches...');
    await fetchBranchesForUser();
    console.log('Available branches:', availableBranches.value);

    // Set default branch if only one branch exists
    if (availableBranches.value.length === 1) {
      form.branch_id = availableBranches.value[0].id;
      console.log('Auto-selected branch:', form.branch_id);
    } else if (availableBranches.value.length === 0 && currentBranch.value) {
      // Fallback: use current branch if no branches are loaded
      form.branch_id = currentBranch.value.id;
      console.log('Using current branch as fallback:', form.branch_id);
    }
  } catch (error) {
    console.error('Error loading branches:', error);
    showToast('Failed to load branches. Please refresh the page.', 'error');
  }
});

// Watch for template prop changes to populate form
watch(
  () => props.template,
  newTemplate => {
    if (newTemplate) {
      Object.keys(form).forEach(key => {
        if (key in newTemplate) {
          form[key] = newTemplate[key];
        }
      });
    }
  },
  { immediate: true }
);

// Watch for user_type changes to reset QR code text
watch(
  () => form.user_type,
  () => {
    form.qr_code_text = '';
  }
);

// Watch for availableBranches changes to auto-select if only one branch
watch(
  () => availableBranches.value,
  newBranches => {
    if (newBranches.length === 1 && !form.branch_id) {
      form.branch_id = newBranches[0].id;
      console.log('Auto-selected branch from watcher:', form.branch_id);
    }
  },
  { immediate: true }
);
</script>

<style scoped>
/* Preview tag styles */
.certificate-preview :deep(.preview-tag) {
  display: inline-block;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
  margin: 0 1px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.certificate-preview :deep(.preview-tag::before) {
  content: '📋';
  margin-right: 3px;
  font-size: 0.7rem;
}
</style>
