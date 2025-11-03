<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Grading Systems</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage grading systems and grade scales
          </p>
        </div>
      </div>

      <!-- Grading Systems Tab -->
      <div class="p-6">
        <GradingSystemsTab />
      </div>
    </div>
  </div>
</template>

<script setup>
import GradingSystemsTab from '~/components/academic/GradingSystemsTab.vue';
</script>
