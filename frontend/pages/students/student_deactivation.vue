<template>
  <div class="space-y-6 max-w-full">
    <!-- Header Banner -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5 tracking-tight">
          <span class="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-xl">
            <ShieldAlert class="w-6 h-6" />
          </span>
          Deactivate Account
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Filter students by class and section to view, manage, and toggle login authentication status.
        </p>
      </div>
    </div>

    <!-- Filter Card ("Select Ground") -->
    <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200/80 dark:border-gray-700 shadow-sm space-y-4">
      <h2 class="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700/60 pb-3 flex items-center gap-2">
        <Filter class="w-3.5 h-3.5" />
        Select Ground
      </h2>
      
      <div class="flex flex-wrap items-end gap-4">
        <!-- School Selector (Super Admin) -->
        <div v-if="showSchoolDropdown" class="flex-1 min-w-[200px]">
          <label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
            School <span class="text-rose-500">*</span>
          </label>
          <select
            v-model="selectedSchoolId"
            class="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3.5 py-2.5 text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
            @change="changeSchool"
          >
            <option value="">Select School</option>
            <option v-for="s in schoolOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </div>

        <!-- Class Selector -->
        <div class="flex-1 min-w-[180px]">
          <label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
            Class <span class="text-rose-500">*</span>
          </label>
          <select
            v-model="selectedClassId"
            class="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3.5 py-2.5 text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
            @change="changeClass"
          >
            <option value="">Select Class</option>
            <option v-for="c in classOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
          </select>
        </div>

        <!-- Section Selector -->
        <div class="flex-1 min-w-[160px]">
          <label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
            Section <span class="text-rose-500">*</span>
          </label>
          <select
            v-model="selectedSectionId"
            class="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3.5 py-2.5 text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
            @change="fetchStudents"
          >
            <option value="">All Sections</option>
            <option v-for="s in sectionOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </div>

        <!-- Filter Button -->
        <div class="self-end">
          <button
            class="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
            @click="fetchStudents"
          >
            <Filter class="w-4 h-4" />
            Filter Students
          </button>
        </div>
      </div>
    </div>

    <!-- Student List Card -->
    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden">
      <div class="p-6 pb-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700/60">
        <h2 class="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <UserGraduate class="w-5 h-5 text-indigo-500" />
          Student List
        </h2>
        <span v-if="students.length" class="text-xs font-semibold px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-900">
          Showing {{ students.length }} student(s)
        </span>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="p-12 text-center text-gray-500 dark:text-gray-400 flex items-center justify-center gap-3">
        <div class="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
        <span class="text-sm font-medium">Fetching student roster…</span>
      </div>

      <!-- Student Table -->
      <div v-else-if="students.length" class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-750 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <th class="px-4 py-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  class="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  @change="toggleSelectAll"
                />
              </th>
              <th class="px-4 py-3.5 w-14 text-center">Photo</th>
              <th class="px-4 py-3.5 min-w-[180px]">Student Name</th>
              <th class="px-4 py-3.5 min-w-[110px]">Register No</th>
              <th class="px-4 py-3.5 min-w-[80px]">Roll</th>
              <th class="px-4 py-3.5 min-w-[150px]">Guardian Name</th>
              <th class="px-4 py-3.5 min-w-[140px]">Class & Section</th>
              <th class="px-4 py-3.5 min-w-[160px]">Deactivate Reason</th>
              <th class="px-4 py-3.5 min-w-[130px]">Login Status</th>
              <th class="px-6 py-3.5 text-right min-w-[140px] sticky right-0 bg-gray-50/90 dark:bg-gray-750 backdrop-blur-sm">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700/60 text-sm">
            <tr
              v-for="student in students"
              :key="student.id"
              class="hover:bg-gray-50/60 dark:hover:bg-gray-700/40 transition-colors"
            >
              <td class="px-4 py-3.5 text-center">
                <input
                  v-model="selectedStudentIds"
                  type="checkbox"
                  :value="student.id"
                  class="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </td>
              <td class="px-4 py-3.5 text-center">
                <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-sm mx-auto">
                  {{ student.first_name ? student.first_name[0] : 'S' }}
                </div>
              </td>
              <td class="px-4 py-3.5 font-bold text-gray-900 dark:text-white">
                {{ student.first_name }} {{ student.last_name }}
              </td>
              <td class="px-4 py-3.5 text-gray-700 dark:text-gray-200 font-semibold text-xs">
                {{ student.admission_number || '—' }}
              </td>
              <td class="px-4 py-3.5 text-gray-700 dark:text-gray-200 font-semibold text-xs">
                {{ student.roll_number || '—' }}
              </td>
              <td class="px-4 py-3.5 text-gray-600 dark:text-gray-300">
                {{ getGuardianName(student) }}
              </td>
              <td class="px-4 py-3.5 text-gray-600 dark:text-gray-300">
                {{ student.current_class }} {{ student.section ? `(${student.section})` : '' }}
              </td>
              <td class="px-4 py-3.5">
                <span v-if="deactivationReasons[student.id]" class="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg font-medium border border-rose-200 dark:border-rose-900 inline-block">
                  {{ deactivationReasons[student.id] }}
                </span>
                <span v-else class="text-gray-400 dark:text-gray-500 italic text-xs">—</span>
              </td>
              <td class="px-4 py-3.5">
                <span
                  class="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5"
                  :class="student.user?.status === 'inactive' || student.status === 'inactive'
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="student.user?.status === 'inactive' || student.status === 'inactive' ? 'bg-rose-500' : 'bg-emerald-500'"></span>
                  {{ student.user?.status === 'inactive' || student.status === 'inactive' ? 'Deactivated' : 'Active' }}
                </span>
              </td>
              <td class="px-6 py-3.5 text-right whitespace-nowrap sticky right-0 bg-white dark:bg-gray-800 shadow-sm">
                <button
                  v-if="student.user?.status === 'inactive' || student.status === 'inactive'"
                  class="px-3.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 rounded-xl transition-all border border-emerald-200 dark:border-emerald-800 shadow-sm"
                  @click="toggleStudentStatus(student, 'active')"
                >
                  Activate
                </button>
                <button
                  v-else
                  class="px-3.5 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 rounded-xl transition-all border border-rose-200 dark:border-rose-800 shadow-sm"
                  @click="promptDeactivateReason(student)"
                >
                  Deactivate
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-else class="p-12 text-center">
        <div class="inline-flex p-4 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 mb-3">
          <UserGraduate class="w-8 h-8" />
        </div>
        <p class="text-base font-medium text-gray-900 dark:text-white">No students found</p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Select class and section above to view the student list.</p>
      </div>

      <!-- Footer Bulk Action Controls -->
      <div v-if="students.length" class="p-4 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Selected: <strong class="text-gray-900 dark:text-white">{{ selectedStudentIds.length }}</strong> of {{ students.length }}
        </div>
        <div class="flex items-center gap-3">
          <button
            :disabled="!selectedStudentIds.length"
            class="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition-all shadow-sm flex items-center gap-1.5"
            @click="bulkToggleStatus('active')"
          >
            <Unlock class="w-3.5 h-3.5" />
            Authentication Activate
          </button>
          <button
            :disabled="!selectedStudentIds.length"
            class="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white transition-all shadow-sm flex items-center gap-1.5"
            @click="bulkToggleStatus('inactive')"
          >
            <Lock class="w-3.5 h-3.5" />
            Authentication Deactivate
          </button>
        </div>
      </div>
    </div>

    <!-- Reason Modal Prompt when Deactivating -->
    <div v-if="activeStudentToDeactivate" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100 dark:border-gray-700">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white">
          Deactivate Student Login
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Provide a reason for deactivating authentication for <strong>{{ activeStudentToDeactivate.first_name }} {{ activeStudentToDeactivate.last_name }}</strong>:
        </p>
        <textarea
          v-model="inputReason"
          placeholder="Enter reason (e.g. Fee Non-payment, Long Absence)..."
          rows="3"
          class="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
        ></textarea>
        <div class="flex justify-end gap-3 pt-2">
          <button
            class="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            @click="activeStudentToDeactivate = null"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
            @click="confirmDeactivate"
          >
            Confirm Deactivate
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { ShieldAlert, Filter, Lock, Unlock } from 'lucide-vue-next';
import { useSchoolBranchScope } from '~/composables/useSchoolBranchScope';
import { useAcademics } from '~/composables/useAcademics';
import { Students } from '~/api/students/students';
import { DynamicEntities } from '~/api/shared/dynamic-entities';

