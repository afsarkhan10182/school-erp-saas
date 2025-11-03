<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Certificate Templates</h1>
          </div>
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

      <!-- Templates List -->
      <CertificateTemplatesTab
        ref="templatesTabRef"
        @refresh="loadTemplates"
        @success="handleTemplateSuccess"
        @edit="handleEditTemplate"
      />
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
import { ref } from 'vue';
import { ArrowLeft, Plus } from 'lucide-vue-next';
import CertificateTemplatesTab from '~/components/certificates/CertificateTemplatesTab.vue';
import CertificateTemplateModal from '~/components/certificates/CertificateTemplateModal.vue';

definePageMeta({
  title: 'Certificate Templates'
});

const showCreateModal = ref(false);
const showEditModal = ref(false);
const selectedTemplate = ref(null);
const templatesTabRef = ref(null);

const loadTemplates = () => {
  if (templatesTabRef.value) {
    templatesTabRef.value.loadTemplates();
  }
};

const handleTemplateSuccess = message => {
  console.log('Template operation success:', message);
};

const handleTemplateCreateSuccess = template => {
  showCreateModal.value = false;
  loadTemplates();
};

const handleEditTemplate = template => {
  selectedTemplate.value = template;
  showEditModal.value = true;
};

const handleTemplateEditSuccess = template => {
  showEditModal.value = false;
  loadTemplates();
};
</script>
