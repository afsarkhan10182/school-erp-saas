import axios from 'axios';
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, PaginatedResponse } from '~/types';

export function createApiInstance(): AxiosInstance {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;

  const api: AxiosInstance = axios.create({
    baseURL: apiBase,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth token
  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = useCookie('auth-token').value;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: any) => Promise.reject(error)
  );

  // Response interceptor for error handling
  api.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const refreshToken = useCookie('refresh-token').value;
          if (refreshToken) {
            const response = await axios.post(`${apiBase}/auth/refresh`, { refreshToken });
            const { token } = response.data.data;
            useCookie('auth-token').value = token;
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          await navigateTo('/login');
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );

  return api;
}

export const apiClient = {
  // Auth endpoints
  auth: {
    login: async (credentials: { email: string; password: string }) => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<{ user: any; token: string; refreshToken: string }>>('/auth/login', credentials);
      return response.data;
    },
    
    logout: async () => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<null>>('/auth/logout');
      return response.data;
    },
    
    refresh: async (refreshToken: string) => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<{ token: string }>>('/auth/refresh', { refreshToken });
      return response.data;
    },
    
    me: async () => {
      const api = createApiInstance();
      // Debug logging for auth/me calls
      if (process.dev) {
        const { authDebug } = await import('./auth-debug');
        authDebug.logCall('/auth/me');
      }
      const response = await api.get<ApiResponse<any>>('/auth/me');
      return response.data;
    }
  },

  // User endpoints
  users: {
    getAll: async (params?: { page?: number; limit?: number; role?: string; schoolId?: string; branchId?: string }) => {
      const api = createApiInstance();
      const response = await api.get<PaginatedResponse<any>>('/users', { params });
      return response.data;
    },
    
    getById: async (id: string) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>(`/users/${id}`);
      return response.data;
    },
    
    create: async (userData: any) => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<any>>('/users', userData);
      return response.data;
    },
    
    update: async (id: string, userData: any) => {
      const api = createApiInstance();
      const response = await api.put<ApiResponse<any>>(`/users/${id}`, userData);
      return response.data;
    },
    
    delete: async (id: string) => {
      const api = createApiInstance();
      const response = await api.delete<ApiResponse<null>>(`/users/${id}`);
      return response.data;
    }
  },

  // School endpoints
  schools: {
    getAll: async (params?: { page?: number; limit?: number }) => {
      const api = createApiInstance();
      const response = await api.get<PaginatedResponse<any>>('/schools', { params });
      return response.data;
    },
    
    getById: async (id: string) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>(`/schools/${id}`);
      return response.data;
    },
    
    create: async (schoolData: any) => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<any>>('/schools', schoolData);
      return response.data;
    },
    
    update: async (id: string, schoolData: any) => {
      const api = createApiInstance();
      const response = await api.put<ApiResponse<any>>(`/schools/${id}`, schoolData);
      return response.data;
    },
    
    delete: async (id: string) => {
      const api = createApiInstance();
      const response = await api.delete<ApiResponse<null>>(`/schools/${id}`);
      return response.data;
    }
  },

  // Branch endpoints
  branches: {
    getAll: async (schoolId?: string, params?: { page?: number; limit?: number }) => {
      const api = createApiInstance();
      const url = schoolId ? `/schools/${schoolId}/branches` : '/branches';
      const response = await api.get<PaginatedResponse<any>>(url, { params });
      return response.data;
    },
    
    getById: async (id: string) => {
      const api = createApiInstance();
      const response = await api.get<ApiResponse<any>>(`/branches/${id}`);
      return response.data;
    },
    
    create: async (branchData: any) => {
      const api = createApiInstance();
      const response = await api.post<ApiResponse<any>>('/branches', branchData);
      return response.data;
    },
    
    update: async (id: string, branchData: any) => {
      const api = createApiInstance();
      const response = await api.put<ApiResponse<any>>(`/branches/${id}`, branchData);
      return response.data;
    },
    
    delete: async (id: string) => {
      const api = createApiInstance();
      const response = await api.delete<ApiResponse<null>>(`/branches/${id}`);
      return response.data;
    }
  }
};

export default apiClient; 