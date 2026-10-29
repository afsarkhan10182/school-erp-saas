# UI/UX Consistency Standards & Design System

This document defines the standardized design tokens, component classes, and layout rules for the School ERP application across all routes in both **Light Mode** and **Dark Mode**.

---

## 1. Core Principles
1. **Single Source of Truth:** All form inputs, selects, cards, headings, and buttons use unified utility classes from `main.css` or Tailwind classes with consistent light/dark pairs.
2. **Predictable Layout Structure:** No nested `min-h-screen` or redundant outer padding. `layouts/default.vue` provides the outer wrapper; page components start directly with the page header.
3. **Contrast & Legibility:** High contrast between text and background in both modes:
   - Light mode: Slate/Gray 900 text on White/Slate 50 surfaces.
   - Dark mode: Slate/Gray 100 text on Slate 800/900 surfaces.

---

## 2. Design Tokens & Standards

### A. Page Header & Typography
```html
<!-- Standard Page Header Pattern -->
<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Page Title</h1>
    <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Descriptive subtitle explaining the page function.</p>
  </div>
  <div class="flex items-center gap-3">
    <!-- Action buttons -->
  </div>
</div>
```

### B. Cards & Panels
- **Class:** `.card` or `bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 p-5 sm:p-6 shadow-sm`
- **Section Headers inside Cards:** `text-lg font-semibold text-gray-900 dark:text-white mb-4`
- **Muted Subheadings/Descriptions:** `text-xs text-gray-500 dark:text-gray-400`

### C. Form Input Fields (Linear Minimalist Style)
- **Class:** `.input-field` or `.form-input` (`w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/30 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-150`)
- **Labels:** `block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5`

### D. Select Dropdowns (`<EnhancedDropdown>`)
- **Trigger Button:** Matches exact input dimensions (`h-[46px] px-3.5 py-2.5 text-sm border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 focus:ring-1 focus:ring-indigo-500/30`).
- **Floating Menu:** Custom popover card (`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-1 z-50`).
- **Options:** `px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/60 cursor-pointer`.
- **Active Option:** `bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-medium` with a checkmark.
- **Search:** Auto-appears when options count > 6.

### E. Buttons
- **Primary:** `px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-all focus:ring-2 focus:ring-indigo-500/20`
- **Secondary:** `px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium text-sm transition-all`
- **Danger:** `px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-all`

### F. Data Tables
- **Container:** `.table-container` (`rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-800 shadow-sm overflow-x-auto`)
- **Headers (`<th>`):** `px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700`
- **Rows (`<td>`):** `px-6 py-4 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700/60`
- **Row Hover:** `hover:bg-gray-50/75 dark:hover:bg-gray-700/40`

---

## 3. Reference Implementation Routes
- **Reference Page 1:** `frontend/pages/students/bulk-edit.vue` (Form inputs, inline table editing, chip selectors, badge indicators)
- **Reference Page 2:** `frontend/pages/admin/config.vue` & `ConfigManager.vue` (Tabs, settings cards, action toolbars, toggle switches)
