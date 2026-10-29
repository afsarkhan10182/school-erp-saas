<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Library</h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage books and student issues for the selected branch.
          </p>
        </div>
        <div class="flex gap-2">
          <label
            class="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm rounded-lg cursor-pointer"
          >
            Import CSV · preview first
            <input type="file" accept=".csv,text/csv" class="hidden" aria-label="Select library books CSV" :disabled="saving" @change="previewBooksImport" />
          </label>
          <button
            class="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm rounded-lg"
            @click="openIssue"
          >
            Issue book
          </button>
          <button
            class="px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
            @click="openBook"
          >
            Add book
          </button>
        </div>
      </div>

      <section class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800" aria-labelledby="library-requests-title">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 id="library-requests-title" class="text-sm font-semibold text-gray-900 dark:text-white">Book requests</h2>
          <label class="sr-only" for="library-request-status">Filter requests by status</label>
          <select id="library-request-status" v-model="requestStatus" class="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-900" @change="loadRequests">
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <p v-if="requestError" role="alert" class="mt-3 text-sm text-red-600">{{ requestError }}</p>
        <p v-else-if="!requests.length" class="mt-3 text-sm text-gray-500">No book requests for this branch.</p>
        <div v-else class="mt-3 divide-y divide-gray-200 dark:divide-gray-700">
          <div v-for="request in requests" :key="request.id" class="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-gray-900 dark:text-white">{{ request.book?.title || 'Book' }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ studentName(request.student) }} · {{ request.student?.admission_number || 'No admission number' }} · {{ formatImportDate(request.created_at || request.createdAt) }}</p>
              <p class="text-xs font-medium capitalize text-indigo-700 dark:text-indigo-300">{{ request.status }}</p>
            </div>
            <div class="flex shrink-0 gap-2">
              <template v-if="['pending', 'approved'].includes(request.status)">
                <button v-if="request.status === 'pending'" type="button" class="rounded-md border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-700" :disabled="saving" @click="decideRequest(request, 'approved')">Approve</button>
                <button v-if="request.status === 'approved'" type="button" class="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50" :disabled="saving" @click="fulfillRequest(request)">Issue book</button>
                <button type="button" class="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 disabled:opacity-50" :disabled="saving" @click="decideRequest(request, 'rejected')">Reject</button>
              </template>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800" aria-labelledby="library-import-history-title">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 id="library-import-history-title" class="text-sm font-semibold text-gray-900 dark:text-white">Recent CSV imports</h2>
          <span v-if="importHistory.length" class="text-xs text-gray-500">Last {{ importHistory.length }} runs</span>
        </div>
        <p v-if="importHistoryError" role="status" class="mt-2 text-sm text-amber-800 dark:text-amber-200">{{ importHistoryError }}</p>
        <p v-else-if="!importHistory.length" class="mt-2 text-sm text-gray-500 dark:text-gray-400">No library CSV imports for this school or branch.</p>
        <div v-else class="mt-3 divide-y divide-gray-200 dark:divide-gray-700">
          <div v-for="batch in importHistory" :key="batch.id" class="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-gray-900 dark:text-white">{{ batch.file_name }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ batch.branch?.name || 'Branch' }} · {{ batch.successful_rows }} of {{ batch.total_rows }} books · {{ formatImportDate(batch.created_at) }} · {{ batch.status === 'undone' ? 'Undone' : 'Completed' }}
              </p>
            </div>
            <button v-if="batch.undo_ready" type="button" class="shrink-0 rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 disabled:opacity-50 dark:border-red-800 dark:text-red-300" :disabled="undoingBatchId === batch.id" @click="pendingUndoBatch = batch">
              {{ undoingBatchId === batch.id ? 'Undoing…' : 'Undo import' }}
            </button>
          </div>
        </div>
      </section>

      <section
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg overflow-x-auto"
      >
        <header
          class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex flex-wrap items-center gap-3">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Books</h2>
            <div role="group" aria-label="Book catalog view" class="flex rounded-lg border border-gray-300 dark:border-gray-600">
              <button
                type="button"
                aria-label="List view"
                :aria-pressed="bookView === 'list'"
                class="rounded-l-lg px-3 py-1.5 text-xs"
                :class="bookView === 'list' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-gray-600 dark:text-gray-300'"
                @click="bookView = 'list'"
              >
                List
              </button>
              <button
                type="button"
                aria-label="Grid view"
                :aria-pressed="bookView === 'grid'"
                class="rounded-r-lg border-l border-gray-300 px-3 py-1.5 text-xs dark:border-gray-600"
                :class="bookView === 'grid' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-gray-600 dark:text-gray-300'"
                @click="bookView = 'grid'"
              >
                Grid
              </button>
            </div>
            <EnhancedDropdown
              v-model="categoryFilter"
              :options="categoryOptions"
              placeholder="All categories"
            />
          </div>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              v-model="bookSearch"
              type="search"
              aria-label="Search library books"
              placeholder="Search title, author, ISBN, or category"
              class="w-full sm:w-72 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
            <span class="whitespace-nowrap text-xs text-gray-500">
              {{ filteredBooks.length }} of {{ books.length }} books
            </span>
          </div>
          <div class="relative flex flex-wrap gap-2">
            <div class="relative">
              <button
                type="button"
                :aria-expanded="showColumnSelector"
                aria-controls="library-column-selector"
                class="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-700 dark:border-gray-600 dark:text-gray-200"
                @click="showColumnSelector = !showColumnSelector"
              >
                List columns
              </button>
              <div
                v-if="showColumnSelector"
                id="library-column-selector"
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
              </div>
            </div>
            <button
              type="button"
              :disabled="isPrinting || loading || !filteredBooks.length"
              class="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-700 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
              @click="printLibrary"
            >
              {{ isPrinting ? 'Preparing…' : 'Print' }}
            </button>
            <button
              v-for="format in ['csv', 'excel', 'pdf']"
              :key="format"
              type="button"
              :aria-label="`Export library as ${format.toUpperCase()}`"
              :disabled="isGenerating"
              class="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-700 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
              @click="exportLibrary(format)"
            >
              {{ format.toUpperCase() }}
            </button>
          </div>
        </header>
        <div v-if="loading" class="p-6 text-sm text-gray-500 dark:text-gray-400">
          Loading library...
        </div>
        <table v-else-if="bookView === 'list'" class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700/60">
            <tr>
              <th v-for="column in visibleColumns" :key="column.key" scope="col" :aria-sort="column.sortable ? bookSortAria(column.key) : undefined" class="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                <button v-if="column.sortable" type="button" @click="toggleBookSort(column.key)">
                  {{ column.label }} {{ bookSortIndicator(column.key) }}
                </button>
                <span v-else>{{ column.label }}</span>
              </th>
              <th
                class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="item in pageBooks"
              :key="item.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/40"
            >
              <td v-for="column in visibleColumns" :key="column.key" class="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                {{ libraryBookColumnValue(item, column.key) }}
              </td>
              <td class="px-4 py-3 text-sm text-right">
                <button
                  class="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  @click="openBook(item)"
                >
                  Edit
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          <article
            v-for="item in pageBooks"
            :key="item.id"
            class="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
          >
            <div class="flex items-start justify-between gap-3">
              <h3 class="font-medium text-gray-900 dark:text-white">{{ item.title }}</h3>
              <button
                type="button"
                class="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                @click="openBook(item)"
              >
                Edit
              </button>
            </div>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">{{ item.author || 'Unknown author' }}</p>
            <p class="mt-3 text-xs text-gray-500">{{ item.isbn || 'No ISBN' }} · {{ item.category || 'Uncategorised' }}</p>
            <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">Available: {{ item.available }} / {{ item.quantity }}</p>
          </article>
        </div>
        <Pagination
          v-if="!loading && filteredBooks.length"
          :pagination="{ page: currentPage, limit: pageSize, total: filteredBooks.length }"
          item-label="books"
          @page-changed="currentPage = $event"
          @page-size-changed="changeBookPageSize"
        />
        <p
          v-if="!loading && !filteredBooks.length"
          class="p-6 text-sm text-gray-500 dark:text-gray-400"
        >
          {{
            books.length ? 'No books match your search or category.' : 'No books for this branch.'
          }}
        </p>
      </section>

      <section
        ref="issuesSection"
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg overflow-x-auto"
      >
        <header
          class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
        >
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Issued Books</h2>
          <span class="text-xs text-gray-500">{{ issues.length }} records</span>
        </header>
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700/60">
            <tr>
              <th
                class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400"
              >
                Book
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400"
              >
                Borrower
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400"
              >
                Issued
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400"
              >
                Due
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400"
              >
                Fine
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400"
              >
                Status
              </th>
              <th
                class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500 dark:text-gray-400"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="item in issues"
              :key="item.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/40"
            >
              <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
                {{ item.book?.title || '-' }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                <div>{{ borrowerName(item) }}</div>
                <div class="text-xs text-gray-500 capitalize">
                  {{ item.borrower_type || 'student' }}
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                {{ item.issue_date }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                {{ item.due_date }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                ₹{{ item.fine_amount || 0 }}
              </td>
              <td
                class="px-4 py-3 text-sm capitalize"
                :class="
                  issueStatus(item) === 'overdue'
                    ? 'font-medium text-red-600'
                    : 'text-gray-600 dark:text-gray-300'
                "
              >
                {{ issueStatus(item) }}
              </td>
              <td class="px-4 py-3 text-sm text-right">
                <button
                  v-if="item.status !== 'returned'"
                  class="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  @click="returnBook(item.id)"
                >
                  Return
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!issues.length" class="p-6 text-sm text-gray-500 dark:text-gray-400">
          No issued books for this branch.
        </p>
      </section>

      <div
        v-if="bookImportPreview"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="library-import-title"
      >
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
          <h2 id="library-import-title" class="text-lg font-semibold text-gray-900 dark:text-white">Review library CSV</h2>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {{ bookImportPreview.valid_rows }} valid · {{ bookImportPreview.invalid_rows }} invalid · {{ bookImportPreview.total_rows }} total. No books are saved until you confirm.
          </p>
          <p v-if="bookImportPreview.total_rows > bookImportPreview.preview_rows.length" class="mt-1 text-xs text-gray-500">
            Showing the first {{ bookImportPreview.preview_rows.length }} rows.
          </p>
          <div class="mt-4 overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-700 text-left">
                <tr><th class="p-2">Row</th><th class="p-2">Title</th><th class="p-2">Author</th><th class="p-2">ISBN</th><th class="p-2">Category</th><th class="p-2">Qty</th><th class="p-2">Validation</th></tr>
              </thead>
              <tbody>
                <tr v-for="row in bookImportPreview.preview_rows" :key="row.row_number" class="border-t border-gray-200 dark:border-gray-700">
                  <td class="p-2">{{ row.row_number }}</td><td class="p-2">{{ row.title }}</td><td class="p-2">{{ row.author || '—' }}</td><td class="p-2">{{ row.isbn || '—' }}</td><td class="p-2">{{ row.category || '—' }}</td><td class="p-2">{{ row.quantity }}</td>
                  <td class="p-2" :class="row.errors.length ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'">{{ row.errors.join(', ') || 'Ready' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button type="button" class="px-3 py-2 text-sm text-gray-700 dark:text-gray-200" :disabled="saving" @click="clearBookImportPreview">Cancel</button>
            <button type="button" class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg disabled:opacity-50" :disabled="saving || !pendingBookImportFile || !bookImportPreview.valid_rows || bookImportPreview.invalid_rows" @click="confirmBooksImport">
              {{ saving ? 'Importing…' : `Import ${bookImportPreview.valid_rows} books` }}
            </button>
          </div>
          <p v-if="bookImportPreview.invalid_rows" class="mt-2 text-sm text-amber-800 dark:text-amber-200">Correct the invalid CSV rows and preview the file again before importing.</p>
        </div>
      </div>

      <ConfirmDialog
        :show="Boolean(pendingUndoBatch)"
        title="Undo this library import?"
        :message="`This permanently removes ${pendingUndoBatch?.successful_rows || 0} books from this import only if they have not been edited or issued. Imports with any issue history cannot be undone.`"
        confirm-label="Undo import"
        @close="pendingUndoBatch = null"
        @confirm="undoLibraryImport"
      />

      <div
        v-if="showBook"
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      >
        <div
          class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 w-full max-w-md shadow-xl"
        >
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {{ editingBookId ? 'Edit book' : 'Add book' }}
          </h2>
          <label class="label">Book title *</label
          ><input v-model.trim="bookForm.title" class="input" placeholder="Book title" required />
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
            <div>
              <label class="label">ISBN</label
              ><input v-model.trim="bookForm.isbn" class="input" placeholder="ISBN number" />
            </div>
            <div>
              <div class="flex justify-between">
                <label class="label">Category</label
                ><NuxtLink to="/library/library_category" class="text-xs text-indigo-600"
                  >Manage</NuxtLink
                >
              </div>
              <EnhancedDropdown
                v-model="bookForm.category"
                :options="bookCategoryOptions"
                placeholder="Select category"
              />
            </div>
            <div>
              <label class="label">Author</label
              ><input v-model.trim="bookForm.author" class="input" placeholder="Author" />
            </div>
            <div>
              <label class="label">Publisher</label
              ><input v-model.trim="bookForm.publisher" class="input" placeholder="Publisher" />
            </div>
            <div>
              <label class="label">Edition</label
              ><input v-model.trim="bookForm.edition" class="input" placeholder="Edition" />
            </div>
            <div>
              <label class="label">Purchase date</label
              ><input v-model="bookForm.purchase_date" type="date" class="input" />
            </div>
            <div>
              <label class="label">Purchase price</label
              ><input
                v-model.number="bookForm.purchase_price"
                type="number"
                min="0"
                class="input"
                placeholder="Purchase price"
              />
            </div>
            <div>
              <label class="label">Sale price</label
              ><input
                v-model.number="bookForm.sale_price"
                type="number"
                min="0"
                class="input"
                placeholder="Sale price"
              />
            </div>
            <div>
              <label class="label">Cover image URL</label
              ><input
                v-model.trim="bookForm.cover_image"
                class="input"
                placeholder="Cover image path/URL"
              />
            </div>
            <div>
              <label class="label">Total stock *</label
              ><input
                v-model.number="bookForm.quantity"
                type="number"
                min="1"
                class="input"
                placeholder="Quantity"
                required
              />
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-4">
            <button
              class="px-3 py-2 text-sm text-gray-700 dark:text-gray-200"
              @click="showBook = false"
            >
              Cancel
            </button>
            <button
              class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg disabled:opacity-50"
              :disabled="saving"
              @click="saveBook"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="showIssue"
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      >
        <div
          class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 w-full max-w-md shadow-xl"
        >
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Issue book</h2>
          <EnhancedDropdown
            v-model="issueForm.book_id"
            :options="bookOptions"
            label="Book"
            placeholder="Select book"
            class="mb-3"
          />
          <label class="label">Borrower type *</label>
          <EnhancedDropdown
            v-model="issueForm.borrower_type"
            :options="borrowerTypeOptions"
            placeholder="Select borrower type"
            class="mb-3"
          />
          <EnhancedDropdown
            v-if="issueForm.borrower_type === 'student'"
            v-model="issueForm.student_id"
            :options="studentOptions"
            label="Student"
            placeholder="Select student"
            class="mb-3"
          />
          <EnhancedDropdown
            v-else-if="issueForm.borrower_type !== 'other'"
            v-model="issueForm.user_id"
            :options="borrowerUserOptions"
            :label="issueForm.borrower_type === 'parent' ? 'Parent login' : 'Staff login'"
            placeholder="Select borrower"
            class="mb-3"
          />
          <div v-else>
            <label class="label">Borrower name *</label
            ><input
              v-model.trim="issueForm.borrower_name"
              class="input"
              placeholder="Borrower name"
            />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">Issue date *</label
              ><input v-model="issueForm.issue_date" type="date" class="input" />
            </div>
            <div>
              <label class="label">Due date *</label
              ><input
                v-model="issueForm.due_date"
                type="date"
                :min="issueForm.issue_date"
                class="input"
              />
            </div>
          </div>
          <label class="label">Fine per day</label
          ><input
            v-model.number="issueForm.fine_per_day"
            type="number"
            min="0"
            class="input"
            placeholder="0"
          />
          <div class="flex justify-end gap-2 mt-4">
            <button
              class="px-3 py-2 text-sm text-gray-700 dark:text-gray-200"
              @click="showIssue = false"
            >
              Cancel
            </button>
            <button
              class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg disabled:opacity-50"
              :disabled="saving"
              @click="saveIssue"
            >
              Issue
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import { Library } from '~/api/students/academic-services';
import { useAuth } from '~/composables/useAuth';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { useToast } from '~/composables/useToast';
import { useExportService } from '~/composables/useExportService';
import { usePrintReport } from '~/composables/usePrintReport';
import { DynamicEntities } from '~/api/shared/dynamic-entities';
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue';
import { extractList, apiErrorMessage } from '~/utils/list-response';
import {
  escapeLibraryPrintValue,
  filterLibraryBooks,
  libraryBookColumnValue,
  paginateLibraryBooks,
  sortLibraryBooks
} from '~/utils/filterLibraryBooks.js';

const { showToast } = useToast();
const { generateReport, isGenerating } = useExportService();
const { printReport, openPrintWindow } = usePrintReport();
const route = useRoute();
const { user } = useAuth();
const { branchScopeParams, selectedBranchId, currentSchool } = useGlobalBranch();
const isSuperAdmin = computed(() => user.value?.role === 'super_admin');
const books = ref<any[]>([]);
const issues = ref<any[]>([]);
const issuesSection = ref<HTMLElement | null>(null);
const students = ref<any[]>([]);
const users = ref<any[]>([]);
const categories = ref<string[]>([]);
const bookSearch = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const bookView = ref<'list' | 'grid'>('list');
const sortField = ref('title');
const sortDirection = ref('asc');
watch(selectedBranchId, () => {
  load();
});

watch(currentSchool, () => {
  load();
});
const showBook = ref(false);
const showIssue = ref(false);
const showColumnSelector = ref(false);
const isPrinting = ref(false);
const loading = ref(false);
const saving = ref(false);
const editingBookId = ref('');
const pendingBookImportFile = ref<File | null>(null);
const bookImportPreview = ref<any>(null);
const pendingBookImportScope = ref('');
const importHistory = ref<any[]>([]);
const importHistoryError = ref('');
const requests = ref<any[]>([]);
const requestStatus = ref('');
const requestError = ref('');
const pendingUndoBatch = ref<any>(null);
const undoingBatchId = ref('');
const categoryFilter = ref('');
const availableColumns = ref([
  { key: 'title', label: 'Title', visible: true, sortable: true },
  { key: 'author', label: 'Author', visible: true, sortable: true },
  { key: 'isbn', label: 'ISBN', visible: true },
  { key: 'category', label: 'Category', visible: true },
  { key: 'publisher', label: 'Publisher', visible: true },
  { key: 'edition', label: 'Edition', visible: true },
  { key: 'quantity', label: 'Quantity', visible: true },
  { key: 'available', label: 'Available', visible: true, sortable: true },
  { key: 'purchase_date', label: 'Purchase date', visible: true },
  { key: 'purchase_price', label: 'Purchase price', visible: true },
  { key: 'sale_price', label: 'Sale price', visible: true }
]);
const visibleColumns = computed(() => availableColumns.value.filter(column => column.visible));
watch([bookSearch, categoryFilter], () => {
  currentPage.value = 1;
});
const emptyBook = () => ({
  title: '',
  isbn: '',
  category: '',
  author: '',
  publisher: '',
  edition: '',
  purchase_date: '',
  purchase_price: '',
  sale_price: '',
  cover_image: '',
  quantity: 1
});
const bookForm = ref(emptyBook());
const issueForm = ref({
  book_id: '',
  borrower_type: 'student',
  student_id: '',
  user_id: '',
  borrower_name: '',
  issue_date: '',
  due_date: '',
  fine_per_day: 0
});

const branchParams = () => ({ ...branchScopeParams.value });
const bookOptions = computed(() =>
  books.value
    .filter(b => Number(b.available) > 0)
    .map(b => ({ value: b.id, label: `${b.title} (${b.available})` }))
);
const categoryOptions = computed(() => [
  { value: '', label: 'All categories' },
  ...categories.value.map(category => ({ value: category, label: category }))
]);
const bookCategoryOptions = computed(() => {
  const values = bookForm.value.category && !categories.value.includes(bookForm.value.category)
    ? [bookForm.value.category, ...categories.value]
    : categories.value;
  return [{ value: '', label: 'Select category' }, ...values.map(category => ({ value: category, label: category }))];
});
const borrowerTypeOptions = [
  { value: 'student', label: 'Student' },
  { value: 'staff', label: 'Staff' },
  { value: 'parent', label: 'Parent' },
  { value: 'other', label: 'Other' }
];
const filteredBooks = computed(() =>
  sortLibraryBooks(
    filterLibraryBooks(books.value, { category: categoryFilter.value, query: bookSearch.value }),
    sortField.value,
    sortDirection.value
  )
);
// shortcut: all branch books load before paging; move paging to the API if catalog size becomes costly.
const pageBooks = computed(() =>
  paginateLibraryBooks(filteredBooks.value, currentPage.value, pageSize.value)
);
const studentOptions = computed(() =>
  students.value.map(s => ({
    value: s.id,
    label: `${s.first_name} ${s.last_name || ''} (${s.admission_number})`
  }))
);
const studentName = (s: any) => (s ? `${s.first_name} ${s.last_name || ''}`.trim() : '-');
const borrowerName = (issue: any) => issue.borrower_name || studentName(issue.student);
const borrowerUserOptions = computed(() =>
  users.value
    .filter((u: any) =>
      issueForm.value.borrower_type === 'parent'
        ? u.role === 'parent'
        : !['student', 'parent'].includes(u.role)
    )
    .map((u: any) => ({
      value: u.id,
      label: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email
    }))
);
const issueStatus = (issue: any) =>
  issue.status === 'issued' && issue.due_date < new Date().toISOString().slice(0, 10)
    ? 'overdue'
    : issue.status;
const formatImportDate = (value: string) => new Date(value).toLocaleString();

const load = async () => {
  loading.value = true;
  currentPage.value = 1;
  try {
    const params = branchParams();
    const [b, i, s, c, u]: any[] = await Promise.all([
      Library.getBooks(params),
      Library.getIssues(params),
      Library.getStudents(params),
      DynamicEntities.list('library_category', params),
      Library.getBorrowers(params)
    ]);
    books.value = extractList(b, ['books']);
    issues.value = extractList(i, ['issues']);
    students.value = extractList(s, ['students']);
    categories.value = extractList(c, ['records', 'items'])
      .map((item: any) => item.title)
      .filter(Boolean);
    users.value = extractList(u, ['users']);
    await loadRequests();
    importHistoryError.value = '';
    try {
      const history: any = await Library.getImportHistory(params);
      importHistory.value = extractList(history, ['batches']);
    } catch {
      importHistory.value = [];
      importHistoryError.value = 'Import history is unavailable. Apply the library import-history migration and retry.';
    }
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  } finally {
    loading.value = false;
  }
};

const loadRequests = async () => {
  requestError.value = '';
  try {
    const response: any = await Library.getRequests({ ...branchParams(), ...(requestStatus.value ? { status: requestStatus.value } : {}) });
    requests.value = extractList(response, ['requests']);
  } catch (error: any) {
    requests.value = [];
    requestError.value = apiErrorMessage(error);
  }
};

const decideRequest = async (request: any, status: 'approved' | 'rejected') => {
  saving.value = true;
  try {
    await Library.decideRequest(request.id, { status });
    await load();
    showToast(status === 'approved' ? 'Request approved; one copy reserved' : 'Request rejected', 'success');
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  } finally {
    saving.value = false;
  }
};

const fulfillRequest = async (request: any) => {
  saving.value = true;
  try {
    await Library.fulfillRequest(request.id);
    await load();
    showToast('Book issued to student', 'success');
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  } finally {
    saving.value = false;
  }
};

const undoLibraryImport = async () => {
  const batch = pendingUndoBatch.value;
  if (!batch || undoingBatchId.value) return;
  undoingBatchId.value = batch.id;
  try {
    const result: any = await Library.undoImportHistory(batch.id, branchParams());
    pendingUndoBatch.value = null;
    showToast(result.message || 'Library import undone.', 'success');
    await load();
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  } finally {
    undoingBatchId.value = '';
  }
};

const changeBookPageSize = (limit: number) => {
  pageSize.value = Number(limit) || 10;
  currentPage.value = 1;
};

const exportLibrary = async (format: string) => {
  await generateReport({
    report_type: 'library',
    format,
    filters: {
      ...branchParams(),
      search: bookSearch.value.trim(),
      category: categoryFilter.value
    },
    columns: visibleColumns.value.map(({ key, label }) => ({ key, header: label }))
  });
};

const selectAllColumns = () => {
  availableColumns.value.forEach(column => { column.visible = true; });
};
const resetColumns = selectAllColumns;
const printLibrary = async () => {
  const printWindow = openPrintWindow();
  if (!printWindow) {
    showToast('Please allow popups to print the library catalog', 'error');
    return;
  }
  isPrinting.value = true;
  try {
    const data = filteredBooks.value.map(book => Object.fromEntries(
      visibleColumns.value.map(({ key }) => [
        key,
        escapeLibraryPrintValue(libraryBookColumnValue(book, key))
      ])
    ));
    await printReport({
      title: 'Library Catalog',
      data,
      columns: visibleColumns.value.map(({ key, label }) => ({ key, header: label })),
      filters: {
        Search: escapeLibraryPrintValue(bookSearch.value.trim() || 'All books'),
        Category: escapeLibraryPrintValue(categoryFilter.value || 'All categories')
      },
      reportType: 'library'
    }, { autoPrint: true, printWindow, showSummary: false });
  } catch (error) {
    printWindow.close();
    showToast('Unable to prepare the library catalog printout', 'error');
    console.error('Failed to print library catalog:', error);
  } finally {
    isPrinting.value = false;
  }
};

const toggleBookSort = (field: string) => {
  sortDirection.value = sortField.value === field && sortDirection.value === 'asc' ? 'desc' : 'asc';
  sortField.value = field;
  currentPage.value = 1;
};
const bookSortIndicator = (field: string) =>
  sortField.value === field ? (sortDirection.value === 'asc' ? '↑' : '↓') : '';
const bookSortAria = (field: string) =>
  sortField.value === field
    ? sortDirection.value === 'asc'
      ? 'ascending'
      : 'descending'
    : 'none';

const openBook = (book?: any) => {
  editingBookId.value = book?.id || '';
  bookForm.value = book ? { ...emptyBook(), ...book } : emptyBook();
  showBook.value = true;
};

const openIssue = () => {
  const today = new Date().toISOString().slice(0, 10);
  const dueDate = new Date(`${today}T00:00:00.000Z`);
  dueDate.setUTCDate(dueDate.getUTCDate() + 14);
  issueForm.value = {
    book_id: '',
    borrower_type: 'student',
    student_id: '',
    user_id: '',
    borrower_name: '',
    issue_date: today,
    due_date: dueDate.toISOString().slice(0, 10),
    fine_per_day: 0
  };
  showIssue.value = true;
};

const saveBook = async () => {
  if (!bookForm.value.title || Number(bookForm.value.quantity) < 1)
    return showToast('Book title and total stock are required', 'error');
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
  const borrowerMissing =
    issueForm.value.borrower_type === 'student'
      ? !issueForm.value.student_id
      : issueForm.value.borrower_type === 'other'
        ? !issueForm.value.borrower_name
        : !issueForm.value.user_id;
  if (!issueForm.value.book_id || borrowerMissing || !issueForm.value.due_date)
    return showToast('Book, borrower and due date are required', 'error');
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

const createBookImportForm = (file: File, scope = branchParams()) => {
  const data = new FormData();
  data.append('csv_file', file);
  Object.entries(scope).forEach(([key, value]) => data.append(key, String(value)));
  return data;
};

const clearBookImportPreview = () => {
  pendingBookImportFile.value = null;
  bookImportPreview.value = null;
  pendingBookImportScope.value = '';
};

const previewBooksImport = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  saving.value = true;
  try {
    const scope = branchParams();
    const res: any = await Library.importBooks(createBookImportForm(file, scope), true);
    pendingBookImportFile.value = file;
    pendingBookImportScope.value = JSON.stringify(scope);
    bookImportPreview.value = res.data;
  } catch (error: any) {
    clearBookImportPreview();
    showToast(apiErrorMessage(error), 'error');
  } finally {
    input.value = '';
    saving.value = false;
  }
};

const confirmBooksImport = async () => {
  if (!pendingBookImportFile.value || !bookImportPreview.value || bookImportPreview.value.invalid_rows) return;
  if (pendingBookImportScope.value !== JSON.stringify(branchParams())) {
    clearBookImportPreview();
    showToast('School or branch changed. Select the CSV and preview it again.', 'error');
    return;
  }
  saving.value = true;
  try {
    const res: any = await Library.importBooks(createBookImportForm(pendingBookImportFile.value));
    await load();
    showToast(`Imported ${res.data?.imported || 0} books`, 'success');
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  } finally {
    clearBookImportPreview();
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
  await load();
  if (route.query.action === 'issue') openIssue();
  if (route.query.action === 'return') {
    await nextTick();
    issuesSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});
</script>

<style scoped>
.input {
  @apply w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 mb-3 text-sm dark:bg-gray-900 dark:text-white;
}
.label {
  @apply block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300;
}
</style>
