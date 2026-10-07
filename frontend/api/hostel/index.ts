import { apiCall } from '~/utils/api';

export interface HostelParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: string;
  school_id?: string;
  branch_id?: string;
  [key: string]: any;
}

export const HostelsAPI = {
  getAll: async (params?: HostelParams) => apiCall('get', '/hostel/hostels', { params }),
  getById: async (id: string) => apiCall('get', `/hostel/hostels/${id}`),
  create: async (data: any) => apiCall('post', '/hostel/hostels', data),
  update: async (id: string, data: any) => apiCall('put', `/hostel/hostels/${id}`, data),
  delete: async (id: string) => apiCall('delete', `/hostel/hostels/${id}`),
};

export const RoomTypesAPI = {
  getAll: async (params?: HostelParams) => apiCall('get', '/hostel/rooms/types', { params }),
  getById: async (id: string) => apiCall('get', `/hostel/rooms/types/${id}`),
  create: async (data: any) => apiCall('post', '/hostel/rooms/types', data),
  update: async (id: string, data: any) => apiCall('put', `/hostel/rooms/types/${id}`, data),
  delete: async (id: string) => apiCall('delete', `/hostel/rooms/types/${id}`),
};

export const RoomsAPI = {
  getAll: async (params?: HostelParams) => apiCall('get', '/hostel/rooms', { params }),
  getById: async (id: string) => apiCall('get', `/hostel/rooms/${id}`),
  create: async (data: any) => apiCall('post', '/hostel/rooms', data),
  update: async (id: string, data: any) => apiCall('put', `/hostel/rooms/${id}`, data),
  delete: async (id: string) => apiCall('delete', `/hostel/rooms/${id}`),
};

export const AllocationsAPI = {
  getAll: async (params?: HostelParams) => apiCall('get', '/hostel/allocations', { params }),
  getById: async (id: string) => apiCall('get', `/hostel/allocations/${id}`),
  create: async (data: any) => apiCall('post', '/hostel/allocations', data),
  update: async (id: string, data: any) => apiCall('put', `/hostel/allocations/${id}`, data),
  delete: async (id: string) => apiCall('delete', `/hostel/allocations/${id}`),
};
