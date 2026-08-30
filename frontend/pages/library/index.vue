<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Library</h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage books and student issues for the selected branch.</p>
        </div>
        <div class="flex gap-2">
          <label class="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm rounded-lg cursor-pointer">
            Import CSV
            <input type="file" accept=".csv,text/csv" class="hidden" @change="importBooks" />
          </label>
          <button class="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm rounded-lg" @click="openIssue">Issue book</button>
          <button class="px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700" @click="openBook">Add book</button>
        </div>
      </div>

      <section class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 max-w-md space-y-3">
        <EnhancedDropdown v-if="isSuperAdmin" v-model="selectedSchoolId" :options="schoolOptions" label="School" placeholder="Select school" @change="onSchoolChange" />
        <EnhancedDropdown v-if="branchOptions.length > 1 || isSuperAdmin" v-model="selectedBranchId" :options="branchOptions" label="Branch" placeholder="Select branch" @change="load" />
      </section>

      <section class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg overflow-x-auto">
        <header class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div class="flex items-center gap-3"><h2 class="text-sm font-semibold text-gray-900 dark:text-white">Books</h2><select v-model="categoryFilter" class="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-900"><option value="">All categories</option><option v-for="category in categories" :key="category" :value="category">{{ category }}</option></select></div>
          <span class="text-xs text-gray-500">{{ books.length }} records</span>
        </header>
        <div v-if="loading" class="p-6 text-sm text-gray-500 dark:text-gray-400">Loading library...</div>
        <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700/60">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Title</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Author</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">ISBN / Category</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Publisher / Price</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Available</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="item in filteredBooks" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/40">
              <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{{ item.title }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ item.author || '-' }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300"><div>{{ item.isbn || '-' }}</div><div class="text-xs text-gray-500">{{ item.category || 'Uncategorised' }}</div></td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300"><div>{{ item.publisher || '-' }}</div><div class="text-xs text-gray-500">{{ item.edition || '-' }} · ₹{{ item.purchase_price || 0 }}</div></td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ item.available }} / {{ item.quantity }}</td>
              <td class="px-4 py-3 text-sm text-right">
                <button class="text-sm font-medium text-indigo-600 hover:text-indigo-700" @click="openBook(item)">Edit</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!loading && !books.length" class="p-6 text-sm text-gray-500 dark:text-gray-400">No books for this branch.</p>
      </section>

      <section class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg overflow-x-auto">
        <header class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Issued Books</h2>
          <span class="text-xs text-gray-500">{{ issues.length }} records</span>
        </header>
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700/60">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Book</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Borrower</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Issued</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Due</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Fine</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Status</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="item in issues" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/40">
              <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">{{ item.book?.title || '-' }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300"><div>{{ borrowerName(item) }}</div><div class="text-xs text-gray-500 capitalize">{{ item.borrower_type || 'student' }}</div></td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ item.issue_date }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ item.due_date }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">₹{{ item.fine_amount || 0 }}</td>
              <td class="px-4 py-3 text-sm capitalize" :class="issueStatus(item) === 'overdue' ? 'font-medium text-red-600' : 'text-gray-600 dark:text-gray-300'">{{ issueStatus(item) }}</td>
              <td class="px-4 py-3 text-sm text-right">
                <button v-if="item.status !== 'returned'" class="text-sm font-medium text-indigo-600 hover:text-indigo-700" @click="returnBook(item.id)">Return</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!issues.length" class="p-6 text-sm text-gray-500 dark:text-gray-400">No issued books for this branch.</p>
      </section>

      <div v-if="showBook" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 w-full max-w-md shadow-xl">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">{{ editingBookId ? 'Edit book' : 'Add book' }}</h2>
          <label class="label">Book title *</label><input v-model.trim="bookForm.title" class="input" placeholder="Book title" required />
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
            <div><label class="label">ISBN</label><input v-model.trim="bookForm.isbn" class="input" placeholder="ISBN number" /></div>
            <div><div class="flex justify-between"><label class="label">Category</label><NuxtLink to="/ops/library_category" class="text-xs text-indigo-600">Manage</NuxtLink></div><select v-model="bookForm.category" class="input"><option value="">Select category</option><option v-if="bookForm.category && !categories.includes(bookForm.category)" :value="bookForm.category">{{ bookForm.category }}</option><option v-for="category in categories" :key="category" :value="category">{{ category }}</option></select></div>
            <div><label class="label">Author</label><input v-model.trim="bookForm.author" class="input" placeholder="Author" /></div>
            <div><label class="label">Publisher</label><input v-model.trim="bookForm.publisher" class="input" placeholder="Publisher" /></div>
            <div><label class="label">Edition</label><input v-model.trim="bookForm.edition" class="input" placeholder="Edition" /></div>
            <div><label class="label">Purchase date</label><input v-model="bookForm.purchase_date" type="date" class="input" /></div>
            <div><label class="label">Purchase price</label><input v-model.number="bookForm.purchase_price" type="number" min="0" class="input" placeholder="Purchase price" /></div>
            <div><label class="label">Sale price</label><input v-model.number="bookForm.sale_price" type="number" min="0" class="input" placeholder="Sale price" /></div>
            <div><label class="label">Cover image URL</label><input v-model.trim="bookForm.cover_image" class="input" placeholder="Cover image path/URL" /></div>
            <div><label class="label">Total stock *</label><input v-model.number="bookForm.quantity" type="number" min="1" class="input" placeholder="Quantity" required /></div>
          </div>
          <div class="flex justify-end gap-2 mt-4">
            <button class="px-3 py-2 text-sm text-gray-700 dark:text-gray-200" @click="showBook = false">Cancel</button>
            <button class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg disabled:opacity-50" :disabled="saving" @click="saveBook">Save</button>
          </div>
        </div>
      </div>

      <div v-if="showIssue" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 w-full max-w-md shadow-xl">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Issue book</h2>
          <EnhancedDropdown v-model="issueForm.book_id" :options="bookOptions" label="Book" placeholder="Select book" class="mb-3" />
          <label class="label">Borrower type *</label>
          <select v-model="issueForm.borrower_type" class="input">
            <option value="student">Student</option>
            <option value="staff">Staff</option>
            <option value="parent">Parent</option>
            <option value="other">Other</option>
          </select>
          <EnhancedDropdown v-if="issueForm.borrower_type === 'student'" v-model="issueForm.student_id" :options="studentOptions" label="Student" placeholder="Select student" class="mb-3" />
          <EnhancedDropdown v-else-if="issueForm.borrower_type !== 'other'" v-model="issueForm.user_id" :options="borrowerUserOptions" :label="issueForm.borrower_type === 'parent' ? 'Parent login' : 'Staff login'" placeholder="Select borrower" class="mb-3" />
          <div v-else><label class="label">Borrower name *</label><input v-model.trim="issueForm.borrower_name" class="input" placeholder="Borrower name" /></div>
          <div class="grid grid-cols-2 gap-3"><div><label class="label">Issue date *</label><input v-model="issueForm.issue_date" type="date" class="input" /></div><div><label class="label">Due date *</label><input v-model="issueForm.due_date" type="date" :min="issueForm.issue_date" class="input" /></div></div>
          <label class="label">Fine per day</label><input v-model.number="issueForm.fine_per_day" type="number" min="0" class="input" placeholder="0" />
          <div class="flex justify-end gap-2 mt-4">
            <button class="px-3 py-2 text-sm text-gray-700 dark:text-gray-200" @click="showIssue = false">Cancel</button>
            <button class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg disabled:opacity-50" :disabled="saving" @click="saveIssue">Issue</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { Branches } from '~/api/administration/branches';
