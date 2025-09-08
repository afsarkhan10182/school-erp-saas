/**
 * Common validation utilities for the School ERP SaaS
 * Following Rule #2: Move all common/repeated logic into /utils
 */

/**
 * Validation rules for common fields
 */
export const validationRules = {
  required: (value: any, fieldName: string = 'Field') => {
    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
      return `${fieldName} is required`
    }
    return null
  },

  minLength: (value: string, min: number, fieldName: string = 'Field') => {
    if (value && value.length < min) {
      return `${fieldName} must be at least ${min} characters`
    }
    return null
  },

  maxLength: (value: string, max: number, fieldName: string = 'Field') => {
    if (value && value.length > max) {
      return `${fieldName} must not exceed ${max} characters`
    }
    return null
  },

  email: (value: string) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Invalid email format'
    }
    return null
  },

  phone: (value: string) => {
    if (value && !/^(\+91|91)?[6-9]\d{9}$/.test(value.replace(/\s/g, ''))) {
      return 'Invalid phone number format'
    }
    return null
  },

  uuid: (value: string) => {
    if (value && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
      return 'Invalid ID format'
    }
    return null
  },

  numeric: (value: any, fieldName: string = 'Field') => {
    if (value && isNaN(Number(value))) {
      return `${fieldName} must be a number`
    }
    return null
  },

  positiveNumber: (value: any, fieldName: string = 'Field') => {
    if (value && (isNaN(Number(value)) || Number(value) <= 0)) {
      return `${fieldName} must be a positive number`
    }
    return null
  },

  date: (value: string) => {
    if (value && isNaN(new Date(value).getTime())) {
      return 'Invalid date format'
    }
    return null
  },

  futureDate: (value: string) => {
    if (value && new Date(value) <= new Date()) {
      return 'Date must be in the future'
    }
    return null
  },

  pastDate: (value: string) => {
    if (value && new Date(value) >= new Date()) {
      return 'Date must be in the past'
    }
    return null
  },

  academicYear: (value: string) => {
    if (value && !/^\d{4}-\d{4}$/.test(value)) {
      return 'Academic year must be in YYYY-YYYY format'
    }
    return null
  },

  alphanumeric: (value: string, fieldName: string = 'Field') => {
    if (value && !/^[A-Za-z0-9_-]+$/.test(value)) {
      return `${fieldName} can only contain letters, numbers, hyphens, and underscores`
    }
    return null
  }
}

/**
 * Validate form field
 * @param value - Field value
 * @param rules - Array of validation rules
 * @param fieldName - Field name for error messages
 * @returns Error message or null
 */
export const validateField = (value: any, rules: Array<(val: any, fieldName?: string) => string | null>, fieldName?: string): string | null => {
  for (const rule of rules) {
    const error = rule(value, fieldName)
    if (error) return error
  }
  return null
}

/**
 * Validate entire form
 * @param formData - Form data object
 * @param validationSchema - Validation schema object
 * @returns Object with errors
 */
export const validateForm = (formData: Record<string, any>, validationSchema: Record<string, Array<(val: any) => string | null>>): Record<string, string> => {
  const errors: Record<string, string> = {}
  
  Object.keys(validationSchema).forEach(fieldName => {
    const value = formData[fieldName]
    const rules = validationSchema[fieldName]
    const error = validateField(value, rules, fieldName)
    
    if (error) {
      errors[fieldName] = error
    }
  })
  
  return errors
}

/**
 * Common validation schemas for forms
 */
export const commonSchemas = {
  name: [validationRules.required, (val: string) => validationRules.minLength(val, 2, 'Name')],
  email: [validationRules.required, validationRules.email],
  phone: [validationRules.required, validationRules.phone],
  uuid: [validationRules.required, validationRules.uuid],
  academicYear: [validationRules.required, validationRules.academicYear],
  code: [
    validationRules.required, 
    (val: string) => validationRules.minLength(val, 2, 'Code'),
    (val: string) => validationRules.maxLength(val, 20, 'Code'),
    validationRules.alphanumeric
  ],
  description: [(val: string) => validationRules.maxLength(val, 500, 'Description')],
  positiveNumber: [validationRules.required, validationRules.positiveNumber],
  date: [validationRules.required, validationRules.date],
  futureDate: [validationRules.required, validationRules.date, validationRules.futureDate],
  pastDate: [validationRules.required, validationRules.date, validationRules.pastDate]
}
