import { ref, reactive, computed, readonly } from 'vue'

export interface FieldError {
  field: string
  message: string
}

export interface ValidationState {
  errors: Record<string, string>
  hasErrors: boolean
  errorCount: number
}

// Enhanced error message mapping for better user experience
const ERROR_MESSAGE_MAP = {
  // Student field errors
  'student.first_name': 'First name is required and must be at least 2 characters long',
  'student.last_name': 'Last name is required and must be at least 2 characters long',
  'student.email': 'Please enter a valid email address (e.g., student@example.com)',
  'student.date_of_birth': 'Please enter a valid date of birth',
  'student.gender': 'Please select a gender',
  'student.mobile_no': 'Please enter a valid mobile number (10 digits)',
  'student.aadhaar_number': 'Aadhaar number must be exactly 12 digits',
  
  // Academic field errors
  'admission_number': 'Admission number is required and must be unique',
  'roll_number': 'Roll number must be unique within the same class and section',
  'admission_date': 'Admission date is required',
  'class_id': 'Please select a class',
  'section_id': 'Please select a section',
  'academic_year_id': 'Please select an academic year',
  'category': 'Please select a category',
  'admission_type': 'Please select an admission type',
  
  // Guardian field errors
  'guardian.name': 'Guardian name is required',
  'guardian.relation': 'Please select the relationship with the student',
  'guardian.mobile_no': 'Guardian mobile number is required (10 digits)',
  'guardian.email': 'Please enter a valid guardian email address',
  'guardian.address': 'Guardian address is required',
  'guardian.occupation': 'Guardian occupation (optional)',
  'guardian.education': 'Guardian education qualification (optional)',
  'guardian.income': 'Guardian annual income (optional)',
  
  // Login field errors
  'login.username': 'Username is required if providing login details',
  'login.password': 'Password is required if providing login details',
  'login.retype_password': 'Password confirmation is required if providing login details',
  
  // General errors
  'general': 'An error occurred. Please check your input and try again.',
  'network': 'Network error. Please check your connection and try again.',
  'server': 'Server error occurred. Please try again or contact support.',
  'validation': 'Please correct the errors in the form before submitting.',
  'duplicate': 'This record already exists. Please use a different value.',
  'permission': 'You do not have permission to perform this action.',
  'not_found': 'The requested resource was not found.',
  'timeout': 'Request timed out. Please try again.',
}

// Field name mapping for better display
const FIELD_NAME_MAP = {
  'student.first_name': 'Student First Name',
  'student.last_name': 'Student Last Name',
  'student.email': 'Student Email',
  'student.date_of_birth': 'Date of Birth',
  'student.gender': 'Gender',
  'student.mobile_no': 'Mobile Number',
  'student.aadhaar_number': 'Aadhaar Number',
  'student.address': 'Address',
  'student.city': 'City',
  'student.state': 'State',
  'student.religion': 'Religion',
  'student.caste': 'Caste',
  'student.blood_group': 'Blood Group',
  'student.mother_tongue': 'Mother Tongue',
  
  'admission_number': 'Admission Number',
  'roll_number': 'Roll Number',
  'admission_date': 'Admission Date',
  'class_id': 'Class',
  'section_id': 'Section',
  'academic_year_id': 'Academic Year',
  'category': 'Category',
  'admission_type': 'Admission Type',
  
  'guardian.name': 'Guardian Name',
  'guardian.relation': 'Relationship',
  'guardian.mobile_no': 'Guardian Mobile',
  'guardian.email': 'Guardian Email',
  'guardian.address': 'Guardian Address',
  'guardian.occupation': 'Occupation',
  'guardian.education': 'Education',
  'guardian.income': 'Annual Income',
  'guardian.father_name': 'Father Name',
  'guardian.mother_name': 'Mother Name',
  'guardian.city': 'Guardian City',
  'guardian.state': 'Guardian State',
  
  'login.username': 'Username',
  'login.password': 'Password',
  'login.retype_password': 'Password Confirmation',
}

