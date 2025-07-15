import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, LoginCredentials, AuthResponse } from '~/types';
import { apiClient } from '~/utils/api';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  lastAuthCheck: number;
  currentBranch: any | null;
  availableBranches: any[];
  currentSchool: any | null;
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);
  const isLoading = ref(false);
  const isInitializing = ref(true);
  const lastAuthCheck = ref(0);
  const currentBranch = ref<any | null>(null);
  const availableBranches = ref<any[]>([]);
  const currentSchool = ref<any | null>(null);

  // Computed
  const isLoggedIn = computed(() => !!token.value && !!user.value);
  const isAuthenticated = computed(() => isLoggedIn.value);
  const userRole = computed(() => user.value?.role || null);
  const isSuperAdmin = computed(() => user.value?.role === 'super_admin');
  const isSchoolAdmin = computed(() => user.value?.role === 'school_admin');
  const isBranchAdmin = computed(() => user.value?.role === 'branch_admin');
  const currentUser = computed(() => user.value);

// Helper function to manage tokens via secure cookies (accessible by JS)
const setTokens = (authToken: string, refreshTokenData: string) => {
  if (typeof window !== 'undefined') {
    const authCookie = useCookie('auth-token', {
      maxAge: 7 * 24 * 60 * 60, // 7 days
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false, // Allow JS access for token management
      sameSite: 'lax', // Changed to lax for cross-origin requests
      path: '/', // Ensure cookie is available for all paths
      domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost'
    });
    const refreshCookie = useCookie('refresh-token', {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false, // Allow JS access for token management
      sameSite: 'lax', // Changed to lax for cross-origin requests
      path: '/', // Ensure cookie is available for all paths
      domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost'
    });
    
    authCookie.value = authToken;
    refreshCookie.value = refreshTokenData;
    
    console.log('🍪 Cookies set:', {
      authToken: authToken ? 'present' : 'missing',
      refreshToken: refreshTokenData ? 'present' : 'missing'
    });
  }
};

  // Helper function to clear all auth data from localStorage and cookies
  const clearTokens = () => {
    if (typeof window !== 'undefined') {
      // Clear localStorage - remove tokens (legacy cleanup) and all user data
      localStorage.removeItem('auth-token');
      localStorage.removeItem('refresh-token');
      localStorage.removeItem('auth-user');
      localStorage.removeItem('current-branch');
      localStorage.removeItem('current-school');
      
      // Clear any theme or other auth-related data
      localStorage.removeItem('last-auth-check');
      
      // Clear cookies
      const authCookie = useCookie('auth-token');
      const refreshCookie = useCookie('refresh-token');
      authCookie.value = null;
      refreshCookie.value = null;
    }
  };

