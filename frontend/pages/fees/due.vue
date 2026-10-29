<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Due Invoices</h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Find unpaid and overdue invoices, then open the student ledger to collect.
          </p>
        </div>
        <NuxtLink
          to="/reports/fees"
          class="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          Open full fee report
        </NuxtLink>
      </div>

      <section class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <form class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" @submit.prevent="applyFilters">
          <label class="text-sm text-gray-700 dark:text-gray-300">
            Student or admission no.
            <input v-model.trim="filters.search" class="input-field mt-1" placeholder="Search students" />
          </label>
          <label class="text-sm text-gray-700 dark:text-gray-300">
            Class
            <select v-model="filters.class_id" class="input-field mt-1">
              <option value="">All classes</option>
              <option v-for="classItem in classes" :key="classItem.id" :value="classItem.id">
                {{ classItem.name }}{{ classItem.branch?.name ? ` — ${classItem.branch.name}` : '' }}
              </option>
            </select>
          </label>
          <label class="text-sm text-gray-700 dark:text-gray-300">
            Section
            <select v-model="filters.section_id" class="input-field mt-1" :disabled="!filters.class_id">
              <option value="">All sections</option>
              <option v-for="section in sections" :key="section.id" :value="section.id">
                {{ section.name }}
              </option>
            </select>
          </label>
          <label class="text-sm text-gray-700 dark:text-gray-300">
            Academic year
            <select v-model="filters.academic_year" class="input-field mt-1">
              <option value="">All years</option>
              <option v-for="year in academicYears" :key="year.id || year.name" :value="year.name">
                {{ year.name }}{{ year.is_current ? ' (Current)' : '' }}
              </option>
            </select>
          </label>
          <label class="text-sm text-gray-700 dark:text-gray-300">
            Status
            <select v-model="filters.status" class="input-field mt-1">
              <option value="">All due statuses</option>
              <option value="overdue">Overdue</option>
              <option value="sent">Pending</option>
              <option value="partial_paid">Partially paid</option>
            </select>
          </label>
          <label class="text-sm text-gray-700 dark:text-gray-300">
            Filter due date
            <select v-model="dueWindow" class="input-field mt-1" @change="applyDueWindow">
              <option value="all">Full due (all time)</option>
              <option value="month">Due this month</option>
              <option value="quarter">Due this quarter</option>
              <option value="next-six-months">Due next 6 months</option>
              <option value="custom">Custom demand date</option>
            </select>
          </label>
          <label class="text-sm text-gray-700 dark:text-gray-300">
            Due from
            <input v-model="filters.due_from" type="date" class="input-field mt-1" @change="selectCustomDueDate" />
          </label>
          <label class="text-sm text-gray-700 dark:text-gray-300">
            Due to
            <input v-model="filters.due_to" type="date" class="input-field mt-1" @change="selectCustomDueDate" />
          </label>
          <div class="flex items-end gap-2">
            <button
              type="submit"
              :disabled="loading"
              class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {{ loading ? 'Searching…' : 'Search' }}
            </button>
            <button
              type="button"
              :disabled="loading"
              class="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              @click="resetFilters"
            >
              Reset
            </button>
          </div>
        </form>
      </section>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p class="text-sm text-gray-500 dark:text-gray-400">Matching invoices</p>
          <p class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{{ pagination.total }}</p>
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p class="text-sm text-gray-500 dark:text-gray-400">Demanded total</p>
          <p class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{{ formatCurrency(summary.total_amount) }}</p>
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p class="text-sm text-gray-500 dark:text-gray-400">Paid</p>
          <p class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{{ formatCurrency(summary.paid_amount) }}</p>
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p class="text-sm text-gray-500 dark:text-gray-400">Discount</p>
          <p class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{{ formatCurrency(summary.discount_amount) }}</p>
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p class="text-sm text-gray-500 dark:text-gray-400">Outstanding</p>
          <p class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{{ formatCurrency(summary.balance_amount) }}</p>
        </div>
      </div>

      <div
        v-if="errorMessage"
        class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {{ errorMessage }}
        <button class="ml-3 underline" @click="load">Retry</button>
      </div>

      <section class="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Due invoices</h2>
          <div class="flex flex-wrap items-center gap-2">
            <div class="relative">
              <button
                type="button"
                :aria-expanded="showColumnSelector"
                class="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                @click="showColumnSelector = !showColumnSelector"
              >
                Columns
              </button>
              <div
                v-if="showColumnSelector"
                class="absolute right-0 z-20 mt-2 w-56 rounded-md border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-600 dark:bg-gray-800"
              >
                <div class="mb-2 flex justify-between text-xs">
                  <button type="button" class="text-indigo-600 hover:underline" @click="selectAllColumns">Select all</button>
                  <button type="button" class="text-indigo-600 hover:underline" @click="resetColumns">Reset</button>
                </div>
                <label v-for="column in availableColumns" :key="column.key" class="flex items-center gap-2 py-1 text-sm text-gray-700 dark:text-gray-200">
                  <input v-model="column.visible" type="checkbox" :disabled="column.visible && visibleColumns.length === 1" />
                  {{ column.label }}
                </label>
                <p class="mt-2 text-xs text-gray-500">Actions remain visible.</p>
              </div>
            </div>
            <button
              v-for="format in exportFormats"
              :key="format.value"
              type="button"
              :disabled="isGenerating || loading || pagination.total === 0 || !visibleColumns.length"
              class="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              @click="exportDueInvoices(format.value)"
            >
              {{ isGenerating ? 'Preparing…' : format.label }}
            </button>
            <button
              type="button"
              :disabled="isPrinting || loading || !items.length || !visibleColumns.length"
              class="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              @click="printDueInvoices"
            >
              {{ isPrinting ? 'Preparing…' : 'Print' }}
            </button>
          </div>
        </div>
        <div v-if="loading" class="p-6 text-sm text-gray-500 dark:text-gray-400">
          Loading due invoices...
        </div>
        <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700/60">
            <tr>
              <th v-for="column in visibleColumns" :key="column.key" :class="['whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400', column.numeric ? 'text-right' : 'text-left']">
                {{ column.label }}
              </th>
              <th class="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="item in items" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/40">
              <td v-for="column in visibleColumns" :key="column.key" :class="['whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300', column.numeric ? 'text-right' : 'text-left', column.key === 'invoice_number' || column.key === 'balance_amount' ? 'font-medium text-gray-900 dark:text-white' : '']">
                {{ columnValue(item, column.key) }}
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-right text-sm">
                <NuxtLink
                  v-if="item.student?.id"
                  :to="`/students/${item.student.id}/fee-ledger`"
                  class="font-medium text-indigo-600 hover:text-indigo-700"
                >
                  View &amp; Collect
                </NuxtLink>
                <span v-else class="text-gray-400">Unavailable</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!items.length && !loading && !errorMessage" class="p-6 text-sm text-gray-500 dark:text-gray-400">
          No due invoices match these filters.
        </p>
        <Pagination
          v-if="pagination.total > 0 && !loading"
          :pagination="pagination"
          item-label="invoices"
          @page-changed="changePage"
          @page-size-changed="changePageSize"
        />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { FeeInvoices } from '~/api';
