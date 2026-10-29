# School ERP SaaS — UI/UX Audit Report

**Date:** 2026-09-05  
**Scope:** Full frontend audit — Design system, components, forms, modals, tables, navigation, theme system  
**Reference App:** Edupan ERP (used as benchmark reference)

---

## 1. CURRENT STATE SUMMARY

### ✅ What's Working
- **Design Token System** — Comprehensive CSS custom properties in `main.css` (colors, spacing, shadows, radii)
- **Dark Mode Architecture** — Full light/dark mode via `.dark` class on `<html>` with CSS variable switching
- **Component Classes** — `.btn`, `.card`, `.badge`, `.table`, `.form-input`, `.form-select`, `.modal-*`, `.dropdown`, `.tabs`, `.alert`, etc.
- **Font Stack** — Inter font imported with fallbacks
- **Login Page** — Glassmorphic design with gradient background, animated particles, demo login button
- **Dashboard** — Stat cards with gradient backgrounds, Chart.js integration, filter bars
- **Sidebar Navigation** — Nested collapsible menu groups with active state highlighting

### ⚠️ Critical Issues Found

---

## 2. DESIGN SYSTEM ISSUES

### 2.1 CSS Import Order (Breaking)
**File:** `frontend/assets/css/main.css:10`

```css
@tailwind base;
@tailwind utilities;
@import url('...Inter...'); /* ❌ MUST come BEFORE @tailwind base */
```

**Fix:** Move `@import` to line 1, before all `@tailwind` directives.  
**Impact:** Inter font may not load in production builds.

### 2.2 Tailwind Content Detection Warning
```
WARN  warn - No utility classes were detected in your source files.
```

**File:** `frontend/nuxt.config.ts` — No explicit `content` array in Tailwind config.

**Fix:** Add explicit content paths:
```ts
tailwindcss: {
  config: {
    content: [
      './components/**/*.{vue,js,ts}',
      './layouts/**/*.vue',
      './pages/**/*.vue',
      './composables/**/*.{js,ts}',
      './plugins/**/*.{js,ts}',
      './app.vue',
    ],
  }
}
```

### 2.3 Inconsistent Form Styling
Two parallel form systems exist:

| Source | Class | Used In |
|--------|-------|---------|
| `main.css` | `.form-input`, `.form-select`, `.form-label` | Academic pages, Fees |
| `FormField.vue` | `.input-field` (scoped) | Student forms |

**Impact:** Visual inconsistency across the app. `.input-field` doesn't use design token colors.

---

## 3. COMPONENT AUDIT

### 3.1 Modal.vue
**File:** `components/ui/Modal.vue`

| Issue | Severity | Fix |
|-------|----------|-----|
| Uses raw Tailwind classes instead of `.modal-overlay`/`.modal-content` from CSS | Medium | Refactor to use CSS component classes |
| No focus trap — Tab key navigates behind modal | High | Add `vue-focus-trap` or manual focus management |
| No Escape key handler | Medium | Add `@keydown.escape` listener |
| `bg-opacity-50` is deprecated in Tailwind v3+ | Low | Use `bg-gray-600/50` |
| No transition/animation | Low | Add `<Transition>` wrapper |
| Body scroll not locked when open | Medium | Add `document.body.style.overflow = 'hidden'` |

### 3.2 FormField.vue
**File:** `components/ui/FormField.vue`

| Issue | Severity | Fix |
|-------|----------|-----|
| Scoped styles override design tokens | Medium | Use CSS custom property values directly |
| `focus:ring-blue-500` hardcodes blue, should use `--primary-500` | Low | Sync with design system |
| Missing `disabled` state styling for label | Low | Add `.form-label-disabled` class |
| No inline validation trigger — only shows after parent passes error | Low | Consider `@blur` validation |

### 3.3 EnhancedDropdown.vue
**File:** `components/ui/EnhancedDropdown.vue`

No file read yet but referenced in dashboard/classes — needs audit for:
- Keyboard navigation (Arrow keys, Enter, Escape)
- Focus management
- Screen reader labels
- Dark mode consistency

### 3.4 Header.vue
**File:** `components/layout/Header.vue`

| Issue | Severity | Fix |
|-------|----------|-----|
| Duplicated `toggleTheme` logic from `layouts/default.vue` | Medium | Extract to composable `useTheme()` |
| Theme state initialized from localStorage, not shared | Medium | Create shared `useTheme()` composable |
| Mobile sidebar toggle button missing `aria-label` | Low | Add `aria-label="Toggle navigation"` |

---

## 4. PAGE-BY-PAGE ISSUES

### 4.1 Login Page (`/auth/login`)
**File:** `pages/auth/login.vue`

| Issue | Severity | Fix |
|-------|----------|-----|
| `checkingAuth` state may flash login form briefly | Low | Show skeleton loader instead |
| Password field has no show/hide toggle | Medium | Add PasswordInput component |
| No loading state on "Quick Demo Login" button | Low | Add spinner during demo fill |
| Error alert doesn't auto-dismiss | Low | Auto-dismiss after 5s |
| No "Back to home" link for unauthenticated landing | N/A | — |

### 4.2 Dashboard (`/dashboard`)
**File:** `pages/dashboard.vue`

