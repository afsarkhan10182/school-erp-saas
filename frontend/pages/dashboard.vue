<template>
  <div class="w-full space-y-6">
    <!-- Module Access Error Alert -->
    <div
      v-if="$route.query.error === 'module_access_denied'"
      class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 shadow-sm"
    >
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Module Access Denied</h3>
          <p class="mt-1 text-sm text-red-700 dark:text-red-300">
            You don't have access to <strong>{{ getModuleName($route.query.module) }}</strong
            >. This feature requires a higher subscription plan. Please contact your administrator
            to upgrade your subscription.
          </p>
        </div>
      </div>
    </div>

    <!-- Super Admin Context Banner -->
    <div
      v-if="authStore.currentUser?.role === 'super_admin' && authStore.currentSchool?.id"
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/90 p-4 text-indigo-950 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200 shadow-xs"
    >
      <div class="flex items-center gap-3">
        <span class="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white text-xs font-bold shrink-0">SA</span>
        <div class="text-sm">
          <p class="font-semibold text-gray-900 dark:text-white">
            Inspecting School Operations: <span class="text-indigo-600 dark:text-indigo-400 font-bold underline">{{ authStore.currentSchool.name }}</span>
          </p>
          <p class="text-xs text-indigo-700 dark:text-indigo-300">You are browsing branch and student data in cross-tenant inspection mode.</p>
        </div>
      </div>
      <button
        type="button"
        @click="exitSchoolInspection"
        class="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-700 transition shrink-0"
      >
        <span>&larr; Exit to SaaS Directory</span>
      </button>
    </div>

    <!-- Header & Branch Selector -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          {{ dashboardTitle }}
        </h1>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Welcome back, {{ authStore.currentUser?.first_name || 'User' }}! Here's what's happening
          today.
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      <span class="ml-3 text-base text-gray-600 dark:text-gray-400">Loading dashboard...</span>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="space-y-6">
      <!-- Superadmin Workspace Scope Banner -->
      <div
        v-if="authStore.isSuperAdmin && !currentSchool?.id"
        class="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-800 dark:bg-indigo-900/20 text-sm text-indigo-900 dark:text-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
      >
        <div>
          <p class="font-semibold flex items-center gap-1.5">
            <Building2 class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            SaaS Platform Overview (All Institutions)
          </p>
          <p class="text-xs text-indigo-700/80 dark:text-indigo-300/80 mt-0.5">
            Showing platform-wide aggregates across all schools. To inspect a specific school or configure subscriptions, use the top switcher or visit SaaS Platform.
          </p>
        </div>
        <NuxtLink
          to="/saas"
          class="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition w-fit"
        >
          SaaS Workspace &rarr;
        </NuxtLink>
      </div>

      <div
        v-else-if="authStore.isSuperAdmin && currentSchool?.id"
        class="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-800 dark:bg-emerald-900/20 text-sm text-emerald-900 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
      >
        <div>
          <p class="font-semibold flex items-center gap-1.5">
            <CheckCircle class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Inspecting School: {{ currentSchool.name }}
          </p>
          <p class="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
            All statistics, student metrics, and fee charts below reflect records for this institution.
          </p>
        </div>
        <button
          type="button"
          @click="exitSchoolInspection"
          class="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition w-fit"
        >
          Exit to SaaS &rarr;
        </button>
      </div>

      <!-- Teacher Quick Stats & Quick Actions -->
      <div v-if="isTeacher" class="space-y-4">
        <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div class="stat-card flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assigned Classes</span>
              <div class="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <BookOpen class="w-5 h-5" />
              </div>
            </div>
            <div class="mt-3">
              <span class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{{ stats.assignedClasses || 0 }}</span>
            </div>
          </div>
          <div class="stat-card flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assigned Homework</span>
              <div class="p-2.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <FileText class="w-5 h-5" />
              </div>
            </div>
            <div class="mt-3">
              <span class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{{ stats.activeHomework || 0 }}</span>
            </div>
          </div>
          <div class="stat-card flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Today's Schedule</span>
              <div class="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <Calendar class="w-5 h-5" />
              </div>
            </div>
            <div class="mt-3">
              <span class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{{ stats.todayScheduleCount || 0 }}</span>
            </div>
          </div>
          <div class="stat-card flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Students</span>
              <div class="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <Users class="w-5 h-5" />
              </div>
            </div>
            <div class="mt-3">
              <span class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{{ stats.totalStudents || 0 }}</span>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-800 flex flex-wrap items-center gap-3">
          <span class="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">Quick Actions:</span>
          <NuxtLink to="/attendance" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 transition">
            <CheckCircle class="w-3.5 h-3.5" /> Mark Attendance
          </NuxtLink>
          <NuxtLink to="/homework" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 transition">
            <FileText class="w-3.5 h-3.5" /> Assign Homework
          </NuxtLink>
          <NuxtLink to="/exams/marks-entry" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-300 transition">
            <Award class="w-3.5 h-3.5" /> Enter Marks
          </NuxtLink>
          <NuxtLink to="/academic/timetables" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 transition">
            <Calendar class="w-3.5 h-3.5" /> Timetable
          </NuxtLink>
          <NuxtLink to="/students" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 transition">
            <Users class="w-3.5 h-3.5" /> Student Directory
          </NuxtLink>
        </div>
      </div>

      <!-- Accountant Quick Stats & Quick Actions -->
      <div v-else-if="isAccountant" class="space-y-4">
        <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <div class="stat-card flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fee Collection</span>
              <div class="p-2.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <DollarSign class="w-5 h-5" />
              </div>
            </div>
            <div class="mt-3">
              <span class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">₹{{ formatCurrency(stats.thisMonthFeeCollection ?? stats.feeCollection ?? 0) }}</span>
              <p class="text-[11px] text-gray-400 mt-0.5">Current month</p>
            </div>
          </div>
          <div class="stat-card flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Today's Collection</span>
              <div class="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <DollarSign class="w-5 h-5" />
              </div>
            </div>
            <div class="mt-3">
              <span class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">₹{{ formatCurrency(stats.todayFeeCollection || 0) }}</span>
              <p class="text-[11px] text-gray-400 mt-0.5">Completed payments today</p>
            </div>
          </div>
          <div class="stat-card flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pending Fees</span>
              <div class="p-2.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                <AlertTriangle class="w-5 h-5" />
              </div>
            </div>
            <div class="mt-3">
              <span class="text-2xl lg:text-3xl font-bold text-rose-600 dark:text-rose-400">
                ₹{{ formatCurrency(stats.pendingFees || 0) }}
              </span>
            </div>
          </div>
          <div class="stat-card flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Other Income</span>
              <div class="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <DollarSign class="w-5 h-5" />
              </div>
            </div>
            <div class="mt-3">
              <span class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">₹{{ formatCurrency(stats.thisMonthIncome || 0) }}</span>
              <p class="text-[11px] text-gray-400 mt-0.5">Current month · excludes fee collection</p>
            </div>
          </div>
          <div class="stat-card flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expenses</span>
              <div class="p-2.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                <AlertTriangle class="w-5 h-5" />
              </div>
            </div>
            <div class="mt-3">
              <span class="text-2xl lg:text-3xl font-bold text-rose-600 dark:text-rose-400">₹{{ formatCurrency(stats.thisMonthExpense || 0) }}</span>
              <p class="text-[11px] text-gray-400 mt-0.5">Current month</p>
            </div>
          </div>
        </div>

        <section class="rounded-xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-800">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Income vs Expense · last 12 months</h2>
          <div class="relative mt-3 h-64 min-w-0">
            <canvas ref="accountingFlowChart" role="img" aria-label="Monthly fee and other income compared with expenses"></canvas>
          </div>
        </section>

        <div class="rounded-xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-800 flex flex-wrap items-center gap-3">
          <span class="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">Quick Actions:</span>
          <NuxtLink to="/fees/collections" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 transition">
            <DollarSign class="w-3.5 h-3.5" /> Fee Collections
          </NuxtLink>
          <NuxtLink to="/fees/invoices" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 transition">
            <FileText class="w-3.5 h-3.5" /> Fee Invoices
          </NuxtLink>
          <NuxtLink to="/accounting/income" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 transition">
            <CreditCard class="w-3.5 h-3.5" /> Finance & Accounts
          </NuxtLink>
          <NuxtLink to="/reports/fees" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 transition">
            <Activity class="w-3.5 h-3.5" /> Fee Reports
          </NuxtLink>
        </div>
      </div>

      <!-- Receptionist Quick Stats & Quick Actions -->
      <div v-else-if="isReceptionist" class="space-y-4">
        <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div class="stat-card flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Admission Enquiries</span>
              <div class="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Phone class="w-5 h-5" />
              </div>
            </div>
            <div class="mt-3">
              <span class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{{ stats.totalEnquiries || 0 }}</span>
            </div>
          </div>

          <div class="stat-card flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Visitor Records</span>
              <div class="p-2.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <Users class="w-5 h-5" />
              </div>
            </div>
            <div class="mt-3">
              <span class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{{ stats.todayVisitors || 0 }}</span>
            </div>
          </div>

          <div class="stat-card flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone Calls Logged</span>
              <div class="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <Phone class="w-5 h-5" />
              </div>
            </div>
            <div class="mt-3">
              <span class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{{ stats.callLogs || 0 }}</span>
            </div>
          </div>

          <div class="stat-card flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Postal Records</span>
              <div class="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <FileText class="w-5 h-5" />
              </div>
            </div>
            <div class="mt-3">
              <span class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{{ stats.postalRecords || 0 }}</span>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-800 flex flex-wrap items-center gap-3">
          <span class="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">Quick Actions:</span>
          <NuxtLink to="/reception/enquiry" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 transition">
            <Phone class="w-3.5 h-3.5" /> Admission Enquiry
          </NuxtLink>
          <NuxtLink to="/reception/visitor" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 transition">
            <Users class="w-3.5 h-3.5" /> Visitor Book
          </NuxtLink>
          <NuxtLink to="/reception/call_log" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 transition">
            <Phone class="w-3.5 h-3.5" /> Call Logs
          </NuxtLink>
          <NuxtLink to="/reception/gate-passes" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 transition">
            <UserCheck class="w-3.5 h-3.5" /> Gate Passes
          </NuxtLink>
          <NuxtLink to="/reception/postal" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 transition">
            <FileText class="w-3.5 h-3.5" /> Postal Records
          </NuxtLink>
          <NuxtLink to="/reception/complaint" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-300 transition">
            <MessageSquare class="w-3.5 h-3.5" /> Complaints
          </NuxtLink>
        </div>

        <section class="rounded-xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-800">
          <div class="mb-3 flex items-center justify-between gap-3">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Recent admission enquiries</h2>
            <NuxtLink to="/reception/enquiry" class="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">View all</NuxtLink>
          </div>
          <p v-if="loadingRecentEnquiries" class="text-sm text-gray-500">Loading recent enquiries…</p>
          <p v-else-if="recentEnquiriesError" class="text-sm text-amber-700 dark:text-amber-300">Recent enquiries are temporarily unavailable.</p>
          <p v-else-if="!recentEnquiries.length" class="text-sm text-gray-500 dark:text-gray-400">No admission enquiries yet.</p>
          <ul v-else class="divide-y divide-gray-100 dark:divide-gray-700">
            <li v-for="enquiry in recentEnquiries" :key="enquiry.id" class="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-gray-900 dark:text-white">{{ enquiry.title }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ enquiry.reference_no || 'No phone provided' }}<span v-if="enquiry.class?.name"> · {{ enquiry.class.name }}</span></p>
              </div>
              <span class="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">{{ enquiry.status || 'New' }}</span>
            </li>
          </ul>
        </section>
      </div>

      <!-- Librarian Quick Stats & Quick Actions -->
      <div v-else-if="isLibrarian" class="space-y-4">
        <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div class="stat-card flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Books</span>
              <div class="p-2.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <BookOpen class="w-5 h-5" />
              </div>
            </div>
            <div class="mt-3">
              <span class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{{ stats.totalBooks || 0 }}</span>
            </div>
          </div>

          <div class="stat-card flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Issued Books</span>
              <div class="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <BookMarked class="w-5 h-5" />
              </div>
            </div>
            <div class="mt-3">
              <span class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{{ stats.issuedBooks || 0 }}</span>
            </div>
          </div>

          <div class="stat-card flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Available Books</span>
              <div class="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <CheckCircle class="w-5 h-5" />
              </div>
            </div>
            <div class="mt-3">
              <span class="text-2xl lg:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{{ stats.availableBooks || 0 }}</span>
            </div>
          </div>

          <div class="stat-card flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Overdue Books</span>
              <div class="p-2.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                <AlertTriangle class="w-5 h-5" />
              </div>
            </div>
            <div class="mt-3">
              <span class="text-2xl lg:text-3xl font-bold text-rose-600 dark:text-rose-400">{{ stats.overdueBooks || 0 }}</span>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-800 flex flex-wrap items-center gap-3">
          <span class="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">Quick Actions:</span>
          <NuxtLink to="/library/issue" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 transition">
            <BookMarked class="w-3.5 h-3.5" /> Issue Book
          </NuxtLink>
          <NuxtLink to="/library/return" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 transition">
            <CheckCircle class="w-3.5 h-3.5" /> Return Book
          </NuxtLink>
          <NuxtLink to="/library" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 transition">
            <BookOpen class="w-3.5 h-3.5" /> Library Catalog
          </NuxtLink>
        </div>
      </div>

      <!-- Superadmin Platform Overview KPI Cards (When no school is actively selected) -->
      <div v-else-if="authStore.isSuperAdmin && !currentSchool?.id" class="space-y-6">
        <div class="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/5 border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Building2 class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-gray-900 dark:text-white">Platform-Wide Overview (All Schools)</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">Aggregated health metrics across all tenant schools. To manage operational modules inside a specific school, select an institution below.</p>
            </div>
          </div>
          <NuxtLink to="/saas" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-xs whitespace-nowrap">
            Open Schools Directory &rarr;
          </NuxtLink>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <!-- Total Schools -->
          <div class="stat-card flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Total Schools
              </span>
              <div class="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                <Building2 class="w-5 h-5" />
              </div>
            </div>
            <div class="mt-3">
              <span class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                {{ stats.totalSchools || 0 }}
              </span>
              <p class="text-[11px] text-gray-400 mt-0.5">Institutions on platform</p>
            </div>
          </div>

          <!-- Total Branches -->
          <div class="stat-card flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Total Branches
              </span>
              <div class="p-2.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <Layers class="w-5 h-5" />
              </div>
            </div>
            <div class="mt-3">
              <span class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                {{ stats.totalBranches || 0 }}
              </span>
              <p class="text-[11px] text-gray-400 mt-0.5">Campuses across schools</p>
            </div>
          </div>

          <!-- Platform Users -->
          <div class="stat-card flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Platform Users
              </span>
              <div class="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Users class="w-5 h-5" />
              </div>
            </div>
            <div class="mt-3">
              <span class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                {{ stats.totalUsers || 0 }}
              </span>
              <p class="text-[11px] text-gray-400 mt-0.5">Staff & admin accounts</p>
            </div>
          </div>

          <!-- Aggregated school fee collections, not SaaS subscription revenue -->
          <div class="stat-card flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                School Fee Collections
              </span>
              <div class="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <DollarSign class="w-5 h-5" />
              </div>
            </div>
            <div class="mt-3">
              <span class="text-2xl lg:text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                ₹{{ formatCurrency(stats.totalRevenue || stats.feeCollection || 0) }}
              </span>
              <p class="text-[11px] text-gray-400 mt-0.5">Lifetime fee collections</p>
            </div>
          </div>
        </div>

        <!-- Tenant Institution & Campus Inspector -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm p-5 sm:p-6 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 class="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Tenant Institution & Campus Inspector
              </h2>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Select an institution below to inspect its operational modules (students, fees, attendance, examinations, staff) or visit SaaS Management.
              </p>
            </div>
            <NuxtLink
              to="/saas"
              class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition whitespace-nowrap self-start sm:self-auto"
            >
              <span>Manage SaaS Subscriptions</span>
              <span>&rarr;</span>
            </NuxtLink>
          </div>

          <div v-if="loadingSchools" class="py-10 flex flex-col items-center justify-center text-gray-400 text-sm">
            <div class="w-7 h-7 border-2 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin mb-2"></div>
            <span>Loading tenant institutions...</span>
          </div>

          <div v-else-if="schools.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            <div
              v-for="school in schools"
              :key="school.id"
              class="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-gray-50/50 dark:bg-gray-900/30 transition-all flex flex-col justify-between group"
            >
              <div>
                <div class="flex items-center justify-between gap-2">
                  <h3 class="font-bold text-sm text-gray-900 dark:text-white truncate">{{ school.name }}</h3>
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                    :class="school.status === 'active' || school.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'"
                  >
                    {{ school.status || school.subscription_status || 'Active' }}
                  </span>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Code: <span class="font-mono text-gray-700 dark:text-gray-300 font-medium">{{ school.code || 'N/A' }}</span>
                  <span v-if="school.city || school.state"> · {{ school.city || school.state }}</span>
                </p>
                <p v-if="school.subscription_plan?.name || school.plan_name" class="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
                  Plan: {{ school.subscription_plan?.name || school.plan_name }}
                </p>
              </div>

              <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700/60 flex items-center justify-between">
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ school.branch_count ?? school.branches?.length ?? 0 }} Branch{{
                    (school.branch_count ?? school.branches?.length ?? 0) === 1 ? '' : 'es'
                  }}
                </span>
                <button
                  type="button"
                  @click="inspectSchool(school)"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-xs group-hover:scale-102"
                >
                  <span>Inspect School</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          </div>

          <div v-else class="py-8 text-center text-gray-400 text-sm">
            No active tenant schools found.
          </div>
        </div>
      </div>

      <!-- School Admin / General Stats (Default or when inspecting a school) -->
      <div v-else class="space-y-4">
        <!-- School Admin Quick Action Bar -->
        <div class="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-xs">
          <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mr-2">Quick Actions:</span>
          <NuxtLink to="/students/create" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 transition">
            <UserPlus class="w-3.5 h-3.5" /> + New Admission
          </NuxtLink>
          <NuxtLink to="/fees/collections" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 transition">
            <DollarSign class="w-3.5 h-3.5" /> Collect Fee
          </NuxtLink>
          <NuxtLink to="/attendance" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 transition">
            <UserCheck class="w-3.5 h-3.5" /> Mark Attendance
          </NuxtLink>
          <NuxtLink to="/exams" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 transition">
            <Award class="w-3.5 h-3.5" /> Exam Schedules
          </NuxtLink>
          <NuxtLink to="/academic/classes" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 transition">
            <GraduationCap class="w-3.5 h-3.5" /> Classes
          </NuxtLink>
          <NuxtLink to="/users" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-300 transition">
            <Users class="w-3.5 h-3.5" /> Staff Directory
          </NuxtLink>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <!-- Total Students -->
        <div class="stat-card flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span
              class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >Total Students</span
            >
            <div
              class="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            >
              <Users class="w-5 h-5" />
            </div>
          </div>
          <div class="mt-3">
            <span
              class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight"
              >{{ stats.totalStudents || 0 }}</span
            >
          </div>
        </div>

        <!-- Total Parents -->
        <div class="stat-card flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span
              class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >Total Parents</span
            >
            <div
              class="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
            >
              <UserCheck class="w-5 h-5" />
            </div>
          </div>
          <div class="mt-3">
            <span
              class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight"
              >{{ stats.totalParents || 0 }}</span
            >
          </div>
        </div>

        <!-- Total Teachers -->
        <div class="stat-card flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span
              class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >Total Teachers</span
            >
            <div
              class="p-2.5 rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"
            >
              <BookOpen class="w-5 h-5" />
            </div>
          </div>
          <div class="mt-3">
            <span
              class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight"
              >{{ stats.totalTeachers || 0 }}</span
            >
          </div>
        </div>

        <!-- Total Staff -->
        <div class="stat-card flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span
              class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >Total Staff</span
            >
            <div
              class="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
            >
              <Activity class="w-5 h-5" />
            </div>
          </div>
          <div class="mt-3">
            <span
              class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight"
              >{{ stats.totalEmployees || 0 }}</span
            >
          </div>
        </div>

        <!-- New Students -->
        <div class="stat-card flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span
              class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              New Students ({{ stats.newStudentsDays || dashboardConfig.newStudentsDays }}d)
            </span>
            <div
              class="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
            >
              <UserPlus class="w-5 h-5" />
            </div>
          </div>
          <div class="mt-3">
            <span
              class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight"
              >{{ stats.newStudents || 0 }}</span
            >
          </div>
        </div>

        <!-- Fee Collection -->
        <div v-if="canViewDashboardFinance && isModuleEnabled('fees')" class="stat-card flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span
              class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >Fee Collection</span
            >
            <div
              class="p-2.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
            >
              <DollarSign class="w-5 h-5" />
            </div>
          </div>
          <div class="mt-3">
            <span
              class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight"
              >₹{{ formatCurrency(headlineFeeCollection) }}</span
            >
            <p class="text-[11px] text-gray-400 mt-0.5">
              Academic Year Total
              <span v-if="stats.thisMonthFeeCollection !== undefined" class="block font-medium text-purple-600 dark:text-purple-400">
                ₹{{ formatCurrency(stats.thisMonthFeeCollection) }} this month
              </span>
            </p>
          </div>
        </div>

        <!-- Pending Fees -->
        <div v-if="canViewDashboardFinance && isModuleEnabled('fees')" class="stat-card flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span
              class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >Outstanding Fees</span
            >
            <div
              class="p-2.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
            >
              <AlertTriangle class="w-5 h-5" />
            </div>
          </div>
          <div class="mt-3">
            <span
              class="text-2xl lg:text-3xl font-bold text-rose-600 dark:text-rose-400 tracking-tight"
            >
              ₹{{ formatCurrency(headlinePendingFees) }}
            </span>
            <p class="text-[11px] text-gray-400 mt-0.5">
              {{ feeCollectionSummary.total_invoices ? (feeCollectionSummary.total_invoices - (feeCollectionSummary.paid_invoices || 0)) : (stats.pendingInvoicesCount || 0) }} unpaid invoices (AY)
              <span v-if="stats.allTimePendingFees && stats.allTimePendingFees !== stats.pendingFees" class="block text-gray-400">
                ₹{{ formatCurrency(stats.allTimePendingFees) }} all-time
              </span>
            </p>
          </div>
        </div>
      </div>
      </div>

      <!-- School-Level Operational Insights & Charts (Only displayed inside a school context) -->
      <template v-if="!authStore.isSuperAdmin || currentSchool?.id">
      <!-- Row 2: Core Insights -->
      <div :class="['grid gap-6 min-w-0', row2GridLayout]">
        <!-- Fee Collection Summary + Pie Chart -->
        <div
          v-if="canViewDashboardFinance && isModuleEnabled('fees')"
          class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm p-5 sm:p-6 min-w-0"
        >
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              Fee Collection Summary
              <span
                v-if="loadingAcademicYears"
                class="text-xs text-gray-500 dark:text-gray-400 font-normal ml-1"
                >(Loading...)</span
              >
              <span
                v-else-if="feeCollectionSummary.academic_year"
                class="text-xs text-indigo-600 dark:text-indigo-400 font-medium ml-1"
                >({{ feeCollectionSummary.academic_year }})</span
              >
              <span v-else class="text-xs text-gray-500 dark:text-gray-400 font-normal ml-1"
                >(No data)</span
              >
            </h2>
            <div class="flex items-center space-x-2">
              <EnhancedDropdown
                v-model="selectedAcademicYear"
                :options="academicYears.map(year => ({ value: year.name, label: `${year.name}${year.is_current ? ' (Current)' : ''}` }))"
                placeholder="Select academic year"
                id="dashboard-academic-year"
                :disabled="loadingAcademicYears || academicYears.length === 0"
              />
            </div>
          </div>

          <div v-if="loadingFeeSummary" class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
            <span class="ml-2 text-sm text-gray-600 dark:text-gray-400"
              >Loading fee summary...</span
            >
          </div>

          <div v-else class="space-y-6">
            <!-- Summary Cards -->
            <div class="grid grid-cols-2 gap-3 sm:gap-4">
              <div
                class="bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl p-3.5 sm:p-4"
              >
                <div class="flex items-center gap-1.5">
                  <CheckCircle class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span
                    class="text-xs font-semibold text-emerald-800 dark:text-emerald-200 uppercase tracking-wider"
                    >Collected</span
                  >
                </div>
                <p
                  class="text-xl sm:text-2xl font-bold text-emerald-900 dark:text-emerald-100 mt-1"
                >
                  ₹{{ formatCurrency(feeCollectionSummary.total_collected || 0) }}
                </p>
              </div>

              <div
                class="bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/60 rounded-xl p-3.5 sm:p-4"
              >
                <div class="flex items-center gap-1.5">
                  <AlertTriangle class="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span
                    class="text-xs font-semibold text-rose-800 dark:text-rose-200 uppercase tracking-wider"
                    >Outstanding</span
                  >
                </div>
                <p class="text-xl sm:text-2xl font-bold text-rose-900 dark:text-rose-100 mt-1">
                  ₹{{ formatCurrency(feeCollectionSummary.total_pending || 0) }}
                </p>
              </div>
            </div>

            <!-- Fee Collection Chart -->
            <div
              class="relative w-full h-48 bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 overflow-hidden min-w-0"
            >
              <canvas ref="feesChart"></canvas>
            </div>

            <!-- Additional Stats -->
            <div
              class="grid grid-cols-4 gap-2 sm:gap-4 pt-4 border-t border-gray-200 dark:border-gray-700/80 text-center"
            >
              <div>
                <p class="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  {{ feeCollectionSummary.total_invoices || 0 }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Invoices</p>
              </div>
              <div>
                <p class="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {{ feeCollectionSummary.paid_invoices || 0 }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Paid</p>
              </div>
              <div>
                <p class="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400">
                  {{ Math.max(0, (feeCollectionSummary.total_invoices || 0) - (feeCollectionSummary.paid_invoices || 0)) }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Unpaid</p>
              </div>
              <div>
                <p class="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {{ feeCollectionSummary.collection_rate || 0 }}%
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Rate</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Student Distribution + Monthly Trends -->
        <div
          v-if="canViewStudentInsights"
          class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm p-5 sm:p-6 min-w-0"
        >
          <h2
            class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight mb-6"
          >
            Student Distribution & Trends
          </h2>

          <!-- Student Distribution Chart -->
          <div class="mb-6">
            <h3
              class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3"
            >
              Distribution by Class
            </h3>
            <div
              class="relative w-full h-44 bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 overflow-hidden min-w-0"
            >
              <canvas ref="studentDistributionChart"></canvas>
            </div>
          </div>

          <!-- Monthly Trends -->
          <div>
            <h3
              class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3"
            >
              Monthly Enrollment Trends
            </h3>
            <div
              class="relative w-full h-44 bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 overflow-hidden min-w-0"
            >
              <canvas ref="studentsChart"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 3: Extra Insights -->
      <div class="grid grid-cols-1 gap-6 min-w-0 lg:grid-cols-2">
        <!-- Fee Collection Trend (6 months) -->
        <div
          v-if="canViewDashboardFinance && isModuleEnabled('fees')"
          class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm p-5 sm:p-6 min-w-0"
        >
          <h2
            class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight mb-6"
          >
            Fee Collection Trend ({{ dashboardConfig.feeTrendMonths }} Months)
          </h2>
          <div
            class="relative w-full h-60 sm:h-64 bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 overflow-hidden min-w-0"
          >
            <canvas ref="feeTrendChart"></canvas>
          </div>
        </div>

        <!-- Recent Activities -->
        <div
          class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm p-5 sm:p-6 min-w-0"
        >
          <h2
            class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight mb-6"
          >
            Recent Activities
          </h2>

          <div class="space-y-3">
            <div v-if="loadingActivities" class="flex items-center justify-center py-12">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
              <span class="ml-2 text-sm text-gray-600 dark:text-gray-400"
                >Loading activities...</span
              >
            </div>

            <div v-else-if="recentActivities.length === 0" class="text-center py-10">
              <div
                class="w-12 h-12 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-3"
              >
                <Activity class="w-6 h-6 text-gray-400" />
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400">No recent activities</p>
            </div>

            <div v-else class="space-y-2.5">
              <div
                v-for="activity in recentActivities"
                :key="activity.id"
                class="flex items-start space-x-3 p-3 bg-gray-50/80 dark:bg-gray-700/40 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-700/60 transition-colors"
              >
                <div class="flex-shrink-0">
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center"
                    :class="getActivityIcon(activity.type).bg"
                  >
                    <component
                      :is="getActivityIcon(activity.type).icon"
                      class="w-4 h-4"
                      :class="getActivityIcon(activity.type).text"
                    />
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {{ activity.description }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatDate(activity.created_at) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Upcoming Events -->
        <div
          v-if="canViewCalendarEvents"
          class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm p-5 sm:p-6 min-w-0"
        >
          <div class="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight">Upcoming Events</h2>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Next 7 days</p>
            </div>
            <NuxtLink
              to="/academic/calendar"
              class="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              View calendar <span aria-hidden="true">&rarr;</span>
            </NuxtLink>
          </div>

          <div v-if="loadingUpcomingEvents" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Loading events…
          </div>
          <div v-else-if="upcomingEventsError" class="py-8 text-center text-sm text-rose-600 dark:text-rose-400" role="status">
            Events could not be loaded. Open the calendar to try again.
          </div>
          <div v-else-if="upcomingEvents.length === 0" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No events scheduled for the next 7 days.
          </div>
          <ul v-else class="space-y-3">
            <li
              v-for="event in upcomingEvents"
              :key="event.id"
              class="flex items-start gap-3 rounded-xl bg-gray-50/80 p-3 dark:bg-gray-700/40"
            >
              <div class="shrink-0 rounded-lg bg-indigo-50 px-2.5 py-2 text-center dark:bg-indigo-900/30">
                <span class="block text-[10px] font-semibold uppercase text-indigo-600 dark:text-indigo-300">{{ formatEventMonth(event.date) }}</span>
                <span class="block text-lg font-bold leading-5 text-gray-900 dark:text-white">{{ formatEventDay(event.date) }}</span>
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-gray-900 dark:text-white">{{ event.description || event.day_type }}</p>
                <p class="mt-0.5 text-xs capitalize text-gray-500 dark:text-gray-400">{{ event.day_type }}</p>
              </div>
            </li>
          </ul>
        </div>

        <!-- Announcements -->
        <div
          v-if="canViewCalendarEvents"
          class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm p-5 sm:p-6 min-w-0"
        >
          <div class="mb-5">
            <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight">Announcements</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Latest school notices</p>
          </div>

          <div v-if="loadingNotices" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Loading announcements…
          </div>
          <div v-else-if="noticesError" class="py-8 text-center text-sm text-rose-600 dark:text-rose-400" role="status">
            Announcements could not be loaded.
          </div>
          <div v-else-if="dashboardNotices.length === 0" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No active announcements.
          </div>
          <ul v-else class="space-y-3">
            <li
              v-for="notice in dashboardNotices"
              :key="notice.id"
              class="rounded-xl border border-gray-100 p-3 dark:border-gray-700"
            >
              <div class="flex items-start justify-between gap-3">
                <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ notice.title }}</p>
                <span class="shrink-0 text-[11px] text-gray-500 dark:text-gray-400">{{ formatDate(notice.date_value || notice.created_at) }}</span>
              </div>
              <p v-if="notice.notes" class="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-600 dark:text-gray-300">{{ notice.notes }}</p>
            </li>
          </ul>
        </div>

        <!-- Today's Attendance -->
        <div
          v-if="canViewCalendarEvents"
          class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm p-5 sm:p-6 min-w-0"
        >
          <div class="flex items-start justify-between gap-3 mb-5">
            <div>
              <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight">Today's Attendance</h2>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ attendanceToday ? formatEventDate(attendanceToday.date) : 'Student daily attendance' }}</p>
            </div>
            <NuxtLink
              to="/attendance"
              class="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              Attendance <span aria-hidden="true">&rarr;</span>
            </NuxtLink>
          </div>

          <div v-if="loadingTodayAttendance" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Loading attendance…
          </div>
          <div v-else-if="todayAttendanceError" class="py-8 text-center text-sm text-rose-600 dark:text-rose-400" role="status">
            Attendance could not be loaded.
          </div>
          <div v-else-if="!attendanceToday?.session_count" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No published daily attendance session for today.
          </div>
          <div v-else>
            <p class="mb-4 text-xs text-gray-500 dark:text-gray-400">
              {{ attendanceToday.marked }} of {{ attendanceToday.enrolled }} students marked
            </p>
            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-900/20">
                <p class="text-xl font-bold text-emerald-700 dark:text-emerald-300">{{ attendanceToday.present }}</p>
                <p class="text-[11px] text-emerald-700 dark:text-emerald-300">Present</p>
              </div>
              <div class="rounded-xl bg-rose-50 p-3 dark:bg-rose-900/20">
                <p class="text-xl font-bold text-rose-700 dark:text-rose-300">{{ attendanceToday.absent }}</p>
                <p class="text-[11px] text-rose-700 dark:text-rose-300">Absent</p>
              </div>
              <div class="rounded-xl bg-amber-50 p-3 dark:bg-amber-900/20">
                <p class="text-xl font-bold text-amber-700 dark:text-amber-300">{{ attendanceToday.late }}</p>
                <p class="text-[11px] text-amber-700 dark:text-amber-300">Late</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Overdue Fee Dues -->
        <div
          v-if="canViewOverdueFees"
          class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm p-5 sm:p-6 min-w-0"
        >
          <div class="flex items-start justify-between gap-3 mb-5">
            <div>
              <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight">Overdue Fee Dues</h2>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Students with unpaid overdue invoices</p>
            </div>
            <NuxtLink
              to="/fees/invoices"
              class="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              View invoices <span aria-hidden="true">&rarr;</span>
            </NuxtLink>
          </div>

          <div v-if="loadingOverdueFees" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Loading overdue invoices…
          </div>
          <div v-else-if="overdueFeesError" class="py-8 text-center text-sm text-rose-600 dark:text-rose-400" role="status">
            Overdue invoices could not be loaded.
          </div>
          <div v-else-if="overdueFees.length === 0" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No overdue invoices in this school or branch.
          </div>
          <ul v-else class="divide-y divide-gray-100 dark:divide-gray-700">
            <li
              v-for="invoice in overdueFees"
              :key="invoice.id"
              class="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-gray-900 dark:text-white">
                  {{ invoice.student?.first_name }} {{ invoice.student?.last_name }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ invoice.class_name }}<span v-if="invoice.section"> · {{ invoice.section }}</span>
                  · Due {{ formatEventDate(invoice.due_date) }}
                </p>
              </div>
              <span class="shrink-0 text-sm font-bold text-rose-600 dark:text-rose-400">
                ₹{{ formatCurrency(invoice.balance_amount) }}
              </span>
            </li>
          </ul>
        </div>
      </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useAcademics } from '~/composables/useAcademics';
