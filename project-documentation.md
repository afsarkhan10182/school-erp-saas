# School ERP – Feature Documentation (School Admin)

This document lists features **in sidebar order** for the **School Admin** view only. Super Admin screens (SaaS, Branches, Configuration, Subscription Plans, etc.) are excluded.

---

## Sidebar order (from codebase – School Admin)

Use this order so the doc matches the app menu:

1. **Dashboard**
2. **Student Management** → New Student, All Students, Multiple Import
3. **Academic Management** → Academic Setup (Classes, Class Assignments, Sections, Subjects, Timetable; Streams if enabled; Academic Years not shown for school admin)
4. **Attendance Management** → Take Attendance, Attendance Analytics
5. **Certificate Management** → Certificate Templates, Student Certificates, Employee Certificates
6. **Exam Management** → Exam Setup, Exams, Exam Schedules, Exam Results, Marks Entry, Report Cards, Position Management, Result Publication
7. **Fee Management** → Fee Types, Fee Structures, Invoices
8. **Reports & Analytics** → Fees (Fee Management, Receipts), Student (Student Reports, Attendance Reports), Exams (Exam Reports)
9. **Staff Management** → Staff List
10. **Settings** → School Settings, Profile

---

## What to remove (School Admin doc only)

- **Super Admin** – Do not mention Super Admin role, SaaS Management, Branches, Configuration, or subscription plans.
- **Dashboard** – Remove: “SuperAdmin control”, “Custom domain and URL support for each branch with configurable login panels”. Keep branch filter only if the screenshot shows it (admin with multiple branches).
- **Roles** – For school admin, roles are: Admin, Branch Admin, Staff (Teachers, Accountants, Receptionists, etc.), Teachers, Students, Parents. Do not list Super Admin.
- **Visitors** – Do not document; it is for Receptionist role only.

---

## What to add

- **Fee Management (new section)**  
  The sidebar has a **Fee Management** group with: **Fee Types**, **Fee Structures**, **Invoices**. Add a dedicated section with:
  - Fee Types: create and manage fee types (e.g. Tuition, Transport).
  - Fee Structures: define structures by class/branch and link fee types.
  - Invoices: view and manage student fee invoices, collect payments.  
  Add images if you have screenshots (e.g. `fees-types.png`, `fees-structures.png`, `fees-invoices.png`).  
  Place this section after **Certificates** and before **Reports & analytics** to match the sidebar.

---

## Section-by-section content (aligned to UI)

Use this text so the doc matches the current school admin UI. Keep your existing image filenames; only the bullets are adjusted.

---

### 1. Dashboard

**Images:** `dashboard.png`

**Recommended content (School Admin):**
- Log in with your school credentials; after login you land on the **Dashboard**—the first screen and home base for day-to-day use.
- One screen for key metrics: total students, new admissions (configurable days), fee collection (this month), and pending/overdue fees (when Fees module is enabled).
- Optional branch filter for admins with multiple branches.
- Fee collection summary and charts when the Fees module is enabled.
- Recent activity or quick links as shown in the screenshot.
- Role-based access: each user sees a relevant dashboard; no Super Admin–only features.

**Remove:** “Multi-branch system with SuperAdmin control”, “Custom domain and URL support for each branch with configurable login panels”.  
**Keep:** Branch-specific data only if your screenshot shows branch filter; otherwise describe only what is visible (students, fees, recent activity).

---

### 2. Student admission

**Images:** `students-create-admission.png`

**Recommended content:**
- Add new students via a single form: personal details, class, section, guardian info.
- Student profiles support document uploads and sibling information.
- Supports daily new admissions without manual paperwork.

**Remove:** “Complete student lifecycle… to graduation” unless the screenshot shows promotion/graduation; otherwise keep lifecycle wording generic.

**Check:** Does the image show the “New Student” / “Create admission” form with personal details, class, section, guardian? If the form has different fields or steps, list them.

---

### 3. Student listing

**Images:** `students-all-listing-view-edit.png`, `individual-student-detail.png`

**Recommended content:**
- View all students in one list with search, filters, and access to full profile.
- From the list: open individual student detail, edit student, or open fee ledger.
- Student detail: personal info, contact, guardians, quick stats, Fee Ledger, Edit.
- Admin tools for student records (e.g. disable/enable) if shown in the UI.
- Promotion and leave management if the screens show them; otherwise omit or keep generic.

**Check:** First image = list/table with search, filter, actions (View, Edit, Fee Ledger)? Second = single student detail (info, guardians, Fee Ledger / Edit)?

---

### 4. Student import

**Images:** `students-import.png`

**Recommended content:**
- Bulk add students via CSV for faster onboarding.
- Useful at the start of the year or when migrating from another system.
- Reduces manual entry and keeps data consistent.

**Check:** Does the screenshot show CSV/bulk import (upload, map columns, preview)?

---

### 5. Academic setup

**Images (in order):**
- `academic-streams.png`, `academic-classes.png`
- `academic-subject-assign-to-class.png`, `academic-subjects-creation.png`, `academic-subjects-teacher-assign.png`
- `academic-teacher-assign-to-respective-class.png`, `academic-timetable.png`

