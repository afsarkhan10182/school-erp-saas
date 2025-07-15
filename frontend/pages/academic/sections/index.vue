<template>
  <div class="min-h-screen">
    <div class="container mx-auto py-8 px-4">
      <h1 class="text-2xl font-bold mb-4">Sections Management</h1>
      <div class="flex justify-between mb-6">
        <input
          v-model="filters.search"
          @input="fetchSections"
          class="border p-2 rounded w-full max-w-sm"
          type="text"
          placeholder="Search sections..."
        />
        <button
          @click="openCreateModal"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add New Section
        </button>
      </div>
      <section-table 
        :sections="sections" 
        @edit="editSection"
        @delete="deleteSection"
      />

      <pagination
        v-if="pagination.total > pagination.limit"
        :pagination="pagination"
        @page-changed="fetchSections"
      />

      <modal v-if="showModal" @close="closeModal">
        <template #header>
          <h3 class="text-lg font-semibold">{{ isEditing ? 'Edit Section' : 'Create Section' }}</h3>
        </template>
        <template #body>
          <form @submit.prevent="isEditing ? updateSection() : createSection()">
            <!-- Validation Errors Display -->
            <div v-if="validationErrors && Object.keys(validationErrors).length > 0" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <h4 class="text-red-800 text-sm font-medium mb-2">Please fix the following errors:</h4>
              <ul class="text-red-700 text-sm list-disc list-inside space-y-1">
                <li v-for="(error, field) in validationErrors" :key="field">
                  <span class="font-medium">{{ getFieldLabel(field) }}:</span> {{ error }}
                </li>
              </ul>
            </div>

            <!-- School Selector for Super Admin -->
            <div v-if="authStore.user?.role === 'super_admin' && !isEditing" class="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 class="text-sm font-medium text-blue-900 mb-3">📍 Select School Context</h4>
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">School *</label>
                  <select
                    v-model="selectedSchoolId"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    :class="{'border-red-500': validationErrors?.school_id}"
                    @change="onSchoolChange"
                  >
                    <option value="">Select a school first</option>
                    <option v-for="school in availableSchools" :key="school.id" :value="school.id">
                      {{ school.name }} {{ school.code ? `(${school.code})` : '' }}
                    </option>
                  </select>
                </div>
                <div v-if="selectedSchoolId && availableBranches.length > 1">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Branch (Optional)</label>
                  <select
                    v-model="selectedBranchId"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    @change="onBranchChange"
                  >
                    <option value="">All branches</option>
                    <option v-for="branch in availableBranches" :key="branch.id" :value="branch.id">
                      {{ branch.name }} {{ branch.code ? `(${branch.code})` : '' }}
                    </option>
                  </select>
                </div>
                <div v-if="!selectedSchoolId" class="text-xs text-blue-600">
                  ⚠️ Please select a school before creating the section
                </div>
              </div>
            </div>

            <!-- Class Selection -->
            <div class="mb-4">
              <label class="block text-gray-700 text-sm mb-2" for="class">Class *</label>
              <select
                id="class"
                v-model="form.class_id"
                class="border p-2 rounded w-full"
                :class="{'border-red-500': validationErrors?.class_id}"
                required
                :disabled="authStore.user?.role === 'super_admin' && !selectedSchoolId"
              >
                <option value="">{{ authStore.user?.role === 'super_admin' && !selectedSchoolId ? 'Select school first' : 'Select a class' }}</option>
                <option v-for="classItem in activeClasses" :key="classItem.id" :value="classItem.id">
                  {{ classItem.name }} {{ classItem.code ? `(${classItem.code})` : '' }}
                </option>
              </select>
            </div>

            <!-- Section Name -->
            <div class="mb-4">
              <label class="block text-gray-700 text-sm mb-2" for="name">Section Name *</label>
              <input
                id="name"
                v-model="form.name"
                class="border p-2 rounded w-full"
                :class="{'border-red-500': validationErrors?.name}"
                type="text"
                required
                maxlength="10"
                placeholder="e.g., A, B, Alpha, etc."
                @blur="validateSectionName"
              />
              <p v-if="validationErrors?.name" class="text-red-500 text-xs mt-1">{{ validationErrors.name }}</p>
            </div>

            <!-- Capacity -->
            <div class="mb-4">
              <label class="block text-gray-700 text-sm mb-2" for="capacity">Capacity *</label>
              <input
                id="capacity"
                v-model.number="form.capacity"
                class="border p-2 rounded w-full"
                :class="{'border-red-500': validationErrors?.capacity}"
                type="number"
                min="1"
                max="200"
                required
                @blur="validateCapacity"
              />
              <p v-if="validationErrors?.capacity" class="text-red-500 text-xs mt-1">{{ validationErrors.capacity }}</p>
            </div>

            <!-- Active Status -->
            <div class="mb-4" v-if="isEditing">
              <label class="flex items-center">
                <input
                  v-model="form.is_active"
                  type="checkbox"
                  class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                <span class="ml-2 text-sm text-gray-700">Active</span>
              </label>
            </div>
          </form>
        </template>
        <template #footer>
          <button
            @click="closeModal"
            class="px-4 py-2 bg-gray-300 text-gray-900 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            @click="isEditing ? updateSection() : createSection()"
            :disabled="submitting"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {{ submitting ? 'Saving...' : (isEditing ? 'Update' : 'Create') }} Section
          </button>
        </template>
      </modal>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { fetchSectionsAPI, createSectionAPI, updateSectionAPI, deleteSectionAPI, getSectionByIdAPI } from '~/api/sections';
