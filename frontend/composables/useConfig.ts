import { ref, computed, readonly } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { Settings } from '~/api/administration/settings';
import { Schools } from '~/api/administration/schools';

/**
 * Configuration Composable - Dynamic configuration management
 * No hardcoded values, all data comes from backend or user context
 */
export const useConfig = () => {
  const authStore = useAuthStore();
  const errors = ref<Map<string, string>>(new Map());
  const schoolSnapshot = ref<any>(null);
  const systemSnapshot = ref<Record<string, any>>({});

  /**
   * Get school configuration
   */
  const getSchoolConfig = async (key?: string) => {
    try {
      const schoolId = authStore.user?.school_id;
      if (!schoolId) {
        throw new Error('No school ID available');
      }

      const response: any = await Settings.getSchoolSettings();
      const school = response?.data?.school || response?.data;
      if (!school) return null;
      schoolSnapshot.value = school;
      return {
        ...response.data,
        settings: {
          ...(school.settings || {}),
          currency: school.currency || 'USD',
          timezone: school.timezone || 'UTC',
          date_format: school.date_format || 'MM/DD/YYYY'
        }
      };
    } catch (error: any) {
      errors.value.set('school_config', error.message);
      throw error;
    }
  };

  /**
   * Set school configuration
   */
  const setSchoolConfig = async (key: string, value: any, type: string = 'string') => {
    try {
      const schoolId = authStore.user?.school_id;
      if (!schoolId) {
        throw new Error('No school ID available');
      }

      const school = schoolSnapshot.value || (await getSchoolConfig())?.school;
      const settings = { ...(school?.settings || {}), [key]: value };
      const response: any = await Settings.updateSchoolSettings({
        schoolInfo: {
          name: school?.name,
          code: school?.code,
          logo: school?.logo,
          trustName: settings.trust_name,
          receiptSchoolName: settings.receipt_school_name,
          type: settings.type,
          establishmentYear: settings.establishment_year,
          principalName: settings.principal_name,
          principalEmail: settings.principal_email
        },
        contactInfo: {
          phone: school?.phone,
          email: school?.email,
          website: school?.website,
          address: school?.address,
          city: school?.city,
          state: school?.state,
          postalCode: school?.postal_code,
          country: school?.country
        },
        operationalSettings: {
          defaultAcademicYear: school?.current_academic_year_id,
          defaultCurrency: settings.currency || school?.currency,
          timezone: settings.timezone || school?.timezone,
          dateFormat: settings.date_format || school?.date_format
        }
      });
      schoolSnapshot.value = response?.data?.school || school;
      return response;
    } catch (error: any) {
      errors.value.set('school_config', error.message);
      throw error;
    }
  };

  /**
   * Set module configuration
   */
  const setModuleConfig = async (
    moduleCode: string,
    key: string,
    value: any,
    type: string = 'string'
  ) => {
    try {
      const schoolId = authStore.user?.school_id;
      if (!schoolId) {
        throw new Error('No school ID available');
      }

      if (key !== 'is_enabled') {
        throw new Error(`Unsupported module setting: ${key}`);
      }
      const response: any = await Schools.getModules(schoolId);
      const modules = response?.data?.modules || response?.modules || [];
      const enabled = modules
        .filter((module: any) => (module.code || module.key) !== moduleCode || value)
        .map((module: any) => module.code || module.key);
      return await Schools.updateModules(schoolId, enabled);
    } catch (error: any) {
      errors.value.set('module_config', error.message);
      throw error;
    }
  };

  /**
   * Get module configuration
   */
  const getModuleConfig = async (moduleCode: string, key?: string) => {
    try {
      const schoolId = authStore.user?.school_id;
      if (!schoolId) {
        throw new Error('No school ID available');
      }

      // Handle academic module configuration through academic settings API
      if (moduleCode === 'academic') {
        const { Settings } = await import('~/api/administration/settings');
        const response = await Settings.getAcademicSettings();

        if (response.success && response.data) {
          // Map specific keys to their values
          switch (key) {
            case 'working_days':
              return response.data.attendanceSettings?.workingDays || null;
            case 'attendance_cutoff_time':
              return response.data.attendanceSettings?.timeSettings?.cutoffTime || null;
            case 'subject_categories':
              return response.data.subjectCategories || null;
            default:
              return response.data;
          }
        }
      }

      // For other modules, throw error as they're not implemented yet
      throw new Error(`Module configuration API for ${moduleCode} not implemented yet`);
    } catch (error: any) {
      errors.value.set('module_config', error.message);
      throw error;
    }
  };

  /**
   * Get system configuration
   */
  const getSystemConfig = async (key?: string) => {
    try {
      const response: any = await Settings.getSystemSettings();
      const settings = response?.data?.systemSettings || {};
      systemSnapshot.value = settings;
      return key ? settings[key] : settings;
    } catch (error) {
      return null;
    }
  };

  const setSystemConfig = async (key: string, value: any) => {
    const systemSettings = { ...systemSnapshot.value, [key]: value };
    const response = await Settings.updateSystemSettings({ systemSettings });
    systemSnapshot.value = systemSettings;
    return response;
  };

  /**
   * Get enabled modules
   */
  const getEnabledModules = async () => {
    try {
      const schoolId = authStore.user?.school_id;
      if (!schoolId) {
        return [];
      }

      const response: any = await Schools.getModules(schoolId);
      const modules = response?.data?.modules || response?.modules || [];
      return modules.map((module: any) => ({
        ...module,
        is_enabled: module.is_enabled ?? module.enabled ?? false
      }));
    } catch (error) {
      return [];
    }
  };

  /**
   * Check if module is enabled
   */
  const isModuleEnabled = async (moduleCode: string) => {
    try {
      const enabledModules = await getEnabledModules();
      return enabledModules.some((module: any) => module.code === moduleCode);
    } catch (error) {
      return false;
    }
  };

  /**
   * Format currency - gets currency from school config
   */
  const formatCurrency = async (amount: number) => {
    try {
      const schoolConfig = await getSchoolConfig();
      const currency = (schoolConfig as any)?.school?.currency;

      if (!currency) {
        throw new Error('Currency not configured for school');
      }

      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(amount);
    } catch (error: any) {
      throw new Error(`Failed to format currency: ${error.message}`);
    }
  };

  /**
   * Get working days from configuration
   */
  const getWorkingDays = async () => {
    try {
      const config = await getModuleConfig('academic', 'working_days');
      return config;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Get attendance cutoff time from configuration
   */
  const getAttendanceCutoffTime = async () => {
    try {
      const config = await getModuleConfig('academic', 'attendance_cutoff_time');
      return config;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Get subject categories from configuration
   */
  const getSubjectCategories = async () => {
    try {
      const config = await getModuleConfig('academic', 'subject_categories');
      return config;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Clear all caches
   */
  const clearAllCache = () => {
    errors.value.clear();
  };

  /**
   * Utility function to get nested values
   */
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  };

  // Computed properties
  const hasErrors = computed(() => errors.value.size > 0);
  const errorMessages = computed(() => Array.from(errors.value.values()));

  return {
    // Configuration getters
    getSchoolConfig,
    setSchoolConfig,
    getModuleConfig,
    setModuleConfig,
    getSystemConfig,
    setSystemConfig,
    getEnabledModules,
    isModuleEnabled,

    // Formatters
    formatCurrency,

    // Specific configurations
    getWorkingDays,
    getAttendanceCutoffTime,
    getSubjectCategories,

    // Cache management
    clearAllCache,

    // Error handling
    hasErrors,
    errorMessages,
    errors: readonly(errors)
  };
};
