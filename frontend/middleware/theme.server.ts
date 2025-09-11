export default defineEventHandler(event => {
  // Only run on server side
  if (import.meta.client) return;

  // Get theme from cookie or default to dark
  const theme = getCookie(event, 'theme') || 'dark';

  // Set theme in event context for SSR
  event.context.theme = theme;

  // Also inject into runtime config for global access
  const config = useRuntimeConfig();
  config.public.theme = theme;
});
