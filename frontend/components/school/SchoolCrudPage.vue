<template>
  <div v-if="!entity" class="p-8">
    <p class="text-sm text-red-600">Unknown screen: {{ entityKey }}</p>
  </div>
  <div v-else class="space-y-6 max-w-full">
    <!-- Page Header & Filter Controls -->
    <div
      class="bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 rounded-2xl shadow-sm p-6"
    >
      <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        <div>
          <h1
            class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5"
          >
            <span
              class="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl"
            >
              <Layers class="w-5 h-5" />
            </span>
            {{ entity.title }}
          </h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ entity.description }}</p>
        </div>

        <div class="flex flex-wrap items-end gap-3">
          <!-- Class Selector -->
          <div v-if="hasClassFilter" class="flex-1 min-w-[150px]">
            <label
              class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5"
            >
              Class
            </label>
            <EnhancedDropdown
              v-model="selectedClassId"
              :options="classOptions"
              placeholder="All classes"
              id="entity-class-filter"
              @change="onClassFilterChange"
            />
          </div>

          <!-- Section Selector -->
          <div v-if="hasClassFilter && selectedClassId" class="flex-1 min-w-[140px]">
            <label
              class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5"
            >
              Section
            </label>
            <EnhancedDropdown
              v-model="selectedSectionId"
              :options="sectionOptions"
              placeholder="All sections"
              id="entity-section-filter"
              @change="reload"
            />
          </div>

          <!-- Add Button -->
          <div class="self-end">
            <button
              class="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200 whitespace-nowrap"
              @click="openCreate"
            >
              <Plus class="w-4 h-4" />
              Add {{ entity.title }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="['visitor', 'enquiry'].includes(props.entityKey)" class="max-w-md">
      <label :for="`${props.entityKey}-search`" class="sr-only">Search {{ entity.title }}</label>
      <input
        :id="`${props.entityKey}-search`"
        v-model="searchTerm"
        type="search"
        :placeholder="props.entityKey === 'visitor' ? 'Search visitor name, phone, or purpose' : 'Search student, parent, phone, or follow-up'"
        class="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />
    </div>

    <div v-if="props.entityKey === 'visitor'" class="flex flex-wrap items-center gap-2">
      <div class="relative">
        <button
          type="button"
          aria-label="Visitor list columns"
          :aria-expanded="showVisitorColumns"
          class="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-700 dark:border-gray-600 dark:text-gray-200"
          @click="showVisitorColumns = !showVisitorColumns"
        >
          Columns
        </button>
        <div
          v-if="showVisitorColumns"
          class="absolute left-0 z-20 mt-2 max-h-72 w-56 overflow-y-auto rounded-md border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-600 dark:bg-gray-800"
        >
          <div class="mb-2 flex justify-between text-xs">
            <button
              type="button"
              class="text-indigo-600 hover:underline"
              @click="setVisitorColumns(true)"
            >
              Select all
            </button>
            <button
              type="button"
              class="text-indigo-600 hover:underline"
              @click="setVisitorColumns(false)"
            >
              Reset
            </button>
          </div>
          <label
            v-for="column in visitorColumns"
            :key="column.key"
            class="flex items-center gap-2 py-1 text-sm text-gray-700 dark:text-gray-200"
          >
            <input
              v-model="column.visible"
              type="checkbox"
              :disabled="column.visible && visibleColumns.length === 1"
            />
            {{ column.label }}
          </label>
        </div>
      </div>
      <button
        v-for="format in ['csv', 'excel', 'pdf']"
        :key="format"
        type="button"
        class="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-700 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
        :disabled="!pagination.total || isGenerating"
        @click="exportVisitors(format)"
      >
        {{ isGenerating ? 'Preparing…' : format.toUpperCase() }}
      </button>
      <button
        type="button"
        class="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-700 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
        :disabled="!pagination.total || isPrinting"
        @click="printVisitors"
      >
        {{ isPrinting ? 'Preparing…' : 'Print' }}
      </button>
    </div>

    <div v-if="props.entityKey === 'enquiry'" class="flex flex-wrap items-center gap-2">
      <div class="relative">
        <button
          type="button"
          aria-label="Admission enquiry list columns"
          :aria-expanded="showEnquiryColumns"
          class="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-700 dark:border-gray-600 dark:text-gray-200"
          @click="showEnquiryColumns = !showEnquiryColumns"
        >Columns</button>
        <div v-if="showEnquiryColumns" class="absolute left-0 z-20 mt-2 max-h-72 w-56 overflow-y-auto rounded-md border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-600 dark:bg-gray-800">
          <label v-for="column in enquiryColumns" :key="column.key" class="flex items-center gap-2 py-1 text-sm text-gray-700 dark:text-gray-200">
            <input v-model="column.visible" type="checkbox" :disabled="column.visible && visibleColumns.length === 1" />
            {{ column.label }}
          </label>
        </div>
      </div>
      <button
        v-for="format in ['csv', 'excel', 'pdf']"
        :key="format"
        type="button"
        class="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-700 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
        :disabled="!pagination.total || isGenerating"
        @click="exportEnquiries(format)"
      >{{ isGenerating ? 'Preparing…' : format.toUpperCase() }}</button>
      <button
        type="button"
        class="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-700 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
        :disabled="!pagination.total || isPrinting"
        @click="printEnquiries"
      >{{ isPrinting ? 'Preparing…' : 'Print' }}</button>
    </div>

    <!-- Error Alert -->
    <div
      v-if="errorMessage"
      class="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800/80 p-4 text-sm text-red-700 dark:text-red-300 flex items-center justify-between shadow-sm"
    >
      <span class="font-medium">{{ errorMessage }}</span>
      <button
        class="px-3.5 py-1.5 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded-xl text-xs font-semibold hover:bg-red-200 transition-colors flex items-center gap-1.5"
        @click="reload"
      >
        <RefreshCw class="w-3.5 h-3.5" />
        Retry
      </button>
    </div>

    <!-- Table Container -->
    <div
      class="bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 shadow-sm rounded-2xl overflow-hidden"
    >
      <p
        v-if="!loading && items.length > 0"
        class="px-4 pt-3 pb-1 text-xs text-gray-500 dark:text-gray-400 sm:hidden"
      >
        Swipe the table horizontally to review every field and its actions.
      </p>
      <div
        v-if="loading"
        class="p-12 text-center text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-3"
      >
        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
        Loading records…
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700/60">
          <thead class="bg-gray-50/80 dark:bg-gray-800">
            <tr>
              <th
                v-for="col in visibleColumns"
                :key="col.key"
                class="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 min-w-[140px]"
              >
                {{ col.label }}
              </th>
              <th
                class="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 min-w-[160px] sticky right-0 bg-gray-50/95 dark:bg-gray-800 backdrop-blur-sm shadow-xs"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700/60 bg-white dark:bg-gray-800">
            <tr
              v-for="item in items"
              :key="item.id"
              class="hover:bg-gray-50/60 dark:hover:bg-gray-700/40 transition-colors"
            >
              <td
                v-for="col in visibleColumns"
                :key="col.key"
                class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                {{ display(item, col.key) }}
              </td>
              <td
                class="px-6 py-4 text-sm whitespace-nowrap text-right space-x-2 sticky right-0 bg-white dark:bg-gray-800 shadow-sm"
              >
                <button
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors border border-amber-200 dark:border-amber-900/50"
                  @click="openEdit(item)"
                >
                  <Pencil class="w-3.5 h-3.5" />
                  Edit
                </button>
                <template v-for="action in entity.actions || []" :key="action.id">
                  <button
                    v-if="
                      (props.entityKey !== 'admission_application' ||
                        !item.status ||
                        item.status === 'pending') &&
                      (action.id !== 'checkout' || item.status !== 'exited')
                    "
                    class="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors border border-indigo-200 dark:border-indigo-900/50"
                    @click="runAction(item.id, action.id)"
                  >
                    {{ action.label }}
                  </button>
                </template>
                <button
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors border border-red-200 dark:border-red-900/50"
                  @click="openDelete(item.id)"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="!items.length && !errorMessage" class="p-12 text-center space-y-3">
          <div
            class="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto text-gray-400"
          >
            <Layers class="w-6 h-6" />
          </div>
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
            {{ searchTerm.trim() ? 'No records match your search' : 'No records found' }}
          </p>
          <p v-if="searchTerm.trim()" class="text-xs text-gray-500 dark:text-gray-500">
            Try a different search or clear the current filter.
          </p>
          <button
            v-if="searchTerm.trim()"
            type="button"
            class="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            @click="searchTerm = ''"
          >
            Clear search
          </button>
          <p v-else class="text-xs text-gray-500 dark:text-gray-500">
            Click the button above to add your first record.
          </p>
        </div>
      </div>
    </div>

    <Pagination
      :pagination="pagination"
      item-label="records"
      @page-changed="page = $event"
      @page-size-changed="pageSize = $event"
    />

    <!-- Add/Edit Modal Dialog -->
    <div
      v-if="showForm"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div
          class="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-700 pb-3"
        >
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">
            {{ editingId ? 'Edit' : 'Add' }} {{ entity.title }}
          </h2>
          <button
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            @click="showForm = false"
          >
            ✕
          </button>
        </div>

        <div
          v-for="field in entity.fields"
          v-show="fieldVisible(field)"
          :key="field.key"
          class="mb-4"
        >
          <label
            class="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
          >
            {{ field.label }} <span v-if="fieldRequired(field)" class="text-red-500">*</span>
          </label>

          <!-- Textarea Field -->
          <textarea
            v-if="field.type === 'textarea'"
            v-model="form[field.key]"
            :required="fieldRequired(field)"
            rows="3"
            class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />

          <!-- Select Field -->
          <EnhancedDropdown
            v-else-if="field.type === 'select'"
            v-model="form[field.key]"
            :options="fieldOptions(field)"
            :placeholder="`Select ${field.label}`"
            :required="fieldRequired(field)"
            :id="`${props.entityKey}-${field.key}`"
            class="w-full"
          />
          <!-- Checkbox Field -->
          <div v-else-if="field.type === 'checkbox'" class="flex items-center gap-2">
            <input
              v-model="form[field.key]"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{
              field.label
            }}</span>
          </div>

          <!-- Standard Input Field -->
          <input
            v-else
            v-model="form[field.key]"
            :type="field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'"
            :required="fieldRequired(field)"
            class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>

        <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <button
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            @click="showForm = false"
          >
            Cancel
          </button>
          <button
            class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            @click="save"
          >
            Save
          </button>
        </div>
      </div>
    </div>

    <Modal :show="Boolean(pendingDeleteId)" size="sm" @close="pendingDeleteId = null">
      <template #header>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          Delete {{ entity.title }}?
        </h2>
      </template>
      <template #body>
        <p class="text-sm text-gray-600 dark:text-gray-300">
          This action cannot be undone. The selected record will be permanently removed.
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            @click="pendingDeleteId = null"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
            @click="confirmDelete"
          >
            Delete
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<!-- SchoolCrudPage component -->

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { MODULE_ENTITY_DEFINITIONS, type EntityField } from '~/config/entity-definitions';
import { hasClassLookup } from '~/utils/hasClassLookup';
import { DynamicEntities } from '~/api/shared/dynamic-entities';
import { Students } from '~/api/students';
import { Classes } from '~/api/academic/classes';
import { Users } from '~/api/administration/users';
import { useToast } from '~/composables/useToast';
import { useAuth } from '~/composables/useAuth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { extractList, apiErrorMessage } from '~/utils/list-response';
import Modal from '~/components/ui/Modal.vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import Pagination from '~/components/ui/Pagination.vue';
import { Plus, Pencil, Trash2, RefreshCw, Layers } from 'lucide-vue-next';
import { useExportService } from '~/composables/useExportService';
import { usePrintReport } from '~/composables/usePrintReport';
import { Export } from '~/api/shared/export';