import { Schools } from '~/api/administration/schools';
import { Library } from '~/api/students/school-ops';
import { Students } from '~/api/students';
import { Users } from '~/api/administration/users';
import { useAuth } from '~/composables/useAuth';
import { useToast } from '~/composables/useToast';
import { SchoolOps } from '~/api/shared/school-ops';
import { extractList, apiErrorMessage } from '~/utils/list-response';

const { showToast } = useToast();
const { user } = useAuth();
const isSuperAdmin = computed(() => user.value?.role === 'super_admin');
const books = ref<any[]>([]);
const issues = ref<any[]>([]);
const students = ref<any[]>([]);
const users = ref<any[]>([]);
const categories = ref<string[]>([]);
const schoolOptions = ref<any[]>([]);
const selectedSchoolId = ref('');
const branchOptions = ref<any[]>([]);
const selectedBranchId = ref('');
const showBook = ref(false);
const showIssue = ref(false);
const loading = ref(false);
const saving = ref(false);
const editingBookId = ref('');
const categoryFilter = ref('');
const emptyBook = () => ({ title: '', isbn: '', category: '', author: '', publisher: '', edition: '', purchase_date: '', purchase_price: '', sale_price: '', cover_image: '', quantity: 1 });
const bookForm = ref(emptyBook());
const issueForm = ref({ book_id: '', borrower_type: 'student', student_id: '', user_id: '', borrower_name: '', issue_date: '', due_date: '', fine_per_day: 0 });

const branchParams = () => ({
  ...(selectedSchoolId.value ? { school_id: selectedSchoolId.value } : {}),
  ...(selectedBranchId.value ? { branch_id: selectedBranchId.value } : {})
});
const bookOptions = computed(() => books.value.filter(b => Number(b.available) > 0).map(b => ({ value: b.id, label: `${b.title} (${b.available})` })));
const filteredBooks = computed(() => categoryFilter.value ? books.value.filter(book => book.category === categoryFilter.value) : books.value);
const studentOptions = computed(() => students.value.map(s => ({ value: s.id, label: `${s.first_name} ${s.last_name || ''} (${s.admission_number})` })));
const studentName = (s: any) => s ? `${s.first_name} ${s.last_name || ''}`.trim() : '-';
const borrowerName = (issue: any) => issue.borrower_name || studentName(issue.student);
const borrowerUserOptions = computed(() => users.value
  .filter((u: any) => issueForm.value.borrower_type === 'parent' ? u.role === 'parent' : !['student', 'parent'].includes(u.role))
  .map((u: any) => ({ value: u.id, label: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email })));
