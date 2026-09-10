<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Certificate Templates</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Create and manage certificate templates for students and employees
        </p>
      </div>
      <div>
        <button
          @click="showCreateModal = true"
          class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-sm"
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
