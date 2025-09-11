import { createApiInstance } from '~/utils/api';

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
    const api = createApiInstance();
    const response = await api.get('/settings/school');
    return response.data;
  },

  updateSchoolSettings: async (data: FormData | any) => {
    const api = createApiInstance();
    const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    const response = await api.put('/settings/school', data, { headers });
    return response.data;
  },

  // Academic settings
  getAcademicSettings: async () => {
    const api = createApiInstance();
    const response = await api.get('/settings/academic');
    return response.data;
  },

  // Fee settings
  getFeeSettings: async () => {
    const api = createApiInstance();
    const response = await api.get('/settings/fee');
    return response.data;
  },

  // Branding settings
  getBrandingSettings: async () => {
    const api = createApiInstance();
    const response = await api.get('/settings/branding');
    return response.data;
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
    const api = createApiInstance();
    const response = await api.get('/settings/system');
    return response.data;
  },

  updateSystemSettings: async (data: any) => {
    const api = createApiInstance();
    const response = await api.put('/settings/system', data);
    return response.data;
  },

  // Config export
  exportConfig: async () => {
    const api = createApiInstance();
    const response = await api.get('/config/export');
    return response.data;
  },

  // Config reset to defaults
  resetToDefaults: async () => {
    const api = createApiInstance();
    const response = await api.post('/config/reset-defaults');
    return response.data;
  },

  // Config backup
  createBackup: async () => {
    const api = createApiInstance();
    const response = await api.post('/config/backup');
    return response.data;
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