import { useBranches } from '~/composables/useBranches';
import { useModuleAccess } from '~/composables/useModuleAccess';
import { Dashboard } from '~/api';
import { DynamicEntities } from '~/api/shared/dynamic-entities';
import { extractList } from '~/utils/list-response';
import { AcademicCalendar } from '~/api/academic/academic-calendar';
import { useToast } from '~/composables/useToast';
import EnhancedDropdown from '~/components/ui/EnhancedDropdown.vue';
import Chart from 'chart.js/auto';

// Icons
import {
  Users,
  UserPlus,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Activity,
  BookOpen,
  UserCheck,
  FileText,
  CreditCard,
  Calendar,
  Building2,
  GraduationCap,
  Clock,
  Phone,
  MessageSquare,
  Layers,
  BookMarked,
  Award
} from 'lucide-vue-next';

// Auth store
const authStore = useAuthStore();
const { selectedBranchId, currentSchool } = useGlobalBranch();

const isTeacher = computed(() => authStore.currentUser?.role === 'teacher' || stats.value?.role === 'teacher');
const isAccountant = computed(() => authStore.currentUser?.role === 'accountant' || stats.value?.role === 'accountant');
const isReceptionist = computed(() => authStore.currentUser?.role === 'receptionist' || stats.value?.role === 'receptionist');
const isLibrarian = computed(() => authStore.currentUser?.role === 'librarian' || stats.value?.role === 'librarian');
const isSuperAdmin = computed(() => authStore.currentUser?.role === 'super_admin' || stats.value?.role === 'super_admin');
const canViewStudentInsights = computed(() => ['super_admin', 'admin', 'branch_admin'].includes(authStore.currentUser?.role || stats.value?.role));
const canViewDashboardFinance = computed(() => ['super_admin', 'admin', 'branch_admin', 'accountant'].includes(authStore.currentUser?.role || stats.value?.role));
const canViewCalendarEvents = computed(() =>
  ['super_admin', 'admin', 'branch_admin'].includes(authStore.currentUser?.role || stats.value?.role) &&
  (!authStore.isSuperAdmin || !!currentSchool.value?.id)
);
const canViewOverdueFees = computed(() =>
  canViewDashboardFinance.value && isModuleEnabled('fees') &&
  (!authStore.isSuperAdmin || !!currentSchool.value?.id)
);

