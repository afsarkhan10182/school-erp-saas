import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware((to) => {
  // Only run on client
  if (process.server) return;
  
  // Skip auth check for login page and public routes
  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
  if (publicRoutes.includes(to.path)) {
    return;
  }
  
  const authStore = useAuthStore();
  
  // Instant check - no async, no waiting
  if (!authStore.isLoggedIn) {
    // Only redirect if not already on login page
    if (to.path !== '/login') {
      return navigateTo('/login');
    }
  }
}); 