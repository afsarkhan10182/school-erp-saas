import { useAuthStore } from '~/stores/auth';

export const useAuth = () => {
  const authStore = useAuthStore();

  const login = async (credentials: { email: string; password: string }) => {
    try {
      console.log('🚀 Starting login process...');
      const result = await authStore.login(credentials);
      
      if (result.success) {
        console.log('🚀 Login successful, checking auth state...');
        
        // Wait a moment for auth state to be fully set
        await nextTick();
        
        // Debug: Check auth state before navigation
        console.log('🚀 About to navigate:', { 
          isLoggedIn: authStore.isLoggedIn,
          user: !!authStore.currentUser
        });
        
        // Force redirect to dashboard - use replace to prevent back navigation
        console.log('🚀 Navigating to dashboard...');
        await navigateTo('/dashboard', { replace: true });
        return result;
      } else {
        console.log('❌ Login failed:', result.error);
        return result;
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return { 
        success: false, 
        error: 'An unexpected error occurred during login.' 
      };
    }
  };

  const logout = async () => {
    try {
      await authStore.logout();
      await navigateTo('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      await navigateTo('/login');
    }
  };

  const checkAuth = async () => {
    return await authStore.checkAuth();
  };

  const requireAuth = async () => {
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      await navigateTo('/login');
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