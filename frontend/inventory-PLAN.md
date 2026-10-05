# Inventory Module Frontend Plan

## Phase 1: API Services
- [ ] Create `frontend/api/inventory/categories.ts` (CRUD).
- [ ] Create `frontend/api/inventory/suppliers.ts` (CRUD).
- [ ] Create `frontend/api/inventory/stores.ts` (CRUD).
- [ ] Create `frontend/api/inventory/items.ts` (CRUD).
- [ ] Create `frontend/api/inventory/issues.ts` (CRUD).
- [ ] Create `frontend/api/inventory/index.ts` to export all.
- [ ] Export `inventory` in `frontend/api/index.ts` (if needed, otherwise just let pages import from `~/api/inventory`).

## Phase 2: UI Pages
All pages must use `useGlobalBranch()` to retrieve `selectedBranchId` and pass it to API calls. Use placeholder Vue components that at least implement the `selectedBranchId` logic and API calls.
- [ ] Create `frontend/pages/inventory/index.vue` that redirects to `/inventory/items`.
- [ ] Create `frontend/pages/inventory/categories.vue` with a simple UI.
- [ ] Create `frontend/pages/inventory/suppliers.vue` with a simple UI.
- [ ] Create `frontend/pages/inventory/stores.vue` with a simple UI.
- [ ] Create `frontend/pages/inventory/items.vue` with a simple UI.
- [ ] Create `frontend/pages/inventory/issues.vue` with a simple UI.

## Phase 3: Sidebar Configuration
- [ ] Update `frontend/config/school-sidebar.ts` to add the Inventory section (Icon: `Package` or `Archive`, routes to items, issues, suppliers, stores, categories).