const issueStatus = (issue: any) => issue.status === 'issued' && issue.due_date < new Date().toISOString().slice(0, 10) ? 'overdue' : issue.status;

const loadSchools = async () => {
  if (!isSuperAdmin.value) return;
  const response: any = await Schools.getAll({ limit: 200, status: 'active' });
  schoolOptions.value = extractList(response, ['schools']).map((s: any) => ({ value: s.id, label: s.name }));
  selectedSchoolId.value = selectedSchoolId.value || schoolOptions.value[0]?.value || '';
};

const loadBranches = async () => {
  const response: any = await Branches.getForDropdown({ status: 'active', ...(selectedSchoolId.value ? { school_id: selectedSchoolId.value } : {}) });
  const branches = extractList(response, ['branches']);
  branchOptions.value = branches.map((b: any) => ({ value: b.id, label: b.name || b.code || b.id }));
  selectedBranchId.value = user.value?.branch_id || (branchOptions.value.length === 1 ? branchOptions.value[0].value : '');
};

const onSchoolChange = async () => {
  selectedBranchId.value = '';
  await loadBranches();
  await load();
};

const load = async () => {
  loading.value = true;
  try {
    const params = branchParams();
    const [b, i, s, c, u]: any[] = await Promise.all([
      Library.getBooks(params),
      Library.getIssues(params),
      Students.getAll({ limit: 200, ...params }),
      SchoolOps.list('library_category', params),
      Users.getAll({ limit: 200, schoolId: selectedSchoolId.value || undefined, branch_id: selectedBranchId.value || undefined })
    ]);
    books.value = extractList(b, ['books']);
    issues.value = extractList(i, ['issues']);
    students.value = extractList(s, ['students']);
    categories.value = extractList(c, ['records', 'items']).map((item: any) => item.title).filter(Boolean);
    users.value = extractList(u, ['users']);
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  } finally {
    loading.value = false;
  }
};

const openBook = (book?: any) => {
  editingBookId.value = book?.id || '';
  bookForm.value = book ? { ...emptyBook(), ...book } : emptyBook();
  showBook.value = true;
};

const openIssue = () => {
  const today = new Date().toISOString().slice(0, 10);
  issueForm.value = { book_id: '', borrower_type: 'student', student_id: '', user_id: '', borrower_name: '', issue_date: today, due_date: today, fine_per_day: 0 };
  showIssue.value = true;
};

const saveBook = async () => {
  if (!bookForm.value.title || Number(bookForm.value.quantity) < 1) return showToast('Book title and total stock are required', 'error');
  saving.value = true;
  try {
    const payload = { ...bookForm.value, ...branchParams() };
    if (editingBookId.value) await Library.updateBook(editingBookId.value, payload);
    else await Library.createBook(payload);
    showBook.value = false;
    await load();
    showToast('Book saved', 'success');
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  } finally {
    saving.value = false;
  }
};

const saveIssue = async () => {
  const borrowerMissing = issueForm.value.borrower_type === 'student'
    ? !issueForm.value.student_id
    : issueForm.value.borrower_type === 'other' ? !issueForm.value.borrower_name : !issueForm.value.user_id;
  if (!issueForm.value.book_id || borrowerMissing || !issueForm.value.due_date) return showToast('Book, borrower and due date are required', 'error');
  saving.value = true;
  try {
    await Library.issueBook({ ...issueForm.value, ...branchParams() });
    showIssue.value = false;
    await load();
    showToast('Issued', 'success');
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  } finally {
    saving.value = false;
  }
};

const importBooks = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  saving.value = true;
  try {
    const data = new FormData();
    data.append('csv_file', file);
    Object.entries(branchParams()).forEach(([key, value]) => data.append(key, String(value)));
    const res: any = await Library.importBooks(data);
    await load();
    showToast(`Imported ${res.data?.imported || 0} books`, 'success');
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  } finally {
    input.value = '';
    saving.value = false;
  }
};

const returnBook = async (id: string) => {
  try {
    await Library.returnBook(id);
    await load();
    showToast('Returned', 'success');
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  }
};

onMounted(async () => {
  await loadSchools();
  await loadBranches();
  await load();
});
</script>

<style scoped>
.input {
  @apply w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 mb-3 text-sm dark:bg-gray-900 dark:text-white;
}
.label { @apply block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300; }
</style>
