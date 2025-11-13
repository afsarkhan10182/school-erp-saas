const { Exam, ExamResult, Student, Class, Section, School, Branch } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { Op } = require('sequelize');
const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');
const { resolveUploadsPath } = require('~/utils/shared/pathHelper');
const {
  getSchoolCodeFromId,
  ensureSchoolUploadDir,
  getCurrentYear
} = require('~/utils/shared/storage');

/**
 * Get students for report cards
 */
const getStudentsForReportCards = async (req, res) => {
  try {
    const { exam_id, class_id, section_id, school_id, branch_id } = req.query;

    // Validate required parameters
    if (!exam_id || !class_id) {
      return res.status(400).json({
        success: false,
        message: 'Exam ID and Class ID are required'
      });
    }

    // Get students based on class and section
    const whereClause = {
      class_id: class_id,
      school_id: school_id || req.user.school_id,
      branch_id: branch_id || req.branchId || req.user.branch_id,
      status: 'active'
    };

    if (section_id) {
      whereClause.section_id = section_id;
    }

    const students = await Student.findAll({
      where: whereClause,
      include: [
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name']
        },
        {
          model: Section,
          as: 'sectionInfo',
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order: [['roll_number', 'ASC']]
    });

    // Get exam results for these students
    const examResults = await ExamResult.findAll({
      where: {
        exam_id: exam_id,
        student_id: {
          [Op.in]: students.map(s => s.id)
        }
      }
    });

    // Create a map of exam results
    const resultsMap = {};
    examResults.forEach(result => {
      resultsMap[result.student_id] = result;
    });

    // Prepare student data with exam results
    const studentsWithResults = students.map(student => {
      const result = resultsMap[student.id];
      return {
        id: student.id,
        name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown',
        roll_number: student.roll_number,
        class: student.class?.name,
        section: student.sectionInfo?.name,
        total_marks: result?.marks_obtained || 0,
        grade: result?.grade || null,
        is_absent: result?.is_absent || false
      };
    });

    res.json({
      success: true,
      data: studentsWithResults
    });
  } catch (error) {
    logger.error('Error fetching students for report cards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students for report cards',
      error: error.message
    });
  }
};

/**
 * Get report card templates
 */
const getReportCardTemplates = async (req, res) => {
  try {
    const { school_id, branch_id } = req.query;

    // For now, return default templates
    // In a real implementation, these would come from the database
    const templates = [
      {
        id: 'standard',
        name: 'Standard Report Card',
        description: 'Basic report card with marks and grades'
      },
      {
        id: 'detailed',
        name: 'Detailed Report Card',
        description: 'Comprehensive report with comments and attendance'
      },
      {
        id: 'minimal',
        name: 'Minimal Report Card',
        description: 'Simple format for quick reference'
      }
    ];

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    logger.error('Error fetching report card templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report card templates',
      error: error.message
    });
  }
};

/**
 * Generate report cards
 */
