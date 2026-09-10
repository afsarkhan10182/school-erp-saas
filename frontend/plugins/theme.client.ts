export default defineNuxtPlugin(() => {
  // Only run on client side
  if (import.meta.server) return;

  // Sync theme across tabs — listen for storage changes
  const syncTheme = (event: StorageEvent) => {
    if (event.key === 'theme') {
      const isDark = event.newValue === 'dark';
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  // Add storage event listener for cross-tab sync
  window.addEventListener('storage', syncTheme);

  // Cleanup on app unmount
  return {
    provide: {
      syncTheme
    }
  };
});
