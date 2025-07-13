<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Students</h1>
          <p class="mt-2 text-sm text-gray-700">Manage student admissions and records</p>
        </div>
        <div class="mt-4 sm:mt-0 sm:flex sm:space-x-3">
          <button
            @click="navigateTo('/students/create')"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon class="-ml-1 mr-2 h-5 w-5" />
            Add Student
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="mt-8 bg-white rounded-lg shadow px-6 py-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label for="academic-year" class="block text-sm font-medium text-gray-700">Academic Year</label>
            <select
              id="academic-year"
              v-model="filters.academic_year"
              @change="fetchStudents"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All Years</option>
              <option value="2024-25">2024-25</option>
              <option value="2023-24">2023-24</option>
            </select>
          </div>
          <div>
            <label for="class" class="block text-sm font-medium text-gray-700">Class</label>
            <select
              id="class"
              v-model="filters.class"
              @change="fetchStudents"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All Classes</option>
              <option value="1st">1st</option>
              <option value="2nd">2nd</option>
              <option value="3rd">3rd</option>
              <option value="4th">4th</option>
              <option value="5th">5th</option>
            </select>
          </div>
          <div>
            <label for="section" class="block text-sm font-medium text-gray-700">Section</label>
            <select
              id="section"
              v-model="filters.section"
              @change="fetchStudents"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All Sections</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </div>
          <div>
            <label for="search" class="block text-sm font-medium text-gray-700">Search</label>
            <input
              id="search"
              v-model="searchQuery"
              @input="debouncedSearch"
              type="text"
              placeholder="Search students..."
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <UsersIcon class="h-8 w-8 text-blue-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Total Students</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.total || 0 }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <CheckCircleIcon class="h-8 w-8 text-green-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Active Students</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.active || 0 }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <UserPlusIcon class="h-8 w-8 text-indigo-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">New This Month</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.newThisMonth || 0 }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <AcademicCapIcon class="h-8 w-8 text-purple-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Classes</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.classCount || 0 }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Students Table -->
      <div class="mt-8 bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-medium text-gray-900">Student List</h2>
        </div>
        
        <div v-if="isLoading" class="p-8 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p class="mt-2 text-sm text-gray-600">Loading students...</p>
        </div>
        
        <div v-else-if="students.length === 0" class="p-8 text-center">
          <UsersIcon class="mx-auto h-12 w-12 text-gray-400" />
          <p class="mt-2 text-sm text-gray-600">No students found.</p>
          <button
            @click="navigateTo('/students/create')"
            class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Add First Student
          </button>
        </div>
        
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admission No.
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class & Section
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parents
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="student in students" :key="student.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <img
                        v-if="student.photo"
                        :src="student.photo"
                        :alt="student.first_name"
                        class="h-10 w-10 rounded-full"
                      />
                      <div
                        v-else
                        class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center"
                      >
                        <span class="text-sm font-medium text-gray-700">
                          {{ student.first_name.charAt(0) }}{{ student.last_name.charAt(0) }}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        {{ student.first_name }} {{ student.last_name }}
                      </div>
                      <div class="text-sm text-gray-500">
                        {{ student.email || 'No email' }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ student.admission_number }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ student.current_class }}{{ student.section ? '-' + student.section : '' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="{
                      'bg-green-100 text-green-800': student.status === 'active',
                      'bg-red-100 text-red-800': student.status === 'inactive',
                      'bg-yellow-100 text-yellow-800': student.status === 'transferred',
                      'bg-blue-100 text-blue-800': student.status === 'graduated'
                    }"
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  >
                    {{ student.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div v-if="student.parents && student.parents.length > 0">
                    <div class="text-sm font-medium">{{ student.parents[0].primary_contact }}</div>
                    <div class="text-sm text-gray-500">{{ student.parents[0].primary_phone }}</div>
                  </div>
                  <div v-else class="text-sm text-gray-500">No parent info</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex space-x-2">
                    <button
                      @click="viewStudent(student.id)"
                      class="text-indigo-600 hover:text-indigo-900"
                    >
                      View
                    </button>
                    <button
                      @click="editStudent(student.id)"
                      class="text-green-600 hover:text-green-900"
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { apiClient } from '~/utils/api';
import {
  PlusIcon,
  UsersIcon,
  CheckCircleIcon,
  UserPlusIcon,
  AcademicCapIcon,
} from 'lucide-vue-next';

const students = ref([]);
const isLoading = ref(false);
const searchQuery = ref('');
const stats = ref({});

const filters = reactive({
  academic_year: '',
  class: '',
  section: '',
});

const fetchStudents = async () => {
  isLoading.value = true;
  try {
    const params = {
      ...filters,
      ...(searchQuery.value && { search: searchQuery.value }),
    };
    const response = await apiClient.students.getAll(params);
    students.value = response.data;
  } catch (error) {
    console.error('Error fetching students:', error);
  } finally {
    isLoading.value = false;
  }
};

const fetchStats = async () => {
  try {
    const response = await apiClient.students.getStats();
    stats.value = response.data;
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
};

const viewStudent = (id) => {
  navigateTo(`/students/${id}`);
};

const editStudent = (id) => {
  navigateTo(`/students/${id}/edit`);
};

let debounceTimer;
const debouncedSearch = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    fetchStudents();
  }, 300);
};

onMounted(() => {
  fetchStudents();
  fetchStats();
});
</script>

