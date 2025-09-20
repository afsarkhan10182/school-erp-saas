const httpStatus = require('http-status');
const { Op } = require('sequelize');
const ApiError = require('~/utils/shared/ApiError');
const { success, error, asyncHandler } = require('~/utils/shared/apiResponse');
const { SubjectGroup, Subject, SubjectGroupSubject, Class, School, User } = require('~/models');
const { logger } = require('~/utils/shared/logger');

class SubjectGroupController {
  /**
   * Get all subject groups with pagination and filtering
   */
  static getAllSubjectGroups = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search, class_id, is_active, school_id, branch_id } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {
      school_id: req.schoolId,
      ...(req.user.role === 'branch_admin' && { branch_id: req.user.branch_id })
    };

    // Add search filter
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Add filters
    if (class_id) whereClause.class_id = class_id;
    if (is_active !== '') whereClause.is_active = is_active === 'true';
    if (school_id) whereClause.school_id = school_id;
    if (branch_id) whereClause.branch_id = branch_id;

    const { count, rows } = await SubjectGroup.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'code']
        },
        {
          model: School,
          as: 'school',
          attributes: ['id', 'name', 'code']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: User,
          as: 'updatedBy',
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: Subject,
          as: 'subjects',
          through: { attributes: ['sort_order', 'is_required', 'weightage'] },
          attributes: ['id', 'name', 'code', 'category', 'credit_hours']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    success(
      res,
      {
        subject_groups: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages
        }
      },
      'Subject groups retrieved successfully'
    );
  });

  /**
   * Get subject group by ID
   */
  static getSubjectGroupById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const subjectGroup = await SubjectGroup.findOne({
      where: {
        id,
        school_id: req.schoolId,
        ...(req.user.role === 'branch_admin' && { branch_id: req.user.branch_id })
      },
      include: [
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'code']
        },
        {
          model: School,
          as: 'school',
          attributes: ['id', 'name', 'code']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: User,
          as: 'updatedBy',
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: Subject,
          as: 'subjects',
          through: { attributes: ['sort_order', 'is_required', 'weightage'] },
          attributes: ['id', 'name', 'code', 'category', 'credit_hours']
        }
      ]
    });

    if (!subjectGroup) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Subject group not found');
    }

    success(res, { subject_group: subjectGroup }, 'Subject group retrieved successfully');
  });

  /**
   * Create new subject group
   */
  static createSubjectGroup = asyncHandler(async (req, res) => {
    const subjectGroupData = {
      ...req.body,
      school_id: req.schoolId,
      branch_id: req.branchId || req.user.branch_id,
      created_by: req.user.id,
      updated_by: req.user.id
    };

    const subjectGroup = await SubjectGroup.create(subjectGroupData);

    // Load the created subject group with associations
    const createdSubjectGroup = await SubjectGroup.findByPk(subjectGroup.id, {
      include: [
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
      ]
    });

    success(
      res,
      { subject_group: createdSubjectGroup },
      'Subject group created successfully',
      httpStatus.CREATED
    );
  });

  /**
   * Update subject group
   */
  static updateSubjectGroup = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updated_by: req.user.id
    };

    const subjectGroup = await SubjectGroup.findOne({
      where: {
        id,
        school_id: req.schoolId,
        ...(req.user.role === 'branch_admin' && { branch_id: req.user.branch_id })
      }
    });

    if (!subjectGroup) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Subject group not found');
    }

    await subjectGroup.update(updateData);

    // Load the updated subject group with associations
    const updatedSubjectGroup = await SubjectGroup.findByPk(id, {
      include: [
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'code']
        },
        {
          model: School,
          as: 'school',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Subject,
          as: 'subjects',
          through: { attributes: ['sort_order', 'is_required', 'weightage'] },
          attributes: ['id', 'name', 'code', 'category', 'credit_hours']
        }
      ]
    });

    success(res, { subject_group: updatedSubjectGroup }, 'Subject group updated successfully');
  });

  /**
   * Delete subject group
   */
  static deleteSubjectGroup = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const subjectGroup = await SubjectGroup.findOne({
      where: {
        id,
        school_id: req.schoolId,
        ...(req.user.role === 'branch_admin' && { branch_id: req.user.branch_id })
      }
    });

    if (!subjectGroup) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Subject group not found');
    }

    await subjectGroup.destroy();

    success(res, null, 'Subject group deleted successfully');
  });

  /**
   * Add subjects to subject group
   */
  static addSubjectsToGroup = asyncHandler(async (req, res) => {
    const { id: groupId } = req.params;
    const { subjects } = req.body;

    const subjectGroup = await SubjectGroup.findOne({
      where: {
        id: groupId,
        school_id: req.schoolId,
        ...(req.user.role === 'branch_admin' && { branch_id: req.user.branch_id })
      }
    });

    if (!subjectGroup) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Subject group not found');
    }

    // Validate that all subjects exist and belong to the same school
    const subjectIds = subjects.map(s => s.subject_id);
    const existingSubjects = await Subject.findAll({
      where: {
        id: { [Op.in]: subjectIds },
        school_id: req.schoolId
      }
    });

    if (existingSubjects.length !== subjectIds.length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Some subjects do not exist or do not belong to this school'
      );
    }

    // Prepare subject group assignments
    const assignments = subjects.map(subject => ({
      subject_group_id: groupId,
      subject_id: subject.subject_id,
      sort_order: subject.sort_order || 0,
      is_required: subject.is_required !== false,
      weightage: subject.weightage || 100.0
    }));

    // Bulk create assignments
    await SubjectGroupSubject.bulkCreate(assignments, {
      updateOnDuplicate: ['sort_order', 'is_required', 'weightage']
    });

    // Load updated subject group
    const updatedSubjectGroup = await SubjectGroup.findByPk(groupId, {
      include: [
        {
          model: Subject,
          as: 'subjects',
          through: { attributes: ['sort_order', 'is_required', 'weightage'] },
          attributes: ['id', 'name', 'code', 'category', 'credit_hours']
        }
      ]
    });

    success(res, { subject_group: updatedSubjectGroup }, 'Subjects added to group successfully');
  });

  /**
   * Remove subjects from subject group
   */
  static removeSubjectsFromGroup = asyncHandler(async (req, res) => {
    const { id: groupId } = req.params;
    const { subject_ids } = req.body;

    const subjectGroup = await SubjectGroup.findOne({
      where: {
        id: groupId,
        school_id: req.schoolId,
        ...(req.user.role === 'branch_admin' && { branch_id: req.user.branch_id })
      }
    });

    if (!subjectGroup) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Subject group not found');
    }

    // Remove subject assignments
    await SubjectGroupSubject.destroy({
      where: {
        subject_group_id: groupId,
        subject_id: { [Op.in]: subject_ids }
      }
    });

    // Load updated subject group
    const updatedSubjectGroup = await SubjectGroup.findByPk(groupId, {
      include: [
        {
          model: Subject,
          as: 'subjects',
          through: { attributes: ['sort_order', 'is_required', 'weightage'] },
          attributes: ['id', 'name', 'code', 'category', 'credit_hours']
        }
      ]
    });

    success(
      res,
      { subject_group: updatedSubjectGroup },
      'Subjects removed from group successfully'
    );
  });

  /**
   * Get subject groups for dropdown
   */
  static getSubjectGroupsForDropdown = asyncHandler(async (req, res) => {
    const { class_id, is_active } = req.query;

    const whereClause = {
      school_id: req.schoolId,
      ...(req.user.role === 'branch_admin' && { branch_id: req.user.branch_id })
    };

    if (class_id) whereClause.class_id = class_id;
    if (is_active !== '') whereClause.is_active = is_active === 'true';

    const subjectGroups = await SubjectGroup.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'code', 'description'],
      include: [
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [['name', 'ASC']]
    });

    success(res, { subject_groups: subjectGroups }, 'Subject groups retrieved successfully');
  });
}

module.exports = SubjectGroupController;
