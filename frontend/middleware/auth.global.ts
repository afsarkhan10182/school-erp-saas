export default defineNuxtRouteMiddleware((to, from) => {
  // Only run on client
  if (process.server) return;

  const token = localStorage.getItem('auth-token');
  const isLogin = to.path === '/login';

  if (!token && !isLogin) {
    // Not logged in, trying to access a protected route
    return navigateTo('/login');
  }
  if (token && isLogin) {
    // Already logged in, trying to access login page
    return navigateTo('/dashboard');
  }
}); 