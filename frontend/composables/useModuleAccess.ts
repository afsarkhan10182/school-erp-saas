import { ref, computed } from 'vue';
import { useAuth } from '~/composables/useAuth';
import { Saas } from '~/api/administration/saas';
import { Schools } from '~/api/administration/schools';

// Global state to prevent multiple API calls
let globalUserModules: string[] = [];
let globalIsLoading = false;
let globalLastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Function to clear global module cache (called on logout)
export const clearModuleCache = () => {
  globalUserModules = [];
  globalIsLoading = false;
  globalLastFetch = 0;

  if (import.meta.client) {
    // Clear module cache
    sessionStorage.removeItem('user-modules');
    sessionStorage.removeItem('user-modules-time');
    sessionStorage.removeItem('modules-updated-at');
    sessionStorage.removeItem('modules-verified-this-session');
    sessionStorage.removeItem('module-listener-setup');

    // Clear school-specific module cache
    const schoolKeys = Object.keys(sessionStorage).filter(
      key => key.startsWith('modules-') || key.startsWith('school-')
    );
    schoolKeys.forEach(key => sessionStorage.removeItem(key));
  }
};

export function useModuleAccess() {
  const { user, isSuperAdmin } = useAuth();
  const userModules = ref<string[]>([]);
  const isLoading = ref(false);

  // Check if a module is enabled for the current user's school
  const isModuleEnabled = (moduleCode: string): boolean => {
    // Super admin has access to all modules
    if (isSuperAdmin.value) {
      return true;
    }

    const enabled = userModules.value.includes(moduleCode);
    return enabled;
  };

  // Load user's enabled modules from their school's subscription plan
  const loadUserModules = async (forceRefresh = false) => {
    // Skip if already loading
    if (globalIsLoading && !forceRefresh) {
      isLoading.value = true;
      // Wait for the current loading to complete
      while (globalIsLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      userModules.value = globalUserModules;
      isLoading.value = false;
      return;
    }

    // Check cache first (unless force refresh)
    if (
      !forceRefresh &&
      globalUserModules.length > 0 &&
      Date.now() - globalLastFetch < CACHE_DURATION
    ) {
      userModules.value = globalUserModules;
      return;
    }

    // Check sessionStorage cache
    if (!forceRefresh && import.meta.client) {
      const cached = sessionStorage.getItem('user-modules');
      const cachedTime = sessionStorage.getItem('user-modules-time');

      if (cached && cachedTime) {
        const cacheAge = Date.now() - parseInt(cachedTime);
        if (cacheAge < CACHE_DURATION) {
          globalUserModules = JSON.parse(cached);
          globalLastFetch = parseInt(cachedTime);
          userModules.value = globalUserModules;
          return;
        }
      }
    }

    // Set global loading state
    globalIsLoading = true;
    isLoading.value = true;

    try {
      if (isSuperAdmin.value) {
        // Super admin has access to all modules - load all available modules
        const response = await Saas.getAvailableModules();
        if (response.success) {
          const allModules = response.data
            .filter((module: any) => module.is_active)
            .map((module: any) => module.code || module.key);

          globalUserModules = allModules;
          userModules.value = allModules;
          globalLastFetch = Date.now();

          // Cache in sessionStorage
          if (import.meta.client) {
            sessionStorage.setItem('user-modules', JSON.stringify(allModules));
            sessionStorage.setItem('user-modules-time', globalLastFetch.toString());
          }

          console.log('✅ Super admin modules loaded:', allModules);
        } else {
          console.warn('❌ Failed to load super admin modules:', response.message);
          // Set empty modules to prevent blocking
          globalUserModules = [];
          userModules.value = [];
        }
      } else {
        const schoolId = user.value?.school_id;

        if (!schoolId) {
          globalUserModules = [];
          userModules.value = [];
          globalIsLoading = false;
          isLoading.value = false;
          return;
        }

        const response = await Schools.getModules(schoolId);

        if (response.success) {
          const enabledModules = response.data.modules
            .filter((module: any) => module.enabled)
            .map((module: any) => module.code || module.key);

          globalUserModules = enabledModules;
          userModules.value = enabledModules;
          globalLastFetch = Date.now();

          // Cache in sessionStorage
          if (import.meta.client) {
            sessionStorage.setItem('user-modules', JSON.stringify(enabledModules));
            sessionStorage.setItem('user-modules-time', globalLastFetch.toString());
            sessionStorage.setItem('modules-updated-at', response.data.modules_updated_at);
          }
        } else {
          console.warn('❌ Failed to load modules:', response.message);
          // Set empty modules to prevent blocking
          globalUserModules = [];
          userModules.value = [];
        }
      }
    } catch (error) {
      // Fallback: allow access if module loading fails
      globalUserModules = [];
      userModules.value = [];
    } finally {
      globalIsLoading = false;
      isLoading.value = false;
    }
  };

  // Filter menu items based on module access
  const filterMenuByModules = (menuItems: any[]): any[] => {
    // Super admin: return everything as-is
    if (isSuperAdmin.value) {
      return menuItems;
    }

    return menuItems
      .map(item => {
        // Filter children first
        const children = item.children ? filterMenuByModules(item.children) : [];

        const hasChildren = children.length > 0;
        const moduleEnabled = !item.requiredModule || isModuleEnabled(item.requiredModule);

        // Keep parent if:
        // 1. Its module is enabled, OR
        // 2. At least one child survived
        if (moduleEnabled || hasChildren) {
          return {
            ...item,
            children
          };
        }

        return null;
      })
      .filter(Boolean);
  };

  // Check if user can access a specific route/page
  const canAccessRoute = (routePath: string): boolean => {
    // Normalize route path (remove trailing slash for consistent matching)
    const normalizedPath = routePath.replace(/\/$/, '');

    // Define route-to-module mapping with normalized paths
    const routeModuleMap: Record<string, string> = {
      '/fees': 'fees',
      '/fees/types': 'fees',
      '/fees/structures': 'fees',
      '/fees/invoices': 'fees',
      '/fees/collections': 'fees',
      '/reports/fees': 'fees',
      '/reports/receipts': 'fees',
      '/fee-ledger': 'fees',

      '/students': 'students',
      '/students/create': 'students',
      '/students/import': 'students',
      '/reports/students': 'students',

      '/attendance': 'attendance',
      '/reports/attendance': 'attendance',

      '/exams': 'exams',
      '/exams/report-cards': 'exams',
      '/exams/marks-entry': 'exams',
      '/exams/results': 'exams',
      '/exams/types': 'exams',
      '/reports/exams': 'exams',

      // Academic Management Module
      '/academic/subjects': 'academic_management',
      '/academic/class-assignments': 'academic_management',
      '/academic/timetable': 'academic_management',

      '/library': 'library',
      '/reports/library': 'library',

      '/hr': 'hr',
      '/reports/hr': 'hr',

      '/transport': 'transport',
      '/reports/transport': 'transport',

      '/reports': 'reports',
      '/reports/advanced': 'reports'

      // Module settings page removed - now handled through subscription plans
    };

    // Check for exact match first
    let requiredModule = routeModuleMap[normalizedPath];

    // Special case for fee-ledger route (dynamic student ID)
    if (!requiredModule && normalizedPath.includes('/fee-ledger')) {
      requiredModule = 'fees';
    }

    // If no exact match, check for prefix matches (for nested routes)
    if (!requiredModule) {
      // Find the longest matching prefix
      const matchingRoute = Object.keys(routeModuleMap)
        .filter(route => normalizedPath.startsWith(route))
        .sort((a, b) => b.length - a.length)[0]; // Sort by length descending

      if (matchingRoute) {
        requiredModule = routeModuleMap[matchingRoute];
      }
    }

    if (!requiredModule) {
      // If no module requirement defined, allow access
      return true;
    }

    return isModuleEnabled(requiredModule);
  };

  // Check if modules are already loaded
  const areModulesLoaded = (): boolean => {
    return globalUserModules.length > 0 && Date.now() - globalLastFetch < CACHE_DURATION;
  };

  // Clear module cache (useful for logout or when subscription changes)
  const clearModuleCache = () => {
    globalUserModules = [];
    globalLastFetch = 0;
    userModules.value = [];
    if (import.meta.client) {
      sessionStorage.removeItem('user-modules');
      sessionStorage.removeItem('user-modules-time');
      sessionStorage.removeItem('modules-updated-at');
      sessionStorage.removeItem('modules-verified-this-session');
    }
  };

  // Refresh modules (useful when subscription changes)
  const refreshModules = async () => {
    clearModuleCache();
    await loadUserModules(true);
  };

  // Check if modules have been updated (only when needed)
  const checkModulesUpdated = async () => {
    if (!user.value?.school_id || isSuperAdmin.value) return;

    try {
      // Use existing API to get modules with timestamp
      const response = await Schools.getModules(user.value.school_id);
      if (response.success) {
        const serverTimestamp = response.data.modules_updated_at;
        const cachedTimestamp = sessionStorage.getItem('modules-updated-at');

        // If timestamp changed, clear cache and reload silently
        if (serverTimestamp !== cachedTimestamp) {
          clearModuleCache();
          sessionStorage.setItem('modules-updated-at', serverTimestamp);
          await loadUserModules(true);
          // No toast notification - silent update
        }
      }
    } catch (error) {
      console.warn('Failed to check module updates:', error);
    }
  };

  // Setup module change detection (only when needed)
  const setupModuleChangeListener = () => {
    if (!import.meta.client) return;

    // Check if we've already set up the listener this session
    const listenerSetup = sessionStorage.getItem('module-listener-setup');

    if (!listenerSetup) {
      // Only check once when user first loads the app
      setTimeout(() => {
        if (user.value && !isSuperAdmin.value) {
          checkModulesUpdated();
        }
      }, 1000); // Wait 1 second after auth is ready

      // Mark as setup - no periodic checks
      sessionStorage.setItem('module-listener-setup', 'true');
    }
  };

  // Initialize modules from cache if available
  const initializeFromCache = () => {
    if (import.meta.client) {
      const cached = sessionStorage.getItem('user-modules');
      const cachedTime = sessionStorage.getItem('user-modules-time');

      if (cached && cachedTime) {
        const cacheAge = Date.now() - parseInt(cachedTime);

        if (cacheAge < CACHE_DURATION) {
          globalUserModules = JSON.parse(cached);
          globalLastFetch = parseInt(cachedTime);
          userModules.value = globalUserModules;
          return true;
        } else {
        }
      } else {
      }
    }
    return false;
  };

  return {
    userModules,
    isLoading,
    isModuleEnabled,
    loadUserModules,
    areModulesLoaded,
    clearModuleCache,
    refreshModules,
    initializeFromCache,
    filterMenuByModules,
    canAccessRoute,
    setupModuleChangeListener,
    checkModulesUpdated
  };
}