export function useFormValidation() {
  const fieldErrors = reactive<Record<string, string>>({})
  const isSubmitting = ref(false)

  // Clear all errors
  const clearErrors = () => {
    Object.keys(fieldErrors).forEach(key => {
      delete fieldErrors[key]
    })
  }

  // Clear specific field error
  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      delete fieldErrors[field]
    }
  }

  // Set field error with enhanced message
  const setFieldError = (field: string, message: string) => {
    // Use enhanced error message if available
    const enhancedMessage = ERROR_MESSAGE_MAP[field as keyof typeof ERROR_MESSAGE_MAP] || message
    fieldErrors[field] = enhancedMessage
  }

  // Set multiple field errors with enhanced messages
  const setFieldErrors = (errors: Record<string, string>) => {
    Object.entries(errors).forEach(([field, message]) => {
      setFieldError(field, message)
    })
  }

  // Enhanced API error handler with better error categorization
  const handleApiError = (error: any) => {
    clearErrors()
    
    console.error('🔍 handleApiError called with:', error)
    
    // Handle different error response formats
    if (error?.response?.data?.errors) {
      // Standard API error format with field-specific errors
      const apiErrors = error.response.data.errors
      Object.entries(apiErrors).forEach(([field, message]) => {
        // Enhance common error messages
        let enhancedMessage = message as string
        
        // Handle common backend error patterns
        if (typeof message === 'string') {
          if (message.includes('already exists')) {
            enhancedMessage = `This ${getFieldDisplayName(field)} is already in use. Please choose a different value.`
          } else if (message.includes('required')) {
            enhancedMessage = `${getFieldDisplayName(field)} is required.`
          } else if (message.includes('invalid')) {
            enhancedMessage = `Please enter a valid ${getFieldDisplayName(field).toLowerCase()}.`
          } else if (message.includes('must be')) {
            enhancedMessage = message // Keep validation rules as is
          } else if (message.includes('unique')) {
            enhancedMessage = `This ${getFieldDisplayName(field).toLowerCase()} must be unique.`
          }
        }
        
        setFieldError(field, enhancedMessage)
      })
    } else if (error?.response?.data?.message) {
      // API error with general message
      const message = error.response.data.message
      let enhancedMessage = message
      
      // Categorize general errors
      if (message.includes('duplicate') || message.includes('already exists')) {
        enhancedMessage = 'This record already exists. Please use a different value.'
        setFieldError('general', enhancedMessage)
      } else if (message.includes('validation')) {
        enhancedMessage = 'Please check your input and correct any errors.'
        setFieldError('validation', enhancedMessage)
      } else if (message.includes('permission') || message.includes('unauthorized')) {
        enhancedMessage = 'You do not have permission to perform this action.'
        setFieldError('permission', enhancedMessage)
      } else if (message.includes('not found')) {
        enhancedMessage = 'The requested resource was not found.'
        setFieldError('not_found', enhancedMessage)
      } else {
        setFieldError('general', enhancedMessage)
      }
    } else if (error?.errors) {
      // Direct errors object
      setFieldErrors(error.errors)
    } else if (error?.message) {
      // General error message
      setFieldError('general', error.message)
    } else if (error?.response?.status) {
      // HTTP status error without specific message
      const status = error.response.status
      let message = 'An error occurred'
      let errorType = 'general'
      
      switch (status) {
        case 400:
          message = 'Please check your input and try again.'
          errorType = 'validation'
          break
        case 401:
          message = 'Please log in again to continue.'
          errorType = 'permission'
          break
        case 403:
          message = 'You do not have permission to perform this action.'
          errorType = 'permission'
          break
        case 404:
          message = 'The requested resource was not found.'
          errorType = 'not_found'
          break
        case 409:
          message = 'This record already exists. Please use a different value.'
          errorType = 'duplicate'
          break
        case 422:
          message = 'Please correct the errors in the form before submitting.'
          errorType = 'validation'
          break
        case 500:
          message = 'Server error occurred. Please try again or contact support.'
          errorType = 'server'
          break
        case 503:
          message = 'Service temporarily unavailable. Please try again later.'
          errorType = 'server'
          break
        default:
          message = `Server error (${status}). Please try again.`
          errorType = 'server'
      }
      
      setFieldError(errorType, message)
    } else if (error?.request) {
      // Network error
      setFieldError('network', 'Network error. Please check your connection and try again.')
    } else {
      // Fallback error message
      setFieldError('general', 'An unexpected error occurred. Please try again.')
    }
  }

  // Get field display name for better error messages
  const getFieldDisplayName = (field: string): string => {
    return FIELD_NAME_MAP[field as keyof typeof FIELD_NAME_MAP] || 
           field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  // Check if a field has an error
  const hasFieldError = (field: string): boolean => {
    return !!fieldErrors[field]
  }

  // Get error message for a field
  const getFieldError = (field: string): string => {
    return fieldErrors[field] || ''
  }

  // Get all error messages
  const getAllErrors = (): string[] => {
    return Object.values(fieldErrors)
  }

  // Get categorized errors for better display
  const getCategorizedErrors = () => {
    const categorized = {
      field: {} as Record<string, string>,
      general: [] as string[],
      validation: [] as string[],
      network: [] as string[],
      server: [] as string[],
      permission: [] as string[],
      duplicate: [] as string[],
      not_found: [] as string[],
      timeout: [] as string[]
    }

    Object.entries(fieldErrors).forEach(([field, message]) => {
      if (['general', 'validation', 'network', 'server', 'permission', 'duplicate', 'not_found', 'timeout'].includes(field)) {
        (categorized[field as keyof typeof categorized] as string[]).push(message)
      } else {
        categorized.field[field] = message
      }
    })

    return categorized
  }

  // Check if form has any errors
  const hasErrors = computed(() => {
    return Object.keys(fieldErrors).length > 0
  })

  // Get error count
  const errorCount = computed(() => {
    return Object.keys(fieldErrors).length
  })

  // Get validation state
  const validationState = computed<ValidationState>(() => ({
    errors: { ...fieldErrors },
    hasErrors: hasErrors.value,
    errorCount: errorCount.value
  }))

  return {
    // State
    fieldErrors: readonly(fieldErrors),
    isSubmitting,
    hasErrors,
    errorCount,
    validationState,

    // Methods
    clearErrors,
    clearFieldError,
    setFieldError,
    setFieldErrors,
    handleApiError,
    hasFieldError,
    getFieldError,
    getAllErrors,
    getCategorizedErrors,
    getFieldDisplayName
  }
} 