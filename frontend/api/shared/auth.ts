import { createApiInstance } from '~/utils/api';

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
    const api = createApiInstance();
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    const api = createApiInstance();
    try {
      const response = await api.post('/auth/logout');
      return response.data;
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
    const api = createApiInstance();
    const response = await api.post('/auth/refresh-token');
    return response.data;
  },

  me: async () => {
    const api = createApiInstance();
    const response = await api.get('/auth/me');
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const api = createApiInstance();
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string) => {
    const api = createApiInstance();
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  }
};