import SectionTable from '~/components/SectionTable.vue';
import Pagination from '~/components/Pagination.vue';
import Modal from '~/components/Modal.vue';
import { useAuthStore } from '~/stores/auth';
import { useBranchContext } from '~/composables/useBranchContext';
import { useAcademics } from '~/composables/useAcademics';
import { useToast } from '~/composables/useToast';
import { apiClient } from '~/utils/api';

const sections = ref([]);
const pagination = reactive({ page: 1, limit: 10, total: 0 });
const filters = reactive({ search: '' });
const showModal = ref(false);
const isEditing = ref(false);
const editingId = ref(null);
const submitting = ref(false);
const validationErrors = ref({});

const authStore = useAuthStore();
const { getBranchContext } = useBranchContext();
const { fetchClasses, activeClasses, loading: academicsLoading } = useAcademics();
const { showSuccess, showError } = useToast();

// School/Branch selection for super admin
const selectedSchoolId = ref('');
const selectedBranchId = ref('');
const availableSchools = ref([]);
const availableBranches = ref([]);

const form = reactive({
  name: '',
  capacity: 30,
  class_id: '',
  is_active: true,
});

const openCreateModal = () => {
  resetForm();
  isEditing.value = false;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  validationErrors.value = {};
};

const resetForm = () => {
  form.name = '';
  form.capacity = 30;
  form.class_id = '';
  form.is_active = true;
  selectedSchoolId.value = '';
  selectedBranchId.value = '';
  validationErrors.value = {};
};

// Field label mapping for better error display
const getFieldLabel = (field) => {
  const labels = {
    name: 'Section Name',
    capacity: 'Capacity',
    class_id: 'Class',
    school_id: 'School',
    branch_id: 'Branch'
  };
  return labels[field] || field;
};

// Frontend validation functions
const validateSectionName = () => {
  if (!form.name || form.name.trim() === '') {
    validationErrors.value.name = 'Section name is required';
    return false;
  }
  if (form.name.length > 10) {
    validationErrors.value.name = 'Section name must be 10 characters or less';
    return false;
  }
  if (!/^[A-Za-z0-9\s\-]+$/.test(form.name)) {
    validationErrors.value.name = 'Section name can only contain letters, numbers, spaces, and hyphens';
    return false;
  }
  delete validationErrors.value.name;
  return true;
};

const validateCapacity = () => {
  const capacity = Number(form.capacity);
  if (!capacity || capacity < 1 || capacity > 200) {
    validationErrors.value.capacity = 'Capacity must be between 1 and 200';
    return false;
  }
  delete validationErrors.value.capacity;
  return true;
};

const validateForm = () => {
  const isNameValid = validateSectionName();
  const isCapacityValid = validateCapacity();
  const isClassValid = !!form.class_id;
  
  if (!isClassValid) {
    validationErrors.value.class_id = 'Please select a class';
  } else {
    delete validationErrors.value.class_id;
  }
  
  return isNameValid && isCapacityValid && isClassValid;
};

// Fetch schools for super admin
const fetchSchools = async () => {
  if (authStore.user?.role !== 'super_admin') return;
  
  try {
    const response = await apiClient.schools.getAll();
    availableSchools.value = response.data?.schools || [];
  } catch (error) {
    console.error('Error fetching schools:', error);
    availableSchools.value = [];
    showError('Failed to fetch schools');
  }
};

