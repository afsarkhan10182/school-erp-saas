import { apiClient } from '~/utils/api';

// Wrapper functions to match the expected API interface in the Vue component
export const fetchSectionsAPI = async (filters: any, pagination: any) => {
  const params: any = {
    page: pagination.page,
    limit: pagination.limit,
    search: filters.search,
  };
  
  // Add class_id filter if provided
  if (filters.class_id) {
    params.class_id = filters.class_id;
  }
  
  // Add is_active filter if provided
  if (filters.is_active !== '') {
    params.is_active = filters.is_active;
  }
  
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
