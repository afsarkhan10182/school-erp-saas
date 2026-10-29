const {
  sendAbsenteeNotifications,
  sendLateArrivalNotifications,
  sendAttendanceSummaryNotifications
} = require('~/services/academic/attendance-notification.service');
const {
  Student,
  Parent,
  StudentParent,
  Class,
  Section,
  Branch,
  School,
  ClassTeacher,
  SubjectTeacher
} = require('~/models');
const { Op } = require('sequelize');
const { getTeacherStudentWhere } = require('~/utils/academic/teacherStudentScope');
const ApiError = require('~/utils/shared/ApiError');
const { logger } = require('~/utils/shared/logger');
const { apiResponse } = require('~/utils/shared/apiResponse');

const getNotificationScope = async (req, sessionData, studentIds) => {
  const schoolId = req.school_id || req.schoolId;
  const branchId = req.branch_id || req.branchId || req.user.branch_id;
  if (!schoolId) throw new ApiError(400, 'School context is required');

  const classRecord = await Class.findOne({
    where: {
      id: sessionData.class_id,
      school_id: schoolId,
      ...(branchId && { branch_id: branchId }),
      is_active: true
    },
    attributes: ['id', 'name', 'school_id', 'branch_id']
  });

  if (!classRecord) throw new ApiError(404, 'Class not found in your school or branch');

  if (sessionData.section_id) {
    const section = await Section.findOne({
      where: {
        id: sessionData.section_id,
        class_id: classRecord.id,
        school_id: schoolId,
        branch_id: classRecord.branch_id
      },
      attributes: ['id']
    });
    if (!section) throw new ApiError(400, 'Section does not belong to this class');
  }

  const studentWhere = {
    school_id: schoolId,
    branch_id: classRecord.branch_id,
    class_id: classRecord.id,
    is_active: true,
    ...(sessionData.section_id && { section_id: sessionData.section_id }),
    ...(sessionData.stream_id && { stream_id: sessionData.stream_id })
  };

  if (req.user.role === 'teacher') {
    const academicYear = sessionData.academic_year;
    if (!academicYear)
      throw new ApiError(400, 'academic_year is required for teacher notifications');

    const assignmentWhere = {
      teacher_id: req.user.id,
      school_id: schoolId,
      class_id: classRecord.id,
      branch_id: classRecord.branch_id,
      academic_year: academicYear,
      is_active: true
    };
    const subjectAssignmentWhere = { ...assignmentWhere };
    delete subjectAssignmentWhere.is_active;
    const [classAssignments, subjectAssignments] = await Promise.all([
      ClassTeacher.findAll({
        where: assignmentWhere,
        attributes: ['section_id', 'stream_id']
      }),
      SubjectTeacher.findAll({
        where: subjectAssignmentWhere,
        attributes: ['section_id', 'stream_id']
      })
    ]);

    const matchesScope = assignment =>
      (!assignment.section_id || assignment.section_id === (sessionData.section_id || null)) &&
      (!assignment.stream_id || assignment.stream_id === (sessionData.stream_id || null));
    if (![...classAssignments, ...subjectAssignments].some(matchesScope)) {
      throw new ApiError(403, 'Class is not assigned to this teacher');
    }

    studentWhere[Op.and] = [
      await getTeacherStudentWhere({ teacherId: req.user.id, schoolId, academicYear })
    ];
  }

  if (studentIds) {
    const uniqueStudentIds = [...new Set(studentIds)];
    if (
      uniqueStudentIds.length !== studentIds.length ||
      uniqueStudentIds.some(id => typeof id !== 'string' || !id.trim())
    ) {
      throw new ApiError(400, 'Student IDs must be present and unique');
    }
    const students = await Student.findAll({
      where: { ...studentWhere, id: { [Op.in]: uniqueStudentIds } },
      attributes: ['id']
    });
    if (students.length !== uniqueStudentIds.length) {
      throw new ApiError(400, 'Some students are outside the authorized class or branch');
    }
  }

  return { classRecord, studentWhere };
};

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

    const studentIds = absentStudents.map(student => student.student_id);
    const { classRecord } = await getNotificationScope(req, sessionData, studentIds);

    logger.info(`Processing absence notifications for ${absentStudents.length} students`, {
      schoolId: classRecord.school_id,
      branchId: classRecord.branch_id,
      sessionDate: sessionData.date
    });

    // Send notifications
    const results = await sendAbsenteeNotifications(absentStudents, {
      ...sessionData,
      class_id: classRecord.id,
      branch_id: classRecord.branch_id
    });

    logger.info('Absence notifications completed', results);

    return res
      .status(200)
      .json(apiResponse(200, 'Absence notifications sent successfully', results));
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

    const studentIds = lateStudents.map(student => student.student_id);
    const { classRecord } = await getNotificationScope(req, sessionData, studentIds);

    logger.info(`Processing late arrival notifications for ${lateStudents.length} students`, {
      schoolId: classRecord.school_id,
      branchId: classRecord.branch_id,
      sessionDate: sessionData.date
    });

    // Send notifications
    const results = await sendLateArrivalNotifications(lateStudents, {
      ...sessionData,
      class_id: classRecord.id,
      branch_id: classRecord.branch_id
    });

    logger.info('Late arrival notifications completed', results);

    return res
      .status(200)
      .json(apiResponse(200, 'Late arrival notifications sent successfully', results));
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

    const { classRecord, studentWhere } = await getNotificationScope(req, sessionData);

    // Add school context to classData
    const enhancedClassData = {
      id: classRecord.id,
      name: classRecord.name,
      school_id: classRecord.school_id,
      branch_id: classRecord.branch_id
    };

    logger.info(`Processing attendance summary notifications for class ${sessionData.class_id}`, {
      schoolId: classRecord.school_id,
      branchId: classRecord.branch_id,
      sessionDate: sessionData.date
    });

    // Send notifications
    const results = await sendAttendanceSummaryNotifications(
      enhancedClassData,
      { ...sessionData, class_id: classRecord.id, branch_id: classRecord.branch_id },
      studentWhere
    );

    logger.info('Attendance summary notifications completed', results);

    return res
      .status(200)
      .json(apiResponse(200, 'Attendance summary notifications sent successfully', results));
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
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    if (!school) {
      throw new ApiError(404, 'School not found');
    }

    // Get count of students with parent contact information
    const studentStats = await Student.findAndCountAll({
      where: {
        school_id: userSchoolId,
        ...(userBranchId && { branch_id: userBranchId }),
        is_active: true
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
              { guardian_email: { [Op.ne]: null } }
            ]
          },
          attributes: []
        }
      ],
      distinct: true
    });

    const totalStudents = await Student.count({
      where: {
        school_id: userSchoolId,
        ...(userBranchId && { branch_id: userBranchId }),
        is_active: true
      }
    });

    const settings = {
      school: {
        id: school.id,
        name: school.name,
        email: school.email,
        phone: school.phone
      },
      branches: school.Branches || [],
      statistics: {
        totalStudents,
        studentsWithParentEmail: studentStats.count,
        coveragePercentage:
          totalStudents > 0 ? Math.round((studentStats.count / totalStudents) * 100) : 0
      },
      notificationTypes: {
        absence: {
          enabled: true,
          description: 'Send notifications when students are marked absent'
        },
        lateArrival: {
          enabled: true,
          description: 'Send notifications when students arrive late'
        },
        dailySummary: {
          enabled: true,
          description: 'Send daily attendance summary to parents'
        }
      }
    };

    return res
      .status(200)
      .json(apiResponse(200, 'Notification settings retrieved successfully', settings));
  } catch (error) {
    logger.error('Error getting notification settings:', error);
    next(error);
  }
};

module.exports = {
  sendAbsenceNotifications,
  sendLateArrivalNotifications: handleSendLateArrivalNotifications,
  sendAttendanceSummary,
  getNotificationSettings
};
