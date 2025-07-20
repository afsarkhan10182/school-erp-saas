<template>
  <div v-if="show" :class="toastClasses" class="fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl max-w-sm transition-all duration-300 transform">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <svg v-if="type === 'success'" class="h-5 w-5" :class="iconClasses" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <svg v-else-if="type === 'error'" class="h-5 w-5" :class="iconClasses" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <svg v-else-if="type === 'warning'" class="h-5 w-5" :class="iconClasses" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <svg v-else class="h-5 w-5" :class="iconClasses" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
      </div>
      <div class="ml-3 flex-1">
        <p class="text-sm font-medium" :class="textClasses">{{ message }}</p>
      </div>
      <div class="ml-auto pl-3">
        <button @click="hide" class="inline-flex transition-colors duration-200" :class="closeButtonClasses">
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const show = ref(false);
const message = ref('');
const type = ref('success');

// Theme-aware toast styling
const toastClasses = computed(() => {
  const baseClasses = 'border backdrop-blur-sm';
  switch (type.value) {
    case 'success':
      return `${baseClasses} bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-500/30`;
    case 'error':
      return `${baseClasses} bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/30`;
    case 'warning':
      return `${baseClasses} bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-500/30`;
    default:
      return `${baseClasses} bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-500/30`;
  }
});

// Theme-aware icon styling
const iconClasses = computed(() => {
  switch (type.value) {
    case 'success':
      return 'text-green-600 dark:text-green-400';
    case 'error':
      return 'text-red-600 dark:text-red-400';
    case 'warning':
      return 'text-yellow-600 dark:text-yellow-400';
    default:
      return 'text-blue-600 dark:text-blue-400';
  }
});

// Theme-aware text styling
const textClasses = computed(() => {
  switch (type.value) {
    case 'success':
      return 'text-green-800 dark:text-green-300';
    case 'error':
      return 'text-red-800 dark:text-red-300';
    case 'warning':
      return 'text-yellow-800 dark:text-yellow-300';
    default:
      return 'text-blue-800 dark:text-blue-300';
  }
});

// Theme-aware close button styling
const closeButtonClasses = computed(() => {
  switch (type.value) {
    case 'success':
      return 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300';
    case 'error':
      return 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300';
    case 'warning':
      return 'text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300';
    default:
      return 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300';
  }
});

let timeoutId = null;

const showToast = (msg, toastType = 'success', duration = 5000) => {
  message.value = msg;
  type.value = toastType;
  show.value = true;
  
  // Clear existing timeout
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  
  // Auto-hide after duration
  timeoutId = setTimeout(() => {
    hide();
  }, duration);
};

const hide = () => {
  show.value = false;
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
};

// Listen for custom events
const handleShowToast = (event) => {
  const { message: msg, type: toastType, duration } = event.detail;
  showToast(msg, toastType, duration);
};

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('show-toast', handleShowToast);
  }
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('show-toast', handleShowToast);
  }
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
});

// Expose methods for direct use
defineExpose({
  showToast,
  hide
});
</script>

<style scoped>
/* Animation for toast appearance */
.transform {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Hover effect for close button */
button:hover {
  transform: scale(1.1);
}
</style> 