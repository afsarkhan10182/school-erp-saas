const { Op } = require('sequelize');
const { Student, Class, Section, Exam, ExamResult, Subject, School, User, GradingSystem, GradeScale } = require('~/models');
const { logger } = require('~/utils/logger');
const ApiError = require('~/utils/ApiError');
const TemplateEngine = require('~/utils/templates/template-engine');

class ReportCardService {
  constructor() {
    this.templateEngine = new TemplateEngine();
  }

  /**
   * Generate comprehensive report card for a student
   */
  async generateReportCard(studentId, academicYear, examTypes = null, options = {}) {
    try {
      const { includeAttendance = true, includeSubjectAnalysis = true, autoPrint = false } = options;

      // Get student details with all necessary associations
      const student = await this.getStudentWithAssociations(studentId);
      if (!student) {
        throw new ApiError(404, 'Student not found');
      }

      // Get academic data
      const academicData = await this.getAcademicData(studentId, academicYear, examTypes);
      
      // Calculate performance metrics
      const performanceData = await this.calculatePerformanceMetrics(academicData.results, academicData.exams, student.school_id);
      
      // Generate subject analysis if requested
      const subjectAnalysis = includeSubjectAnalysis ? 
        this.generateSubjectAnalysis(academicData.results, academicData.exams) : {};
      
      // Get attendance data if requested
      const attendanceData = includeAttendance ? 
        await this.getAttendanceData(studentId, academicYear) : null;
      
      // Generate remarks
      const remarks = this.generateRemarks(performanceData, attendanceData, subjectAnalysis);

      // Prepare report card data
      const reportCardData = {
        student,
        academic_year: academicYear,
        exams: academicData.exams,
        results: academicData.results,
        performance: performanceData,
        subject_analysis: subjectAnalysis,
        attendance: attendanceData,
        remarks,
        generated_at: new Date(),
        autoPrint
      };

      return reportCardData;
    } catch (error) {
      logger.error('Error generating report card:', error);
      throw error;
    }
  }

  /**
   * Get student with all necessary associations
   */
  async getStudentWithAssociations(studentId) {
    return await Student.findOne({
      where: { id: studentId },
      include: [
        { 
          model: Class, 
          as: 'class', 
          attributes: ['id', 'name', 'code'] 
        },
        { 
          model: Section, 
          as: 'sectionInfo', 
          attributes: ['id', 'name'] 
        },
        { 
          model: School, 
          as: 'school', 
          attributes: ['id', 'name', 'address', 'phone', 'email', 'logo_url'] 
        }
      ]
    });
  }

  /**
   * Get academic data (exams and results)
   */
  async getAcademicData(studentId, academicYear, examTypes = null) {
    // Build exam filter
    const examFilter = {
      academic_year: academicYear
    };

    if (examTypes) {
      examFilter.exam_type = { [Op.in]: examTypes.split(',') };
    }

    // Get all exams for the student's class/section
    const student = await Student.findByPk(studentId, {
      attributes: ['class_id', 'section_id']
    });

    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    examFilter.class_id = student.class_id;
    if (student.section_id) {
      examFilter.section_id = student.section_id;
    }

    const exams = await Exam.findAll({
      where: examFilter,
      include: [
        { 
          model: Subject, 
          as: 'subject', 
          attributes: ['id', 'name', 'code', 'category'] 
        }
      ],
      order: [['exam_date', 'ASC']]
    });

    // Get all exam results for the student
    const results = await ExamResult.findAll({
      where: {
        student_id: studentId,
        exam_id: { [Op.in]: exams.map(e => e.id) }
      },
      include: [
        {
          model: Exam,
          as: 'exam',
          include: [
            { 
              model: Subject, 
              as: 'subject', 
              attributes: ['id', 'name', 'code', 'category'] 
            }
          ]
        }
      ],
      order: [['exam', 'exam_date', 'ASC']]
    });

    return { exams, results };
  }

  /**
   * Calculate performance metrics using database-driven grading
   */
  async calculatePerformanceMetrics(results, exams, schoolId) {
    const totalExams = exams.length;
    const attendedExams = results.filter(r => !r.is_absent).length;
    const absentExams = results.filter(r => r.is_absent).length;

    const validResults = results.filter(r => !r.is_absent && r.marks_obtained !== null);
    
    const totalMarks = validResults.reduce((sum, r) => sum + parseFloat(r.marks_obtained), 0);
    const maxMarks = validResults.reduce((sum, r) => sum + parseFloat(r.exam.max_marks), 0);
    const averagePercentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;
    
    // Get database-driven grading system
    const gradingSystem = await this.getGradingSystem(schoolId);
    const overallGrade = this.calculateGrade(averagePercentage, gradingSystem);
    const averageGPA = this.calculateGPA(validResults, gradingSystem);

    // Grade distribution
    const gradeDistribution = {};
    validResults.forEach(result => {
      if (result.grade) {
        gradeDistribution[result.grade] = (gradeDistribution[result.grade] || 0) + 1;
      }
    });

    // Subject-wise performance
    const subjectPerformance = this.calculateSubjectPerformance(validResults);

    return {
      total_exams: totalExams,
      attended_exams: attendedExams,
      absent_exams: absentExams,
      attendance_rate: totalExams > 0 ? (attendedExams / totalExams) * 100 : 0,
      total_marks: totalMarks,
      max_marks: maxMarks,
      average_percentage: averagePercentage,
      average_gpa: averageGPA,
      grade_distribution: gradeDistribution,
      subject_performance: subjectPerformance,
      overall_grade: overallGrade
    };
  }

