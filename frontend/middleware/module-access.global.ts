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

  // Check for module updates (timestamp-based invalidation)
  await checkModulesUpdated();

  // Try to initialize from cache first
  const cached = initializeFromCache();

  // Only load modules if not already loaded and not in cache
  if (!cached && !areModulesLoaded() && !isLoading.value) {
    await loadUserModules();
  }

  // Normalize the route path for consistent checking
  const routePath = to.path.replace(/\/$/, '');

  // Check if user can access the route
  if (!canAccessRoute(routePath)) {
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
