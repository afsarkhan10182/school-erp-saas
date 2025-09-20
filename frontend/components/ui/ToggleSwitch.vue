<template>
  <div class="toggle-switch">
    <label class="switch">
      <input
        type="checkbox"
        :checked="modelValue"
        @change="handleToggle"
        :disabled="disabled"
        class="switch-input"
      />
      <span class="slider" :class="{ disabled: disabled, checked: modelValue }"></span>
    </label>
    <span v-if="label" class="toggle-label" :class="{ disabled: disabled }">
      {{ label }}
    </span>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  label: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'toggle']);

const handleToggle = event => {
  if (!props.disabled) {
    const newValue = event.target.checked;
    emit('update:modelValue', newValue);
    emit('toggle', newValue);
  }
};
</script>

<style scoped>
.toggle-switch {
  display: flex;
  align-items: center;
  gap: 8px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 52px;
  height: 28px;
}

.switch-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #d1d5db;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 28px;
  border: 2px solid transparent;
}

.slider:before {
  position: absolute;
  content: '';
  height: 20px;
  width: 20px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.slider.checked {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.slider.checked:before {
  transform: translateX(24px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.switch-input:focus + .slider {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.switch-input:focus + .slider.checked {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.slider.disabled {
  cursor: not-allowed;
  opacity: 0.5;
  background-color: #e5e7eb;
}

.slider.disabled.checked {
  background-color: #9ca3af;
  border-color: #9ca3af;
}

.toggle-label {
  font-size: 14px;
  color: #374151;
  user-select: none;
  font-weight: 500;
}

.toggle-label.disabled {
  color: #9ca3af;
  cursor: not-allowed;
}

/* Hover effects */
.slider:hover:not(.disabled) {
  background-color: #9ca3af;
}

.slider.checked:hover:not(.disabled) {
  background-color: #2563eb;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .slider {
    background-color: #4b5563;
  }

  .slider.checked {
    background-color: #3b82f6;
  }

  .slider.disabled {
    background-color: #374151;
  }

  .slider.disabled.checked {
    background-color: #6b7280;
  }

  .toggle-label {
    color: #d1d5db;
  }

  .toggle-label.disabled {
    color: #6b7280;
  }
}

/* Animation for smooth transitions */
@keyframes toggleOn {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(24px);
  }
}

@keyframes toggleOff {
  0% {
    transform: translateX(24px);
  }
  100% {
    transform: translateX(0);
  }
}

.slider.checked:before {
  animation: toggleOn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slider:not(.checked):before {
  animation: toggleOff 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
