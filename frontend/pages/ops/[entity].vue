<template>
  <SchoolCrudPage v-if="entityKey" :entity-key="entityKey" />
  <div v-else class="p-8 text-sm text-gray-500">Unknown screen.</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import SchoolCrudPage from '~/components/school/SchoolCrudPage.vue';
import { SCHOOL_OPS_ENTITIES } from '~/config/school-ops';

const route = useRoute();
const entityKey = computed(() => {
  const key = String(route.params.entity || '');
  return SCHOOL_OPS_ENTITIES[key] ? key : '';
});
</script>
