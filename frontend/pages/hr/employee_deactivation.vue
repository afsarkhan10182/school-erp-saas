<template>
  <div class="min-h-screen bg-gray-50/50 dark:bg-gray-900 p-6 space-y-6">
    <!-- Header Banner -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ShieldAlert class="w-6 h-6 text-rose-500" />
          Employee Login Deactivation
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage and toggle staff and employee portal login access and authentication status.
        </p>
      </div>
    </div>

    <!-- Filter Card ("Select Ground") -->
    <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm space-y-4">
      <h2 class="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700/50 pb-3">
        Select Ground
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- School Selector -->
        <div v-if="showSchoolDropdown">
          <label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            School <span class="text-rose-500">*</span>
          </label>
          <select
            v-model="selectedSchoolId"
            class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            @change="changeSchool"
          >
            <option value="">Select School</option>
            <option v-for="s in schoolOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </div>

        <!-- Branch Selector -->
        <div v-if="showBranchDropdown">
          <label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            Branch <span class="text-rose-500">*</span>
          </label>
          <select
            v-model="selectedBranchId"
            class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            @change="fetchEmployees"
          >
            <option value="">All Branches</option>
            <option v-for="b in branchOptions" :key="b.value" :value="b.value">{{ b.label }}</option>
          </select>
        </div>

        <!-- Role Selector -->
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            Role <span class="text-rose-500">*</span>
          </label>
          <select
            v-model="selectedRole"
            class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            @change="fetchEmployees"
          >
            <option value="">All Roles</option>
            <option value="admin font">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="accountant">Accountant</option>
            <option value="librarian">Librarian</option>
            <option value="receptionist">Receptionist</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Staff List Card -->
    <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden space-y-4">
      <div class="p-6 pb-0 flex items-center justify-between">
        <h2 class="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Users class="w-5 h-5 text-indigo-500" />
          Employee List
        </h2>
        <span v-if="employees.length" class="text-xs font-medium text-gray-500 dark:text-gray-400">
          Showing {{ employees.length }} employee(s)
        </span>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="p-12 text-center text-gray-500 dark:text-gray-400">
        <div class="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3"></div>
        Loading employees list...
      </div>

      <!-- Employees Table -->
      <div v-else-if="employees.length" class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <th class="px-4 py-3.5 w-10">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  class="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                  @change="toggleSelectAll"
                />
              </th>
              <th class="px-4 py-3.5 w-14">Photo</th>
              <th class="px-4 py-3.5">Employee Name</th>
              <th class="px-4 py-3.5">Role</th>
              <th class="px-4 py-3.5">Designation</th>
              <th class="px-4 py-3.5">Department</th>
              <th class="px-4 py-3.5">Email</th>
              <th class="px-4 py-3.5">Mobile No</th>
              <th class="px-4 py-3.5">Login Status</th>
              <th class="px-4 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700/50 text-sm">
            <tr
              v-for="emp in employees"
              :key="emp.id"
              class="hover:bg-gray-50/50 dark:hover:bg-gray-750 transition-colors"
            >
              <td class="px-4 py-3.5">
                <input
                  v-model="selectedEmployeeIds"
                  type="checkbox"
                  :value="emp.id"
                  class="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                />
              </td>
              <td class="px-4 py-3.5">
                <div class="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs">
                  {{ emp.first_name ? emp.first_name[0] : 'E' }}
                </div>
              </td>
              <td class="px-4 py-3.5 font-semibold text-gray-900 dark:text-white">
                {{ emp.first_name }} {{ emp.last_name || '' }}
              </td>
              <td class="px-4 py-3.5 text-gray-600 dark:text-gray-300 capitalize">
                {{ emp.role || '—' }}
              </td>
              <td class="px-4 py-3.5 text-gray-600 dark:text-gray-300">
                {{ emp.designation || emp.designation_name || '—' }}
              </td>
              <td class="px-4 py-3.5 text-gray-600 dark:text-gray-300">
                {{ emp.department || emp.department_name || '—' }}
              </td>
              <td class="px-4 py-3.5 text-gray-600 dark:text-gray-300">
                {{ emp.email || '—' }}
              </td>
              <td class="px-4 py-3.5 text-gray-600 dark:text-gray-300 font-mono text-xs">
                {{ emp.phone || emp.mobile || '—' }}
              </td>
              <td class="px-4 py-3.5">
                <span
                  class="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1"
                  :class="emp.status === 'inactive' || emp.status === 'disabled'
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="emp.status === 'inactive' || emp.status === 'disabled' ? 'bg-rose-500' : 'bg-emerald-500'"></span>
                  {{ emp.status === 'inactive' || emp.status === 'disabled' ? 'Deactivated' : 'Active' }}
                </span>
              </td>
              <td class="px-4 py-3.5 text-right">
                <button
                  v-if="emp.status === 'inactive' || emp.status === 'disabled'"
                  class="px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800"
                  @click="toggleEmployeeStatus(emp, 'active')"
                >
                  Activate
                </button>
                <button
                  v-else
                  class="px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg transition-colors border border-rose-200 dark:border-rose-800"
                  @click="toggleEmployeeStatus(emp, 'inactive')"
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
          <Users class="w-8 h-8" />
        </div>
        <p class="text-base font-medium text-gray-900 dark:text-white">No employees found</p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Select branch or role above to filter employee records.</p>
      </div>

      <!-- Footer Bulk Action Controls -->
      <div v-if="employees.length" class="p-4 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Selected: <strong class="text-gray-900 dark:text-white">{{ selectedEmployeeIds.length }}</strong> of {{ employees.length }}
        </div>
        <div class="flex items-center gap-3">
          <button
            :disabled="!selectedEmployeeIds.length"
            class="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition-all shadow-sm flex items-center gap-1.5"
            @click="bulkToggleStatus('active')"
          >
            <Unlock class="w-3.5 h-3.5" />
            Authentication Activate
          </button>
          <button
            :disabled="!selectedEmployeeIds.length"
            class="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white transition-all shadow-sm flex items-center gap-1.5"
            @click="bulkToggleStatus('inactive')"
          >
            <Lock class="w-3.5 h-3.5" />
            Authentication Deactivate
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ShieldAlert, Users, Lock, Unlock } from 'lucide-vue-next';
import { useSchoolBranchScope } from '~/composables/useSchoolBranchScope';
import { Users as UsersApi } from '~/api/administration/users';
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

