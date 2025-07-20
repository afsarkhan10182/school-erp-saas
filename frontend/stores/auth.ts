import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, LoginCredentials, AuthResponse } from '~/types';
import { apiClient } from '~/utils/api';

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
    if (import.meta.client) {
      // Clear user data from localStorage
      localStorage.removeItem('auth-user');
      localStorage.removeItem('current-branch');
      localStorage.removeItem('current-school');
      localStorage.removeItem('last-auth-check');
      
      // Clear any theme or other auth-related data
      localStorage.removeItem('theme');
    }
    
    // Clear auth token cookies
    const accessToken = useCookie('accessToken');
    const refreshToken = useCookie('refreshToken');
    accessToken.value = null;
    refreshToken.value = null;
  };

  // Initialize from localStorage - HTTP-only cookies cannot be read by JavaScript
  const initializeAuth = async () => {
    // Check if we're in browser environment
    if (import.meta.server) {
      isInitializing.value = false;
      return;
    }
    
    console.log('🔧 Starting auth initialization...');
    
    try {
      // Since we use HTTP-only cookies, we can't read the token directly
      // Instead, we check if we have user data in localStorage
      const savedUser = localStorage.getItem('auth-user');
      const savedBranch = localStorage.getItem('current-branch');
      const savedSchool = localStorage.getItem('current-school');

      if (savedUser) {
        console.log('🔧 Found cached user data, loading immediately');
        // Set user data immediately
        user.value = JSON.parse(savedUser);
        currentBranch.value = savedBranch ? JSON.parse(savedBranch) : null;
        currentSchool.value = savedSchool ? JSON.parse(savedSchool) : null;
        isInitializing.value = false;
        
        // Background verification with server (non-blocking)
        setTimeout(async () => {
          try {
            // Skip verification on login page
            if (window.location.pathname === '/login') {
              return;
            }
            
            const isValid = await Promise.race([
              checkAuth(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Auth check timeout')), 5000)
              )
            ]);
            
            if (!isValid) {
              console.log('❌ Background verification failed - clearing auth');
              user.value = null;
              currentBranch.value = null;
              currentSchool.value = null;
              clearAuthData();
              
              // Redirect to login if not already there
              if (window.location.pathname !== '/login') {
                await navigateTo('/login');
              }
            } else {
              console.log('✅ Background verification successful');
            }
          } catch (error) {
            console.log('⚠️ Background verification timeout - keeping cached data');
            // Keep cached data for better UX
          }
        }, 1000);
      } else {
        console.log('🔧 No cached user data - trying server check');
        // No cached data - try to check with server
        try {
          const isValid = await checkAuth();
          if (!isValid) {
            console.log('❌ No valid session found');
            user.value = null;
            currentBranch.value = null;
            currentSchool.value = null;
          }
        } catch (error) {
          console.log('❌ Server check failed:', error);
          user.value = null;
          currentBranch.value = null;
          currentSchool.value = null;
        } finally {
          isInitializing.value = false;
        }
      }
    } catch (error) {
      console.error('❌ Error during auth initialization:', error);
      user.value = null;
      currentBranch.value = null;
      currentSchool.value = null;
      isInitializing.value = false;
    }
    
    console.log('🔧 Auth initialization complete:', {
      isLoggedIn: isLoggedIn.value,
      user: !!user.value,
      isInitializing: isInitializing.value
    });
  };



  // Login
  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      isLoading.value = true;
      
      const response = await apiClient.auth.login(credentials);
      
      if (response.success) {
        const { user: userData } = response.data;
        
        // Set user data immediately
        user.value = userData;
        
        // Set current school and branch based on user role
        if (userData.school_id) {
          currentSchool.value = { id: userData.school_id, name: userData.school_name };
        }
        
        if (userData.branch_id) {
          currentBranch.value = { id: userData.branch_id, name: userData.branch_name };
        }
        
        // Save user data to localStorage (tokens are handled by secure cookies)
        if (import.meta.client) {
          localStorage.setItem('auth-user', JSON.stringify(userData));
          if (currentSchool.value) {
            localStorage.setItem('current-school', JSON.stringify(currentSchool.value));
          }
          if (currentBranch.value) {
            localStorage.setItem('current-branch', JSON.stringify(currentBranch.value));
          }
          
          // Signal other tabs about successful login
          localStorage.setItem('auth-action', 'login');
          setTimeout(() => {
            localStorage.removeItem('auth-action');
          }, 100);
        }
        
        lastAuthCheck.value = Date.now();
        
        // Brief wait for cookies to be set
        if (import.meta.client) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Debug: Check if user is set
        const accessToken = useCookie('accessToken').value;
        console.log('🔐 Login successful:', { 
          user: user.value, 
          isLoggedIn: isLoggedIn.value,
          token: !!accessToken,
          tokenValue: accessToken ? accessToken.substring(0, 20) + '...' : null
        });
        
        // Ensure initialization is complete
        isInitializing.value = false;
        
        console.log('🔐 Login completed successfully, ready for navigation');
        
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
      await apiClient.auth.logout();
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
      
      // Clear localStorage and cookies
      clearAuthData();
      
      // Signal other tabs about logout (before navigation)
      if (import.meta.client) {
        localStorage.setItem('auth-action', 'logout');
        setTimeout(() => {
          localStorage.removeItem('auth-action');
        }, 100);
      }
      
      // Force redirect to login page to ensure clean state
      if (import.meta.client) {
        await navigateTo('/login');
      }
      
      // Reset logout flag after a delay
      setTimeout(() => {
        logoutInProgress = false;
      }, 1000);
    }
  };

  // Check authentication
  const checkAuth = async (): Promise<boolean> => {
    try {
      console.log('🔍 Checking authentication...');
      const response = await apiClient.auth.me();
      if (response.success && response.data) {
        user.value = response.data;
        lastAuthCheck.value = Date.now();
        
        // Update localStorage
        if (import.meta.client) {
          localStorage.setItem('auth-user', JSON.stringify(response.data));
        }
        console.log('✅ Authentication check successful, user data restored');
        return true;
      } else {
        console.log('❌ Authentication check failed: response not successful or no data');
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
        localStorage.setItem('auth-user', JSON.stringify(user.value));
      }
    }
  };

  // Branch management
  const setCurrentBranch = (branch: any) => {
    currentBranch.value = branch;
    if (import.meta.client) {
      localStorage.setItem('current-branch', JSON.stringify(branch));
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
      localStorage.setItem('current-school', JSON.stringify(school));
    }
  };

  // Invalidate auth cache
  const invalidateAuthCache = () => {
    lastAuthCheck.value = 0;
  };

  // Cross-tab synchronization using storage events
  const handleStorageChange = (event: StorageEvent) => {
    if (!event.key?.startsWith('auth-') && event.key !== 'auth-action') return;
    
    console.log('🔄 Storage change detected:', event.key, event.newValue);
    
    // Handle auth action events (login/logout from other tabs)
    if (event.key === 'auth-action') {
      const action = event.newValue;
      
      if (action === 'logout') {
        console.log('🔄 Cross-tab logout detected');
        // Clear local state immediately without calling server logout
        user.value = null;
        currentBranch.value = null;
        currentSchool.value = null;
        availableBranches.value = [];
        lastAuthCheck.value = 0;
        
        // Clear cookies
        const accessToken = useCookie('accessToken');
        const refreshToken = useCookie('refreshToken');
        accessToken.value = null;
        refreshToken.value = null;
        
        // Navigate to login if not already there
        if (window.location.pathname !== '/login') {
          navigateTo('/login');
        }
      } else if (action === 'login') {
        console.log('🔄 Cross-tab login detected, refreshing auth state');
        // Refresh auth state from localStorage
        const savedUser = localStorage.getItem('auth-user');
        const savedBranch = localStorage.getItem('current-branch');
        const savedSchool = localStorage.getItem('current-school');
        
        if (savedUser) {
          user.value = JSON.parse(savedUser);
          currentBranch.value = savedBranch ? JSON.parse(savedBranch) : null;
          currentSchool.value = savedSchool ? JSON.parse(savedSchool) : null;
          lastAuthCheck.value = Date.now();
          
          // Navigate to dashboard if on login page
          if (window.location.pathname === '/login') {
            navigateTo('/dashboard');
          }
        }
      }
      
      // Clean up the action flag
      setTimeout(() => {
        localStorage.removeItem('auth-action');
      }, 100);
    }
    
    // Handle direct localStorage changes
    else if (event.key === 'auth-user') {
      if (event.newValue === null) {
        // User data was cleared in another tab
        if (user.value) {
          console.log('🔄 User data cleared in another tab');
          user.value = null;
          currentBranch.value = null;
          currentSchool.value = null;
          availableBranches.value = [];
          lastAuthCheck.value = 0;
        }
      } else if (event.newValue && !user.value) {
        // User data was set in another tab
        console.log('🔄 User data set in another tab');
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
    checkAuth,
    updateUser,
    setCurrentBranch,
    setAvailableBranches,
    switchBranch,
    setCurrentSchool,
    invalidateAuthCache,
    initializeAuth,
    clearAuthData,
    cleanup,
  };
}); 