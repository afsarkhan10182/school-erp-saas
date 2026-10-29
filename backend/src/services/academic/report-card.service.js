const { Op, fn, col } = require('sequelize');
const {
  Student,
  Class,
  Section,
  Exam,
  ExamResult,
  ExamSchedule,
  ExamSubjectMark,
  School,
  User,
  GradingSystem,
  GradeScale,
  Subject,
  AttendanceRecord,
  AttendanceSession
} = require('~/models');
const { logger } = require('~/utils/shared/logger');
const ApiError = require('~/utils/shared/ApiError');
const { resolveTemplatesPath } = require('~/utils/shared/pathHelper');
const TemplateEngine = require(resolveTemplatesPath('template-engine'));
const PDFDocument = require('pdfkit');
const { completeSubjectMarkRollups } = require('~/utils/academic/completeSubjectMarkRollups');

class ReportCardService {
  constructor() {
    this.templateEngine = new TemplateEngine();
  }

  /**
   * Generate comprehensive report card for a student
   */
  async generateReportCard(studentId, academicYear, examTypes = null, options = {}) {
    try {
      const {
        includeAttendance = true,
        includeSubjectAnalysis = true,
        autoPrint = false,
        publishedOnly = false,
        schoolId,
        branchId
      } = options;

      // Get student details with all necessary associations
      const student = await this.getStudentWithAssociations(studentId, schoolId, branchId);
      if (!student) {
        throw new ApiError(404, 'Student not found');
      }

      // Get academic data
      const academicData = await this.getAcademicData(studentId, academicYear, examTypes, {
        schoolId,
        branchId,
        publishedOnly
      });

      // Calculate performance metrics
      const performanceData = await this.calculatePerformanceMetrics(
        academicData.results,
        academicData.exams,
        student.school_id
      );

      // Generate subject analysis if requested
      const subjectAnalysis = includeSubjectAnalysis
        ? this.generateSubjectAnalysis(academicData.results, academicData.exams)
        : {};

      // Get attendance data if requested
      const attendanceData = includeAttendance
        ? await this.getAttendanceData(student, academicYear)
        : null;

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
  async getStudentWithAssociations(studentId, schoolId, branchId) {
    return await Student.findOne({
      where: {
        id: studentId,
        ...(schoolId && { school_id: schoolId }),
        ...(branchId && { branch_id: branchId })
      },
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
          attributes: ['id', 'name', 'address', 'phone', 'email', 'logo']
        }
      ]
    });
  }

