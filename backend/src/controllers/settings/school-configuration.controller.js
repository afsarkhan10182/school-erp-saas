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
        'logo',
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
      principalEmail: settings.principal_email || '',
      logo: school.logo || ''
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

    // Handle both JSON and FormData requests
    let schoolInfo, contactInfo, operationalSettings;

    // Check if req.body exists and has the expected structure
    if (!req.body) {
      throw new ApiError(400, 'Request body is required');
    }

    if (req.body.schoolInfo && typeof req.body.schoolInfo === 'string') {
      // FormData request - parse JSON strings
      try {
        schoolInfo = JSON.parse(req.body.schoolInfo);
        contactInfo = JSON.parse(req.body.contactInfo);
        operationalSettings = JSON.parse(req.body.operationalSettings);
      } catch (parseError) {
        throw new ApiError(400, 'Invalid JSON in request body');
      }
    } else if (req.body.schoolInfo && typeof req.body.schoolInfo === 'object') {
      // JSON request - direct object access
      ({ schoolInfo, contactInfo, operationalSettings } = req.body);
    } else {
      throw new ApiError(
        400,
        'Invalid request format. Expected schoolInfo, contactInfo, and operationalSettings'
      );
    }

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
      // School code cannot be changed - it's used for student IDs, receipts, and file storage
      // updateData.code = schoolInfo.code; // REMOVED - School code is immutable
      settingsUpdate.type = schoolInfo.type;
      settingsUpdate.establishment_year = schoolInfo.establishmentYear;
      settingsUpdate.principal_name = schoolInfo.principalName;
      settingsUpdate.principal_email = schoolInfo.principalEmail;

      // Handle school logo upload
      const schoolLogoFile = req.files?.schoolLogo?.[0];
      if (schoolLogoFile) {
        // New logo file uploaded
        updateData.logo = schoolLogoFile.filename;
      } else if (
        schoolInfo.logo !== undefined &&
        schoolInfo.logo !== '' &&
        schoolInfo.logo !== null
      ) {
        // Keep existing logo if no new file uploaded and logo is not empty/null
        updateData.logo = schoolInfo.logo;
      }
      // If schoolInfo.logo is undefined, empty string, or null, don't update the logo field
      // This preserves the existing logo in the database
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

    // Fetch updated school data to return to frontend
    const updatedSchool = await School.findByPk(schoolId, {
      attributes: [
        'id',
        'name',
        'code',
        'logo',
        'phone',
        'email',
        'address',
        'city',
        'state',
        'postal_code',
        'country',
        'website',
        'currency',
        'timezone',
        'date_format',
        'current_academic_year_id',
        'settings'
      ]
    });

    logger.info('School configuration updated', {
      schoolId,
      updatedBy: user.id,
      updatedFields: Object.keys(updateData)
    });

    success(
      res,
      {
        school: updatedSchool
      },
      'School configuration updated successfully'
    );
  });
}

module.exports = SchoolConfigurationController;
