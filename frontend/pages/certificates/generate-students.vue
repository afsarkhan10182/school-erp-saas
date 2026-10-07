<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
        Generate Student Certificates
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Select students and generate certificates using templates
      </p>
    </div>

    <!-- Generate Student Certificates Component -->
    <GenerateStudentCertificatesTab @success="handleGenerationSuccess" />
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