const generateReportCards = async (req, res) => {
  try {
    const { exam_id, student_ids, template_id, output_format, email_options } = req.body;

    // Validate required parameters
    if (!exam_id || !student_ids || !template_id) {
      return res.status(400).json({
        success: false,
        message: 'Exam ID, student IDs, and template ID are required'
      });
    }

    // Get exam details
    const exam = await Exam.findByPk(exam_id, {
      include: [
        {
          model: School,
          as: 'school',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Get students with their exam results
    const students = await Student.findAll({
      where: {
        id: { [Op.in]: student_ids },
        school_id: req.user.school_id,
        branch_id: req.branchId || req.user.branch_id
      },
      include: [
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name']
        },
        {
          model: Section,
          as: 'sectionInfo',
          attributes: ['id', 'name'],
          required: false
        }
      ]
    });

    // Get exam results for these students (one result per student per exam)
    const examResults = await ExamResult.findAll({
      where: {
        exam_id: exam_id,
        student_id: { [Op.in]: student_ids }
      }
    });

    // Create results map (one result per student)
    const resultsMap = {};
    examResults.forEach(result => {
      resultsMap[result.student_id] = result;
    });

    // Generate PDF if requested
    let downloadUrl = null;
    let reportId = null;
    if (output_format === 'pdf') {
      const timestamp = Date.now();
      reportId = `report-${exam_id}-${timestamp}`;
      const fileName = `${reportId}.pdf`;
      
      // Get school code for school-specific path
      // Structure: uploads/schools/{schoolCode}/{year}/report-cards/{filename}
      const schoolId = req.user?.school_id || exam.school_id;
      const schoolCode = await getSchoolCodeFromId(schoolId);
      const year = getCurrentYear();
      
      // Ensure school-specific report-cards directory exists
      const reportsDir = ensureSchoolUploadDir(schoolCode, 'report-cards', year);
      const filePath = path.join(reportsDir, fileName);

      // Generate PDF
      await generatePDFReportCard(exam, students, resultsMap, filePath, template_id);

      downloadUrl = `/api/exam-reports/download/${reportId}`;
    }

    const reportData = {
      report_id: reportId,
      generated_at: new Date().toISOString(),
      total_students: student_ids.length,
      template_used: template_id,
      output_format: output_format,
      email_sent: email_options?.to_parents || email_options?.to_students || false,
      download_url: downloadUrl
    };

    res.json({
      success: true,
      message: `Report cards generated for ${student_ids.length} students`,
      data: reportData
    });
  } catch (error) {
    logger.error('Error generating report cards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report cards',
      error: error.message
    });
  }
};

/**
 * Generate PDF report card
 */
const generatePDFReportCard = async (exam, students, resultsMap, filePath, templateId) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        layout: 'portrait'
      });

      const stream = require('fs').createWriteStream(filePath);
      doc.pipe(stream);

      // Generate report card for each student
      students.forEach((student, index) => {
        if (index > 0) {
          doc.addPage();
        }

        // Header
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .fillColor('#2c3e50')
          .text(exam.school?.name || 'School', { align: 'center' });

        if (exam.branch?.name) {
          doc.fontSize(14).text(exam.branch.name, { align: 'center' });
        }

        doc.moveDown(0.5);

        doc.fontSize(18).text('Report Card', { align: 'center' });

        doc.moveDown(1);

        // Student Information
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('Student Information:', { underline: true });

        doc.moveDown(0.3);

        doc
          .fontSize(11)
          .font('Helvetica')
          .text(`Name: ${student.first_name} ${student.last_name}`, { indent: 20 });
        doc.text(`Roll Number: ${student.roll_number || 'N/A'}`, { indent: 20 });
        doc.text(`Class: ${student.class?.name || 'N/A'}`, { indent: 20 });
        if (student.sectionInfo?.name) {
          doc.text(`Section: ${student.sectionInfo.name}`, { indent: 20 });
        }
        doc.text(`Exam: ${exam.name}`, { indent: 20 });

        doc.moveDown(1);

        // Exam Results
        const result = resultsMap[student.id];
        if (result && !result.is_absent) {
          doc.fontSize(12).font('Helvetica-Bold').text('Exam Results:', { underline: true });

          doc.moveDown(0.5);

          doc
            .fontSize(11)
            .font('Helvetica')
            .fillColor('#000000')
            .text(`Total Marks Obtained: ${result.marks_obtained || 0}`, { indent: 20 });
          doc.text(`Maximum Marks: ${exam.max_marks || 100}`, { indent: 20 });
          doc.text(`Percentage: ${result.percentage?.toFixed(2) || 0}%`, { indent: 20 });
          doc.text(`Grade: ${result.grade || 'N/A'}`, { indent: 20 });

          // Component marks if available
          if (result.theory_marks_obtained !== null || result.practical_marks_obtained !== null) {
            doc.moveDown(0.3);
            doc.fontSize(10).font('Helvetica-Bold').text('Component Marks:', { indent: 20 });

            if (result.theory_marks_obtained !== null) {
              doc
                .fontSize(10)
                .font('Helvetica')
                .text(`Theory: ${result.theory_marks_obtained}`, { indent: 40 });
            }
            if (result.practical_marks_obtained !== null) {
              doc
                .fontSize(10)
                .font('Helvetica')
                .text(`Practical: ${result.practical_marks_obtained}`, { indent: 40 });
            }
            if (result.viva_marks_obtained !== null) {
              doc
                .fontSize(10)
                .font('Helvetica')
                .text(`Viva: ${result.viva_marks_obtained}`, { indent: 40 });
            }
            if (result.assignment_marks_obtained !== null) {
              doc
                .fontSize(10)
                .font('Helvetica')
                .text(`Assignment: ${result.assignment_marks_obtained}`, { indent: 40 });
            }
          }

          if (result.remarks) {
            doc.moveDown(0.5);
            doc
              .fontSize(10)
              .font('Helvetica')
              .fillColor('#666666')
              .text(`Remarks: ${result.remarks}`, { indent: 20 });
          }
        } else if (result && result.is_absent) {
          doc
            .fontSize(11)
            .font('Helvetica')
            .fillColor('#d32f2f')
            .text('Status: ABSENT', { align: 'center' });
        } else {
          doc
            .fontSize(11)
            .font('Helvetica')
            .fillColor('#666666')
            .text('No exam results available', { align: 'center' });
        }

        // Footer
        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#666666')
          .text(`Generated on: ${new Date().toLocaleDateString()}`, 50, doc.page.height - 50, {
            align: 'left'
          });
      });

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Download report card
 */
const downloadReportCard = async (req, res) => {
  try {
    const { reportId } = req.params;

    logger.info('Download report card request:', {
      reportId,
      user: req.user?.id,
      path: req.path,
      originalUrl: req.originalUrl
    });

    // Get school code for school-specific path
    // Structure: uploads/schools/{schoolCode}/{year}/report-cards/{filename}
    const schoolId = req.user?.school_id;
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: 'School ID is required to download report card'
      });
    }
    
    const schoolCode = await getSchoolCodeFromId(schoolId);
    const year = getCurrentYear();
    const reportsDir = ensureSchoolUploadDir(schoolCode, 'report-cards', year);
    const fileName = `${reportId}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    logger.debug('Looking for file at:', filePath);

    // Check if file exists
    try {
      await fs.access(filePath);
      logger.debug('File found, sending...');
    } catch (error) {
      logger.error('File not found:', filePath, error);
      return res.status(404).json({
        success: false,
        message: 'Report card file not found',
        filePath: filePath
      });
    }

    // Set headers and send file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report-card-${reportId}.pdf"`);
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    logger.error('Error downloading report card:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download report card',
      error: error.message
    });
  }
};

module.exports = {
  getStudentsForReportCards,
  getReportCardTemplates,
  generateReportCards,
  downloadReportCard
};