const {
  schoolOptions,
  branchOptions,
  selectedSchoolId,
  selectedBranchId,
  showSchoolDropdown,
  showBranchDropdown,
  scopeParams,
  loadScope,
  onSchoolChange
} = useSchoolBranchScope();

const { classOptions, sectionOptions, fetchClasses, fetchSections } = useAcademics();

const selectedClassId = ref('');
const selectedSectionId = ref('');
const students = ref<any[]>([]);
const loading = ref(false);
const selectedStudentIds = ref<string[]>([]);
const deactivationReasons = ref<Record<string, string>>({});
const activeStudentToDeactivate = ref<any>(null);
const inputReason = ref('');

const isAllSelected = computed(() => {
  return students.value.length > 0 && selectedStudentIds.value.length === students.value.length;
});

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedStudentIds.value = [];
  } else {
    selectedStudentIds.value = students.value.map(s => s.id);
  }
};

const getGuardianName = (student: any) => {
  if (student.parents && student.parents.length) {
    const p = student.parents[0];
    return p.guardian_name || p.father_name || '—';
  }
  return '—';
};

const fetchStudents = async () => {
  loading.value = true;
  try {
    const params: any = {
      ...scopeParams.value,
      limit: 500
    };
    if (selectedClassId.value) params.class_id = selectedClassId.value;
    if (selectedSectionId.value) params.section_id = selectedSectionId.value;

    const res: any = await Students.getAll(params);
    students.value = res.data || [];

    // Also fetch deactivation records for reason display
    const deactRes: any = await DynamicEntities.list('student_deactivation', scopeParams.value);
    const records = Array.isArray(deactRes.data?.rows) ? deactRes.data.rows : Array.isArray(deactRes.data?.records) ? deactRes.data.records : [];
    const reasonsMap: Record<string, string> = {};
    records.forEach((r: any) => {
      const sid = r.user_id || r.student_id;
      if (sid && r.notes) reasonsMap[sid] = r.notes;
    });
    deactivationReasons.value = reasonsMap;
  } catch (error) {
    console.error('Error fetching students:', error);
    students.value = [];
  } finally {
    loading.value = false;
  }
};

