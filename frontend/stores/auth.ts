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
    if (typeof window !== 'undefined') {
      // Clear user data from localStorage
      localStorage.removeItem('auth-user');
      localStorage.removeItem('current-branch');
      localStorage.removeItem('current-school');
      localStorage.removeItem('last-auth-check');
      
      // Clear any theme or other auth-related data
      localStorage.removeItem('theme');
    }
  };

  // Initialize from localStorage (user data only) - HYBRID APPROACH
  const initializeAuth = async () => {
    // Use Nuxt's composables for better SSR handling
    const { $fetch } = useNuxtApp();
    
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      isInitializing.value = false;
      return;
    }
    
    isInitializing.value = true;
    
    try {
      const savedUser = localStorage.getItem('auth-user');
      const savedBranch = localStorage.getItem('current-branch');
      const savedSchool = localStorage.getItem('current-school');

      if (savedUser) {
        user.value = JSON.parse(savedUser);
        currentBranch.value = savedBranch ? JSON.parse(savedBranch) : null;
        currentSchool.value = savedSchool ? JSON.parse(savedSchool) : null;
        
        // Quick verification for non-login pages (max 500ms)
        if (window.location.pathname !== '/login') {
          try {
            const isValid = await Promise.race([
              checkAuth(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Auth check timeout')), 500)
              )
            ]);
            
            if (!isValid) {
              clearAuthData();
              user.value = null;
              currentBranch.value = null;
              currentSchool.value = null;
            }
          } catch (error) {
            // Keep cached data if verification times out
          }
        }
      }
    } catch (error) {
      console.error('❌ Error during auth initialization:', error);
      clearAuthData();
      user.value = null;
      currentBranch.value = null;
      currentSchool.value = null;
    } finally {
      isInitializing.value = false;
    }
  };



  // Login
  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      isLoading.value = true;
      
      const response = await apiClient.auth.login(credentials);
      
      if (response.success) {
        const { user: userData } = response.data;
        
        user.value = userData;
        
        // Set current school and branch based on user role
        if (userData.school_id) {
          currentSchool.value = { id: userData.school_id, name: userData.school_name };
        }
        
        if (userData.branch_id) {
          currentBranch.value = { id: userData.branch_id, name: userData.branch_name };
        }
        
        // Save user data to localStorage (tokens are handled by secure cookies)
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth-user', JSON.stringify(userData));
          if (currentSchool.value) {
            localStorage.setItem('current-school', JSON.stringify(currentSchool.value));
          }
          if (currentBranch.value) {
            localStorage.setItem('current-branch', JSON.stringify(currentBranch.value));
          }
        }
        
        lastAuthCheck.value = Date.now();
        
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
      
      // Clear localStorage
      clearAuthData();
      
      // Force redirect to login page to ensure clean state
      if (typeof window !== 'undefined') {
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
      const response = await apiClient.auth.me();
      if (response.success) {
        user.value = response.data;
        lastAuthCheck.value = Date.now();
        
        // Update localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth-user', JSON.stringify(response.data));
        }
        return true;
      } else {
        // Don't call logout here, just return false
        return false;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // Don't call logout here, just return false
      return false;
    }
  };

  // Update user data
  const updateUser = (userData: Partial<User>) => {
    if (user.value) {
      user.value = { ...user.value, ...userData };
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth-user', JSON.stringify(user.value));
      }
    }
  };

  // Branch management
  const setCurrentBranch = (branch: any) => {
    currentBranch.value = branch;
    if (typeof window !== 'undefined') {
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('current-school', JSON.stringify(school));
    }
  };

  // Invalidate auth cache
  const invalidateAuthCache = () => {
    lastAuthCheck.value = 0;
  };

  // Initialize on store creation - only on client side
  if (typeof window !== 'undefined') {
    initializeAuth();
  }

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
  };
}); 