**Recommended content (School Admin):**
- Manage classes, sections, subjects, and class–subject assignments from one place.
- Create and manage subjects; assign subjects to classes; assign teachers to subjects and classes.
- View and manage timetables/class routines.
- If Streams are enabled: manage streams.
- Academic Years are not in the school admin sidebar; omit or mention only if you show them elsewhere (e.g. settings).

**Remove:** “Academic years” as a main menu item for school admin (sidebar does not show it for admin).  
**Check:** Image order: (1) Streams / Classes, (2) subject–class assignment, subject creation, teacher–subject assign, (3) teacher–class assign, timetable. Note any image that shows something different.

---

### 6. Attendance

**Images:**  
- First block: `take-attendance.png`  
- Second block: `attendance-analytics.png`, `Reports-Attendance.png`

**Recommended content:**
- Take attendance: choose date, branch, class, section; mark Present, Absent, or Late; save as draft or submit; optional parent notification.
- Attendance analytics: daily overviews, percentages, trends.
- Attendance reports: filter and export (e.g. by branch, date, class) for records and follow-up.
- Role-based access: teachers manage records, admins view all.

**Check:** First image = “Take Attendance” (date, class, student list, Present/Absent/Late, Save/Submit)? Second = analytics? Third = attendance report (list/export)?

---

### 7. Examination & results

**Images:**  
- First block: `creating-exams.png`, `exam-setup-grading-markDistribution.jpeg`  
- Second block: `exams-schedules.png`, `exams-marks-entry.png`, `exam-setup-halls-terms.jpeg`

**Recommended content:**
- Exam Setup: exam terms, exam halls, mark distribution, grading systems (tabs in one screen).
- Create and manage exams; configure grading and mark distribution.
- Exam schedules: create and view schedules.
- Marks entry: enter marks by exam/schedule.
- Report cards and result publication as shown in the UI.
- Position/rank management if the screenshot shows it.

**Check:** Do the images match: (1) exam list/create + grading/mark distribution, (2) exam schedules, marks entry, halls/terms? Note any image that is “exam results”, “report card”, or something else.

---

### 8. Certificates

**Images:**  
- First block: `creating-certificates-templates.png`  
- Second block: `certificate-preview-student.png`, `certificate-preview-employee.png`, `generate-certificates-screen.png`

**Recommended content:**
- Create and manage certificate templates for students and employees (name, branch, layout e.g. A4, background).
- View, edit, or delete templates.
- Preview student and employee certificates; generate certificates from the certificates screen when needed.

**Check:** First image = list of certificate templates (name, branch, layout, actions)? Second = student preview, employee preview, “generate certificates” screen?

---

### 9. Fee Management *(ADD – not in original doc)*

**Images (suggested):** `fees-types.png`, `fees-structures.png`, `fees-invoices.png` (or whatever you use)

**Recommended content:**
- **Fee Types:** Create and manage fee types (e.g. Tuition, Transport, Lab).
- **Fee Structures:** Define fee structures by class and/or branch; attach fee types and amounts.
- **Invoices:** View and manage student fee invoices; record payments and track status.

This section should appear **after Certificates** and **before Reports & analytics** to match the sidebar. Add screenshots for Fee Types, Fee Structures, and Invoices if available.

---

### 10. Reports & analytics

**Images:**  
- First block: `Reports-student.png`, `Reports-Attendance.png`  
- Second block: `Reports-fee-management.png`, `Reports-reciept.png`

**Recommended content:**
- Reports available to school admin: Student Reports, Attendance Reports, Fee Management report, Receipt report (pages: `frontend/pages/reports/students.vue`, `attendance.vue`, `fees.vue`, `receipts.vue`).
- Filter by branch, date, class, and other parameters; export (Excel/CSV/PDF) where the UI supports it.
- Exam Reports: sidebar has a link to `/reports/exams`, but there is no `reports/exams.vue` in the codebase. Either omit “Exam Reports” from the doc or add one line: “Exam Reports is linked in the sidebar; the dedicated report page may be added later.”

**Remove:** “Communications, events” unless the app has those report types.  
**Check:** Do the four images match “student report”, “attendance report”, “fee management report”, “receipt report”?

---

### 11. Staff Management

**Images:** `school-staff.png`

**Recommended content:**
- Admins can add, view, and manage staff (teachers and other roles).
- Staff list with search and filters by role (e.g. Teachers, Accountants, Librarians, Receptionists, Branch Admins)—matches `frontend/pages/users/index.vue` role tabs.
- Add, edit, or remove staff as needed.
- Staff can update their own profile from Profile in Settings.

**Rename:** Section title from “Staff” to **“Staff Management”** to match sidebar; menu label is “Staff List”.  
**Check:** Does the screenshot show a staff list with role tabs, search, table (name, role, email, branch, actions), and “Add Staff”?

---

### 12. School and user profile settings

