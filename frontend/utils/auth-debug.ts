// Utility to monitor and debug auth API calls
let authCallCount = 0;
let lastAuthCall = 0;

export const authDebug = {
  logCall: (endpoint: string) => {
    authCallCount++;
    const now = Date.now();
    const timeSinceLastCall = now - lastAuthCall;
    lastAuthCall = now;
    
    console.log(`🔐 Auth API Call #${authCallCount}: ${endpoint} (${timeSinceLastCall}ms since last call)`);
  },
  
  getStats: () => ({
    totalCalls: authCallCount,
    lastCall: lastAuthCall,
    timeSinceLastCall: Date.now() - lastAuthCall
  }),
  
  reset: () => {
    authCallCount = 0;
    lastAuthCall = 0;
  }
}; 