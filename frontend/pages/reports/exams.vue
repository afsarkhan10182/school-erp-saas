<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Exam Reports</h1>
          <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Tabulation sheet, marksheet, and multi-exam progress
          </p>
        </div>
        <NuxtLink
          to="/exams/report-cards"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Open Report Cards
        </NuxtLink>
      </div>

      <div class="mb-6 flex space-x-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          :class="[
            'px-4 py-2 text-sm font-medium rounded-md',
            activeTab === tab.id
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
          ]"
            @click="setTab(tab.id)"
        >
          {{ tab.name }}
        </button>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div :class="['grid grid-cols-1 gap-4', showBranchDropdown ? 'md:grid-cols-5' : 'md:grid-cols-4']">
          <div v-if="showBranchDropdown">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch</label>
            <EnhancedDropdown
              v-model="selectedBranchId"
              :options="branchOptions"
              placeholder="Choose branch"
              :loading="branchesLoading"
              @change="onBranchChange"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Exam</label>
            <EnhancedDropdown
              v-model="selectedExamId"
              :options="examOptions"
              placeholder="Choose exam"
              :loading="examsLoading"
            />
          </div>
          <div v-if="activeTab === 'progress'">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
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
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Class</label>
            <EnhancedDropdown
              v-model="selectedClassId"
              :options="classOptions"
              placeholder="Choose class"
              :loading="classesLoading"
              @change="onClassChange"
            />
          </div>
          <div v-if="sectionOptions.length">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Section</label>
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
              class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              @click="loadReport"
            >
              {{ loading ? 'Loading...' : 'Load' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'marksheet'" class="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <p class="text-gray-600 dark:text-gray-300 mb-4">
          Single-exam marksheets are generated from Report Cards.
        </p>
        <NuxtLink
          to="/exams/report-cards"
          class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md"
        >
          Go to Report Cards
        </NuxtLink>
      </div>

      <div
        v-else-if="activeTab === 'tabulation' && tabulationRows.length"
        class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md"
      >
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">%</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="row in tabulationRows" :key="row.student_id">
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">{{ row.roll_number || '—' }}</td>
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">{{ row.name }}</td>
                <td class="px-4 py-3 text-sm text-gray-500">{{ row.admission_number }}</td>
                <td class="px-4 py-3 text-sm">{{ row.is_absent ? '—' : row.marks_obtained ?? '—' }}</td>
                <td class="px-4 py-3 text-sm">{{ row.percentage != null ? row.percentage.toFixed(2) : '—' }}</td>
                <td class="px-4 py-3 text-sm">{{ row.grade || '—' }}</td>
                <td class="px-4 py-3 text-sm">{{ row.rank || '—' }}</td>
                <td class="px-4 py-3 text-sm">{{ row.is_absent ? 'Absent' : row.marks_obtained != null ? 'Entered' : 'Pending' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        v-else-if="activeTab === 'progress' && progressRows.length"
        class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md"
      >
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th
                  v-for="exam in progressExams"
                  :key="exam.id"
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                >
                  {{ exam.name }} %
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="row in progressRows" :key="row.student_id">
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">{{ row.name }}</td>
                <td v-for="exam in progressExams" :key="exam.id" class="px-4 py-3 text-sm">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { useToast } from '~/composables/useToast';
import { useAcademics } from '~/composables/useAcademics';
import { useExams } from '~/composables/useExams';
import { useAuth } from '~/composables/useAuth';
import { useBranches } from '~/composables/useBranches';
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
const { branches, fetchBranches, loading: branchesLoading } = useBranches();
const {
  classOptions,
  sectionOptions,
  fetchClasses,
  fetchSections,
  loading: classesLoading
} = useAcademics();
const { exams, loadExams, loading: examsLoading } = useExams();

const selectedBranchId = ref('');
const selectedExamId = ref('');
const compareExamId = ref('');
const selectedClassId = ref('');
const selectedSectionId = ref('');
const loading = ref(false);
const tabulationRows = ref<any[]>([]);
const progressRows = ref<any[]>([]);
const progressExams = ref<any[]>([]);

const branchOptions = computed(() =>
  branches.value.map((branch: any) => ({ value: branch.id, label: branch.name }))
);
const showBranchDropdown = computed(() => branches.value.length > 1);
const resolvedBranchId = computed(() => selectedBranchId.value || user.value?.branch_id);
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

const onBranchChange = async () => {
  selectedExamId.value = '';
  selectedClassId.value = '';
  if (selectedBranchId.value) {
    await Promise.all([
      fetchClasses({ branchId: selectedBranchId.value }),
      loadExams({ branch_id: selectedBranchId.value, school_id: user.value?.school_id })
    ]);
  }
};

const onClassChange = async () => {
  selectedSectionId.value = '';
  if (selectedClassId.value) {
    await fetchSections({
      schoolId: user.value?.school_id,
      branchId: resolvedBranchId.value,
      classId: selectedClassId.value
    });
  }
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

onMounted(async () => {
  await fetchBranches();
  selectedBranchId.value = user.value?.branch_id || (branches.value.length === 1 ? branches.value[0].id : '');
  if (user.value?.school_id) {
    await Promise.all([
      fetchClasses({ branchId: resolvedBranchId.value }),
      loadExams({ school_id: user.value?.school_id, branch_id: resolvedBranchId.value })
    ]);
  }
});
</script>
