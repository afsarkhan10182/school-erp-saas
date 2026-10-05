<template>
  <Modal :show="show" size="sm" @close="$emit('close')">
    <template #header>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ title }}</h2>
    </template>
    <template #body>
      <p class="text-sm text-gray-600 dark:text-gray-300">{{ message }}</p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <button class="btn-secondary" type="button" @click="$emit('close')">Cancel</button>
        <button
          :class="danger ? 'btn-danger' : 'btn-primary'"
          type="button"
          @click="$emit('confirm')"
        >
          {{ confirmLabel }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import Modal from '~/components/ui/Modal.vue';

withDefaults(
  defineProps<{
    show: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    danger?: boolean;
  }>(),
  { confirmLabel: 'Confirm', danger: true }
);

defineEmits(['close', 'confirm']);
</script>
