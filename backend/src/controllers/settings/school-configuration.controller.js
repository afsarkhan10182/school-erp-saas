const { School, User } = require('~/models');
const { logger } = require('~/utils/logger');
const { success, error, asyncHandler } = require('~/utils/apiResponse');
const ApiError = require('~/utils/ApiError');
const { verifyToken, authorize } = require('~/middleware/auth');

class SchoolConfigurationController {
  // Get school configuration
  static getSchoolConfiguration = asyncHandler(async (req, res) => {
    const user = req.user;
    const schoolId = user.school_id;

    if (!schoolId) {
      throw new ApiError(400, 'No school assigned to user');
    }

    const school = await School.findByPk(schoolId, {
      attributes: [
        'id',
        'name',
        'code',
        'email',
        'phone',
        'website',
        'address',
        'city',
        'state',
        'postal_code',
        'country',
        'timezone',
        'currency',
        'date_format',
        'current_academic_year_id',
        'settings'
      ]
    });

    if (!school) {
      throw new ApiError(404, 'School not found');
    }

    // Get settings from JSONB field with defaults
    const settings = school.settings || {};

    // Organize data into sections
    const schoolInfo = {
      name: school.name,
      code: school.code,
      type: settings.type || '',
      establishmentYear: settings.establishment_year || '',
      principalName: settings.principal_name || '',
      principalEmail: settings.principal_email || ''
    };

    const contactInfo = {
      phone: school.phone || '',
      email: school.email || '',
      website: school.website || '',
      address: school.address || '',
      city: school.city || '',
      state: school.state || '',
      postalCode: school.postal_code || '',
      country: school.country || ''
    };

    const operationalSettings = {
      defaultAcademicYear: school.current_academic_year_id || '',
      defaultCurrency: school.currency || 'USD',
      timezone: school.timezone || 'UTC',
      dateFormat: school.date_format || 'MM/DD/YYYY'
    };

    success(res, {
      schoolInfo,
      contactInfo,
      operationalSettings
    });
  });

  // Update school configuration
  static updateSchoolConfiguration = asyncHandler(async (req, res) => {
    const user = req.user;
    const schoolId = user.school_id;
    const { schoolInfo, contactInfo, operationalSettings } = req.body;

    if (!schoolId) {
      throw new ApiError(400, 'No school assigned to user');
    }

    const school = await School.findByPk(schoolId);
    if (!school) {
      throw new ApiError(404, 'School not found');
    }

    // Prepare update data
    const updateData = {};
    const settingsUpdate = { ...school.settings };

    if (schoolInfo) {
      updateData.name = schoolInfo.name;
      updateData.code = schoolInfo.code;
      settingsUpdate.type = schoolInfo.type;
      settingsUpdate.establishment_year = schoolInfo.establishmentYear;
      settingsUpdate.principal_name = schoolInfo.principalName;
      settingsUpdate.principal_email = schoolInfo.principalEmail;
    }

    if (contactInfo) {
      updateData.phone = contactInfo.phone;
      updateData.email = contactInfo.email;
      updateData.website = contactInfo.website;
      updateData.address = contactInfo.address;
      updateData.city = contactInfo.city;
      updateData.state = contactInfo.state;
      updateData.postal_code = contactInfo.postalCode;
      updateData.country = contactInfo.country;
    }

    if (operationalSettings) {
      updateData.current_academic_year_id = operationalSettings.defaultAcademicYear;
      updateData.currency = operationalSettings.defaultCurrency;
      updateData.timezone = operationalSettings.timezone;
      updateData.date_format = operationalSettings.dateFormat;
    }

    updateData.settings = settingsUpdate;
    updateData.updated_by = user.id;

    // Update school
    await school.update(updateData);

    logger.info('School configuration updated', {
      schoolId,
      updatedBy: user.id,
      updatedFields: Object.keys(updateData)
    });

    success(res, { message: 'School configuration updated successfully' });
  });
}

module.exports = SchoolConfigurationController;
