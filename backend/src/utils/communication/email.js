const nodemailer = require('nodemailer');
const config = require('~/config/config');
const { logger } = require('../shared/logger');
const ApiError = require('../shared/ApiError');
const httpStatus = require('http-status');
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure, // true for 465, false for other ports
  auth: {
    user: config.email.auth.user,
    pass: config.email.auth.pass
  },
  // In development, log to console
  logger: config.env === 'development',
  debug: config.env === 'development'
});

// Verify connection configuration
transporter.verify(error => {
  if (error) {
    logger.error('Error with email configuration:', error);
  } else {
    logger.info('Email server is ready to send messages');
  }
});

/**
 * Compile an EJS template
 * @param {string} templateName - Name of the template file (without extension)
 * @param {Object} data - Data to pass to the template
 * @returns {Promise<string>} - Rendered HTML
 */
const compileTemplate = async (templateName, data = {}) => {
  try {
    const { resolveTemplatesPath } = require('~/utils/shared/pathHelper');
    const templatePath = resolveTemplatesPath('email', `${templateName}.ejs`);
    const template = await fs.promises.readFile(templatePath, 'utf-8');
    return ejs.render(template, data);
  } catch (error) {
    logger.error('Error compiling email template:', error);
    throw new Error('Failed to compile email template');
  }
};

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string|string[]} options.to - Recipient email address(es)
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text body
 * @param {string} [options.html] - HTML body
 * @param {string} [options.template] - Template name (without .ejs extension)
 * @param {Object} [options.templateData] - Data to pass to the template
 * @param {Array} [options.attachments] - Array of attachments
 * @returns {Promise<Object>} - Result from nodemailer
 */
const sendEmail = async options => {
  try {
    const { to, subject, text, html, template, templateData = {}, attachments = [] } = options;

    // If template is provided, compile it
    let htmlContent = html;
    if (template) {
      htmlContent = await compileTemplate(template, templateData);
    }

    const mailOptions = {
      from: config.email.from,
      to,
      subject,
      text,
      html: htmlContent,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Error sending email:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send email', false, {
      error: error.message
    });
  }
};

/**
 * Send a password reset email
 * @param {string} to - Recipient email address
 * @param {string} token - Password reset token
 * @param {string} name - User's name
 * @returns {Promise<Object>} - Result from nodemailer
 */
const sendPasswordResetEmail = async (to, token, name) => {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;

  return sendEmail({
    to,
    subject: 'Reset Your Password',
    template: 'password-reset',
    templateData: {
      name,
      resetUrl,
      appName: config.appName,
      supportEmail: config.supportEmail
    }
  });
};

/**
 * Send a welcome email
 * @param {string} to - Recipient email address
 * @param {string} name - User's name
 * @param {string} [password] - Temporary password (if applicable)
 * @returns {Promise<Object>} - Result from nodemailer
 */
const sendWelcomeEmail = async (to, name, password = null) => {
  const loginUrl = `${config.frontendUrl}/login`;

  return sendEmail({
    to,
    subject: `Welcome to ${config.appName}!`,
    template: 'welcome',
    templateData: {
      name,
      loginUrl,
      password,
      appName: config.appName,
      supportEmail: config.supportEmail
    }
  });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  transporter
};
