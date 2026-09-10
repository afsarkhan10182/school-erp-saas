<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto space-y-6">
      
      <!-- Page Header -->
      <div class="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <ClipboardList class="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            Fee Allocation
          </h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Assign and manage fee structures for students by Class, Section, and Branch.
          </p>
        </div>
        
        <div class="mt-4 sm:mt-0 flex gap-3">
          <button
            @click="fetchStudents"
            :disabled="!canFetch || isLoading"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw :class="['w-4 h-4 mr-2', isLoading ? 'animate-spin' : '']" />
            Fetch Students
          </button>

          <button
            @click="saveAllocation"
            :disabled="!hasSearched || isSaving"
            class="inline-flex items-center px-5 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 shadow-sm transition-all"
          >
            <Save class="w-4 h-4 mr-2" />
            {{ isSaving ? 'Saving...' : 'Save Allocation' }}
          </button>
        </div>
      </div>

      <!-- Filters Card -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

          <!-- Class Dropdown -->
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Class *
            </label>
            <div class="relative">
              <select
                v-model="filters.class_id"
                @change="onClassChange"
                class="appearance-none w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all shadow-sm"
              >
                <option value="">Select Class</option>
                <option v-for="c in classes" :key="c.id" :value="c.id">
                  {{ c.name }}
                </option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 dark:text-gray-400">
                <ChevronDown class="w-4 h-4" />
              </div>
            </div>
          </div>

          <!-- Section Dropdown -->
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Section
            </label>
            <div class="relative">
              <select
                v-model="filters.section_id"
                class="appearance-none w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all shadow-sm"
              >
                <option value="">All Sections</option>
                <option v-for="s in filteredSections" :key="s.id" :value="s.id">
                  {{ s.name }}
                </option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 dark:text-gray-400">
                <ChevronDown class="w-4 h-4" />
              </div>
            </div>
          </div>

          <!-- Fee Structure / Group Dropdown -->
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Fee Structure *
            </label>
            <div class="relative">
              <select
                v-model="filters.fee_group_id"
                class="appearance-none w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all shadow-sm"
              >
                <option value="">Select Fee Structure</option>
                <option v-for="fs in feeStructures" :key="fs.id" :value="fs.id">
                  {{ fs.name }} (₹{{ fs.amount || 0 }})
                </option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 dark:text-gray-400">
                <ChevronDown class="w-4 h-4" />
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Overview Stats Header -->
      <div v-if="hasSearched" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Total Students</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ students.length }}</p>
          </div>
          <Users class="w-8 h-8 text-blue-500 opacity-80" />
        </div>

        <div class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Selected for Allocation</p>
            <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ selectedStudentIds.size }}</p>
          </div>
          <CheckCircle2 class="w-8 h-8 text-emerald-500 opacity-80" />
        </div>

        <div class="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Unallocated</p>
            <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ students.length - selectedStudentIds.size }}</p>
          </div>
          <AlertCircle class="w-8 h-8 text-amber-500 opacity-80" />
        </div>
      </div>

      <!-- Main Allocation Table -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        
        <!-- Table Control Toolbar -->
        <div class="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <input
              type="checkbox"
              :checked="isAllSelected"
              @change="toggleSelectAll"
              :disabled="!students.length"
              class="w-4 h-4 text-indigo-600 rounded border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
            />
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Select All ({{ selectedStudentIds.size }} / {{ students.length }})
            </span>
          </div>

          <div class="relative max-w-xs w-full" v-if="students.length > 0">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              v-model="searchTerm"
              type="text"
              placeholder="Filter by student name or roll..."
              class="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="p-12 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
          <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading student records...</p>
        </div>

        <!-- Initial Prompt State -->
        <div v-else-if="!hasSearched" class="p-12 text-center space-y-3">
          <ClipboardList class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto" />
          <h3 class="text-base font-semibold text-gray-700 dark:text-gray-300">Select Criteria</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Choose a Class and Fee Structure above, then click <strong>Fetch Students</strong> to manage fee allocations.
          </p>
        </div>

        <!-- Empty Result State -->
        <div v-else-if="filteredStudents.length === 0" class="p-12 text-center space-y-2">
          <Users class="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
          <p class="text-sm text-gray-500 dark:text-gray-400">No students found matching your criteria.</p>
        </div>

        <!-- Students Table -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="p-4 w-12 text-center">#</th>
                <th class="p-4">Admission No</th>
                <th class="p-4">Roll No</th>
                <th class="p-4">Student Name</th>
                <th class="p-4">Class / Section</th>
                <th class="p-4">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="(student, index) in filteredStudents"
                :key="student.id"
                @click="toggleStudent(student.id)"
                class="hover:bg-indigo-50/40 dark:hover:bg-gray-700/40 cursor-pointer transition-colors"
              >
                <td class="p-4 text-center" @click.stop>
                  <input
                    type="checkbox"
                    :value="student.id"
                    :checked="selectedStudentIds.has(String(student.id))"
                    @change="toggleStudent(student.id)"
                    class="w-4 h-4 text-indigo-600 rounded border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
                  />
                </td>
                <td class="p-4 font-mono text-xs font-semibold text-gray-800 dark:text-gray-200">
                  {{ student.admission_number || '—' }}
                </td>
                <td class="p-4 font-mono text-xs text-gray-600 dark:text-gray-400">
                  {{ student.roll_number || '—' }}
                </td>
                <td class="p-4 font-medium text-gray-900 dark:text-white">
                  {{ student.first_name }} {{ student.last_name || '' }}
                </td>
                <td class="p-4 text-gray-600 dark:text-gray-300">
                  {{ student.class?.name || '—' }} <span v-if="student.sectionInfo">({{ student.sectionInfo.name }})</span>
                </td>
                <td class="p-4">
                  <span
                    v-if="selectedStudentIds.has(String(student.id))"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                  >
                    Allocated
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  >
                    Not Allocated
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import {
  ClipboardList,
  RefreshCw,
  Save,
  Users,
  CheckCircle2,
  AlertCircle,
  Search,
  ChevronDown
} from 'lucide-vue-next';
import { FeeAllocationAPI } from '~/api/financial/fee-allocation';
import { FeeStructures } from '~/api';
import { useAcademics } from '~/composables/useAcademics';
import { useToast } from '~/composables/useToast';
import { useGlobalBranch } from '~/composables/useGlobalBranch';

