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
      <span class="slider" :class="{ 'disabled': disabled }"></span>
    </label>
    <span v-if="label" class="toggle-label" :class="{ 'disabled': disabled }">
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
})

const emit = defineEmits(['update:modelValue'])

const handleToggle = (event) => {
  if (!props.disabled) {
    emit('update:modelValue', event.target.checked)
  }
}
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
  width: 50px;
  height: 24px;
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
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.switch-input:checked + .slider {
  background-color: #4f46e5;
}

.switch-input:focus + .slider {
  box-shadow: 0 0 1px #4f46e5;
}

.switch-input:checked + .slider:before {
  transform: translateX(26px);
}

.slider.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.toggle-label {
  font-size: 14px;
  color: #374151;
  user-select: none;
}

.toggle-label.disabled {
  color: #9ca3af;
  cursor: not-allowed;
}

/* Hover effects */
.slider:hover:not(.disabled) {
  background-color: #d1d5db;
}

.switch-input:checked + .slider:hover:not(.disabled) {
  background-color: #3730a3;
}
</style>
