import { useAuthStore } from '~/stores/auth';
import { homePathForRole } from '~/utils/home-path';

export { homePathForRole };

export const useAuth = () => {
  const authStore = useAuthStore();

  const login = async (
    credentials: { email: string; password: string; rememberMe?: boolean },
    redirectTo?: string
  ) => {
    try {
      const result = await authStore.login(credentials);

      if (result.success) {
        // Wait a moment for auth state to be fully set
        await nextTick();

        // Determine redirect destination with priority:
        // 1. Explicit redirectTo parameter (from query string)
        // 2. Post-logout redirect (saved before logout)
        // 3. Role home (portal for student/parent)
        let destination = redirectTo;

        if (!destination && import.meta.client) {
          const savedRedirect = sessionStorage.getItem('post-logout-redirect');
          if (savedRedirect) {
            destination = savedRedirect;
            // Clear saved redirect after use
            sessionStorage.removeItem('post-logout-redirect');
          }
        }

        const role = authStore.userRole || authStore.currentUser?.role;
        destination = destination || homePathForRole(role);
        await navigateTo(destination, { replace: true });
        return result;
      } else {
        return result;
      }
    } catch (error) {
      return {
        success: false,
        error: 'An unexpected error occurred during login.'
      };
    }
  };

  const logout = async () => {
    try {
      // Save current route before logout for post-login redirect
      if (import.meta.client) {
        const route = useRoute();
        const currentPath = route.fullPath;
        // Only save if not already on login page or root path
        if (currentPath !== '/auth/login' && currentPath !== '/') {
          sessionStorage.setItem('post-logout-redirect', currentPath);
        }
      }
      
      await authStore.logout();
      await navigateTo('/auth/login');
    } catch (error) {
      // Force redirect even if logout fails
      await navigateTo('/auth/login');
    }
  };

  const checkAuth = async () => {
    return await authStore.checkAuth();
  };

  const requireAuth = async () => {
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      await navigateTo('/auth/login');
      return false;
    }
    return true;
  };

  const requireRole = async (allowedRoles: string[]) => {
    const isAuthenticated = await requireAuth();
    if (!isAuthenticated) return false;

    const userRole = authStore.userRole;
    if (!userRole || !allowedRoles.includes(userRole)) {
      await navigateTo('/unauthorized');
      return false;
    }

    return true;
  };

  return {
    // State
    user: computed(() => authStore.currentUser),
    isLoggedIn: computed(() => authStore.isLoggedIn),
    isLoading: computed(() => authStore.isLoading),
    userRole: computed(() => authStore.userRole),
    currentSchool: computed(() => authStore.currentSchool),

    // Role checks
    isSuperAdmin: computed(() => authStore.isSuperAdmin),
    isAdmin: computed(() => authStore.isAdmin),
    isBranchAdmin: computed(() => authStore.isBranchAdmin),

    // Actions
    login,
    logout,
    checkAuth,
    requireAuth,
    requireRole,

    // Store actions
    updateUser: authStore.updateUser
  };
};
