export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore();
  
  // Initialize auth state on app startup (client-side only)
  if (import.meta.client) {
    console.log('🔧 Auth plugin: Starting...');
    
    // Always initialize auth on app startup
    await authStore.initializeAuth();
    
    console.log('🔧 Auth plugin: Initialization complete');
  }
});
