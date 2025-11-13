import { useAuth } from '~/composables/useAuth';

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side
  if (import.meta.server) return;

  const { isLoggedIn, user } = useAuth();

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
  const isAuthenticated = isLoggedIn.value && user.value;

  // CASE 1: User is authenticated (via store or cookie) and trying to access login page
  if (to.path === '/auth/login' && (isAuthenticated || hasTokenCookie)) {
    return navigateTo('/dashboard');
  }

  // CASE 2: User has token cookie but store isn't initialized yet (new tab scenario)
  if (hasTokenCookie && !isAuthenticated) {
    // Allow navigation immediately and verify auth in background
    nextTick(async () => {
      try {
        // Auth verification is handled by the composable
        const isValid = isLoggedIn.value;
        if (!isValid) {
          // Only redirect if we're not on a public route
          if (!isPublicRoute) {
            await navigateTo('/auth/login');
          }
        } else {
          // Background auth check successful
        }
      } catch (error) {
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
    // No token cookie and not authenticated - redirect to login
    // Only add redirect parameter if not coming from root path
    if (to.path === '/' || to.fullPath === '/') {
      return navigateTo('/auth/login');
    }
    // For other protected routes, include redirect parameter to return after login
    return navigateTo(`/auth/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }
});
