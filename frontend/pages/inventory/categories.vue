<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { InventoryCategories } from '~/api/inventory';

const { selectedBranchId } = useGlobalBranch();
const data = ref([]);
const loading = ref(false);

const fetchData = async () => {
  if (!selectedBranchId.value) return;
  loading.value = true;
  try {
    const res = await InventoryCategories.getAll({ branch_id: selectedBranchId.value });
    data.value = res.data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);
watch(selectedBranchId, fetchData);
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">Inventory Categories</h1>
    <div v-if="loading">Loading...</div>
    <div v-else>
      <ul class="list-disc pl-5">
        <li v-for="item in data" :key="item.id">{{ item.name }}</li>
      </ul>
      <p v-if="!data.length">No categories found for this branch.</p>
    </div>
  </div>
</template>
