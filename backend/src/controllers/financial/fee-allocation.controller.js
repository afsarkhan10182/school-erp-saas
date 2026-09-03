const { Student, Class, Section, DynamicEntityRecord } = require('~/models');
const ApiError = require('~/utils/shared/ApiError');
const { logger } = require('~/utils/shared/logger');
const { schoolWhere, resolveSchoolBranchScope } = require('~/utils/shared/requestScope');

/**
 * Get list of students in a class/section with fee allocation status
 */
const getStudentAllocationList = async (req, res, next) => {
  try {
    const { class_id, section_id, fee_group_id, branch_id } = req.query;

    if (!class_id || !fee_group_id) {
      throw new ApiError(400, 'class_id and fee_group_id are required');
    }

    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const studentWhere = {
      school_id: scope.school_id,
      class_id,
      status: 'active'
    };

    if (section_id) {
      studentWhere.section_id = section_id;
    }
    if (branch_id || scope.branch_id) {
      studentWhere.branch_id = branch_id || scope.branch_id;
    }

    const students = await Student.findAll({
      where: studentWhere,
      attributes: ['id', 'first_name', 'last_name', 'admission_number', 'roll_number', 'phone'],
      include: [
        { model: Class, as: 'class', attributes: ['id', 'name'], required: false },
        { model: Section, as: 'sectionInfo', attributes: ['id', 'name'], required: false }
      ],
      order: [['first_name', 'ASC']]
    });

    // Fetch active allocations for this fee_group_id
    const allocations = await DynamicEntityRecord.findAll({
      where: {
        school_id: scope.school_id,
        entity_type: 'fee_allocation',
        related_id: fee_group_id,
        class_id
      },
      attributes: ['id', 'student_id', 'status']
    });

    const allocatedStudentIds = new Set(allocations.map(a => String(a.student_id)));

    const result = students.map(student => {
      const studentJson = student.toJSON();
      return {
        ...studentJson,
        is_allocated: allocatedStudentIds.has(String(student.id))
      };
    });

    return res.json({
      success: true,
      data: {
        students: result,
        total: result.length,
        allocated_count: allocatedStudentIds.size
      }
    });
  } catch (error) {
    logger.error('Fee Allocation List Error:', error);
    next(error);
  }
};

/**
 * Save fee allocation for a class/section and fee group
 */
const saveFeeAllocation = async (req, res, next) => {
  try {
    const { class_id, section_id, fee_group_id, student_ids = [] } = req.body;

    if (!class_id || !fee_group_id) {
      throw new ApiError(400, 'class_id and fee_group_id are required');
    }

    const scope = await resolveSchoolBranchScope(req, { branchRequired: false });
    const selectedStudentSet = new Set(student_ids.map(id => String(id)));

    // Fetch existing allocations
    const existingAllocations = await DynamicEntityRecord.findAll({
      where: {
        school_id: scope.school_id,
        entity_type: 'fee_allocation',
        related_id: fee_group_id,
        class_id
      }
    });

    const existingStudentMap = new Map();
    existingAllocations.forEach(alloc => {
      if (alloc.student_id) {
        existingStudentMap.set(String(alloc.student_id), alloc);
      }
    });

    // Determine additions and removals
    const toCreate = [];
    const toDeleteIds = [];

    // Add new allocations
    for (const studentId of selectedStudentSet) {
      if (!existingStudentMap.has(studentId)) {
        toCreate.push({
          entity_type: 'fee_allocation',
          title: `Fee Allocation #${fee_group_id} for Student #${studentId}`,
          status: 'active',
          student_id: studentId,
          class_id: class_id,
          related_id: fee_group_id,
          school_id: scope.school_id,
          branch_id: scope.branch_id,
          created_by: req.user.id,
          payload: { section_id }
        });
      }
    }

    // Remove unselected allocations
    for (const [studentId, alloc] of existingStudentMap.entries()) {
      if (!selectedStudentSet.has(studentId)) {
        toDeleteIds.push(alloc.id);
      }
    }

    if (toCreate.length > 0) {
      await DynamicEntityRecord.bulkCreate(toCreate);
    }

    if (toDeleteIds.length > 0) {
      await DynamicEntityRecord.destroy({
        where: { id: toDeleteIds }
      });
    }

    return res.json({
      success: true,
      message: `Fee allocation updated successfully. Allocated to ${selectedStudentSet.size} students.`,
      data: {
        created_count: toCreate.length,
        removed_count: toDeleteIds.length,
        total_allocated: selectedStudentSet.size
      }
    });
  } catch (error) {
    logger.error('Save Fee Allocation Error:', error);
    next(error);
  }
};

module.exports = {
  getStudentAllocationList,
  saveFeeAllocation
};