// Module access
const { isModuleEnabled, loadUserModules } = useModuleAccess();

// Schools composable for superadmin institution inspector
const { schools, loading: loadingSchools, fetchSchools } = useSchools();

// Toast
const { showError } = useToast();

// Dashboard configuration
const dashboardConfig = {
  newStudentsDays: 30,
  feeTrendMonths: 6,
  activitiesLimit: 5
};

// Academic data
const { academicYears, currentAcademicYear, fetchAcademicYears } = useAcademics();

// Branch data
const { branches, loading: loadingBranches, fetchBranches } = useBranches();

// Computed property for grid layout - dynamic based on available modules and branches
const gridLayout = computed(() => {
  const hasFeesModule = isModuleEnabled('fees');
  const hasMultipleBranches = branches.value.length > 1;

  // Calculate total number of items
  let totalItems = 5; // Students, Parents, Teachers, Staff, New Students

  if (hasFeesModule) {
    totalItems += 2; // Collection + Pending Fees
  }

  if (hasMultipleBranches) {
    totalItems += 1; // Branch Filter
  }

  // Return responsive grid based on total items
  if (totalItems <= 4) {
    return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4';
  } else {
    return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-7';
  }
});

// Computed property for Row 2 grid layout
const row2GridLayout = computed(() => {
  const hasFeesModule = isModuleEnabled('fees');

  if (hasFeesModule) {
    return 'grid-cols-1 lg:grid-cols-2';
  } else {
    return 'grid-cols-1';
  }
});

