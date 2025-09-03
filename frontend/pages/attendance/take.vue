<template>
  <div class="p-4 space-y-4">
    <h2 class="text-xl font-semibold">Take Attendance</h2>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <input v-model="form.date" type="date" class="border px-2 py-1 rounded bg-white text-gray-900" />
      <EnhancedDropdown :options="classOptions" v-model="form.class_id" placeholder="Class" />
      <EnhancedDropdown :options="sectionOptions" v-model="form.section_id" placeholder="Section" />
      <EnhancedDropdown :options="typeOptions" v-model="form.attendance_type" placeholder="Type" />
      <input v-if="form.attendance_type==='period'" v-model.number="form.period_number" type="number" min="1" max="10" class="border px-2 py-1 rounded bg-white text-gray-900 placeholder-gray-500" placeholder="Period" />
      <input v-model="form.academic_year" type="text" class="border px-2 py-1 rounded bg-white text-gray-900 placeholder-gray-500" placeholder="Academic Year (e.g., 2025-2026)" />
    </div>

    <div class="flex gap-2">
      <button class="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed" @click.prevent="createOrGetSession" :disabled="loading">
        {{ loading ? 'Loading...' : 'Create/Load Session' }}
      </button>
      <button class="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed" @click.prevent="save(true)" :disabled="!hasValidSession || saving || loading">
        {{ saving && hasValidSession ? 'Publishing...' : 'Save & Publish' }}
      </button>
      <button class="bg-gray-700 text-white px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed" @click.prevent="save(false)" :disabled="!hasValidSession || saving || loading">
        {{ saving && !loading ? 'Saving...' : 'Save Draft' }}
      </button>
    </div>


    <div v-if="students.length" class="overflow-x-auto">
      <table class="min-w-full border">
        <thead>
          <tr class="bg-gray-100">
            <th class="p-2 border">Admission</th>
            <th class="p-2 border">Name</th>
            <th class="p-2 border">Status</th>
            <th class="p-2 border">Remarks</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in students" :key="s.id">
            <td class="p-2 border">{{ s.admission_number }}</td>
            <td class="p-2 border">{{ s.first_name }} {{ s.last_name || '' }}</td>
            <td class="p-2 border">
              <select v-model="recordByStudent[s.id].status" class="border px-2 py-1 rounded bg-white text-gray-900">
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="excused">Excused</option>
              </select>
            </td>
            <td class="p-2 border">
              <input v-model="recordByStudent[s.id].remarks" type="text" class="border px-2 py-1 rounded w-full bg-white text-gray-900 placeholder-gray-500" placeholder="Add remarks..." />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else-if="!hasValidSession && students.length === 0" class="border rounded p-6 bg-gray-50 text-gray-600">
      <div class="font-medium mb-2">No students loaded</div>
      <p>Select Date, Class and Section, then click "Create/Load Session".</p>
    </div>
    <div v-else-if="students.length > 0 && !hasValidSession" class="border rounded p-6 bg-yellow-50 text-yellow-700">
      <div class="font-medium mb-2">⚠️ Session not created</div>
      <p>Students loaded, but you need to click "Create/Load Session" to enable Save buttons.</p>
    </div>
    <div v-else class="border rounded p-6 bg-gray-50 text-gray-600">
      <div class="font-medium mb-2">No students found</div>
      <p>No students found for the selected class/section.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue';
import { useToast } from '~/composables/useToast';
import { Classes, Sections, Students, Attendance } from '~/api';
import { useAuthStore } from '~/stores/auth';

const auth = useAuthStore();
const loading = ref(false);
const saving = ref(false);
const session = ref<any>(null);

// Computed property to check if we have a valid session
const hasValidSession = computed(() => {
  return !!(session.value && session.value.id);
});

const form = reactive<{ date: string; attendance_type: 'daily'|'period'; period_number: number|null; academic_year?: string; class_id?: string; section_id?: string|null }>({
  date: new Date().toISOString().slice(0,10),
  attendance_type: 'daily',
  period_number: null,
  academic_year: undefined,
  class_id: undefined,
  section_id: undefined,
});

const typeOptions = [
  { label: 'Daily', value: 'daily' },
  { label: 'Period', value: 'period' },
];
const classOptions = ref<any[]>([]);
const sectionOptions = ref<any[]>([]);
const students = ref<any[]>([]);
const recordByStudent = reactive<Record<string, { status: 'present'|'absent'|'late'|'excused'; remarks?: string }>>({});

const { showToast } = useToast();

const loadDropdowns = async () => {
  try {
    const classes = await Classes.getAll({ page: 1, limit: 100, is_active: 'true' });
    classOptions.value = (classes.data?.rows || classes.data || []).map((c: any) => ({ label: c.name, value: c.id }));
    
    const sections = await Sections.getAll({ page: 1, limit: 100, is_active: 'true' });
    sectionOptions.value = (sections.data?.rows || sections.data || []).map((s: any) => ({ label: s.name, value: s.id }));
  } catch (error: any) {
    console.error('Error loading dropdowns:', error);
    showToast('Failed to load classes and sections', 'error');
  }
};

