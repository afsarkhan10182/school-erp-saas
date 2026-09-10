<template>
  <div class="form-field">
    <label
      v-if="label"
      :for="id"
      :class="[
        'form-label',
        { 'form-label-required': required, 'form-label-disabled': disabled }
      ]"
    >
      {{ label }}
    </label>

    <div class="relative">
      <slot
        :id="id"
        :class="[
          'form-input',
          {
            'form-input-error': hasError,
            'form-input-valid': isValid
          }
        ]"
        :aria-invalid="hasError"
        :aria-describedby="hasError ? `${id}-error` : undefined"
        :disabled="disabled"
      />

      <!-- Error Icon -->
      <div
        v-if="hasError"
        class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
        aria-hidden="true"
      >
        <svg class="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
      </div>

      <!-- Success Icon -->
      <div
        v-else-if="isValid"
        class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
        aria-hidden="true"
      >
        <svg class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
    </div>

    <!-- Error Message -->
    <transition name="fade">
      <div
        v-if="hasError"
        :id="`${id}-error`"
        class="form-error flex items-start"
        role="alert"
      >
        <svg class="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
        {{ errorMessage }}
      </div>
    </transition>

    <!-- Help Text -->
    <div v-if="!hasError && helpText" class="form-hint">
      {{ helpText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  id: string;
  label?: string;
  required?: boolean;
  errorMessage?: string;
  helpText?: string;
  isValid?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  isValid: false,
  disabled: false
});

const hasError = computed(() => !!props.errorMessage);
</script>

<style scoped>
.form-field {
  @apply w-full;
}

.form-input {
  @apply w-full px-3 py-2 border rounded-md shadow-sm
         placeholder-gray-500 dark:placeholder-gray-400
         focus:outline-none
         disabled:opacity-50 disabled:cursor-not-allowed
         transition-all duration-200;
  border-color: var(--border-color);
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.form-input:focus {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 2px var(--primary-500);
  outline: none;
}

.form-input-error {
  border-color: var(--danger-500);
}

.form-input-error:focus {
  border-color: var(--danger-500);
  box-shadow: 0 0 0 2px var(--danger-500);
}

.form-input-valid {
  border-color: var(--success-500);
}

.form-input-valid:focus {
  border-color: var(--success-500);
  box-shadow: 0 0 0 2px var(--success-500);
}

.form-label-disabled {
  @apply opacity-50;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