// Reactive data
const loading = ref(true);
let isDashboardMounted = true;
const loadingFeeSummary = ref(false);
const loadingAcademicYears = ref(false);
const loadingActivities = ref(false);
const loadingUpcomingEvents = ref(false);
const upcomingEventsError = ref(false);
const upcomingEvents = ref([]);
const loadingNotices = ref(false);
const noticesError = ref(false);
const dashboardNotices = ref([]);
const loadingTodayAttendance = ref(false);
const todayAttendanceError = ref(false);
const attendanceToday = ref(null);
const loadingOverdueFees = ref(false);
const overdueFeesError = ref(false);
const overdueFees = ref([]);
const selectedBranch = ref(selectedBranchId.value || '');
const selectedAcademicYear = ref('');

// Stats and data
const stats = ref({});
const feeCollectionSummary = ref({});
const recentActivities = ref([]);
const statsError = ref('');
const recentEnquiries = ref([]);
const loadingRecentEnquiries = ref(false);
const recentEnquiriesError = ref(false);

// Computed headline fee metrics synchronized with feeCollectionSummary
const headlineFeeCollection = computed(() => {
  if (feeCollectionSummary.value?.total_collected !== undefined && feeCollectionSummary.value?.total_collected !== null) {
    return feeCollectionSummary.value.total_collected;
  }
  if (stats.value?.academicYearFeeCollection !== undefined && stats.value?.academicYearFeeCollection !== null) {
    return stats.value.academicYearFeeCollection;
  }
  return stats.value?.feeCollection || 0;
});

