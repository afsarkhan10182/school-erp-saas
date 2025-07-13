import { useAuthStore } from '~/stores/auth';

export const useAuth = () => {
  const authStore = useAuthStore();
  const router = useRouter();

  const login = async (credentials: { email: string; password: string }) => {
    try {
      
      const result = await authStore.login(credentials);
      
      if (result.success) {
        // Wait a moment for the store to update
        await new Promise(resolve => setTimeout(resolve, 100));
        // Redirect to dashboard
        await router.push('/dashboard');
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
      await router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      await router.push('/login');
    }
  };

  const checkAuth = async () => {
    return await authStore.checkAuth();
  };

  const requireAuth = async () => {
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      await router.push('/login');
      return false;
    }
    return true;
  };

  const requireRole = async (allowedRoles: string[]) => {
    const isAuthenticated = await requireAuth();
    if (!isAuthenticated) return false;
    
    const userRole = authStore.userRole;
    if (!userRole || !allowedRoles.includes(userRole)) {
      await router.push('/unauthorized');
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
    
    // Role checks
    isSuperAdmin: computed(() => authStore.isSuperAdmin),
    isSchoolAdmin: computed(() => authStore.isSchoolAdmin),
    isBranchAdmin: computed(() => authStore.isBranchAdmin),
    
    // Actions
    login,
    logout,
    checkAuth,
    requireAuth,
    requireRole,
    
    // Store actions
    updateUser: authStore.updateUser,
  };
}; 