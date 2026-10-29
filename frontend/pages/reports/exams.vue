<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Exam Reports
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Tabulation sheet, marksheet, and multi-exam progress
        </p>
      </div>
      <div>
        <NuxtLink
          to="/exams/report-cards"
          class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Open Report Cards
        </NuxtLink>
      </div>
    </div>

    <div class="mb-6 flex space-x-2">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        :class="[
          'px-4 py-2 text-sm font-medium rounded-xl transition-colors',
          activeTab === tab.id
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
        ]"
        @click="setTab(tab.id)"
      >
        {{ tab.name }}
      </button>
    </div>

    <div
      class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm p-6 mb-6"
    >
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label
            class="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5"
            >Exam</label
          >
          <EnhancedDropdown
            v-model="selectedExamId"
            :options="examOptions"
            placeholder="Choose exam"
            :loading="examsLoading"
          />
        </div>
        <div v-if="activeTab === 'progress'">
          <label
            class="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5"
            >Compare with exam</label
          >
          <EnhancedDropdown
            v-model="compareExamId"
            :options="compareExamOptions"
            placeholder="Second exam"
            :loading="examsLoading"
          />
        </div>
        <div>
          <label
            class="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5"
            >Class</label
          >
          <EnhancedDropdown
            v-model="selectedClassId"
            :options="classOptions"
            placeholder="Choose class"
            :loading="classesLoading"
            @change="onClassChange"
          />
        </div>
        <div v-if="sectionOptions.length">
          <label
            class="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5"
            >Section</label
          >
          <EnhancedDropdown
            v-model="selectedSectionId"
            :options="sectionOptions"
            placeholder="All sections"
          />
        </div>
        <div class="flex items-end">
          <button
            type="button"
            :disabled="!canLoad || loading"
            class="w-full inline-flex justify-center items-center px-4 py-2 text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
            @click="loadReport"
          >
            {{ loading ? 'Loading...' : 'Load' }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="activeTab === 'marksheet'"
      class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm p-8 text-center"
    >
      <p class="text-gray-600 dark:text-gray-300 mb-4">
        Single-exam marksheets are generated from Report Cards.
      </p>
      <NuxtLink
        to="/exams/report-cards"
        class="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
      >
        Go to Report Cards
      </NuxtLink>
    </div>

    <div v-else-if="activeTab === 'tabulation' && tabulationRows.length" class="table-container">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Roll</th>
              <th>Student</th>
              <th>Admission</th>
              <th>Marks</th>
              <th>%</th>
              <th>Grade</th>
              <th>Rank</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in tabulationRows" :key="row.student_id" class="table-row-hover">
              <td>{{ row.roll_number || '—' }}</td>
              <td class="font-medium">{{ row.name }}</td>
              <td class="text-gray-500">{{ row.admission_number }}</td>
              <td>{{ row.is_absent ? '—' : (row.marks_obtained ?? '—') }}</td>
              <td>{{ row.percentage != null ? row.percentage.toFixed(2) : '—' }}</td>
              <td>{{ row.grade || '—' }}</td>
              <td>{{ row.rank || '—' }}</td>
              <td>
                {{ row.is_absent ? 'Absent' : row.marks_obtained != null ? 'Entered' : 'Pending' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="activeTab === 'progress' && progressRows.length" class="table-container">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Student</th>
              <th v-for="exam in progressExams" :key="exam.id">{{ exam.name }} %</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in progressRows" :key="row.student_id" class="table-row-hover">
              <td class="font-medium">{{ row.name }}</td>
              <td v-for="exam in progressExams" :key="exam.id">
                {{
                  row.exam_marks[exam.id]?.is_absent
                    ? 'Abs'
                    : row.exam_marks[exam.id]?.percentage != null
                      ? Number(row.exam_marks[exam.id].percentage).toFixed(1)
                      : '—'
                }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { useToast } from '~/composables/useToast';
import { useAcademics } from '~/composables/useAcademics';
import { useExams } from '~/composables/useExams';
import { useAuth } from '~/composables/useAuth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { examReportsApi } from '~/api/academic/exam-reports';

const tabs = [
  { id: 'tabulation', name: 'Tabulation Sheet' },
  { id: 'marksheet', name: 'Single Exam Report Card' },
  { id: 'progress', name: 'Multi Exam Progress Report' }
];

const route = useRoute();
const router = useRouter();
const initialTab = String(route.query.tab || 'tabulation');
const activeTab = ref(tabs.some(tab => tab.id === initialTab) ? initialTab : 'tabulation');
const { showToast } = useToast();
const { user } = useAuth();
const { selectedBranchId, currentSchool } = useGlobalBranch();
const {
  classOptions,
  sectionOptions,
  fetchClasses,
  fetchSections,
  loading: classesLoading
} = useAcademics();
const { exams, loadExams, loading: examsLoading } = useExams();

const selectedExamId = ref('');
const compareExamId = ref('');
const selectedClassId = ref('');
const selectedSectionId = ref('');
const loading = ref(false);
const tabulationRows = ref<any[]>([]);
const progressRows = ref<any[]>([]);
const progressExams = ref<any[]>([]);

const resolvedSchoolId = computed(() => currentSchool.value?.id || user.value?.school_id);
const resolvedBranchId = computed(() => selectedBranchId.value);

const examOptions = computed(() =>
  exams.value.map((exam: any) => ({ value: exam.id, label: exam.name }))
);
const compareExamOptions = computed(() =>
  examOptions.value.filter((e: any) => e.value !== selectedExamId.value)
);
const canLoad = computed(() => {
  if (activeTab.value === 'marksheet') return false;
  if (!selectedExamId.value || !selectedClassId.value) return false;
  if (activeTab.value === 'progress' && !compareExamId.value) return false;
  return true;
});

const setTab = (tabId: string) => {
  activeTab.value = tabId;
  tabulationRows.value = [];
  progressRows.value = [];
  progressExams.value = [];
  router.replace({ query: { ...route.query, tab: tabId } });
};

const onClassChange = async () => {
  selectedSectionId.value = '';
  if (selectedClassId.value) {
    await fetchSections({
      schoolId: resolvedSchoolId.value,
      branchId: resolvedBranchId.value,
      classId: selectedClassId.value
    });
  }
};

const loadOptions = async () => {
  selectedExamId.value = '';
  selectedClassId.value = '';
  selectedSectionId.value = '';
  compareExamId.value = '';
  tabulationRows.value = [];
  progressRows.value = [];
  progressExams.value = [];

  await Promise.all([
    fetchClasses({ branchId: resolvedBranchId.value, schoolId: resolvedSchoolId.value }),
    loadExams({ school_id: resolvedSchoolId.value, branch_id: resolvedBranchId.value })
  ]);
};

const loadReport = async () => {
  loading.value = true;
  try {
    const params: any = {
      exam_id: selectedExamId.value,
      class_id: selectedClassId.value
    };
    if (resolvedBranchId.value) params.branch_id = resolvedBranchId.value;
    if (selectedSectionId.value) params.section_id = selectedSectionId.value;

    if (activeTab.value === 'tabulation') {
      const response: any = await examReportsApi.getTabulation(params);
      tabulationRows.value = response.data?.rows || [];
      showToast('Tabulation loaded', 'success');
    } else if (activeTab.value === 'progress') {
      const response: any = await examReportsApi.getProgress({
        exam_ids: `${selectedExamId.value},${compareExamId.value}`,
        class_id: selectedClassId.value,
        branch_id: resolvedBranchId.value || undefined,
        section_id: selectedSectionId.value || undefined
      });
      progressExams.value = response.data?.exams || [];
      progressRows.value = response.data?.rows || [];
      showToast('Progress report loaded', 'success');
    }
  } catch (error: any) {
    showToast(error?.message || 'Failed to load report', 'error');
  } finally {
    loading.value = false;
  }
};

watch(selectedBranchId, () => {
  loadOptions();
});

watch(currentSchool, () => {
  loadOptions();
});

onMounted(async () => {
  await loadOptions();
});
</script>
