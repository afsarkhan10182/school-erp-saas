import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side
  if (import.meta.server) return;

  const authStore = useAuthStore();

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password'
  ];
  const isPublicRoute = publicRoutes.includes(to.path);

  // INSTANT CHECK: Look for HTTP-only cookie presence (prevents flash on new tabs)
  const accessToken = useCookie('accessToken');
  const hasTokenCookie = !!accessToken.value;

  // Check if user is authenticated from store state
  const isAuthenticated = authStore.isLoggedIn && authStore.currentUser;

  // Debug logging for new tab scenarios
  if (import.meta.client) {
    console.log('🔒 Auth Middleware:', {
      path: to.path,
      hasTokenCookie,
      isAuthenticated,
      isInitializing: authStore.isInitializing,
      isPublicRoute
    });
  }

  // CASE 1: User is authenticated (via store or cookie) and trying to access login page
  if (to.path === '/auth/login' && (isAuthenticated || hasTokenCookie)) {
    console.log('🔒 Redirecting authenticated user from login to dashboard');
    return navigateTo('/dashboard');
  }

  // CASE 2: User has token cookie but store isn't initialized yet (new tab scenario)
  if (hasTokenCookie && !isAuthenticated && !authStore.isInitializing) {
    console.log('🔒 New tab detected - allowing navigation with background auth check');
    // Allow navigation immediately and verify auth in background
    nextTick(async () => {
      try {
        const isValid = await authStore.checkAuth();
        if (!isValid) {
          // Only redirect if we're not on a public route
          if (!isPublicRoute) {
            console.log('🔒 Background auth check failed - redirecting to login');
            await navigateTo('/auth/login');
          }
        } else {
          console.log('🔒 Background auth check successful');
        }
      } catch (error) {
        console.error('🔒 Background auth verification failed:', error);
        // Only redirect if we're not on a public route
        if (!isPublicRoute) {
          await navigateTo('/auth/login');
        }
      }
    });

    // Allow immediate navigation for all routes when we have a token
    return;
  }

  // CASE 3: User not authenticated and trying to access protected route
  if (!isAuthenticated && !isPublicRoute && !hasTokenCookie) {
    console.log('🔒 No auth - redirecting to login');
    // No token cookie and not authenticated - redirect to login immediately
    return navigateTo('/auth/login');
  }

  // CASE 4: User is authenticated and accessing any route (normal navigation)
  console.log('🔒 Authenticated user - allowing navigation');
  // No action needed - allow navigation
});
