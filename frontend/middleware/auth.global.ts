import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware(async (to) => {
  // Only run on client
  if (process.server) return;
  
  // Skip auth check for login page
  if (to.path === '/login') return;
  
  const authStore = useAuthStore();
  
  // Check if user is authenticated
  if (!authStore.isLoggedIn) {
    const isAuthenticated = await authStore.checkAuth();
    if (!isAuthenticated) {
      return navigateTo('/login');
    }
  }
}); 