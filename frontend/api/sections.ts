import { apiClient } from '~/utils/api';

// Wrapper functions to match the expected API interface in the Vue component
export const fetchSectionsAPI = async (filters: any, pagination: any) => {
  const params = {
    page: pagination.page,
    limit: pagination.limit,
    search: filters.search,
  };
  
  return await apiClient.sections.getAll(params);
};

export const createSectionAPI = async (sectionData: any) => {
  return await apiClient.sections.create(sectionData);
};

export const updateSectionAPI = async (id: string, sectionData: any) => {
  return await apiClient.sections.update(id, sectionData);
};

export const deleteSectionAPI = async (id: string) => {
  return await apiClient.sections.delete(id);
};

export const getSectionByIdAPI = async (id: string) => {
  return await apiClient.sections.getById(id);
};
