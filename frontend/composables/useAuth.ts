import { useAuthStore } from '~/stores/auth';

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

        // Redirect to intended destination or dashboard - use replace to prevent back navigation
        const destination = redirectTo || '/dashboard';
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