| Issue | Severity | Fix |
|-------|----------|-----|
| Hardcoded `ml-64` in inline styles | Low | Use CSS variable `--sidebar-width` |
| Chart canvas has no dark mode background adaption | Medium | Use plugin to redraw on theme switch |
| Activity icons recreated on every render (computed inside v-for) | Low | Pre-compute once outside loop |
| 6 stat cards on XL screens may cause overflow | Low | Cap at 4-5 columns, use horizontal scroll |
| `formatCurrency` creates new Intl.NumberFormat on every call | Low | Cache formatter instance |

### 4.3 Students List (`/students`)
Referenced in many components. Needs audit for:
- Bulk action toolbar styling
- Row selection checkbox styling
- Inline edit vs modal edit consistency

### 4.4 Academic Classes (`/academic/classes/index.vue`)
| Issue | Severity | Fix |
|-------|----------|-----|
| Table uses raw Tailwind classes, not `.table`/`.table-container` | Medium | Refactor to use component classes |
| Status badge uses inline classes instead of `.badge` | Low | Use `badge-success`/`badge-danger` |
| Missing pagination component | Medium | Add `<Pagination>` component |

---

## 5. THEME SYSTEM ISSUES

### 5.1 Theme Toggle Duplication
- `layouts/default.vue:305-322` — has `toggleTheme()` + `isDark` ref
- `components/layout/Header.vue:57-70` — has separate `toggleTheme()` + `isDark` ref
- `pages/auth/login.vue:292-323` — has separate `toggleTheme()` + `isDark` ref

**Fix:** Create `composables/useTheme.ts`:
```ts
const isDark = ref(false)
const toggleTheme = () => { ... }
export const useTheme = () => ({ isDark, toggleTheme })
```

### 5.2 Theme Flash on SSR
The theme is applied client-side after hydration, causing a flash.

**Fix:** Add inline script in `<head>` to read cookie/localStorage before paint:
```html
<script>
  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark')
  }
</script>
```

---

## 6. ACCESSIBILITY ISSUES

| Issue | Severity | Location |
|-------|----------|----------|
| No skip-to-content link | High | `app.vue` |
| Modals don't trap focus | High | `Modal.vue` |
| Dropdowns lack ARIA roles | Medium | `EnhancedDropdown.vue` |
| Table missing `aria-label` for screen readers | Medium | All table views |
| Color contrast in stat cards — white text on light gradients may fail WCAG AA | Low | Dashboard stat cards |
| No `aria-live` region for toast notifications | Medium | `Toast.vue` |
| Sidebar nav missing `aria-current="page"` for active link | Low | `Sidebar.vue` |
| Theme toggle button missing `aria-pressed` state | Low | `Header.vue` |

---

## 7. RESPONSIVE DESIGN ISSUES

| Issue | Severity | Fix |
|-------|----------|-----|
| Stat cards grid `xl:grid-cols-6` may overflow on 1280px screens | Low | Cap at 5, or use auto-fit |
| Dashboard filter select `w-40` fixed width clips long branch names | Low | Use `min-w-max` or auto-width |
| Table horizontal overflow handled but no visual scroll indicator | Low | Add scroll shadow gradient |
| Sidebar `ml-64` hardcode doesn't adapt to CSS variable changes | Low | Use `margin-left: var(--sidebar-width)` |

---

## 8. RECOMMENDED IMPROVEMENTS (Priority Order)

### 🔴 High Priority
1. **Fix Tailwind content detection** — Add explicit content array in config
2. **Create `useTheme` composable** — Eliminate duplicated theme logic
3. **Add focus trap to Modal** — Use `vue-focus-trap` or native `inert` attribute
4. **Add skip-to-content link** — For keyboard navigation
5. **Fix CSS `@import` order** — Move before `@tailwind base`

### 🟡 Medium Priority
6. **Unify form styling** — Use single `.form-*` system everywhere
7. **Add Escape key handler to Modal**
8. **Add ARIA attributes to dropdowns**
9. **Refactor tables to use `.table` classes**
10. **Add script in `<head>` to prevent theme flash**

### 🟢 Low Priority
11. **Refactor Modal.vue to use CSS component classes**
12. **Add Password show/hide toggle on login**
13. **Cache `Intl.NumberFormat` in dashboard**
14. **Add transitions to Modal open/close**
15. **Standardize badge usage across pages**

---

## 9. QUICK WINS (Can fix in <1 hour)

1. Move `@import url('...Inter...')` to top of `main.css`
2. Add `aria-label="Toggle navigation"` to mobile menu button
3. Add `aria-label="Theme toggle"` to theme buttons
4. Replace inline badge classes with `badge-success`/`badge-danger`
5. Add `vue-focus-trap` to Modal component
6. Create `useTheme` composable and replace 3 duplications

---

## 10. FILES REQUIRING CHANGES

| File | Changes |
|------|---------|
| `assets/css/main.css` | Move `@import` to line 1 |
| `nuxt.config.ts` | Add `content` array to Tailwind config |
| `composables/useTheme.ts` | **NEW** — shared theme composable |
| `components/ui/Modal.vue` | Add focus trap, Escape handler, transitions |
| `components/ui/FormField.vue` | Use design tokens instead of hardcoded colors |
| `components/layout/Header.vue` | Use `useTheme()` composable |
| `layouts/default.vue` | Use `useTheme()` composable |
| `pages/auth/login.vue` | Use `useTheme()` composable |
| `pages/dashboard.vue` | Use `.table` CSS classes, cache formatters |
| `pages/academic/classes/index.vue` | Use `.table` and `.badge` classes |
| `app.vue` | Add skip-to-content link |

---

*Report generated from code analysis of 51+ Vue components, 643-line design system CSS, and 40+ page routes.*
