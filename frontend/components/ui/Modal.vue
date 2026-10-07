<template>
  <Transition name="modal">
    <div
      v-if="show"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="labelledBy"
      @click="handleOverlayClick"
      @keydown.escape="$emit('close')"
    >
      <div class="modal-content" ref="modalRef" :class="[sizeClasses, 'slide-in']" @click.stop>
        <!-- Close button -->
        <button
          @click="$emit('close')"
          class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close dialog"
        >
          <X class="w-5 h-5" />
        </button>

        <!-- Header -->
        <div v-if="$slots.header" class="modal-header" :id="labelledBy">
          <slot name="header"></slot>
        </div>

        <!-- Body -->
        <div class="modal-body" ref="bodyRef">
          <slot name="body"></slot>
        </div>

        <!-- Footer -->
        <div v-if="$slots.footer" class="modal-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue';
import { X } from 'lucide-vue-next';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'md',
    validator: value =>
      ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl'].includes(value)
  },
  labelledBy: {
    type: String,
    default: 'modal-title'
  }
});

const emit = defineEmits(['close']);

const modalRef = ref(null);
const bodyRef = ref(null);
const previousFocusEl = ref(null);

// Size classes map
const sizeClasses = computed(() => {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl'
  };
  return sizes[props.size] || sizes.md;
});

// Focus trap — keep Tab within modal
const handleFocusTrap = e => {
  if (!modalRef.value) return;
  const focusable = modalRef.value.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.key === 'Tab') {
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
};

// Lock body scroll when modal opens
watch(
  () => props.show,
  visible => {
    if (typeof window === 'undefined') return;

    if (visible) {
      previousFocusEl.value = document.activeElement;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleFocusTrap);
      nextTick(() => {
        // Focus first focusable element or modal itself
        const firstFocusable = modalRef.value?.querySelector(
          'button, [href], input, select, textarea'
        );
        firstFocusable ? firstFocusable.focus() : modalRef.value?.focus();
      });
    } else {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleFocusTrap);
      // Restore focus to element that opened the modal
      if (previousFocusEl.value) {
        previousFocusEl.value.focus();
      }
    }
  }
);

// Clean up on unmount
onBeforeUnmount(() => {
  if (typeof window === 'undefined') return;
  document.body.style.overflow = '';
  document.removeEventListener('keydown', handleFocusTrap);
});

const handleOverlayClick = () => {
  emit('close');
};
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4;
}

.modal-content {
  @apply bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto relative;
}

.modal-header {
  @apply px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between;
}

.modal-body {
  @apply p-6;
}

.modal-footer {
  @apply px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3;
}

/* Transition animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.2s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95) translateY(10px);
}
</style>
