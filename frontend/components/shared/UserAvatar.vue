<!--
  UserAvatar Component
  
  A reusable component for displaying user profile images with automatic fallback to initials.
  Handles broken/missing images gracefully by showing user initials instead.
  
  Usage Examples:
  
  Basic usage:
  <UserAvatar :user="user" size="md" />
  
  With custom image URL:
  <UserAvatar :image-url="getProfileImageUrl(user.profile_image)" :user="user" size="lg" />
  
  Custom styling:
  <UserAvatar 
    :user="user" 
    size="xl" 
    container-class="w-20 h-20"
    fallback-class="w-20 h-20 rounded-full bg-blue-500"
  />
  
  Available sizes: xs, sm, md, lg, xl, 2xl
-->
<template>
  <div :class="computedContainerClass" class="overflow-hidden">
    <img
      v-if="imageUrl && !imageError"
      :src="imageUrl"
      :alt="alt"
      :class="computedImageClass"
      @error="imageError = true"
      class="max-w-full max-h-full w-full h-full"
    />
    <div v-else :class="computedFallbackClass">
      <span :class="computedInitialsClass">
        {{ initials }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

// Props
const props = defineProps({
  // Image URL (can be from getProfileImageUrl or direct URL)
  imageUrl: {
    type: String,
    default: null
  },
  // User object with first_name, last_name, email
  user: {
    type: Object,
    default: null
  },
  // Size variants
  size: {
    type: String,
    default: 'md', // xs, sm, md, lg, xl, 2xl
    validator: value => ['xs', 'sm', 'md', 'lg', 'xl', '2xl'].includes(value)
  },
  // Custom alt text
  alt: {
    type: String,
    default: 'User Avatar'
  },
  // Custom container class
  containerClass: {
    type: String,
    default: ''
  },
  // Custom image class
  imageClass: {
    type: String,
    default: ''
  },
  // Custom fallback class
  fallbackClass: {
    type: String,
    default: ''
  },
  // Custom initials class
  initialsClass: {
    type: String,
    default: ''
  }
});

// Reactive data
const imageError = ref(false);

// Size configurations
const sizeConfig = {
  xs: {
    container: 'w-6 h-6',
    image: 'w-6 h-6 rounded-full object-cover',
    fallback:
      'w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 flex items-center justify-center shadow-sm',
    initials: 'text-xs font-semibold text-white tracking-wide'
  },
  sm: {
    container: 'w-8 h-8',
    image: 'w-8 h-8 rounded-full object-cover',
    fallback:
      'w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 flex items-center justify-center shadow-sm',
    initials: 'text-xs font-semibold text-white tracking-wide'
  },
  md: {
    container: 'w-10 h-10',
    image: 'w-10 h-10 rounded-full object-cover',
    fallback:
      'w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 flex items-center justify-center shadow-md',
    initials: 'text-sm font-semibold text-white tracking-wide'
  },
  lg: {
    container: 'w-12 h-12',
    image: 'w-12 h-12 rounded-full object-cover',
    fallback:
      'w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 flex items-center justify-center shadow-md',
    initials: 'text-sm font-semibold text-white tracking-wide'
  },
  xl: {
    container: 'w-16 h-16',
    image: 'w-16 h-16 rounded-full object-cover object-center',
    fallback:
      'w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 flex items-center justify-center shadow-lg',
    initials: 'text-lg font-semibold text-white tracking-wide'
  },
  '2xl': {
    container: 'w-24 h-24',
    image: 'w-24 h-24 rounded-full object-cover object-center',
    fallback:
      'w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 flex items-center justify-center shadow-xl',
    initials: 'text-xl font-semibold text-white tracking-wide'
  }
};

// Computed properties
const initials = computed(() => {
  if (!props.user) return 'U';

  const firstName = props.user.first_name || '';
  const lastName = props.user.last_name || '';

  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  } else if (firstName) {
    return firstName.charAt(0).toUpperCase();
  } else if (lastName) {
    return lastName.charAt(0).toUpperCase();
  } else if (props.user.email) {
    return props.user.email.charAt(0).toUpperCase();
  }

  return 'U';
});

// Computed classes
const computedContainerClass = computed(() => {
  return props.containerClass || sizeConfig[props.size].container;
});

const computedImageClass = computed(() => {
  return props.imageClass || sizeConfig[props.size].image;
});

const computedFallbackClass = computed(() => {
  return props.fallbackClass || sizeConfig[props.size].fallback;
});

const computedInitialsClass = computed(() => {
  return props.initialsClass || sizeConfig[props.size].initials;
});

// Watch for imageUrl changes to reset error state
watch(
  () => props.imageUrl,
  () => {
    imageError.value = false;
  }
);
</script>
