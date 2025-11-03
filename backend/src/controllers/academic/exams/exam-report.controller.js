const httpStatus = require('http-status');
const { Op } = require('sequelize');
const { ExamReport, Exam, ReportTemplate } = require('~/models');
const { success, error } = require('~/utils/shared/apiResponse');
const { asyncHandler } = require('~/utils/shared/apiResponse');
const ApiError = require('~/utils/shared/ApiError');
const { logger } = require('~/utils/shared/logger');
const path = require('path');
const fs = require('fs').promises;

class ExamReportController {
  /**
   * Get generated reports by exam ID
   */
  static getByExamId = asyncHandler(async (req, res) => {
    const { examId } = req.params;
    const { page = 1, limit = 20, report_type, status } = req.query;

    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {
      exam_id: examId,
      school_id: req.user.school_id,
      ...(req.user.role === 'branch_admin' && { branch_id: req.user.branch_id })
    };

    if (report_type) {
      whereClause.report_type = report_type;
    }

    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await ExamReport.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Exam,
          as: 'exam',
          attributes: ['id', 'name', 'academic_year']
        },
        {
          model: ReportTemplate,
          as: 'template',
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const result = {
      reports: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    };

    success(res, result, 'Exam reports retrieved successfully');
  });

  /**
   * Preview report
   */
  static preview = asyncHandler(async (req, res) => {
    const { examId } = req.params;
    const { report_type, template_id, filters = {}, config = {} } = req.body;

    // Verify exam exists
    const exam = await Exam.findOne({
      where: {
        id: examId,
        school_id: req.user.school_id,
        ...(req.user.role === 'branch_admin' && { branch_id: req.user.branch_id })
      }
    });

    if (!exam) {
      throw new ApiError(404, 'Exam not found');
    }

    // Get template
    let template = null;
    if (template_id) {
      template = await ReportTemplate.findOne({
        where: {
          id: template_id,
          report_type,
          is_active: true
        }
      });
    } else {
      // Get default template for report type
      template = await ReportTemplate.findOne({
        where: {
          report_type,
          is_default: true,
          is_active: true,
          [Op.or]: [
            { school_id: req.user.school_id },
            { school_id: null } // Global templates
          ]
        }
      });
    }

    if (!template) {
      throw new ApiError(404, 'No template found for this report type');
    }

    // Generate preview data based on report type
    const previewData = await ExamReportController.generateReportData(
      exam,
      report_type,
      filters,
      config
    );

    // Return preview data (without generating actual file)
    success(
      res,
      {
        preview: previewData,
        template: {
          id: template.id,
          name: template.name,
          content: template.template_content
        }
      },
      'Report preview generated successfully'
    );
  });