const props = defineProps<{ entityKey: string }>();
const { showToast } = useToast();
const { generateReport, isGenerating } = useExportService();
const { printReport, openPrintWindow } = usePrintReport();
const { user } = useAuth();
const { selectedBranchId, currentSchool, isSuperAdmin } = useGlobalBranch();
const entity = computed(() => MODULE_ENTITY_DEFINITIONS[props.entityKey]);
const hasClassFilter = computed(() => hasClassLookup(entity.value));
const items = ref<any[]>([]);
const loading = ref(false);
const errorMessage = ref('');
const showForm = ref(false);
const editingId = ref<string | null>(null);
const pendingDeleteId = ref<string | null>(null);
const page = ref(1);
const pageSize = ref(10);
const searchTerm = ref('');
const showVisitorColumns = ref(false);
const showEnquiryColumns = ref(false);
const isPrinting = ref(false);
const visitorColumns = ref([
  { key: 'visitor_name', label: 'Visitor Name', visible: true },
  { key: 'phone', label: 'Phone', visible: true },
  { key: 'purpose', label: 'Purpose', visible: true },
  { key: 'in_time', label: 'In-Time', visible: true },
  { key: 'out_time', label: 'Out-Time', visible: true },
  { key: 'status', label: 'Status', visible: true }
]);
const enquiryColumns = ref([
  { key: 'student_name', label: 'Student Name', visible: true },
  { key: 'parent_name', label: 'Parent Name', visible: true },
  { key: 'phone', label: 'Phone', visible: true },
  { key: 'enquiry_date', label: 'Enquiry Date', visible: true },
  { key: 'interested_class', label: 'Interested Class', visible: true },
  { key: 'follow_up', label: 'Follow-up', visible: true },
  { key: 'status', label: 'Status', visible: true }
]);
const visibleColumns = computed(() =>
  props.entityKey === 'visitor'
    ? visitorColumns.value.filter(column => column.visible)
    : props.entityKey === 'enquiry'
      ? enquiryColumns.value.filter(column => column.visible)
      : entity.value?.columns || []
);
const pagination = reactive({ page: 1, limit: 10, total: 0, totalPages: 1 });
const form = reactive<Record<string, any>>({});
const fieldVisible = (field: EntityField) =>
  !field.visibleWhen || form[field.visibleWhen.key] === field.visibleWhen.value;