import { AcademicYears } from '~/api/academic/academic-years';
import Pagination from '~/components/ui/Pagination.vue';
import { useExportService } from '~/composables/useExportService';
import { usePrintReport } from '~/composables/usePrintReport';
import { useToast } from '~/composables/useToast';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useAcademics } from '~/composables/useAcademics';
import { getFeeDueDateRange } from '~/utils/feeDueDateRange';
import { apiErrorMessage } from '~/utils/list-response';

const { selectedBranchId, branchScopeParams } = useGlobalBranch();
const { generateReport, isGenerating } = useExportService();
const { printReport, openPrintWindow } = usePrintReport();
const { showToast } = useToast();
const { classes, sections, fetchClasses, fetchSections } = useAcademics();
const showColumnSelector = ref(false);
const isPrinting = ref(false);
const availableColumns = ref([
  { key: 'invoice_number', label: 'Invoice', visible: true },
  { key: 'student_name', label: 'Student', visible: true },
  { key: 'admission_number', label: 'Admission No.', visible: true },
  { key: 'class', label: 'Class', visible: true },
  { key: 'section', label: 'Section', visible: true },
  { key: 'branch', label: 'Branch', visible: true },
  { key: 'fee_type', label: 'Fee type', visible: true },
  { key: 'due_date', label: 'Due date', visible: true },
  { key: 'total_amount', label: 'Total', visible: true, numeric: true },
  { key: 'paid_amount', label: 'Paid', visible: true, numeric: true },
  { key: 'discount_amount', label: 'Discount', visible: true, numeric: true },
  { key: 'late_fee_amount', label: 'Late fee (included)', visible: true, numeric: true },
  { key: 'balance_amount', label: 'Due amount', visible: true, numeric: true },
  { key: 'status', label: 'Status', visible: true }
]);
const visibleColumns = computed(() => availableColumns.value.filter(column => column.visible));
const exportFormats = [
  { value: 'csv', label: 'CSV' },
  { value: 'excel', label: 'Excel' },
  { value: 'pdf', label: 'PDF' }
];
const items = ref<any[]>([]);
const loading = ref(false);
const errorMessage = ref('');
const academicYears = ref<{ id?: string; name: string; is_current?: boolean }[]>([]);
const summary = ref({ total_amount: 0, paid_amount: 0, discount_amount: 0, balance_amount: 0 });
const pagination = reactive({ page: 1, limit: 25, total: 0 });
const dueWindow = ref('all');
const filters = reactive({
  search: '',
  class_id: '',
  section_id: '',
  academic_year: '',
  status: '',
  due_from: '',
  due_to: ''
});
const selectedClassName = computed(() => classes.value.find(classItem => classItem.id === filters.class_id)?.name || '');
const selectedSectionName = computed(() => sections.value.find(section => section.id === filters.section_id)?.name || '');
const applyDueWindow = () => {
  if (dueWindow.value === 'custom') return;
  Object.assign(filters, getFeeDueDateRange(dueWindow.value));
};
const selectCustomDueDate = () => {
  dueWindow.value = 'custom';
};
const fetchAcademicYears = async () => {
  try {
    const response = await AcademicYears.getDropdown();
    academicYears.value = Array.isArray(response.data) ? response.data : [];
  } catch {
    academicYears.value = [];
  }
};
const exportDueInvoices = async (format: string) => {
  try {
    await generateReport({
      report_type: 'fees',
      format,
      filters: {
        ...branchScopeParams.value,
        status: filters.status || 'overdue,sent,partial_paid',
        search: filters.search || undefined,
        class_id: filters.class_id || undefined,
        section_id: filters.section_id || undefined,
        academic_year: filters.academic_year || undefined,
        due_from: filters.due_from || undefined,
        due_to: filters.due_to || undefined
      },
      columns: visibleColumns.value.map(({ key, label }) => ({ key, header: label }))
    });
  } catch (error) {
    console.error('Failed to export due invoices:', error);
  }
};
const selectAllColumns = () => {
  availableColumns.value.forEach(column => { column.visible = true; });
};
const resetColumns = () => {
  availableColumns.value.forEach(column => { column.visible = true; });
};
const columnValue = (item: any, key: string) => {
  switch (key) {
    case 'invoice_number': return item.invoice_number || item.id;
    case 'student_name': return studentName(item.student);
    case 'admission_number': return item.student?.admission_number || '—';
    case 'class': return item.class_name || item.student?.current_class || '—';
    case 'section': return item.section || item.student?.section || '—';
    case 'branch': return item.branch?.name || item.student?.branch?.name || '—';
    case 'fee_type': return item.feeStructure?.feeType?.name || item.fee_type_name || '—';
    case 'due_date': return formatDate(item.due_date);
    case 'total_amount': return formatCurrency(item.total_amount);
    case 'paid_amount': return formatCurrency(item.paid_amount);
    case 'discount_amount': return formatCurrency(item.discount_amount);
    case 'late_fee_amount': return item.late_fee_amount != null ? formatCurrency(item.late_fee_amount) : item.is_late_fee_applied ? 'Amount not itemized' : formatCurrency(0);
    case 'balance_amount': return formatCurrency(item.balance_amount);
    case 'status': return formatStatus(item.status || item.payment_status);
    default: return '—';
  }
};
const printDueInvoices = async () => {
  const printWindow = openPrintWindow();
  if (!printWindow) {
    showToast('Please allow popups to print due invoices', 'error');
    return;
  }
  isPrinting.value = true;
  try {
    const data = items.value.map(item => ({
      invoice_number: item.invoice_number || item.id,
      student_name: studentName(item.student),
      admission_number: item.student?.admission_number || '',
      class: item.class_name || item.student?.current_class || '',
      section: item.section || item.student?.section || '',
      branch: item.branch?.name || item.student?.branch?.name || '',
      fee_type: item.feeStructure?.feeType?.name || item.fee_type_name || '',
      due_date: item.due_date,
      total_amount: item.total_amount,
      paid_amount: item.paid_amount,
      discount_amount: item.discount_amount,
      late_fee_amount: item.late_fee_amount ?? 0,
      balance_amount: item.balance_amount,
      status: formatStatus(item.status || item.payment_status)
    }));
    await printReport({
      title: 'Due Invoices',
      data,
      columns: visibleColumns.value.map(({ key, label }) => ({ key, header: label })),
      filters: {
        Status: filters.status || 'All due statuses',
        Student: filters.search || 'All students',
        Class: selectedClassName.value || 'All classes',
        Section: selectedSectionName.value || 'All sections',
        'Academic year': filters.academic_year || 'All years',
        Page: `${pagination.page} of ${Math.max(1, Math.ceil(pagination.total / pagination.limit))} (current page only)`
      },
      reportType: 'fees'
    }, { autoPrint: true, printWindow });
  } catch (error) {
    printWindow.close();
    showToast('Unable to prepare due invoice printout', 'error');
    console.error('Failed to print due invoices:', error);
  } finally {
    isPrinting.value = false;
  }
};
const load = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response = await FeeInvoices.getReport({
      page: pagination.page,
      limit: pagination.limit,
      status: filters.status || 'overdue,sent,partial_paid',
      search: filters.search || undefined,
      class_id: filters.class_id || undefined,
      section_id: filters.section_id || undefined,
      academic_year: filters.academic_year || undefined,
      due_from: filters.due_from || undefined,
      due_to: filters.due_to || undefined,
      ...branchScopeParams.value
    });
    const result = response.data;
    items.value = result.invoices || [];
    summary.value = result.summary || { total_amount: 0, paid_amount: 0, discount_amount: 0, balance_amount: 0 };
    pagination.page = result.pagination.current_page;
    pagination.total = result.pagination.total_records;
  } catch (error: any) {
    errorMessage.value = apiErrorMessage(error);
    items.value = [];
    summary.value = { total_amount: 0, paid_amount: 0, discount_amount: 0, balance_amount: 0 };
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  pagination.page = 1;
  load();
};

