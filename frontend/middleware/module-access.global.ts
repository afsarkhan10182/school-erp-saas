import { useAuth } from '~/composables/useAuth';

// Smart cache with timestamp-based change detection
let lastModuleCheck = 0;
let lastModulesUpdatedAt = '';
const MODULE_CHECK_INTERVAL = 10000; // 10 seconds cache

export default defineNuxtRouteMiddleware(async to => {
  // Skip middleware on server-side
  if (process.server) return;

  const { user } = useAuth();
  const {
    canAccessRoute,
    loadUserModules,
    areModulesLoaded,
    initializeFromCache,
    isLoading,
    checkModulesUpdated
  } = useModuleAccess();

  // Skip for super admin
  if (user.value?.role === 'super_admin') return;

  // Skip for login/logout routes
  if (to.path === '/auth/login' || to.path === '/logout') return;
  if (to.path.startsWith('/apply/')) return;

  // Skip for dashboard and student/parent portal
  if (to.path === '/dashboard' || to.path === '/portal') return;

  // Auth composable handles initialization automatically

  // If still not authenticated, redirect to login
  if (!user.value) {
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
      // If module loading fails, allow access to prevent blocking
      // This ensures users aren't locked out due to API issues
      return;
    }
  }

  // If modules still aren't loaded after attempt, allow access to prevent blocking
  if (!areModulesLoaded() && !cached) {
    return;
  }

  // Normalize the route path for consistent checking
  const routePath = to.path.replace(/\/$/, '');

  // SMART: Check modules_updated_at timestamp before loading
  const now = Date.now();
  const shouldCheckTimestamp =
    now - lastModuleCheck > MODULE_CHECK_INTERVAL || // Time-based cache
    (import.meta.client && sessionStorage.getItem('modules-refresh')) || // Change flag
    (import.meta.client && localStorage.getItem('modules-refresh')); // Cross-tab change

  if (shouldCheckTimestamp) {
    try {
      // First, check if modules have been updated (lightweight timestamp call)
      const schoolId = user.value?.school_id;
      if (schoolId) {
        try {
          const { Schools } = await import('~/api/administration/schools');
          const response = await Schools.getModulesTimestamp(schoolId);

          if (response.success) {
            const serverTimestamp = response.data.modules_updated_at;

            // Only reload if timestamp actually changed
            if (serverTimestamp !== lastModulesUpdatedAt) {
              await loadUserModules(true);
              lastModulesUpdatedAt = serverTimestamp;
            } else {
              // Modules unchanged, using cache
            }
          }
        } catch (error) {
          await loadUserModules(true);
        }
      }

      lastModuleCheck = now;

      // Clear refresh flags
      if (import.meta.client) {
        sessionStorage.removeItem('modules-refresh');
        localStorage.removeItem('modules-refresh');
      }
    } catch (error) {
      // Fallback: reload modules if timestamp check fails
      await loadUserModules(true);
    }
  } else {
    // Using cached modules (10s cache)
  }

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