  /**
   * Generate report
   */
  static generate = asyncHandler(async (req, res) => {
    const { examId } = req.params;
    const { report_type, title, description, template_id, filters = {}, config = {} } = req.body;

    // Verify exam exists
    const exam = await Exam.findOne({
      where: {
        id: examId,
        school_id: req.user.school_id,
        ...(req.user.role === 'branch_admin' && { branch_id: req.user.branch_id })
      }
    });

    if (!exam) {
      throw new ApiError(404, 'Exam not found');
    }

    // Get template
    let template = null;
    if (template_id) {
      template = await ReportTemplate.findOne({
        where: {
          id: template_id,
          report_type,
          is_active: true
        }
      });
    } else {
      // Get default template for report type
      template = await ReportTemplate.findOne({
        where: {
          report_type,
          is_default: true,
          is_active: true,
          [Op.or]: [
            { school_id: req.user.school_id },
            { school_id: null } // Global templates
          ]
        }
      });
    }

    if (!template) {
      throw new ApiError(404, 'No template found for this report type');
    }

    // Create report record
    const report = await ExamReport.create({
      exam_id: examId,
      report_type,
      title: title || `${exam.name} - ${report_type} Report`,
      description,
      template_id: template.id,
      filters,
      config,
      status: 'generating',
      school_id: req.user.school_id,
      branch_id: req.user.branch_id,
      created_by: req.user.id,
      updated_by: req.user.id
    });

    // Generate report data
    const reportData = await ExamReportController.generateReportData(
      exam,
      report_type,
      filters,
      config
    );

    // Generate file (simplified - in real implementation, use a proper template engine)
    const fileName = `exam-report-${examId}-${Date.now()}.html`;
    const filePath = path.join(process.env.UPLOAD_DIR || './uploads/reports', fileName);

    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Generate HTML content
    const htmlContent = ExamReportController.generateHtmlReport(template, reportData, exam);

    // Write file
    await fs.writeFile(filePath, htmlContent);

    // Update report with file info
    await report.update({
      file_path: filePath,
      file_name: fileName,
      file_size: htmlContent.length,
      mime_type: 'text/html',
      status: 'completed',
      generated_at: new Date(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    success(
      res,
      {
        report,
        message: 'Report generated successfully'
      },
      'Exam report generated successfully',
      httpStatus.CREATED
    );
  });

  /**
   * Download report
   */
  static download = asyncHandler(async (req, res) => {
    const { reportId } = req.params;

    const report = await ExamReport.findOne({
      where: {
        id: reportId,
        school_id: req.user.school_id,
        ...(req.user.role === 'branch_admin' && { branch_id: req.user.branch_id })
      }
    });

    if (!report) {
      throw new ApiError(404, 'Report not found');
    }

    if (report.status !== 'completed' || !report.file_path) {
      throw new ApiError(400, 'Report is not ready for download');
    }

    // Check if file exists
    try {
      await fs.access(report.file_path);
    } catch (error) {
      throw new ApiError(404, 'Report file not found');
    }

    // Update download count
    await report.update({
      download_count: report.download_count + 1
    });

    // Set headers and send file
    res.setHeader('Content-Type', report.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${report.file_name}"`);
    res.sendFile(path.resolve(report.file_path));
  });

  /**
   * Delete report
   */
  static delete = asyncHandler(async (req, res) => {
    const { reportId } = req.params;

    const report = await ExamReport.findOne({
      where: {
        id: reportId,
        school_id: req.user.school_id,
        ...(req.user.role === 'branch_admin' && { branch_id: req.user.branch_id })
      }
    });

    if (!report) {
      throw new ApiError(404, 'Report not found');
    }

    // Delete file if exists
    if (report.file_path) {
      try {
        await fs.unlink(report.file_path);
      } catch (error) {
        logger.warn('Failed to delete report file:', error.message);
      }
    }

    await report.destroy();

    success(res, { message: 'Report deleted successfully' }, 'Exam report deleted successfully');
  });

  /**
   * Get single report
   */
  static getById = asyncHandler(async (req, res) => {
    const { reportId } = req.params;

    const report = await ExamReport.findOne({
      where: {
        id: reportId,
        school_id: req.user.school_id,
        ...(req.user.role === 'branch_admin' && { branch_id: req.user.branch_id })
      },
      include: [
        {
          model: Exam,
          as: 'exam',
          attributes: ['id', 'name', 'academic_year']
        },
        {
          model: ReportTemplate,
          as: 'template',
          attributes: ['id', 'name', 'code']
        }
      ]
    });

    if (!report) {
      throw new ApiError(404, 'Exam report not found');
    }

    success(res, { report }, 'Exam report retrieved successfully');
  });

  /**
   * Generate report data based on type
   */
  static async generateReportData(exam, reportType, filters, config) {
    // This is a simplified implementation
    // In a real system, you would query the database based on report type and filters
    const data = {
      exam: {
        id: exam.id,
        name: exam.name,
        academic_year: exam.academic_year
      },
      generated_at: new Date().toISOString(),
      report_type: reportType,
      filters,
      config
    };

    // Add type-specific data
    switch (reportType) {
      case 'summary':
        data.summary = {
          total_students: 0,
          passed_students: 0,
          failed_students: 0,
          average_percentage: 0
        };
        break;
      case 'detailed':
        data.details = [];
        break;
      default:
        data.results = [];
    }

    return data;
  }

  /**
   * Generate HTML report from template
   */
  static generateHtmlReport(template, data, exam) {
    // Simple template replacement (in real implementation, use a proper template engine like Handlebars)
    let html = template.template_content;

    // Replace placeholders
    html = html.replace(/\{\{exam.name\}\}/g, exam.name);
    html = html.replace(/\{\{exam.academic_year\}\}/g, exam.academic_year);
    html = html.replace(/\{\{generated_at\}\}/g, new Date().toLocaleString());

    return html;
  }
}

module.exports = ExamReportController;
