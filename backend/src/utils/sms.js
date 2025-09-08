const config = require('~/config/config');
const logger = require('./logger');
const ApiError = require('./ApiError');
const httpStatus = require('http-status');

/**
 * SMS Service Utility
 * Base structure ready for SMS provider integration (Twilio, AWS SNS, etc.)
 */

/**
 * Send SMS notification
 * @param {Object} options - SMS options
 * @param {string} options.to - Recipient phone number in international format
 * @param {string} options.message - SMS message content
 * @param {string} [options.priority] - Message priority ('normal' | 'high')
 * @returns {Promise<Object>} - Result from SMS provider
 */
const sendSMS = async (options) => {
  try {
    const { to, message, priority = 'normal' } = options;

    // Validate phone number format
    if (!isValidPhoneNumber(to)) {
      throw new Error('Invalid phone number format');
    }

    // TODO: Integrate with SMS provider (Twilio, AWS SNS, etc.)
    // For now, we'll log the SMS instead of actually sending
    if (config.env === 'development') {
      logger.info('SMS would be sent:', {
        to,
        message: message.substring(0, 50) + '...',
        priority,
        timestamp: new Date().toISOString(),
      });
      
      return {
        success: true,
        messageId: `dev_sms_${Date.now()}`,
        provider: 'development',
      };
    }

    // Production SMS sending logic will go here
    throw new Error('SMS provider not configured. Please set up SMS service.');

  } catch (error) {
    logger.error('Error sending SMS:', error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to send SMS notification',
      false,
      { error: error.message }
    );
  }
};

/**
 * Send attendance notification SMS
 * @param {string} to - Parent/Guardian phone number
 * @param {Object} data - Notification data
 * @param {string} data.studentName - Student's name
 * @param {string} data.date - Attendance date
 * @param {string} data.status - Attendance status
 * @param {string} [data.schoolName] - School name
 * @returns {Promise<Object>} - SMS result
 */
const sendAttendanceNotificationSMS = async (to, data) => {
  const { studentName, date, status, schoolName = 'School' } = data;
  
  let message;
  switch (status) {
    case 'absent':
      message = `Dear Parent, ${studentName} was marked absent on ${date}. Please contact ${schoolName} if this is incorrect.`;
      break;
    case 'late':
      message = `Dear Parent, ${studentName} arrived late on ${date}. Please ensure punctuality.`;
      break;
    default:
      message = `Dear Parent, attendance update for ${studentName} on ${date}: ${status}.`;
  }

  return sendSMS({
    to,
    message,
    priority: status === 'absent' ? 'high' : 'normal',
  });
};

/**
 * Validate phone number format (basic validation)
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} - Whether the phone number is valid
 */
const isValidPhoneNumber = (phoneNumber) => {
  // Basic international phone number validation
  // Starts with + followed by 7-15 digits
  const phoneRegex = /^\+[1-9]\d{6,14}$/;
  return phoneRegex.test(phoneNumber);
};

/**
 * Format phone number to international format
 * @param {string} phoneNumber - Phone number to format
 * @param {string} [countryCode] - Default country code (e.g., '+91' for India)
 * @returns {string} - Formatted phone number
 */
const formatPhoneNumber = (phoneNumber, countryCode = '+91') => {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // If it starts with country code digits, add +
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return '+' + cleaned;
  }
  
  // If it's a 10-digit number, add country code
  if (cleaned.length === 10) {
    return countryCode + cleaned;
  }
  
  // Return as-is if already formatted or unknown format
  return phoneNumber;
};

module.exports = {
  sendSMS,
  sendAttendanceNotificationSMS,
  isValidPhoneNumber,
  formatPhoneNumber,
};