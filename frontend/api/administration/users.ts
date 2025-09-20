import { createApiInstance, apiCall } from '~/utils/api';

export interface UserParams {
  page?: number;
  limit?: number;
  role?: string;
  schoolId?: string;
  branchId?: string;
}

export interface UserData {
  name: string;
  email: string;
  role: string;
  school_id: string;
  branch_id?: string;
  status?: string;
}

export interface ProfileData {
  name?: string;
  email?: string;
  phone?: string;
  profile_image?: File;
}

export interface PasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export const Users = {
  getAll: async (params?: UserParams) => {
    return apiCall('get', '/users', { params });
  },

  getById: async (id: string) => {
    return apiCall('get', `/users/${id}`);
  },

  create: async (userData: UserData) => {
    return apiCall('post', '/users', userData);
  },

  update: async (id: string, userData: UserData) => {
    return apiCall('put', `/users/${id}`, userData);
  },

  delete: async (id: string) => {
    return apiCall('delete', `/users/${id}`);
  },

  updateProfile: async (profileData: FormData) => {
    const api = createApiInstance();
    const response = await api.put('/users/profile/me', profileData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  changePassword: async (passwordData: PasswordData) => {
    return apiCall('post', '/users/change-password', passwordData);
  }
};
