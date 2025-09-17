import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, LoginCredentials, AuthResponse } from '~/types';
import { Auth } from '~/api/shared/auth';
import { clearModuleCache } from '~/composables/useModuleAccess';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  lastAuthCheck: number;
  currentBranch: any | null;
  availableBranches: any[];
  currentSchool: any | null;
}

export const useAuthStore = defineStore('auth', () => {
  // State - Remove token storage from Pinia store
  const user = ref<User | null>(null);
  const isLoading = ref(false);
  const isInitializing = ref(true); // Will be set to false after initialization
  const lastAuthCheck = ref(0);
  const currentBranch = ref<any | null>(null);
  const availableBranches = ref<any[]>([]);
  const currentSchool = ref<any | null>(null);

  // Computed
  const isLoggedIn = computed(() => !!user.value);
  const isAuthenticated = computed(() => isLoggedIn.value);
  const userRole = computed(() => user.value?.role || null);
  const isSuperAdmin = computed(() => user.value?.role === 'super_admin');
  const isSchoolAdmin = computed(() => user.value?.role === 'school_admin');
  const isBranchAdmin = computed(() => user.value?.role === 'branch_admin');
  const currentUser = computed(() => user.value);

  // Helper function to clear all auth data
  const clearAuthData = () => {
    // Clear module access cache first
    clearModuleCache();

    if (import.meta.client) {
      // Clear user data from sessionStorage (for incognito isolation)
      sessionStorage.removeItem('auth-user');
      sessionStorage.removeItem('current-branch');
      sessionStorage.removeItem('current-school');
      sessionStorage.removeItem('last-auth-check');

      // Clear any theme or other auth-related data
      localStorage.removeItem('theme');
    }

    // Clear auth token cookies
    const accessToken = useCookie('accessToken');
    const refreshToken = useCookie('refreshToken');
    accessToken.value = null;
    refreshToken.value = null;
  };

  // Refresh auth state from storage (for cross-tab sync)
  const refreshFromStorage = () => {
    if (import.meta.client) {
      const savedUser = sessionStorage.getItem('auth-user');
      const savedBranch = sessionStorage.getItem('current-branch');
      const savedSchool = sessionStorage.getItem('current-school');

      if (savedUser) {
        user.value = JSON.parse(savedUser);
        currentBranch.value = savedBranch ? JSON.parse(savedBranch) : null;
        currentSchool.value = savedSchool ? JSON.parse(savedSchool) : null;
        lastAuthCheck.value = Date.now();
      } else {
        // No user data in storage, clear local state
        user.value = null;
        currentBranch.value = null;
        currentSchool.value = null;
        lastAuthCheck.value = 0;
      }
    }
  };

  // Initialize from localStorage - HTTP-only cookies cannot be read by JavaScript
  const initializeAuth = async () => {
    // Check if we're in browser environment
    if (import.meta.server) {
      isInitializing.value = false;
      return;
    }

    try {
      // Since we use HTTP-only cookies, we can't read the token directly
      // Instead, we check if we have user data in sessionStorage
      const savedUser = sessionStorage.getItem('auth-user');
      const savedBranch = sessionStorage.getItem('current-branch');
      const savedSchool = sessionStorage.getItem('current-school');

      if (savedUser) {
        // Set user data immediately
        user.value = JSON.parse(savedUser);
        currentBranch.value = savedBranch ? JSON.parse(savedBranch) : null;
        currentSchool.value = savedSchool ? JSON.parse(savedSchool) : null;

        // Background verification with server (non-blocking)
        setTimeout(async () => {
          try {
            // Skip verification on login page
            if (window.location.pathname === '/auth/login') {
              return;
            }

            const isValid = await Promise.race([
              checkAuth(),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Auth check timeout')), 5000)
              )
            ]);

            if (!isValid) {
              await silentLogout();

              // Redirect to login if not already there
              if (window.location.pathname !== '/auth/login') {
                await navigateTo('/auth/login');
              }
            }
          } catch (error) {
            // Keep cached data for better UX
          }
        }, 1000);
      } else {
        // No cached data - try to check with server
        try {
          const isValid = await checkAuth();
          if (!isValid) {
            user.value = null;
            currentBranch.value = null;
            currentSchool.value = null;
          }
        } catch (error) {
          user.value = null;
          currentBranch.value = null;
          currentSchool.value = null;
        }
      }
    } catch (error) {
      console.error('❌ Error during auth initialization:', error);
      user.value = null;
      currentBranch.value = null;
      currentSchool.value = null;
    } finally {
      // Set initialization to false immediately for better hydration consistency
      isInitializing.value = false;
    }
  };

  // Login
  const login = async (
    credentials: LoginCredentials
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      isLoading.value = true;

      const response = await Auth.login(credentials);

      if (response.success) {
        const { user: userData } = response.data;

        // Set user data immediately
        user.value = userData;

        // Set current school and branch based on user role
        if (userData.school_id) {
          currentSchool.value = {
            id: userData.school_id,
            name: userData.school?.name || userData.school_name,
            code: userData.school?.code || userData.school_code,
            logo: userData.school?.logo || ''
          };
        }

        if (userData.branch_id) {
          currentBranch.value = {
            id: userData.branch_id,
            name: userData.branch?.name || userData.branch_name,
            code: userData.branch?.code || userData.branch_code
          };
        }

        // Save user data to sessionStorage (tokens are handled by secure cookies)
        if (import.meta.client) {
          sessionStorage.setItem('auth-user', JSON.stringify(userData));
          if (currentSchool.value) {
            sessionStorage.setItem('current-school', JSON.stringify(currentSchool.value));
          }
          if (currentBranch.value) {
            sessionStorage.setItem('current-branch', JSON.stringify(currentBranch.value));
          }

          // Signal other tabs about successful login
          sessionStorage.setItem('auth-action', 'login');
          setTimeout(() => {
            sessionStorage.removeItem('auth-action');
          }, 100);
        }

        lastAuthCheck.value = Date.now();

        // Brief wait for cookies to be set
        if (import.meta.client) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Force refresh module cache after login to ensure fresh data
        if (import.meta.client) {
          // Clear any stale module cache and force refresh
          clearModuleCache();

          // Trigger module loading after login
          setTimeout(() => {
            const { loadUserModules } = useModuleAccess();
            loadUserModules(true).catch(error => {
              console.warn('Failed to load modules after login:', error);
            });
          }, 500); // Small delay to ensure auth state is ready
        }

        // Ensure initialization is complete
        isInitializing.value = false;

        return { success: true, user: userData };
      } else {
        return { success: false, error: response.message };
      }
    } catch (error: any) {
      console.error('🔐 Login error:', error);

      // Handle specific error cases
      if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Invalid email or password. Please check your credentials and try again.'
        };
      } else if (error.response?.status === 429) {
        return {
          success: false,
          error: 'Too many login attempts. Please wait a moment before trying again.'
        };
      } else if (error.response?.status >= 500) {
        return {
          success: false,
          error: 'Server error. Please try again later.'
        };
      } else if (!error.response) {
        return {
          success: false,
          error: 'Network error. Please check your connection and try again.'
        };
      }

      return {
        success: false,
        error: error.response?.data?.message || 'Login failed. Please try again.'
      };
    } finally {
      isLoading.value = false;
    }
  };

  // Logout with debounce to prevent multiple calls
  let logoutInProgress = false;

  const logout = async () => {
    // Prevent multiple logout calls
    if (logoutInProgress) {
      return;
    }

    logoutInProgress = true;

    try {
      // Call logout endpoint to invalidate tokens on server
      await Auth.logout();
    } catch (error: any) {
      // Handle specific error cases
      if (error.response?.status === 401 || error.response?.status === 403) {
        // User already logged out or token expired - continuing with local cleanup
      }

      // Even if the server logout fails, we should still clear local state
      // This handles cases where the token is expired/invalid
    } finally {
      // Always clear all auth data regardless of server response
      user.value = null;
      currentBranch.value = null;
      currentSchool.value = null;
      availableBranches.value = [];
      lastAuthCheck.value = 0;

      // Clear module cache
      if (import.meta.client) {
        const { clearModuleCache } = useModuleAccess();
        clearModuleCache();
      }

      // Clear localStorage and cookies
      clearAuthData();

      // Signal other tabs about logout (before navigation)
      if (import.meta.client) {
        sessionStorage.setItem('auth-action', 'logout');
        setTimeout(() => {
          sessionStorage.removeItem('auth-action');
        }, 100);
      }

      // Force redirect to login page to ensure clean state
      if (import.meta.client) {
        await navigateTo('/auth/login');
      }

      // Reset logout flag after a delay
      setTimeout(() => {
        logoutInProgress = false;
      }, 1000);
    }
  };

  // Silent logout - clears auth state without navigation (for background checks)
  const silentLogout = async () => {
    try {
      // Call logout endpoint to invalidate tokens on server
      await Auth.logout();
    } catch (error: any) {
      // Handle specific error cases silently
      if (error.response?.status === 401 || error.response?.status === 403) {
        // User already logged out or token expired - continuing with local cleanup
      }
      // Even if the server logout fails, we should still clear local state
    } finally {
      // Always clear all auth data regardless of server response
      user.value = null;
      currentBranch.value = null;
      currentSchool.value = null;
      availableBranches.value = [];
      lastAuthCheck.value = 0;

      // Clear module cache
      if (import.meta.client) {
        const { clearModuleCache } = useModuleAccess();
        clearModuleCache();
      }

      // Clear localStorage and cookies (this will also clear the refresh timer)
      clearAuthData();

      // Signal other tabs about logout (without navigation)
      if (import.meta.client) {
        sessionStorage.setItem('auth-action', 'logout');
        setTimeout(() => {
          sessionStorage.removeItem('auth-action');
        }, 100);
      }
    }
  };

  // Check authentication
  const checkAuth = async (): Promise<boolean> => {
    try {
      const response = await Auth.me();
      if (response.success && response.data) {
        user.value = response.data;
        lastAuthCheck.value = Date.now();

        // Update sessionStorage
        if (import.meta.client) {
          sessionStorage.setItem('auth-user', JSON.stringify(response.data));
        }
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('❌ Auth check error:', error);
      return false;
    }
  };

  // Update user data
  const updateUser = (userData: Partial<User>) => {
    if (user.value) {
      user.value = { ...user.value, ...userData };
      if (import.meta.client) {
        sessionStorage.setItem('auth-user', JSON.stringify(user.value));
      }
    }
  };

  // Branch management
  const setCurrentBranch = (branch: any) => {
    currentBranch.value = branch;
    if (import.meta.client) {
      sessionStorage.setItem('current-branch', JSON.stringify(branch));
    }
  };

  const setAvailableBranches = (branches: any[]) => {
    availableBranches.value = branches;
  };

  const switchBranch = async (branchId: string) => {
    const branch = availableBranches.value.find(b => b.id === branchId);
    if (branch) {
      setCurrentBranch(branch);
      // You might want to refresh some data here based on the new branch context
      return true;
    }
    return false;
  };

  // School management
  const setCurrentSchool = (school: any) => {
    currentSchool.value = school;
    if (import.meta.client) {
      sessionStorage.setItem('current-school', JSON.stringify(school));
    }
  };

  // Invalidate auth cache
  const invalidateAuthCache = () => {
    lastAuthCheck.value = 0;
  };

  // Cross-tab synchronization using storage events
  const handleStorageChange = (event: StorageEvent) => {
    if (!event.key?.startsWith('auth-') && event.key !== 'auth-action') return;

    // Handle auth action events (login/logout from other tabs)
    if (event.key === 'auth-action') {
      const action = event.newValue;

      if (action === 'logout') {
        // Clear local state immediately without calling server logout
        user.value = null;
        currentBranch.value = null;
        currentSchool.value = null;
        availableBranches.value = [];
        lastAuthCheck.value = 0;

        // Clear module cache
        const { clearModuleCache } = useModuleAccess();
        clearModuleCache();

        // Clear cookies
        const accessToken = useCookie('accessToken');
        const refreshToken = useCookie('refreshToken');
        accessToken.value = null;
        refreshToken.value = null;

        // Navigate to login if not already there
        if (window.location.pathname !== '/auth/login') {
          navigateTo('/auth/login');
        }
      } else if (action === 'login') {
        // Refresh auth state from sessionStorage
        refreshFromStorage();

        // Navigate to dashboard if on login page
        if (window.location.pathname === '/auth/login') {
          navigateTo('/dashboard');
        }
      }

      // Clean up the action flag
      setTimeout(() => {
        sessionStorage.removeItem('auth-action');
      }, 100);
    }

    // Handle direct sessionStorage changes
    else if (event.key === 'auth-user') {
      if (event.newValue === null) {
        // User data was cleared in another tab
        if (user.value) {
          user.value = null;
          currentBranch.value = null;
          currentSchool.value = null;
          availableBranches.value = [];
          lastAuthCheck.value = 0;
        }
      } else if (event.newValue && !user.value) {
        // User data was set in another tab
        const userData = JSON.parse(event.newValue);
        user.value = userData;
        lastAuthCheck.value = Date.now();
      }
    }
  };

  // Initialize storage event listener on client side
  if (import.meta.client) {
    // Add storage event listener for cross-tab sync
    window.addEventListener('storage', handleStorageChange);

    // Initialize auth
    initializeAuth();
  }

  // Cleanup function for storage event listener
  const cleanup = () => {
    if (import.meta.client) {
      window.removeEventListener('storage', handleStorageChange);
    }
  };

  return {
    // State
    user,
    isLoading,
    isInitializing,
    lastAuthCheck,
    currentBranch,
    availableBranches,
    currentSchool,

    // Computed
    isLoggedIn,
    isAuthenticated,
    userRole,
    isSuperAdmin,
    isSchoolAdmin,
    isBranchAdmin,
    currentUser,

    // Actions
    login,
    logout,
    silentLogout,
    checkAuth,
    updateUser,
    setCurrentBranch,
    setAvailableBranches,
    switchBranch,
    setCurrentSchool,
    invalidateAuthCache,
    initializeAuth,
    clearAuthData,
    refreshFromStorage,
    cleanup
  };
});
