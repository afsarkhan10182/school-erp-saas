<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">ID / Admit Cards</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Generate printable student or employee cards using saved layouts
        </p>
      </div>
      <div>
        <NuxtLink
          to="/cards/templates"
          class="inline-flex items-center rounded-xl border border-indigo-200 dark:border-indigo-500/30 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors shadow-sm"
        >
          Manage templates →
        </NuxtLink>
      </div>
    </div>

      <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-6">
        <section class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <div class="mb-5">
            <h2 class="text-base font-semibold text-gray-900 dark:text-white">Generate card</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">Choose branch, person type, card type and layout.</p>
          </div>

          <div class="space-y-4">

            <label class="block space-y-1.5">
              <span class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">For</span>
              <select v-model="userType" class="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600" @change="onUserTypeChange">
                <option value="student">Student</option>
                <option value="employee">Employee</option>
              </select>
            </label>
            <label class="block space-y-1.5">
              <span class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ userType === 'student' ? 'Student' : 'Employee' }}</span>
              <select v-if="userType === 'student'" v-model="studentId" class="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600">
                <option value="">Select student</option>
                <option v-for="s in students" :key="s.id" :value="s.id">
                  {{ s.first_name }} {{ s.last_name }} ({{ s.admission_number }})
                </option>
              </select>
              <select v-else v-model="employeeId" class="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600">
                <option value="">Select employee</option>
                <option v-for="employee in employees" :key="employee.id" :value="employee.id">
                  {{ employee.first_name }} {{ employee.last_name }} ({{ employee.role }})
                </option>
              </select>
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label class="block space-y-1.5">
                <span class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Card type</span>
                <select v-model="kind" class="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600" @change="filterTemplates">
                  <option value="id">ID card</option>
                  <option value="admit">Admit card</option>
                </select>
              </label>
              <label class="block space-y-1.5">
                <span class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Layout</span>
                <select v-model="templateId" class="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-600">
                  <option value="">Default layout</option>
                  <option v-for="t in filteredTemplates" :key="t.id" :value="t.id">{{ t.name }}</option>
                </select>
              </label>
            </div>
            <button
              class="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:hover:bg-indigo-600"
              :disabled="!selectedPersonId || loading"
              @click="generate"
            >
              {{ loading ? 'Generating…' : 'Generate & print' }}
            </button>
          </div>
        </section>

        <section class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 min-h-[360px]">
          <div class="flex items-center justify-between mb-5 gap-3">
            <div>
              <h2 class="text-base font-semibold text-gray-900 dark:text-white">Preview</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">Generated output appears here before print.</p>
            </div>
            <span class="rounded-full bg-gray-100 dark:bg-gray-900 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">
              {{ kind === 'admit' ? 'Admit card' : 'ID card' }}
            </span>
          </div>
          <p v-if="error" class="mb-4 text-sm text-red-600">{{ error }}</p>
          <div v-if="html" class="print-card bg-white dark:bg-gray-800 p-6 inline-block rounded shadow" v-html="html"></div>
          <div v-else class="flex min-h-[240px] items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-center px-6">
            <p class="max-w-sm text-sm text-gray-500 dark:text-gray-400">
              Select a {{ userType }} and click generate. Saved templates keep the same field visibility and layout used on the template screen.
            </p>
          </div>
          <p v-if="!students.length && !bootLoading && userType === 'student'" class="mt-4 text-sm text-gray-500">No students found.</p>
        </section>
      </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Branches } from '~/api/administration/branches';
import { Students } from '~/api/students';
import { Users } from '~/api/administration/users';
import { CardTemplates } from '~/api/academic/cards-exams-reports';
import { useAuth } from '~/composables/useAuth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { extractList, apiErrorMessage } from '~/utils/list-response';

const { user } = useAuth();
const { selectedBranchId } = useGlobalBranch();
const students = ref<any[]>([]);
const employees = ref<any[]>([]);
const templates = ref<any[]>([]);
const branchOptions = ref<any[]>([]);

watch(selectedBranchId, () => {
  reloadScope();
});
const studentId = ref('');
const employeeId = ref('');
const userType = ref('student');
const templateId = ref('');
const kind = ref('id');
const html = ref('');
const loading = ref(false);
const bootLoading = ref(true);
const error = ref('');

const filteredTemplates = computed(() =>
  templates.value.filter(t => t.kind === kind.value && t.user_type === userType.value && t.is_active !== false)
);
const selectedPersonId = computed(() => userType.value === 'employee' ? employeeId.value : studentId.value);

const branchParams = () => selectedBranchId.value ? { branch_id: selectedBranchId.value } : {};

const filterTemplates = () => {
  if (!filteredTemplates.value.some(t => t.id === templateId.value)) {
    templateId.value = '';
  }
};

const loadBranches = async () => {
  const response: any = await Branches.getForDropdown({ status: 'active' });
  const branches = extractList(response, ['branches']);
  branchOptions.value = branches.map((b: any) => ({ value: b.id, label: b.name || b.code || b.id }));
  selectedBranchId.value = user.value?.branch_id || (branchOptions.value.length === 1 ? branchOptions.value[0].value : '');
};

const reloadScope = async () => {
  studentId.value = '';
  employeeId.value = '';
  templateId.value = '';
  html.value = '';
  const [sRes, uRes, tRes]: any[] = await Promise.all([
    Students.getAll({ limit: 200, ...branchParams() }),
    Users.getAll({ limit: 200, status: 'active', ...branchParams() }).catch(() => ({ data: { users: [] } })),
    CardTemplates.list(branchParams())
  ]);
  students.value = extractList(sRes, ['students', 'rows']);
  employees.value = extractList(uRes, ['users', 'rows']).filter((u: any) => !['super_admin', 'admin', 'student', 'parent'].includes(u.role));
  templates.value = tRes.data?.templates || [];
};

const onUserTypeChange = () => {
  studentId.value = '';
  employeeId.value = '';
  kind.value = 'id';
  filterTemplates();
};

onMounted(async () => {
  try {
    await loadBranches();
    await reloadScope();
  } catch (e) {
    error.value = apiErrorMessage(e);
  } finally {
    bootLoading.value = false;
  }
});

const generate = async () => {
  loading.value = true;
  error.value = '';
  html.value = '';
  try {
    const res: any = await CardTemplates.generate({
      student_id: userType.value === 'student' ? studentId.value : undefined,
      user_id: userType.value === 'employee' ? employeeId.value : undefined,
      user_type: userType.value,
      template_id: templateId.value || undefined,
      kind: kind.value,
      ...branchParams()
    });
    html.value = res.data?.html || '';
    if (html.value) {
      setTimeout(() => window.print(), 300);
    }
  } catch (e) {
    error.value = apiErrorMessage(e);
  } finally {
    loading.value = false;
  }
};
</script>

<style>
@media print {
  @page {
    margin: 10mm;
  }

  body * {
    visibility: hidden;
  }

  .cards-page {
    min-height: 0 !important;
  }

  .print-card,
  .print-card * {
    visibility: visible;
  }

  .print-card {
    position: absolute;
    inset: 0 auto auto 0;
    padding: 0 !important;
    box-shadow: none !important;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}
</style>