const headlinePendingFees = computed(() => {
  if (feeCollectionSummary.value?.total_pending !== undefined && feeCollectionSummary.value?.total_pending !== null) {
    return feeCollectionSummary.value.total_pending;
  }
  if (stats.value?.pendingFees !== undefined && stats.value?.pendingFees !== null) {
    return stats.value.pendingFees;
  }
  return 0;
});

// Chart refs
const studentsChart = ref(null);
const feesChart = ref(null);
const studentDistributionChart = ref(null);
const feeTrendChart = ref(null);
const accountingFlowChart = ref(null);

// Chart instances
let studentsChartInstance = null;
let feesChartInstance = null;
let studentDistributionChartInstance = null;
let feeTrendChartInstance = null;
let accountingFlowChartInstance = null;

// Format currency
const formatCurrency = amount => {
  if (!amount) return '0';
  return new Intl.NumberFormat('en-IN').format(amount);
};

// Format date
const formatDate = dateString => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Get module name from route path
const getModuleName = routePath => {
  if (!routePath) return 'the requested module';

  const moduleMap = {
    '/fees': 'Fee Management',
    '/fees/types': 'Fee Types',
    '/fees/structures': 'Fee Structures',
    '/fees/invoices': 'Fee Invoices',
    '/fees/collections': 'Fee Collections',
    '/reports/fees': 'Fee Reports',
    '/reports/receipts': 'Receipt Reports',
    '/students': 'Student Management',
    '/students/create': 'Student Registration',
    '/students/import': 'Student Import',
    '/reports/students': 'Student Reports',
    '/attendance': 'Attendance Management',
    '/reports/attendance': 'Attendance Reports',
    '/exams': 'Examination Management',
    '/reports/exams': 'Examination Reports',
    '/library': 'Library Management',
    '/reports/library': 'Library Reports',
    '/hr': 'HR Management',
    '/reports/hr': 'HR Reports',
    '/transport': 'Transport Management',
    '/reports/transport': 'Transport Reports',
    '/reports': 'Reports',
    '/reports/advanced': 'Advanced Reports'
  };

  return moduleMap[routePath] || 'the requested module';
};

