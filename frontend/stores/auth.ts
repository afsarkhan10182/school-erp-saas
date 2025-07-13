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

  // Helper function to set tokens in both localStorage and cookies
  const setTokens = (authToken: string, refreshTokenData: string) => {
    if (process.client) {
      // Set in localStorage
      localStorage.setItem('auth-token', authToken);
      localStorage.setItem('refresh-token', refreshTokenData);
      
      // Set in cookies
      const authCookie = useCookie('auth-token', {
        maxAge: 7 * 24 * 60 * 60, // 7 days
        secure: true,
        sameSite: 'strict'
      });
      const refreshCookie = useCookie('refresh-token', {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        secure: true,
        sameSite: 'strict'
      });
      
      authCookie.value = authToken;
      refreshCookie.value = refreshTokenData;
    }
  };

  // Helper function to clear tokens from both localStorage and cookies
  const clearTokens = () => {
    if (process.client) {
      // Clear localStorage
      localStorage.removeItem('auth-token');
      localStorage.removeItem('refresh-token');
      localStorage.removeItem('auth-user');
      localStorage.removeItem('current-branch');
      localStorage.removeItem('current-school');
      
      // Clear cookies
      const authCookie = useCookie('auth-token');
      const refreshCookie = useCookie('refresh-token');
      authCookie.value = null;
      refreshCookie.value = null;
    }
  };

  // Initialize from localStorage and cookies
  const initializeAuth = () => {
    if (process.client) {
      // Try to get from cookies first (for SSR compatibility)
      const authCookie = useCookie('auth-token');
      const refreshCookie = useCookie('refresh-token');
      
      // Fallback to localStorage
      const savedToken = authCookie.value || localStorage.getItem('auth-token');
      const savedRefreshToken = refreshCookie.value || localStorage.getItem('refresh-token');
      const savedUser = localStorage.getItem('auth-user');
      const savedBranch = localStorage.getItem('current-branch');
      const savedSchool = localStorage.getItem('current-school');

      if (savedToken && savedUser) {
        token.value = savedToken;
        refreshToken.value = savedRefreshToken;
        user.value = JSON.parse(savedUser);
        currentBranch.value = savedBranch ? JSON.parse(savedBranch) : null;
        currentSchool.value = savedSchool ? JSON.parse(savedSchool) : null;
        
        // Ensure cookies are set if they weren't
        if (!authCookie.value) {
          authCookie.value = savedToken;
        }
        if (!refreshCookie.value && savedRefreshToken) {
          refreshCookie.value = savedRefreshToken;
        }
      }
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
        
        // Save to both localStorage and cookies
        setTokens(authToken, refreshTokenData);
        
        if (process.client) {
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
        if (process.client) {
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
    if (!refreshToken.value) return false;
    
    try {
      const response = await apiClient.auth.refresh(refreshToken.value);
      if (response.success) {
        const { token: newToken } = response.data;
        token.value = newToken;
        
        // Update both localStorage and cookies
        if (process.client) {
          localStorage.setItem('auth-token', newToken);
          const authCookie = useCookie('auth-token');
          authCookie.value = newToken;
        }
        
        return true;
      } else {
        await logout();
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      await logout();
      return false;
    }
  };

  // Update user data
  const updateUser = (userData: Partial<User>) => {
    if (user.value) {
      user.value = { ...user.value, ...userData };
      if (process.client) {
        localStorage.setItem('auth-user', JSON.stringify(user.value));
      }
    }
  };

  // Branch management
  const setCurrentBranch = (branch: any) => {
    currentBranch.value = branch;
    if (process.client) {
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
    if (process.client) {
      localStorage.setItem('current-school', JSON.stringify(school));
    }
  };

  // Invalidate auth cache
  const invalidateAuthCache = () => {
    lastAuthCheck.value = 0;
  };

  // Initialize on store creation
  if (process.client) {
    initializeAuth();
  }

  return {
    // State
    user,
    token,
    refreshToken,
    isLoading,
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
  };
}); 