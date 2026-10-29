const { sequelize, School, SettingsChangeLog } = require('~/models');
const { Transaction } = require('sequelize');

const reversibleFields = [
  'dateFormat',
  'defaultLanguage',
  'timeFormat',
  'defaultTheme',
  'defaultPaginationSize',
  'itemsPerPage',
  'showNotifications'
];

const valueState = (school, field) => {
  if (field === 'dateFormat') return { exists: true, value: school.date_format };
  const settings = school.settings || {};
  return Object.prototype.hasOwnProperty.call(settings, field)
    ? { exists: true, value: settings[field] }
    : { exists: false, value: null };
};

const sameState = (left, right) =>
  left.exists === right.exists && (!left.exists || JSON.stringify(left.value) === JSON.stringify(right.value));

class SystemSettingsController {
  /**
   * Get system settings for the school
   */
  static async getSystemSettings(req, res) {
    try {
      const schoolId = req.user.role === 'super_admin' ? req.schoolId : req.user.school_id;

      if (!schoolId) {
        return res.status(400).json({
          success: false,
          message: 'No school assigned to user'
        });
      }

      // Get school with system settings
      const school = await School.findByPk(schoolId, {
        attributes: ['id', 'name', 'date_format', 'settings']
      });

      if (!school) {
        return res.status(404).json({
          success: false,
          message: 'School not found'
        });
      }

      // Default system settings
      const defaultSystemSettings = {
        defaultLanguage: 'en',
        timeFormat: '12h',
        defaultTheme: 'light',
        defaultPaginationSize: 25,
        enabledModules: {
          hostel: false,
          transport: false,
          library: false,
          inventory: false,
          cafeteria: false,
          visitors: true
        }
      };

      // Merge with stored settings
      const storedSettings = school.settings || {};
      const savedItemsPerPage = Number(
        storedSettings.itemsPerPage ?? storedSettings.defaultPaginationSize ?? 25
      );
      const systemSettings = {
        ...defaultSystemSettings,
        ...storedSettings,
        dateFormat: school.date_format || 'DD/MM/YYYY',
        itemsPerPage: [10, 25, 50, 100].includes(savedItemsPerPage) ? savedItemsPerPage : 25,
        showNotifications: storedSettings.showNotifications !== false
      };

      res.json({
        success: true,
        data: {
          systemSettings
        }
      });
    } catch (error) {
      console.error('Error getting system settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get system settings',
        error: error.message
      });
    }
  }

  /**
   * Update system settings for the school
   */
  static async updateSystemSettings(req, res) {
    try {
      const schoolId = req.user.role === 'super_admin' ? req.schoolId : req.user.school_id;

      if (!schoolId) {
        return res.status(400).json({
          success: false,
          message: 'No school assigned to user'
        });
      }

      const { systemSettings } = req.body;

      // Validate required fields
      if (!systemSettings || typeof systemSettings !== 'object' || Array.isArray(systemSettings)) {
        return res.status(400).json({
          success: false,
          message: 'System settings must be an object'
        });
      }

      // Validate system settings structure
      const validModules = ['hostel', 'transport', 'library', 'inventory', 'cafeteria', 'visitors'];
      const validLanguages = ['en', 'es', 'fr', 'de', 'hi', 'ar'];
      const validTimeFormats = ['12h', '24h'];
      const validThemes = ['light', 'dark', 'auto'];
      const validPaginationSizes = [10, 25, 50, 100];

      if (
        systemSettings.defaultLanguage &&
        !validLanguages.includes(systemSettings.defaultLanguage)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid default language'
        });
      }

      if (systemSettings.timeFormat && !validTimeFormats.includes(systemSettings.timeFormat)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid time format'
        });
      }

      if (systemSettings.defaultTheme && !validThemes.includes(systemSettings.defaultTheme)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid default theme'
        });
      }

      if (systemSettings.defaultPaginationSize !== undefined) {
        const defaultPaginationSize = Number(systemSettings.defaultPaginationSize);
        if (!validPaginationSizes.includes(defaultPaginationSize)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid pagination size'
          });
        }
        systemSettings.defaultPaginationSize = defaultPaginationSize;
      }

      const validDateFormats = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY'];
      if (
        systemSettings.dateFormat !== undefined &&
        !validDateFormats.includes(systemSettings.dateFormat)
      ) {
        return res.status(400).json({ success: false, message: 'Invalid date format' });
      }

      if (systemSettings.itemsPerPage !== undefined) {
        const itemsPerPage = Number(systemSettings.itemsPerPage);
        if (!Number.isInteger(itemsPerPage) || !validPaginationSizes.includes(itemsPerPage)) {
          return res.status(400).json({ success: false, message: 'Invalid items per page' });
        }
        systemSettings.itemsPerPage = itemsPerPage;
      }

      if (
        systemSettings.showNotifications !== undefined &&
        typeof systemSettings.showNotifications !== 'boolean'
      ) {
        return res.status(400).json({ success: false, message: 'Invalid notification preference' });
      }

      if (systemSettings.enabledModules) {
        for (const module of Object.keys(systemSettings.enabledModules)) {
          if (!validModules.includes(module)) {
            return res.status(400).json({
              success: false,
              message: `Invalid module: ${module}`
            });
          }
        }
      }

      let updatedSettings;
      const result = await sequelize.transaction(async transaction => {
        const school = await School.findByPk(schoolId, {
          transaction,
          lock: Transaction.LOCK.UPDATE
        });
        if (!school) return null;

        const currentSettings = school.settings || {};
        updatedSettings = { ...currentSettings, ...systemSettings };
        const changes = {};
        for (const field of reversibleFields) {
          if (!Object.prototype.hasOwnProperty.call(systemSettings, field)) continue;
          const before = valueState(school, field);
          const after = { exists: true, value: systemSettings[field] };
          if (!sameState(before, after)) changes[field] = { before, after };
        }

        await school.update({
          settings: updatedSettings,
          ...(systemSettings.dateFormat ? { date_format: systemSettings.dateFormat } : {})
        }, { transaction });
        if (Object.keys(changes).length) {
          await SettingsChangeLog.create({
            school_id: schoolId,
            actor_id: req.user.id || null,
            category: 'system_preferences',
            changes
          }, { transaction });
        }
        return school;
      });
      if (!result) return res.status(404).json({ success: false, message: 'School not found' });

      res.json({
        success: true,
        message: 'System settings updated successfully',
        data: {
          systemSettings: updatedSettings
        }
      });
    } catch (error) {
      console.error('Error updating system settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update system settings',
        error: error.message
      });
    }
  }
}

module.exports = SystemSettingsController;
