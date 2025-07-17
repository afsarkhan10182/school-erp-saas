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
import { apiClient } from '~/utils/api';
import { useToast } from '~/composables/useToast';

const route = useRoute();
const { showError } = useToast();

const studentId = computed(() => route.params.id);
const studentData = ref({});
const loading = ref(false);

// Fetch student data for editing
const fetchStudentData = async () => {
  if (!studentId.value) return;
  
  console.log('🔍 Fetching student data for ID:', studentId.value);
  loading.value = true;
  try {
    const response = await apiClient.students.getById(studentId.value);
    console.log('🔍 API Response:', response);
    if (response.success) {
      studentData.value = response.data;
      console.log('🔍 Set studentData to:', studentData.value);
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
  console.log('🔍 studentData changed in edit page:', newData);
}, { deep: true });

definePageMeta({
  middleware: 'auth',
  title: 'Edit Student',
});
</script> 