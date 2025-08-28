export default defineNuxtRouteMiddleware(async (to) => {
  // Skip middleware on server-side
  if (process.server) return;

  const authStore = useAuthStore();
  const { canAccessRoute, loadUserModules, isLoading } = useModuleAccess();

  // Skip for super admin
  if (authStore.user?.role === 'super_admin') return;

  // Skip for login/logout routes
  if (to.path === '/login' || to.path === '/logout') return;

  // Skip for dashboard and test pages
  if (to.path === '/dashboard' || to.path === '/test-sidebar' || to.path === '/debug-modules') return;

  // Load modules if not already loaded
  if (!isLoading.value) {
    await loadUserModules();
  }

  // Check if user can access the route
  if (!canAccessRoute(to.path)) {
    // Redirect to dashboard with error message
    return navigateTo({
      path: '/dashboard',
      query: { 
        error: 'module_access_denied',
        module: to.path 
      }
    });
  }
});
