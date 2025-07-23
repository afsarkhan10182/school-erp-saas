<template>
  <div class="min-h-screen">
    <div class="container mx-auto py-8 px-4">
      <h1 class="text-2xl font-bold mb-4">Collections Management</h1>
      <div class="flex justify-between mb-6">
        <input
          v-model="filters.search"
          @input="fetchCollections"
          class="border p-2 rounded w-full max-w-sm"
          type="text"
          placeholder="Search collections..."
        />
        <button
          @click="refreshCollections"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
      <collection-table 
        :collections="collections" 
        @view="handleViewCollection"
        @print="handlePrintCollection"
      />

      <pagination
        v-if="pagination.total > pagination.limit"
        :pagination="pagination"
        @page-changed="fetchCollections"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { fetchCollectionsAPI } from '~/api/collections';
import CollectionTable from '~/components/CollectionTable.vue';
import Pagination from '~/components/Pagination.vue';
import { useToast } from '~/composables/useToast';

const router = useRouter();
const { showError, showInfo } = useToast();
const collections = ref([]);
const pagination = reactive({ page: 1, limit: 10, total: 0 });
const filters = reactive({ search: '' });

const fetchCollections = async () => {
  try {
    const response = await fetchCollectionsAPI(filters, pagination);
    collections.value = response.data;
    pagination.total = response.pagination.total;
  } catch (error) {
    console.error('Error fetching collections:', error);
    if (error.response && error.response.data && error.response.data.message) {
      showError(error.response.data.message);
    } else {
      showError('Error fetching collections. Please try again.');
    }
  }
};

const refreshCollections = () => {
  fetchCollections();
};

const handleViewCollection = (collection) => {
  // Navigate to student fee ledger if student ID is available
  if (collection.student?.id) {
    router.push(`/students/${collection.student.id}/fee-ledger`);
  } else {
    // Show error message if student ID is not available
    showError('Student information not available for this collection.');
  }
};

const handlePrintCollection = (collection) => {
  // Handle print functionality
  console.log('Printing collection:', collection);
  showInfo(`Printing receipt for collection ${collection.receipt_number}`);
};

onMounted(() => {
  fetchCollections();
});
</script>

<style scoped>
.container {
  max-width: 1024px;
}
</style>

