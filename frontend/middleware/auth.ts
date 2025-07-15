import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware(async (to) => {
  // Only run on client
  if (process.server) return;
  
  const authStore = useAuthStore();
  
  // Check if user is authenticated
  if (!authStore.isLoggedIn) {
    const isAuthenticated = await authStore.checkAuth();
    if (!isAuthenticated) {
      return navigateTo('/login');
    }
  }
  
  // Check role-based access for specific routes
  const userRole = authStore.user?.role;
  
  // Academic years - only super admin and school admin
  if (to.path === '/academic/years' && userRole && !['super_admin', 'school_admin'].includes(userRole)) {
    return navigateTo('/dashboard');
  }
  
  // Super admin only routes
  const superAdminOnlyRoutes = [
    '/subscriptions/schools',
    '/subscriptions/plans',
    '/users'
  ];
  
  if (superAdminOnlyRoutes.some(route => to.path.startsWith(route)) && userRole !== 'super_admin') {
    return navigateTo('/dashboard');
  }
}); 