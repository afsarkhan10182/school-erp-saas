<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Certificate Management</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Create and manage certificate templates for students and employees
          </p>
        </div>
        <div class="mt-4 sm:mt-0">
          <button
            @click="showCreateModal = true"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus class="h-4 w-4 mr-2" />
            Create Template
          </button>
        </div>
      </div>

      <!-- Tab Navigation -->
      <ScrollableTabs :tabs="tabs" :active-tab="activeTab" @tab-change="handleTabChange">
        <!-- Certificate Templates Tab -->
        <div v-if="activeTab === 'templates'" class="p-6">
          <CertificateTemplatesTab
            ref="templatesTabRef"
            @refresh="loadTemplates"
            @success="handleTemplateSuccess"
            @edit="handleEditTemplate"
          />
        </div>

        <!-- Generate Student Certificates Tab -->
        <div v-else-if="activeTab === 'generate-student'" class="p-6">
          <GenerateStudentCertificatesTab
            ref="generateStudentTabRef"
            @success="handleGenerationSuccess"
          />
        </div>

        <!-- Generate Employee Certificates Tab -->
        <div v-else-if="activeTab === 'generate-employee'" class="p-6">
          <GenerateEmployeeCertificatesTab
            ref="generateEmployeeTabRef"
            @success="handleGenerationSuccess"
          />
        </div>
      </ScrollableTabs>
    </div>

    <!-- Create Template Modal -->
    <CertificateTemplateModal
      v-if="showCreateModal"
      :show="showCreateModal"
      @close="showCreateModal = false"
      @success="handleTemplateCreateSuccess"
    />

    <!-- Edit Template Modal -->
    <CertificateTemplateModal
      v-if="showEditModal"
      :show="showEditModal"
      :template="selectedTemplate"
      @close="showEditModal = false"
      @success="handleTemplateEditSuccess"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Plus } from 'lucide-vue-next';
import ScrollableTabs from '~/components/ui/ScrollableTabs.vue';
import CertificateTemplatesTab from '~/components/certificates/CertificateTemplatesTab.vue';
import GenerateStudentCertificatesTab from '~/components/certificates/GenerateStudentCertificatesTab.vue';
import GenerateEmployeeCertificatesTab from '~/components/certificates/GenerateEmployeeCertificatesTab.vue';
import CertificateTemplateModal from '~/components/certificates/CertificateTemplateModal.vue';

// Page meta
definePageMeta({
  title: 'Certificate Management'
});

// Reactive data
const route = useRoute();
const activeTab = ref(route.query.tab || 'templates');
const showCreateModal = ref(false);
const showEditModal = ref(false);
const selectedTemplate = ref(null);

// Tab references
const templatesTabRef = ref(null);
const generateStudentTabRef = ref(null);
const generateEmployeeTabRef = ref(null);

// Tab configuration
const tabs = [
  {
    id: 'templates',
    name: 'Templates',
    icon: 'FileText',
    description: 'Manage certificate templates'
  },
  {
    id: 'generate-student',
    name: 'Generate Student',
    icon: 'GraduationCap',
    description: 'Generate certificates for students'
  },
  {
    id: 'generate-employee',
    name: 'Generate Employee',
    icon: 'Users',
    description: 'Generate certificates for employees'
  }
];

// Methods
const handleTabChange = tabId => {
  activeTab.value = tabId;
};

const loadTemplates = () => {
  if (templatesTabRef.value) {
    templatesTabRef.value.loadTemplates();
  }
};

const handleTemplateSuccess = message => {
  // Handle template success (create, update, delete)
  console.log('Template operation success:', message);
};

const handleTemplateCreateSuccess = template => {
  showCreateModal.value = false;
  loadTemplates();
  // Show success message
  console.log('Template created successfully:', template);
};

const handleEditTemplate = template => {
  selectedTemplate.value = template;
  showEditModal.value = true;
};

const handleTemplateEditSuccess = template => {
  showEditModal.value = false;
  loadTemplates();
  // Show success message
  console.log('Template updated successfully:', template);
};

const handleGenerationSuccess = message => {
  // Handle certificate generation success
  console.log('Certificate generation success:', message);
};

// Watch for route changes to update active tab
watch(
  () => route.query.tab,
  newTab => {
    if (newTab) {
      activeTab.value = newTab;
    }
  }
);

onMounted(() => {
  // Initialize any required data
});
</script>
