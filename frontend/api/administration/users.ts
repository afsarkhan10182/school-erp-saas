import { createApiInstance } from '~/utils/api';

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
    const api = createApiInstance();
    const response = await api.get('/users', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const api = createApiInstance();
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  create: async (userData: UserData) => {
    const api = createApiInstance();
    const response = await api.post('/users', userData);
    return response.data;
  },

  update: async (id: string, userData: UserData) => {
    const api = createApiInstance();
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  delete: async (id: string) => {
    const api = createApiInstance();
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  updateProfile: async (profileData: FormData) => {
    const api = createApiInstance();
    const response = await api.put('/users/profile/me', profileData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  changePassword: async (passwordData: PasswordData) => {
    const api = createApiInstance();
    const response = await api.post('/users/change-password', passwordData);
    return response.data;
  }
};
