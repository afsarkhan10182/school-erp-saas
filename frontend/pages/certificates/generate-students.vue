<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-2 mb-2">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Generate Student Certificates</h1>
        </div>
        <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Select students and generate certificates using templates
        </p>
      </div>

      <!-- Generate Student Certificates Component -->
      <GenerateStudentCertificatesTab @success="handleGenerationSuccess" />
    </div>
  </div>
</template>

<script setup>
import GenerateStudentCertificatesTab from '~/components/certificates/GenerateStudentCertificatesTab.vue';

definePageMeta({
  title: 'Generate Student Certificates'
});

const handleGenerationSuccess = message => {
  console.log('Certificate generation success:', message);
};
</script>
