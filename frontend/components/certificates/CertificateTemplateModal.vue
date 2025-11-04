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
        class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full"
      >
        <form @submit.prevent="handleSubmit">
          <!-- Modal header -->
          <div
            class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4"
          >
            <div class="flex items-center justify-between">
              <h3 class="text-lg leading-6 font-semibold text-gray-900 dark:text-white">
                {{ isEdit ? 'Edit Certificate Template' : 'Create Certificate Template' }}
              </h3>
              <button
                type="button"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                @click="close"
              >
                <X class="h-5 w-5" />
              </button>
            </div>
          </div>

          <!-- Modal body -->
          <div class="bg-white dark:bg-gray-800 px-6 py-6 max-h-[65vh] overflow-y-auto">
            <div class="space-y-6">
              <!-- Basic Information -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                    class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out hover:border-indigo-300 dark:hover:border-indigo-500"
                    placeholder="Enter template name"
                  />
                </div>

                <!-- User Type -->
                <div>
                  <EnhancedDropdown
                    id="userType"
                    v-model="form.user_type"
                    :options="[
                      { value: 'student', label: 'Student' },
                      { value: 'employee', label: 'Employee' }
                    ]"
                    label="Applicable User"
                    placeholder="Select user type"
                    required
                    @change="handleUserTypeChange"
                  />
                </div>

                <!-- Page Layout -->
                <div>
                  <EnhancedDropdown
                    id="pageLayout"
                    v-model="form.page_layout"
                    :options="[
                      { value: 'portrait', label: 'A4 Portrait' },
                      { value: 'landscape', label: 'A4 Landscape' }
                    ]"
                    label="Page Layout"
                    placeholder="Select page layout"
                    required
                  />
                </div>

                <!-- Branch Selection -->
                <div>
                  <EnhancedDropdown
                    id="branchId"
                    v-model="form.branch_id"
                    :options="availableBranches.map(branch => ({ value: branch.id, label: branch.name }))"
                    :placeholder="availableBranches.length === 0 ? 'Loading branches...' : 'Select branch'"
                    label="Branch"
                    required
                    :disabled="availableBranches.length === 0"
                    :loading="availableBranches.length === 0"
                    loading-text="Loading branches..."
                    :helper-text="availableBranches.length === 0 ? 'No branches available. Please check your permissions.' : ''"
                  />
                </div>

                <!-- QR Code Text -->
                <div>
                  <EnhancedDropdown
                    id="qrCodeText"
                    v-model="form.qr_code_text"
                    :options="qrCodeOptions"
                    label="QR Code Text"
                    placeholder="Select QR code text"
                    required
                    :disabled="!form.user_type"
                  />
                </div>
              </div>

              <!-- Photo Settings -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <EnhancedDropdown
                    id="photoStyle"
                    v-model="form.user_photo_style"
                    :options="[
                      { value: 'square', label: 'Square' },
                      { value: 'round', label: 'Round' }
                    ]"
                    label="User Photo Style"
                    placeholder="Select photo style"
                    required
                  />
                </div>

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
                    class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200 ease-in-out hover:border-indigo-300 dark:hover:border-indigo-500"
                  />
                </div>
              </div>

              <!-- Images Upload -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Certificate Images
                </label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Logo Image -->
                  <div>
                    <label class="block text-xs text-gray-600 dark:text-gray-400 mb-2"
                      >Logo Image</label
                    >
                    <input
                      ref="logoInput"
                      type="file"
                      accept="image/*"
                      @change="handleFileUpload($event, 'logo_image')"
                      class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900 dark:file:text-indigo-200"
                    />
                    <div v-if="logoPreview" class="mt-2 relative inline-block">
                      <img
                        :src="logoPreview"
                        alt="Logo"
                        class="h-20 w-20 object-cover rounded border border-gray-300"
                      />
                      <button
                        type="button"
                        @click="clearImage('logo_image')"
                        class="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X class="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <!-- Background Image -->
                  <div>
                    <label class="block text-xs text-gray-600 dark:text-gray-400 mb-2"
                      >Background Image</label
                    >
                    <input
                      ref="bgInput"
                      type="file"
                      accept="image/*"
                      @change="handleFileUpload($event, 'background_image')"
                      class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900 dark:file:text-indigo-200"
                    />
                    <div v-if="backgroundPreview" class="mt-2 relative inline-block">
                      <img
                        :src="backgroundPreview"
                        alt="Background"
                        class="h-20 w-32 object-cover rounded border border-gray-300"
                      />
                      <button
                        type="button"
                        @click="clearImage('background_image')"
                        class="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X class="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Certificate Content Editor -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Certificate Content *
                  </label>
                  <button
                    type="button"
                    @click="showTemplates = !showTemplates"
                    class="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                  >
                    {{ showTemplates ? 'Hide' : 'Show' }} Templates
                  </button>
                </div>

                <!-- Template Samples -->
                <div
                  v-if="showTemplates"
                  class="mb-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Click a template to load it:
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="template in sampleTemplates"
                      :key="template.id"
                      type="button"
                      @click="loadSampleTemplate(template.content)"
                      class="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-500 transition-colors"
                    >
                      {{ template.name }}
                    </button>
                  </div>
                </div>

                <RichTextEditor
                  v-model="form.content"
                  :available-tags="availableTags"
                  placeholder="Enter certificate content here. Use the toolbar to format text and insert dynamic tags..."
                />
              </div>

              <!-- Content Preview -->
              <div v-if="form.content" class="mt-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preview
                </label>
                <div
                  class="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900 max-h-48 overflow-y-auto"
                >
                  <div
                    class="prose prose-sm max-w-none"
                    :class="[
                      'text-gray-900 dark:text-white',
                      'prose-p:text-gray-700 dark:prose-p:text-gray-300'
                    ]"
                    v-html="getPreviewContent()"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal footer -->
          <div
            class="bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 px-6 py-4 flex justify-end gap-3"
          >
            <button
              type="button"
              @click="close"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ loading ? 'Saving...' : isEdit ? 'Update' : 'Create' }}
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
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';

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
const logoPreview = ref(null);
const backgroundPreview = ref(null);
const showTemplates = ref(true);

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

