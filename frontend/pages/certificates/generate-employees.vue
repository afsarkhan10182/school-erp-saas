<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
        Generate Employee Certificates
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Select employees and generate certificates using templates
      </p>
    </div>

    <!-- Generate Employee Certificates Component -->
    <GenerateEmployeeCertificatesTab @success="handleGenerationSuccess" />
  </div>
</template>

<script setup>
import GenerateEmployeeCertificatesTab from '~/components/certificates/GenerateEmployeeCertificatesTab.vue';

definePageMeta({
  title: 'Generate Employee Certificates'
});

const handleGenerationSuccess = message => {
  console.log('Certificate generation success:', message);
};
</script>
