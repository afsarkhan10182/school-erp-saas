const { sequelize } = require('../../config/database');
const { User, School } = require('../../models');
const SchoolService = require('../../services/school/school.service');
const AuthService = require('../../services/auth/auth.service');
const { logger } = require('../../utils/logger');
const ApiError = require('../../utils/ApiError');
const { success, error, asyncHandler } = require('../../utils/apiResponse');
const { validate } = require('../../middleware/validate');
const { verifyToken, authorize } = require('../../middleware/auth');
const RedisUtils = require('../../utils/redis-utils');

class SchoolController {
  static createSchool = asyncHandler(async (req, res) => {
    const schoolData = {
      ...req.body,
      ...req.files, // Include uploaded files
    };
    const userId = req.user.id;

    // Add created_by field
    schoolData.created_by = userId;

    const school = await SchoolService.createSchool(schoolData);

    // Clear related caches
    await RedisUtils.del('cache:schools:list');
    await RedisUtils.del('cache:schools:stats');

    success(res, { school }, 'School created successfully', 201);
  });

  static getAllSchools = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search, status } = req.query;
    const user = req.user;

    logger.info('getAllSchools controller called with user:', { 
      userId: user.id, 
      userRole: user.role, 
      schoolId: user.school_id 
    });

    // Apply tenant isolation for non-super admins
    if (user.role !== 'super_admin') {
      if (user.school_id) {
        // School admin can only see their own school
        const school = await SchoolService.getSchoolById(user.school_id, user);
        return success(res, { 
          schools: [school], 
          pagination: { page: 1, limit: 1, total: 1, pages: 1 } 
        });
      } else {
        throw new ApiError(403, 'No school assigned');
      }
    }

    logger.info('Calling SchoolService.getAllSchools with params:', { page, limit, search, status });
    const result = await SchoolService.getAllSchools({ page, limit, search, status });
    logger.info('SchoolService.getAllSchools returned result:', { 
      schoolsCount: result.schools?.length, 
      pagination: result.pagination 
    });
    success(res, result);
  });

  static getSchoolById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    // Access control
    if (user.role === 'school_admin' && user.school_id !== parseInt(id)) {
      throw new ApiError(403, 'Access denied');
    }

    const school = await SchoolService.getSchoolById(id, user);
    success(res, { school });
  });

  static updateSchool = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      ...req.files, // Include uploaded files
    };
    const userId = req.user.id;

    // Add updated_by field
    updateData.updated_by = userId;

    const school = await SchoolService.updateSchool(id, updateData);

    // Clear related caches
    await RedisUtils.del(`school:${id}`);
    await RedisUtils.del('cache:schools:list');
    await RedisUtils.del('cache:schools:stats');

    success(res, { school }, 'School updated successfully');
  });

  static deleteSchool = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await SchoolService.deleteSchool(id);

    // Clear related caches
    await RedisUtils.del(`school:${id}`);
    await RedisUtils.del('cache:schools:list');
    await RedisUtils.del('cache:schools:stats');

    success(res, null, 'School deleted successfully');
  });

  static suspendSchool = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const school = await SchoolService.updateSchool(id, { 
      status: 'suspended',
      updated_by: userId 
    });

    // Clear related caches
    await RedisUtils.del(`school:${id}`);
    await RedisUtils.del('cache:schools:list');
    await RedisUtils.del('cache:schools:stats');

    success(res, { school }, 'School suspended successfully');
  });

  static reactivateSchool = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const school = await SchoolService.updateSchool(id, { 
      status: 'active',
      updated_by: userId 
    });

    // Clear related caches
    await RedisUtils.del(`school:${id}`);
    await RedisUtils.del('cache:schools:list');
    await RedisUtils.del('cache:schools:stats');

    success(res, { school }, 'School reactivated successfully');
  });

  static getMySchool = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user.school_id) {
      throw new ApiError(404, 'No school assigned to this user');
    }

    const school = await SchoolService.getSchoolById(user.school_id, user);
    success(res, { school });
  });

  static updateMySchool = asyncHandler(async (req, res) => {
    const user = req.user;
    const updateData = {
      ...req.body,
      ...req.files, // Include uploaded files
    };

    if (!user.school_id) {
      throw new ApiError(404, 'No school assigned to this user');
    }

    // Add updated_by field
    updateData.updated_by = user.id;

    const school = await SchoolService.updateSchool(user.school_id, updateData);

    // Clear related caches
    await RedisUtils.del(`school:${user.school_id}`);
    await RedisUtils.del('cache:schools:list');
    await RedisUtils.del('cache:schools:stats');

    success(res, { school }, 'School updated successfully');
  });
}

module.exports = SchoolController; 