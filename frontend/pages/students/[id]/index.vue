<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Student Details</h1>
            <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
              View and manage student information
            </p>
          </div>
          <div class="flex space-x-3">
            <button
              @click="editStudent"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Edit Student
            </button>
            <NuxtLink
              :to="`/students/${student?.id}/fee-ledger`"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <CreditCard class="h-4 w-4 mr-2" />
              Fee Ledger
            </NuxtLink>
            <button
              @click="$router.back()"
              class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Back
            </button>
          </div>
        </div>
      </div>

      <!-- Student Info -->
      <div v-if="isLoading" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading student details...</p>
      </div>

      <div v-else-if="student" class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
            {{ student.first_name }} {{ student.last_name }}
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-medium text-gray-900 dark:text-white mb-3">Basic Information</h4>
              <dl class="space-y-2">
                <div>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Admission Number</dt>
                  <dd class="text-sm text-gray-900 dark:text-white">{{ student.admission_number }}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Class</dt>
                  <dd class="text-sm text-gray-900 dark:text-white">
                    {{ student.current_class }}{{ student.section ? `-${student.section}` : '' }}
                  </dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Academic Year</dt>
                  <dd class="text-sm text-gray-900 dark:text-white">{{ student.academic_year }}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                  <dd class="text-sm">
                    <span
                      :class="{
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': student.status === 'active',
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': student.status !== 'active',
                      }"
                      class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                    >
                      {{ student.status }}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h4 class="font-medium text-gray-900 dark:text-white mb-3">Contact Information</h4>
              <dl class="space-y-2">
                <div>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                  <dd class="text-sm text-gray-900 dark:text-white">{{ student.email || 'Not provided' }}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</dt>
                  <dd class="text-sm text-gray-900 dark:text-white">{{ student.phone || 'Not provided' }}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Address</dt>
                  <dd class="text-sm text-gray-900 dark:text-white">
                    {{ student.address || 'Not provided' }}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <!-- Parents Section -->
          <div v-if="student.parents && student.parents.length > 0" class="mt-8">
            <h4 class="font-medium text-gray-900 dark:text-white mb-3">Parents</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="parent in student.parents"
                :key="parent.id"
                class="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
              >
                <div class="font-medium text-gray-900 dark:text-white">
                  {{ parent.first_name }} {{ parent.last_name }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ parent.relationship }} {{ parent.is_primary ? '(Primary)' : '' }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ parent.phone || 'No phone' }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ parent.email || 'No email' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-8">
        <p class="text-gray-600 dark:text-gray-400">Student not found.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { CreditCard } from 'lucide-vue-next';
import { apiClient } from '~/utils/api';

const route = useRoute();
const studentId = route.params.id;

const student = ref(null);
const isLoading = ref(false);

const fetchStudent = async () => {
  isLoading.value = true;
  try {
    const response = await apiClient.students.getById(studentId);
    student.value = response.data;
  } catch (error) {
    console.error('Error fetching student:', error);
  } finally {
    isLoading.value = false;
  }
};

const editStudent = () => {
  // Navigate to edit page
  navigateTo(`/students/${studentId}/edit`);
};

onMounted(() => {
  fetchStudent();
});
</script> 