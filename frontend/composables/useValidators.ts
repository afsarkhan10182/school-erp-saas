/**
 * Composable for validation utilities
 * Following Rule #2: Move all common/repeated logic into /utils
 * Following Rule #4: Follow Nuxt.js Standards - Use composables for shared logic
 */

import { validationRules, validateField, validateForm, commonSchemas } from '~/utils/validators';

export const useValidators = () => {
  return {
    validationRules,
    validateField,
    validateForm,
    commonSchemas
  };
};