  /**
   * Get grading system from database
   */
  async getGradingSystem(schoolId) {
    const gradingSystem = await GradingSystem.findOne({
      where: { school_id: schoolId, is_active: true },
      include: [
        {
          model: GradeScale,
          as: 'gradeScales',
          order: [['min_percentage', 'DESC']]
        }
      ]
    });

    if (!gradingSystem) {
      // Return default grading system if none configured
      return {
        name: 'Default Grading System',
        gradeScales: [
          { grade: 'A+', min_percentage: 90, max_percentage: 100, grade_points: 4.0 },
          { grade: 'A', min_percentage: 80, max_percentage: 89, grade_points: 3.7 },
          { grade: 'B+', min_percentage: 70, max_percentage: 79, grade_points: 3.3 },
          { grade: 'B', min_percentage: 60, max_percentage: 69, grade_points: 3.0 },
          { grade: 'C+', min_percentage: 50, max_percentage: 59, grade_points: 2.7 },
          { grade: 'C', min_percentage: 40, max_percentage: 49, grade_points: 2.3 },
          { grade: 'D', min_percentage: 35, max_percentage: 39, grade_points: 2.0 },
          { grade: 'F', min_percentage: 0, max_percentage: 34, grade_points: 0.0 }
        ]
      };
    }

    return gradingSystem;
  }

  /**
   * Calculate grade based on percentage using database-driven system
   */
  calculateGrade(percentage, gradingSystem) {
    const gradeScale = gradingSystem.gradeScales.find(scale => 
      percentage >= scale.min_percentage && percentage <= scale.max_percentage
    );
    
    return gradeScale ? gradeScale.grade : 'F';
  }

  /**
   * Calculate GPA based on grade points
   */
  calculateGPA(results, gradingSystem) {
    if (results.length === 0) return 0;

    const totalGradePoints = results.reduce((sum, result) => {
      const gradeScale = gradingSystem.gradeScales.find(scale => scale.grade === result.grade);
      return sum + (gradeScale ? gradeScale.grade_points : 0);
    }, 0);

    return totalGradePoints / results.length;
  }

  /**
   * Calculate subject-wise performance
   */
  calculateSubjectPerformance(validResults) {
    const subjectPerformance = {};
    
    validResults.forEach(result => {
      const subjectName = result.exam.subject.name;
      if (!subjectPerformance[subjectName]) {
        subjectPerformance[subjectName] = {
          total_marks: 0,
          max_marks: 0,
          exams_count: 0,
          average_percentage: 0
        };
      }
      subjectPerformance[subjectName].total_marks += parseFloat(result.marks_obtained);
      subjectPerformance[subjectName].max_marks += parseFloat(result.exam.max_marks);
      subjectPerformance[subjectName].exams_count += 1;
    });

    // Calculate subject averages
    Object.keys(subjectPerformance).forEach(subject => {
      const data = subjectPerformance[subject];
      data.average_percentage = data.max_marks > 0 ? (data.total_marks / data.max_marks) * 100 : 0;
    });

    return subjectPerformance;
  }

  /**
   * Generate subject-wise analysis
   */
  generateSubjectAnalysis(results, exams) {
    const subjectAnalysis = {};
    
    // Group results by subject
    results.forEach(result => {
      const subjectName = result.exam.subject.name;
      if (!subjectAnalysis[subjectName]) {
        subjectAnalysis[subjectName] = {
          subject_name: subjectName,
          subject_code: result.exam.subject.code,
          category: result.exam.subject.category,
          exams: [],
          total_marks: 0,
          max_marks: 0,
          average_percentage: 0,
          grades: [],
          performance_trend: 'stable'
        };
      }
      
      subjectAnalysis[subjectName].exams.push({
        exam_name: result.exam.name,
        exam_type: result.exam.exam_type,
        exam_date: result.exam.exam_date,
        marks_obtained: result.marks_obtained,
        max_marks: result.exam.max_marks,
        percentage: result.percentage,
        grade: result.grade,
        rank: result.rank
      });
      
      if (!result.is_absent) {
        subjectAnalysis[subjectName].total_marks += parseFloat(result.marks_obtained || 0);
        subjectAnalysis[subjectName].max_marks += parseFloat(result.exam.max_marks);
        if (result.grade) {
          subjectAnalysis[subjectName].grades.push(result.grade);
        }
      }
    });

    // Calculate averages and trends
    Object.keys(subjectAnalysis).forEach(subject => {
      const data = subjectAnalysis[subject];
      data.average_percentage = data.max_marks > 0 ? (data.total_marks / data.max_marks) * 100 : 0;
      data.performance_trend = this.calculatePerformanceTrend(data.exams);
    });

    return subjectAnalysis;
  }

