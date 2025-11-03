const { Exam, ExamResult, Student, Class, Section } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { Op } = require('sequelize');

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
      branch_id: branch_id || req.user.branch_id,
      is_active: true
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
          as: 'section',
          attributes: ['id', 'name']
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
        name: student.name,
        roll_number: student.roll_number,
        class: student.class?.name,
        section: student.section?.name,
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

    // For now, simulate report card generation
    // In a real implementation, this would generate actual PDFs
    const reportData = {
      generated_at: new Date().toISOString(),
      total_students: student_ids.length,
      template_used: template_id,
      output_format: output_format,
      email_sent: email_options?.to_parents || email_options?.to_students || false
    };

    // Simulate PDF generation
    if (output_format === 'pdf') {
      reportData.download_url = `/api/exam-reports/download/${Date.now()}.pdf`;
    }

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

module.exports = {
  getStudentsForReportCards,
  getReportCardTemplates,
  generateReportCards
};
