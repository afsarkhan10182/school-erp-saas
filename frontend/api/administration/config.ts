import { apiCall } from '~/utils/api';

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
    const { schoolId, key } = params;
    return apiCall('get', `/config/school/${schoolId}${key ? `/${key}` : ''}`);
  },

  setSchoolConfig: async (params: SchoolConfigParams & { value: any; type: string }) => {
    const { schoolId, key, value, type } = params;
    return apiCall('put', `/config/school/${schoolId}/${key}`, { value, type });
  },

  // Module configuration
  getModuleConfig: async (params: ModuleConfigParams) => {
    const { moduleCode, schoolId, key } = params;
    return apiCall('get', `/config/module/${moduleCode}/${schoolId}${key ? `/${key}` : ''}`);
  },

  setModuleConfig: async (params: ModuleConfigParams & { value: any; type: string }) => {
    const { moduleCode, schoolId, key, value, type } = params;
    return apiCall('put', `/config/module/${moduleCode}/${schoolId}/${key}`, { value, type });
  },

  // System configuration
  getSystemConfig: async (params?: SystemConfigParams) => {
    const { key } = params || {};
    return apiCall('get', `/config/system${key ? `/${key}` : ''}`);
  },

  // Get enabled modules for a school
  getEnabledModules: async (schoolId: string) => {
    return apiCall('get', `/config/modules/enabled/${schoolId}`);
  }
};
