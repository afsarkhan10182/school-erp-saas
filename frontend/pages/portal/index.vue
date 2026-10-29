<template>
  <div class="min-h-screen bg-gray-50/60 dark:bg-gray-900 pb-16">
    <div class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <!-- Portal Top Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300"
            >
              {{ isParent ? 'Family Portal' : 'Student Portal' }}
            </span>
            <span
              v-if="currentStudent?.current_class"
              class="text-xs text-gray-500 dark:text-gray-400"
            >
              Class {{ currentStudent.current_class }}
            </span>
          </div>
          <h1
            class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight mt-1"
          >
            {{ isParent ? 'Child Academic & Fee Portal' : 'My Learning Portal' }}
          </h1>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{
              isParent
                ? 'Monitor real-time academic progress, fee invoices, attendance, and assignments for your children.'
                : 'Track your class attendance, assignments, timetable, and examination report cards.'
            }}
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <NuxtLink
            to="/portal/online-exams"
            class="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
          >
            <Award class="w-4 h-4" />
            <span>Online Exams</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-if="errorMessage"
        class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 flex items-center justify-between"
      >
        <div class="flex items-center gap-2">
          <AlertTriangle class="w-5 h-5 flex-shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>
        <button class="underline font-semibold" @click="loadData(activeChildId)">Retry</button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-20 text-gray-500">
        <div
          class="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin mb-3"
        ></div>
        <span class="text-sm font-medium">Loading records...</span>
      </div>

      <div
        v-else-if="isParent && data.kind === 'parent' && !(data.students || []).length"
        class="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-xs dark:border-gray-700 dark:bg-gray-800"
      >
        <Users class="mx-auto h-10 w-10 text-indigo-500" />
        <h2 class="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
          No students linked to this account yet
        </h2>
        <p class="mx-auto mt-2 max-w-xl text-sm text-gray-600 dark:text-gray-400">
          Please contact your school administrator to link your child. Their attendance, fees,
          homework, results, and timetable will appear here once linked.
        </p>
      </div>

      <div v-else class="space-y-6">
        <!-- Multi-Child Switcher for Parents -->
        <div
          v-if="isParent && (data.students || []).length > 0"
          class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/80 p-4 shadow-xs"
        >
          <div class="flex items-center justify-between mb-3">
            <span
              class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >Select Child</span
            >
            <span class="text-xs text-gray-400"
              >{{ (data.students || []).length }} registered children</span
            >
          </div>
          <div class="flex flex-wrap gap-3">
            <button
              v-for="child in data.students"
              :key="child.id"
              type="button"
              @click="switchChild(child.id)"
              class="flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all text-left"
              :class="
                activeChildId === child.id
                  ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-200 ring-2 ring-indigo-500/20 shadow-xs'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
              "
            >
              <div
                class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                :class="
                  activeChildId === child.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                "
              >
                {{ child.first_name ? child.first_name.charAt(0) : 'S' }}
              </div>
              <div>
                <p class="font-semibold text-sm leading-tight">
                  {{ child.first_name }} {{ child.last_name }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {{ child.current_class ? `Class ${child.current_class}` : 'No class' }} ·
                  {{ child.admission_number || 'No ID' }}
                </p>
              </div>
            </button>
          </div>
        </div>

        <!-- Student Profile Card & Summary Metrics -->
        <div
          v-if="currentStudent"
          class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/80 p-5 sm:p-6 shadow-xs"
        >
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="flex items-center gap-4">
              <div
                class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-indigo-500/20"
              >
                {{ currentStudent.first_name ? currentStudent.first_name.charAt(0) : 'S' }}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {{ currentStudent.first_name }} {{ currentStudent.last_name }}
                  </h2>
                  <span
                    class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                  >
                    Active
                  </span>
                </div>
                <div
                  class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400"
                >
                  <span
                    >Adm No:
                    <strong class="text-gray-900 dark:text-white">{{
                      currentStudent.admission_number || 'N/A'
                    }}</strong></span
                  >
                  <span
                    >Class:
                    <strong class="text-gray-900 dark:text-white">{{
                      currentStudent.current_class || 'N/A'
                    }}</strong></span
                  >
                  <span v-if="currentStudent.roll_number"
                    >Roll:
                    <strong class="text-gray-900 dark:text-white">{{
                      currentStudent.roll_number
                    }}</strong></span
                  >
                  <span v-if="currentStudent.blood_group"
                    >Blood:
                    <strong class="text-gray-900 dark:text-white">{{
                      currentStudent.blood_group
                    }}</strong></span
                  >
                </div>
              </div>
            </div>

            <!-- Quick Stats Pills -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div
                class="rounded-xl bg-gray-50 dark:bg-gray-900/50 p-3 border border-gray-100 dark:border-gray-800 text-center"
              >
                <p class="text-[11px] font-medium uppercase text-gray-500 dark:text-gray-400">
                  Attendance
                </p>
                <p class="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {{ attendanceRateLabel }}
                </p>
                <p class="text-[10px] text-gray-400">{{ attendanceDaysLabel }}</p>
              </div>

              <div
                class="rounded-xl bg-gray-50 dark:bg-gray-900/50 p-3 border border-gray-100 dark:border-gray-800 text-center"
              >
                <p class="text-[11px] font-medium uppercase text-gray-500 dark:text-gray-400">
                  Pending Fees
                </p>
                <p
                  class="text-lg font-bold mt-0.5"
                  :class="
                    pendingFeesTotal > 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  "
                >
                  ₹{{ formatCurrency(pendingFeesTotal) }}
                </p>
                <p class="text-[10px] text-gray-400">
                  {{ pendingInvoicesCount }} invoice{{ pendingInvoicesCount === 1 ? '' : 's' }}
                </p>
              </div>

              <div
                class="rounded-xl bg-gray-50 dark:bg-gray-900/50 p-3 border border-gray-100 dark:border-gray-800 text-center"
              >
                <p class="text-[11px] font-medium uppercase text-gray-500 dark:text-gray-400">
                  Homework
                </p>
                <p class="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                  {{ pendingHomeworks.length }}
                </p>
                <p class="text-[10px] text-gray-400">active tasks</p>
              </div>

              <div
                class="rounded-xl bg-gray-50 dark:bg-gray-900/50 p-3 border border-gray-100 dark:border-gray-800 text-center"
              >
                <p class="text-[11px] font-medium uppercase text-gray-500 dark:text-gray-400">
                  Exam Results
                </p>
                <p class="text-lg font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                  {{ (data.examResults || []).length }}
                </p>
                <p class="text-[10px] text-gray-400">recorded</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="border-b border-gray-200 dark:border-gray-700">
          <nav class="flex flex-wrap gap-x-6" aria-label="Tabs">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="selectTab(tab.id)"
              class="whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm flex flex-shrink-0 items-center gap-2 transition-colors"
              :class="
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              "
            >
              <component :is="tab.icon" class="w-4 h-4" />
              <span>{{ tab.label }}</span>
              <span
                v-if="tab.badge !== undefined && tab.badge > 0"
                class="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
              >
                {{ tab.badge }}
              </span>
            </button>
          </nav>
        </div>

        <!-- Tab 1: Overview -->
        <div v-if="activeTab === 'overview'" class="grid gap-6 md:grid-cols-2">
          <!-- School Announcements & Notices -->
          <div
            v-if="(data.notices || []).length > 0"
            class="col-span-full bg-white dark:bg-gray-800 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 p-5 shadow-xs bg-gradient-to-r from-indigo-50/40 via-white to-purple-50/40 dark:from-indigo-950/20 dark:via-gray-800 dark:to-purple-950/20"
          >
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-base">
                <Bell class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                School Notice Board
              </h3>
              <span class="text-xs font-semibold text-indigo-600 dark:text-indigo-400"
                >{{ data.notices.length }} active notice(s)</span
              >
            </div>
            <div class="space-y-3">
              <div
                v-for="notice in data.notices"
                :key="notice.id"
                class="p-3.5 rounded-xl border border-indigo-100/80 dark:border-indigo-900/40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xs"
              >
                <div class="flex items-center justify-between gap-2">
                  <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
                    {{ notice.title }}
                  </h4>
                  <span class="text-[11px] text-gray-500 whitespace-nowrap">{{
                    notice.date_value || formatDate(notice.created_at)
                  }}</span>
                </div>
                <p
                  v-if="notice.notes"
                  class="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed"
                >
                  {{ notice.notes }}
                </p>
              </div>
            </div>
          </div>

          <!-- Recent Attendance Summary -->
          <div
            class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/80 p-5 shadow-xs"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-base">
                <Calendar class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Attendance Summary
              </h3>
              <button
                @click="activeTab = 'attendance'"
                class="text-xs font-semibold text-indigo-600 hover:underline"
              >
                View all records &rarr;
              </button>
            </div>
            <div class="grid grid-cols-3 gap-3 mb-4">
              <div
                class="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-center border border-emerald-100 dark:border-emerald-900/40"
              >
                <span class="text-xs text-emerald-800 dark:text-emerald-300 font-medium"
                  >Present</span
                >
                <p class="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {{ attendanceSummary.present }}
                </p>
              </div>
              <div
                class="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-center border border-rose-100 dark:border-rose-900/40"
              >
                <span class="text-xs text-rose-800 dark:text-rose-300 font-medium">Absent</span>
                <p class="text-xl font-bold text-rose-700 dark:text-rose-400 mt-0.5">
                  {{ attendanceSummary.absent }}
                </p>
              </div>
              <div
                class="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-center border border-amber-100 dark:border-amber-900/40"
              >
                <span class="text-xs text-amber-800 dark:text-amber-300 font-medium">Late</span>
                <p class="text-xl font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                  {{ attendanceSummary.late }}
                </p>
              </div>
            </div>
            <p v-if="attendanceSummary.total" class="text-xs text-gray-500 dark:text-gray-400">
              Attendance rate is <strong>{{ attendanceSummary.rate }}%</strong> based on
              {{ attendanceSummary.total }} tracked sessions.
            </p>
            <p v-else class="text-xs text-gray-500 dark:text-gray-400">
              No attendance sessions recorded yet.
            </p>
          </div>

          <!-- Pending Fees Alert -->
          <div
            class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/80 p-5 shadow-xs"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-base">
                <CreditCard class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Fee Payment Status
              </h3>
              <button
                @click="activeTab = 'fees'"
                class="text-xs font-semibold text-indigo-600 hover:underline"
              >
                View invoices &rarr;
              </button>
            </div>
            <div v-if="(data.invoices || []).length > 0" class="space-y-3">
              <div
                v-for="inv in (data.invoices || []).slice(0, 3)"
                :key="inv.id"
                class="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/30"
              >
                <div>
                  <p class="text-sm font-semibold text-gray-900 dark:text-white">
                    {{ inv.title || inv.invoice_number }}
                  </p>
                  <p class="text-xs text-gray-500">
                    Due: {{ inv.due_date ? formatDate(inv.due_date) : 'N/A' }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold text-gray-900 dark:text-white">
                    ₹{{ formatCurrency(inv.total_amount) }}
                  </p>
                  <StatusBadge :status="inv.status || 'pending'" type="invoice" />
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-gray-400 py-4 text-center">No fee invoices recorded.</p>
          </div>

          <!-- Active Homework Preview -->
          <div
            class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/80 p-5 shadow-xs"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-base">
                <FileText class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Active Homework
              </h3>
              <button
                @click="activeTab = 'homework'"
                class="text-xs font-semibold text-indigo-600 hover:underline"
              >
                View all &rarr;
              </button>
            </div>
            <div v-if="pendingHomeworks.length > 0" class="space-y-3">
              <div
                v-for="hw in pendingHomeworks.slice(0, 3)"
                :key="hw.id"
                class="p-3 rounded-xl border border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/30"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-indigo-600 dark:text-indigo-400">{{
                    hw.subject?.name || 'Homework'
                  }}</span>
                  <span class="text-xs text-gray-500"
                    >Due: {{ hw.due_date ? formatDate(hw.due_date) : 'N/A' }}</span
                  >
                </div>
                <p class="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                  {{ hw.title }}
                </p>
                <p v-if="hw.description" class="text-xs text-gray-500 line-clamp-1 mt-0.5">
                  {{ hw.description }}
                </p>
              </div>
            </div>
            <p v-else class="text-sm text-gray-400 py-4 text-center">
              No active homework assigned.
            </p>
          </div>

          <!-- Recent Exams Preview -->
          <div
            class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/80 p-5 shadow-xs"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-base">
                <Award class="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Examination Results
              </h3>
              <button
                @click="activeTab = 'exams'"
                class="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Report cards &rarr;
              </button>
            </div>
            <div v-if="(data.examResults || []).length > 0" class="space-y-3">
              <div
                v-for="res in (data.examResults || []).slice(0, 3)"
                :key="res.id"
                class="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/30"
              >
                <div>
                  <p class="text-sm font-semibold text-gray-900 dark:text-white">
                    {{ res.exam_name || res.exam?.name || 'Term Exam' }}
                  </p>
                  <p class="text-xs text-gray-500">
                    Marks: {{ res.marks_obtained }} /
                    {{ res.total_marks ?? res.exam?.max_marks ?? '—' }}
                  </p>
                </div>
                <div class="text-right">
                  <span
                    class="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300"
                  >
                    Grade {{ res.grade || 'A' }}
                  </span>
                  <p class="text-xs text-gray-500 mt-0.5">{{ res.percentage }}%</p>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-gray-400 py-4 text-center">
              No exam results recorded yet.
            </p>
          </div>
        </div>

        <div v-else-if="activeTab === 'school-visit' && isParent" class="space-y-5">
          <section
            class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/80 p-5 sm:p-6 shadow-xs"
          >
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">Request a school visit</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Request an appointment for {{ currentStudent?.first_name }}. The school will confirm
              the visit.
            </p>
            <div
              v-if="!data.parent?.guardian_name || !data.parent?.guardian_phone"
              class="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
            >
              The school needs your guardian name and phone on file before you can request a visit.
            </div>
            <form v-else class="mt-5 grid gap-4 sm:grid-cols-2" @submit.prevent="submitSchoolVisit">
              <div>
                <label
                  for="visit-date"
                  class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Appointment date</label
                >
                <input
                  id="visit-date"
                  v-model="visitForm.date"
                  type="date"
                  :min="visitDateMin"
                  required
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label
                  for="visit-time"
                  class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Appointment time</label
                >
                <input
                  id="visit-time"
                  v-model="visitForm.time"
                  type="time"
                  required
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label
                  for="visit-person"
                  class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Person to meet <span class="font-normal text-gray-500">(optional)</span></label
                >
                <input
                  id="visit-person"
                  v-model="visitForm.person_to_meet"
                  maxlength="120"
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label
                  for="visit-purpose"
                  class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Purpose of visit</label
                >
                <textarea
                  id="visit-purpose"
                  v-model="visitForm.purpose"
                  maxlength="2000"
                  required
                  rows="3"
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                ></textarea>
              </div>
              <div
                class="sm:col-span-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <p v-if="visitError" class="text-sm text-red-600 dark:text-red-400">
                  {{ visitError }}
                </p>
                <button
                  type="submit"
                  :disabled="savingVisit"
                  class="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto"
                >
                  {{ savingVisit ? 'Sending request…' : 'Confirm appointment request' }}
                </button>
              </div>
            </form>
          </section>
          <section
            class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/80 p-5 sm:p-6 shadow-xs"
          >
            <h3 class="text-base font-bold text-gray-900 dark:text-white">Your visit requests</h3>
            <p v-if="visitLoadError" class="mt-3 text-sm text-red-600 dark:text-red-400">
              {{ visitLoadError }}
            </p>
            <p
              v-else-if="!(data.schoolVisits || []).length"
              class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
            >
              No visit requests for this child yet.
            </p>
            <div v-else class="mt-3 divide-y divide-gray-100 dark:divide-gray-700">
              <article
                v-for="visit in data.schoolVisits"
                :key="visit.id"
                class="py-4 first:pt-0 last:pb-0"
              >
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <p class="font-semibold text-gray-900 dark:text-white">
                    {{ formatDate(visit.date_value)
                    }}<span v-if="visit.appointment_time"> · {{ visit.appointment_time }}</span>
                  </p>
                  <span
                    class="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                    >{{ visitStatusLabel(visit.status) }}</span
                  >
                </div>
                <p
                  v-if="visit.person_to_meet"
                  class="mt-1 text-sm text-gray-600 dark:text-gray-300"
                >
                  Meeting with {{ visit.person_to_meet }}
                </p>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">{{ visit.purpose }}</p>
              </article>
            </div>
          </section>
        </div>

        <div v-else-if="activeTab === 'ptm' && isParent" class="space-y-4">
          <section
            class="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-700/80 dark:bg-gray-800 sm:p-6"
          >
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">Parent–Teacher Meetings</h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Meetings and feedback for {{ currentStudent?.first_name || 'your child' }}.
            </p>
            <p v-if="ptmLoadError" class="mt-4 text-sm text-red-600 dark:text-red-400">
              {{ ptmLoadError }}
            </p>
            <p
              v-else-if="!(data.ptmMeetings || []).length"
              class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
            >
              No meetings are scheduled for this child.
            </p>
            <div v-else class="mt-4 space-y-4">
              <article
                v-for="record in data.ptmMeetings"
                :key="record.id"
                class="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
              >
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 class="font-semibold text-gray-900 dark:text-white">
                      {{ record.meeting?.title }}
                    </h3>
                    <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {{ formatDate(record.meeting?.meeting_date) }} ·
                      {{ record.meeting?.start_time }}–{{ record.meeting?.end_time }} ·
                      {{ ptmModeLabel(record.meeting?.mode) }}
                    </p>
                    <p
                      v-if="record.meeting?.venue"
                      class="mt-1 text-sm text-gray-600 dark:text-gray-300"
                    >
                      {{ record.meeting.venue }}
                    </p>
                    <a
                      v-if="safePtmMeetingUrl(record.meeting?.online_url)"
                      :href="safePtmMeetingUrl(record.meeting?.online_url)"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="mt-1 inline-block text-sm font-medium text-indigo-600 underline dark:text-indigo-400"
                      >Join online meeting</a
                    >
                  </div>
                  <span
                    class="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                    >{{ ptmAttendanceLabel(record.attendance_status) }}</span
                  >
                </div>
                <p
                  v-if="record.meeting?.agenda"
                  class="mt-3 text-sm text-gray-600 dark:text-gray-300"
                >
                  {{ record.meeting.agenda }}
                </p>
                <p
                  v-if="record.teacher_remarks"
                  class="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-900/60 dark:text-gray-200"
                >
                  <span class="font-semibold">Teacher remarks:</span> {{ record.teacher_remarks }}
                </p>
                <form
                  v-if="!record.parent_responded_at && isPtmFeedbackOpen(record)"
                  class="mt-4 space-y-3 border-t border-gray-100 pt-4 dark:border-gray-700"
                  @submit.prevent="submitPtmFeedback(record)"
                >
                  <label
                    :for="`ptm-rating-${record.id}`"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >Rate this meeting</label
                  >
                  <select
                    :id="`ptm-rating-${record.id}`"
                    v-model.number="ptmDrafts[record.id].rating"
                    required
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white sm:max-w-xs"
                  >
                    <option :value="0" disabled>Select a rating</option>
                    <option v-for="rating in [5, 4, 3, 2, 1]" :key="rating" :value="rating">
                      {{ '★'.repeat(rating) }}{{ '☆'.repeat(5 - rating) }} · {{ rating }}/5
                    </option>
                  </select>
                  <label
                    :for="`ptm-feedback-${record.id}`"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >Your feedback <span class="font-normal text-gray-500">(optional)</span></label
                  >
                  <textarea
                    :id="`ptm-feedback-${record.id}`"
                    v-model="ptmDrafts[record.id].feedback"
                    maxlength="2000"
                    rows="3"
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  />
                  <p
                    v-if="ptmFeedbackError[record.id]"
                    class="text-sm text-red-600 dark:text-red-400"
                  >
                    {{ ptmFeedbackError[record.id] }}
                  </p>
                  <button
                    type="submit"
                    :disabled="savingPtmId === record.id"
                    class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {{ savingPtmId === record.id ? 'Saving…' : 'Submit feedback' }}
                  </button>
                </form>
                <div v-else class="mt-4 border-t border-gray-100 pt-4 dark:border-gray-700">
                  <template v-if="record.parent_responded_at">
                    <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Your rating: {{ '★'.repeat(record.parent_rating || 0)
                      }}{{ '☆'.repeat(5 - (record.parent_rating || 0)) }}
                    </p>
                    <p
                      v-if="record.parent_feedback"
                      class="mt-1 text-sm text-gray-600 dark:text-gray-300"
                    >
                      {{ record.parent_feedback }}
                    </p>
                  </template>
                  <p v-else class="text-sm text-gray-500 dark:text-gray-400">
                    Feedback will be available after the meeting date.
                  </p>
                </div>
              </article>
            </div>
          </section>
        </div>

        <div
          v-else-if="activeTab === 'calendar'"
          class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/80 p-6 shadow-xs"
        >
          <div class="flex flex-col gap-4 mb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">Academic Calendar</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                School events and holidays for
                {{ currentStudent?.academic_year || 'your academic year' }}.
              </p>
            </div>
            <div class="flex items-center gap-2 self-start">
              <button
                type="button"
                class="rounded-lg border px-3 py-1.5 text-sm font-medium"
                :class="
                  calendarMode === 'month'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200'
                    : 'border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-200'
                "
                :aria-pressed="calendarMode === 'month'"
                @click="calendarMode = 'month'"
              >
                Month
              </button>
              <button
                type="button"
                class="rounded-lg border px-3 py-1.5 text-sm font-medium"
                :class="
                  calendarMode === 'year'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200'
                    : 'border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-200'
                "
                :aria-pressed="calendarMode === 'year'"
                @click="calendarMode = 'year'"
              >
                Year
              </button>
              <button
                type="button"
                class="rounded-lg border px-3 py-1.5 text-sm font-medium"
                :class="
                  calendarMode === 'list'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200'
                    : 'border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-200'
                "
                :aria-pressed="calendarMode === 'list'"
                @click="calendarMode = 'list'"
              >
                List
              </button>
            </div>
          </div>

          <div class="mb-4 flex items-center justify-between gap-3">
            <button
              type="button"
              :aria-label="calendarMode === 'list' ? 'Previous week' : 'Previous calendar period'"
              class="h-9 w-9 rounded-lg border border-gray-200 text-lg text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
              @click="moveCalendarPeriod(-1)"
            >
              ‹
            </button>
            <div class="flex items-center gap-3">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                {{ calendarHeading }}
              </h3>
              <button
                v-if="calendarMode === 'list'"
                type="button"
                class="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
                @click="goToToday"
              >
                Today
              </button>
            </div>
            <button
              type="button"
              :aria-label="calendarMode === 'list' ? 'Next week' : 'Next calendar period'"
              class="h-9 w-9 rounded-lg border border-gray-200 text-lg text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
              @click="moveCalendarPeriod(1)"
            >
              ›
            </button>
          </div>

          <div v-if="calendarMode === 'month'">
            <div
              class="grid grid-cols-7 border-b border-gray-200 pb-2 text-center text-xs font-semibold text-gray-500 dark:border-gray-700"
            >
              <span v-for="weekday in calendarWeekdays" :key="weekday">{{ weekday }}</span>
            </div>
            <div class="grid grid-cols-7">
              <button
                v-for="day in calendarMonthDays"
                :key="day.date"
                type="button"
                :disabled="!day.inMonth"
                :aria-label="`${formatCalendarDate(day.date)}${day.attendanceCount ? `, ${day.attendanceCount} attendance records` : ''}${day.eventCount ? `, ${day.eventCount} school events` : ''}${day.noticeCount ? `, ${day.noticeCount} notices` : ''}`"
                class="min-h-14 border-b border-r border-gray-100 p-1.5 text-left text-sm disabled:cursor-default dark:border-gray-800 sm:min-h-20 sm:p-2"
                :class="
                  day.date === selectedCalendarDay
                    ? 'bg-indigo-50 dark:bg-indigo-900/20'
                    : day.inMonth
                      ? 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      : 'text-gray-300 dark:text-gray-700'
                "
                @click="selectedCalendarDay = day.date"
              >
                <span
                  class="inline-flex h-6 w-6 items-center justify-center rounded-full"
                  :class="
                    day.isToday
                      ? 'bg-indigo-600 font-bold text-white'
                      : 'text-gray-800 dark:text-gray-200'
                  "
                  >{{ day.dayOfMonth }}</span
                >
                <span class="mt-1 flex gap-1" aria-hidden="true">
                  <i v-if="day.attendanceCount" class="h-1.5 w-1.5 rounded-full bg-emerald-500"></i>
                  <i v-if="day.eventCount" class="h-1.5 w-1.5 rounded-full bg-amber-500"></i>
                  <i v-if="day.noticeCount" class="h-1.5 w-1.5 rounded-full bg-indigo-500"></i>
                </span>
              </button>
            </div>
          </div>

          <div v-else-if="calendarMode === 'year'" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <button
              v-for="month in calendarYearMonths"
              :key="month.month"
              type="button"
              class="rounded-xl border border-gray-200 p-4 text-left hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-gray-700 dark:hover:bg-indigo-900/20"
              @click="selectCalendarMonth(month.month)"
            >
              <span class="font-semibold text-gray-900 dark:text-white">{{ month.label }}</span>
              <span class="mt-2 block text-xs text-gray-500 dark:text-gray-400"
                >{{ month.eventCount }} events · {{ month.attendanceCount }} attendance ·
                {{ month.noticeCount }} notices</span
              >
            </button>
            <section
              class="col-span-full rounded-xl border border-gray-200 p-4 dark:border-gray-700"
              aria-label="Events and notices this year"
            >
              <h3 class="font-semibold text-gray-900 dark:text-white">
                Events and notices this year
              </h3>
              <div
                v-if="calendarYearItems.length"
                class="mt-2 divide-y divide-gray-100 dark:divide-gray-700"
              >
                <button
                  v-for="item in calendarYearItems"
                  :key="item.id"
                  type="button"
                  class="flex w-full items-start gap-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/40"
                  @click="openCalendarYearItem(item.date)"
                >
                  <span class="w-32 shrink-0 text-sm text-gray-500 dark:text-gray-400">{{
                    formatCalendarDate(item.date)
                  }}</span>
                  <span class="min-w-0">
                    <span
                      class="block text-xs font-semibold uppercase tracking-wide"
                      :class="
                        item.type === 'Notice'
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-amber-600 dark:text-amber-400'
                      "
                      >{{ item.type }}</span
                    >
                    <span class="block font-medium text-gray-900 dark:text-white">{{
                      item.title
                    }}</span>
                    <span
                      v-if="item.details"
                      class="mt-0.5 block text-sm text-gray-600 dark:text-gray-300"
                      >{{ item.details }}</span
                    >
                  </span>
                </button>
              </div>
              <p v-else class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No school events or notices scheduled for this year.
              </p>
            </section>
          </div>

          <section
            v-else
            class="divide-y divide-gray-100 rounded-xl border border-gray-200 px-4 dark:divide-gray-700 dark:border-gray-700"
            aria-label="Attendance, events and notices this week"
          >
            <button
              v-for="item in calendarAgendaItems"
              :key="item.id"
              type="button"
              class="flex w-full items-start gap-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/40"
              @click="openCalendarYearItem(item.date)"
            >
              <span class="w-32 shrink-0 text-sm text-gray-500 dark:text-gray-400">{{
                formatCalendarDate(item.date)
              }}</span>
              <span class="min-w-0">
                <span
                  class="block text-xs font-medium"
                  :class="
                    item.type === 'Event'
                      ? 'text-amber-600 dark:text-amber-400'
                      : item.type === 'Attendance'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-indigo-600 dark:text-indigo-400'
                  "
                  >{{ item.type }}</span
                >
                <span class="block font-medium text-gray-900 dark:text-white">{{
                  item.title
                }}</span>
                <span v-if="item.details" class="mt-0.5 block text-sm text-gray-600 dark:text-gray-300">{{
                  item.details
                }}</span>
              </span>
            </button>
            <p v-if="!calendarAgendaItems.length" class="py-6 text-sm text-gray-500 dark:text-gray-400">
              No attendance, events, or notices this week.
            </p>
          </section>

          <div
            v-if="calendarMode === 'month'"
            class="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400"
          >
            <span class="inline-flex items-center gap-1.5"
              ><i class="h-2 w-2 rounded-full bg-emerald-500"></i>Attendance</span
            >
            <span class="inline-flex items-center gap-1.5"
              ><i class="h-2 w-2 rounded-full bg-amber-500"></i>School event</span
            >
            <span class="inline-flex items-center gap-1.5"
              ><i class="h-2 w-2 rounded-full bg-indigo-500"></i>Notice</span
            >
          </div>

          <section
            class="mt-5 rounded-xl border border-gray-200 p-4 dark:border-gray-700"
            aria-live="polite"
          >
            <h4 class="font-semibold text-gray-900 dark:text-white">
              {{ formatCalendarDate(selectedCalendarDay) }}
            </h4>
            <div
              v-if="
                selectedDayEvents.length ||
                selectedDayNotices.length ||
                selectedDayAttendance.length
              "
              class="mt-3 space-y-2"
            >
              <div
                v-for="event in selectedDayEvents"
                :key="`event-${event.id}`"
                class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200"
              >
                <span class="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500"></span
                ><span
                  ><strong class="capitalize">{{ event.day_type }}</strong> ·
                  {{ event.description || 'School calendar event' }}</span
                >
              </div>
              <div
                v-for="notice in selectedDayNotices"
                :key="`notice-${notice.id}`"
                class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200"
              >
                <span class="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-500"></span
                ><span
                  ><strong>Notice</strong> · {{ notice.title
                  }}<template v-if="notice.notes"> — {{ notice.notes }}</template></span
                >
              </div>
              <div
                v-for="record in selectedDayAttendance"
                :key="`attendance-${record.id}`"
                class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200"
              >
                <span class="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500"></span
                ><span
                  >Attendance: {{ record.status
                  }}<template v-if="record.session">
                    · {{ attendanceSessionLabel(record.session) }}</template
                  ><template v-if="record.remarks"> · {{ record.remarks }}</template></span
                >
              </div>
            </div>
            <p v-else class="mt-2 text-sm text-gray-500 dark:text-gray-400">
              No event, notice, or attendance record for this date.
            </p>
          </section>
        </div>

        <!-- Tab 2: Attendance Records -->
        <div v-else-if="activeTab === 'attendance'" class="space-y-4">
          <div
            class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/80 overflow-hidden shadow-xs"
          >
            <div
              class="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
            >
              <div>
                <h3 class="font-bold text-gray-900 dark:text-white">Daily Attendance Log</h3>
                <p class="text-xs text-gray-500 mt-0.5">
                  Summary: {{ attendanceSummary.present }} Present,
                  {{ attendanceSummary.absent }} Absent, {{ attendanceSummary.late }} Late
                </p>
              </div>
              <span
                class="px-3 py-1 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
              >
                Rate: {{ attendanceRateLabel }}
              </span>
            </div>

            <div v-if="(attendanceRecords || []).length > 0" class="overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead
                  class="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700"
                >
                  <tr>
                    <th class="px-5 py-3">Date</th>
                    <th class="px-5 py-3">Session</th>
                    <th class="px-5 py-3">Status</th>
                    <th class="px-5 py-3">Remarks</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                  <tr
                    v-for="rec in attendanceRecords"
                    :key="rec.id"
                    class="hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                  >
                    <td class="px-5 py-3.5 font-medium text-gray-900 dark:text-white">
                      {{ formatDate(rec.date) }}
                    </td>
                    <td class="px-5 py-3.5 text-gray-500 dark:text-gray-400">
                      {{ rec.session ? attendanceSessionLabel(rec.session) : 'Regular' }}
                    </td>
                    <td class="px-5 py-3.5">
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        :class="
                          rec.status === 'present'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : rec.status === 'late'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                        "
                      >
                        {{ rec.status }}
                      </span>
                    </td>
                    <td class="px-5 py-3.5 text-gray-400 text-xs">{{ rec.remarks || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="p-8 text-center text-gray-400 text-sm">
              No detailed attendance records available.
            </div>
          </div>
        </div>

        <!-- Tab 3: Fees & Invoices -->
        <div v-else-if="activeTab === 'fees'" class="space-y-4">
          <div
            class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/80 overflow-hidden shadow-xs"
          >
            <div
              class="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700"
            >
              <div>
                <h3 class="font-bold text-gray-900 dark:text-white">Fee Invoices & Receipts</h3>
                <p class="text-xs text-gray-500 mt-0.5">Invoices, discounts, fines, and receipts</p>
              </div>
            </div>

            <div class="grid gap-3 border-b border-gray-200 p-4 dark:border-gray-700 sm:grid-cols-3 sm:p-5">
              <div class="rounded-xl bg-gray-50 p-3 dark:bg-gray-900/50">
                <p class="text-xs text-gray-500">Total assigned</p>
                <p class="mt-1 font-bold text-gray-900 dark:text-white">
                  ₹{{ formatCurrency(data.feeSummary?.total_assigned || 0) }}
                </p>
              </div>
              <div class="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-900/20">
                <p class="text-xs text-gray-500">Total paid</p>
                <p class="mt-1 font-bold text-emerald-700 dark:text-emerald-300">
                  ₹{{ formatCurrency(data.feeSummary?.total_paid || 0) }}
                </p>
              </div>
              <div class="rounded-xl bg-rose-50 p-3 dark:bg-rose-900/20">
                <p class="text-xs text-gray-500">Due balance</p>
                <p class="mt-1 font-bold text-rose-700 dark:text-rose-300">
                  ₹{{ formatCurrency(data.feeSummary?.due_balance || 0) }}
                </p>
              </div>
            </div>

            <div v-if="feeInvoiceLoading" class="p-6 text-center text-sm text-gray-500" role="status">
              Loading fee invoices…
            </div>
            <div v-else-if="feeInvoiceError" class="p-6 text-center text-sm text-rose-600" role="alert">
              {{ feeInvoiceError }}
              <button class="ml-1 font-semibold underline" @click="loadFeeInvoices(feeInvoicePage.page, activeChildId)">Retry</button>
            </div>

            <div v-if="!feeInvoiceLoading && !feeInvoiceError && feeInvoices.length > 0" class="space-y-3 p-4 sm:hidden">
              <article
                v-for="inv in feeInvoices"
                :key="`mobile-${inv.id}`"
                class="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="break-words text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                      {{ inv.invoice_number }}
                    </p>
                    <p class="mt-1 text-sm text-gray-900 dark:text-white">
                      {{ inv.title || 'Tuition Fee' }}
                    </p>
                    <p class="mt-1 text-xs text-gray-500">
                      Due {{ inv.due_date ? formatDate(inv.due_date) : '—' }}
                    </p>
                  </div>
                  <StatusBadge :status="inv.status || 'pending'" type="invoice" />
                </div>
                <dl class="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <dt class="text-xs text-gray-500">Total</dt>
                    <dd class="mt-0.5 font-semibold text-gray-900 dark:text-white">
                      ₹{{ formatCurrency(inv.total_amount) }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-xs text-gray-500">Balance</dt>
                    <dd
                      class="mt-0.5 font-semibold"
                      :class="(inv.balance_amount || 0) > 0 ? 'text-rose-600' : 'text-gray-500'"
                    >
                      ₹{{ formatCurrency(inv.balance_amount || 0) }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-xs text-gray-500">Paid</dt>
                    <dd class="mt-0.5 text-gray-700 dark:text-gray-300">
                      ₹{{ formatCurrency(inv.paid_amount || 0) }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-xs text-gray-500">Discount · Fine</dt>
                    <dd class="mt-0.5 text-gray-700 dark:text-gray-300">
                      ₹{{ formatCurrency(inv.discount_amount || 0) }} · ₹{{ formatCurrency(inv.late_fee_amount || 0) }}
                    </dd>
                  </div>
                </dl>
                <div class="mt-4 border-t border-gray-100 pt-3 dark:border-gray-700">
                  <p class="text-xs font-medium text-gray-500">Receipts</p>
                  <button
                    v-for="payment in inv.payments || []"
                    :key="payment.id"
                    class="mt-1 block text-left text-sm text-indigo-600 hover:underline dark:text-indigo-400"
                    @click="
                      selectedReceipt = {
                        ...payment,
                        invoice_number: inv.invoice_number,
                        student_name:
                          `${currentStudent?.first_name || ''} ${currentStudent?.last_name || ''}`.trim()
                      }
                    "
                  >
                    {{ payment.receipt_number }}
                  </button>
                  <span v-if="!inv.payments?.length" class="mt-1 block text-sm text-gray-400">—</span>
                </div>
              </article>
            </div>

            <div v-if="!feeInvoiceLoading && !feeInvoiceError && feeInvoices.length > 0" class="hidden overflow-x-auto sm:block">
              <p class="px-5 py-2 text-xs text-gray-500 dark:text-gray-400">
                Scroll horizontally to review every invoice field and receipt.
              </p>
              <table class="w-full min-w-[1100px] whitespace-nowrap text-left text-sm">
                <thead
                  class="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700"
                >
                  <tr>
                    <th class="px-5 py-3">Invoice #</th>
                    <th class="px-5 py-3">Fee Type</th>
                    <th class="px-5 py-3">Due Date</th>
                    <th class="px-5 py-3">Total Amount</th>
                    <th class="px-5 py-3">Discount</th>
                    <th class="px-5 py-3">Fine</th>
                    <th class="px-5 py-3">Paid Amount</th>
                    <th class="px-5 py-3">Balance</th>
                    <th class="px-5 py-3">Status</th>
                    <th class="px-5 py-3">Receipts</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                  <tr
                    v-for="inv in feeInvoices"
                    :key="inv.id"
                    class="hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                  >
                    <td class="px-5 py-3.5 font-medium text-indigo-600 dark:text-indigo-400">
                      {{ inv.invoice_number }}
                    </td>
                    <td class="px-5 py-3.5 text-gray-900 dark:text-white">
                      {{ inv.title || 'Tuition Fee' }}
                    </td>
                    <td class="px-5 py-3.5 text-gray-500">
                      {{ inv.due_date ? formatDate(inv.due_date) : '—' }}
                    </td>
                    <td class="px-5 py-3.5 font-semibold text-gray-900 dark:text-white">
                      ₹{{ formatCurrency(inv.total_amount) }}
                    </td>
                    <td class="px-5 py-3.5 text-gray-500">
                      ₹{{ formatCurrency(inv.discount_amount || 0) }}
                    </td>
                    <td class="px-5 py-3.5 text-gray-500">
                      ₹{{ formatCurrency(inv.late_fee_amount || 0) }}
                    </td>
                    <td class="px-5 py-3.5 text-emerald-600 font-medium">
                      ₹{{ formatCurrency(inv.paid_amount || 0) }}
                    </td>
                    <td
                      class="px-5 py-3.5 font-medium"
                      :class="(inv.balance_amount || 0) > 0 ? 'text-rose-600' : 'text-gray-400'"
                    >
                      ₹{{ formatCurrency(inv.balance_amount || 0) }}
                    </td>
                    <td class="px-5 py-3.5">
                      <StatusBadge :status="inv.status || 'pending'" type="invoice" />
                    </td>
                    <td class="px-5 py-3.5">
                      <button
                        v-for="payment in inv.payments || []"
                        :key="payment.id"
                        class="block text-left text-indigo-600 dark:text-indigo-400 hover:underline"
                        @click="
                          selectedReceipt = {
                            ...payment,
                            invoice_number: inv.invoice_number,
                            student_name:
                              `${currentStudent?.first_name || ''} ${currentStudent?.last_name || ''}`.trim()
                          }
                        "
                      >
                        {{ payment.receipt_number }}
                      </button>
                      <span v-if="!inv.payments?.length" class="text-gray-400">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else-if="!feeInvoiceLoading && !feeInvoiceError" class="p-8 text-center text-gray-400 text-sm">
              No fee invoices found for this student.
            </div>
            <div v-if="feeInvoicePage.total > 0" class="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p class="text-xs text-gray-500">
                Showing {{ feeInvoiceRange.start }}–{{ feeInvoiceRange.end }} of {{ feeInvoicePage.total }} invoices
              </p>
              <nav v-if="feeInvoicePage.totalPages > 1" class="flex items-center gap-2" aria-label="Fee invoice pages">
                <button
                  type="button"
                  class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
                  :disabled="feeInvoicePage.page <= 1 || feeInvoiceLoading"
                  @click="loadFeeInvoices(feeInvoicePage.page - 1, activeChildId)"
                >Previous</button>
                <span class="text-xs text-gray-500">Page {{ feeInvoicePage.page }} of {{ feeInvoicePage.totalPages }}</span>
                <button
                  type="button"
                  class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
                  :disabled="feeInvoicePage.page >= feeInvoicePage.totalPages || feeInvoiceLoading"
                  @click="loadFeeInvoices(feeInvoicePage.page + 1, activeChildId)"
                >Next</button>
              </nav>
            </div>
          </div>
          <div
            v-if="selectedReceipt"
            class="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4"
            @click.self="selectedReceipt = null"
          >
            <section
              id="parent-receipt-print"
              class="w-full max-w-md rounded-2xl bg-white p-6 text-gray-900 shadow-xl"
              role="dialog"
              aria-modal="true"
              aria-label="Fee receipt"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h3 class="text-lg font-bold">Fee Receipt</h3>
                  <p class="text-sm text-gray-500">Fee payment receipt</p>
                </div>
                <button
                  class="receipt-screen-only text-gray-500"
                  aria-label="Close receipt"
                  @click="selectedReceipt = null"
                >
                  ✕
                </button>
              </div>
              <dl class="mt-5 grid grid-cols-2 gap-3 text-sm">
                <dt class="text-gray-500">Receipt No.</dt>
                <dd class="font-semibold">{{ selectedReceipt.receipt_number }}</dd>
                <dt class="text-gray-500">Student</dt>
                <dd>{{ selectedReceipt.student_name }}</dd>
                <dt class="text-gray-500">Invoice</dt>
                <dd>{{ selectedReceipt.invoice_number }}</dd>
                <dt class="text-gray-500">Date</dt>
                <dd>{{ formatDate(selectedReceipt.payment_date) }}</dd>
                <dt class="text-gray-500">Payment method</dt>
                <dd class="capitalize">{{ selectedReceipt.payment_method?.replace('_', ' ') }}</dd>
                <dt class="text-gray-500">Amount paid</dt>
                <dd class="font-bold">₹{{ formatCurrency(selectedReceipt.payment_amount) }}</dd>
              </dl>
              <div class="receipt-screen-only mt-6 flex justify-end gap-2">
                <button class="rounded-lg border px-4 py-2 text-sm" @click="selectedReceipt = null">
                  Close
                </button>
                <button
                  class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
                  @click="printReceipt"
                >
                  Print
                </button>
              </div>
            </section>
          </div>
        </div>

        <!-- Tab 4: Homework -->
        <div v-else-if="activeTab === 'homework'" class="space-y-5">
          <section v-for="section in homeworkSections" :key="section.id" class="space-y-3">
            <div
              class="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2"
            >
              <h3 class="font-semibold text-gray-900 dark:text-white">{{ section.title }}</h3>
              <span class="text-xs text-gray-500">{{ section.homeworks.length }}</span>
            </div>
            <div v-if="section.homeworks.length > 0" class="grid gap-4 md:grid-cols-2">
              <div
                v-for="hw in section.homeworks"
                :key="hw.id"
                class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/80 p-5 shadow-xs space-y-3"
              >
                <div class="flex items-center justify-between">
                  <span
                    class="inline-flex px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                  >
                    {{ hw.subject?.name || 'General' }}
                  </span>
                  <span class="text-xs text-gray-500 flex items-center gap-1">
                    <Clock class="w-3.5 h-3.5" /> Due:
                    {{ hw.due_date ? formatDate(hw.due_date) : 'N/A' }}
                  </span>
                </div>
                <div>
                  <h4 class="font-bold text-base text-gray-900 dark:text-white">{{ hw.title }}</h4>
                  <p class="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                    {{ hw.description || 'No additional instructions.' }}
                  </p>
                  <a
                    v-if="safeHomeworkAttachmentUrl(hw.attachment_url)"
                    :href="safeHomeworkAttachmentUrl(hw.attachment_url)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex mt-2 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Open attached resource
                  </a>
                </div>
                <div
                  class="pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs text-gray-400"
                >
                  <span>Assigned: {{ formatDate(hw.created_at) }}</span>
                  <span
                    class="font-semibold"
                    :class="
                      hw.submissions?.[0]?.evaluated_at
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    "
                  >
                    {{
                      hw.submissions?.[0]?.evaluated_at
                        ? `Graded · ${hw.submissions[0].marks}`
                        : hw.submissions?.length
                          ? 'Submitted · awaiting review'
                          : 'Not submitted'
                    }}
                  </span>
                </div>
                <div v-if="isStudent" class="space-y-2">
                  <p
                    v-if="hw.submissions?.[0]?.evaluated_at"
                    class="text-sm text-gray-700 dark:text-gray-200"
                  >
                    {{ hw.submissions[0].remarks || 'Your work has been evaluated.' }}
                  </p>
                  <template v-else>
                    <label
                      :for="`homework-submission-${hw.id}`"
                      class="block text-xs font-medium text-gray-600 dark:text-gray-300"
                    >
                      Your work
                    </label>
                    <textarea
                      :id="`homework-submission-${hw.id}`"
                      :value="homeworkDraft(hw)"
                      maxlength="50000"
                      rows="4"
                      class="input-field w-full"
                      placeholder="Write your response"
                      @input="updateHomeworkDraft(hw, $event)"
                    />
                    <p v-if="submissionErrors[hw.id]" class="text-xs text-red-600">
                      {{ submissionErrors[hw.id] }}
                    </p>
                    <div class="flex justify-end">
                      <button
                        class="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                        :disabled="savingHomeworkId === hw.id"
                        @click="submitHomework(hw)"
                      >
                        {{
                          savingHomeworkId === hw.id
                            ? 'Submitting…'
                            : hw.submissions?.length
                              ? 'Update submission'
                              : 'Submit work'
                        }}
                      </button>
                    </div>
                  </template>
                </div>
                <p
                  v-else-if="isParent && hw.submissions?.[0]?.evaluated_at"
                  class="text-sm text-gray-600 dark:text-gray-300"
                >
                  Teacher feedback: {{ hw.submissions[0].remarks || 'No remarks' }}
                </p>
              </div>
            </div>
            <div
              v-else
              class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-400 text-sm"
            >
              {{ section.emptyMessage }}
            </div>
          </section>
        </div>

        <div v-else-if="activeTab === 'materials'" class="space-y-4">
          <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-700 dark:bg-gray-800">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Class study materials</h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Resources shared with your current class.</p>
            <div v-if="data.studyMaterials?.length" class="mt-4 divide-y divide-gray-100 dark:divide-gray-700">
              <article v-for="material in data.studyMaterials" :key="material.id" class="py-4 first:pt-0 last:pb-0">
                <h3 class="font-medium text-gray-900 dark:text-white">{{ material.title }}</h3>
                <p v-if="material.subject_name || material.topic" class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ [material.subject_name, material.topic].filter(Boolean).join(' · ') }}</p>
                <a v-if="safeStudyMaterialUrl(material.external_url || material.notes)" :href="safeStudyMaterialUrl(material.external_url || material.notes)" target="_blank" rel="noopener noreferrer" class="mt-1 inline-flex text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">Open {{ material.resource_type === 'video' ? 'video' : 'resource' }}</a>
                <button v-else-if="material.file_available" type="button" class="mt-1 inline-flex text-sm font-medium text-indigo-600 hover:underline disabled:opacity-50 dark:text-indigo-400" :disabled="downloadingMaterialId === material.id" @click="downloadStudyMaterial(material)">{{ downloadingMaterialId === material.id ? 'Downloading…' : 'Download file' }}</button>
                <p v-else-if="material.notes" class="mt-1 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">{{ material.notes }}</p>
                <p class="mt-2 text-xs text-gray-400">Shared {{ formatDate(material.created_at) }}</p>
              </article>
            </div>
            <p v-else class="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-500 dark:bg-gray-900 dark:text-gray-400">No study materials have been shared with your class yet.</p>
          </section>
        </div>

        <!-- Tab 5: Exam Results -->
        <div v-else-if="activeTab === 'exams'" class="space-y-4">
          <div
            class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/80 overflow-hidden shadow-xs"
          >
            <div class="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 class="font-bold text-gray-900 dark:text-white">
                    Academic Examination Report Card
                  </h3>
                  <p class="text-xs text-gray-500 mt-0.5">
                    Recorded marks and official evaluations
                  </p>
                </div>
                <select
                  v-if="publishedReportCardSetups.length"
                  v-model="selectedReportCardSetupId"
                  aria-label="Published report-card setup"
                  class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                >
                  <option value="">All released exams</option>
                  <option
                    v-for="setup in publishedReportCardSetups"
                    :key="setup.id"
                    :value="setup.id"
                  >
                    {{ setup.name }}
                  </option>
                </select>
                <button
                  v-if="(data.examResults || []).length"
                  type="button"
                  class="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
                  :disabled="downloadingReportCard"
                  @click="downloadReportCard"
                >
                  {{
                    downloadingReportCard
                      ? 'Preparing…'
                      : selectedReportCardSetupId
                        ? 'Download weighted report card'
                        : 'Download report card'
                  }}
                </button>
              </div>
            </div>

            <div v-if="(data.examResults || []).length > 0" class="overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead
                  class="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700"
                >
                  <tr>
                    <th class="px-5 py-3">Examination</th>
                    <th class="px-5 py-3">Marks Obtained</th>
                    <th class="px-5 py-3">Max Marks</th>
                    <th class="px-5 py-3">Percentage</th>
                    <th class="px-5 py-3">Grade</th>
                    <th class="px-5 py-3">Remarks</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                  <tr
                    v-for="res in data.examResults"
                    :key="res.id"
                    class="hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                  >
                    <td class="px-5 py-3.5 font-medium text-gray-900 dark:text-white">
                      {{ res.exam_name || res.exam?.name || 'Examination' }}
                    </td>
                    <td class="px-5 py-3.5 font-bold text-indigo-600 dark:text-indigo-400">
                      {{ res.marks_obtained }}
                    </td>
                    <td class="px-5 py-3.5 text-gray-500">
                      {{ res.total_marks ?? res.exam?.max_marks ?? '—' }}
                    </td>
                    <td class="px-5 py-3.5 font-semibold text-gray-900 dark:text-white">
                      {{ res.percentage }}%
                    </td>
                    <td class="px-5 py-3.5">
                      <span
                        class="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300"
                      >
                        {{ res.grade || 'A' }}
                      </span>
                    </td>
                    <td class="px-5 py-3.5 text-xs text-gray-500">
                      {{ res.remarks || 'Satisfactory' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="p-8 text-center text-gray-400 text-sm">
              No examination report cards recorded.
            </div>
          </div>
        </div>

        <!-- Tab 6: Timetable -->
        <div v-else-if="activeTab === 'timetable'" class="space-y-4">
          <div
            class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/80 p-5 shadow-xs"
          >
            <h3 class="font-bold text-gray-900 dark:text-white mb-4">Class Schedule</h3>
            <div
              v-if="(data.timetable || []).length > 0"
              class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              <div
                v-for="slot in data.timetable"
                :key="slot.id"
                class="p-3.5 rounded-xl border border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/30"
              >
                <div
                  class="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-1"
                >
                  <span>{{ getDayName(slot.day_of_week) }}</span>
                  <span>{{ slot.start_time }} - {{ slot.end_time }}</span>
                </div>
                <p class="font-bold text-sm text-gray-900 dark:text-white">
                  {{ slot.subject?.name || slot.subject || 'Subject' }}
                </p>
                <p class="text-xs text-gray-500 mt-0.5">
                  Room: {{ slot.room_number || 'Main Classroom' }}
                </p>
              </div>
            </div>
            <div v-else class="p-8 text-center text-gray-400 text-sm">
              No active timetable is configured for this class and section yet.
            </div>
          </div>
        </div>

        <!-- Tab 7: Transport & Services -->
        <div v-else-if="activeTab === 'services'" class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <!-- Transport Info -->
          <div
            class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/80 p-5 shadow-xs"
          >
            <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <Bus class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              School Transport
            </h3>
            <div v-if="data.transport" class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <p><strong>Route:</strong> {{ data.transport.route?.name || 'Assigned Route' }}</p>
              <p>
                <strong>Vehicle:</strong>
                {{ data.transport.vehicle?.vehicle_number || 'School Bus' }}
              </p>
              <p>
                <strong>Pickup Point:</strong>
                {{ data.transport.pickup_point || 'Designated Stop' }}
              </p>
            </div>
            <p v-else class="text-xs text-gray-400 py-4">No school bus transport allocated.</p>
          </div>

          <!-- Library Books -->
          <div
            class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/80 p-5 shadow-xs"
          >
            <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <BookOpen class="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Library Borrowing
            </h3>
            <div v-if="(data.libraryIssues || []).length > 0" class="space-y-2">
              <div
                v-for="issue in data.libraryIssues"
                :key="issue.id"
                class="flex items-center justify-between text-xs p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-700/60"
              >
                <div>
                  <p class="font-semibold text-gray-900 dark:text-white">
                    {{ issue.book?.title || 'Library Book' }}
                  </p>
                  <p class="text-gray-500">
                    {{ getLibraryIssueStatus(issue) === 'overdue' ? 'Overdue since' : 'Return by' }}:
                    {{ formatDate(issue.due_date) }}
                  </p>
                </div>
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                  :class="
                    getLibraryIssueStatus(issue) === 'returned'
                      ? 'bg-emerald-100 text-emerald-800'
                      : getLibraryIssueStatus(issue) === 'overdue'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                  "
                >
                  {{ getLibraryIssueStatus(issue) }}
                </span>
              </div>
            </div>
            <p v-else class="text-xs text-gray-400 py-4">
              No books currently borrowed from library.
            </p>
          </div>

          <div
            class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/80 p-5 shadow-xs"
          >
            <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <Building2 class="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Hostel Accommodation
            </h3>
            <div v-if="data.hostel" class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <p>An accommodation allocation record is linked to this student.</p>
              <p>
                <strong>Hostel:</strong> {{ data.hostel.hostel?.hostel_name || 'School hostel' }}
              </p>
              <p><strong>Room:</strong> {{ data.hostel.room?.room_number || 'Assigned' }}</p>
              <p v-if="data.hostel.month">
                <strong>Allocation month:</strong> {{ data.hostel.month }}
              </p>
            </div>
            <p v-else class="text-xs text-gray-400 py-4">No hostel accommodation allocated.</p>
          </div>

          <section
            class="md:col-span-2 xl:col-span-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/80 p-5 shadow-xs"
          >
            <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BookOpen class="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Available Library Books
              </h3>
              <input
                v-model="librarySearch"
                type="search"
                aria-label="Search library books"
                placeholder="Search title, author, or category"
                @keydown.enter.prevent="loadLibraryCatalog(1)"
                class="w-full sm:max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              <select
                v-model="libraryCategory"
                aria-label="Filter library books by category"
                @change="loadLibraryCatalog(1)"
                class="w-full sm:max-w-48 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">All categories</option>
                <option v-for="category in libraryCategories" :key="category" :value="category">
                  {{ category }}
                </option>
              </select>
              <button
                type="button"
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                :disabled="libraryLoading"
                @click="loadLibraryCatalog(1)"
              >
                {{ libraryLoading ? 'Searching…' : 'Search' }}
              </button>
            </div>
            <div
              v-if="filteredLibraryCatalog.length"
              class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              <article
                v-for="book in filteredLibraryCatalog"
                :key="book.id"
                class="rounded-xl border border-gray-100 bg-gray-50/70 p-3 dark:border-gray-700 dark:bg-gray-900/40"
              >
                <p class="font-semibold text-sm text-gray-900 dark:text-white">{{ book.title }}</p>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {{ book.author || 'Author not listed'
                  }}<span v-if="book.category"> · {{ book.category }}</span>
                </p>
                <p class="mt-2 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                  {{ book.available }} of {{ book.quantity }} available
                </p>
                <div class="mt-2 flex items-center justify-between gap-2">
                  <span v-if="requestForBook(book.id)" class="text-xs font-medium capitalize text-amber-700 dark:text-amber-300">
                    {{ requestForBook(book.id).status }}
                  </span>
                  <span v-else></span>
                  <button
                    v-if="!requestForBook(book.id)"
                    type="button"
                    class="rounded-md border border-indigo-300 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-700 dark:text-indigo-300"
                    :disabled="libraryRequestSaving === book.id || Number(book.available) < 1"
                    @click="requestBook(book)"
                  >{{ libraryRequestSaving === book.id ? 'Requesting…' : 'Request book' }}</button>
                </div>
              </article>
            </div>
            <p v-else class="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              {{
                libraryTotal
                  ? 'No books match your search.'
                  : 'No library books are available for this branch.'
              }}
            </p>
            <p v-if="libraryError" class="mt-3 text-sm text-red-600" role="alert">
              {{ libraryError }}
            </p>
            <p v-if="libraryRequestError" class="mt-3 text-sm text-red-600" role="alert">{{ libraryRequestError }}</p>
            <div v-if="libraryRequests.length" class="mt-5 border-t border-gray-100 pt-4 dark:border-gray-700">
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white">My book requests</h4>
              <div class="mt-2 divide-y divide-gray-100 dark:divide-gray-700">
                <div v-for="request in libraryRequests" :key="request.id" class="flex items-center justify-between gap-3 py-2 text-sm">
                  <span class="truncate text-gray-700 dark:text-gray-300">{{ request.book?.title || 'Library book' }}</span>
                  <span class="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-700 dark:bg-gray-700 dark:text-gray-200">{{ request.status }}</span>
                </div>
              </div>
            </div>
            <div
              v-if="libraryTotalPages > 1"
              class="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-sm dark:border-gray-700"
            >
              <span class="text-gray-500">{{ libraryTotal }} books · Page {{ libraryPage }} of {{ libraryTotalPages }}</span>
              <div class="flex gap-2">
                <button type="button" class="rounded border px-3 py-1 disabled:opacity-50" :disabled="libraryLoading || libraryPage <= 1" @click="loadLibraryCatalog(libraryPage - 1)">Previous</button>
                <button type="button" class="rounded border px-3 py-1 disabled:opacity-50" :disabled="libraryLoading || libraryPage >= libraryTotalPages" @click="loadLibraryCatalog(libraryPage + 1)">Next</button>
              </div>
            </div>
          </section>
        </div>

        <!-- Tab 8: Notices & Announcements -->
        <div
          v-else-if="activeTab === 'notices'"
          class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/80 p-6 shadow-xs"
        >
          <div
            class="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700"
          >
            <div>
              <h3 class="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                <Bell class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                School Notices & Announcements
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Official circulars, events, and announcements from school administration
              </p>
            </div>
            <span
              class="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
            >
              {{ (data.notices || []).length }} active notice(s)
            </span>
          </div>

          <div v-if="!(data.notices || []).length" class="text-center py-12 text-gray-400">
            <Bell class="w-12 h-12 mx-auto mb-2 opacity-40" />
            <p class="font-medium text-gray-600 dark:text-gray-300">No active notices</p>
            <p class="text-xs text-gray-400 mt-1">All school circulars will be displayed here.</p>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="notice in data.notices"
              :key="notice.id"
              class="p-4 rounded-xl border border-gray-200 dark:border-gray-700/80 hover:border-indigo-300 transition-colors bg-gray-50/50 dark:bg-gray-800/50"
            >
              <div class="flex items-center justify-between gap-3 mb-2">
                <h4 class="font-semibold text-gray-900 dark:text-white text-base">
                  {{ notice.title }}
                </h4>
                <span
                  class="text-xs font-medium text-gray-500 whitespace-nowrap px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700"
                >
                  {{ notice.date_value || formatDate(notice.created_at) }}
                </span>
              </div>
              <p
                v-if="notice.notes"
                class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed"
              >
                {{ notice.notes }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import StatusBadge from '~/components/ui/StatusBadge.vue';
import { Portal, StudyMaterials } from '~/api/shared/dynamic-entities';
import { Homeworks } from '~/api/students/academic-services';
import { apiErrorMessage } from '~/utils/list-response';
import {
  getCalendarWeekAgendaItems,
  getCalendarWeekRange,
  getCalendarYearItems
} from '~/utils/calendarYearItems';
import { getHomeworkBuckets } from '~/utils/homeworkStatus';
import { safeStudyMaterialUrl } from '~/utils/safeStudyMaterialUrl';
import { getLibraryIssueStatus } from '~/utils/libraryIssueStatus.js';
import { useToast } from '~/composables/useToast';
import { useCommon } from '~/composables/useCommon';
import {
  Calendar,
  CreditCard,
  FileText,
  Award,
  BookOpen,
  Clock,
  Bus,
  Building2,
  AlertTriangle,
  LayoutGrid,
  Bell,
  Users
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const { user } = useAuth();
const { showToast } = useToast();
const { downloadFile } = useCommon();
const apiOrigin = new URL(useRuntimeConfig().public.apiBase).origin;

const data = ref<any>({});
const loading = ref(false);
const errorMessage = ref('');
const downloadingMaterialId = ref('');
const studyMaterialsAvailable = ref(false);
const activeChildId = ref<string>('');
const selectedReceipt = ref<any>(null);
const activeTab = ref<string>((route.query.tab as string) || 'overview');
const feeInvoices = ref<any[]>([]);
const feeInvoicePage = ref({ total: 0, page: 1, limit: 10, totalPages: 0 });
const feeInvoiceLoading = ref(false);
const feeInvoiceError = ref('');
let feeInvoiceRequestId = 0;
const librarySearch = ref('');
const libraryCategory = ref('');
const libraryCategories = ref<string[]>([]);
const libraryPage = ref(1);
const libraryTotal = ref(0);
const libraryTotalPages = ref(0);
const libraryLoading = ref(false);
const libraryError = ref('');
let libraryRequestId = 0;
const libraryRequests = ref<any[]>([]);
const libraryRequestError = ref('');
const libraryRequestSaving = ref('');
const submissionDrafts = ref<Record<string, string>>({});
const submissionErrors = ref<Record<string, string>>({});
const savingHomeworkId = ref('');
const visitForm = ref({ date: '', time: '', person_to_meet: '', purpose: '' });
const savingVisit = ref(false);
const downloadingReportCard = ref(false);
const publishedReportCardSetups = ref<any[]>([]);
const selectedReportCardSetupId = ref('');
const visitError = ref('');
const visitLoadError = ref('');
const ptmLoadError = ref('');
const ptmFeedbackError = ref<Record<string, string>>({});
const ptmDrafts = ref<Record<string, { rating: number; feedback: string }>>({});
const savingPtmId = ref('');
const visitDateMin = (() => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
})();
const calendarMode = ref<'month' | 'year' | 'list'>('month');
const calendarCursor = ref(new Date());
const calendarSelectedDay = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();
const selectedCalendarDay = ref(calendarSelectedDay);
const calendarWeekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const homeworkBuckets = computed(() => getHomeworkBuckets(data.value.homeworks || []));
const safeHomeworkAttachmentUrl = (value: unknown) => {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    if (value.startsWith('/uploads/schools/')) {
      if (!/^\/uploads\/schools\/[A-Za-z0-9_-]+\/documents\/\d{4}\/[A-Za-z0-9_-]+(?:\.[A-Za-z0-9]+)?$/.test(value)) return '';
      return new URL(value, apiOrigin).href;
    }
    const url = new URL(value.trim());
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
  } catch {
    return '';
  }
};
const pendingHomeworks = computed(() => homeworkBuckets.value.pending);
const pastHomeworks = computed(() => homeworkBuckets.value.past);
const homeworkSections = computed(() => [
  {
    id: 'pending',
    title: 'Pending Assignments',
    emptyMessage: 'No pending homework assignments.',
    homeworks: pendingHomeworks.value
  },
  {
    id: 'past',
    title: 'Past Assignments',
    emptyMessage: 'Completed and expired assignments will be listed here.',
    homeworks: pastHomeworks.value
  }
]);

watch(
  () => route.query.tab,
  newTab => {
    if (newTab && typeof newTab === 'string') {
      activeTab.value = newTab;
    } else if (!newTab) {
      activeTab.value = 'overview';
    }
  }
);

watch([activeTab, activeChildId], ([tab, studentId]) => {
  if (tab === 'fees' && studentId) void loadFeeInvoices(1, studentId);
  if (tab === 'services' && studentId) {
    void loadLibraryRequests(studentId);
    void loadLibraryCatalog(1);
  }
});

const selectTab = (tabId: string) => {
  activeTab.value = tabId;
  const newQuery = { ...route.query };
  if (tabId === 'overview') {
    delete newQuery.tab;
  } else {
    newQuery.tab = tabId;
  }
  router.replace({ query: newQuery });
};

const visitStatusLabel = (status: string) =>
  status === 'pending'
    ? 'Awaiting confirmation'
    : status.charAt(0).toUpperCase() + status.slice(1).replaceAll('_', ' ');
const ptmAttendanceLabel = (status: string) =>
  ({
    pending: 'Awaiting',
    present: 'Present',
    absent: 'Absent',
    rescheduled: 'Rescheduled'
  })[status] || 'Awaiting';
const ptmModeLabel = (mode: string) =>
  ({ in_person: 'In person', online: 'Online', hybrid: 'Hybrid' })[mode] || 'In person';
const safePtmMeetingUrl = (value: unknown) => {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && url.hostname && !url.username && !url.password
      ? url.href
      : '';
  } catch {
    return '';
  }
};
const isPtmFeedbackOpen = (record: any) =>
  Boolean(record.meeting?.meeting_date && record.meeting.meeting_date <= new Date().toISOString().slice(0, 10));

const isParent = computed(() =>
  user.value?.role ? user.value.role === 'parent' : data.value.kind === 'parent'
);
const isStudent = computed(() =>
  user.value?.role ? user.value.role === 'student' : data.value.kind === 'student'
);
const currentStudent = computed(() => data.value.student || null);

const homeworkDraftKey = (hw: any) => `${currentStudent.value?.id || 'student'}:${hw.id}`;
const homeworkDraft = (hw: any) =>
  submissionDrafts.value[homeworkDraftKey(hw)] ?? hw.submissions?.[0]?.submission_text ?? '';
const updateHomeworkDraft = (hw: any, event: Event) => {
  submissionDrafts.value[homeworkDraftKey(hw)] = (event.target as HTMLTextAreaElement).value;
};

const submitHomework = async (hw: any) => {
  const text = homeworkDraft(hw).trim();
  if (!text) {
    submissionErrors.value[hw.id] = 'Write your response before submitting.';
    return;
  }
  savingHomeworkId.value = hw.id;
  submissionErrors.value[hw.id] = '';
  try {
    await Homeworks.submitWork(hw.id, { submission_text: text });
    showToast('Homework submitted', 'success');
    await loadData(activeChildId.value || undefined);
  } catch (error: any) {
    submissionErrors.value[hw.id] = apiErrorMessage(error);
  } finally {
    savingHomeworkId.value = '';
  }
};

const attendanceSummary = computed(() => {
  return (
    data.value.attendance || {
      rate: 0,
      present: 0,
      absent: 0,
      late: 0,
      total: 0
    }
  );
});
const attendanceRateLabel = computed(() =>
  attendanceSummary.value.total ? `${attendanceSummary.value.rate}%` : 'N/A'
);
const attendanceDaysLabel = computed(() =>
  attendanceSummary.value.total
    ? `${attendanceSummary.value.present + attendanceSummary.value.late}/${attendanceSummary.value.total} sessions attended`
    : 'No records'
);

const attendanceRecords = computed(() => {
  return data.value.attendance?.records || [];
});
const calendarNoticeDate = (notice: any) =>
  String(notice.date_value || notice.created_at || '').slice(0, 10);
const calendarYearItems = computed(() =>
  getCalendarYearItems(
    calendarCursor.value.getFullYear(),
    data.value.calendarEvents,
    data.value.notices
  )
);
const calendarAgendaItems = computed(() =>
  getCalendarWeekAgendaItems(
    selectedCalendarDay.value,
    data.value.calendarEvents,
    data.value.notices,
    attendanceRecords.value
  )
);
const calendarHeading = computed(() =>
  calendarMode.value === 'year'
    ? String(calendarCursor.value.getFullYear())
    : calendarMode.value === 'list'
      ? formatCalendarWeekHeading(getCalendarWeekRange(selectedCalendarDay.value))
      : calendarCursor.value.toLocaleDateString('en', { month: 'long', year: 'numeric' })
);
const calendarMonthDays = computed(() => {
  const year = calendarCursor.value.getFullYear();
  const month = calendarCursor.value.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return {
      date: key,
      dayOfMonth: date.getDate(),
      inMonth: date.getMonth() === month,
      isToday: key === calendarSelectedDay,
      attendanceCount: attendanceRecords.value.filter(
        (record: any) => String(record.date).slice(0, 10) === key
      ).length,
      eventCount: (data.value.calendarEvents || []).filter(
        (event: any) => String(event.date).slice(0, 10) === key
      ).length,
      noticeCount: (data.value.notices || []).filter(
        (notice: any) => calendarNoticeDate(notice) === key
      ).length
    };
  });
});
const calendarYearMonths = computed(() =>
  Array.from({ length: 12 }, (_, month) => {
    const year = calendarCursor.value.getFullYear();
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return {
      month,
      label: new Date(year, month, 1).toLocaleDateString('en', { month: 'long' }),
      eventCount: (data.value.calendarEvents || []).filter((event: any) =>
        String(event.date).startsWith(prefix)
      ).length,
      attendanceCount: attendanceRecords.value.filter((record: any) =>
        String(record.date).startsWith(prefix)
      ).length,
      noticeCount: (data.value.notices || []).filter((notice: any) =>
        calendarNoticeDate(notice).startsWith(prefix)
      ).length
    };
  })
);
const selectedDayEvents = computed(() =>
  (data.value.calendarEvents || []).filter(
    (event: any) => String(event.date).slice(0, 10) === selectedCalendarDay.value
  )
);
const selectedDayNotices = computed(() =>
  (data.value.notices || []).filter(
    (notice: any) => calendarNoticeDate(notice) === selectedCalendarDay.value
  )
);
const selectedDayAttendance = computed(() =>
  attendanceRecords.value.filter(
    (record: any) => String(record.date).slice(0, 10) === selectedCalendarDay.value
  )
);
const formatCalendarDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};
const formatCalendarWeekHeading = (range: { startDate: string; endDate: string } | null) => {
  if (!range) return 'This week';
  const format = (value: string, options: Intl.DateTimeFormatOptions) => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en', options);
  };
  return `${format(range.startDate, { month: 'short', day: 'numeric' })} – ${format(range.endDate, { month: 'short', day: 'numeric', year: 'numeric' })}`;
};
const moveCalendarPeriod = (amount: number) => {
  if (calendarMode.value === 'list') {
    const next = new Date(`${selectedCalendarDay.value}T00:00:00`);
    next.setDate(next.getDate() + amount * 7);
    selectedCalendarDay.value = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
    calendarCursor.value = new Date(next.getFullYear(), next.getMonth(), 1);
    return;
  }
  const next = new Date(calendarCursor.value);
  if (calendarMode.value === 'year') next.setFullYear(next.getFullYear() + amount);
  else next.setMonth(next.getMonth() + amount, 1);
  calendarCursor.value = next;
  selectedCalendarDay.value = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`;
};
const goToToday = () => {
  const today = new Date();
  selectedCalendarDay.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  calendarCursor.value = new Date(today.getFullYear(), today.getMonth(), 1);
};
const selectCalendarMonth = (month: number) => {
  const year = calendarCursor.value.getFullYear();
  calendarCursor.value = new Date(year, month, 1);
  selectedCalendarDay.value = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  calendarMode.value = 'month';
};
const openCalendarYearItem = (date: string) => {
  const [year, month] = date.split('-').map(Number);
  calendarCursor.value = new Date(year, month - 1, 1);
  selectedCalendarDay.value = date;
  calendarMode.value = 'month';
};
const attendanceSessionLabel = (session: any) =>
  session.attendance_type === 'period' ? `Period ${session.period_number || ''}`.trim() : 'Daily';
const filteredLibraryCatalog = computed(() => data.value.libraryCatalog || []);
const feeInvoiceRange = computed(() => ({
  start: feeInvoicePage.value.total ? (feeInvoicePage.value.page - 1) * feeInvoicePage.value.limit + 1 : 0,
  end: Math.min(feeInvoicePage.value.page * feeInvoicePage.value.limit, feeInvoicePage.value.total)
}));
async function loadFeeInvoices(page = 1, studentId = activeChildId.value) {
  if (!studentId) return;
  const requestId = ++feeInvoiceRequestId;
  feeInvoiceLoading.value = true;
  feeInvoiceError.value = '';
  try {
    const response: any = await Portal.feeInvoices({ student_id: studentId, page, limit: 10 });
    if (requestId !== feeInvoiceRequestId || activeChildId.value !== studentId) return;
    feeInvoices.value = response.data || [];
    feeInvoicePage.value = response.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 };
  } catch (error: any) {
    if (requestId === feeInvoiceRequestId) {
      feeInvoices.value = [];
      feeInvoicePage.value = { total: 0, page: 1, limit: 10, totalPages: 0 };
      feeInvoiceError.value = apiErrorMessage(error);
    }
  } finally {
    if (requestId === feeInvoiceRequestId) feeInvoiceLoading.value = false;
  }
}
const loadLibraryCatalog = async (page = 1) => {
  const studentId = activeChildId.value || data.value.student?.id;
  if (!studentId) return;
  const requestId = ++libraryRequestId;
  libraryLoading.value = true;
  libraryError.value = '';
  try {
    const response: any = await Portal.libraryBooks({
      student_id: studentId,
      search: librarySearch.value,
      category: libraryCategory.value,
      page,
      limit: 12
    });
    if (requestId !== libraryRequestId || (activeChildId.value && activeChildId.value !== studentId)) return;
    data.value.libraryCatalog = response.data || [];
    libraryCategories.value = response.categories || [];
    libraryPage.value = response.pagination?.page || page;
    libraryTotal.value = response.pagination?.total || 0;
    libraryTotalPages.value = response.pagination?.totalPages || 0;
  } catch (error: any) {
    if (requestId === libraryRequestId) libraryError.value = apiErrorMessage(error);
  } finally {
    if (requestId === libraryRequestId) libraryLoading.value = false;
  }
};

const requestForBook = (bookId: string) => libraryRequests.value.find(request => request.book_id === bookId && ['pending', 'approved'].includes(request.status));

const loadLibraryRequests = async (studentId = activeChildId.value || data.value.student?.id) => {
  if (!studentId) return;
  libraryRequestError.value = '';
  try {
    const response: any = await Portal.libraryRequests({ student_id: studentId });
    if ((activeChildId.value || data.value.student?.id) !== studentId) return;
    libraryRequests.value = response.data || [];
  } catch (error: any) {
    libraryRequestError.value = apiErrorMessage(error);
  }
};

const requestBook = async (book: any) => {
  const studentId = activeChildId.value || data.value.student?.id;
  if (!studentId) return;
  libraryRequestSaving.value = book.id;
  libraryRequestError.value = '';
  try {
    await Portal.requestLibraryBook({ student_id: studentId, book_id: book.id });
    await loadLibraryRequests(studentId);
  } catch (error: any) {
    libraryRequestError.value = apiErrorMessage(error);
  } finally {
    libraryRequestSaving.value = '';
  }
};

const pendingFeesTotal = computed(() => {
  if (data.value.feeSummary) return Number(data.value.feeSummary.due_balance) || 0;
  const invoices = data.value.invoices || [];
  return invoices.reduce((sum: number, inv: any) => {
    if (inv.status !== 'paid') {
      return sum + (parseFloat(inv.balance_amount) || parseFloat(inv.total_amount) || 0);
    }
    return sum;
  }, 0);
});

const pendingInvoicesCount = computed(() => {
  if (data.value.dueInvoiceCount != null) return Number(data.value.dueInvoiceCount) || 0;
  const invoices = data.value.invoices || [];
  return invoices.filter((inv: any) =>
    !['paid', 'draft', 'cancelled'].includes(inv.status) && Number(inv.balance_amount) > 0
  ).length;
});

const tabs = computed(() => [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: Calendar,
    badge: (data.value.calendarEvents || []).length
  },
  ...(isParent.value ? [{ id: 'school-visit', label: 'School Visit', icon: Calendar }] : []),
  ...(isParent.value ? [{ id: 'ptm', label: 'Parent–Teacher Meetings', icon: Users }] : []),
  { id: 'attendance', label: 'Attendance', icon: Calendar, badge: attendanceSummary.value.absent },
  { id: 'fees', label: 'Fees & Invoices', icon: CreditCard, badge: pendingInvoicesCount.value },
  { id: 'homework', label: 'Homework', icon: FileText, badge: (data.value.homeworks || []).length },
  ...(isStudent.value && studyMaterialsAvailable.value ? [{ id: 'materials', label: 'Study Materials', icon: FileText, badge: (data.value.studyMaterials || []).length }] : []),
  { id: 'exams', label: 'Exam Results', icon: Award },
  { id: 'timetable', label: 'Timetable', icon: Clock },
  { id: 'notices', label: 'Notices', icon: Bell, badge: (data.value.notices || []).length },
  { id: 'services', label: 'Transport & Library', icon: Bus }
]);

const formatCurrency = (val: any) => {
  const num = parseFloat(val) || 0;
  return num.toLocaleString('en-IN');
};

const formatDate = (dateStr: any) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getDayName = (dayValue: number | string) =>
  ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][
    Number(dayValue) - 1
  ] || 'Weekday';
const printReceipt = () => window.print();

const submitSchoolVisit = async () => {
  const studentId = activeChildId.value || currentStudent.value?.id;
  if (!studentId) return;
  savingVisit.value = true;
  visitError.value = '';
  try {
    await Portal.requestSchoolVisit({ student_id: studentId, ...visitForm.value });
    showToast('Appointment request sent', 'success');
    visitForm.value = { date: '', time: '', person_to_meet: '', purpose: '' };
    await loadData(studentId);
  } catch (error: any) {
    visitError.value = apiErrorMessage(error);
  } finally {
    savingVisit.value = false;
  }
};

const submitPtmFeedback = async (record: any) => {
  const studentId = activeChildId.value || currentStudent.value?.id;
  if (!studentId || !record?.meeting?.id || !ptmDrafts.value[record.id]?.rating) return;
  savingPtmId.value = record.id;
  ptmFeedbackError.value[record.id] = '';
  try {
    await Portal.submitPtmFeedback(record.meeting.id, {
      student_id: studentId,
      ...ptmDrafts.value[record.id]
    });
    showToast('Meeting feedback submitted', 'success');
    await loadData(studentId);
  } catch (error: any) {
    ptmFeedbackError.value[record.id] = apiErrorMessage(error);
  } finally {
    savingPtmId.value = '';
  }
};

const downloadReportCard = async () => {
  const student = currentStudent.value;
  if (!student?.id) return;
  downloadingReportCard.value = true;
  try {
    const response = await Portal.reportCard(
      student.id,
      selectedReportCardSetupId.value || undefined
    );
    downloadFile(
      response.data,
      `report-card-${student.admission_number || student.id}.pdf`,
      'application/pdf'
    );
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  } finally {
    downloadingReportCard.value = false;
  }
};

const downloadStudyMaterial = async (material: any) => {
  downloadingMaterialId.value = material.id;
  try {
    const response: any = await StudyMaterials.download(material.id);
    const extension = ({
      'application/pdf': '.pdf',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
    } as Record<string, string>)[response.headers?.['content-type']] || '';
    const filename = String(material.title || 'study-material').replace(/[\\/:*?"<>|\r\n]/g, '-').slice(0, 100);
    downloadFile(response.data, `${filename}${extension}`, response.headers?.['content-type'] || 'application/octet-stream');
  } catch (error: any) {
    showToast(apiErrorMessage(error), 'error');
  } finally {
    downloadingMaterialId.value = '';
  }
};

const switchChild = async (childId: string) => {
  activeChildId.value = childId;
  librarySearch.value = '';
  libraryCategory.value = '';
  await loadData(childId);
};

async function loadData(studentId?: string) {
  loading.value = true;
  errorMessage.value = '';
  try {
    const params = studentId ? { student_id: studentId } : undefined;
    const res: any = await Portal.dashboard(params);
    data.value = res.data || {};
    data.value.studyMaterials = [];
    studyMaterialsAvailable.value = false;
    if (data.value.kind === 'student') {
      try {
        const materials: any = await StudyMaterials.list();
        data.value.studyMaterials = materials.data || [];
        studyMaterialsAvailable.value = true;
      } catch {
        data.value.studyMaterials = [];
        if (activeTab.value === 'materials') activeTab.value = 'overview';
      }
    }
    if (data.value.kind === 'parent' && !(data.value.students || []).length) {
      activeChildId.value = '';
    } else if (data.value.activeStudentId) {
      activeChildId.value = data.value.activeStudentId;
    } else if (data.value.student?.id) {
      activeChildId.value = data.value.student.id;
    }
    libraryRequestId += 1;
    libraryCategories.value = [];
    libraryPage.value = 1;
    libraryTotal.value = 0;
    libraryTotalPages.value = 0;
    libraryError.value = '';
    if (activeChildId.value && ['parent', 'student'].includes(data.value.kind)) {
      await loadLibraryCatalog(1);
    }
    visitLoadError.value = '';
    data.value.schoolVisits = [];
    if (data.value.kind === 'parent' && activeChildId.value) {
      try {
        const visits: any = await Portal.schoolVisits(activeChildId.value);
        data.value.schoolVisits = visits.data?.records || [];
      } catch (error: any) {
        visitLoadError.value = apiErrorMessage(error);
      }
      try {
        const meetings: any = await Portal.ptmMeetings(activeChildId.value);
        data.value.ptmMeetings = meetings.data || [];
        ptmDrafts.value = Object.fromEntries(
          data.value.ptmMeetings.map((record: any) => [
            record.id,
            {
              rating: record.parent_rating || 0,
              feedback: record.parent_feedback || ''
            }
          ])
        );
        ptmFeedbackError.value = {};
        ptmLoadError.value = '';
      } catch (error: any) {
        data.value.ptmMeetings = [];
        ptmLoadError.value = apiErrorMessage(error);
      }
    }
    if (activeChildId.value) {
      try {
        const setups: any = await Portal.reportCardSetups(activeChildId.value);
        publishedReportCardSetups.value = setups.data || [];
        if (
          !publishedReportCardSetups.value.some(
            setup => setup.id === selectedReportCardSetupId.value
          )
        )
          selectedReportCardSetupId.value = '';
      } catch {
        publishedReportCardSetups.value = [];
      }
    }
  } catch (error: any) {
    errorMessage.value = apiErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<style>
@media print {
  body * {
    visibility: hidden !important;
  }
  #parent-receipt-print,
  #parent-receipt-print * {
    visibility: visible !important;
  }
  #parent-receipt-print {
    position: fixed;
    inset: 0;
    width: 100%;
    max-width: none;
    box-shadow: none;
  }
  .receipt-screen-only {
    display: none !important;
  }
}
</style>