**Images:** `user-profile-setting.png`, `school-setting.png`

**Recommended content:**
- **Profile (user):** Update name, email, phone, profile photo, and password. Access via Settings → Profile.
- **School Settings:** Configure school and branch options—school info, academic settings, fee settings, branding, system preferences. Access via Settings (School Settings) in the sidebar.
- Role-based access: each user sees only the menu items and data they are allowed to see.

**Check:** First image = profile page (name, email, phone, photo upload, change password)? Second = school/branch settings (e.g. school name, academic session, fee/branding options)?

---

## Strict codebase review (applied changes)

Use this to verify your `index.html` (or doc) against the **current frontend codebase** only. Be strict: anything not in the codebase should be fixed or removed.

### ✅ Correct (matches codebase)

- **Section order:** Dashboard → Student (admission, listing, import) → Academic → Attendance → Exams → Certificates → Fee Management → Reports → Staff Management → Settings. Matches `frontend/components/layout/Sidebar.vue`.
- **Dashboard:** Login → Dashboard; stats (total students, new students, this month collection, pending fees); branch filter; fee summary/charts when Fees module enabled. Matches `frontend/pages/dashboard.vue`.
- **Student:** New Student (`/students/create`), All Students (`/students`), Multiple Import (`/students/import`). Matches sidebar and pages.
- **Academic:** No “Academic Years” for school admin (sidebar shows Academic Years only for `isSuperAdmin`). Classes, Class Assignments, Sections, Subjects, Timetable (and Streams if enabled) are correct.
- **Exam Setup:** Tabs in codebase are Exam Terms, Exam Halls, Mark Distribution, Grading Systems (`frontend/pages/exams/setup/index.vue`). Your wording (terms, halls, mark distribution, grading) is correct.
- **Fee Management:** Fee Types, Fee Structures, Invoices only. No “Fee Collections” in sidebar (Collections page exists at `/fees/collections` but is not in the sidebar for school admin). Correct to document only Types, Structures, Invoices.
- **Reports:** Four report pages in codebase: `reports/students.vue`, `reports/attendance.vue`, `reports/fees.vue`, `reports/receipts.vue`. Image order (student, attendance, fee management, receipt) is correct.
- **Settings:** Sidebar has “School Settings” → `/settings` and “Profile” → `/settings/profile`. Correct to describe both.

### ❌ Required fixes (strict, from codebase)

1. **Staff Management – role list must include Librarians**  
   In `frontend/pages/users/index.vue`, role tabs for school admin are: **All Staff, Teachers, Accountants, Librarians, Receptionists, Branch Admins**.  
   **Fix:** In the Staff Management section, add **Librarians** to the list. It must say: “filters by role (e.g. Teachers, Accountants, **Librarians**, Receptionists, Branch Admins)”. Do not omit Librarians.

2. **Reports – Exam Reports**  
   Sidebar has a link “Exam Reports” → `/reports/exams`, but there is **no** `frontend/pages/reports/exams.vue` in the codebase (only `students.vue`, `attendance.vue`, `fees.vue`, `receipts.vue`). So that route has no page.  
   **Fix (choose one):**  
   - Either remove “Exam Reports” from the Reports section text and say only: “Student Reports, Attendance Reports, Fee Management report, Receipt report,”  
   - Or add one line: “Exam Reports is linked in the sidebar; the dedicated report page may be added later.” Do not describe Exam Reports as a working report type on par with the other four until the page exists.

3. **School Settings – tabs (optional but accurate)**  
   In `frontend/pages/settings/index.vue`, the Settings page tabs are: **School Information**, Academic Settings, Fee & Finance Settings, Branding & Receipt, System Preferences, Notifications, Security, Integrations, Backup & Export.  
   **Fix (optional):** If you want to be strict, you can add “and more (e.g. notifications, security, integrations, backup)” after “system preferences”. Your current “school info, academic, fee, branding, system preferences” is acceptable; just don’t claim tabs that don’t exist.

### 📌 Optional / notes

- **Fee Management images:** Using `fee-types-fee-structures.jpeg` and `fees-invoices.png` is fine (two images for three menu items). No change needed.
- **Typo in image name:** `Reports-reciept.png` is a known typo (receipt). Prefer fixing to `Reports-receipt.png` in filenames and doc when you can; not blocking.
- **Profile:** Profile page is at `/settings/profile`; “Settings → Profile” is correct.

---

## How to correct

- For each section where **content and images don’t match**:
  - **Section name** (e.g. “Dashboard”, “Student admission”).
  - **What’s wrong:** e.g. “The bullets mention X but the image shows Y” or “The second image is actually Z.”
  - **What you want:** e.g. “Remove the line about …” or “Replace with: …”.

- **Order:** Keep sections in the order above (Dashboard → … → Settings/Profile) so the doc follows the school admin sidebar.

- **Super Admin:** Do not describe or show Super Admin–only features (SaaS, Branches, Configuration, Subscription Plans, etc.).

After edits, the doc will match the current school admin UI and sidebar from the `frontend/` codebase.
