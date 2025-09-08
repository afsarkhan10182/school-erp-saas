const { Op, Sequelize } = require('sequelize');
const { Exam, ExamResult, ExamType, ExamStatus, Subject, Class, Section, Student, School, User, GradingSystem, GradeScale } = require('~/models');
const BaseService = require('~/services/shared/base.service');
const ApiError = require('~/utils/ApiError');
const { logger } = require('~/utils/logger');

class ExamService extends BaseService {
  /**
   * Create a new exam
   */
  static async createExam(examData, userId) {
    return this.executeWithErrorHandling(async () => {
      // Validate required entities
      await this.validateEntityExists(Subject, examData.subject_id, 'Subject');
      await this.validateEntityExists(Class, examData.class_id, 'Class');
      if (examData.section_id) {
        await this.validateEntityExists(Section, examData.section_id, 'Section');
      }
      if (examData.exam_type_id) {
        await this.validateEntityExists(ExamType, examData.exam_type_id, 'Exam Type');
      }

      // Check for duplicate exam name in same class/section
      const existingExam = await Exam.findOne({
        where: {
          school_id: examData.school_id,
          class_id: examData.class_id,
          section_id: examData.section_id || null,
          subject_id: examData.subject_id,
          name: examData.name,
          academic_year: examData.academic_year
        }
      });

      if (existingExam) {
        throw new ApiError(400, 'An exam with this name already exists for this class/section/subject');
      }

      const exam = await Exam.create({
        ...examData,
        created_by: userId,
        updated_by: userId
      });

      return exam;
    }, 'Create Exam');
  }

