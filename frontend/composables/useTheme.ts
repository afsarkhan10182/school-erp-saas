import { ref } from 'vue';

const isDark = ref(false);

/**
 * Shared theme composable — use this everywhere instead of duplicating
 * theme logic in layouts, headers, and pages.
 *
 * Usage:
 *   const { isDark, toggleTheme, initializeTheme } = useTheme();
 *   onMounted(() => initializeTheme());
 */
export function useTheme() {
  const initializeTheme = () => {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    isDark.value = saved === 'dark' || (!saved && prefersDark);
    applyTheme();
  };

  const applyTheme = () => {
    if (typeof window === 'undefined') return;

    if (isDark.value) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

    // Keep cookie in sync for SSR consistency
    const themeCookie = useCookie('theme');
    themeCookie.value = isDark.value ? 'dark' : 'light';
  };

  const toggleTheme = () => {
    isDark.value = !isDark.value;
    applyTheme();
  };

  return {
    isDark,
    toggleTheme,
    initializeTheme
  };
}
