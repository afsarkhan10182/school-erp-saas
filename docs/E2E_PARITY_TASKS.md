# ERP E2E parity checklist

Browser-first verification against the working CodeIgniter system. Reuse the existing UI and APIs; fix only failures observed in the running product.

Branch selector rule: every school-scoped page must auto-scope and hide Branch when the selected school has one branch; if the selected school has multiple branches, show Branch dropdown and pass `branch_id` through list/create/report flows.

- [x] Student: create, list, profile, login enable/disable, history, promotion, bulk status
- [x] Student bulk edit: CodeIgniter mapping, class/section roster, 10-column chooser, sequential numbers, inline transactional save
- [x] Admission: public application, admin approval, student creation, admission report
- [x] Academics: years, classes, sections, streams, subjects, assignments, timetable, calendar, workload
- [x] Exams and marksheet: setup, marks entry, results, positions/publication/schedule/seating screens, student history, PDF report card
- [x] Certificates and cards: template, student generation, default ID card rendering
- [x] Fees: type/structure, monthly invoices, sequence validation, collection, receipt
- [x] Reports: students, admission/credentials, fees, receipts, attendance, exams, suite entry points
- [x] Attendance: legacy field mapping, class roster, browser save, attendance report reconciliation
- [x] Custom fields platform: module/user scope, field type/options/order, required rules, form rendering, persistence, profile/edit/report display
- [x] Student admission field parity
  - [x] Browser-map legacy academic, student, login, guardian and previous-school sections
  - [x] Core modern fields: academic year, admission/roll/date, class/section/category, identity/contact, login and guardian
  - [x] Separate present/permanent address
  - [x] Sibling details/linking
  - [x] Previous-school name, qualification and remarks
  - [x] Configured student/parent custom fields (including required validation); no hardcoded school-specific LC/PEN/APAAR fields
  - [x] Browser E2E: public online application with configured required field, admin approval, created student profile displays admission extras/custom values
- [x] Student transfer across branches: create `E2E Branch`, selectively transfer E2E student, verify source filtering
- [x] Employee certificate with a real employee/employee template: E2E employee template created, E2E Teacher loaded, generated preview verified with Staff ID/designation/department
- [x] Role regression: superadmin, branch admin, teacher, accountant, student and parent browser login verified
- [x] Cross-menu branch scoping rule
  - [x] Backend rule confirmed: non-superadmin users cannot override `school_id`; superadmin may provide `school_id` as the selected tenant context
  - [x] Backend branch validation centralized: submitted `branch_id` must belong to resolved/assigned school
  - [x] Decision: no global header branch switch for now; page-level branch selectors remain source of truth to avoid silently resetting Class/Exam/Section page filters
  - [x] Superadmin selected tenant context now updates auth school context and future tenant isolation respects selected school/branch
  - [x] Academic calendar route now uses central branch context validation
  - [x] Negative API smoke: mismatched superadmin `school_id` + other-school `branch_id` is rejected with 403
  - [x] Negative verification: valid school admin cannot access another school's records by changing `school_id` in browser/API requests
  - [x] Generic `/ops/...` menu pages: multi-branch schools show Branch dropdown; single-branch schools auto-scope and hide Branch
  - [x] Static/UI wiring audit: report suite, student extra reports, teacher workload and card/certificate template generation now pass branch scope and hide Branch on single-branch schools
  - [x] Student bulk edit and promotion now show/pass page-level Branch for multi-branch schools
  - [x] Exempt: My Timetable is logged-in-teacher scoped, so no manual Branch dropdown is needed
  - [x] Exempt: `/admin/config` is global superadmin configuration, not school branch-scoped
  - [x] Browser audit remaining non-ops pages: students, academics, exams, attendance, fees, reports, certificates, settings
  - [x] Stale audit paths checked: `/academic/subject-teachers` and `/certificates` are not sidebar routes; subject-teacher work lives under Subjects, certificates use `/certificates/templates`, `/certificates/generate-students`, `/certificates/generate-employees`