// Get activity icon
const getActivityIcon = type => {
  const icons = {
    student_added: {
      icon: UserPlus,
      bg: 'bg-green-100 dark:bg-green-900/20',
      text: 'text-green-600 dark:text-green-400'
    },
    fee_paid: {
      icon: CreditCard,
      bg: 'bg-blue-100 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400'
    },
    invoice_generated: {
      icon: FileText,
      bg: 'bg-purple-100 dark:bg-purple-900/20',
      text: 'text-purple-600 dark:text-purple-400'
    },
    payment_received: {
      icon: DollarSign,
      bg: 'bg-green-100 dark:bg-green-900/20',
      text: 'text-green-600 dark:text-green-400'
    },
    default: {
      icon: Activity,
      bg: 'bg-gray-100 dark:bg-gray-700',
      text: 'text-gray-600 dark:text-gray-400'
    }
  };

  return icons[type] || icons.default;
};

// Create charts
const createCharts = (studentsData, feesData, studentDistributionData, feeTrendData, incomeExpenseData) => {
  if (accountingFlowChart.value && incomeExpenseData) {
    accountingFlowChartInstance?.destroy();
    accountingFlowChartInstance = new Chart(accountingFlowChart.value.getContext('2d'), {
      type: 'bar',
      data: {
        labels: incomeExpenseData.labels,
        datasets: [
          { label: 'Income (fees + other)', data: incomeExpenseData.income, backgroundColor: 'rgba(16, 185, 129, 0.75)' },
          { label: 'Expense', data: incomeExpenseData.expense, backgroundColor: 'rgba(244, 63, 94, 0.75)' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, ticks: { callback: value => `₹${formatCurrency(value)}` } } },
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  // Students Chart (Line Chart)
  if (studentsChart.value && studentsData) {
    if (studentsChartInstance) {
      studentsChartInstance.destroy();
    }

    studentsChartInstance = new Chart(studentsChart.value.getContext('2d'), {
      type: 'line',
      data: {
        labels: studentsData.labels || [],
        datasets: [
          {
            label: 'Students',
            data: studentsData.data || [],
            borderColor: 'rgb(147, 51, 234)',
            backgroundColor: 'rgba(147, 51, 234, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(156, 163, 175, 0.1)'
            },
            ticks: {
              color: '#6B7280'
            }
          },
          x: {
            grid: {
              color: 'rgba(156, 163, 175, 0.1)'
            },
            ticks: {
              color: '#6B7280'
            }
          }
        }
      }
    });
  }

  // Fee Collection Status Chart (Doughnut Chart)
  if (feesChart.value && feesData) {
    if (feesChartInstance) {
      feesChartInstance.destroy();
    }

    feesChartInstance = new Chart(feesChart.value.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: feesData.labels || [],
        datasets: [
          {
            data: feesData.data || [],
            backgroundColor: [
              'rgba(16, 185, 129, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(239, 68, 68, 0.8)'
            ],
            borderColor: ['rgb(16, 185, 129)', 'rgb(245, 158, 11)', 'rgb(239, 68, 68)'],
            borderWidth: 2,
            hoverOffset: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#6B7280',
              padding: 20,
              usePointStyle: true
            }
          }
        }
      }
    });
  }

  // Student Distribution Chart (Bar Chart)
  if (studentDistributionChart.value && studentDistributionData) {
    if (studentDistributionChartInstance) {
      studentDistributionChartInstance.destroy();
    }

    studentDistributionChartInstance = new Chart(studentDistributionChart.value.getContext('2d'), {
      type: 'bar',
      data: {
        labels: studentDistributionData.labels || [],
        datasets: [
          {
            label: 'Students',
            data: studentDistributionData.data || [],
            backgroundColor: 'rgba(147, 51, 234, 0.8)',
            borderColor: 'rgb(147, 51, 234)',
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(156, 163, 175, 0.1)'
            },
            ticks: {
              color: '#6B7280'
            }
          },
          x: {
            grid: {
              color: 'rgba(156, 163, 175, 0.1)'
            },
            ticks: {
              color: '#6B7280'
            }
          }
        }
      }
    });
  }

  // Fee Trend Chart (Line Chart)
  if (feeTrendChart.value && feeTrendData) {
    if (feeTrendChartInstance) {
      feeTrendChartInstance.destroy();
    }

    feeTrendChartInstance = new Chart(feeTrendChart.value.getContext('2d'), {
      type: 'line',
      data: {
        labels: feeTrendData.labels || [],
        datasets: [
          {
            label: 'Fee Collection',
            data: feeTrendData.data || [],
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(156, 163, 175, 0.1)'
            },
            ticks: {
              color: '#6B7280',
              callback: function (value) {
                return '₹' + value.toLocaleString();
              }
            }
          },
          x: {
            grid: {
              color: 'rgba(156, 163, 175, 0.1)'
            },
            ticks: {
              color: '#6B7280'
            }
          }
        }
      }
    });
  }
};

const inspectSchool = async (school) => {
  const { switchSchool } = useGlobalBranch();
  switchSchool({ id: school.id, name: school.name });
  await initializeAcademicYear();
  await initializeBranches();
  await refreshAllData();
};

const exitSchoolInspection = () => {
  const { switchSchool } = useGlobalBranch();
  switchSchool(null);
  navigateTo('/saas');
};

