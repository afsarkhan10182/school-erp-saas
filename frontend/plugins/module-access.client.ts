export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore();
  const { loadUserModules, initializeFromCache, setupModuleChangeListener } = useModuleAccess();

  // Module access plugin starting

  // Wait for auth initialization to complete
  await new Promise<void>(resolve => {
    const checkAuth = () => {
      if (!authStore.isInitializing) {
        resolve();
      } else {
        setTimeout(checkAuth, 100);
      }
    };
    checkAuth();
  });

  // Auth initialization complete

  // Only preload modules if user is authenticated and not super admin
  if (authStore.isAuthenticated && authStore.user?.role !== 'super_admin') {
    // Try to initialize from cache first
    const cached = initializeFromCache();

    // Always ensure modules are loaded
    setTimeout(() => {
      if (!cached) {
        loadUserModules();
      }
    }, 1000);
  }

  // Setup module change listener (no polling needed)
  setupModuleChangeListener();
});
