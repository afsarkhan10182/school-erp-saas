# Role and Scope Baseline Specification

This document defines the definitive role, navigation, data scope, and security boundary matrix for the School ERP SaaS platform, establishing parity with modern multi-tenant school ERP standards and the reference platform.

---

## 1. Persona Matrix & Capabilities

| Persona | Role Key | Demo Login | Landing Route | Navigation Mode | Data Scope | Allowed Key Workflows | Disallowed Routes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Platform Owner** | `super_admin` | `demo.superadmin@schoolerp.local` | `/saas` | **SaaS Platform** *(default)* / **School Inspection** *(when institution selected)* | Platform-wide across all institutions and subscriptions | Platform overview, subscription plans, renewal requests, schools directory, branch directory, platform config, school inspector | Student-only portal routes (`/portal`) |
| **School Admin** | `admin` | `demo.admin@schoolerp.local` | `/dashboard` | **School Workspace** | Multi-branch or single-school tenant scope | Full school operations: student admissions, fee structures & invoices, staff & payroll, exams, timetables, branches & settings | SaaS platform owner endpoints (`/saas/*`, `/api/subscriptions/*`) |
| **Branch Admin** | `branch_admin` | `demo.branch@schoolerp.local` | `/dashboard` | **Branch Workspace** | Single assigned branch scope | Branch operations: student enrollment, attendance, class/section assignments, campus staff, branch fee collection | Platform management, other branches' confidential data |
| **Teacher** | `teacher` | `demo.teacher@schoolerp.local` | `/dashboard` | **Teaching Workspace** | Assigned classes, subjects, homework & students | Homework assignments, class attendance, syllabus tracking, marks submission, timetable | School financials, staff salaries, platform settings, admissions configuration |
| **Accountant** | `accountant` | `demo.accountant@schoolerp.local` | `/dashboard` | **Finance Workspace** | Institution / assigned branch financial records | Fee collection, invoice generation, discount & waiver management, expense vouchers, financial reports | Academics management, syllabus planning, online exams authoring |
| **Receptionist** | `receptionist` | `demo.reception@schoolerp.local` | `/dashboard` | **Front Desk** | Institution front-office interactions | Admission enquiries, visitor logs, phone call logs, postal records, gate passes | System configuration, fee setup, grade alterations |
| **Librarian** | `librarian` | `demo.librarian@schoolerp.local` | `/dashboard` | **Library Desk** | Institution library catalog & circulation | Book cataloging, book issuance, return tracking, overdue fines collection, member management | Academic grades, payroll, fee structure alterations |
| **Parent** | `parent` | `demo.parent@schoolerp.local` | `/portal` | **Family Portal** | Enrolled children associated with parent account | Multi-child switching, fee invoice viewing & payment, attendance history, homework review, exam report cards, school notices | Any staff `/dashboard` or admin endpoints (enforced via HTTP 403) |
| **Student** | `student` | `demo.student@schoolerp.local` | `/portal` | **Student Portal** | Authenticated student's own records | Personal timetable, homework submissions, fee dues, attendance records, online exams, report cards | Other students' private data, staff dashboards, admin endpoints (HTTP 403) |

---

## 2. Superadmin Dual Workspace Architecture

To eliminate confusion between **managing the SaaS platform** and **working inside an individual school**, the platform owner workspace is split into two explicit operational modes:

### A. Platform Owner Mode (`workspaceMode === 'platform'`)
- **Default State**: Active upon login (`/saas`).
- **Sidebar Scope**: Only SaaS management groups are visible:
  - SaaS & Subscriptions: *Platform Overview (`/saas`)*, *Subscription Plans (`/saas/plans`)*, *Renewal Requests (`/saas/renewal-requests`)*, *Bulk Operations (`/saas/admin`)*.
  - Directories: *Schools Directory (`/saas`)*, *Branches Directory (`/branches`)*.
  - System: *Platform Configuration (`/admin/config`)*.
- **Operational School Modules**: Hidden from the sidebar to prevent un-scoped or ambiguous operations.

### B. School Inspection Mode (`workspaceMode === 'school' && !!currentSchool.id`)
- **Activation**: Triggered when the platform owner selects a specific institution from the Schools Directory or the Tenant Inspector widget on `/dashboard`.
- **Context Banner**: The sidebar presents an inspection header displaying `Inspecting [School Name]` along with a quick action button: `← Return to SaaS Platform`.
- **Sidebar Scope**: Displays that specific school's operational modules (Front Office, Student Details, Academics, Fees, Exams, Library, Settings) strictly bound to `currentSchool.id`.
- **Termination**: Clicking `← Return to SaaS Platform` or the top switcher "Exit" clears `currentSchool` and `currentBranch` context in Pinia and redirects back to `/saas`.

---

## 3. Data & Query Scope Rules

1. **Academic Year Scope**:
   - Every operational query (students, staff, fee collections, attendance) must resolve to the active academic year of the inspected or current institution.
   - When superadmin inspects a school, `initializeAcademicYear(schoolId)` fetches that school's specific academic year calendar instead of assuming a global fallback.
2. **Branch Scope**:
   - When a school has multiple branches, `shouldShowBranchFilter` allows filtering between "All Branches" and individual campus locations.
   - For `branch_admin`, data is strictly isolated to the admin's assigned branch at both backend controller and database levels.
3. **Fee Consistency**:
   - Headline collection card and fee collection breakdown derive from the same source of truth for the active academic year.
   - Zero-collection amounts (`₹0`) are treated as valid metrics and will not trigger fallback race conditions.

---

## 4. Verification & Security Boundaries

Automated regression coverage for this baseline is implemented in:
- `backend/scripts/verify-demo-experience.js`
- Test suite validates:
  1. 100% login success across all 9 personas.
  2. Role home path resolution (`/saas`, `/dashboard`, `/portal`).
  3. Strict 403 Forbidden enforcement on role boundaries (parents/students forbidden from staff endpoints; staff forbidden from SaaS platform plans).
  4. Metric integrity across branches and academic years.