// Fetch branches when school is selected
const fetchBranchesForSchool = async (schoolId) => {
  if (!schoolId) {
    availableBranches.value = [];
    return;
  }
  
  try {
    const response = await apiClient.branches.getAll(schoolId);
    availableBranches.value = response.data?.branches || [];
  } catch (error) {
    console.error('Error fetching branches:', error);
    availableBranches.value = [];
    showError('Failed to fetch branches');
  }
};

// Handle school selection change  
const onSchoolChange = async () => {
  selectedBranchId.value = '';
  form.class_id = '';
  if (selectedSchoolId.value) {
    await fetchBranchesForSchool(selectedSchoolId.value);
    await fetchClassesForSchool();
  } else {
    availableBranches.value = [];
  }
};

// Handle branch selection change
const onBranchChange = async () => {
  form.class_id = '';
  await fetchClassesForSchool();
};

// Fetch classes for the selected school/branch
const fetchClassesForSchool = async () => {
  if (!selectedSchoolId.value) return;
  
  try {
    await fetchClasses(selectedSchoolId.value, selectedBranchId.value || undefined);
  } catch (error) {
    console.error('Error fetching classes:', error);
    showError('Failed to fetch classes');
  }
};

const fetchSections = async () => {
  try {
    const response = await fetchSectionsAPI(filters, pagination);
    sections.value = response.data;
    pagination.total = response.pagination.total;
  } catch (error) {
    console.error('Error fetching sections:', error);
    showError('Failed to fetch sections');
  }
};

const createSection = async () => {
  if (!validateForm()) {
    showError('Please fix validation errors before submitting');
    return;
  }

  submitting.value = true;
  try {
    const payload = { ...form };
    
    // Add school_id for super admin when creating a new section
    if (authStore.user?.role === 'super_admin') {
      if (!selectedSchoolId.value) {
        showError('Please select a school first to create the section');
        return;
      }
      
      if (!form.class_id) {
        showError('Please select a class for the section');
        return;
      }
      
      payload.school_id = selectedSchoolId.value;
      
      // Add branch_id if selected
      if (selectedBranchId.value) {
        payload.branch_id = selectedBranchId.value;
      }
    }
    
    await createSectionAPI(payload);
    closeModal();
    fetchSections();
    showSuccess('Section created successfully');
  } catch (error) {
    console.error('Error creating section:', error);
    if (error.response?.data?.errors) {
      validationErrors.value = error.response.data.errors;
    } else {
      showError(error.response?.data?.message || 'Error creating section');
    }
  } finally {
    submitting.value = false;
  }
};

const editSection = async (section) => {
  try {
    // Fetch full section details
    const response = await getSectionByIdAPI(section.id);
    const sectionData = response.data;
    
    // Populate form with section data
    form.name = sectionData.name;
    form.capacity = sectionData.capacity;
    form.class_id = sectionData.class_id;
    form.is_active = sectionData.is_active;
    
    isEditing.value = true;
    editingId.value = section.id;
    showModal.value = true;
    validationErrors.value = {};
  } catch (error) {
    console.error('Error fetching section details:', error);
    showError('Failed to load section details');
  }
};

const updateSection = async () => {
  if (!validateForm()) {
    showError('Please fix validation errors before submitting');
    return;
  }

  submitting.value = true;
  try {
    await updateSectionAPI(editingId.value, form);
    closeModal();
    fetchSections();
    showSuccess('Section updated successfully');
  } catch (error) {
    console.error('Error updating section:', error);
    if (error.response?.data?.errors) {
      validationErrors.value = error.response.data.errors;
    } else {
      showError(error.response?.data?.message || 'Error updating section');
    }
  } finally {
    submitting.value = false;
  }
};

const deleteSection = async (section) => {
  if (!confirm(`Are you sure you want to delete section "${section.name}"?`)) {
    return;
  }

  try {
    await deleteSectionAPI(section.id);
    fetchSections();
    showSuccess('Section deleted successfully');
  } catch (error) {
    console.error('Error deleting section:', error);
    showError(error.response?.data?.message || 'Error deleting section');
  }
};

onMounted(() => {
  fetchSections();
  
  // Fetch schools for super admin
  if (authStore.user?.role === 'super_admin') {
    fetchSchools();
  }
  
  // Fetch classes for current user context
  if (authStore.user?.role !== 'super_admin') {
    fetchClasses();
  }
});
</script>

<style scoped>
.container {
  max-width: 1024px;
}
</style>