const changeSchool = async () => {
  await onSchoolChange();
  selectedClassId.value = '';
  selectedSectionId.value = '';
  await fetchClasses({ branchId: selectedBranchId.value });
  await fetchStudents();
};

const changeBranch = async () => {
  selectedClassId.value = '';
  selectedSectionId.value = '';
  await fetchClasses({ branchId: selectedBranchId.value });
  await fetchStudents();
};

const changeClass = async () => {
  selectedSectionId.value = '';
  if (selectedClassId.value) {
    await fetchSections({ classId: selectedClassId.value, branchId: selectedBranchId.value });
  }
  await fetchStudents();
};

const promptDeactivateReason = (student: any) => {
  activeStudentToDeactivate.value = student;
  inputReason.value = deactivationReasons.value[student.id] || '';
};

const confirmDeactivate = async () => {
  if (!activeStudentToDeactivate.value) return;
  const student = activeStudentToDeactivate.value;
  await toggleStudentStatus(student, 'inactive', inputReason.value);
  activeStudentToDeactivate.value = null;
  inputReason.value = '';
};

const toggleStudentStatus = async (student: any, status: 'active' | 'inactive', reason?: string) => {
  try {
    if (student.user?.id) {
      // Toggle backend user status
      await DynamicEntities.create('student_deactivation', {
        user_id: student.id,
        notes: reason || (status === 'active' ? 'Re-activated login' : 'Deactivated login'),
        status
      });
    }
    if (status === 'inactive' && reason) {
      deactivationReasons.value[student.id] = reason;
    } else if (status === 'active') {
      delete deactivationReasons.value[student.id];
    }
    if (student.user) student.user.status = status;
    student.status = status;
  } catch (error) {
    console.error('Failed to update student status:', error);
  }
};

const bulkToggleStatus = async (status: 'active' | 'inactive') => {
  for (const id of selectedStudentIds.value) {
    const student = students.value.find(s => s.id === id);
    if (student) {
      await toggleStudentStatus(student, status, status === 'inactive' ? 'Bulk deactivation' : undefined);
    }
  }
  selectedStudentIds.value = [];
};

onMounted(async () => {
  await loadScope();
  await fetchClasses({ branchId: selectedBranchId.value });
  await fetchStudents();
});

watch(selectedBranchId, async () => {
  selectedClassId.value = '';
  selectedSectionId.value = '';
  await fetchClasses({ branchId: selectedBranchId.value });
  await fetchStudents();
});
</script>
