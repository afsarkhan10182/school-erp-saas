<template>
  <div class="p-4 space-y-4">
    <h2 class="text-xl font-semibold">Take Attendance</h2>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <input
        v-model="form.date"
        type="date"
        class="border px-2 py-1 rounded bg-white text-gray-900"
      />
      <EnhancedDropdown :options="classOptions" v-model="form.class_id" placeholder="Class" />
      <EnhancedDropdown :options="sectionOptions" v-model="form.section_id" placeholder="Section" />
      <EnhancedDropdown :options="typeOptions" v-model="form.attendance_type" placeholder="Type" />
      <input
        v-if="form.attendance_type === 'period'"
        v-model.number="form.period_number"
        type="number"
        min="1"
        max="10"
        class="border px-2 py-1 rounded bg-white text-gray-900 placeholder-gray-500"
        placeholder="Period"
      />
      <input
        v-model="form.academic_year"
        type="text"
        class="border px-2 py-1 rounded bg-white text-gray-900 placeholder-gray-500"
        placeholder="Academic Year (e.g., 2025-2026)"
      />
    </div>

    <div class="flex gap-2">
      <button
        class="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        @click.prevent="createOrGetSession"
        :disabled="loading"
      >
        {{ loading ? 'Loading...' : 'Create/Load Session' }}
      </button>
      <button
        class="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        @click.prevent="save(true)"
        :disabled="!hasValidSession || saving || loading"
      >
        {{ saving && hasValidSession ? 'Publishing...' : 'Save & Publish' }}
      </button>
      <button
        class="bg-gray-700 text-white px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        @click.prevent="save(false)"
        :disabled="!hasValidSession || saving || loading"
      >
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
              <select
                v-model="recordByStudent[s.id].status"
                class="border px-2 py-1 rounded bg-white text-gray-900"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="excused">Excused</option>
              </select>
            </td>
            <td class="p-2 border">
              <input
                v-model="recordByStudent[s.id].remarks"
                type="text"
                class="border px-2 py-1 rounded w-full bg-white text-gray-900 placeholder-gray-500"
                placeholder="Add remarks..."
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div
      v-else-if="!hasValidSession && students.length === 0"
      class="border rounded p-6 bg-gray-50 text-gray-600"
    >
      <div class="font-medium mb-2">No students loaded</div>
      <p>Select Date, Class and Section, then click "Create/Load Session".</p>
    </div>
    <div
      v-else-if="students.length > 0 && !hasValidSession"
      class="border rounded p-6 bg-yellow-50 text-yellow-700"
    >
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
import { useAcademics } from '~/composables/useAcademics';
import { useAttendance } from '~/composables/useAttendance';
import { useStudents } from '~/composables/useStudents';
import { useAuth } from '~/composables/useAuth';

const { user, isSuperAdmin, isSchoolAdmin, isBranchAdmin } = useAuth();
const { classes, sections, fetchClasses, fetchSections, classOptions, sectionOptions } =
  useAcademics();
const {
  currentSession,
  students,
  attendanceRecords,
  loading,
  saving,
  createSession,
  loadStudents,
  saveAttendance
} = useAttendance();
const { loadStudents: loadStudentsFromComposable } = useStudents();

// Computed property to check if we have a valid session
const hasValidSession = computed(() => {
  return !!(currentSession.value && currentSession.value.id);
});

const form = reactive<{
  date: string;
  attendance_type: 'daily' | 'period';
  period_number: number | null;
  academic_year?: string;
  class_id?: string;
  section_id?: string | null;
}>({
  date: new Date().toISOString().slice(0, 10),
  attendance_type: 'daily',
  period_number: null,
  academic_year: undefined,
  class_id: undefined,
  section_id: undefined
});

const typeOptions = [
  { label: 'Daily', value: 'daily' },
  { label: 'Period', value: 'period' }
];
const recordByStudent = reactive<
  Record<string, { status: 'present' | 'absent' | 'late' | 'excused'; remarks?: string }>
>({});

const { showToast } = useToast();

const loadDropdowns = async () => {
  try {
    await fetchClasses();
    await fetchSections();
  } catch (error: any) {
    console.error('Error loading dropdowns:', error);
    showToast('Failed to load classes and sections', 'error');
  }
};

const loadStudentsData = async () => {
  if (!form.class_id) return;
  try {
    await loadStudents(form.class_id, form.section_id || undefined);

    // Clear existing records and initialize for all students
    Object.keys(recordByStudent).forEach(key => delete recordByStudent[key]);
    students.value.forEach((s: any) => {
      recordByStudent[s.id] = { status: 'present', remarks: '' };
    });

    // Auto-create session if we have date and students
    if (form.date && students.value.length > 0 && !currentSession.value) {
      await createOrGetSession();
    }
  } catch (error: any) {
    console.error('Error loading students:', error);
    showToast('Failed to load students', 'error');
  }
};

watch(() => [form.class_id, form.section_id], loadStudentsData);

const createOrGetSession = async () => {
  if (!form.date || !form.class_id) {
    showToast('Please select date and class first', 'error');
    return;
  }

  try {
    // Ensure context
    // @ts-ignore
    if (!user.value?.school?.id || !user.value?.branch?.id) {
      showToast('Select a school/branch to proceed', 'error');
      return;
    }

    const sessionData = await createSession({
      date: form.date,
      attendance_type: 'daily',
      academic_year: form.academic_year || undefined,
      class_id: form.class_id!,
      section_id: form.section_id || undefined,
      // Pass context explicitly for super_admin or when token lacks branch
      // Backend setSchoolContext/setBranchContext will pick these
      // @ts-ignore
      school_id: user.value?.school?.id,
      // @ts-ignore
      branch_id: user.value?.branch?.id
    });

    await loadStudentsData();

    if (students.value.length === 0) {
      showToast('Session created but no students found for this class/section', 'warning');
    } else {
      showToast(`Session ready with ${students.value.length} students`, 'success');
    }
  } catch (err: any) {
    console.error('Create/Load Session error:', err);
    const msg = err?.response?.data?.message || err?.message || 'Failed to create/load session';
    showToast(msg, 'error');
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
    }

    // Validate records have valid status values
    const validStatuses = ['present', 'absent', 'late', 'excused'];
    const invalidRecords = records.filter(r => !validStatuses.includes(r.status));
    if (invalidRecords.length > 0) {
      showToast('Please ensure all students have valid attendance status', 'error');
      return;
    }

    if (currentSession.value?.id) {
      await saveAttendance(currentSession.value.id, records, publish);
    } else {
      throw new Error('No valid session found');
    }

    showToast(
      publish ? 'Attendance published successfully' : 'Draft saved successfully',
      'success'
    );
  } catch (err: any) {
    console.error('Save attendance error:', err);
    const msg = err?.response?.data?.message || err?.message || 'Failed to save attendance';
    showToast(msg, 'error');
  }
};

await loadDropdowns();
</script>

<style scoped></style>
