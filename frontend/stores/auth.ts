import { defineStore } from 'pinia';
import type { User, LoginCredentials, AuthState } from '~/types';
import { apiClient } from '~/utils/api';

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    lastAuthCheck: 0, // Add timestamp for caching
  }),

  getters: {
    currentUser: (state) => state.user,
    isLoggedIn: (state) => state.isAuthenticated && !!state.token,
    userRole: (state) => state.user?.role,
    isSuperAdmin: (state) => state.user?.role === 'super_admin',
    isSchoolAdmin: (state) => state.user?.role === 'school_admin',
    isBranchAdmin: (state) => state.user?.role === 'branch_admin',
  },

  actions: {
    async login(credentials: LoginCredentials) {
      this.isLoading = true;
      try {
        const response = await apiClient.auth.login(credentials);
        
        if (response.success) {
          const { user, token, refreshToken } = response.data;
          
          // Store tokens in cookies
          const authToken = useCookie('auth-token', {
            maxAge: 60 * 60 * 24 * 7, // 7 days
            secure: true,
            sameSite: 'strict'
          });
          const refreshTokenCookie = useCookie('refresh-token', {
            maxAge: 60 * 60 * 24 * 30, // 30 days
            secure: true,
            sameSite: 'strict'
          });
          
          authToken.value = token;
          refreshTokenCookie.value = refreshToken;
          
          // Update store state
          this.user = user;
          this.token = token;
          this.refreshToken = refreshToken;
          this.isAuthenticated = true;
          this.lastAuthCheck = Date.now();
          
          return { success: true, user };
        } else {
          throw new Error(response.message || 'Login failed');
        }
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async logout() {
      try {
        // Call logout endpoint if token exists
        if (this.token) {
          await apiClient.auth.logout();
        }
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        // Clear store state
        this.user = null;
        this.token = null;
        this.refreshToken = null;
        this.isAuthenticated = false;
        this.lastAuthCheck = 0;
        
        // Clear cookies
        const authToken = useCookie('auth-token');
        const refreshToken = useCookie('refresh-token');
        authToken.value = null;
        refreshToken.value = null;
        
        // Redirect to login
        await navigateTo('/login');
      }
    },

    async checkAuth() {
      const authToken = useCookie('auth-token').value;
      const refreshToken = useCookie('refresh-token').value;
      
      if (!authToken) {
        return false;
      }

      // Check if we have cached user data and it's recent (within 5 minutes)
      const now = Date.now();
      const cacheValid = this.user && this.isAuthenticated && 
                        (now - this.lastAuthCheck) < 5 * 60 * 1000; // 5 minutes
      
      if (cacheValid) {
        return true;
      }
      
      try {
        this.isLoading = true;
        const response = await apiClient.auth.me();
        
        if (response.success) {
          this.user = response.data;
          this.token = authToken;
          this.refreshToken = refreshToken || null;
          this.isAuthenticated = true;
          this.lastAuthCheck = now;
          return true;
        } else {
          await this.logout();
          return false;
        }
      } catch (error) {
        console.error('Auth check error:', error);
        await this.logout();
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async refreshAuth() {
      const refreshToken = useCookie('refresh-token').value;
      
      if (!refreshToken) {
        await this.logout();
        return false;
      }
      
      try {
        const response = await apiClient.auth.refresh(refreshToken);
        
        if (response.success) {
          const { token } = response.data;
          
          // Update token in cookie
          const authToken = useCookie('auth-token');
          authToken.value = token;
          
          // Update store state
          this.token = token || null;
          this.lastAuthCheck = Date.now();
          return true;
        } else {
          await this.logout();
          return false;
        }
      } catch (error) {
        console.error('Token refresh error:', error);
        await this.logout();
        return false;
      }
    },

    updateUser(userData: Partial<User>) {
      if (this.user) {
        this.user = { ...this.user, ...userData };
      }
    },

    // Method to invalidate cache and force a fresh auth check
    invalidateAuthCache() {
      this.lastAuthCheck = 0;
    }
  },
}); 