// Fetch dashboard data
const fetchDashboardData = async () => {
  try {
    loading.value = true;

    const cleanBranch = selectedBranch.value && selectedBranch.value !== 'undefined' ? selectedBranch.value : undefined;

    const statsParams = {
      new_students_days: dashboardConfig.newStudentsDays
    };
    if (selectedAcademicYear.value && !isTeacher.value) {
      statsParams.academic_year = selectedAcademicYear.value;
    }
    if (currentSchool.value?.id) {
      statsParams.school_id = currentSchool.value.id;
      if (cleanBranch) statsParams.branch_id = cleanBranch;
    } else if (!authStore.isSuperAdmin && cleanBranch) {
      statsParams.branch_id = cleanBranch;
    }

    const activitiesParams = {
      limit: dashboardConfig.activitiesLimit
    };
    if (currentSchool.value?.id) {
      activitiesParams.school_id = currentSchool.value.id;
      if (cleanBranch) activitiesParams.branch_id = cleanBranch;
    } else if (!authStore.isSuperAdmin && cleanBranch) {
      activitiesParams.branch_id = cleanBranch;
    }

    const shouldFetchRecentEnquiries = authStore.currentUser?.role === 'receptionist';
    loadingRecentEnquiries.value = shouldFetchRecentEnquiries;
    recentEnquiriesError.value = false;

    // Fetch stats and activities in parallel
    const [statsResponse, activitiesResponse, enquiriesResponse] = await Promise.allSettled([
      Dashboard.getStats(statsParams),
      Dashboard.getRecentActivities(activitiesParams),
      shouldFetchRecentEnquiries
        ? DynamicEntities.list('enquiry', { page: 1, limit: 5 })
        : Promise.resolve(null)
    ]);
    if (
      !isDashboardMounted ||
      !authStore.user ||
      [statsResponse, activitiesResponse].some(
        response => response.status === 'rejected' && response.reason?.message === 'Authentication required'
      )
    ) {
      loadingRecentEnquiries.value = false;
      return;
    }

    // Handle stats response
    if (statsResponse.status === 'fulfilled' && statsResponse.value.success) {
      console.log('✅ Stats loaded:', statsResponse.value.data);
      stats.value = statsResponse.value.data;
      statsError.value = '';
    } else {
      const err = statsResponse.status === 'rejected' ? statsResponse.reason : statsResponse.value;
      console.error('❌ Failed to fetch stats:', err);
      statsError.value = err?.message || 'Failed to load statistics';
      stats.value = {};
    }

    // Handle activities response
    if (activitiesResponse.status === 'fulfilled' && activitiesResponse.value.success) {
      console.log('✅ Activities loaded:', activitiesResponse.value.data);
      recentActivities.value = activitiesResponse.value.data || [];
    } else {
      console.error('❌ Failed to fetch activities:', activitiesResponse.value);
      recentActivities.value = [];
    }

    if (shouldFetchRecentEnquiries) {
      loadingRecentEnquiries.value = false;
      recentEnquiriesError.value =
        enquiriesResponse.status === 'rejected' || !enquiriesResponse.value?.success;
      recentEnquiries.value = recentEnquiriesError.value
        ? []
        : extractList(enquiriesResponse.value, ['records']).slice(0, 5);
    }

    // Set loading to false first to render the canvas elements
    loading.value = false;
    await nextTick(); // Wait for DOM update
    if (!isDashboardMounted || !authStore.user) return;

    // Fetch chart data with branch and school context
    const chartParams = {};
    if (cleanBranch) {
      chartParams.branch_id = cleanBranch;
    }
    if (currentSchool.value?.id) {
      chartParams.school_id = currentSchool.value.id;
    }

    const [studentsResponse, feesResponse, studentDistributionResponse, feeTrendResponse, incomeExpenseResponse] =
      await Promise.allSettled([
        canViewStudentInsights.value ? Dashboard.getStudentsChartData(chartParams) : Promise.resolve(null),
        canViewDashboardFinance.value ? Dashboard.getFeesChartData(chartParams) : Promise.resolve(null),
        canViewStudentInsights.value ? Dashboard.getStudentDistributionData(chartParams) : Promise.resolve(null),
        canViewDashboardFinance.value
          ? Dashboard.getFeeTrendData({ ...chartParams, months: dashboardConfig.feeTrendMonths })
          : Promise.resolve(null),
        isAccountant.value ? Dashboard.getIncomeVsExpense(chartParams) : Promise.resolve(null)
      ]);
    if (
      !isDashboardMounted ||
      !authStore.user ||
      [studentsResponse, feesResponse, studentDistributionResponse, feeTrendResponse, incomeExpenseResponse].some(
        response => response.status === 'rejected' && response.reason?.message === 'Authentication required'
      )
    ) return;

    // Extract data from successful responses
    const studentsData =
      studentsResponse.status === 'fulfilled' && studentsResponse.value?.success
        ? studentsResponse.value.data
        : null;
    const feesData =
      feesResponse.status === 'fulfilled' && feesResponse.value?.success
        ? feesResponse.value.data
        : null;
    const studentDistributionData =
      studentDistributionResponse.status === 'fulfilled' &&
      studentDistributionResponse.value?.success
        ? studentDistributionResponse.value.data
        : null;
    const feeTrendData =
      feeTrendResponse.status === 'fulfilled' && feeTrendResponse.value?.success
        ? feeTrendResponse.value.data
        : null;
    const incomeExpenseData =
      incomeExpenseResponse.status === 'fulfilled' && incomeExpenseResponse.value?.success
        ? incomeExpenseResponse.value.data
        : null;

    console.log('📊 Chart data loaded:', {
      studentsData,
      feesData,
      studentDistributionData,
      feeTrendData
    });

    // Create charts with available data
    createCharts(studentsData, feesData, studentDistributionData, feeTrendData, incomeExpenseData);
  } catch (error) {
    loadingRecentEnquiries.value = false;
    if (isDashboardMounted && authStore.user) loading.value = false;
  }
};

