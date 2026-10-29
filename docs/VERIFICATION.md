---
phase: student-record-access-control
verified: 2026-10-21
status: gaps_found
score: 4/5 must-haves verified
is_re_verification: false
gaps:
  - truth: "Every student-related operation is protected against cross-branch/cross-school ID tampering and matches UI permissions."
    status: incomplete
    reason: "Read boundaries and one payment attempt were tested; not every update/authentication/report route or cross-school vector was exercised. UI parity needs browser verification."
    artifacts:
      - path: "backend/src/controllers/academic/student.controller.js"
        issue: "Several student mutation/query paths still need dedicated boundary tests."
    missing:
      - "Negative ID/body/query tests for all student update, authentication, report, and invoice-related routes"
      - "Cross-school ID tampering coverage"
      - "Browser verification of Teacher and Accountant pages"
---

# Student-record access-control verification

This is a verification snapshot for the student-record security increment, not completion of the broader School ERP competitive-audit goal.

## Must-haves

| Truth | Status | Evidence |
|---|---|---|
| Parent and Student roles cannot use the staff student directory; their linked/self portal still works. | VERIFIED | Live API verifier: `/students` returns 403 to both roles; parent/student portal journeys pass. |
| Teachers see only students in current-year assigned class/section/stream/branch scopes. | VERIFIED | Local demo API returns Main Branch assigned students only and 404 for the Second Branch student's profile; Jest asserts assignment filters. |
| Branch Admin cannot open another branch's student profile or post to its invoice. | VERIFIED | Local demo API returns 404 for Main Branch profile and payment attempt; paid invoice remains unchanged. |
| Accountant invoice breakdown is branch-limited. | VERIFIED | Local demo API allows Main Branch invoice breakdown and returns 404 for Second Branch student. |
| All student operations and UI permissions resist branch/school ID tampering. | INCOMPLETE | Update/authentication query filters were tightened, but not every mutation, cross-school vector, or browser flow has been tested. |

## Artifacts and wiring

| Artifact | Exists | Substantive | Wired/evidence |
|---|---:|---:|---|
| `backend/src/routes/academic/student.routes.js` | Yes | Yes | Role gates on staff directory, mutation, and ledger routes. |
| `backend/src/controllers/academic/student.controller.js` | Yes | Yes | School/branch and teacher-assignment scopes applied in roster/profile/by-class queries. |
| `backend/scripts/verify-demo-experience.js` | Yes | Yes | Live role-cookie API assertions exercise read, payment, and invoice-breakdown boundaries. |
| `backend/test/student-sibling-filter.test.js` | Yes | Yes | Includes teacher assignment query-scope assertion. |

## Checks

- `npm run test:demo:experience`: 59/59 passed.
- `npm test -- --runInBand`: 43/43 passed across 11 suites.
- `npm run test:demo:routes`: passed for nine role logins and both demo branches.
- `npm run db:audit:demo`: passed, `missing: []`.
- `node --check` on changed backend files and `git diff --check`: passed.
- Local Nuxt `/dashboard` returned HTTP 200. A transient HMR `_path` exception appeared during middleware reload; subsequent request succeeded.

## Human verification still needed

- Open local app in the authorized browser and confirm Teacher roster/detail UI, Accountant invoice breakdown/collection UI, and family portal navigation.
- Check desktop/mobile layout, browser console after a clean dev-server restart, and refresh persistence.
- Continue the broader goal's school setup, academic-year transition, admission-to-fee workflow, remaining module journeys, and reference-role inspection.

## Verdict

The tested student-record API boundaries now behave as intended for the listed roles. Overall status remains `gaps_found`; this evidence does not establish full student-module security, UI parity, or completion of the broader ERP goal.
