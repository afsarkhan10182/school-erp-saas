const { Exam, Class, ExamSchedule } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { Op } = require('sequelize');
const { resolveSchoolBranchScope } = require('~/utils/shared/requestScope');

const getScopeWhere = async req => {
  const { school_id, branch_id } = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
  return { school_id, ...(branch_id ? { branch_id } : {}) };
};

/**
 * Get publication status for exams
 */
const getPublicationStatus = async (req, res) => {
  try {
    const { exam_id, class_id, publish_status, result_status } = req.query;

    const scope = await getScopeWhere(req);
    const whereClause = {
      ...scope,
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
          model: ExamSchedule,
          as: 'schedules',
          attributes: ['class_id'],
          where: {
            school_id: scope.school_id,
            ...(scope.branch_id ? { branch_id: scope.branch_id } : {}),
            ...(class_id ? { class_id } : {})
          },
          required: !!class_id,
          include: [{
            model: Class,
            as: 'class',
            attributes: ['id', 'name'],
            where: {
              school_id: scope.school_id,
              ...(scope.branch_id ? { branch_id: scope.branch_id } : {})
            },
            required: !!class_id
          }]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Get publication status for each exam
    const examsWithStatus = exams.map(exam => ({
      id: exam.id,
      name: exam.name,
      examType: { name: ({ 1: 'Marks', 2: 'Grade', 3: 'Marks and Grade' })[exam.type_id] || 'Exam' },
      class: exam.schedules?.[0]?.class || null,
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
    res.status(error.statusCode || 500).json({
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
      notify_parents
    } = req.body;

    if (!exam_id || typeof publish_status !== 'boolean' || typeof result_status !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'exam_id, publish_status and result_status are required'
      });
    }

    const scope = await getScopeWhere(req);
    const updateData = {
      publish_status,
      result_status,
      updated_by: req.user.id
    };

    if (publish_status) {
      updateData.published_at = new Date();
      updateData.published_by = req.user.id;
    } else {
      updateData.published_at = null;
      updateData.published_by = null;
    }

    const [updatedCount] = await Exam.update(updateData, { where: { id: exam_id, ...scope } });
    if (!updatedCount) return res.status(404).json({ success: false, message: 'Exam not found' });

    const notificationsRequested = Boolean(publish_status && (notify_students || notify_parents));

    res.json({
      success: true,
      message: `Exam ${publish_status ? 'published' : 'unpublished'} successfully`,
      data: {
        exam_id,
        publish_status,
        result_status,
        published_at: updateData.published_at?.toISOString() || null,
        ...(notificationsRequested ? { notifications: 'not_configured' } : {})
      }
    });
  } catch (error) {
    logger.error('Error publishing exam:', error);
    res.status(error.statusCode || 500).json({
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

    if (!Array.isArray(exam_ids) || !exam_ids.length || exam_ids.some(id => typeof id !== 'string') ||
        typeof publish_status !== 'boolean' || typeof result_status !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'A non-empty exam_ids array, publish_status and result_status are required'
      });
    }

    const scope = await getScopeWhere(req);
    const updateData = {
      publish_status,
      result_status,
      updated_by: req.user.id
    };

    if (publish_status) {
      updateData.published_at = new Date();
      updateData.published_by = req.user.id;
    } else {
      updateData.published_at = null;
      updateData.published_by = null;
    }

    const [updatedCount] = await Exam.update(updateData, {
      where: {
        id: {
          [Op.in]: exam_ids
        },
        ...scope
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
    res.status(error.statusCode || 500).json({
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
    const exam = await Exam.findOne({ where: { id: examId, ...(await getScopeWhere(req)) } });

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

    return res.status(501).json({
      success: false,
      message: 'Exam-result notification delivery is not configured.'
    });
  } catch (error) {
    logger.error('Error sending notifications:', error);
    res.status(error.statusCode || 500).json({
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

    const exam = await Exam.findOne({ where: { id: examId, ...(await getScopeWhere(req)) } });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Error fetching notification history:', error);
    res.status(error.statusCode || 500).json({
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
    const whereClause = {
      ...(await getScopeWhere(req)),
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
    res.status(error.statusCode || 500).json({
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
