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
      <section-table :sections="sections" />

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
            <div class="mb-4">
              <label class="block text-gray-700 text-sm mb-2" for="name">Section Name</label>
              <input
                id="name"
                v-model="form.name"
                class="border p-2 rounded w-full"
                type="text"
                required
              />
            </div>
            <div class="mb-4">
              <label class="block text-gray-700 text-sm mb-2" for="capacity">Capacity</label>
              <input
                id="capacity"
                v-model="form.capacity"
                class="border p-2 rounded w-full"
                type="number"
                min="1"
                required
              />
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
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {{ isEditing ? 'Update' : 'Create' }} Section
          </button>
        </template>
      </modal>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { fetchSectionsAPI, createSectionAPI, updateSectionAPI } from '@/api/sections';
import SectionTable from '@/components/SectionTable.vue';
import Pagination from '@/components/Pagination.vue';
import Modal from '@/components/Modal.vue';

const sections = ref([]);
const pagination = reactive({ page: 1, limit: 10, total: 0 });
const filters = reactive({ search: '' });
const showModal = ref(false);
const isEditing = ref(false);
const editingId = ref(null);

const form = reactive({
  name: '',
  capacity: 1,
});

const openCreateModal = () => {
  resetForm();
  isEditing.value = false;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const resetForm = () => {
  form.name = '';
  form.capacity = 1;
};

const fetchSections = async () => {
  try {
    const response = await fetchSectionsAPI(filters, pagination);
    sections.value = response.data;
    pagination.total = response.pagination.total;
  } catch (error) {
    console.error('Error fetching sections:', error);
  }
};

const createSection = async () => {
  try {
    await createSectionAPI(form);
    closeModal();
    fetchSections();
  } catch (error) {
    console.error('Error creating section:', error);
  }
};

const updateSection = async () => {
  try {
    await updateSectionAPI(editingId.value, form);
    closeModal();
    fetchSections();
  } catch (error) {
    console.error('Error updating section:', error);
  }
};

onMounted(() => {
  fetchSections();
});
</script>

<style scoped>
.container {
  max-width: 1024px;
}
</style>

