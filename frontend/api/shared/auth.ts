import { apiCall } from '~/utils/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

export const Auth = {
  login: async (credentials: LoginCredentials) => {
    return apiCall('post', '/auth/login', credentials);
  },

  logout: async () => {
    try {
      return await apiCall('post', '/auth/logout');
    } catch (error: any) {
      // If logout fails due to authentication issues, still return success
      if (error.response?.status === 401 || error.response?.status === 403) {
        return {
          success: true,
          message: 'Logout successful (local cleanup only)',
          data: null
        };
      }
      throw error;
    }
  },

  refresh: async () => {
    return apiCall('post', '/auth/refresh-token');
  },

  me: async () => {
    return apiCall('get', '/auth/me');
  },

  forgotPassword: async (email: string) => {
    return apiCall('post', '/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string) => {
    return apiCall('post', '/auth/reset-password', { token, password });
  }
};