const selectedRole = ref('');
const employees = ref<any[]>([]);
const loading = ref(false);
const selectedEmployeeIds = ref<string[]>([]);

const isAllSelected = computed(() => {
  return employees.value.length > 0 && selectedEmployeeIds.value.length === employees.value.length;
});

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedEmployeeIds.value = [];
  } else {
    selectedEmployeeIds.value = employees.value.map(e => e.id);
  }
};

const fetchEmployees = async () => {
  loading.value = true;
  try {
    const params: any = {
      ...scopeParams.value,
      limit: 500
    };
    if (selectedRole.value) params.role = selectedRole.value;

    const res: any = await UsersApi.getAll(params);
    const list = Array.isArray(res.data) ? res.data : Array.isArray(res.users) ? res.users : [];
    // filter out student / parent roles
    const staffRoles = new Set(['super_admin', 'admin', 'branch_admin', 'accountant', 'teacher', 'librarian', 'receptionist']);
    employees.value = list.filter((u: any) => staffRoles.has(u.role));
  } catch (error) {
    console.error('Error fetching employees:', error);
    employees.value = [];
  } finally {
    loading.value = false;
  }
};

const changeSchool = async () => {
  await onSchoolChange();
  await fetchEmployees();
};

const toggleEmployeeStatus = async (emp: any, status: 'active' | 'inactive') => {
  try {
    await DynamicEntities.create('employee_deactivation', {
      user_id: emp.id,
      status
    });
    emp.status = status;
  } catch (error) {
    console.error('Failed to update employee status:', error);
  }
};

const bulkToggleStatus = async (status: 'active' | 'inactive') => {
  for (const id of selectedEmployeeIds.value) {
    const emp = employees.value.find(e => e.id === id);
    if (emp) {
      await toggleEmployeeStatus(emp, status);
    }
  }
  selectedEmployeeIds.value = [];
};

onMounted(async () => {
  await loadScope();
  await fetchEmployees();
});
</script>