  /**
   * Get all exams with pagination and filtering
   */
  static async getAllExams(params, user) {
    return this.executeWithErrorHandling(async () => {
      const { 
        page = 1, 
        limit = 10, 
        search, 
        class_id, 
        section_id, 
        subject_id, 
        exam_type_id, 
        academic_year, 
        is_active, 
        branch_id 
      } = params;
      const offset = (page - 1) * limit;

      const whereClause = {
        school_id: user.school_id,
        ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
      };

      // Add filters
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (class_id) whereClause.class_id = class_id;
      if (section_id) whereClause.section_id = section_id;
      if (subject_id) whereClause.subject_id = subject_id;
      if (exam_type_id) whereClause.exam_type_id = exam_type_id;
      if (academic_year) whereClause.academic_year = academic_year;
      if (is_active !== '') whereClause.is_active = is_active === 'true';
      if (branch_id) whereClause.branch_id = branch_id;
      if (params.status_id) whereClause.status_id = params.status_id;

      const { count, rows } = await Exam.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Subject,
            as: 'subject',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Section,
            as: 'section',
            attributes: ['id', 'name']
          },
          {
            model: ExamType,
            as: 'examType',
            attributes: ['id', 'name', 'code']
          },
          {
            model: ExamStatus,
            as: 'examStatus',
            attributes: ['id', 'name', 'code']
          },
          {
            model: School,
            as: 'school',
            attributes: ['id', 'name', 'code']
          }
        ],
        order: [['exam_date', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      return {
        exams: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages
        }
      };
    }, 'Get All Exams');
  }

  /**
   * Get exam by ID with results
   */
  static async getExamById(id, user, includeResults = false) {
    return this.executeWithErrorHandling(async () => {
      const includeOptions = [
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Section,
          as: 'section',
          attributes: ['id', 'name']
        },
        {
          model: ExamType,
          as: 'examType',
          attributes: ['id', 'name', 'code']
        },
        {
          model: School,
          as: 'school',
          attributes: ['id', 'name', 'code']
        }
      ];

      if (includeResults) {
        includeOptions.push({
          model: ExamResult,
          as: 'results',
          include: [
            {
              model: Student,
              as: 'student',
              attributes: ['id', 'first_name', 'last_name', 'admission_number']
            }
          ],
          order: [['student', 'first_name', 'ASC']]
        });
      }

      const exam = await Exam.findOne({
        where: {
          id,
          school_id: user.school_id,
          ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
        },
        include: includeOptions
      });

      if (!exam) {
        throw new ApiError(404, 'Exam not found');
      }

      return exam;
    }, 'Get Exam By ID');
  }

  /**
   * Update exam
   */
  static async updateExam(id, updateData, user) {
    return this.executeWithErrorHandling(async () => {
      const exam = await Exam.findOne({
        where: {
          id,
          school_id: user.school_id,
          ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
        }
      });

      if (!exam) {
        throw new ApiError(404, 'Exam not found');
      }

      // Check if exam has results and prevent certain updates
      const hasResults = await ExamResult.count({ where: { exam_id: id } });
      if (hasResults > 0) {
        // Prevent updating critical fields if results exist
        const restrictedFields = ['subject_id', 'class_id', 'section_id', 'max_marks'];
        const restrictedUpdates = restrictedFields.filter(field => updateData[field] !== undefined);
        
        if (restrictedUpdates.length > 0) {
          throw new ApiError(400, `Cannot update ${restrictedUpdates.join(', ')} as exam has results`);
        }
      }

      await exam.update({
        ...updateData,
        updated_by: user.id
      });

      return exam;
    }, 'Update Exam');
  }

  /**
   * Delete exam
   */
  static async deleteExam(id, user) {
    return this.executeWithErrorHandling(async () => {
      const exam = await Exam.findOne({
        where: {
          id,
          school_id: user.school_id,
          ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
        }
      });

      if (!exam) {
        throw new ApiError(404, 'Exam not found');
      }

      // Check if exam has results
      const hasResults = await ExamResult.count({ where: { exam_id: id } });
      if (hasResults > 0) {
        throw new ApiError(400, 'Cannot delete exam as it has results. Delete results first.');
      }

      await exam.destroy();

      return { message: 'Exam deleted successfully' };
    }, 'Delete Exam');
  }

  /**
   * Add exam result
   */
  static async addExamResult(examId, resultData, user) {
    return this.executeWithErrorHandling(async () => {
      // Validate exam exists
      const exam = await Exam.findOne({
        where: {
          id: examId,
          school_id: user.school_id,
          ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
        }
      });

      if (!exam) {
        throw new ApiError(404, 'Exam not found');
      }

      // Validate student exists and belongs to the exam's class/section
      const student = await Student.findOne({
        where: {
          id: resultData.student_id,
          class_id: exam.class_id,
          section_id: exam.section_id || null,
          school_id: user.school_id
        }
      });

      if (!student) {
        throw new ApiError(400, 'Student not found or not enrolled in this class/section');
      }

      // Check if result already exists
      const existingResult = await ExamResult.findOne({
        where: {
          exam_id: examId,
          student_id: resultData.student_id
        }
      });

      if (existingResult) {
        throw new ApiError(400, 'Result already exists for this student');
      }

      // Calculate percentage and grade
      const percentage = resultData.marks_obtained && exam.max_marks ? 
        (resultData.marks_obtained / exam.max_marks) * 100 : null;

      const grade = percentage !== null ? await this.calculateGrade(percentage, user.school_id) : null;

      const result = await ExamResult.create({
        ...resultData,
        exam_id: examId,
        percentage,
        grade,
        created_by: user.id,
        updated_by: user.id
      });

      return result;
    }, 'Add Exam Result');
  }

  /**
   * Update exam result
   */
  static async updateExamResult(resultId, updateData, user) {
    return this.executeWithErrorHandling(async () => {
      const result = await ExamResult.findOne({
        where: { id: resultId },
        include: [
          {
            model: Exam,
            as: 'exam',
            where: {
              school_id: user.school_id,
              ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
            }
          }
        ]
      });

      if (!result) {
        throw new ApiError(404, 'Exam result not found');
      }

      // Recalculate percentage and grade if marks are updated
      if (updateData.marks_obtained !== undefined) {
        const percentage = updateData.marks_obtained && result.exam.max_marks ? 
          (updateData.marks_obtained / result.exam.max_marks) * 100 : null;
        const grade = percentage !== null ? await this.calculateGrade(percentage, user.school_id) : null;
        
        updateData.percentage = percentage;
        updateData.grade = grade;
      }

      await result.update({
        ...updateData,
        updated_by: user.id
      });

      return result;
    }, 'Update Exam Result');
  }

  /**
   * Delete exam result
   */
  static async deleteExamResult(resultId, user) {
    return this.executeWithErrorHandling(async () => {
      const result = await ExamResult.findOne({
        where: { id: resultId },
        include: [
          {
            model: Exam,
            as: 'exam',
            where: {
              school_id: user.school_id,
              ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
            }
          }
        ]
      });

      if (!result) {
        throw new ApiError(404, 'Exam result not found');
      }

      await result.destroy();

      return { message: 'Exam result deleted successfully' };
    }, 'Delete Exam Result');
  }

  /**
   * Bulk add exam results
   */
  static async bulkAddExamResults(examId, resultsData, user) {
    return this.executeWithErrorHandling(async () => {
      // Validate exam exists
      const exam = await Exam.findOne({
        where: {
          id: examId,
          school_id: user.school_id,
          ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
        }
      });

      if (!exam) {
        throw new ApiError(404, 'Exam not found');
      }

      const results = [];
      const errors = [];

      for (const resultData of resultsData) {
        try {
          const result = await this.addExamResult(examId, resultData, user);
          results.push(result);
        } catch (error) {
          errors.push({
            student_id: resultData.student_id,
            error: error.message
          });
        }
      }

      return {
        success_count: results.length,
        error_count: errors.length,
        results,
        errors
      };
    }, 'Bulk Add Exam Results');
  }

  /**
   * Get exam results for a specific exam
   */
  static async getExamResults(examId, user, params = {}) {
    return this.executeWithErrorHandling(async () => {
      const { page = 1, limit = 50, search, sort_by = 'student_name', sort_order = 'ASC' } = params;
      const offset = (page - 1) * limit;

      // Validate exam exists
      const exam = await Exam.findOne({
        where: {
          id: examId,
          school_id: user.school_id,
          ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
        }
      });

      if (!exam) {
        throw new ApiError(404, 'Exam not found');
      }

      const whereClause = { exam_id: examId };

      if (search) {
        whereClause['$student.first_name$'] = { [Op.iLike]: `%${search}%` };
      }

      const orderClause = [];
      if (sort_by === 'student_name') {
        orderClause.push(['student', 'first_name', sort_order]);
        orderClause.push(['student', 'last_name', sort_order]);
      } else {
        orderClause.push([sort_by, sort_order]);
      }

      const { count, rows } = await ExamResult.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Student,
            as: 'student',
            attributes: ['id', 'first_name', 'last_name', 'admission_number']
          }
        ],
        order: orderClause,
        limit: parseInt(limit),
        offset: offset
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      return {
        exam,
        results: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages
        }
      };
    }, 'Get Exam Results');
  }

  /**
   * Calculate grade based on percentage using database-driven grading system
   */
  static async calculateGrade(percentage, schoolId) {
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
      // Return default grading if none configured
      if (percentage >= 90) return 'A+';
      if (percentage >= 80) return 'A';
      if (percentage >= 70) return 'B+';
      if (percentage >= 60) return 'B';
      if (percentage >= 50) return 'C+';
      if (percentage >= 40) return 'C';
      if (percentage >= 35) return 'D';
      return 'F';
    }

    const gradeScale = gradingSystem.gradeScales.find(scale => 
      percentage >= scale.min_percentage && percentage <= scale.max_percentage
    );
    
    return gradeScale ? gradeScale.grade : 'F';
  }

  /**
   * Get exam statistics
   */
  static async getExamStats(user, filters = {}) {
    return this.executeWithErrorHandling(async () => {
      const whereClause = {
        school_id: user.school_id,
        ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
      };

      // Apply filters
      if (filters.academic_year) whereClause.academic_year = filters.academic_year;
      if (filters.class_id) whereClause.class_id = filters.class_id;
      if (filters.subject_id) whereClause.subject_id = filters.subject_id;

      const [
        totalExams,
        activeExams,
        totalResults,
        averagePercentage
      ] = await Promise.all([
        Exam.count({ where: whereClause }),
        Exam.count({ where: { ...whereClause, is_active: true } }),
        ExamResult.count({
          include: [{
            model: Exam,
            as: 'exam',
            where: whereClause
          }]
        }),
        ExamResult.findOne({
          attributes: [[Sequelize.fn('AVG', Sequelize.col('percentage')), 'avg_percentage']],
          where: {
            exam_id: {
              [Op.in]: Sequelize.literal(`(SELECT id FROM exams WHERE school_id = '${user.school_id}'${user.role === 'branch_admin' ? ` AND branch_id = '${user.branch_id}'` : ''}${filters.academic_year ? ` AND academic_year = '${filters.academic_year}'` : ''}${filters.class_id ? ` AND class_id = '${filters.class_id}'` : ''}${filters.subject_id ? ` AND subject_id = '${filters.subject_id}'` : ''})`)
            }
          },
          raw: true
        })
      ]);

      return {
        total_exams: totalExams,
        active_exams: activeExams,
        total_results: totalResults,
        average_percentage: averagePercentage?.avg_percentage || 0
      };
    }, 'Get Exam Stats');
  }

  /**
   * Get exams for dropdown
   */
  static async getExamsForDropdown(user, filters = {}) {
    return this.executeWithErrorHandling(async () => {
      const whereClause = {
        school_id: user.school_id,
        is_active: true,
        ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
      };

      // Apply filters
      if (filters.class_id) whereClause.class_id = filters.class_id;
      if (filters.subject_id) whereClause.subject_id = filters.subject_id;
      if (filters.academic_year) whereClause.academic_year = filters.academic_year;

      const exams = await Exam.findAll({
        where: whereClause,
        attributes: ['id', 'name', 'exam_date', 'max_marks'],
        include: [
          {
            model: Subject,
            as: 'subject',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          }
        ],
        order: [['exam_date', 'DESC']]
      });

      return exams;
    }, 'Get Exams For Dropdown');
  }
}

module.exports = ExamService;