// Initialize from cookies
const initializeAuth = async () => {
  if (typeof window !== 'undefined') {
    isInitializing.value = true;
    const authCookie = useCookie('auth-token');
    const refreshCookie = useCookie('refresh-token');
    // Directly use tokens from cookies
    const savedToken = authCookie.value;
    const savedRefreshToken = refreshCookie.value;
    const savedUser = localStorage.getItem('auth-user');
    const savedBranch = localStorage.getItem('current-branch');
    const savedSchool = localStorage.getItem('current-school');

    console.log('🔍 Auth Store Initialization:', {
      tokenFromCookie: savedToken ? 'present' : 'missing',
      tokenLength: savedToken ? savedToken.length : 0,
      refreshTokenFromCookie: savedRefreshToken ? 'present' : 'missing',
      userFromLocalStorage: savedUser ? 'present' : 'missing',
      branchFromLocalStorage: savedBranch ? 'present' : 'missing',
      schoolFromLocalStorage: savedSchool ? 'present' : 'missing'
    });

    if (savedToken && savedUser) {
      token.value = savedToken;
      refreshToken.value = savedRefreshToken;
      user.value = JSON.parse(savedUser);
      currentBranch.value = savedBranch ? JSON.parse(savedBranch) : null;
      currentSchool.value = savedSchool ? JSON.parse(savedSchool) : null;
      console.log('✅ Auth state restored from storage');
    } else {
      console.log('❌ No valid auth state found in storage');
    }
    
    isInitializing.value = false;
  }
};

  // Debug function to check token status
  const debugTokenStatus = () => {
    if (typeof window !== 'undefined') {
      const authCookie = useCookie('auth-token');
      const refreshCookie = useCookie('refresh-token');
      console.log('🔍 Current Token Status:', {
        tokenInStore: token.value ? 'present' : 'missing',
        tokenInCookie: authCookie.value ? 'present' : 'missing',
        refreshTokenInStore: refreshToken.value ? 'present' : 'missing',
        refreshTokenInCookie: refreshCookie.value ? 'present' : 'missing',
        userInStore: user.value ? 'present' : 'missing',
        isLoggedIn: isLoggedIn.value
      });
    }
  };

  // Login
  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      isLoading.value = true;
      console.log('🔐 Starting login process...');
      
      const response = await apiClient.auth.login(credentials);
      console.log('🔐 Login response:', response);
      
      if (response.success) {
        const { user: userData, token: authToken, refreshToken: refreshTokenData } = response.data;
        
        console.log('🔐 Setting user data:', userData);
        console.log('🔐 Setting tokens - auth:', authToken ? 'present' : 'missing', 'refresh:', refreshTokenData ? 'present' : 'missing');
        
        user.value = userData;
        token.value = authToken;
        refreshToken.value = refreshTokenData;
        
        // Set current school and branch based on user role
        if (userData.school_id) {
          currentSchool.value = { id: userData.school_id, name: userData.school_name };
        }
        
        if (userData.branch_id) {
          currentBranch.value = { id: userData.branch_id, name: userData.branch_name };
        }
        
        // Save to cookies
        setTokens(authToken, refreshTokenData);

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
        console.log('🔐 Login successful, user authenticated:', isLoggedIn.value);
        
        // Debug token status after login
        setTimeout(() => {
          debugTokenStatus();
        }, 100);
        
        return { success: true, user: userData };
      } else {
        console.log('🔐 Login failed:', response.message);
        return { success: false, error: response.message };
      }
    } catch (error: any) {
      console.error('🔐 Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed. Please try again.' 
      };
    } finally {
      isLoading.value = false;
    }
  };

  // Logout
  const logout = async () => {
    try {
      if (token.value) {
        await apiClient.auth.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth data
      user.value = null;
      token.value = null;
      refreshToken.value = null;
      currentBranch.value = null;
      currentSchool.value = null;
      availableBranches.value = [];
      lastAuthCheck.value = 0;
      
      // Clear both localStorage and cookies
      clearTokens();
    }
  };

  // Check authentication
  const checkAuth = async (): Promise<boolean> => {
    if (!token.value) return false;
    
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
        await logout();
        return false;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      await logout();
      return false;
    }
  };

  // Refresh token
  const refreshAuth = async (): Promise<boolean> => {
    console.log('🔄 Attempting token refresh...');
    if (!refreshToken.value) {
      console.log('❌ No refresh token available');
      return false;
    }
    
    try {
      const response = await apiClient.auth.refresh(refreshToken.value);
      console.log('🔄 Refresh response:', response);
      
      if (response.success) {
        const { token: newToken, refreshToken: newRefreshToken } = response.data;
        
        // Update both tokens
        token.value = newToken;
        if (newRefreshToken) {
          refreshToken.value = newRefreshToken;
        }
        
        // Update cookies
        setTokens(newToken, refreshToken.value);
        console.log('✅ Token refresh successful');
        
        return true;
      } else {
        console.log('❌ Token refresh failed:', response.message);
        await logout();
        return false;
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      await logout();
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

  // Initialize on store creation
  if (typeof window !== 'undefined') {
    initializeAuth();
    // Make debug function available globally for console testing
    (window as any).debugAuth = debugTokenStatus;
  }

  return {
    // State
    user,
    token,
    refreshToken,
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
    refreshAuth,
    updateUser,
    setCurrentBranch,
    setAvailableBranches,
    switchBranch,
    setCurrentSchool,
    invalidateAuthCache,
    debugTokenStatus,
    initializeAuth,
  };
}); 