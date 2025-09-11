import { ref, computed, readonly } from 'vue';
import { useAuthStore } from '~/stores/auth';

/**
 * Configuration Composable - Dynamic configuration management
 * No hardcoded values, all data comes from backend or user context
 */
export const useConfig = () => {
  const authStore = useAuthStore();
  const errors = ref<Map<string, string>>(new Map());

  /**
   * Get school configuration
   */
  const getSchoolConfig = async (key?: string) => {
    try {
      const schoolId = authStore.user?.school_id;
      if (!schoolId) {
        throw new Error('No school ID available');
      }

      // TODO: Implement actual API call when backend endpoints are ready
      throw new Error('School configuration API not implemented yet');
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

      // TODO: Implement actual API call when backend endpoints are ready
      throw new Error('School configuration API not implemented yet');
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

      // TODO: Implement actual API call when backend endpoints are ready
      throw new Error('Module configuration API not implemented yet');
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

      // TODO: Implement actual API call when backend endpoints are ready
      throw new Error('Module configuration API not implemented yet');
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
      // TODO: Implement actual API call when backend endpoints are ready
      throw new Error('System configuration API not implemented yet');
    } catch (error) {
      return null;
    }
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

      // TODO: Implement actual API call when backend endpoints are ready
      throw new Error('Enabled modules API not implemented yet');
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
