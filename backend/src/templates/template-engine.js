const ejs = require('ejs');
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('~/utils/logger');

class TemplateEngine {
  constructor() {
    this.templateCache = new Map();
    this.templateBasePath = path.join(__dirname);
  }

  /**
   * Get template path based on type and name
   */
  getTemplatePath(templateType, templateName) {
    const validTypes = ['email', 'sms', 'reports', 'pdf'];
    if (!validTypes.includes(templateType)) {
      throw new Error(
        `Invalid template type: ${templateType}. Valid types: ${validTypes.join(', ')}`
      );
    }

    const extension = templateType === 'sms' ? 'txt' : 'ejs';
    return path.join(this.templateBasePath, templateType, `${templateName}.${extension}`);
  }

  /**
   * Load template from file system with caching
   */
  async loadTemplate(templateType, templateName) {
    const cacheKey = `${templateType}:${templateName}`;

    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey);
    }

    try {
      const templatePath = this.getTemplatePath(templateType, templateName);
      const templateContent = await fs.readFile(templatePath, 'utf8');

      this.templateCache.set(cacheKey, templateContent);
      logger.info(`Template loaded and cached: ${cacheKey}`);

      return templateContent;
    } catch (error) {
      logger.error(`Error loading template ${cacheKey}:`, error);
      throw new Error(`Template not found: ${templateType}/${templateName}`);
    }
  }

  /**
   * Render template with data
   */
  async renderTemplate(templateType, templateName, data = {}, options = {}) {
    try {
      const template = await this.loadTemplate(templateType, templateName);

      const renderOptions = {
        ...options,
        root: this.templateBasePath,
        async: false
      };

      if (templateType === 'sms') {
        // For SMS templates, use simple string replacement
        return this.renderSmsTemplate(template, data);
      } else {
        // For EJS templates (email, reports, pdf)
        return ejs.render(template, data, renderOptions);
      }
    } catch (error) {
      logger.error(`Error rendering template ${templateType}/${templateName}:`, error);
      throw error;
    }
  }

  /**
   * Render SMS template with simple string replacement
   */
  renderSmsTemplate(template, data) {
    let rendered = template;

    // Replace placeholders with data values
    Object.keys(data).forEach(key => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      const value = data[key] || '';
      rendered = rendered.replace(placeholder, value);
    });

    return rendered;
  }

  /**
   * Clear template cache
   */
  clearCache() {
    this.templateCache.clear();
    logger.info('Template cache cleared');
  }

  /**
   * Get cached template count
   */
  getCacheSize() {
    return this.templateCache.size;
  }

  /**
   * List available templates
   */
  async listTemplates(templateType = null) {
    try {
      const templates = {};

      if (templateType) {
        const typePath = path.join(this.templateBasePath, templateType);
        const files = await fs.readdir(typePath);
        templates[templateType] = files.map(file => file.replace(/\.[^/.]+$/, ''));
      } else {
        const types = await fs.readdir(this.templateBasePath);
        for (const type of types) {
          const typePath = path.join(this.templateBasePath, type);
          const stat = await fs.stat(typePath);
          if (stat.isDirectory()) {
            const files = await fs.readdir(typePath);
            templates[type] = files.map(file => file.replace(/\.[^/.]+$/, ''));
          }
        }
      }

      return templates;
    } catch (error) {
      logger.error('Error listing templates:', error);
      throw error;
    }
  }

  /**
   * Validate template exists
   */
  async templateExists(templateType, templateName) {
    try {
      const templatePath = this.getTemplatePath(templateType, templateName);
      await fs.access(templatePath);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = TemplateEngine;
