const { sendEmail } = require('~/utils/email');
const { sendAttendanceNotificationSMS } = require('~/utils/sms');
const logger = require('~/utils/logger');
const { Student, Parent, School, Branch, Class, Section } = require('~/models');
const { Op } = require('sequelize');

/**
 * Attendance Notification Service
 * Handles email and SMS notifications for attendance events
 */

/**
 * Send attendance notifications for absentees
 * @param {Array} absenteeData - Array of absent students with their details
 * @param {Object} sessionData - Attendance session data
 * @returns {Promise<Object>} - Notification results
 */
const sendAbsenteeNotifications = async (absenteeData, sessionData) => {
  try {
    const results = {
      totalAbsentees: absenteeData.length,
      emailsSent: 0,
      smsSent: 0,
      errors: []
    };

    for (const absentee of absenteeData) {
      try {
        const student = await Student.findByPk(absentee.student_id, {
          include: [
            {
              model: Parent,
              through: 'StudentParent',
              attributes: ['id', 'name', 'email', 'phone', 'relationship']
            },
            {
              model: Class,
              attributes: ['name']
            },
            {
              model: Section,
              attributes: ['name']
            }
          ]
        });

        if (!student) {
          results.errors.push({
            student_id: absentee.student_id,
            error: 'Student not found'
          });
          continue;
        }

        // Get school information
        const schoolInfo = await getSchoolInformation(student.branch_id);

        // Prepare notification data
        const notificationData = {
          studentName: student.name,
          studentId: student.student_id,
          className: student.Class?.name || 'Unknown',
          sectionName: student.Section?.name || 'Unknown',
          date: sessionData.date,
          attendanceType: sessionData.attendance_type,
          periodNumber: sessionData.period_number,
          remarks: absentee.remarks || '',
          schoolName: schoolInfo.schoolName,
          schoolPhone: schoolInfo.phone,
          schoolEmail: schoolInfo.email
        };

        // Send notifications to all parents/guardians
        if (student.Parents && student.Parents.length > 0) {
          for (const parent of student.Parents) {
            // Send email notification
            if (parent.email) {
              try {
                await sendAbsenteeEmailNotification(parent.email, notificationData, parent);
                results.emailsSent++;
              } catch (emailError) {
                logger.error('Failed to send email notification:', emailError);
                results.errors.push({
                  student_id: absentee.student_id,
                  parent_id: parent.id,
                  type: 'email',
                  error: emailError.message
                });
              }
            }

            // Send SMS notification
            if (parent.phone) {
              try {
                await sendAttendanceNotificationSMS(parent.phone, {
                  studentName: student.name,
                  date: sessionData.date,
                  status: 'absent',
                  schoolName: schoolInfo.schoolName
                });
                results.smsSent++;
              } catch (smsError) {
                logger.error('Failed to send SMS notification:', smsError);
                results.errors.push({
                  student_id: absentee.student_id,
                  parent_id: parent.id,
                  type: 'sms',
                  error: smsError.message
                });
              }
            }
          }
        } else {
          results.errors.push({
            student_id: absentee.student_id,
            error: 'No parent contact information found'
          });
        }
      } catch (error) {
        logger.error('Error processing absentee notification:', error);
        results.errors.push({
          student_id: absentee.student_id,
          error: error.message
        });
      }
    }

    logger.info('Absentee notifications completed:', results);
    return results;
  } catch (error) {
    logger.error('Error in sendAbsenteeNotifications:', error);
    throw error;
  }
};

/**
 * Send email notification for absent student
 * @param {string} parentEmail - Parent's email address
 * @param {Object} notificationData - Notification details
 * @param {Object} parentInfo - Parent information
 * @returns {Promise<Object>} - Email result
 */
const sendAbsenteeEmailNotification = async (parentEmail, notificationData, parentInfo) => {
  const subject = `Attendance Alert: ${notificationData.studentName} - ${notificationData.date}`;

  return sendEmail({
    to: parentEmail,
    subject,
    template: 'attendance-absence-notification',
    templateData: {
      parentName: parentInfo.name,
      relationship: parentInfo.relationship || 'Parent/Guardian',
      ...notificationData
    }
  });
};

/**
 * Send late arrival notifications
 * @param {Array} lateStudentsData - Array of late students with their details
 * @param {Object} sessionData - Attendance session data
 * @returns {Promise<Object>} - Notification results
 */