const resetFilters = () => {
  dueWindow.value = 'all';
  Object.assign(filters, { search: '', class_id: '', section_id: '', academic_year: '', status: '', due_from: '', due_to: '' });
  applyFilters();
};

const changePage = (page: number) => {
  pagination.page = page;
  load();
};

const changePageSize = (limit: number) => {
  pagination.limit = Number(limit);
  pagination.page = 1;
  load();
};

watch(() => filters.class_id, async classId => {
  filters.section_id = '';
  sections.value = [];
  if (classId) {
    await fetchSections({ classId, branchId: selectedBranchId.value || undefined });
  }
});

watch(selectedBranchId, async () => {
  filters.class_id = '';
  filters.section_id = '';
  sections.value = [];
  pagination.page = 1;
  await fetchClasses({ branchId: selectedBranchId.value || undefined }).catch(() => {});
  load();
});

const formatStatus = (status: string) => {
  if (status === 'partial_paid' || status === 'partial') return 'Partially paid';
  if (status === 'sent') return 'Pending';
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending';
};

const formatCurrency = (amount: any) =>
  `₹${(Number(amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (value: string) => value ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN') : '—';
const studentName = (student: any) => [student?.first_name, student?.last_name].filter(Boolean).join(' ') || 'Unknown student';

fetchAcademicYears();
fetchClasses({ branchId: selectedBranchId.value || undefined }).catch(() => {});
load();
</script>