const loadStudents = async () => {
  if (!form.class_id) return;
  try {
    const res = await Students.getAll({ page: 1, limit: 1000, class_id: form.class_id, section_id: form.section_id as any });
    const rows = (res as any).data?.rows || (res as any).data || [];
    students.value = rows;
    
    // Clear existing records and initialize for all students
    Object.keys(recordByStudent).forEach(key => delete recordByStudent[key]);
    rows.forEach((s: any) => {
      recordByStudent[s.id] = { status: 'present', remarks: '' };
    });
    
    // Auto-create session if we have date and students
    if (form.date && rows.length > 0 && !session.value) {
      await createOrGetSession();
    }
  } catch (error: any) {
    console.error('Error loading students:', error);
    showToast('Failed to load students', 'error');
  }
};

watch(() => [form.class_id, form.section_id], loadStudents);

const createOrGetSession = async () => {
  if (!form.date || !form.class_id) {
    showToast('Please select date and class first', 'error');
    return;
  }
  
  loading.value = true;
  
  try {
    // Ensure context
    // @ts-ignore
    if (!auth.currentSchool?.id || !auth.currentBranch?.id) {
      showToast('Select a school/branch to proceed', 'error');
      return;
    }
    
    const res = await Attendance.upsertSession({
      date: form.date,
      attendance_type: form.attendance_type,
      period_number: form.attendance_type === 'period' ? form.period_number || 1 : null,
      academic_year: form.academic_year || undefined,
      class_id: form.class_id!,
      section_id: form.section_id || null,
      // Pass context explicitly for super_admin or when token lacks branch
      // Backend setSchoolContext/setBranchContext will pick these
      // @ts-ignore
      school_id: auth.currentSchool?.id,
      // @ts-ignore
      branch_id: auth.currentBranch?.id,
    } as any);
    
    // Handle different response structures and ensure reactivity
    let sessionData = null;
    if (res && res.success && res.data) {
      sessionData = res.data;
    } else if (res && res.data) {
      sessionData = res.data;
    } else if (res) {
      sessionData = res;
    } else {
      throw new Error('Invalid response from server');
    }
    
    // Ensure the session has an ID
    if (!sessionData || !sessionData.id) {
      console.error('Session data missing ID:', sessionData);
      throw new Error('Session created but missing ID');
    }
    
    // Force reactivity update
    session.value = null;
    await nextTick();
    session.value = sessionData;
    
    await loadStudents();
    
    if (students.value.length === 0) {
      showToast('Session created but no students found for this class/section', 'warning');
    } else {
      showToast(`Session ready with ${students.value.length} students`, 'success');
    }
  } catch (err: any) {
    console.error('Create/Load Session error:', err);
    const msg = err?.response?.data?.message || err?.message || 'Failed to create/load session';
    showToast(msg, 'error');
    session.value = null;
    students.value = [];
  } finally {
    loading.value = false;
  }
};

const save = async (publish: boolean) => {
  if (!hasValidSession.value) {
    showToast('Create or load a session first', 'error');
    return;
  }
  
  // Validate that we have students loaded
  if (!students.value.length) {
    showToast('No students found. Please load a session first.', 'error');
    return;
  }
  
  saving.value = true;
  try {
    // Ensure all students have attendance records with proper defaults
    const records = students.value.map((s: any) => ({
      student_id: s.id,
      status: recordByStudent[s.id]?.status || 'present',
      remarks: recordByStudent[s.id]?.remarks || ''
    }));
    
    // Log records with remarks for verification
    const recordsWithRemarks = records.filter(r => r.remarks && r.remarks.trim() !== '');
    if (recordsWithRemarks.length > 0) {
      console.log('Records with remarks:', recordsWithRemarks);
    }
    
    // Validate records have valid status values
    const validStatuses = ['present', 'absent', 'late', 'excused'];
    const invalidRecords = records.filter(r => !validStatuses.includes(r.status));
    if (invalidRecords.length > 0) {
      showToast('Please ensure all students have valid attendance status', 'error');
      return;
    }
    
    await Attendance.saveRecords({ 
      session_id: session.value.id, 
      records, 
      publish 
    });
    
    showToast(publish ? 'Attendance published successfully' : 'Draft saved successfully', 'success');
  } catch (err: any) {
    console.error('Save attendance error:', err);
    const msg = err?.response?.data?.message || err?.message || 'Failed to save attendance';
    showToast(msg, 'error');
  } finally {
    saving.value = false;
  }
};

await loadDropdowns();
</script>

<style scoped></style>