const fieldRequired = (field: EntityField) =>
  !!field.required ||
  (!!field.requiredWhen && form[field.requiredWhen.key] === field.requiredWhen.value);
const classOptions = ref<Array<{ label: string; value: string }>>([]);
const sectionOptions = ref<Array<{ label: string; value: string }>>([]);
const selectedClassId = ref('');
const selectedSectionId = ref('');
const studentOptions = ref<Array<{ label: string; value: string }>>([]);
const userOptions = ref<Array<{ label: string; value: string }>>([]);
const staffOptions = ref<Array<{ label: string; value: string }>>([]);
const entityOptions = ref<Record<string, Array<{ label: string; value: string }>>>({});
const selectedSchoolId = computed(() => currentSchool.value?.id || user.value?.school_id || '');

const errText = (error: any) => apiErrorMessage(error);

const display = (item: any, key: string) => {
  if (key === 'student' && item.student) {
    return `${item.student.first_name} ${item.student.last_name || ''}`.trim();
  }
  if (key === 'class' && item.class) return item.class.name;
  const visitorValues: Record<string, string> = {
    visitor_name: 'title',
    phone: 'reference_no',
    purpose: 'notes',
    in_time: 'createdAt',
    out_time: 'exit_time'
  };
  const enquiryValues: Record<string, unknown> = {
    student_name: item.title,
    parent_name: item.parent_name,
    phone: item.reference_no,
    enquiry_date: item.date_value || item.created_at || item.createdAt,
    interested_class: item.class?.name || item.class_id_label || '',
    follow_up: item.notes
  };
  const value =
    props.entityKey === 'visitor' && key === 'in_time'
      ? item.createdAt || item.created_at
      : props.entityKey === 'enquiry'
        ? enquiryValues[key] ?? item[key]
        : item[props.entityKey === 'visitor' ? visitorValues[key] || key : key];
  if (
    props.entityKey === 'visitor' &&
    ['createdAt', 'exit_time', 'in_time', 'out_time'].includes(key) &&
    value
  ) {
    const timestamp = new Date(value);
    return Number.isNaN(timestamp.getTime()) ? '—' : timestamp.toLocaleString();
  }
  if (props.entityKey === 'enquiry' && key === 'enquiry_date' && value) {
    const timestamp = new Date(String(value));
    return Number.isNaN(timestamp.getTime()) ? '—' : timestamp.toLocaleDateString();
  }
  if (value && typeof value === 'object') return value.name || value.email || '';
  return value ?? '—';
};

