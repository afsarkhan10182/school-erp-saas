export default defineEventHandler((event) => {
  // Only run on server side
  if (import.meta.client) return;

  const userAgent = getHeader(event, 'user-agent') || '';
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  // Set mobile detection in event context
  event.context.isMobile = isMobile;
  
  // Also set as a cookie for client-side access
  setCookie(event, 'is-mobile', isMobile.toString(), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 3600 // 1 hour
  });
}); 