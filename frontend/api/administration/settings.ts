import { createApiInstance, apiCall } from '~/utils/api';
import { useAuthStore } from '~/stores/auth';

const systemSettingsParams = () => {
  const authStore = useAuthStore();
  return authStore.isSuperAdmin && authStore.currentSchool?.id
    ? { school_id: authStore.currentSchool.id }
    : {};
};

export interface SchoolSettings {
  schoolInfo: any;
  contactInfo: any;
}

export interface AcademicSettings {
  academicYear: any;
  termSettings: any;
}

export interface FeeSettings {
  feeSettings: any;
}

export interface BrandingSettings {
  receiptSettings: any;
}

export interface SystemSettings {
  systemSettings: any;
}

export const Settings = {
  // School settings
  getSchoolSettings: async () => {
    return apiCall('get', '/settings/school');
  },

  updateSchoolSettings: async (data: FormData | any) => {
    const api = createApiInstance();
    const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    const response = await api.put('/settings/school', data, { headers });
    return response.data;
  },

  // Academic settings
  getAcademicSettings: async () => {
    return apiCall('get', '/settings/academic');
  },

  updateAcademicSettings: async (data: any) => {
    return apiCall('put', '/settings/academic', data);
  },

  // Fee settings
  getFeeSettings: async () => {
    return apiCall('get', '/settings/fee', { params: systemSettingsParams() });
  },

  updateFeeSettings: async (feeSettings: any) => {
    return apiCall('put', '/settings/fee', { feeSettings, ...systemSettingsParams() });
  },

  // Branding settings
  getBrandingSettings: async () => {
    return apiCall('get', '/settings/branding');
  },

  updateBrandingSettings: async (formData: FormData) => {
    const api = createApiInstance();
    const response = await api.put('/settings/branding', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // System settings
  getSystemSettings: async () => {
    return apiCall('get', '/settings/system', { params: systemSettingsParams() });
  },

  updateSystemSettings: async (data: any) => {
    return apiCall('put', '/settings/system', { ...data, ...systemSettingsParams() });
  },

  getSystemSettingsHistory: (params: Record<string, string | number> = {}) =>
    apiCall('get', '/settings/history', { params: { ...systemSettingsParams(), ...params } }),

  getSystemSettingsHistoryEntry: (id: string) =>
    apiCall('get', `/settings/history/${encodeURIComponent(id)}`, { params: systemSettingsParams() }),

  restoreSystemSettingsHistory: (id: string, fields: string[]) =>
    apiCall('post', `/settings/history/${encodeURIComponent(id)}/undo`, {
      fields,
      ...systemSettingsParams()
    }),

  // Config export
  exportConfig: async () => {
    return apiCall('get', '/config/export');
  },

  // Config reset to defaults
  resetToDefaults: async () => {
    return apiCall('post', '/config/reset-defaults');
  },

  // Config backup
  createBackup: async () => {
    return apiCall('post', '/config/backup');
  },

  // Config import
  importConfig: async (formData: FormData) => {
    const api = createApiInstance();
    const response = await api.post('/config/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};