// Sample templates based on user type
const sampleTemplates = computed(() => {
  if (form.user_type === 'student') {
    return [
      {
        id: 1,
        name: 'Achievement Certificate',
        content: `<div style="text-align: center;">
<h1 style="font-size: 28px; margin-bottom: 20px; color: #1e40af;">Certificate of Achievement</h1>
<p style="font-size: 16px; margin: 20px 0;">This is to certify that</p>
<h2 style="font-size: 24px; margin: 15px 0; color: #4f46e5;">{name}</h2>
<p style="font-size: 16px; margin: 20px 0;">Son/Daughter of <strong>{father_name}</strong> and <strong>{mother_name}</strong></p>
<p style="font-size: 16px; margin: 20px 0;">Registration No: <strong>{register_no}</strong> | Class: <strong>{class}</strong> Section: <strong>{section}</strong></p>
<p style="font-size: 16px; margin: 20px 0; line-height: 1.8;">Has successfully completed the academic year with outstanding performance and has been awarded this certificate in recognition of their dedication and hard work.</p>
<p style="font-size: 14px; margin-top: 30px;">Date: {print_date}</p>
</div>`
      },
      {
        id: 2,
        name: 'Participation Certificate',
        content: `<div style="text-align: center;">
<h1 style="font-size: 28px; margin-bottom: 20px; color: #059669;">Certificate of Participation</h1>
<p style="font-size: 16px; margin: 20px 0;">This certifies that</p>
<h2 style="font-size: 24px; margin: 15px 0; color: #10b981;">{name}</h2>
<p style="font-size: 16px; margin: 20px 0;">Class: <strong>{class}</strong> | Section: <strong>{section}</strong></p>
<p style="font-size: 16px; margin: 20px 0;">Roll No: <strong>{roll}</strong> | Registration No: <strong>{register_no}</strong></p>
<p style="font-size: 16px; margin: 20px 0; line-height: 1.8;">Has actively participated in school activities and events during the academic year and demonstrated excellent team spirit and cooperation.</p>
<p style="font-size: 14px; margin-top: 30px;">Issued on: {print_date}</p>
</div>`
      },
      {
        id: 3,
        name: 'Character Certificate',
        content: `<div style="text-align: center;">
<h1 style="font-size: 28px; margin-bottom: 20px; color: #7c3aed;">Character Certificate</h1>
<p style="font-size: 16px; margin: 20px 0;">This is to certify that</p>
<h2 style="font-size: 24px; margin: 15px 0; color: #8b5cf6;">{name}</h2>
<p style="font-size: 16px; margin: 20px 0;">Son/Daughter of <strong>{father_name}</strong></p>
<p style="font-size: 16px; margin: 20px 0;">Registration No: <strong>{register_no}</strong> | Date of Birth: <strong>{birthday}</strong></p>
<p style="font-size: 16px; margin: 20px 0; line-height: 1.8;">Was a student of this institution from <strong>{admission_date}</strong> studying in Class <strong>{class}</strong>. During their time here, they have shown good character, discipline, and have maintained excellent conduct throughout.</p>
<p style="font-size: 14px; margin-top: 30px;">Date: {print_date}</p>
</div>`
      }
    ];
  } else if (form.user_type === 'employee') {
    return [
      {
        id: 1,
        name: 'Experience Certificate',
        content: `<div style="text-align: center;">
<h1 style="font-size: 28px; margin-bottom: 20px; color: #1e40af;">Experience Certificate</h1>
<p style="font-size: 16px; margin: 20px 0;">This is to certify that</p>
<h2 style="font-size: 24px; margin: 15px 0; color: #4f46e5;">{name}</h2>
<p style="font-size: 16px; margin: 20px 0;">Staff ID: <strong>{staff_id}</strong></p>
<p style="font-size: 16px; margin: 20px 0;">Worked with our institution as <strong>{designation}</strong> in the <strong>{department}</strong> department from <strong>{joining_date}</strong>.</p>
<p style="font-size: 16px; margin: 20px 0; line-height: 1.8;">During their tenure, they have shown dedication, professionalism, and commitment to their responsibilities. Their work has been satisfactory and they have been a valuable member of our team.</p>
<p style="font-size: 14px; margin-top: 30px;">Date: {print_date}</p>
</div>`
      },
      {
        id: 2,
        name: 'Appreciation Certificate',
        content: `<div style="text-align: center;">
<h1 style="font-size: 28px; margin-bottom: 20px; color: #059669;">Certificate of Appreciation</h1>
<p style="font-size: 16px; margin: 20px 0;">This certificate is awarded to</p>
<h2 style="font-size: 24px; margin: 15px 0; color: #10b981;">{name}</h2>
<p style="font-size: 16px; margin: 20px 0;">Designation: <strong>{designation}</strong> | Department: <strong>{department}</strong></p>
<p style="font-size: 16px; margin: 20px 0; line-height: 1.8;">In recognition of their outstanding contribution, excellent performance, and dedication to the institution. Their hard work and commitment have been exemplary and serve as an inspiration to others.</p>
<p style="font-size: 14px; margin-top: 30px;">Date: {print_date}</p>
</div>`
      },
      {
        id: 3,
        name: 'Service Certificate',
        content: `<div style="text-align: center;">
<h1 style="font-size: 28px; margin-bottom: 20px; color: #7c3aed;">Service Certificate</h1>
<p style="font-size: 16px; margin: 20px 0;">This is to certify that</p>
<h2 style="font-size: 24px; margin: 15px 0; color: #8b5cf6;">{name}</h2>
<p style="font-size: 16px; margin: 20px 0;">Staff ID: <strong>{staff_id}</strong> | Email: <strong>{email}</strong></p>
<p style="font-size: 16px; margin: 20px 0;">Has been serving our institution as <strong>{designation}</strong> since <strong>{joining_date}</strong>.</p>
<p style="font-size: 16px; margin: 20px 0; line-height: 1.8;">They have consistently demonstrated professionalism, reliability, and dedication in their role. This certificate is issued upon their request for official purposes.</p>
<p style="font-size: 14px; margin-top: 30px;">Date: {print_date}</p>
</div>`
      }
    ];
  }
  return [];
});