  /**
   * Get academic data (exams and results)
   */
  async getAcademicData(studentId, academicYear, examTypes = null, context = {}) {
    const student = await Student.findOne({
      where: {
        id: studentId,
        ...(context.schoolId && { school_id: context.schoolId }),
        ...(context.branchId && { branch_id: context.branchId })
      },
      attributes: ['class_id', 'section_id', 'school_id', 'branch_id']
    });

    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    const examFilter = {
      academic_year: academicYear,
      school_id: student.school_id,
      branch_id: student.branch_id
    };
    if (context.publishedOnly) examFilter.result_status = true;
    const scheduleWhere = {
      school_id: student.school_id,
      branch_id: student.branch_id,
      class_id: student.class_id,
      is_active: true,
      status: { [Op.ne]: 'cancelled' }
    };
    if (student.section_id) {
      scheduleWhere[Op.or] = [{ section_id: student.section_id }, { section_id: null }];
    } else {
      scheduleWhere.section_id = null;
    }
    if (examTypes) {
      const typeIds = examTypes.split(',').map(Number).filter(Number.isInteger);
      if (typeIds.length) examFilter.type_id = { [Op.in]: typeIds };
    }

    const exams = await Exam.findAll({
      where: examFilter,
      include: [
        {
          model: ExamSchedule,
          as: 'schedules',
          attributes: ['id', 'exam_id', 'class_id', 'section_id', 'subject_id', 'total_marks', 'is_active', 'status'],
          where: scheduleWhere,
          required: true,
          include: [
            {
              model: Subject,
              as: 'subject',
              attributes: ['id', 'name', 'code', 'category'],
              required: false
            }
          ]
        }
      ],
      distinct: true,
      order: [['created_at', 'ASC']]
    });

    // Get all exam results for the student
    const resultRows = await ExamResult.findAll({
      where: {
        student_id: studentId,
        school_id: student.school_id,
        branch_id: student.branch_id,
        exam_id: { [Op.in]: exams.map(e => e.id) }
      },
      include: [
        {
          model: Exam,
          as: 'exam'
        }
      ],
      order: [['created_at', 'ASC']]
    });

    const subjectsByExam = new Map(exams.map(exam => {
      const subjects = new Map();
      (exam.schedules || []).forEach(schedule => {
        const subject = schedule.subject;
        if (subject?.id) subjects.set(subject.id, subject.toJSON ? subject.toJSON() : subject);
      });
      return [exam.id, subjects.size === 1 ? subjects.values().next().value : null];
    }));
    const legacyResults = resultRows.map(result => {
      const data = result.toJSON ? result.toJSON() : result;
      const subject = subjectsByExam.get(data.exam_id);
      return subject ? { ...data, exam: { ...data.exam, subject } } : data;
    });

    const schedules = exams.flatMap(exam => (exam.schedules || []).map(schedule =>
      schedule.toJSON ? schedule.toJSON() : schedule
    ));
    const subjectMarks = schedules.length
      ? await ExamSubjectMark.findAll({
          where: {
            exam_schedule_id: { [Op.in]: schedules.map(schedule => schedule.id) },
            student_id: studentId,
            school_id: student.school_id,
            branch_id: student.branch_id
          }
        })
      : [];
    const resolved = completeSubjectMarkRollups({
      exams: exams.map(exam => exam.toJSON ? exam.toJSON() : exam),
      students: [{ id: studentId, class_id: student.class_id, section_id: student.section_id }],
      schedules,
      subjectMarks,
      examResults: legacyResults
    });
    const results = [...resolved.values()]
      .map(result => {
        const subject = subjectsByExam.get(result.exam_id);
        return result.is_subject_rollup && subject
          ? { ...result, exam: { ...result.exam, subject } }
          : result;
      })
      .sort((a, b) =>
        exams.findIndex(exam => exam.id === a.exam_id) - exams.findIndex(exam => exam.id === b.exam_id)
      );
    const subjectRollups = results.filter(result => result.is_subject_rollup);
    if (subjectRollups.length) {
      const gradingSystem = await this.getGradingSystem(student.school_id);
      subjectRollups.forEach(result => {
        result.grade = this.calculateGrade(Number(result.percentage), gradingSystem);
      });
    }

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
          {
            grade: 'A+',
            min_percentage: 90,
            max_percentage: 100,
            grade_points: 4.0
          },
          {
            grade: 'A',
            min_percentage: 80,
            max_percentage: 89,
            grade_points: 3.7
          },
          {
            grade: 'B+',
            min_percentage: 70,
            max_percentage: 79,
            grade_points: 3.3
          },
          {
            grade: 'B',
            min_percentage: 60,
            max_percentage: 69,
            grade_points: 3.0
          },
          {
            grade: 'C+',
            min_percentage: 50,
            max_percentage: 59,
            grade_points: 2.7
          },
          {
            grade: 'C',
            min_percentage: 40,
            max_percentage: 49,
            grade_points: 2.3
          },
          {
            grade: 'D',
            min_percentage: 35,
            max_percentage: 39,
            grade_points: 2.0
          },
          {
            grade: 'F',
            min_percentage: 0,
            max_percentage: 34,
            grade_points: 0.0
          }
        ]
      };
    }

    return gradingSystem;
  }

  /**
   * Calculate grade based on percentage using database-driven system
   */
  calculateGrade(percentage, gradingSystem) {
    const gradeScale = gradingSystem.gradeScales.find(
      scale => percentage >= scale.min_percentage && percentage <= scale.max_percentage
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
      const subjectName = result.exam.subject?.name || result.exam.name || 'Exam';
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
      const subjectName = result.exam.subject?.name || result.exam.name || 'Exam';
      if (!subjectAnalysis[subjectName]) {
        subjectAnalysis[subjectName] = {
          subject_name: subjectName,
          subject_code: result.exam.subject?.code || null,
          category: result.exam.subject?.category || null,
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
        exam_type: result.exam.type_id,
        exam_date: result.exam.created_at,
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
  async getAttendanceData(student, academicYear) {
    try {
      const rows = await AttendanceRecord.findAll({
        where: {
          student_id: student.id,
          school_id: student.school_id,
          branch_id: student.branch_id
        },
        attributes: ['status', [fn('COUNT', col('AttendanceRecord.id')), 'record_count']],
        include: [
          {
            model: AttendanceSession,
            as: 'session',
            attributes: [],
            where: {
              school_id: student.school_id,
              branch_id: student.branch_id,
              status: 'published',
              ...(academicYear
                ? { [Op.or]: [{ academic_year: academicYear }, { academic_year: null }] }
                : {})
            },
            required: true
          },
        ],
        group: ['AttendanceRecord.status']
      });
      const attendance = {
        total_days: 0,
        present_days: 0,
        absent_days: 0,
        late_days: 0,
        excused_days: 0
      };
      rows.forEach(row => {
        const count = Number(row.record_count ?? row.get?.('record_count') ?? 0);
        attendance.total_days += count;
        if (row.status === 'present') attendance.present_days = count;
        if (row.status === 'absent') attendance.absent_days = count;
        if (row.status === 'late') attendance.late_days = count;
        if (row.status === 'excused') attendance.excused_days = count;
      });
      attendance.attendance_percentage = attendance.total_days
        ? ((attendance.present_days + attendance.late_days) / attendance.total_days) * 100
        : null;
      attendance.attended_days = attendance.present_days + attendance.late_days;
      return attendance;
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
      remarks.push('Excellent academic performance. Maintains high standards consistently.');
    } else if (performance.average_percentage >= 80) {
      remarks.push('Very good academic performance. Shows strong understanding of subjects.');
    } else if (performance.average_percentage >= 70) {
      remarks.push('Good academic performance. Has potential for further improvement.');
    } else if (performance.average_percentage >= 60) {
      remarks.push('Satisfactory performance. Needs more focus and effort.');
    } else {
      remarks.push('Performance needs improvement. Requires additional support and guidance.');
    }

    // Attendance remarks
    if (attendance && attendance.attendance_percentage >= 95) {
      remarks.push('Excellent attendance record. Shows great commitment to studies.');
    } else if (attendance && attendance.attendance_percentage >= 90) {
      remarks.push('Good attendance record. Regular attendance contributes to learning.');
    } else if (attendance && attendance.attendance_percentage < 85) {
      remarks.push(
        'Attendance needs improvement. Regular attendance is crucial for academic success.'
      );
    }

    // Subject-specific remarks
    const weakSubjects = Object.keys(performance.subject_performance).filter(
      subject => performance.subject_performance[subject].average_percentage < 60
    );

    if (weakSubjects.length > 0) {
      remarks.push(`Needs special attention in: ${weakSubjects.join(', ')}.`);
    }

    const strongSubjects = Object.keys(performance.subject_performance).filter(
      subject => performance.subject_performance[subject].average_percentage >= 85
    );

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
        return await this.generateHTMLReportCard(reportCardData);
      case 'pdf':
        return await this.generatePDFReportCard(reportCardData);
      case 'json':
        return JSON.stringify(reportCardData, null, 2);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Generate HTML report card
   */
  async generateHTMLReportCard(reportCardData) {
    try {
      const html = await this.templateEngine.renderTemplate('reports', 'report-card', {
        ...reportCardData,
        generatedAt: new Date().toLocaleDateString(),
        schoolLogo: reportCardData.student.school?.logo || null
      });
      return html;
    } catch (error) {
      logger.error('Error generating HTML report card:', error);
      // Fallback to basic HTML if template fails
      return this.generateBasicHTMLReportCard(reportCardData);
    }
  }

  /** Generate a downloadable PDF report card. */
  async generatePDFReportCard(reportCardData) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 48 });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      try {
        const {
          student,
          academic_year,
          performance,
          attendance,
          results = [],
          remarks = []
        } = reportCardData;
        const fullName =
          `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Student';

        doc
          .font('Helvetica-Bold')
          .fontSize(18)
          .text(student.school?.name || 'School', { align: 'center' });
        doc.fontSize(15).text('Student Report Card', { align: 'center' });
        doc.moveDown();
        doc.font('Helvetica-Bold').fontSize(11).text('Student Information');
        doc.font('Helvetica').fontSize(10);
        doc.text(`Name: ${fullName}`);
        doc.text(`Admission No.: ${student.admission_number || 'N/A'}`);
        doc.text(
          `Class: ${student.class?.name || 'N/A'}${student.sectionInfo?.name ? ` - ${student.sectionInfo.name}` : ''}`
        );
        doc.text(`Academic Year: ${academic_year || 'N/A'}`);
        doc.moveDown();

        doc.font('Helvetica-Bold').fontSize(11).text('Academic Summary');
        doc.font('Helvetica').fontSize(10);
        doc.text(
          `Exams: ${performance.total_exams}    Average: ${Number(performance.average_percentage || 0).toFixed(2)}%    Overall Grade: ${performance.overall_grade || 'N/A'}`
        );
        doc.text(
          `Marks: ${performance.total_marks}/${performance.max_marks}    GPA: ${Number(performance.average_gpa || 0).toFixed(2)}`
        );
        doc.moveDown();

        doc.font('Helvetica-Bold').fontSize(11).text('Exam Results');
        doc.font('Helvetica').fontSize(10);
        for (const result of results) {
          const subject = result.exam?.subject?.name || result.exam?.name || 'Subject';
          const marks = result.is_absent
            ? 'Absent'
            : `${result.marks_obtained ?? 0}/${result.exam?.max_marks ?? 0}`;
          doc.text(
            `${subject}: ${marks}  |  ${Number(result.percentage || 0).toFixed(2)}%  |  Grade ${result.grade || 'N/A'}`
          );
        }

        if (attendance) {
          doc.moveDown();
          doc.font('Helvetica-Bold').fontSize(11).text('Attendance');
          doc.font('Helvetica').fontSize(10);
          doc.text(attendance.total_days
            ? `${attendance.attended_days ?? attendance.present_days}/${attendance.total_days} days attended (${Number(attendance.attendance_percentage).toFixed(2)}%)`
            : 'No published attendance records');
        }

        if (remarks.length) {
          doc.moveDown();
          doc.font('Helvetica-Bold').fontSize(11).text('Remarks');
          doc.font('Helvetica').fontSize(10);
          remarks.forEach(remark => doc.text(`• ${remark}`, { paragraphGap: 3 }));
        }

        doc.end();
      } catch (error) {
        logger.error('Error generating PDF report card:', error);
        reject(error);
      }
    });
  }

  /**
   * Generate basic HTML report card as fallback
   */
  generateBasicHTMLReportCard(data) {
    const { student, academic_year, results, performance, remarks } = data;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Report Card - ${student.first_name} ${student.last_name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .student-info { margin-bottom: 30px; }
        .results-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .results-table th, .results-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .results-table th { background-color: #f2f2f2; }
        .summary { background-color: #f9f9f9; padding: 20px; border-radius: 5px; }
        .grade { font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>REPORT CARD</h1>
        <h2>Academic Year: ${academic_year}</h2>
    </div>
    
    <div class="student-info">
        <h3>Student Information</h3>
        <p><strong>Name:</strong> ${student.first_name} ${student.last_name}</p>
        <p><strong>Admission Number:</strong> ${student.admission_number}</p>
        <p><strong>Class:</strong> ${student.class?.name || 'N/A'}</p>
        <p><strong>Section:</strong> ${student.section?.name || 'N/A'}</p>
    </div>
    
    <table class="results-table">
        <thead>
            <tr>
                <th>Subject</th>
                <th>Exam</th>
                <th>Marks Obtained</th>
                <th>Max Marks</th>
                <th>Percentage</th>
                <th>Grade</th>
            </tr>
        </thead>
        <tbody>
            ${results
              .map(
                result => `
                <tr>
                    <td>${result.exam?.subject?.name || 'N/A'}</td>
                    <td>${result.exam?.name || 'N/A'}</td>
                    <td>${result.marks_obtained}</td>
                    <td>${result.exam?.max_marks || 'N/A'}</td>
                    <td>${result.percentage?.toFixed(2) || '0.00'}%</td>
                    <td class="grade">${result.grade || 'N/A'}</td>
                </tr>
            `
              )
              .join('')}
        </tbody>
    </table>
    
    <div class="summary">
        <h3>Performance Summary</h3>
        <p><strong>Overall Percentage:</strong> ${performance?.overall_percentage?.toFixed(2) || '0.00'}%</p>
        <p><strong>Overall Grade:</strong> ${performance?.overall_grade || 'N/A'}</p>
        <p><strong>Rank:</strong> ${performance?.rank || 'N/A'}</p>
        <p><strong>Total Exams:</strong> ${results.length}</p>
        <p><strong>Passed:</strong> ${results.filter(r => r.percentage >= 35).length}</p>
        <p><strong>Failed:</strong> ${results.filter(r => r.percentage < 35).length}</p>
    </div>
    
    <div class="remarks">
        <h3>Remarks</h3>
        <p>${remarks || 'No remarks available.'}</p>
    </div>
    
    <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666;">
        Generated on: ${new Date().toLocaleDateString()}
    </div>
</body>
</html>`;
  }

  /**
   * Bulk generate report cards for multiple students
   */
  async bulkGenerateReportCards(studentIds, academicYear, format = 'html', options = {}) {
    const results = [];

    for (const studentId of studentIds) {
      try {
        const reportCard = await this.generateReportCardInFormat(
          studentId,
          academicYear,
          format,
          options
        );
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