const { showToast } = useToast();
const { selectedBranchId } = useGlobalBranch();
const { classes, sections, fetchClasses, fetchSections } = useAcademics();

const isLoading = ref(false);
const isSaving = ref(false);
const hasSearched = ref(false);
const searchTerm = ref('');

const students = ref([]);
const feeStructures = ref([]);
const selectedStudentIds = ref(new Set());

const filters = reactive({
  branch_id: selectedBranchId.value || '',
  class_id: '',
  section_id: '',
  fee_group_id: ''
});

watch(selectedBranchId, (newBranchId) => {
  filters.branch_id = newBranchId || '';
  students.value = [];
  selectedStudentIds.value = new Set();
  hasSearched.value = false;
  fetchClasses();
  fetchSections();
  fetchFeeStructures();
});

const canFetch = computed(() => {
  return filters.class_id && filters.fee_group_id;
});

const filteredSections = computed(() => {
  if (!filters.class_id) return sections.value;
  return sections.value.filter(s => s.class_id === filters.class_id || !s.class_id);
});

const filteredStudents = computed(() => {
  if (!searchTerm.value) return students.value;
  const term = searchTerm.value.toLowerCase();
  return students.value.filter(s => {
    const fullName = `${s.first_name} ${s.last_name || ''}`.toLowerCase();
    const adm = String(s.admission_number || '').toLowerCase();
    const roll = String(s.roll_number || '').toLowerCase();
    return fullName.includes(term) || adm.includes(term) || roll.includes(term);
  });
});

const isAllSelected = computed(() => {
  if (!students.value.length) return false;
  return students.value.every(s => selectedStudentIds.value.has(String(s.id)));
});

const onClassChange = () => {
  filters.section_id = '';
};

const fetchFeeStructures = async () => {
  try {
    const res = await FeeStructures.getAll({ limit: 100 });
    feeStructures.value = res.data?.feeStructures || res.data || [];
  } catch (error) {
    console.error('Error fetching fee structures:', error);
  }
};

const fetchStudents = async () => {
  if (!canFetch.value) {
    showToast('Please select Class and Fee Structure', 'warning');
    return;
  }

  isLoading.value = true;
  hasSearched.value = true;
  try {
    const res = await FeeAllocationAPI.getStudents({
      class_id: filters.class_id,
      section_id: filters.section_id,
      fee_group_id: filters.fee_group_id,
      branch_id: filters.branch_id
    });

    const data = res.data?.data || res.data || {};
    const list = data.students || [];
    students.value = list;

    // Populate set of currently allocated students
    const initialSelected = new Set();
    list.forEach(s => {
      if (s.is_allocated) {
        initialSelected.add(String(s.id));
      }
    });
    selectedStudentIds.value = initialSelected;

    showToast(`Loaded ${list.length} students for allocation`, 'info');
  } catch (error) {
    showToast(error.response?.data?.message || 'Error fetching student records', 'error');
  } finally {
    isLoading.value = false;
  }
};

const toggleStudent = (id) => {
  const strId = String(id);
  const next = new Set(selectedStudentIds.value);
  if (next.has(strId)) {
    next.delete(strId);
  } else {
    next.add(strId);
  }
  selectedStudentIds.value = next;
};

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedStudentIds.value = new Set();
  } else {
    selectedStudentIds.value = new Set(students.value.map(s => String(s.id)));
  }
};

const saveAllocation = async () => {
  if (!canFetch.value) return;

  isSaving.value = true;
  try {
    const res = await FeeAllocationAPI.saveAllocation({
      class_id: filters.class_id,
      section_id: filters.section_id,
      fee_group_id: filters.fee_group_id,
      student_ids: Array.from(selectedStudentIds.value)
    });

    showToast(res.data?.message || 'Fee allocation saved successfully!', 'success');
  } catch (error) {
    showToast(error.response?.data?.message || 'Error saving allocation', 'error');
  } finally {
    isSaving.value = false;
  }
};

onMounted(async () => {
  await Promise.all([
    fetchClasses(),
    fetchSections(),
    fetchFeeStructures()
  ]);
});
</script>
