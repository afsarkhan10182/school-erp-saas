/**
 * Settings Utilities
 * Centralized utilities for accessing school settings across the application
 */

import { ref, computed } from 'vue';
import {
  getConfiguredFeePaymentMethods,
  getEnabledFeePaymentMethods,
  getFeeSettingsCacheKey
} from './feePaymentMethods.js';
import { useAuthStore } from '~/stores/auth';

// Cache for settings to avoid repeated API calls
const settingsCache = ref<Map<string, any>>(new Map());
const loadingStates = ref<Map<string, boolean>>(new Map());

/**
 * Generic Settings Checker
 * Provides a unified way to check various feature settings
 */
export const useSettingsChecker = () => {
  const isLoading = computed(() => loadingStates.value.get('settings') || false);

  /**
   * Check if a specific feature is enabled
   */
  const isFeatureEnabled = async (feature: string): Promise<boolean> => {
    const cacheKey = `feature:${feature}`;

    // Return cached result if available
    if (settingsCache.value.has(cacheKey)) {
      return settingsCache.value.get(cacheKey);
    }

    try {
      loadingStates.value.set('settings', true);

      let isEnabled = false;

      switch (feature) {
        case 'streams':
          const { isStreamsEnabled } = useAcademicSettings();
          isEnabled = await isStreamsEnabled();
          break;
        // Add more feature checks here
        // case 'exams':
        //   const { isExamsEnabled } = useAcademicSettings();
        //   isEnabled = await isExamsEnabled();
        //   break;
        default:
          console.warn(`Unknown feature: ${feature}`);
          return false;
      }

      // Cache the result
      settingsCache.value.set(cacheKey, isEnabled);
      return isEnabled;
    } catch (error) {
      console.error(`❌ Error checking ${feature} setting:`, error);
      return false;
    } finally {
      loadingStates.value.set('settings', false);
    }
  };

  /**
   * Clear feature cache
   */
  const clearFeatureCache = (feature?: string) => {
    if (feature) {
      settingsCache.value.delete(`feature:${feature}`);
    } else {
      // Clear all feature caches
      for (const key of settingsCache.value.keys()) {
        if (key.startsWith('feature:')) {
          settingsCache.value.delete(key);
        }
      }
    }
  };

  return {
    isFeatureEnabled,
    clearFeatureCache,
    isLoading
  };
};

/**
 * Academic Settings Utility
 * Provides easy access to academic settings like class streams, attendance rules, etc.
 */
export const useAcademicSettings = () => {
  const isLoading = computed(() => loadingStates.value.get('academic') || false);

  /**
   * Clear cache for specific key or all cache
   */
  const clearCache = (key?: string) => {
    if (key) {
      settingsCache.value.delete(key);
      console.log(`🗑️ Cleared cache for: ${key}`);
    } else {
      settingsCache.value.clear();
      console.log('🗑️ Cleared all cache');
    }
  };

  /**
   * Get class streams configuration
   * Returns whether streams are enabled for classes
   */
  const isStreamsEnabled = async (forceRefresh = false): Promise<boolean> => {
    try {
      // Clear cache if force refresh is requested
      if (forceRefresh) {
        clearCache('academic');
      }

      // Check cache first (only if not forcing refresh)
      if (!forceRefresh) {
        const cached = settingsCache.value.get('academic');
        if (cached?.classSettings?.enableStreams !== undefined) {
          console.log('📦 Using cached value:', cached.classSettings.enableStreams);
          return cached.classSettings.enableStreams;
        }
      }

      // Load from API
      console.log('🌐 Fetching fresh data from API...');
      loadingStates.value.set('academic', true);
      const { Settings } = await import('~/api/administration/settings');
      const response = await Settings.getAcademicSettings();

      if (response.success && response.data) {
        // Cache the response
        settingsCache.value.set('academic', response.data);
        const result = response.data.classSettings?.enableStreams || false;
        console.log('✅ Fresh API result:', result);
        return result;
      }

      console.log('❌ API call failed, returning false');
      return false;
    } catch (error) {
      console.error('Failed to load academic settings:', error);
      return false;
    } finally {
      loadingStates.value.set('academic', false);
    }
  };

  /**
   * Get attendance settings
   * Returns attendance configuration
   */
  const getAttendanceSettings = async () => {
    try {
      const cached = settingsCache.value.get('academic');
      if (cached?.attendanceSettings) {
        return cached.attendanceSettings;
      }

      loadingStates.value.set('academic', true);
      const { Settings } = await import('~/api/administration/settings');
      const response = await Settings.getAcademicSettings();

      if (response.success && response.data) {
        settingsCache.value.set('academic', response.data);
        return response.data.attendanceSettings || {};
      }

      return {};
    } catch (error) {
      console.error('Failed to load attendance settings:', error);
      return {};
    } finally {
      loadingStates.value.set('academic', false);
    }
  };

  /**
   * Get working days configuration
   * Returns which days are working days
   */
  const getWorkingDays = async () => {
    const attendanceSettings = await getAttendanceSettings();
    return (
      attendanceSettings.workingDays || {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false
      }
    );
  };

  /**
   * Check if a specific day is a working day
   */
  const isWorkingDay = async (day: string): Promise<boolean> => {
    const workingDays = await getWorkingDays();
    return workingDays[day.toLowerCase()] || false;
  };

  /**
   * Get attendance cutoff time
   */
  const getCutoffTime = async (): Promise<string> => {
    const attendanceSettings = await getAttendanceSettings();
    return attendanceSettings.timeSettings?.cutoffTime || '16:00';
  };

  return {
    isLoading,
    isStreamsEnabled,
    clearCache,
    getAttendanceSettings,
    getWorkingDays,
    isWorkingDay,
    getCutoffTime
  };
};

