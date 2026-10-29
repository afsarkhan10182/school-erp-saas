# Global Branch Migration Tasks

Rules for every route:

- The topbar is the only school/branch selector.
- Lists, reports, dependent dropdowns, exports, and dashboards read `useGlobalBranch()`.
- Create/edit forms write `branch_id` from the global branch; they do not render a branch field.
- Branch-scoped writes are blocked when the topbar is set to **All Branches**.
- Changing the topbar branch reloads the active route through the keyed `NuxtPage`.

## 0. Shared foundation

- [x] Global branch composable and persisted auth-store state
- [x] Topbar branch selector with super-admin school selector
- [x] Active route remounts when global school/branch changes
- [x] Legacy `useSchoolBranchScope` delegates to global state
- [ ] Remove temporary hidden (`v-if="false"`) branch controls after each route is migrated

## 1. Academic menu

- [x] `/academic/classes`
- [x] `/academic/sections`
- [x] `/academic/streams`
- [x] `/academic/subjects`
- [x] `/academic/class-assignments`
- [ ] `/academic/timetable`
- [ ] `/academic/timetables`
- [ ] `/academic/workload`
- [ ] `/academic/calendar`

## 2. Students and parents menus

- [ ] `/students`
- [ ] `/students/create` and `/students/:id/edit`
- [x] `/students/bulk-edit`
- [ ] `/students/online-admission`
- [ ] `/students/promotion`
- [ ] `/students/categories`
- [ ] `/students/student_deactivation`
- [ ] `/students/transfer`
- [ ] `/parents`
- [ ] `/parents/parent_deactivation`

## 3. Attendance menu

- [ ] `/attendance`
- [ ] `/attendance/analytics`

## 4. Fees menu

- [ ] `/fees/invoices`
- [ ] `/fees/collections`
- [ ] `/fees/types`
- [ ] `/fees/structures`
- [ ] `/fees/fines`
- [ ] `/fees/due`
- [ ] `/fees/allocation`
- [ ] Invoice filters and invoice-generation modal

## 5. Exams menu

- [ ] Exam list, results, marks entry, publication, report cards, and positions
- [ ] Exam schedules list/create
- [ ] Grades range and mark distributions
- [ ] Online exams
- [ ] Seating list, stickers, overview, and calendar
- [ ] Exam terms, exams, halls, and hall modal components

## 6. Reports menu

- [ ] Student, attendance, fees, exams, receipts, suite, and student-extra reports

## 7. Other menus

- [ ] HR employee deactivation
- [ ] Cards and card templates
- [ ] Library
- [ ] Homework
- [ ] Certificate lists, generators, and template modal
- [x] Dashboard branch card removed and dashboard reads global branch
- [ ] Generic `SchoolCrudPage`

## Verification per menu

- [ ] No page/modal branch selector remains (excluding topbar)
- [ ] Selecting a concrete topbar branch filters displayed data
- [ ] Switching branches refreshes the current route
- [ ] New records receive the concrete global `branch_id`
- [ ] **All Branches** works for reads and blocks branch-scoped writes