- [x] Reports/cards/seating/online-exam review findings
  - [x] Browser visual comparison started against CI for admission, bulk edit, online admission, student list, promotion, class/section, subjects, timetable, exam setup, seating, cards and admission reports
  - [x] Fee reports use real invoice statuses only: `sent`, `partial_paid`, `overdue`, `paid`
  - [x] Exam seating apply regenerates roster server-side instead of trusting posted `plan_json`
  - [x] Exam seating update lookup handles school-wide class/section nulls explicitly
  - [x] Online exam answer key hidden from non-staff `GET /online-exams/:id`
  - [x] Online exam submit requires published/open exam, resolves student from logged-in student user, scopes class/branch, blocks duplicate submit
  - [x] Student extra reports now expose CI-style branch/class/section/date filters
  - [x] Reports depth parity: suite exposes common branch/class/section/date filters and links to dedicated CI-style student, extra/admission, fee, receipt, attendance and exam report screens
    - [x] Browser/menu pass: CI-style Reports → Examination split restored; Single Exam Report Card, Tabulation Sheet and Multi Exam Progress Report are explicit report entries, while Exam menu keeps operational exam actions
    - [x] Browser route audit: 123 modern sidebar routes loaded with no 404/blank/runtime hard failure; CI/modern menu exports saved under `/tmp/school-erp-visual-audit`
    - [x] Reports suite cleanup: removed generic exam-report suite stub so exam reports are not shown both as suite stub and dedicated CI-style report entries
  - [x] Cards depth parity: background/layout field toggles and employee generation browser pass
    - [x] Template field toggles exposed in UI and persisted through existing `fields_json`
    - [x] Background image URL exposed and rendered through existing `fields_json`
    - [x] Employee card generation wired in API/UI using existing employee templates
    - [x] Browser preview with real E2E Branch teacher generated successfully
    - [x] Browser visual pass: template and generate pages use structured panels, labels, aligned grids and preview area instead of raw CRUD layout
  - [x] Online exam depth parity: question bank/import/timed UI/positions browser pass
    - [x] Start/end scheduling exposed in online exam UI and enforced by submit API
    - [x] Question display order exposed when adding questions
    - [x] Question bank import exposed in Manage exam and imports from existing OPS question bank
    - [x] Student-facing timed take UI added at `/portal/online-exams`
  - [x] Exam seating CI-depth pass: schedule slot selector, overview route, calendar route and dedicated sticker route render in browser
    - [x] Slot metadata persists inside existing `plan_json` when a schedule is used, avoiding a DB migration
- [x] Remaining operational modules
  - [x] Library: book list/create/edit and issue/return browser-tested; ISBN/category UI and managed category link completed; publisher/edition/purchase date/purchase price/sale price/cover UI browser-verified and report mapped; CSV import, role-based borrowers, fines and issued report browser-session verified
  - [x] Transport: route, vehicle, stoppage, linked vehicle assignment, fee setup/report, student route/vehicle/stop allocation in admission/profile and allocation report browser-tested
  - [x] Hostel: category, hostel, room, linked student allocation and allocation report browser-tested
  - [x] HR/payroll: legacy sidebar mapped; employee create/list/auth, leave limits/request approval, salary template/assignment/payment, advance salary approval, award, employee certificate and HR report browser-tested
  - [x] Accounting: CodeIgniter fields mapped into modern UI config for accounts, voucher heads and deposit/expense vouchers; browser create and accounting report list verified
  - [x] Inventory: CodeIgniter fields mapped into modern UI config for category, unit, product, store, supplier, purchase, sale and issue; browser create and inventory report list verified
  - [x] Communication, CMS/settings: SMS queue, email queue, mailbox, CMS page create flows browser-tested; settings/profile pages load without runtime errors

## Browser-created role test credentials

- Teacher: `e2e.teacher.1787820147294@demo.school` / `EtwoETeacher!123`
- Accountant: `e2e.accountant.1787820147294@demo.school` / `EtwoEAccountant!123`
- Student: `browser1787823370093@demo.school` / `Stu0mq1dsb3A1`
- Parent: `e2e.parent.known.1787918775439@demo.school` / `E2eParent!123`
