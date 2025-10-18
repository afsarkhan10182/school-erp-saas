const { Exam, ExamResult, Student, Class, Section } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { Op } = require('sequelize');

/**
 * Get publication status for exams
 */
const getPublicationStatus = async (req, res) => {
  try {
    const { exam_id, class_id, school_id, branch_id, publish_status, result_status } = req.query;

    const whereClause = {
      school_id: school_id || req.user.school_id,
      branch_id: branch_id || req.user.branch_id,
      is_active: true
    };

    if (exam_id) {
      whereClause.id = exam_id;
    }

    if (publish_status !== undefined) {
      whereClause.publish_status = publish_status === 'true';
    }

    if (result_status !== undefined) {
      whereClause.result_status = result_status === 'true';
    }

    const exams = await Exam.findAll({
      where: whereClause,
      include: [
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name'],
          where: class_id ? { id: class_id } : undefined,
          required: !!class_id
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Get publication status for each exam
    const examsWithStatus = exams.map(exam => ({
      id: exam.id,
      name: exam.name,
      examType: exam.examType,
      class: exam.class,
      publish_status: exam.publish_status || false,
      result_status: exam.result_status || false,
      published_at: exam.published_at,
      published_by: exam.published_by
    }));

    res.json({
      success: true,
      data: examsWithStatus
    });
  } catch (error) {
    logger.error('Error fetching publication status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch publication status',
      error: error.message
    });
  }
};

/**
 * Publish/unpublish exam results
 */
const publishExam = async (req, res) => {
  try {
    const {
      exam_id,
      publish_status,
      result_status,
      notify_students,
      notify_parents,
      notification_message
    } = req.body;

    if (!exam_id) {
      return res.status(400).json({
        success: false,
        message: 'Exam ID is required'
      });
    }

    // Update exam publication status
    const updateData = {
      publish_status: publish_status || false,
      result_status: result_status || false,
      updated_by: req.user.id
    };

    if (publish_status) {
      updateData.published_at = new Date();
      updateData.published_by = req.user.id;
    }

    await Exam.update(updateData, {
      where: {
        id: exam_id,
        school_id: req.user.school_id,
        branch_id: req.user.branch_id
      }
    });

    // If notifications are requested, send them
    if (publish_status && (notify_students || notify_parents)) {
      // This would integrate with your notification service
      logger.info(`Notifications requested for exam ${exam_id}`, {
        notify_students,
        notify_parents,
        message: notification_message
      });
    }

    res.json({
      success: true,
      message: `Exam ${publish_status ? 'published' : 'unpublished'} successfully`,
      data: {
        exam_id,
        publish_status,
        result_status,
        published_at: publish_status ? new Date().toISOString() : null
      }
    });
  } catch (error) {
    logger.error('Error publishing exam:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish exam',
      error: error.message
    });
  }
};

/**
 * Bulk publish multiple exams
 */
const bulkPublish = async (req, res) => {
  try {
    const { exam_ids, publish_status, result_status } = req.body;

    if (!exam_ids || !Array.isArray(exam_ids)) {
      return res.status(400).json({
        success: false,
        message: 'Exam IDs array is required'
      });
    }

    const updateData = {
      publish_status: publish_status || false,
      result_status: result_status || false,
      updated_by: req.user.id
    };

    if (publish_status) {
      updateData.published_at = new Date();
      updateData.published_by = req.user.id;
    }

    const [updatedCount] = await Exam.update(updateData, {
      where: {
        id: {
          [Op.in]: exam_ids
        },
        school_id: req.user.school_id,
        branch_id: req.user.branch_id
      }
    });

    res.json({
      success: true,
      message: `Bulk ${publish_status ? 'published' : 'unpublished'} ${updatedCount} exams successfully`,
      data: {
        updated_count: updatedCount,
        exam_ids,
        publish_status,
        result_status
      }
    });
  } catch (error) {
    logger.error('Error bulk publishing exams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk publish exams',
      error: error.message
    });
  }
};

/**
 * Send notifications for published results
 */
const sendNotifications = async (req, res) => {
  try {
    const { examId } = req.params;
    const { email_enabled, sms_enabled, email_template, sms_template, notification_message } =
      req.body;

    // Get exam details
    const exam = await Exam.findByPk(examId, {
      where: {
        school_id: req.user.school_id,
        branch_id: req.user.branch_id
      }
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    if (!exam.publish_status) {
      return res.status(400).json({
        success: false,
        message: 'Exam must be published before sending notifications'
      });
    }

    // Get students for this exam
    const students = await Student.findAll({
      where: {
        school_id: req.user.school_id,
        branch_id: req.user.branch_id,
        is_active: true
      },
      include: [
        {
          model: ExamResult,
          as: 'examResults',
          where: { exam_id: examId },
          required: true
        }
      ]
    });

    const notificationResults = {
      email_sent: 0,
      sms_sent: 0,
      total_students: students.length
    };

    // Simulate sending notifications
    if (email_enabled) {
      // This would integrate with your email service
      logger.info(`Email notifications sent for exam ${examId}`, {
        students_count: students.length,
        template: email_template,
        message: notification_message
      });
      notificationResults.email_sent = students.length;
    }

    if (sms_enabled) {
      // This would integrate with your SMS service
      logger.info(`SMS notifications sent for exam ${examId}`, {
        students_count: students.length,
        template: sms_template,
        message: notification_message
      });
      notificationResults.sms_sent = students.length;
    }

    res.json({
      success: true,
      message: 'Notifications sent successfully',
      data: notificationResults
    });
  } catch (error) {
    logger.error('Error sending notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notifications',
      error: error.message
    });
  }
};

/**
 * Get notification history
 */
const getNotificationHistory = async (req, res) => {
  try {
    const { examId } = req.params;

    // This would typically come from a notifications table
    // For now, return mock data
    const notifications = [
      {
        id: '1',
        exam_id: examId,
        type: 'email',
        sent_at: new Date().toISOString(),
        recipients_count: 25,
        status: 'sent'
      },
      {
        id: '2',
        exam_id: examId,
        type: 'sms',
        sent_at: new Date(Date.now() - 3600000).toISOString(),
        recipients_count: 25,
        status: 'sent'
      }
    ];

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    logger.error('Error fetching notification history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification history',
      error: error.message
    });
  }
};

/**
 * Get publication statistics
 */
const getStats = async (req, res) => {
  try {
    const { school_id, branch_id } = req.query;

    const whereClause = {
      school_id: school_id || req.user.school_id,
      branch_id: branch_id || req.user.branch_id,
      is_active: true
    };

    const totalExams = await Exam.count({ where: whereClause });
    const publishedExams = await Exam.count({
      where: { ...whereClause, publish_status: true }
    });
    const unpublishedExams = totalExams - publishedExams;
    const resultsAvailable = await Exam.count({
      where: { ...whereClause, result_status: true }
    });

    res.json({
      success: true,
      data: {
        total_exams: totalExams,
        published_exams: publishedExams,
        unpublished_exams: unpublishedExams,
        results_available: resultsAvailable,
        publication_rate: totalExams > 0 ? ((publishedExams / totalExams) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    logger.error('Error fetching publication statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch publication statistics',
      error: error.message
    });
  }
};

module.exports = {
  getPublicationStatus,
  publishExam,
  bulkPublish,
  sendNotifications,
  getNotificationHistory,
  getStats
};
