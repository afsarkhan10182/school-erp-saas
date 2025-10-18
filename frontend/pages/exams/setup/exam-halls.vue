<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Exam Halls</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage exam halls and their capacity
          </p>
        </div>
      </div>

      <!-- Exam Halls Tab -->
      <div class="p-6">
        <ExamHallsTab />
      </div>
    </div>
  </div>
</template>

<script setup>
import ExamHallsTab from '~/components/academic/ExamHallsTab.vue';
</script>
