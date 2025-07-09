import { useAuthStore } from '~/stores/auth';

export const useAuth = () => {
  const authStore = useAuthStore();
  const router = useRouter();

  const login = async (credentials: { email: string; password: string }) => {
    const result = await authStore.login(credentials);
    
    if (result.success) {
      // Redirect based on user role
      const role = result.user?.role;
      if (role === 'super_admin') {
        await router.push('/dashboard');
      } else if (role === 'school_admin') {
        await router.push('/school/dashboard');
      } else {
        await router.push('/dashboard');
      }
    }
    
    return result;
  };

  const logout = async () => {
    await authStore.logout();
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