<template>
  <StudentRegistrationForm :mode="mode" :student-id="studentId" />
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import StudentRegistrationForm from '~/components/forms/StudentRegistrationForm.vue';

const route = useRoute();

// Determine mode and student ID from route
const mode = computed(() => {
  // If we have an ID in the route, it's edit mode
  return route.params.id ? 'edit' : 'create';
});

const studentId = computed(() => route.params.id || null);

// Set page meta based on mode
const pageTitle = computed(() => (mode.value === 'edit' ? 'Edit Student' : 'Create Student'));

definePageMeta({
  // Global auth middleware handles authentication
  title: pageTitle
});
</script>
