/**
 * Common formatters and utilities for the School ERP SaaS
 * Following Rule #2: Move all common/repeated logic into /utils
 */

/**
 * Format date to display string
 * @param date - Date string or Date object
 * @param format - Format type ('short', 'long', 'time')
 * @returns Formatted date string
 */
export const formatDate = (
  date: string | Date,
  format: 'short' | 'long' | 'time' = 'short'
): string => {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return '';

  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString();
    case 'long':
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'time':
      return dateObj.toLocaleString();
    default:
      return dateObj.toLocaleDateString();
  }
};

/**
 * Format currency amount
 * @param amount - Amount to format
 * @param currency - Currency code (default: 'INR')
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  if (amount === null || amount === undefined) return '₹0';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Get initials from name
 * @param name - Full name
 * @returns Initials string
 */
export const getInitials = (name: string): string => {
  if (!name) return '??';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Format phone number
 * @param phone - Phone number string
 * @returns Formatted phone number
 */
export const formatPhone = (phone: string): string => {
  if (!phone) return '';

  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');

  // Format as +91 XXXXX XXXXX for Indian numbers
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }

  return phone;
};

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Format file size
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Generate random ID
 * @param length - Length of ID
 * @returns Random ID string
 */
export const generateId = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Validate email format
 * @param email - Email to validate
 * @returns Boolean indicating if email is valid
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 * @param phone - Phone number to validate
 * @returns Boolean indicating if phone is valid
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Validate UUID format
 * @param uuid - UUID to validate
 * @returns Boolean indicating if UUID is valid
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Calculate age from date of birth
 * @param dateOfBirth - Date of birth
 * @returns Age in years
 */
export const calculateAge = (dateOfBirth: string | Date): number => {
  if (!dateOfBirth) return 0;

  const birthDate = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();

  if (isNaN(birthDate.getTime())) return 0;

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

/**
 * Get status badge class based on status
 * @param status - Status string
 * @param type - Type of status (default: 'general')
 * @returns CSS class string
 */
export const getStatusBadgeClass = (
  status: string,
  type: 'general' | 'academic' | 'financial' = 'general'
): string => {
  const statusLower = status?.toLowerCase() || '';

  const statusClasses = {
    general: {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      inactive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    },
    academic: {
      passed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      absent: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      present: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    },
    financial: {
      paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      unpaid: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
  };

  const typeClasses = statusClasses[type] as Record<string, string>;
  const generalClasses = statusClasses.general as Record<string, string>;
  return (
    typeClasses[statusLower] ||
    generalClasses[statusLower] ||
    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  );
};
