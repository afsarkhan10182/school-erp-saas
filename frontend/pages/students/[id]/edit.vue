<template>
  <div>
    <StudentForm 
      :is-editing="true"
      :student-id="studentId"
      :initial-data="studentData"
      :redirect-to="'/students'"
      :is-admission="false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Students } from '~/api';
import { useToast } from '~/composables/useToast';

const route = useRoute();
const { showError } = useToast();

const studentId = computed(() => route.params.id);
const studentData = ref({});
const loading = ref(false);

// Fetch student data for editing
const fetchStudentData = async () => {
  if (!studentId.value) return;
  
  loading.value = true;
  try {
    const response = await Students.getById(studentId.value);
    if (response.success) {
      studentData.value = response.data;
      
      // Ensure the data is properly structured for the form
      if (studentData.value) {
        // Map academic year properly
        if (studentData.value.academic_year && typeof studentData.value.academic_year === 'string') {
          // If academic_year is a string, we need to find the corresponding academic year ID
          // This will be handled by the StudentForm component
        }
        
        // Map class and section properly
        if (studentData.value.current_class && typeof studentData.value.current_class === 'string') {
          // The class name/code will be mapped to class_id in the form
        }
        
        if (studentData.value.section && typeof studentData.value.section === 'string') {
          // The section name will be mapped to section_id in the form
        }
      }
    } else {
      console.error('🔍 API returned error:', response);
      showError('Failed to load student data');
    }
  } catch (error) {
    console.error('Error fetching student data:', error);
    showError('Failed to load student data');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchStudentData();
});

// Watch for changes in studentData
watch(studentData, (newData) => {
  // Handle data changes if needed
}, { deep: true });

definePageMeta({
  // Global auth middleware handles authentication
  title: 'Edit Student',
});
</script> 