const sendLateArrivalNotifications = async (lateStudentsData, sessionData) => {
  try {
    const results = {
      totalLateStudents: lateStudentsData.length,
      emailsSent: 0,
      smsSent: 0,
      errors: []
    };

    for (const lateStudent of lateStudentsData) {
      try {
        const student = await Student.findByPk(lateStudent.student_id, {
          include: [
            {
              model: Parent,
              through: 'StudentParent',
              attributes: ['id', 'name', 'email', 'phone', 'relationship']
            },
            {
              model: Class,
              attributes: ['name']
            },
            {
              model: Section,
              attributes: ['name']
            }
          ]
        });

        if (!student) continue;

        const schoolInfo = await getSchoolInformation(student.branch_id);

        const notificationData = {
          studentName: student.name,
          studentId: student.student_id,
          className: student.Class?.name || 'Unknown',
          sectionName: student.Section?.name || 'Unknown',
          date: sessionData.date,
          arrivalTime: lateStudent.arrival_time || 'Not specified',
          remarks: lateStudent.remarks || '',
          schoolName: schoolInfo.schoolName,
          schoolPhone: schoolInfo.phone,
          schoolEmail: schoolInfo.email
        };

        // Send notifications to parents
        if (student.Parents && student.Parents.length > 0) {
          for (const parent of student.Parents) {
            if (parent.email) {
              try {
                await sendLateArrivalEmailNotification(parent.email, notificationData, parent);
                results.emailsSent++;
              } catch (error) {
                results.errors.push({
                  student_id: lateStudent.student_id,
                  parent_id: parent.id,
                  type: 'email',
                  error: error.message
                });
              }
            }

            if (parent.phone) {
              try {
                await sendAttendanceNotificationSMS(parent.phone, {
                  studentName: student.name,
                  date: sessionData.date,
                  status: 'late',
                  schoolName: schoolInfo.schoolName
                });
                results.smsSent++;
              } catch (error) {
                results.errors.push({
                  student_id: lateStudent.student_id,
                  parent_id: parent.id,
                  type: 'sms',
                  error: error.message
                });
              }
            }
          }
        }
      } catch (error) {
        results.errors.push({
          student_id: lateStudent.student_id,
          error: error.message
        });
      }
    }

    return results;
  } catch (error) {
    logger.error('Error in sendLateArrivalNotifications:', error);
    throw error;
  }
};

/**
 * Send email notification for late arrival
 * @param {string} parentEmail - Parent's email address
 * @param {Object} notificationData - Notification details
 * @param {Object} parentInfo - Parent information
 * @returns {Promise<Object>} - Email result
 */
const sendLateArrivalEmailNotification = async (parentEmail, notificationData, parentInfo) => {
  const subject = `Late Arrival Notice: ${notificationData.studentName} - ${notificationData.date}`;

  return sendEmail({
    to: parentEmail,
    subject,
    template: 'attendance-late-notification',
    templateData: {
      parentName: parentInfo.name,
      relationship: parentInfo.relationship || 'Parent/Guardian',
      ...notificationData
    }
  });
};

/**
 * Send bulk attendance summary to parents
 * @param {Object} classData - Class attendance summary data
 * @param {Object} sessionData - Attendance session data
 * @returns {Promise<Object>} - Notification results
 */
const sendAttendanceSummaryNotifications = async (classData, sessionData) => {
  try {
    const results = {
      totalParents: 0,
      emailsSent: 0,
      errors: []
    };

    // Get all students in the class with their parents
    const students = await Student.findAll({
      where: {
        class_id: sessionData.class_id,
        ...(sessionData.section_id && { section_id: sessionData.section_id }),
        is_active: true
      },
      include: [
        {
          model: Parent,
          through: 'StudentParent',
          attributes: ['id', 'name', 'email', 'relationship'],
          where: {
            email: { [Op.ne]: null }
          }
        }
      ]
    });

    const schoolInfo = await getSchoolInformation(classData.branch_id);

    for (const student of students) {
      if (student.Parents && student.Parents.length > 0) {
        for (const parent of student.Parents) {
          if (parent.email) {
            try {
              await sendAttendanceSummaryEmail(parent.email, {
                parentName: parent.name,
                relationship: parent.relationship || 'Parent/Guardian',
                studentName: student.name,
                classData,
                sessionData,
                schoolInfo
              });
              results.emailsSent++;
            } catch (error) {
              results.errors.push({
                student_id: student.id,
                parent_id: parent.id,
                error: error.message
              });
            }
          }
        }
      }
    }

    results.totalParents = students.reduce(
      (total, student) => total + (student.Parents?.length || 0),
      0
    );

    return results;
  } catch (error) {
    logger.error('Error in sendAttendanceSummaryNotifications:', error);
    throw error;
  }
};

/**
 * Send attendance summary email
 * @param {string} parentEmail - Parent's email address
 * @param {Object} data - Email data
 * @returns {Promise<Object>} - Email result
 */
const sendAttendanceSummaryEmail = async (parentEmail, data) => {
  const subject = `Daily Attendance Summary - ${data.sessionData.date}`;

  return sendEmail({
    to: parentEmail,
    subject,
    template: 'attendance-summary',
    templateData: data
  });
};

/**
 * Get school information for notifications
 * @param {string} branchId - Branch ID
 * @returns {Promise<Object>} - School information
 */
const getSchoolInformation = async branchId => {
  try {
    const branch = await Branch.findByPk(branchId, {
      include: [
        {
          model: School,
          attributes: ['name', 'email', 'phone']
        }
      ]
    });

    return {
      schoolName: branch?.School?.name || 'School',
      email: branch?.School?.email || 'school@example.com',
      phone: branch?.School?.phone || 'N/A',
      branchName: branch?.name || 'Main Branch'
    };
  } catch (error) {
    logger.error('Error getting school information:', error);
    return {
      schoolName: 'School',
      email: 'school@example.com',
      phone: 'N/A',
      branchName: 'Main Branch'
    };
  }
};

module.exports = {
  sendAbsenteeNotifications,
  sendLateArrivalNotifications,
  sendAttendanceSummaryNotifications,
  sendAbsenteeEmailNotification,
  sendLateArrivalEmailNotification,
  sendAttendanceSummaryEmail
};