const fieldOptions = (field: EntityField) => {
  if (field.lookup === 'classes') return classOptions.value;
  if (field.lookup === 'students') return studentOptions.value;
  if (field.lookup === 'users') return userOptions.value;
  if (field.lookup === 'staff') return staffOptions.value;
  if (field.lookup?.startsWith('entity:')) return entityOptions.value[field.lookup.slice(7)] || [];
  return field.options || [];
};

const loadLookups = async () => {
  if (!entity.value) return;
  try {
    const needs = entity.value.fields.map(f => f.lookup).filter(Boolean);
    const entityNeeds = needs
      .filter((lookup): lookup is `entity:${string}` => Boolean(lookup?.startsWith('entity:')))
      .map(lookup => lookup.slice(7));
    await Promise.all(
      entityNeeds.map(async entityKey => {
        const res: any = await DynamicEntities.list(entityKey, scopeParams.value);
        entityOptions.value[entityKey] = extractList(res, ['records']).map((item: any) => ({
          label: item.title,
          value: item.id
        }));
      })
    );

    if (hasClassFilter.value) await loadClassesForBranch();

    if (needs.includes('students')) {
      const res: any = await Students.getAll({ limit: 200 });
      studentOptions.value = extractList(res, ['students']).map((s: any) => ({
        label: `${s.first_name} ${s.last_name || ''} (${s.admission_number})`,
        value: s.id
      }));
    }
    if (needs.includes('users') || needs.includes('staff')) {
      const res: any = await Users.getAll({ limit: 200 });
      const users = extractList(res, ['users']);
      userOptions.value = users.map((u: any) => ({
        label: `${u.first_name} ${u.last_name || ''}`.trim(),
        value: u.id
      }));
      const staffRoles = new Set([
        'super_admin',
        'admin',
        'branch_admin',
        'accountant',
        'teacher',
        'librarian',
        'receptionist'
      ]);
      staffOptions.value = users
        .filter((u: any) => staffRoles.has(u.role))
        .map((u: any) => ({ label: `${u.first_name} ${u.last_name || ''}`.trim(), value: u.id }));
    }
  } catch (error: any) {
    console.warn('Lookup load failed', errText(error));
  }
};