// Create fee collection chart
const createFeeChart = (data = null) => {
  // Wait for next tick to ensure DOM is ready
  nextTick(() => {
    if (!feesChart.value) {
      console.warn('Fee chart canvas not found');
      return;
    }

    // Destroy existing chart instance
    if (feesChartInstance) {
      feesChartInstance.destroy();
      feesChartInstance = null;
    }

    const chartData = data || {
      labels: ['Collected', 'Outstanding'],
      data: [
        feeCollectionSummary.value.total_collected || 0,
        feeCollectionSummary.value.total_pending || 0
      ]
    };

    // Check if all data is zero and show "No Data" message
    const hasData = chartData.data.some(value => value > 0);

    try {
      feesChartInstance = new Chart(feesChart.value.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: hasData ? chartData.labels : ['No Data'],
          datasets: [
            {
              data: hasData ? chartData.data : [1],
              backgroundColor: hasData
                ? ['rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(239, 68, 68, 0.8)']
                : ['rgba(156, 163, 175, 0.3)'],
              borderColor: hasData
                ? ['rgb(16, 185, 129)', 'rgb(245, 158, 11)', 'rgb(239, 68, 68)']
                : ['rgb(156, 163, 175)'],
              borderWidth: 2,
              hoverOffset: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#6B7280',
                padding: 20,
                usePointStyle: true
              }
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  if (!hasData) return 'No data available';
                  const label = context.label || '';
                  const value = context.parsed;
                  return `${label}: ₹${value.toLocaleString('en-IN')}`;
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creating fee chart:', error);
      // Fallback: create a simple "No Data" chart
      try {
        feesChartInstance = new Chart(feesChart.value.getContext('2d'), {
          type: 'doughnut',
          data: {
            labels: ['No Data'],
            datasets: [
              {
                data: [1],
                backgroundColor: ['rgba(156, 163, 175, 0.3)'],
                borderColor: ['rgb(156, 163, 175)'],
                borderWidth: 2
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  color: '#6B7280',
                  padding: 20,
                  usePointStyle: true
                }
              }
            }
          }
        });
      } catch (fallbackError) {
        console.error('Error creating fallback chart:', fallbackError);
      }
    }
  });
};

// Fetch fee collection summary
const fetchFeeCollectionSummary = async () => {
  if (!canViewDashboardFinance.value) {
    feeCollectionSummary.value = {};
    loadingFeeSummary.value = false;
    return;
  }

  if (authStore.isSuperAdmin && !currentSchool.value?.id) {
    feeCollectionSummary.value = {};
    return;
  }

  if (!selectedAcademicYear.value) {
    feeCollectionSummary.value = {};
    createFeeChart();
    return;
  }

  loadingFeeSummary.value = true;
  try {
    const cleanBranch = selectedBranch.value && selectedBranch.value !== 'undefined' ? selectedBranch.value : undefined;
    const params = {
      academic_year: selectedAcademicYear.value
    };

    if (currentSchool.value?.id) {
      params.school_id = currentSchool.value.id;
      if (cleanBranch) {
        params.branch_id = cleanBranch;
      }
    } else if (!authStore.isSuperAdmin && cleanBranch) {
      params.branch_id = cleanBranch;
    }

    const response = await Dashboard.getFeeCollectionSummary(params);
    if (response.success) {
      feeCollectionSummary.value = response.data;

      // Create fee chart with the summary data
      createFeeChart();
    } else {
      feeCollectionSummary.value = {};
      createFeeChart();
    }
  } catch (error) {
    feeCollectionSummary.value = {};
    createFeeChart();
  } finally {
    loadingFeeSummary.value = false;
  }
};

// Initialize academic year selection
const initializeAcademicYear = async () => {
  try {
    loadingAcademicYears.value = true;

    const schoolId = currentSchool.value?.id || authStore.currentUser?.school_id;
    // Fetch academic years scoped to current school
    await fetchAcademicYears(schoolId);

    // Prioritize current academic year
    const currentAY = currentAcademicYear.value || academicYears.value.find((ay) => ay.is_current) || academicYears.value[0];
    if (currentAY) {
      selectedAcademicYear.value = currentAY.code || currentAY.name;
    }
  } catch (error) {
    // Error initializing academic year
  } finally {
    loadingAcademicYears.value = false;
  }
};

// Initialize branches
const initializeBranches = async () => {
  try {
    const schoolId = currentSchool.value?.id || authStore.currentUser?.school_id;
    if (schoolId) {
      await fetchBranches(schoolId);
    }
  } catch (error) {
    // Error initializing branches
  }
};

// Computed property to determine if branch filter should be shown
const shouldShowBranchFilter = computed(() => {
  // Super admin can see branch filter only if inspecting a school with multiple branches
  if (authStore.isSuperAdmin) {
    return !!currentSchool.value?.id && branches.value.length > 1;
  }

  // School admin can see branch filter only if they have multiple branches
  if (authStore.isAdmin) {
    return branches.value.length > 1;
  }

  // Branch admin should not see branch filter (they're fixed to one branch)
  if (authStore.isBranchAdmin) {
    return false;
  }

  // Default: don't show for other roles
  return false;
});

// Computed property to get available branches for the filter
const availableBranches = computed(() => {
  // Super admin sees all branches
  if (authStore.isSuperAdmin) {
    return branches.value;
  }

  // School admin sees only their school's branches
  if (authStore.isAdmin) {
    return branches.value.filter(branch => branch.school_id === authStore.currentUser?.school_id);
  }

  // Branch admin sees only their branch (but filter shouldn't be shown anyway)
  if (authStore.isBranchAdmin) {
    return branches.value.filter(branch => branch.id === authStore.currentUser?.branch_id);
  }

  return [];
});

// Computed property for dashboard title based on user role
const dashboardTitle = computed(() => {
  if (authStore.isSuperAdmin) {
    if (currentSchool.value?.name) {
      return `${currentSchool.value.name} Operations`;
    }
    return 'Platform Overview';
  }
  if (authStore.isBranchAdmin && authStore.currentBranch?.name) {
    const branchName = authStore.currentBranch.name;
    // Truncate branch name if it's too long to prevent UI issues
    const truncatedBranchName =
      branchName.length > 30 ? branchName.substring(0, 30) + '...' : branchName;
    return `${truncatedBranchName} Branch Dashboard`;
  }
  if (isTeacher.value) return 'Teacher Workspace';
  if (isAccountant.value) return 'Finance & Accounts Workspace';
  return 'Dashboard';
});

// Unified data refresh to prevent concurrent race conditions
let isRefreshing = false;
let pendingRefresh = false;

const refreshAllData = async () => {
  if (isRefreshing) {
    pendingRefresh = true;
    return;
  }
  isRefreshing = true;
  try {
    await Promise.allSettled([
      fetchDashboardData(),
      fetchFeeCollectionSummary(),
      fetchUpcomingEvents(),
      fetchDashboardNotices(),
      fetchTodayAttendance(),
      fetchOverdueFees()
    ]);
  } finally {
    isRefreshing = false;
    if (pendingRefresh) {
      pendingRefresh = false;
      await refreshAllData();
    }
  }
};

const fetchDashboardNotices = async () => {
  if (!canViewCalendarEvents.value) {
    dashboardNotices.value = [];
    return;
  }
  loadingNotices.value = true;
  noticesError.value = false;
  const params = {};
  if (currentSchool.value?.id) params.school_id = currentSchool.value.id;
  if (selectedBranch.value && selectedBranch.value !== 'undefined') {
    params.branch_id = selectedBranch.value;
  }
  try {
    const response = await Dashboard.getNotices(params);
    dashboardNotices.value = response?.data?.notices || [];
  } catch (error) {
    dashboardNotices.value = [];
    noticesError.value = true;
  } finally {
    loadingNotices.value = false;
  }
};

const fetchTodayAttendance = async () => {
  if (!canViewCalendarEvents.value) {
    attendanceToday.value = null;
    return;
  }
  loadingTodayAttendance.value = true;
  todayAttendanceError.value = false;
  const params = {};
  if (currentSchool.value?.id) params.school_id = currentSchool.value.id;
  if (selectedBranch.value && selectedBranch.value !== 'undefined') {
    params.branch_id = selectedBranch.value;
  }
  try {
    const response = await Dashboard.getTodayAttendance(params);
    attendanceToday.value = response?.data?.attendance || null;
  } catch (error) {
    attendanceToday.value = null;
    todayAttendanceError.value = true;
  } finally {
    loadingTodayAttendance.value = false;
  }
};

const fetchOverdueFees = async () => {
  if (!canViewOverdueFees.value) {
    overdueFees.value = [];
    return;
  }
  loadingOverdueFees.value = true;
  overdueFeesError.value = false;
  const params = {};
  if (currentSchool.value?.id) params.school_id = currentSchool.value.id;
  if (selectedBranch.value && selectedBranch.value !== 'undefined') {
    params.branch_id = selectedBranch.value;
  }
  try {
    const response = await Dashboard.getOverdueFees(params);
    overdueFees.value = response?.data?.fees || [];
  } catch (error) {
    overdueFees.value = [];
    overdueFeesError.value = true;
  } finally {
    loadingOverdueFees.value = false;
  }
};

const fetchUpcomingEvents = async () => {
  if (!canViewCalendarEvents.value) {
    upcomingEvents.value = [];
    return;
  }

  loadingUpcomingEvents.value = true;
  upcomingEventsError.value = false;
  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const toDate = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  try {
    const cleanBranch = selectedBranch.value && selectedBranch.value !== 'undefined'
      ? selectedBranch.value
      : undefined;
    const response = await AcademicCalendar.getAll({
      start_date: toDate(start),
      end_date: toDate(end),
      page: 1,
      limit: 5,
      ...(currentSchool.value?.id ? { school_id: currentSchool.value.id } : {}),
      ...(cleanBranch ? { branch_id: cleanBranch } : {})
    });
    upcomingEvents.value = (response?.data?.events || []).filter(event =>
      ['event', 'exam', 'holiday'].includes(event.day_type)
    );
  } catch (error) {
    upcomingEvents.value = [];
    upcomingEventsError.value = true;
  } finally {
    loadingUpcomingEvents.value = false;
  }
};

const formatEventMonth = date =>
  new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: 'short' });
const formatEventDay = date => new Date(`${date}T00:00:00`).getDate();
const formatEventDate = date =>
  new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

// Watch for changes in selected academic year
watch(selectedAcademicYear, async newValue => {
  if (newValue) {
    await refreshAllData();
  }
});

// Watch for changes in fee collection summary data
watch(
  feeCollectionSummary,
  () => {
    createFeeChart();
  },
  { deep: true }
);

// Watch for changes in global selected branch
watch(selectedBranchId, async newVal => {
  selectedBranch.value = newVal || '';
  await refreshAllData();
});

watch(currentSchool, async () => {
  selectedBranch.value = selectedBranchId.value || '';
  await initializeAcademicYear();
  await initializeBranches();
  await refreshAllData();
});

// Cleanup charts on component unmount
onUnmounted(() => {
  isDashboardMounted = false;
  if (studentsChartInstance) {
    studentsChartInstance.destroy();
  }
  if (feesChartInstance) {
    feesChartInstance.destroy();
  }
  if (studentDistributionChartInstance) {
    studentDistributionChartInstance.destroy();
  }
  if (feeTrendChartInstance) {
    feeTrendChartInstance.destroy();
  }
  if (accountingFlowChartInstance) {
    accountingFlowChartInstance.destroy();
  }
});

onMounted(async () => {
  // Load modules first to ensure isModuleEnabled works correctly
  await loadUserModules();

  if (authStore.isSuperAdmin) {
    fetchSchools(true);
  }

  // Initialize academic year and branches first so stats fetch uses active academic year
  await initializeAcademicYear();
  await initializeBranches();

  await refreshAllData();

  // Initialize fee chart after component is mounted
  setTimeout(() => {
    createFeeChart();
  }, 100);
});
</script>

<style scoped>
.stat-card {
  @apply rounded-lg p-3 shadow-md transform hover:-translate-y-1 transition-all duration-300 min-h-[100px] flex flex-col justify-center;
}

.card {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6;
}

/* Dark mode chart adjustments */
:deep(.dark) canvas {
  filter: brightness(0.9);
}
</style>
