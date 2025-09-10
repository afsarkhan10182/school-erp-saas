import { createApiInstance } from '~/utils/api';

export interface ConfigValue {
  value: any;
  type: string;
}

export interface SchoolConfigParams {
  schoolId: string;
  key?: string;
}

export interface ModuleConfigParams {
  moduleCode: string;
  schoolId: string;
  key?: string;
}

export interface SystemConfigParams {
  key?: string;
}

export const Config = {
  // School configuration
  getSchoolConfig: async (params: SchoolConfigParams) => {
    const api = createApiInstance();
    const { schoolId, key } = params;
    const response = await api.get(`/config/school/${schoolId}${key ? `/${key}` : ''}`);
    return response.data;
  },

  setSchoolConfig: async (params: SchoolConfigParams & { value: any; type: string }) => {
    const api = createApiInstance();
    const { schoolId, key, value, type } = params;
    const response = await api.put(`/config/school/${schoolId}/${key}`, { value, type });
    return response.data;
  },

  // Module configuration
  getModuleConfig: async (params: ModuleConfigParams) => {
    const api = createApiInstance();
    const { moduleCode, schoolId, key } = params;
    const response = await api.get(
      `/config/module/${moduleCode}/${schoolId}${key ? `/${key}` : ''}`
    );
    return response.data;
  },

  setModuleConfig: async (params: ModuleConfigParams & { value: any; type: string }) => {
    const api = createApiInstance();
    const { moduleCode, schoolId, key, value, type } = params;
    const response = await api.put(`/config/module/${moduleCode}/${schoolId}/${key}`, { value, type });
    return response.data;
  },

  // System configuration
  getSystemConfig: async (params?: SystemConfigParams) => {
    const api = createApiInstance();
    const { key } = params || {};
    const response = await api.get(`/config/system${key ? `/${key}` : ''}`);
    return response.data;
  },

  // Get enabled modules for a school
  getEnabledModules: async (schoolId: string) => {
    const api = createApiInstance();
    const response = await api.get(`/config/modules/enabled/${schoolId}`);
    return response.data;
  }
};
