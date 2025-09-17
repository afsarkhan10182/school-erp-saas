export default defineNuxtRouteMiddleware(async to => {
  // Skip middleware on server-side
  if (process.server) return;

  const authStore = useAuthStore();
  const {
    canAccessRoute,
    loadUserModules,
    areModulesLoaded,
    initializeFromCache,
    isLoading,
    checkModulesUpdated
  } = useModuleAccess();

  // Skip for super admin
  if (authStore.user?.role === 'super_admin') return;

  // Skip for login/logout routes
  if (to.path === '/auth/login' || to.path === '/logout') return;

  // Skip for dashboard
  if (to.path === '/dashboard') return;

  // Wait for auth initialization to complete
  if (authStore.isInitializing) {
    // Wait for auth to initialize (max 3 seconds)
    let attempts = 0;
    while (authStore.isInitializing && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
  }

  // If still not authenticated after waiting, redirect to login
  if (!authStore.isAuthenticated || !authStore.user) {
    return navigateTo('/auth/login');
  }

  // Try to initialize from cache first
  const cached = initializeFromCache();

  // Load modules if not already loaded, not in cache, and not currently loading
  if (!cached && !areModulesLoaded() && !isLoading.value) {
    // Use blocking call to ensure modules are loaded before route check
    try {
      await loadUserModules();
    } catch (error) {
      console.warn('Failed to load modules in middleware:', error);
      // If module loading fails, allow access to prevent blocking
      // This ensures users aren't locked out due to API issues
      return;
    }
  }

  // If modules still aren't loaded after attempt, allow access to prevent blocking
  if (!areModulesLoaded() && !cached) {
    console.warn('Modules not loaded, allowing access to prevent blocking');
    return;
  }

  // Normalize the route path for consistent checking
  const routePath = to.path.replace(/\/$/, '');

  // Check if user can access the route
  if (!canAccessRoute(routePath)) {
    // Before redirecting, check if modules have been updated
    if (authStore.isAuthenticated && authStore.user?.role && !authStore.isSuperAdmin) {
      try {
        await checkModulesUpdated();
        // Re-check access after potential update
        if (canAccessRoute(routePath)) {
          return; // Access granted after update
        }
      } catch (error) {
        console.warn('Failed to check module updates in middleware:', error);
      }
    }

    // Redirect to dashboard with error message
    return navigateTo({
      path: '/dashboard',
      query: {
        error: 'module_access_denied',
        module: routePath
      }
    });
  }
});
