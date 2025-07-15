export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore();
  
  // Initialize auth state on app startup
  if (process.client) {
    // First, try to restore auth state from storage
    await authStore.initializeAuth();
    
    // Then, if we have a token but still no user, validate with server
    const authToken = useCookie('auth-token').value;
    if (authToken && !authStore.currentUser) {
      await authStore.checkAuth();
    }
  }
});
