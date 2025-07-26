import { apiClient } from '~/utils/api';

// Wrapper functions to match the expected API interface in the Vue component
export const fetchStreamsAPI = async (params: any) => {
  return await apiClient.streams.getAll(params);
};

export const createStreamAPI = async (streamData: any) => {
  return await apiClient.streams.create(streamData);
};

export const updateStreamAPI = async (id: string, streamData: any) => {
  return await apiClient.streams.update(id, streamData);
};

export const deleteStreamAPI = async (id: string) => {
  return await apiClient.streams.delete(id);
};

export const getStreamByIdAPI = async (id: string) => {
  return await apiClient.streams.getById(id);
};

export const getStreamsForDropdownAPI = async (params?: { school_id?: string; branch_id?: string; class_id?: string }) => {
  return await apiClient.streams.getForDropdown(params);
}; 