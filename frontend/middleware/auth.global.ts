import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side
  if (import.meta.server) return;
  
  const authStore = useAuthStore();

  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
  const isPublicRoute = publicRoutes.includes(to.path);
  
  // INSTANT CHECK: Look for HTTP-only cookie presence (prevents flash on new tabs)
  const accessToken = useCookie('accessToken');
  const hasTokenCookie = !!accessToken.value;
  
  // Check if user is authenticated from store state
  const isAuthenticated = authStore.isLoggedIn && authStore.currentUser;
  
  // CASE 1: User is authenticated (via store or cookie) and trying to access login page
  if (to.path === '/login' && (isAuthenticated || hasTokenCookie)) {
    console.log('🔄 User already authenticated, redirecting to dashboard');
    return navigateTo('/dashboard');
  }
  
  // CASE 2: User not authenticated and trying to access protected route
  if (!isAuthenticated && !isPublicRoute) {
    // If we have a token cookie but store isn't initialized, allow navigation
    // and let the store initialize in the background
    if (hasTokenCookie) {
      console.log('🔑 Token cookie found, allowing navigation and verifying in background');
      
      // Trigger async auth verification in background (non-blocking)
      nextTick(async () => {
        try {
          const isValid = await authStore.checkAuth();
          if (!isValid) {
            console.log('🔒 Background auth check failed, redirecting to login');
            await navigateTo('/login');
          }
        } catch (error) {
          console.error('🔒 Background auth check error:', error);
          await navigateTo('/login');
        }
      });
      
      // Allow immediate navigation
      return;
    }
    
    // No token cookie and not authenticated - redirect to login immediately
    console.log('🔒 No authentication found, redirecting to login');
    return navigateTo('/login');
  }
  
  // For all other cases, if we have a cookie but store isn't fully initialized,
  // trigger background verification without blocking navigation
  if (hasTokenCookie && !isAuthenticated && !authStore.isInitializing) {
    nextTick(async () => {
      try {
        await authStore.checkAuth();
      } catch (error) {
        console.error('🔒 Background auth verification failed:', error);
      }
    });
  }
});
