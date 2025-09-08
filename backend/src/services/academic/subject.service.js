const { Op } = require('sequelize');
const { Subject, SubjectGroup, SubjectGroupSubject, Class, School, User } = require('~/models');
const BaseService = require('~/services/shared/base.service');
const ApiError = require('~/utils/ApiError');
const { logger } = require('~/utils/logger');

class SubjectService extends BaseService {
  /**
   * Create a new subject
   */
  static async createSubject(subjectData, userId) {
    return this.executeWithErrorHandling(async () => {
      // Validate class exists if provided
      if (subjectData.class_id) {
        await this.validateEntityExists(Class, subjectData.class_id, 'Class');
      }

      // Check for duplicate subject code in the same school
      const existingSubject = await Subject.findOne({
        where: {
          school_id: subjectData.school_id,
          code: subjectData.code,
          is_active: true
        }
      });

      if (existingSubject) {
        throw new ApiError(400, 'Subject with this code already exists');
      }

      const subject = await Subject.create({
        ...subjectData,
        created_by: userId,
        updated_by: userId
      });

      return subject;
    }, 'Create Subject');
  }

  /**
   * Get all subjects with pagination and filtering
   */
  static async getAllSubjects(params, user) {
    return this.executeWithErrorHandling(async () => {
      const { 
        page = 1, 
        limit = 10, 
        search, 
        class_id, 
        category, 
        is_active, 
        branch_id,
        include_groups = false 
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
          { code: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (class_id) whereClause.class_id = class_id;
      if (category) whereClause.category = category;
      if (is_active !== '') whereClause.is_active = is_active === 'true';
      if (branch_id) whereClause.branch_id = branch_id;

      const includeOptions = [
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'code']
        },
        {
          model: School,
          as: 'school',
          attributes: ['id', 'name', 'code']
        }
      ];

      if (include_groups === 'true') {
        includeOptions.push({
          model: SubjectGroup,
          as: 'subjectGroups',
          through: { attributes: ['sort_order', 'is_required', 'weightage'] },
          attributes: ['id', 'name', 'code', 'description']
        });
      }

      const { count, rows } = await Subject.findAndCountAll({
        where: whereClause,
        include: includeOptions,
        order: [['name', 'ASC']],
        limit: parseInt(limit),
        offset: offset
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      return {
        subjects: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages
        }
      };
    }, 'Get All Subjects');
  }

  /**
   * Get subject by ID
   */
  static async getSubjectById(id, user, includeGroups = false) {
    return this.executeWithErrorHandling(async () => {
      const includeOptions = [
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'code']
        },
        {
          model: School,
          as: 'school',
          attributes: ['id', 'name', 'code']
        }
      ];

      if (includeGroups) {
        includeOptions.push({
          model: SubjectGroup,
          as: 'subjectGroups',
          through: { attributes: ['sort_order', 'is_required', 'weightage'] },
          attributes: ['id', 'name', 'code', 'description']
        });
      }

      const subject = await Subject.findOne({
        where: {
          id,
          school_id: user.school_id,
          ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
        },
        include: includeOptions
      });

      if (!subject) {
        throw new ApiError(404, 'Subject not found');
      }

      return subject;
    }, 'Get Subject By ID');
  }

  /**
   * Update subject
   */
  static async updateSubject(id, updateData, user) {
    return this.executeWithErrorHandling(async () => {
      const subject = await Subject.findOne({
        where: {
          id,
          school_id: user.school_id,
          ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
        }
      });

      if (!subject) {
        throw new ApiError(404, 'Subject not found');
      }

      // Check for duplicate subject code if code is being updated
      if (updateData.code && updateData.code !== subject.code) {
        const existingSubject = await Subject.findOne({
          where: {
            school_id: user.school_id,
            code: updateData.code,
            id: { [Op.ne]: id },
            is_active: true
          }
        });

        if (existingSubject) {
          throw new ApiError(400, 'Subject with this code already exists');
        }
      }

      await subject.update({
        ...updateData,
        updated_by: user.id
      });

      return subject;
    }, 'Update Subject');
  }

  /**
   * Delete subject
   */
  static async deleteSubject(id, user) {
    return this.executeWithErrorHandling(async () => {
      const subject = await Subject.findOne({
        where: {
          id,
          school_id: user.school_id,
          ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
        }
      });

      if (!subject) {
        throw new ApiError(404, 'Subject not found');
      }

      // Check if subject is used in any groups
      const groupUsage = await SubjectGroupSubject.count({
        where: { subject_id: id }
      });

      if (groupUsage > 0) {
        throw new ApiError(400, 'Cannot delete subject as it is used in subject groups');
      }

      await subject.destroy();

      return { message: 'Subject deleted successfully' };
    }, 'Delete Subject');
  }

  /**
   * Get subjects for dropdown (active subjects only)
   */
  static async getSubjectsForDropdown(user, filters = {}) {
    return this.executeWithErrorHandling(async () => {
      const whereClause = {
        school_id: user.school_id,
        is_active: true,
        ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
      };

      // Apply additional filters
      if (filters.class_id) whereClause.class_id = filters.class_id;
      if (filters.category) whereClause.category = filters.category;

      const subjects = await Subject.findAll({
        where: whereClause,
        attributes: ['id', 'name', 'code', 'category', 'credit_hours'],
        include: [
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          }
        ],
        order: [['name', 'ASC']]
      });

      return subjects;
    }, 'Get Subjects For Dropdown');
  }

  /**
   * Get subjects by class
   */
  static async getSubjectsByClass(classId, user) {
    return this.executeWithErrorHandling(async () => {
      const subjects = await Subject.findAll({
        where: {
          class_id: classId,
          school_id: user.school_id,
          is_active: true,
          ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
        },
        attributes: ['id', 'name', 'code', 'category', 'credit_hours', 'description'],
        include: [
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          }
        ],
        order: [['name', 'ASC']]
      });

      return subjects;
    }, 'Get Subjects By Class');
  }

  /**
   * Get subject statistics
   */
  static async getSubjectStats(user) {
    return this.executeWithErrorHandling(async () => {
      const whereClause = {
        school_id: user.school_id,
        ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
      };

      const [
        totalSubjects,
        activeSubjects,
        subjectsByCategory,
        subjectsByClass
      ] = await Promise.all([
        Subject.count({ where: whereClause }),
        Subject.count({ where: { ...whereClause, is_active: true } }),
        Subject.findAll({
          where: whereClause,
          attributes: [
            'category',
            [Subject.sequelize.fn('COUNT', Subject.sequelize.col('id')), 'count']
          ],
          group: ['category'],
          raw: true
        }),
        Subject.findAll({
          where: whereClause,
          attributes: [
            'class_id',
            [Subject.sequelize.fn('COUNT', Subject.sequelize.col('id')), 'count']
          ],
          group: ['class_id'],
          include: [
            {
              model: Class,
              as: 'class',
              attributes: ['id', 'name']
            }
          ],
          raw: true
        })
      ]);

      return {
        total_subjects: totalSubjects,
        active_subjects: activeSubjects,
        subjects_by_category: subjectsByCategory,
        subjects_by_class: subjectsByClass
      };
    }, 'Get Subject Stats');
  }

  /**
   * Bulk create subjects
   */
  static async bulkCreateSubjects(subjectsData, userId) {
    return this.executeWithErrorHandling(async () => {
      const results = [];
      
      for (const subjectData of subjectsData) {
        try {
          const subject = await this.createSubject(subjectData, userId);
          results.push({
            success: true,
            data: subject,
            name: subjectData.name
          });
        } catch (error) {
          results.push({
            success: false,
            error: error.message,
            name: subjectData.name
          });
        }
      }

      return results;
    }, 'Bulk Create Subjects');
  }

  /**
   * Search subjects
   */
  static async searchSubjects(searchTerm, user, limit = 10) {
    return this.executeWithErrorHandling(async () => {
      const whereClause = {
        school_id: user.school_id,
        is_active: true,
        ...(user.role === 'branch_admin' && { branch_id: user.branch_id }),
        [Op.or]: [
          { name: { [Op.iLike]: `%${searchTerm}%` } },
          { code: { [Op.iLike]: `%${searchTerm}%` } },
          { description: { [Op.iLike]: `%${searchTerm}%` } }
        ]
      };

      const subjects = await Subject.findAll({
        where: whereClause,
        attributes: ['id', 'name', 'code', 'category', 'credit_hours'],
        include: [
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          }
        ],
        order: [['name', 'ASC']],
        limit: parseInt(limit)
      });

      return subjects;
    }, 'Search Subjects');
  }

  /**
   * Get subjects with teacher assignments
   */
  static async getSubjectsWithTeachers(user, filters = {}) {
    return this.executeWithErrorHandling(async () => {
      const whereClause = {
        school_id: user.school_id,
        is_active: true,
        ...(user.role === 'branch_admin' && { branch_id: user.branch_id })
      };

      if (filters.class_id) whereClause.class_id = filters.class_id;

      const subjects = await Subject.findAll({
        where: whereClause,
        attributes: ['id', 'name', 'code', 'category', 'credit_hours'],
        include: [
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'name', 'code']
          },
          {
            model: User,
            as: 'teachers',
            attributes: ['id', 'first_name', 'last_name', 'email'],
            through: { attributes: [] }
          }
        ],
        order: [['name', 'ASC']]
      });

      return subjects;
    }, 'Get Subjects With Teachers');
  }
}

module.exports = SubjectService;