  /**
   * Calculate performance trend
   */
  calculatePerformanceTrend(exams) {
    const percentages = exams
      .filter(exam => exam.percentage !== null)
      .map(exam => exam.percentage)
      .sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date));
    
    if (percentages.length >= 2) {
      const firstHalf = percentages.slice(0, Math.ceil(percentages.length / 2));
      const secondHalf = percentages.slice(Math.ceil(percentages.length / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      if (secondAvg > firstAvg + 5) {
        return 'improving';
      } else if (secondAvg < firstAvg - 5) {
        return 'declining';
      }
    }
    
    return 'stable';
  }

  /**
   * Get attendance data for the student
   */
  async getAttendanceData(studentId, academicYear) {
    try {
      // This would integrate with the attendance module
      // For now, return placeholder data - in production, this would query attendance tables
      return {
        total_days: 180,
        present_days: 165,
        absent_days: 10,
        late_days: 5,
        attendance_percentage: 91.67
      };
    } catch (error) {
      logger.error('Error getting attendance data:', error);
      return null;
    }
  }

  /**
   * Generate remarks based on performance
   */
  generateRemarks(performance, attendance, subjectAnalysis) {
    const remarks = [];
    
    // Overall performance remarks
    if (performance.average_percentage >= 90) {
      remarks.push("Excellent academic performance. Maintains high standards consistently.");
    } else if (performance.average_percentage >= 80) {
      remarks.push("Very good academic performance. Shows strong understanding of subjects.");
    } else if (performance.average_percentage >= 70) {
      remarks.push("Good academic performance. Has potential for further improvement.");
    } else if (performance.average_percentage >= 60) {
      remarks.push("Satisfactory performance. Needs more focus and effort.");
    } else {
      remarks.push("Performance needs improvement. Requires additional support and guidance.");
    }

    // Attendance remarks
    if (attendance && attendance.attendance_percentage >= 95) {
      remarks.push("Excellent attendance record. Shows great commitment to studies.");
    } else if (attendance && attendance.attendance_percentage >= 90) {
      remarks.push("Good attendance record. Regular attendance contributes to learning.");
    } else if (attendance && attendance.attendance_percentage < 85) {
      remarks.push("Attendance needs improvement. Regular attendance is crucial for academic success.");
    }

    // Subject-specific remarks
    const weakSubjects = Object.keys(performance.subject_performance)
      .filter(subject => performance.subject_performance[subject].average_percentage < 60);
    
    if (weakSubjects.length > 0) {
      remarks.push(`Needs special attention in: ${weakSubjects.join(', ')}.`);
    }

    const strongSubjects = Object.keys(performance.subject_performance)
      .filter(subject => performance.subject_performance[subject].average_percentage >= 85);
    
    if (strongSubjects.length > 0) {
      remarks.push(`Shows exceptional strength in: ${strongSubjects.join(', ')}.`);
    }

    return remarks;
  }

  /**
   * Generate PDF report card using template engine
   */
  async generatePDFReportCard(reportCardData) {
    try {
      const htmlContent = await this.templateEngine.renderTemplate(
        'reports',
        'report-card',
        reportCardData
      );
      
      return htmlContent;
    } catch (error) {
      logger.error('Error generating PDF report card:', error);
      throw error;
    }
  }

  /**
   * Generate report card in different formats
   */
  async generateReportCardInFormat(studentId, academicYear, format = 'html', options = {}) {
    const reportCardData = await this.generateReportCard(studentId, academicYear, null, options);
    
    switch (format.toLowerCase()) {
      case 'html':
      case 'pdf':
        return await this.generatePDFReportCard(reportCardData);
      case 'json':
        return JSON.stringify(reportCardData, null, 2);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Bulk generate report cards for multiple students
   */
  async bulkGenerateReportCards(studentIds, academicYear, format = 'html', options = {}) {
    const results = [];
    
    for (const studentId of studentIds) {
      try {
        const reportCard = await this.generateReportCardInFormat(studentId, academicYear, format, options);
        results.push({
          student_id: studentId,
          success: true,
          data: reportCard
        });
      } catch (error) {
        logger.error(`Error generating report card for student ${studentId}:`, error);
        results.push({
          student_id: studentId,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }
}

module.exports = ReportCardService;

