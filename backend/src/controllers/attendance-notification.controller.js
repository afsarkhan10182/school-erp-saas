const { 
  sendAbsenteeNotifications, 
  sendLateArrivalNotifications,
  sendAttendanceSummaryNotifications 
} = require('../services/attendance-notification.service');
const { Student, Parent, StudentParent, Class, Section, Branch, School } = require('../models');
const { Op } = require('sequelize');
const ApiError = require('../utils/ApiError');
const { logger } = require('../utils/logger');
const { apiResponse } = require('../utils/apiResponse');

/**
 * Send absence notifications to parents
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const sendAbsenceNotifications = async (req, res, next) => {
  try {
    const { absentStudents, sessionData } = req.body;

    // Validation
    if (!absentStudents || !Array.isArray(absentStudents) || absentStudents.length === 0) {
      throw new ApiError(400, 'Absent students data is required');
    }

    if (!sessionData || !sessionData.date || !sessionData.class_id) {
      throw new ApiError(400, 'Session data with date and class_id is required');
    }

    // Validate that all students belong to the user's school/branch
    const userSchoolId = req.school_id;
    const userBranchId = req.branch_id;

    const studentIds = absentStudents.map(student => student.student_id);
    const studentCheck = await Student.findAll({
      where: {
        id: { [Op.in]: studentIds },
        school_id: userSchoolId,
        ...(userBranchId && { branch_id: userBranchId }),
        is_active: true,
      },
      attributes: ['id'],
    });

    if (studentCheck.length !== studentIds.length) {
      throw new ApiError(400, 'Some students do not belong to your school or are inactive');
    }

    logger.info(`Processing absence notifications for ${absentStudents.length} students`, {
      schoolId: userSchoolId,
      branchId: userBranchId,
      sessionDate: sessionData.date,
    });

    // Send notifications
    const results = await sendAbsenteeNotifications(absentStudents, sessionData);

    logger.info('Absence notifications completed', results);

    return res.status(200).json(apiResponse(200, 'Absence notifications sent successfully', results));
  } catch (error) {
    logger.error('Error sending absence notifications:', error);
    next(error);
  }
};

/**
 * Send late arrival notifications to parents
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const handleSendLateArrivalNotifications = async (req, res, next) => {
  try {
    const { lateStudents, sessionData } = req.body;

    // Validation
    if (!lateStudents || !Array.isArray(lateStudents) || lateStudents.length === 0) {
      throw new ApiError(400, 'Late students data is required');
    }

    if (!sessionData || !sessionData.date || !sessionData.class_id) {
      throw new ApiError(400, 'Session data with date and class_id is required');
    }

    // Validate that all students belong to the user's school/branch
    const userSchoolId = req.school_id;
    const userBranchId = req.branch_id;

    const studentIds = lateStudents.map(student => student.student_id);
    const studentCheck = await Student.findAll({
      where: {
        id: { [Op.in]: studentIds },
        school_id: userSchoolId,
        ...(userBranchId && { branch_id: userBranchId }),
        is_active: true,
      },
      attributes: ['id'],
    });

    if (studentCheck.length !== studentIds.length) {
      throw new ApiError(400, 'Some students do not belong to your school or are inactive');
    }

    logger.info(`Processing late arrival notifications for ${lateStudents.length} students`, {
      schoolId: userSchoolId,
      branchId: userBranchId,
      sessionDate: sessionData.date,
    });

    // Send notifications
    const results = await sendLateArrivalNotifications(lateStudents, sessionData);

    logger.info('Late arrival notifications completed', results);

    return res.status(200).json(apiResponse(200, 'Late arrival notifications sent successfully', results));
  } catch (error) {
    logger.error('Error sending late arrival notifications:', error);
    next(error);
  }
};

/**
 * Send attendance summary notifications
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const sendAttendanceSummary = async (req, res, next) => {
  try {
    const { classData, sessionData } = req.body;

    // Validation
    if (!sessionData || !sessionData.date || !sessionData.class_id) {
      throw new ApiError(400, 'Session data with date and class_id is required');
    }

    if (!classData) {
      throw new ApiError(400, 'Class data is required');
    }

    // Validate that the class belongs to the user's school/branch
    const userSchoolId = req.school_id;
    const userBranchId = req.branch_id;

    const classCheck = await Class.findOne({
      where: {
        id: sessionData.class_id,
        school_id: userSchoolId,
        ...(userBranchId && { branch_id: userBranchId }),
        is_active: true,
      },
    });

    if (!classCheck) {
      throw new ApiError(400, 'Class does not belong to your school or is inactive');
    }

    // Add school context to classData
    const enhancedClassData = {
      ...classData,
      school_id: userSchoolId,
      branch_id: userBranchId,
    };

    logger.info(`Processing attendance summary notifications for class ${sessionData.class_id}`, {
      schoolId: userSchoolId,
      branchId: userBranchId,
      sessionDate: sessionData.date,
    });

    // Send notifications
    const results = await sendAttendanceSummaryNotifications(enhancedClassData, sessionData);

    logger.info('Attendance summary notifications completed', results);

    return res.status(200).json(apiResponse(200, 'Attendance summary notifications sent successfully', results));
  } catch (error) {
    logger.error('Error sending attendance summary notifications:', error);
    next(error);
  }
};

/**
 * Get notification settings for the school
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getNotificationSettings = async (req, res, next) => {
  try {
    const userSchoolId = req.school_id;
    const userBranchId = req.branch_id;

    // Get school information
    const school = await School.findByPk(userSchoolId, {
      attributes: ['id', 'name', 'email', 'phone'],
      include: [
        {
          model: Branch,
          where: userBranchId ? { id: userBranchId } : {},
          required: false,
          attributes: ['id', 'name', 'email', 'phone'],
        },
      ],
    });

    if (!school) {
      throw new ApiError(404, 'School not found');
    }

    // Get count of students with parent contact information
    const studentStats = await Student.findAndCountAll({
      where: {
        school_id: userSchoolId,
        ...(userBranchId && { branch_id: userBranchId }),
        is_active: true,
      },
      include: [
        {
          model: Parent,
          through: 'StudentParent',
          required: true,
          where: {
            [Op.or]: [
              { father_email: { [Op.ne]: null } },
              { mother_email: { [Op.ne]: null } },
              { guardian_email: { [Op.ne]: null } },
            ],
          },
          attributes: [],
        },
      ],
      distinct: true,
    });

    const totalStudents = await Student.count({
      where: {
        school_id: userSchoolId,
        ...(userBranchId && { branch_id: userBranchId }),
        is_active: true,
      },
    });

    const settings = {
      school: {
        id: school.id,
        name: school.name,
        email: school.email,
        phone: school.phone,
      },
      branches: school.Branches || [],
      statistics: {
        totalStudents,
        studentsWithParentEmail: studentStats.count,
        coveragePercentage: totalStudents > 0 ? Math.round((studentStats.count / totalStudents) * 100) : 0,
      },
      notificationTypes: {
        absence: {
          enabled: true,
          description: 'Send notifications when students are marked absent',
        },
        lateArrival: {
          enabled: true,
          description: 'Send notifications when students arrive late',
        },
        dailySummary: {
          enabled: true,
          description: 'Send daily attendance summary to parents',
        },
      },
    };

    return res.status(200).json(apiResponse(200, 'Notification settings retrieved successfully', settings));
  } catch (error) {
    logger.error('Error getting notification settings:', error);
    next(error);
  }
};



module.exports = {
  sendAbsenceNotifications,
  sendLateArrivalNotifications: handleSendLateArrivalNotifications,
  sendAttendanceSummary,
  getNotificationSettings,
};