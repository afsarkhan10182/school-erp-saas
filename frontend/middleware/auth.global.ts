import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side
  if (import.meta.server) return;
  
  const authStore = useAuthStore();

  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
  const isPublicRoute = publicRoutes.includes(to.path);
  
  // Skip middleware if auth is still initializing (prevents race conditions)
  if (authStore.isInitializing) {
    return;
  }

  // Check if user is authenticated (we can't check HTTP-only cookies directly)
  const isAuthenticated = authStore.isLoggedIn && authStore.currentUser;
  
  // CASE 1: User is authenticated and trying to access login page
  if (to.path === '/login' && isAuthenticated) {
    console.log('🔄 User already authenticated, redirecting to dashboard');
    return navigateTo('/dashboard');
  }
  
  // CASE 2: User not authenticated and trying to access protected route
  if (!isAuthenticated && !isPublicRoute) {
    // Try to check with server first (maybe they have a valid session)
    try {
      const serverAuth = await authStore.checkAuth();
      if (!serverAuth) {
        console.log('🔒 No valid authentication, redirecting to login');
        return navigateTo('/login');
      }
      // If server auth successful, allow navigation to continue
    } catch (error) {
      console.log('🔒 Auth check failed, redirecting to login');
      return navigateTo('/login');
    }
  }
});
