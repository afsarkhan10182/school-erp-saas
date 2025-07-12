export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore();
  
  // Initialize auth state on app startup
  // This will check auth once when the app loads, reducing subsequent calls
  if (process.client) {
    // Only check if we have a token but no user data
    const authToken = useCookie('auth-token').value;
    if (authToken && !authStore.user) {
      await authStore.checkAuth();
    }
  }
}); 