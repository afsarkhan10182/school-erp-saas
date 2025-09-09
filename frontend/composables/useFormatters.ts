/**
 * Composable for formatters and utilities
 * Following Rule #2: Move all common/repeated logic into /utils
 * Following Rule #4: Follow Nuxt.js Standards - Use composables for shared logic
 */

import {
  formatDate,
  formatCurrency,
  getInitials,
  formatPhone,
  truncateText,
  formatFileSize,
  generateId,
  isValidEmail,
  isValidPhone,
  isValidUUID,
  calculateAge,
  getStatusBadgeClass
} from '~/utils/formatters';

export const useFormatters = () => {
  return {
    formatDate,
    formatCurrency,
    getInitials,
    formatPhone,
    truncateText,
    formatFileSize,
    generateId,
    isValidEmail,
    isValidPhone,
    isValidUUID,
    calculateAge,
    getStatusBadgeClass
  };
};