// QR Code options based on user type
const qrCodeOptions = computed(() => {
  if (form.user_type === 'student') {
    return [
      { value: 'name', label: 'Student Name' },
      { value: 'register_no', label: 'Register Number' },
      { value: 'roll', label: 'Roll Number' },
      { value: 'birthday', label: 'Date of Birth' }
    ];
  } else if (form.user_type === 'employee') {
    return [
      { value: 'staff_id', label: 'Staff ID' },
      { value: 'name', label: 'Employee Name' },
      { value: 'birthday', label: 'Date of Birth' },
      { value: 'joining_date', label: 'Joining Date' }
    ];
  }
  return [];
});

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

    // Create preview
    const reader = new FileReader();
    reader.onload = e => {
      if (field === 'logo_image') {
        logoPreview.value = e.target.result;
      } else if (field === 'background_image') {
        backgroundPreview.value = e.target.result;
      }
    };
    reader.readAsDataURL(file);

    showToast(`${field.replace('_', ' ')} uploaded successfully`, 'success');
  }
};

const clearImage = field => {
  form[field] = null;
  if (field === 'logo_image') {
    logoPreview.value = null;
  } else if (field === 'background_image') {
    backgroundPreview.value = null;
  }
};

const loadSampleTemplate = content => {
  form.content = content;
  showToast('Template loaded successfully', 'success');
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
      // Skip preview properties
      if (key.endsWith('_preview')) return;

      // Handle file uploads
      if (key.endsWith('_image')) {
        if (form[key] && form[key] instanceof File) {
          formData.append(key, form[key]);
        } else if (form[key] && typeof form[key] === 'string' && form[key].startsWith('data:')) {
          // If it's a data URL, convert it to a blob
          fetch(form[key])
            .then(res => res.blob())
            .then(blob => {
              const file = new File([blob], 'background.jpg', { type: 'image/jpeg' });
              formData.append(key, file);
            });
        } else if (form[key]) {
          // If it's a string URL, just append it
          formData.append(key, form[key]);
        }
      } else if (form[key] !== null && form[key] !== undefined) {
        // Handle all other fields
        formData.append(key, form[key]);
      }
    });

    // Add _method for Laravel if it's an edit
    if (isEdit.value) {
      formData.append('_method', 'PUT');
    }

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
  } finally {
    loading.value = false;
  }
};

// Load branches on mount
onMounted(async () => {
  try {
    await fetchBranchesForUser();

    // Set default branch if only one branch exists
    if (availableBranches.value.length === 1) {
      form.branch_id = availableBranches.value[0].id;
    } else if (availableBranches.value.length === 0 && currentBranch.value) {
      // Fallback: use current branch if no branches are loaded
      form.branch_id = currentBranch.value.id;
    }
  } catch (error) {
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

// Handle user type change
const handleUserTypeChange = () => {
  form.qr_code_text = '';
};

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