const loadClassesForBranch = async () => {
  if (!hasClassFilter.value) {
    classOptions.value = [];
    return;
  }
  try {
    const params = new URLSearchParams();
    if (selectedSchoolId.value) params.set('school_id', selectedSchoolId.value);
    if (selectedBranchId.value) params.set('branch_id', selectedBranchId.value);
    const res: any = await Classes.getDropdown(params.toString());
    const list = extractList(res, ['classes']);
    const classes = list.length ? list : Array.isArray(res?.data) ? res.data : [];
    classOptions.value = classes.map((c: any) => ({
      label: c.name,
      value: c.id
    }));
  } catch (error: any) {
    console.warn('Class lookup load failed', errText(error));
  }
};

const onClassFilterChange = async () => {
  selectedSectionId.value = '';
  if (selectedClassId.value) {
    try {
      const res: any = await Classes.getSections(selectedClassId.value);
      const list = extractList(res, ['sections']);
      sectionOptions.value = list.map((s: any) => ({ label: s.name, value: s.id }));
    } catch {
      sectionOptions.value = [];
    }
  } else {
    sectionOptions.value = [];
  }
  await reload();
};

const load = async () => {
  if (!entity.value) return;
  if (isSuperAdmin.value && !selectedSchoolId.value) {
    items.value = [];
    errorMessage.value = 'Select a school';
    return;
  }
  loading.value = true;
  errorMessage.value = '';
  try {
    const res: any = await DynamicEntities.list(props.entityKey, {
      ...scopeParams.value,
      ...(['visitor', 'enquiry'].includes(props.entityKey) && searchTerm.value.trim()
        ? { search: searchTerm.value.trim() }
        : {}),
      page: page.value,
      limit: pageSize.value
    });
    items.value = extractList(res, ['records']);
    Object.assign(
      pagination,
      res?.data?.pagination || {
        page: page.value,
        limit: pageSize.value,
        total: items.value.length,
        totalPages: 1
      }
    );
  } catch (error: any) {
    errorMessage.value = errText(error);
    items.value = [];
  } finally {
    loading.value = false;
  }
};

