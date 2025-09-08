import { ref, computed } from "vue";
import { useAuthStore } from "~/stores/auth";
import { Saas } from "~/api/administration/saas";
import { Schools } from "~/api/administration/schools";

// Global state to prevent multiple API calls
let globalUserModules: string[] = [];
let globalIsLoading = false;
let globalLastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

export function useModuleAccess() {
  const authStore = useAuthStore();
  const userModules = ref<string[]>([]);
  const isLoading = ref(false);

  // Check if a module is enabled for the current user's school
  const isModuleEnabled = (moduleCode: string): boolean => {
    // Super admin has access to all modules
    if (authStore.user?.role === "super_admin") {
      return true;
    }

    const enabled = userModules.value.includes(moduleCode);
    console.log(
      `🔍 Module check: ${moduleCode} -> ${enabled} (available: ${userModules.value.join(", ")})`
    );
    return enabled;
  };

  // Load user's enabled modules from their school's subscription plan
  const loadUserModules = async (forceRefresh = false) => {
    console.log("🔄 Loading user modules...", {
      forceRefresh,
      userRole: authStore.user?.role,
    });
    // Skip if already loading
    if (globalIsLoading && !forceRefresh) {
      isLoading.value = true;
      // Wait for the current loading to complete
      while (globalIsLoading) {
        await new Promise((resolve) => setTimeout(resolve, 100));
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
      const cached = sessionStorage.getItem("user-modules");
      const cachedTime = sessionStorage.getItem("user-modules-time");

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
      if (authStore.user?.role === "super_admin") {
        // Super admin has access to all modules - load all available modules
        const response = await Saas.getAvailableModules();
        if (response.success) {
          const allModules = response.data
            .filter((module: any) => module.is_active)
            .map((module: any) => module.key || module.code);

          globalUserModules = allModules;
          userModules.value = allModules;
          globalLastFetch = Date.now();

          // Cache in sessionStorage
          if (import.meta.client) {
            sessionStorage.setItem("user-modules", JSON.stringify(allModules));
            sessionStorage.setItem(
              "user-modules-time",
              globalLastFetch.toString()
            );
          }
        }
      } else {
        const schoolId = authStore.user?.school_id;

        if (!schoolId) {
          console.warn("No school ID found for user");
          globalUserModules = [];
          userModules.value = [];
          return;
        }

        const response = await Schools.getModules(schoolId);

        if (response.success) {
          const enabledModules = response.data.modules
            .filter((module: any) => module.enabled)
            .map((module: any) => module.key || module.code);

          globalUserModules = enabledModules;
          userModules.value = enabledModules;
          globalLastFetch = Date.now();

          console.log("✅ Modules loaded successfully:", enabledModules);
          console.log("🔍 Raw modules data:", response.data.modules);

          // Cache in sessionStorage
          if (import.meta.client) {
            sessionStorage.setItem(
              "user-modules",
              JSON.stringify(enabledModules)
            );
            sessionStorage.setItem(
              "user-modules-time",
              globalLastFetch.toString()
            );
          }
        }
      }
    } catch (error) {
      console.error("Error loading user modules:", error);
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
    if (authStore.user?.role === "super_admin") {
      return menuItems;
    }

    return menuItems
      .map((item) => {
        // Filter children first
        const children = item.children
          ? filterMenuByModules(item.children)
          : [];

        const hasChildren = children.length > 0;
        const moduleEnabled =
          !item.requiredModule || isModuleEnabled(item.requiredModule);

        // Keep parent if:
        // 1. Its module is enabled, OR
        // 2. At least one child survived
        if (moduleEnabled || hasChildren) {
          return {
            ...item,
            children,
          };
        }

        return null;
      })
      .filter(Boolean);
  };

  // Check if user can access a specific route/page
  const canAccessRoute = (routePath: string): boolean => {
    // Normalize route path (remove trailing slash for consistent matching)
    const normalizedPath = routePath.replace(/\/$/, "");

    // Define route-to-module mapping with normalized paths
    const routeModuleMap: Record<string, string> = {
      "/fees": "fees",
      "/fees/types": "fees",
      "/fees/structures": "fees",
      "/fees/invoices": "fees",
      "/fees/collections": "fees",
      "/reports/fees": "fees",
      "/reports/receipts": "fees",

      "/students": "students",
      "/students/form": "students",
      "/students/multiple-import": "students",
      "/reports/students": "students",

      "/attendance": "attendance",
      "/attendance/take": "attendance",
      "/attendance/bulk-import": "attendance",
      "/attendance/notify": "attendance",
      "/reports/attendance": "attendance",

      "/exams": "exams",
      "/exams/report-cards": "exams",
      "/reports/exams": "exams",
      "/academic/exam-types": "exams",
      "/academic/subjects": "exams",

      "/library": "library",
      "/reports/library": "library",

      "/hr": "hr",
      "/reports/hr": "hr",

      "/transport": "transport",
      "/reports/transport": "transport",

      "/reports": "reports",
      "/reports/advanced": "reports",

      // Module settings page removed - now handled through subscription plans
    };

    // Check for exact match first
    let requiredModule = routeModuleMap[normalizedPath];

    // If no exact match, check for prefix matches (for nested routes)
    if (!requiredModule) {
      // Find the longest matching prefix
      const matchingRoute = Object.keys(routeModuleMap)
        .filter((route) => normalizedPath.startsWith(route))
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
    return (
      globalUserModules.length > 0 &&
      Date.now() - globalLastFetch < CACHE_DURATION
    );
  };

  // Clear module cache (useful for logout or when subscription changes)
  const clearModuleCache = () => {
    globalUserModules = [];
    globalLastFetch = 0;
    userModules.value = [];
    if (import.meta.client) {
      sessionStorage.removeItem("user-modules");
      sessionStorage.removeItem("user-modules-time");
      sessionStorage.removeItem("modules-updated-at");
      sessionStorage.removeItem("modules-verified-this-session");
    }
  };

  // Refresh modules (useful when subscription changes)
  const refreshModules = async () => {
    clearModuleCache();
    await loadUserModules(true);
  };

  // Check if modules have been updated (called on route navigation)
  const checkModulesUpdated = async () => {
    if (!authStore.user?.school_id || authStore.user?.role === "super_admin")
      return;

    try {
      const response = await Schools.getModules(authStore.user.school_id);
      if (response.success) {
        const serverTimestamp = response.data.modules_updated_at;
        const cachedTimestamp = sessionStorage.getItem("modules-updated-at");

        console.log("🔍 Checking module updates:", {
          serverTimestamp,
          cachedTimestamp,
        });

        // If timestamp changed, clear cache and reload
        if (serverTimestamp !== cachedTimestamp) {
          console.log("🔄 Module cache invalidated - timestamp changed");
          clearModuleCache();
          sessionStorage.setItem("modules-updated-at", serverTimestamp);
          await loadUserModules(true);
        }
      }
    } catch (error) {
      console.error("Error checking module updates:", error);
    }
  };

  // Setup module change detection (check once per session)
  const setupModuleChangeListener = () => {
    if (!import.meta.client) return;

    // Check once when user first loads the app
    setTimeout(() => {
      if (authStore.isAuthenticated && authStore.user?.role !== "super_admin") {
        checkModulesUpdated();
      }
    }, 2000); // Wait 2 seconds after auth is ready
  };

  // Initialize modules from cache if available
  const initializeFromCache = () => {
    if (import.meta.client) {
      const cached = sessionStorage.getItem("user-modules");
      const cachedTime = sessionStorage.getItem("user-modules-time");

      console.log("🔧 Cache check:", { cached: !!cached, cachedTime });

      if (cached && cachedTime) {
        const cacheAge = Date.now() - parseInt(cachedTime);
        console.log(
          "🔧 Cache age:",
          cacheAge,
          "ms (limit:",
          CACHE_DURATION,
          "ms)"
        );

        if (cacheAge < CACHE_DURATION) {
          globalUserModules = JSON.parse(cached);
          globalLastFetch = parseInt(cachedTime);
          userModules.value = globalUserModules;
          console.log("🔧 Using cached modules:", globalUserModules);
          return true;
        } else {
          console.log("🔧 Cache expired");
        }
      } else {
        console.log("🔧 No cache found");
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
    checkModulesUpdated,
  };
}
