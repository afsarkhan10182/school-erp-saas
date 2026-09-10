<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Fee Structures</h1>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Define fee structures for different classes and academic years
          </p>
        </div>
        <button
          @click="openCreateModal"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <PlusIcon class="h-4 w-4 mr-2" />
          Add Fee Structure
        </button>
      </div>



      <!-- Fee Structures List -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-x-auto">
        <div v-if="isLoading" class="p-8 text-center">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"
          ></div>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading fee structures...</p>
        </div>

        <div v-else-if="feeStructures.length === 0" class="p-8 text-center">
          <BanknoteIcon class="mx-auto h-12 w-12 text-gray-400" />
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">No fee structures found.</p>
          <button
            @click="openCreateModal"
            class="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200 dark:text-indigo-400 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40"
          >
            <PlusIcon class="h-4 w-4 mr-2" />
            Create your first fee structure
          </button>
        </div>

        <div v-else>
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Academic Year
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Applicable Classes
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Branch
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Fee Type
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Payment Model
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Amount
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="structure in feeStructures"
                :key="structure.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ structure.academic_year }}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900 dark:text-white">
                    <!-- Show applicable classes if available, otherwise fallback to class_name -->
                    <div
                      v-if="structure.applicable_classes && structure.applicable_classes.length > 0"
                      class="flex flex-wrap gap-1"
                    >
                      <span
                        v-for="className in structure.applicable_classes"
                        :key="className"
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                      >
                        {{ className }}
                      </span>
                    </div>
                    <div v-else class="text-sm text-gray-500 dark:text-gray-400">
                      {{ structure.class_name || 'N/A' }}
                    </div>
                  </div>
                  <div
                    v-if="structure.stream_names"
                    class="text-xs text-gray-500 dark:text-gray-400 mt-1"
                  >
                    {{ structure.stream_names }}
                  </div>
                  <div
                    v-if="structure.section"
                    class="text-xs text-gray-500 dark:text-gray-400 mt-1"
                  >
                    Section: {{ structure.section }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div v-if="structure.branch" class="flex items-center">
                    <span class="font-medium">{{ structure.branch.name }}</span>
                  </div>
                  <div v-else class="text-sm text-gray-500 dark:text-gray-400">All Branches</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ structure.feeType?.name || 'N/A' }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ structure.feeType?.code || '' }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                    :class="{
                      'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400':
                        structure.payment_model === 'installment',
                      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400':
                        structure.payment_model === 'monthly'
                    }"
                  >
                    {{
                      structure.payment_model === 'installment'
                        ? 'Installment-based'
                        : 'Monthly-based'
                    }}
                  </span>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {{
                      structure.payment_model === 'installment'
                        ? structure.installment_count > 1
                          ? `${structure.installment_count} installments`
                          : 'One time'
                        : `₹${structure.monthly_payment_amount}/month`
                    }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    ₹{{ structure.amount }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                    :class="{
                      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400':
                        structure.is_active,
                      'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400':
                        !structure.is_active
                    }"
                  >
                    {{ structure.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    @click="editFeeStructure(structure)"
                    class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    @click="deleteFeeStructure(structure.id)"
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    >
      <div
        class="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800"
      >
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ isEditing ? 'Edit Fee Structure' : 'Create Fee Structure' }}
          </h3>

          <form @submit.prevent="saveFeeStructure">
            <!-- Context Info -->
            <div
              v-if="currentBranch || currentSchool"
              class="mb-6 bg-blue-50 dark:bg-gray-700/50 border border-blue-200 dark:border-gray-600 rounded-lg p-3 flex items-center justify-between"
            >
              <div class="flex items-center space-x-2">
                <span class="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  {{ (currentBranch?.name || currentSchool?.name || 'B').charAt(0).toUpperCase() }}
                </span>
                <div>
                  <span class="text-xs font-semibold text-gray-900 dark:text-white">
                    {{ currentBranch?.name || 'Active Branch' }}
                  </span>
                  <span v-if="currentSchool" class="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    ({{ currentSchool.name }})
                  </span>
                </div>
              </div>
              <span class="text-xs text-gray-400 italic">Top Navigation</span>
            </div>

            <!-- Fee Structure Form -->
            <div class="space-y-4">
              <!-- Academic Year -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Academic Year *</label
                >
                <input
                  :value="currentAcademicYearName"
                  readonly
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                  placeholder="Loading current academic year..."
                />
              </div>

              <!-- Class Dropdown - Updated to Multi-Select -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Applicable Classes *</label
                >
                <div class="relative">
                  <div
                    class="flex flex-wrap gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 dark:bg-gray-700 dark:text-white min-h-[42px]"
                  >
                    <div
                      v-for="className in form.applicable_classes"
                      :key="className"
                      class="flex items-center bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded-md text-sm"
                    >
                      <span>{{ className }}</span>
                      <button
                        type="button"
                        @click="removeClass(className)"
                        class="ml-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
                      >
                        ×
                      </button>
                    </div>
                    <select
                      v-model="selectedClassToAdd"
                      @change="addClass"
                      class="flex-1 bg-transparent border-none outline-none text-sm"
                      :disabled="form.applicable_classes.length >= classes.length"
                    >
                      <option value="">Select classes to add...</option>
                      <option
                        v-for="classItem in availableClassesForSelection"
                        :key="classItem.id"
                        :value="classItem.name"
                      >
                        {{ classItem.name }}
                      </option>
                    </select>
                  </div>
                </div>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Select multiple classes that this fee structure applies to. Students in any of
                  these classes will be assigned this fee structure.
                </p>
                <div
                  v-if="form.applicable_classes.length === 0"
                  class="mt-1 text-xs text-red-600 dark:text-red-400"
                >
                  At least one class must be selected.
                </div>
              </div>

              <!-- Stream Selection - Only when streams are available for selected classes -->
              <div v-if="hasStreamsAvailable">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Stream (Optional)</label
                >
                <select
                  v-model="form.stream_ids"
                  multiple
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option v-for="stream in streams" :key="stream.id" :value="stream.id">
                    {{ stream.name }} ({{ stream.code }})
                  </option>
                </select>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Select streams for the applicable classes. This allows different fees for
                  different streams (e.g., Science IT vs Commerce General). Leave empty to apply to
                  all streams.
                </p>
              </div>

              <!-- Section Dropdown - Only when sections are available for selected classes -->
              <div v-if="hasSectionsAvailable">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Section (Optional)</label
                >
                <select
                  v-model="form.section_id"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Sections (General)</option>
                  <option v-for="section in filteredSections" :key="section.id" :value="section.id">
                    {{ section.name }}
                  </option>
                </select>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {{
                    hasStreamsAvailable && form.stream_ids.length > 0
                      ? 'Sections filtered by selected streams'
                      : 'All available sections for selected classes'
                  }}
                </p>
              </div>

              <!-- Fee Type Dropdown -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Fee Type *</label
                >
                <select
                  v-model="form.fee_type_id"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Fee Type</option>
                  <option v-for="feeType in feeTypes" :key="feeType.id" :value="feeType.id">
                    {{ feeType.name }} ({{ feeType.code }})
                  </option>
                </select>
              </div>

              <!-- Payment Model -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >Payment Model *</label
                >
                <select
                  v-model="form.payment_model"
                  required
                  @change="onPaymentModelChange"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Payment Model</option>
                  <option value="installment">Installment-based</option>
                  <option value="monthly">Monthly-based</option>
                </select>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Installment-based: One-time or installment payments | Monthly-based: Monthly
                  payments
                </p>
              </div>

              <!-- Installment-based Fields -->
              <div
                v-if="form.payment_model === 'installment'"
                class="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
              >
                <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Installment Configuration
                </h4>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >Installment Type</label
                  >
                  <select
                    v-model="form.installment_type"
                    @change="onInstallmentTypeChange"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="one_time">One-Time Full Fee</option>
                    <option value="multiple">Multiple Installments</option>
                  </select>
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    One-Time Full Fee: Single invoice for entire amount | Multiple Installments:
                    Split into 2-4 installments
                  </p>
                </div>

                <!-- One-Time Full Fee Configuration -->
                <div
                  v-if="form.installment_type === 'one_time'"
                  class="space-y-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700"
                >
                  <h5 class="text-sm font-medium text-blue-800 dark:text-blue-200">
                    One-Time Full Fee
                  </h5>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >Total Fee Amount (₹)</label
                    >
                    <input
                      v-model="form.amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., 21000"
                    />
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Total amount for the entire fee structure. Students can pay full amount or
                      remaining balance.
                    </p>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >Due Date <span class="text-red-500">*</span></label
                    >
                    <input
                      v-model="form.due_date"
                      type="date"
                      required
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Due date for the full payment. Partial payments are always allowed.
                    </p>
                  </div>
                </div>

                <!-- Multiple Installments Configuration -->
                <div
                  v-if="form.installment_type === 'multiple'"
                  class="space-y-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700"
                >
                  <h5 class="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Multiple Installments
                  </h5>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >Number of Installments</label
                    >
                    <select
                      v-model="form.installment_count"
                      @change="onInstallmentCountChange"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="2">2 Installments</option>
                      <option value="3">3 Installments</option>
                      <option value="4">4 Installments</option>
                    </select>
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Choose how many installments to split the total amount into.
                    </p>
                  </div>

                  <div v-if="form.installment_count > 1">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >Installment Details</label
                    >
                    <div class="space-y-3">
                      <div
                        v-for="i in parseInt(form.installment_count)"
                        :key="i"
                        class="p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"
                      >
                        <div class="flex items-center space-x-2 mb-2">
                          <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
                            >Installment #{{ i }}:</span
                          >
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label
                              class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                              >Amount (₹)</label
                            >
                            <input
                              v-model="form.installment_amounts[i - 1]"
                              type="number"
                              step="0.01"
                              min="0.01"
                              @input="onInstallmentAmountChange"
                              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                              :placeholder="`Installment ${i} amount`"
                            />
                          </div>
                          <div>
                            <label
                              class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                              >Due Date</label
                            >
                            <input
                              v-model="form.installment_due_dates[i - 1]"
                              type="date"
                              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Total: ₹{{ totalInstallmentAmount }}
                    </p>
                  </div>

                  <!-- Partial Payment Toggle for Multiple Installments -->
                  <div
                    class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"
                  >
                    <div>
                      <label class="text-sm font-medium text-gray-700 dark:text-gray-300"
                        >Allow Partial Payments</label
                      >
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        Students can pay partial amounts within each installment
                      </p>
                    </div>
                    <div class="flex items-center">
                      <input
                        v-model="form.allow_partial_payments"
                        type="checkbox"
                        class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Monthly-based Fields -->
              <div
                v-if="form.payment_model === 'monthly'"
                class="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
              >
                <h4 class="text-sm font-medium text-green-900 dark:text-green-100">
                  Monthly Configuration
                </h4>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >Monthly Amount (₹)</label
                  >
                  <input
                    v-model="form.monthly_payment_amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    @input="onMonthlyPaymentChange"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., 1000"
                  />
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Monthly payment amount for students.
                  </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >Total Months</label
                    >
                    <input
                      v-model="form.total_months"
                      type="number"
                      min="1"
                      max="12"
                      @input="onMonthlyPaymentChange"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., 12"
                    />
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Total number of months for the academic year.
                    </p>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >Start Month</label
                    >
                    <select
                      v-model="form.start_month"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="1">January</option>
                      <option value="2">February</option>
                      <option value="3">March</option>
                      <option value="4">April</option>
                      <option value="5">May</option>
                      <option value="6">June</option>
                      <option value="7">July</option>
                      <option value="8">August</option>
                      <option value="9">September</option>
                      <option value="10">October</option>
                      <option value="11">November</option>
                      <option value="12">December</option>
                    </select>
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Starting month for monthly payments.
                    </p>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >Due Day</label
                    >
                    <input
                      v-model="form.due_day"
                      type="number"
                      min="1"
                      max="31"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., 10"
                    />
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Day of each month when payment is due.
                    </p>
                  </div>
                </div>

                <!-- Total Amount Display -->
                <div
                  v-if="form.payment_model"
                  class="p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                >
                  <div class="flex justify-between items-center">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >Total Amount (₹)</label
                    >
                    <div class="text-right">
                      <div class="text-lg font-semibold text-gray-900 dark:text-white">
                        ₹{{ calculatedTotalAmount }}
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">
                        {{ amountCalculationNote }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Status -->
                <div class="flex items-center">
                  <input
                    v-model="form.is_active"
                    type="checkbox"
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label class="ml-2 block text-sm text-gray-900 dark:text-gray-300">Active</label>
                </div>
              </div>
            </div>

            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="
                  isSubmitting ||
                  (user?.role === 'super_admin' &&
                    !isEditing &&
                    (!selectedSchoolId || !selectedBranchId)) ||
                  (user?.role === 'admin' && !isEditing && !selectedBranchId) ||
                  !form.payment_model
                "
                class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                {{ isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Schools, FeeStructures, FeeTypes } from '~/api';
import { useAuth } from '~/composables/useAuth';
import { useAcademics } from '~/composables/useAcademics';
import { useBranches } from '~/composables/useBranches';
import { useToast } from '~/composables/useToast';
import { useGlobalBranch } from '~/composables/useGlobalBranch';
import { Streams } from '~/api';
import { PlusIcon, BanknoteIcon, ChevronDown } from 'lucide-vue-next';

// SSR-safe window check
const isClient = import.meta.client;

// Get auth context
const { user } = useAuth();
const { selectedBranchId: globalBranchId } = useGlobalBranch();
const router = useRouter();
const route = useRoute();
const {
  academicYears,
  classes,
  sections,
  fetchAcademicYears,
  fetchClasses,
  fetchSections,
  loadSectionsByClass,
  currentAcademicYear
} = useAcademics();
const { fetchBranches } = useBranches();
const { showSuccess, showError } = useToast();

const feeStructures = ref([]);
const feeTypes = ref([]);
const isLoading = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const isSubmitting = ref(false);
const editingId = ref(null);

// School selector for super admin
const selectedSchoolId = ref('');
const availableSchools = ref([]);

// Branch selector for school admin (only for modal)
const selectedBranchId = ref('');
const availableBranches = ref([]);

// Multi-class selection
const selectedClassToAdd = ref('');

// Stream selection
const streams = ref([]);

const form = ref({
  academic_year_id: '',
  applicable_classes: [], // New field for multi-class selection
  class_id: '', // Keep for backward compatibility
  section_id: '',
  stream_ids: [], // New field for multi-stream selection
  fee_type_id: '',
  amount: '',
  payment_model: '',
  installment_type: 'one_time', // 'one_time' or 'multiple'
  installment_count: 1,
  installment_amounts: [],
  installment_due_dates: [], // Added for multiple installments
  monthly_payment_amount: '',
  total_months: 12,
  start_month: 6, // Added for monthly payments (default June)
  due_day: 10,
  due_date: '', // Added for one-time full fee
  is_active: true,
  allow_partial_payments: true // Changed from min_partial_percentage to toggle
});

// Computed property for current academic year name
const currentAcademicYearName = computed(() => {
  if (academicYears.value && academicYears.value.length > 0) {
    const currentYear = academicYears.value.find(year => year.is_current);
    if (currentYear) {
      return `${currentYear.name} (Current)`;
    }
    return academicYears.value[0]?.name || 'No academic year available';
  }
  return 'Loading...';
});

// Computed property for total installment amount
const totalInstallmentAmount = computed(() => {
  if (form.value.installment_amounts && form.value.installment_amounts.length > 0) {
    return form.value.installment_amounts
      .reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0)
      .toFixed(2);
  }
  return '0.00';
});

// Computed property for calculated total amount
const calculatedTotalAmount = computed(() => {
  if (form.value.payment_model === 'installment') {
    return totalInstallmentAmount.value;
  } else if (form.value.payment_model === 'monthly') {
    const monthlyAmount = parseFloat(form.value.monthly_payment_amount) || 0;
    const totalMonths = parseFloat(form.value.total_months) || 1;
    return (monthlyAmount * totalMonths).toFixed(2);
  }
  return '0.00';
});

// Computed property for amount calculation note
const amountCalculationNote = computed(() => {
  if (form.value.payment_model === 'installment') {
    return `Sum of all installments`;
  } else if (form.value.payment_model === 'monthly') {
    return `Monthly × Total months`;
  }
  return '';
});

// Check if any selected classes have streams available
const hasStreamsAvailable = computed(() => {
  return streams.value.length > 0;
});

// Check if any selected classes have sections available
const hasSectionsAvailable = computed(() => {
  return sections.value.length > 0;
});

// Computed property for available classes for selection (exclude already selected)
const availableClassesForSelection = computed(() => {
  return classes.value.filter(classItem => !form.value.applicable_classes.includes(classItem.name));
});

// Computed property for sections filtered by selected streams
const filteredSections = computed(() => {
  let filtered = sections.value;

  // If streams are selected, filter sections by streams
  if (hasStreamsAvailable.value && form.value.stream_ids.length > 0) {
    filtered = sections.value.filter(
      section => section.stream_id && form.value.stream_ids.includes(section.stream_id)
    );
  }

  return filtered;
});

// Flag to prevent watcher from running during form reset
const isResettingForm = ref(false);

const resetForm = () => {
  isResettingForm.value = true;
  form.value = {
    academic_year_id: '',
    applicable_classes: [], // Reset for create
    class_id: '', // Reset for create
    section_id: '',
    stream_ids: [], // Reset for create
    fee_type_id: '',
    amount: '', // Reset amount to empty
    payment_model: '', // No default - user must select
    installment_type: 'one_time',
    installment_count: 1,
    installment_amounts: [],
    installment_due_dates: [], // Reset for create
    monthly_payment_amount: '', // Reset to empty
    total_months: 12,
    start_month: 6, // Reset for create
    due_day: 10,
    due_date: '', // Reset for create
    is_active: true,
    allow_partial_payments: true // Reset for create
  };
  selectedSchoolId.value = '';
  selectedBranchId.value = '';
  selectedClassToAdd.value = '';
  streams.value = [];
  sections.value = [];

  // Set current academic year ID if available (only for create mode)
  if (!isEditing.value && academicYears.value && academicYears.value.length > 0) {
    const currentYear = academicYears.value.find(year => year.is_current);
    if (currentYear) {
      form.value.academic_year_id = currentYear.id;
    } else {
      form.value.academic_year_id = academicYears.value[0].id;
    }
  }

  // Reset the flag after form reset is complete
  nextTick(() => {
    isResettingForm.value = false;
  });
};

// Multi-class selection functions
const addClass = () => {
  if (
    selectedClassToAdd.value &&
    !form.value.applicable_classes.includes(selectedClassToAdd.value)
  ) {
    form.value.applicable_classes.push(selectedClassToAdd.value);
    selectedClassToAdd.value = '';
  }
};

const removeClass = className => {
  const index = form.value.applicable_classes.indexOf(className);
  if (index > -1) {
    form.value.applicable_classes.splice(index, 1);
  }
};

// Load streams for selected classes
const loadStreamsForClasses = async () => {
  if (form.value.applicable_classes.length === 0) {
    streams.value = [];
    return;
  }

  try {
    // Get current school and branch context
    const currentSchoolId =
      user.value?.role === 'super_admin' ? selectedSchoolId.value : user.value?.school_id;
    const currentBranchId = selectedBranchId.value;

    if (!currentSchoolId || !currentBranchId) {
      streams.value = [];
      return;
    }

    // Get all class IDs for the selected classes (only from current school/branch)
    const classIds = [];
    for (const className of form.value.applicable_classes) {
      // Find class by name, but ensure it belongs to the current school/branch context
      const classItem = classes.value.find(c => c.name === className);
      if (classItem) {
        // Double-check that this class belongs to the current branch
        // (classes.value should already be filtered by school/branch from fetchClasses)
        classIds.push(classItem.id);
      }
    }

    if (classIds.length === 0) {
      streams.value = [];
      return;
    }

    // Fetch streams for each selected class with strict school-branch-class coupling
    const allStreams = [];
    for (const classId of classIds) {
      const params = {
        class_id: classId,
        school_id: currentSchoolId, // Always include school_id
        branch_id: currentBranchId, // Always include branch_id
        is_active: 'true'
      };

      const response = await Streams.getAll(params);
      if (response.data && response.data.length > 0) {
        allStreams.push(...response.data);
      }
    }

    // Remove duplicates based on stream ID
    streams.value = allStreams.filter(
      (stream, index, self) => index === self.findIndex(s => s.id === stream.id)
    );
  } catch (error) {
    console.error('Error loading streams:', error);
    streams.value = [];
  }
};

// Load sections for selected classes
const loadSectionsForClasses = async () => {
  if (form.value.applicable_classes.length === 0) {
    sections.value = [];
    return;
  }

  try {
    const schoolId =
      user.value?.role === 'super_admin' ? selectedSchoolId.value : user.value?.school_id;
    const branchId = selectedBranchId.value;

    // Load sections for all selected classes
    for (const className of form.value.applicable_classes) {
      const classItem = classes.value.find(c => c.name === className);
      if (classItem) {
        await loadSectionsByClass(classItem.id, schoolId, branchId);
      }
    }
  } catch (error) {
    console.error('Error loading sections for classes:', error);
  }
};
// Handle payment model change
const onPaymentModelChange = () => {
  if (form.value.payment_model === 'installment') {
    // Reset monthly fields for installment payments
    form.value.monthly_payment_amount = null;
    form.value.total_months = null;
    form.value.due_month = null;
    form.value.due_day = null; // Use NULL for installment payments
    form.value.min_partial_percentage = 10; // Reset for installment

    // Set default installment values
    form.value.installment_type = 'one_time';
    form.value.installment_count = 1;
    form.value.installment_amounts = [];
    form.value.installment_due_dates = [];

    // Set default due date for one-time installments
    if (!form.value.due_date) {
      const defaultDate = new Date();
      defaultDate.setMonth(defaultDate.getMonth() + 3);
      form.value.due_date = defaultDate.toISOString().split('T')[0];
    }
  } else if (form.value.payment_model === 'monthly') {
    // Reset installment fields for monthly payments
    form.value.installment_type = null; // Use NULL for monthly payments
    form.value.installment_count = 1;
    form.value.installment_amounts = [];
    form.value.installment_due_dates = [];
    form.value.due_date = null;
    form.value.due_month = null; // Remove due_month for monthly payments

    // Set default monthly values
    form.value.monthly_payment_amount = '';
    form.value.total_months = 12;
    form.value.due_day = 10;
  }
};

// Handle installment type change
const onInstallmentTypeChange = () => {
  if (form.value.installment_type === 'one_time') {
    // One-time full fee: single installment
    form.value.installment_count = 1;
    form.value.installment_amounts = [];
    form.value.installment_due_dates = [];
    form.value.due_date = null; // Clear due_date for multiple installments

    // Set default due date to current date + 3 months if not already set
    if (!form.value.due_date) {
      const defaultDate = new Date();
      defaultDate.setMonth(defaultDate.getMonth() + 3);
      form.value.due_date = defaultDate.toISOString().split('T')[0];
    }
  } else if (form.value.installment_type === 'multiple') {
    // Multiple installments: default to 2
    form.value.installment_count = 2;
    form.value.installment_amounts = [];
    form.value.installment_due_dates = [];
    form.value.due_date = null; // Multiple installments use installment_due_dates, not due_date

    // Set default due dates for installments (spread across the year)
    const currentDate = new Date();
    for (let i = 0; i < form.value.installment_count; i++) {
      const installmentDate = new Date(currentDate);
      installmentDate.setMonth(currentDate.getMonth() + i * 6); // Every 6 months
      form.value.installment_due_dates[i] = installmentDate.toISOString().split('T')[0];
    }
  }
};

// Handle installment count change
const onInstallmentCountChange = () => {
  const count = parseInt(form.value.installment_count) || 1;

  // Ensure installment_amounts array matches the count
  while (form.value.installment_amounts.length < count) {
    form.value.installment_amounts.push('');
  }

  // Remove extra amounts if count is reduced
  if (form.value.installment_amounts.length > count) {
    form.value.installment_amounts = form.value.installment_amounts.slice(0, count);
  }

  // Ensure installment_due_dates array matches the count
  while (form.value.installment_due_dates.length < count) {
    form.value.installment_due_dates.push('');
  }

  // Remove extra due dates if count is reduced
  if (form.value.installment_due_dates.length > count) {
    form.value.installment_due_dates = form.value.installment_due_dates.slice(0, count);
  }
};

// Handle installment amount change
const onInstallmentAmountChange = () => {
  // Auto-calculate total amount when installment amounts change
  if (form.value.payment_model === 'installment' && form.value.installment_type === 'multiple') {
    const total = form.value.installment_amounts.reduce(
      (sum, amount) => sum + (parseFloat(amount) || 0),
      0
    );
    if (total > 0) {
      form.value.amount = total.toFixed(2);
    }
  }
};

// Handle monthly payment change
const onMonthlyPaymentChange = () => {
  // Auto-calculate total amount when monthly payment changes
  if (form.value.payment_model === 'monthly') {
    const monthlyAmount = parseFloat(form.value.monthly_payment_amount) || 0;
    const totalMonths = parseFloat(form.value.total_months) || 1;
    const total = monthlyAmount * totalMonths;
    if (total > 0) {
      form.value.amount = total.toFixed(2);
    }
  }
};

// Fetch schools for super admin
const fetchSchools = async () => {
  if (user.value?.role !== 'super_admin') return;

  try {
    const response = await Schools.getAll();

    // Handle both paginated and non-paginated responses
    if (response.data?.schools) {
      availableSchools.value = response.data.schools;
    } else if (response.data?.items) {
      availableSchools.value = response.data.items;
    } else if (response.data) {
      availableSchools.value = response.data;
    } else {
      availableSchools.value = [];
    }
  } catch (error) {
    availableSchools.value = [];
  }
};

// Handle school selection change
const onSchoolChange = async () => {
  selectedBranchId.value = ''; // Reset branch selection
  if (selectedSchoolId.value) {
    try {
      const branches = await fetchBranches(selectedSchoolId.value);

      // fetchBranches returns the branches array directly
      if (Array.isArray(branches)) {
        availableBranches.value = branches;
      } else {
        availableBranches.value = [];
      }

      // Auto-select if only one branch
      if (availableBranches.value.length === 1) {
        selectedBranchId.value = availableBranches.value[0].id;
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      availableBranches.value = [];
    }
  }

  // Reset form when school changes
  if (!isEditing.value) {
    resetForm();
  }
};

// Handle branch selection change
const onBranchChange = async () => {
  // Reset class and section selection when branch changes
  form.value.applicable_classes = []; // Clear applicable classes
  form.value.class_id = ''; // Clear class_id for backward compatibility
  form.value.section_id = '';
  sections.value = []; // Clear sections
  streams.value = []; // Clear streams

  // Reload classes for the selected branch
  if (selectedBranchId.value) {
    try {
      const schoolId =
        user.value?.role === 'super_admin' ? selectedSchoolId.value : user.value?.school_id;
      await fetchClasses({
        schoolId: schoolId,
        branchId: selectedBranchId.value
      });
    } catch (error) {
      console.error('Error loading classes for branch:', error);
    }
  } else {
    classes.value = []; // Clear classes if no branch selected
  }

  // Reload fee types for the selected branch
  await fetchFeeTypes();
};

// Fetch branches for school admin
const fetchBranchesForSchoolAdmin = async () => {
  if (user.value?.role !== 'admin' || !user.value?.school_id) return;

  try {
    const branches = await fetchBranches(user.value.school_id);

    // fetchBranches returns the branches array directly
    if (Array.isArray(branches)) {
      availableBranches.value = branches;
    } else {
      availableBranches.value = [];
    }

    // Auto-select if only one branch
    if (availableBranches.value.length === 1) {
      selectedBranchId.value = availableBranches.value[0].id;
    }
  } catch (error) {
    console.error('Error fetching branches for school admin:', error);
    availableBranches.value = [];
  }
};

const fetchFeeStructures = async () => {
  isLoading.value = true;
  try {
    const params = {};
    if (user.value?.school_id) {
      params.school_id = user.value.school_id;
    }
    const branchId = globalBranchId.value || selectedBranchId.value;
    if (branchId) {
      params.branch_id = branchId;
    }
    const response = await FeeStructures.getAll(params);
    feeStructures.value = response.data;
  } catch (error) {
    console.error('Error fetching fee structures:', error);
  } finally {
    isLoading.value = false;
  }
};

watch(globalBranchId, () => {
  fetchFeeStructures();
});

const fetchFeeTypes = async () => {
  try {
    const params = {};
    if (user.value?.school_id) {
      params.school_id = user.value.school_id;
    }
    // Filter fee types by the selected branch
    const branchId = selectedBranchId.value || globalBranchId.value;
    if (branchId) {
      params.branch_id = branchId;
    }
    const response = await FeeTypes.getAll(params);
    feeTypes.value = response.data.filter(type => type.is_active);
  } catch (error) {
    console.error('Error fetching fee types:', error);
  }
};

// Load form data (academic years and classes)
const loadFormData = async () => {
  try {
    const schoolId =
      user.value?.role === 'super_admin' ? selectedSchoolId.value : user.value?.school_id;
    const branchId = selectedBranchId.value || globalBranchId.value;

    // Load academic years
    await fetchAcademicYears();

    // Set current academic year ID automatically (only for create mode)
    if (!isEditing.value && academicYears.value && academicYears.value.length > 0) {
      const currentYear = academicYears.value.find(year => year.is_current);
      if (currentYear) {
        form.value.academic_year_id = currentYear.id;
      } else {
        form.value.academic_year_id = academicYears.value[0].id;
      }
    }

    // Load classes
    await fetchClasses({
      schoolId: schoolId,
      branchId: branchId
    });

    // Load fee types
    await fetchFeeTypes();
  } catch (error) {
    console.error('Error loading form data:', error);
  }
};

// Watch for user data changes to load branches
watch(
  user,
  async newUser => {
    if (newUser?.role === 'admin' && newUser?.school_id && availableBranches.value.length === 0) {
      await fetchBranchesForSchoolAdmin();
    }
  },
  { immediate: true }
);

const openCreateModal = async () => {
  resetForm();
  isEditing.value = false;
  showModal.value = true;

  // Pre-fill branch from global context
  if (globalBranchId.value) {
    selectedBranchId.value = globalBranchId.value;
  }

  // Load schools for super admin
  if (user.value?.role === 'super_admin') {
    await fetchSchools();
  }

  // Load branches for school admin (always load to ensure fresh data)
  if (user.value?.role === 'admin' && user.value?.school_id) {
    await fetchBranchesForSchoolAdmin();
  }

  // Load academic years and classes
  await loadFormData();
};

const editFeeStructure = async structure => {
  isEditing.value = true;
  editingId.value = structure.id;

  // Set school and branch context for super admin first
  if (user.value?.role === 'super_admin') {
    selectedSchoolId.value = structure.school_id;
    // Load branches for the school
    if (structure.school_id) {
      try {
        const branches = await fetchBranches(structure.school_id);
        if (Array.isArray(branches)) {
          availableBranches.value = branches;
        } else {
          availableBranches.value = [];
        }
      } catch (error) {
        console.error('Error fetching branches for edit:', error);
      }
    }
  }

  // Set branch context
  selectedBranchId.value = structure.branch_id;

  // Now load form data with the correct context
  await loadFormData();

  // Handle applicable_classes - support both new array format and legacy class_name
  let applicableClasses = [];
  if (structure.applicable_classes && Array.isArray(structure.applicable_classes)) {
    applicableClasses = structure.applicable_classes;
  } else if (structure.class_name) {
    // Legacy support: convert single class_name to array
    applicableClasses = [structure.class_name];
  }

  // Find the academic year ID by matching academic year name
  let academicYearId = '';
  if (structure.academic_year && academicYears.value.length > 0) {
    const matchingYear = academicYears.value.find(year => year.name === structure.academic_year);
    if (matchingYear) {
      academicYearId = matchingYear.id;
    }
  }

  // Find section ID by name if section exists
  let sectionId = '';
  if (structure.section && sections.value.length > 0) {
    const matchingSection = sections.value.find(sec => sec.name === structure.section);
    if (matchingSection) {
      sectionId = matchingSection.id;
    }
  }

  // Handle streams if they exist
  let streamIds = [];
  if (
    structure.stream_ids &&
    Array.isArray(structure.stream_ids) &&
    structure.stream_ids.length > 0
  ) {
    streamIds = structure.stream_ids;
  }

  // Set form values
  form.value = {
    academic_year_id: academicYearId,
    applicable_classes: applicableClasses, // Set for edit
    class_id: '', // Keep empty for edit mode since we use applicable_classes
    section_id: sectionId || '',
    stream_ids: streamIds, // Set stream IDs
    fee_type_id: structure.fee_type_id,
    amount: structure.amount,
    payment_model: structure.payment_model || 'monthly',
    installment_type: structure.installment_type || 'one_time',
    installment_count: structure.installment_count || 1,
    installment_amounts: structure.installment_amounts || [],
    installment_due_dates: structure.installment_due_dates || [], // Set for edit
    monthly_payment_amount: structure.monthly_payment_amount || '',
    total_months: structure.total_months || 12,
    start_month: structure.start_month || 6, // Set for edit
    due_day: structure.due_day || 10,
    due_date: structure.due_date || '', // Set for edit
    is_active: structure.is_active !== false,
    allow_partial_payments: structure.allow_partial_payments !== false // Set for edit
  };

  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  resetForm();
  editingId.value = null;
};

const saveFeeStructure = async () => {
  isSubmitting.value = true;
  try {
    // Validate that at least one class is selected
    if (form.value.applicable_classes.length === 0) {
      showError('At least one class must be selected.');
      return;
    }

    // Validate that a payment model is selected
    if (!form.value.payment_model) {
      showError('Please select a payment model.');
      return;
    }

    // Calculate the correct amount based on payment model
    let calculatedAmount = 0;
    if (form.value.payment_model === 'installment') {
      if (form.value.installment_type === 'one_time') {
        // For one-time full fee, use the amount field directly
        calculatedAmount = parseFloat(form.value.amount) || 0;
      } else if (form.value.installment_type === 'multiple') {
        // For multiple installments, sum up all installment amounts
        calculatedAmount = form.value.installment_amounts.reduce(
          (sum, amount) => sum + (parseFloat(amount) || 0),
          0
        );
      }
    } else if (form.value.payment_model === 'monthly') {
      // For monthly payments, multiply monthly amount by total months
      const monthlyAmount = parseFloat(form.value.monthly_payment_amount) || 0;
      const totalMonths = parseFloat(form.value.total_months) || 1;
      calculatedAmount = monthlyAmount * totalMonths;
    }

    // Validate that the calculated amount is greater than 0
    if (calculatedAmount <= 0) {
      showError(
        'Total amount must be greater than 0. Please check your fee structure configuration.'
      );
      return;
    }

    // Validate due date for installment payments
    if (form.value.payment_model === 'installment') {
      if (form.value.installment_type === 'one_time') {
        if (!form.value.due_date) {
          showError('Due date is required for one-time full fee payments.');
          return;
        }
      } else if (form.value.installment_type === 'multiple') {
        if (!form.value.installment_due_dates || form.value.installment_due_dates.length === 0) {
          showError('Due dates are required for multiple installments.');
          return;
        }
        // Check if all installment amounts have corresponding due dates
        const installmentAmounts = form.value.installment_amounts || [];
        const installmentDueDates = form.value.installment_due_dates || [];
        if (installmentAmounts.length !== installmentDueDates.length) {
          showError('Each installment must have a corresponding due date.');
          return;
        }
        // Check if any due date is missing
        if (installmentDueDates.some(date => !date)) {
          showError('All installments must have due dates.');
          return;
        }
      }
    }

    // Get section name if section_id is provided
    let sectionName = null;
    if (form.value.section_id) {
      const selectedSection = sections.value.find(s => s.id === form.value.section_id);
      sectionName = selectedSection?.name || null;
    }

    // Set class_id if only one class is selected
    let classId = '';
    if (form.value.applicable_classes.length === 1) {
      const selectedClassName = form.value.applicable_classes[0];
      const selectedClass = classes.value.find(c => c.name === selectedClassName);
      if (selectedClass) {
        classId = selectedClass.id;
      }
    }

    const feeStructureData = {
      ...form.value,
      class_id: classId, // Set the proper class_id when single class is selected
      amount: calculatedAmount, // Use the calculated amount
      applicable_classes: form.value.applicable_classes, // Send applicable classes array
      stream_ids: form.value.stream_ids, // Send stream IDs array
      section: sectionName, // Send section name instead of section_id
      school_id:
        user.value?.role === 'super_admin' ? selectedSchoolId.value : user.value?.school_id,
      branch_id: selectedBranchId.value || user.value?.branch_id
    };

    if (isEditing.value) {
      await FeeStructures.update(editingId.value, feeStructureData);
      showSuccess('Fee structure updated successfully!');
    } else {
      await FeeStructures.create(feeStructureData);
      showSuccess('Fee structure created successfully!');
    }

    await fetchFeeStructures();
    closeModal();
  } catch (error) {
    console.error('Error saving fee structure:', error);

    // Extract error message from API response
    let errorMessage = 'Failed to save fee structure. Please try again.';

    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    showError(errorMessage);
  } finally {
    isSubmitting.value = false;
  }
};

const deleteFeeStructure = async id => {
  if (confirm('Are you sure you want to delete this fee structure?')) {
    try {
      await FeeStructures.delete(id);
      showSuccess('Fee structure deleted successfully!');
      await fetchFeeStructures();
    } catch (error) {
      console.error('Error deleting fee structure:', error);

      // Extract error message from API response
      let errorMessage = 'Failed to delete fee structure. Please try again.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showError(errorMessage);
    }
  }
};

// Watch for form changes to ensure amount is properly calculated
watch(
  () => [
    form.value.payment_model,
    form.value.installment_type,
    form.value.installment_amounts,
    form.value.monthly_payment_amount,
    form.value.total_months
  ],
  () => {
    // Skip calculation if form is being reset
    if (isResettingForm.value) {
      return;
    }

    // Only auto-calculate amount if user has actually entered values (not during form reset)
    if (form.value.payment_model === 'installment') {
      if (form.value.installment_type === 'one_time') {
        // For one-time full fee, amount is set directly by user
        // No auto-calculation needed - don't override user input

        // Ensure due date is set for one-time full fee
        if (!form.value.due_date) {
          const defaultDate = new Date();
          defaultDate.setMonth(defaultDate.getMonth() + 3);
          form.value.due_date = defaultDate.toISOString().split('T')[0];
        }
      } else if (form.value.installment_type === 'multiple') {
        // For multiple installments, sum up all installment amounts
        const total = form.value.installment_amounts.reduce(
          (sum, amount) => sum + (parseFloat(amount) || 0),
          0
        );
        if (total > 0) {
          form.value.amount = total.toFixed(2);
        }
      }
    } else if (form.value.payment_model === 'monthly') {
      // For monthly payments, multiply monthly amount by total months
      const monthlyAmount = parseFloat(form.value.monthly_payment_amount) || 0;
      const totalMonths = parseFloat(form.value.total_months) || 1;
      const total = monthlyAmount * totalMonths;
      if (total > 0) {
        form.value.amount = total.toFixed(2);
      }
    }
  },
  { deep: true }
);

// Watch for classes to be loaded and set class_id if we're in edit mode
watch(
  classes,
  newClasses => {
    if (isEditing.value && editingId.value && newClasses.length > 0) {
      // Find the fee structure being edited
      const structure = feeStructures.value.find(s => s.id === editingId.value);
      if (structure) {
        // Handle applicable_classes - support both new array format and legacy class_name
        let applicableClasses = [];
        if (structure.applicable_classes && Array.isArray(structure.applicable_classes)) {
          applicableClasses = structure.applicable_classes;
        } else if (structure.class_name) {
          // Legacy support: convert single class_name to array
          applicableClasses = [structure.class_name];
        }

        // Set applicable_classes if not already set
        if (form.value.applicable_classes.length === 0 && applicableClasses.length > 0) {
          form.value.applicable_classes = applicableClasses;
        }
      }
    }
  },
  { immediate: true }
);

// Watch for academic years to be loaded and set academic_year_id if we're in edit mode
watch(
  academicYears,
  newYears => {
    if (isEditing.value && editingId.value && newYears.length > 0) {
      // Find the fee structure being edited
      const structure = feeStructures.value.find(s => s.id === editingId.value);
      if (structure && structure.academic_year) {
        const matchingYear = newYears.find(year => year.name === structure.academic_year);
        if (matchingYear) {
          form.value.academic_year_id = matchingYear.id;
        }
      }
    }
  },
  { immediate: true }
);

// Watch for sections to be loaded and set section_id if we're in edit mode
watch(
  sections,
  newSections => {
    if (isEditing.value && editingId.value && newSections.length > 0) {
      // Find the fee structure being edited
      const structure = feeStructures.value.find(s => s.id === editingId.value);
      if (structure && structure.section) {
        const matchingSection = newSections.find(sec => sec.name === structure.section);
        if (matchingSection) {
          form.value.section_id = matchingSection.id;
        }
      }
    }
  },
  { immediate: true }
);

// Watch for applicable_classes changes to load streams and sections
watch(
  () => form.value.applicable_classes,
  async newClasses => {
    if (!isResettingForm.value) {
      await Promise.all([loadStreamsForClasses(), loadSectionsForClasses()]);
    }
  },
  { deep: true }
);

// Handle window resize
let resizeObserver;

// Add missing checkMobile function
const checkMobile = () => {
  // This function was referenced but not defined
  // For now, we'll leave it empty as it's not critical for dropdown functionality
};

onMounted(async () => {
  if (isClient) {
    // Load schools for super admin on component mount
    if (user.value?.role === 'super_admin') {
      await fetchSchools();
    }

    // Load branches for school admin on component mount
    if (user.value?.role === 'admin') {
      await fetchBranchesForSchoolAdmin();
    }

    // Load fee structures and fee types
    await Promise.all([fetchFeeStructures(), fetchFeeTypes()]);

    // Setup resize observer
    resizeObserver = new ResizeObserver(() => {
      checkMobile();
    });
    resizeObserver.observe(document.body);
  }
});

onBeforeUnmount(() => {
  if (isClient) {
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
  }
});
</script>

<style scoped>
/****************************************************
  Tailwind CSS styles are generated from utilities.
  Add custom styles here.
****************************************************/
</style>
