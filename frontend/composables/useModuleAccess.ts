import { ref, computed } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { apiClient } from '~/utils/api';

export function useModuleAccess() {
  const authStore = useAuthStore();
  const userModules = ref<string[]>([]);
  const isLoading = ref(false);

  // Check if a module is enabled for the current user's school
  const isModuleEnabled = (moduleCode: string): boolean => {
    // Super admin has access to all modules
    if (authStore.user?.role === 'super_admin') {
      return true;
    }
    
    return userModules.value.includes(moduleCode);
  };

  // Load user's enabled modules from their school's subscription plan
  const loadUserModules = async () => {
    if (authStore.user?.role === 'super_admin') {
      // Super admin has access to all modules - load all available modules
      try {
        isLoading.value = true;
        const response = await apiClient.saas.getAvailableModules();
        if (response.success) {
          const allModules = response.data
            .filter((module: any) => module.is_active)
            .map((module: any) => module.key || module.code);
          userModules.value = allModules;
        }
      } catch (error) {
        console.error('Error loading modules for super admin:', error);
        userModules.value = [];
      } finally {
        isLoading.value = false;
      }
      return;
    }

    try {
      isLoading.value = true;
      const schoolId = authStore.user?.school_id;
      
      if (!schoolId) {
        console.warn('No school ID found for user');
        return;
      }

      const response = await apiClient.schools.getModules(schoolId);
      
      if (response.success) {
        const enabledModules = response.data.modules
          .filter((module: any) => module.enabled)
          .map((module: any) => module.key || module.code);
        
        userModules.value = enabledModules;
      }
    } catch (error) {
      console.error('Error loading user modules:', error);
      // Fallback: allow access if module loading fails
      userModules.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  // Filter menu items based on module access
  const filterMenuByModules = (menuItems: any[]): any[] => {
    // Super admin: return everything as-is
    if (authStore.user?.role === 'super_admin') {
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
    // Define route-to-module mapping
    const routeModuleMap: Record<string, string> = {
      '/fees': 'fees',
      '/fees/types': 'fees',
      '/fees/structures': 'fees',
      '/fees/invoices': 'fees',
      '/fees/collections': 'fees',
      '/reports/fees': 'fees',
      '/reports/receipts': 'fees',
      
      '/students': 'students',
      '/students/form': 'students',
      '/students/multiple-import': 'students',
      '/reports/students': 'students',
      
      '/attendance': 'attendance',
      '/attendance/take': 'attendance',
      '/attendance/bulk-import': 'attendance',
      '/attendance/notify': 'attendance',
      '/reports/attendance': 'attendance',
      
      '/academic/exams': 'exams',
      '/reports/exams': 'exams',
      
      '/library': 'library',
      '/reports/library': 'library',
      
      '/hr': 'hr',
      '/reports/hr': 'hr',
      
      '/transport': 'transport',
      '/reports/transport': 'transport',
      
      '/reports': 'reports',
      '/reports/advanced': 'reports',
      
      '/settings/modules': 'settings',
    };

    const requiredModule = routeModuleMap[routePath];
    
    if (!requiredModule) {
      // If no module requirement defined, allow access
      return true;
    }

    return isModuleEnabled(requiredModule);
  };

  return {
    userModules,
    isLoading,
    isModuleEnabled,
    loadUserModules,
    filterMenuByModules,
    canAccessRoute
  };
}
