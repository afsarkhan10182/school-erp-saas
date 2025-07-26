export default defineNuxtPlugin(() => {
  // Only run on client side
  if (import.meta.server) return;

  // Get theme from runtime config (set by SSR middleware)
  const config = useRuntimeConfig();
  const initialTheme = (config.public as any).theme || 'dark';

  // Initialize theme on app start
  const initializeTheme = () => {
    // Check for saved theme preference, default to SSR theme
    const savedTheme = localStorage.getItem('theme') || initialTheme;
    const isDark = savedTheme === 'dark';
    
    // Apply theme to document
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Also set cookie for SSR fallback
    const themeCookie = useCookie('theme');
    themeCookie.value = savedTheme;
  };

  // Sync theme across tabs
  const syncTheme = (event: StorageEvent) => {
    if (event.key === 'theme') {
      const isDark = event.newValue === 'dark';
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Update cookie for SSR consistency
      const themeCookie = useCookie('theme');
      themeCookie.value = event.newValue;
    }
  };

  // Initialize theme immediately
  initializeTheme();

  // Add storage event listener for cross-tab sync
  window.addEventListener('storage', syncTheme);

  // Cleanup on app unmount
  return {
    provide: {
      initializeTheme,
      syncTheme
    }
  };
}); 