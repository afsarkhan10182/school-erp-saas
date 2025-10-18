<template>
  <div class="space-y-6">
    <!-- Exam Statistics Content -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Exam Statistics</h2>
        <div class="flex space-x-2">
          <button class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Export Statistics
          </button>
        </div>
      </div>
      
      <!-- Statistics Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-blue-600">Total Exams</p>
              <p class="text-3xl font-bold text-blue-600">24</p>
            </div>
            <BookOpen class="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-green-600">Completed Exams</p>
              <p class="text-3xl font-bold text-green-600">18</p>
            </div>
            <CheckCircle class="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div class="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-orange-600">Upcoming Exams</p>
              <p class="text-3xl font-bold text-orange-600">6</p>
            </div>
            <Calendar class="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>
      
      <!-- Statistics Chart Placeholder -->
      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
        <BarChart3 class="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Exam Statistics</h3>
        <p class="text-gray-600 dark:text-gray-400">Statistical analysis charts will be displayed here</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { BookOpen, CheckCircle, Calendar, BarChart3 } from 'lucide-vue-next';
</script>