const scopeParams = computed(() => ({
  ...(isSuperAdmin.value && selectedSchoolId.value ? { school_id: selectedSchoolId.value } : {}),
  ...(selectedBranchId.value ? { branch_id: selectedBranchId.value } : {}),
  ...(hasClassFilter.value && selectedClassId.value ? { class_id: selectedClassId.value } : {}),
  ...(hasClassFilter.value && selectedSectionId.value
    ? { section_id: selectedSectionId.value }
    : {})
}));

watch([page, pageSize], () => load());
const searchVisitors = useDebounceFn(() => {
  page.value = 1;
  load();
}, 300);
watch(searchTerm, () => {
  if (['visitor', 'enquiry'].includes(props.entityKey)) searchVisitors();
});

const visitorExportOptions = (format: string) => ({
  report_type: 'visitors',
  format,
  filters: { ...scopeParams.value, search: searchTerm.value.trim() },
  columns: visibleColumns.value.map(({ key, label }) => ({ key, header: label }))
});
const enquiryExportOptions = (format: string) => ({
  report_type: 'admission_enquiries',
  format,
  filters: { ...scopeParams.value, search: searchTerm.value.trim() },
  columns: visibleColumns.value.map(({ key, label }) => ({ key, header: label }))
});
const exportVisitors = async (format: string) => {
  try {
    await generateReport(visitorExportOptions(format));
  } catch {
    // useExportService already reports export failures.
  }
};
const printVisitors = async () => {
  const printWindow = openPrintWindow();
  if (!printWindow) return showToast('Please allow popups to print the visitor register', 'error');
  isPrinting.value = true;
  try {
    const options = visitorExportOptions('print');
    const response = await Export.exportData({
      report_type: options.report_type,
      format: 'print',
      ...options.filters,
      columns: JSON.stringify(options.columns)
    });
    const responseData = JSON.parse(await response.data.text());
    const report = responseData.data?.data || responseData.data || responseData;
    const escapeHtml = (value: unknown) =>
      String(value ?? '').replace(
        /[&<>"']/g,
        character =>
          ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
          })[character] || character
      );
    const data = report.data.map((row: Record<string, unknown>) =>
      Object.fromEntries(visibleColumns.value.map(({ key }) => [key, escapeHtml(row[key])]))
    );
    await printReport(
      {
        title: report.title,
        data,
        columns: options.columns,
        filters: { Search: escapeHtml(searchTerm.value.trim() || 'All visitors') },
        reportType: 'visitors'
      },
      { autoPrint: true, printWindow, showSummary: false }
    );
  } catch (error) {
    printWindow.close();
    showToast('Unable to prepare the visitor register printout', 'error');
    console.error('Failed to print visitor register:', error);
  } finally {
    isPrinting.value = false;
  }
};
const exportEnquiries = async (format: string) => {
  try {
    await generateReport(enquiryExportOptions(format));
  } catch {
    // useExportService already reports export failures.
  }
};
const printEnquiries = async () => {
  const printWindow = openPrintWindow();
  if (!printWindow) return showToast('Please allow popups to print admission enquiries', 'error');
  isPrinting.value = true;
  try {
    const options = enquiryExportOptions('print');
    const response = await Export.exportData({
      report_type: options.report_type,
      format: 'print',
      ...options.filters,
      columns: JSON.stringify(options.columns)
    });
    const responseData = JSON.parse(await response.data.text());
    const report = responseData.data?.data || responseData.data || responseData;
    const escapeHtml = (value: unknown) =>
      String(value ?? '').replace(/[&<>"']/g, character =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] || character
      );
    const data = report.data.map((row: Record<string, unknown>) =>
      Object.fromEntries(visibleColumns.value.map(({ key }) => [key, escapeHtml(row[key])]))
    );
    await printReport(
      {
        title: report.title,
        data,
        columns: options.columns,
        filters: { Search: escapeHtml(searchTerm.value.trim() || 'All enquiries') },
        reportType: 'admission_enquiries'
      },
      { autoPrint: true, printWindow, showSummary: false }
    );
  } catch (error) {
    printWindow.close();
    showToast('Unable to prepare the admission enquiry printout', 'error');
    console.error('Failed to print admission enquiries:', error);
  } finally {
    isPrinting.value = false;
  }
};
const setVisitorColumns = (visible: boolean) => {
  visitorColumns.value.forEach(column => {
    column.visible = visible;
  });
  if (!visible) visitorColumns.value[0].visible = true;
};

const reload = async () => {
  page.value = 1;
  await Promise.all([load(), loadLookups()]);
};

const openCreate = () => {
  editingId.value = null;
  Object.keys(form).forEach(k => delete form[k]);
  showForm.value = true;
};

const openEdit = (item: any) => {
  editingId.value = item.id;
  Object.keys(form).forEach(k => delete form[k]);
  Object.assign(form, item);
  showForm.value = true;
};

const save = async () => {
  try {
    const missing = entity.value?.fields.find(
      field => fieldVisible(field) && fieldRequired(field) && !String(form[field.key] || '').trim()
    );
    if (missing) return showToast(`${missing.label} is required`, 'error');
    const payload = Object.fromEntries(
      (entity.value?.fields || []).map(({ key }) => [key, form[key]])
    );
    if (props.entityKey === 'account' && form.account_type === 'cash') {
      payload.bank_name = '';
      payload.bank_branch = '';
      payload.reference_no = '';
    }
    if (selectedSchoolId.value) payload.school_id = selectedSchoolId.value;
    if (selectedBranchId.value) payload.branch_id = selectedBranchId.value;
    entity.value?.fields
      .filter(field => field.type === 'select' && field.lookup && payload[field.key])
      .forEach(field => {
        payload[`${field.key}_label`] =
          fieldOptions(field).find(option => option.value === payload[field.key])?.label || '';
      });
    if (!payload.title && payload.first_name) {
      payload.title = `${payload.first_name} ${payload.last_name || ''}`.trim();
    }
    if (!payload.title && payload.name) payload.title = payload.name;
    if (editingId.value) {
      await DynamicEntities.update(props.entityKey, editingId.value, payload);
    } else {
      await DynamicEntities.create(props.entityKey, payload);
    }
    showForm.value = false;
    await load();
    showToast('Saved', 'success');
  } catch (error: any) {
    showToast(errText(error), 'error');
  }
};

const openDelete = (id: string) => {
  pendingDeleteId.value = id;
};

const confirmDelete = async () => {
  if (!pendingDeleteId.value) return;
  const id = pendingDeleteId.value;
  pendingDeleteId.value = null;
  try {
    await DynamicEntities.remove(props.entityKey, id);
    await load();
    showToast('Deleted', 'success');
  } catch (error: any) {
    showToast(errText(error), 'error');
  }
};

const runAction = async (id: string, action: string) => {
  try {
    await DynamicEntities.action(props.entityKey, id, action);
    await load();
    showToast('Updated', 'success');
  } catch (error: any) {
    showToast(errText(error), 'error');
  }
};

watch(
  () => props.entityKey,
  () => {
    selectedClassId.value = '';
    selectedSectionId.value = '';
    sectionOptions.value = [];
    reload();
  }
);

watch(selectedBranchId, () => {
  selectedClassId.value = '';
  selectedSectionId.value = '';
  sectionOptions.value = [];
  loadClassesForBranch();
  reload();
});

watch(currentSchool, () => {
  selectedClassId.value = '';
  selectedSectionId.value = '';
  sectionOptions.value = [];
  loadClassesForBranch();
  reload();
});

onMounted(async () => {
  await reload();
});
</script>
