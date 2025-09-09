export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore();

  // Initialize auth state on app startup (client-side only)
  if (import.meta.client) {
    // Always initialize auth on app startup
    await authStore.initializeAuth();
  }
});