/**
 * School Settings Utility
 * Provides access to general school settings
 */
export const useSchoolSettings = () => {
  const isLoading = computed(() => loadingStates.value.get('school') || false);

  /**
   * Get school information
   */
  const getSchoolInfo = async () => {
    try {
      const cached = settingsCache.value.get('school');
      if (cached) {
        return cached;
      }

      loadingStates.value.set('school', true);
      const { Settings } = await import('~/api/administration/settings');
      const response = await Settings.getSchoolSettings();

      if (response.success && response.data) {
        settingsCache.value.set('school', response.data);
        return response.data;
      }

      return {};
    } catch (error) {
      console.error('Failed to load school settings:', error);
      return {};
    } finally {
      loadingStates.value.set('school', false);
    }
  };

  /**
   * Get school name
   */
  const getSchoolName = async (): Promise<string> => {
    const schoolInfo = await getSchoolInfo();
    return schoolInfo.name || 'School';
  };

  /**
   * Get school logo
   */
  const getSchoolLogo = async (): Promise<string> => {
    const schoolInfo = await getSchoolInfo();
    return schoolInfo.logo || '';
  };

  /**
   * Clear school settings cache
   */
  const clearCache = () => {
    settingsCache.value.delete('school');
  };

  return {
    isLoading,
    getSchoolInfo,
    getSchoolName,
    getSchoolLogo,
    clearCache
  };
};

/**
 * Fee Settings Utility
 * Provides access to fee-related settings
 */
export const useFeeSettings = () => {
  const feeSettingsCacheKey = () => {
    const { currentSchool, currentUser, isSuperAdmin } = useAuthStore();
    const schoolId = isSuperAdmin ? currentSchool?.id : currentUser?.school_id;
    return getFeeSettingsCacheKey(schoolId);
  };
  const isLoading = computed(() => loadingStates.value.get(feeSettingsCacheKey()) || false);

  /**
   * Get fee settings
   */
  const getFeeSettings = async () => {
    const cacheKey = feeSettingsCacheKey();
    try {
      const cached = settingsCache.value.get(cacheKey);
      if (cached) {
        return cached;
      }

      loadingStates.value.set(cacheKey, true);
      const { Settings } = await import('~/api/administration/settings');
      const response = await Settings.getFeeSettings();

      if (response.success && response.data) {
        settingsCache.value.set(cacheKey, response.data);
        return response.data;
      }

      return {};
    } catch (error) {
      console.error('Failed to load fee settings:', error);
      return {};
    } finally {
      loadingStates.value.set(cacheKey, false);
    }
  };

  /**
   * Get payment methods
   */
  const getPaymentMethods = async () => {
    const feeSettings = await getFeeSettings();
    return getConfiguredFeePaymentMethods(feeSettings);
  };

  /**
   * Check if a payment method is enabled
   */
  const isPaymentMethodEnabled = async (method: string): Promise<boolean> => {
    const paymentMethods = await getPaymentMethods();
    return getEnabledFeePaymentMethods(paymentMethods).some(option => option.value === method);
  };

  /**
   * Clear fee settings cache
   */
  const clearCache = () => {
    settingsCache.value.delete(feeSettingsCacheKey());
  };

  return {
    isLoading,
    getFeeSettings,
    getPaymentMethods,
    isPaymentMethodEnabled,
    clearCache
  };
};

/**
 * Branding Settings Utility
 * Provides access to branding and receipt settings
 */
export const useBrandingSettings = () => {
  const isLoading = computed(() => loadingStates.value.get('branding') || false);

  /**
   * Get branding settings
   */
  const getBrandingSettings = async () => {
    try {
      const cached = settingsCache.value.get('branding');
      if (cached) {
        return cached;
      }

      loadingStates.value.set('branding', true);
      const { Settings } = await import('~/api/administration/settings');
      const response = await Settings.getBrandingSettings();

      if (response.success && response.data) {
        settingsCache.value.set('branding', response.data);
        return response.data;
      }

      return {};
    } catch (error) {
      console.error('Failed to load branding settings:', error);
      return {};
    } finally {
      loadingStates.value.set('branding', false);
    }
  };

  /**
   * Get receipt settings
   */
  const getReceiptSettings = async () => {
    const brandingSettings = await getBrandingSettings();
    return brandingSettings.receiptSettings || {};
  };

  /**
   * Get receipt logo
   */
  const getReceiptLogo = async (): Promise<string> => {
    const receiptSettings = await getReceiptSettings();
    return receiptSettings.receiptLogo || '';
  };

  /**
   * Clear branding settings cache
   */
  const clearCache = () => {
    settingsCache.value.delete('branding');
  };

  return {
    isLoading,
    getBrandingSettings,
    getReceiptSettings,
    getReceiptLogo,
    clearCache
  };
};

/**
 * Clear all settings cache
 */
export const clearAllSettingsCache = () => {
  settingsCache.value.clear();
  loadingStates.value.clear();
};

/**
 * Utility to check if settings are cached
 */
export const isSettingsCached = (type: string): boolean => {
  return settingsCache.value.has(type);
};
