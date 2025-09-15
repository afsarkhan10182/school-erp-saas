const { School } = require('~/models');
const { Op } = require('sequelize');

class SystemSettingsController {
  /**
   * Get system settings for the school
   */
  static async getSystemSettings(req, res) {
    try {
      const schoolId = req.user.school_id;

      if (!schoolId) {
        return res.status(400).json({
          success: false,
          message: 'No school assigned to user'
        });
      }

      // Get school with system settings
      const school = await School.findByPk(schoolId, {
        attributes: ['id', 'name', 'systemSettings']
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
      const systemSettings = {
        ...defaultSystemSettings,
        ...(school.systemSettings || {})
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
      const schoolId = req.user.school_id;

      if (!schoolId) {
        return res.status(400).json({
          success: false,
          message: 'No school assigned to user'
        });
      }

      const { systemSettings } = req.body;

      // Validate required fields
      if (!systemSettings) {
        return res.status(400).json({
          success: false,
          message: 'System settings are required'
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

      if (
        systemSettings.defaultPaginationSize &&
        !validPaginationSizes.includes(systemSettings.defaultPaginationSize)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid pagination size'
        });
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

      // Get current school settings
      const school = await School.findByPk(schoolId);
      if (!school) {
        return res.status(404).json({
          success: false,
          message: 'School not found'
        });
      }

      // Merge with existing settings
      const currentSettings = school.systemSettings || {};
      const updatedSettings = {
        ...currentSettings,
        ...systemSettings
      };

      // Update school with new system settings
      await school.update({
        systemSettings: updatedSettings
      });

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
