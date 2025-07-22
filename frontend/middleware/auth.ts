import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware((to) => {
  // Only run on client
  if (import.meta.server) return;
  
  const authStore = useAuthStore();
  const token = useCookie('accessToken').value;
  
  // Instant check - no async, no waiting
  if (!authStore.isLoggedIn && !token) {
    return navigateTo('/login');
  }
  
  // Check role-based access for specific routes
  const userRole = authStore.user?.role;
  
  // Academic years - only super admin and school admin
  if (to.path === '/academic/years' && userRole && !['super_admin', 'school_admin'].includes(userRole)) {
    return navigateTo('/dashboard');
  }
  
  // Super admin only routes
  const superAdminOnlyRoutes = [
    '/subscriptions',
    '/branches'
  ];
  
  // Routes accessible by both Super Admin and School Admin
  const adminRoutes = [
    '/users'
  ];
  
  // Check super admin only routes
  if (superAdminOnlyRoutes.some(route => to.path.startsWith(route)) && userRole && userRole !== 'super_admin') {
    return navigateTo('/dashboard');
  }
  
  // Check admin routes (Super Admin and School Admin)
  if (adminRoutes.some(route => to.path.startsWith(route)) && userRole && !['super_admin', 'school_admin'].includes(userRole)) {
    return navigateTo('/dashboard');
  }
}); 