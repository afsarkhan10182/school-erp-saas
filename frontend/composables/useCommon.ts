import { ref, computed } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { useAuth } from '~/composables/useAuth';
import { useToast } from '~/composables/useToast';

/**
 * Common composable for shared operations across the application
 * Provides utility functions and common state management
 */
export function useCommon() {
  const { user, isSuperAdmin, isAdmin, isBranchAdmin } = useAuth();
  const { showToast, showSuccess, showError, showWarning } = useToast();

  // Common loading states
  const loading = ref(false);
  const saving = ref(false);
  const error = ref<string | null>(null);

  // Common computed properties
  const canManageAllSchools = computed(() => isSuperAdmin.value);
  const canManageSchool = computed(() => isSuperAdmin.value || isAdmin.value);
  const canManageBranch = computed(
    () => isSuperAdmin.value || isAdmin.value || isBranchAdmin.value
  );

  // Common utility functions
  const formatDate = (date: string | Date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (date: string | Date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  // VueUse debounce function - more efficient and Vue-optimized
  const createDebouncedFn = <T extends (...args: any[]) => any>(func: T, wait: number) => {
    return useDebounceFn(func, wait);
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone: string) => {
    const re = /^[\+]?[1-9][\d]{0,15}$/;
    return re.test(phone.replace(/\s/g, ''));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess('Copied to clipboard');
    } catch (err) {
      showError('Failed to copy to clipboard');
    }
  };

  const downloadFile = (data: Blob, filename: string, type: string) => {
    const blob = new Blob([data], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const resetState = () => {
    loading.value = false;
    saving.value = false;
    error.value = null;
  };

  return {
    // State
    loading,
    saving,
    error,

    // Computed
    canManageAllSchools,
    canManageSchool,
    canManageBranch,

    // Utility functions
    formatDate,
    formatDateTime,
    formatCurrency,
    generateId,
    createDebouncedFn,
    validateEmail,
    validatePhone,
    copyToClipboard,
    downloadFile,
    resetState
  };
}
