export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore();
  const { loadUserModules, initializeFromCache, setupModuleChangeListener } = useModuleAccess();

  console.log('🔧 Module access plugin starting...', {
    isAuthenticated: authStore.isAuthenticated,
    userRole: authStore.user?.role,
    isInitializing: authStore.isInitializing
  });

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

  console.log('🔧 Auth initialization complete...', {
    isAuthenticated: authStore.isAuthenticated,
    userRole: authStore.user?.role
  });

  // Only preload modules if user is authenticated and not super admin
  if (authStore.isAuthenticated && authStore.user?.role !== 'super_admin') {
    console.log('🔧 Loading modules for school admin...');

    // Try to initialize from cache first
    const cached = initializeFromCache();
    console.log('🔧 Cache check result:', { cached });

    // Always ensure modules are loaded
    setTimeout(() => {
      if (!cached) {
        console.log('🔧 Calling loadUserModules...');
        loadUserModules();
      } else {
        console.log('🔧 Using cached modules, skipping API call');
      }
    }, 1000);
  } else {
    console.log('🔧 Skipping module load:', {
      isAuthenticated: authStore.isAuthenticated,
      userRole: authStore.user?.role
    });
  }

  // Setup module change listener (no polling needed)
  setupModuleChangeListener();
});
