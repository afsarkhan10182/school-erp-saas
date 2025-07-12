import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client
  if (process.server) return;

  const authStore = useAuthStore();
  const isLogin = to.path === '/login';

  // If already authenticated and trying to access login, redirect to dashboard
  if (authStore.isLoggedIn && isLogin) {
    return navigateTo('/dashboard');
  }

  // If not authenticated and not on login page, check auth
  if (!authStore.isLoggedIn && !isLogin) {
    const isAuthenticated = await authStore.checkAuth();
    if (!isAuthenticated) {
      return navigateTo('/login');
    }
  }
}); 