const { Student, Class, Section, FeeStructure, DynamicEntityRecord } = require('~/models');
const { Op } = require('sequelize');
const ApiError = require('~/utils/shared/ApiError');
const { logger } = require('~/utils/shared/logger');
const { resolveSchoolBranchScope } = require('~/utils/shared/requestScope');
const getStudentInvoiceTotals = require('~/utils/financial/studentInvoiceTotals');

const getAllocationContext = async (req, { class_id, section_id, fee_group_id }) => {
  if (!class_id || !fee_group_id) {
    throw new ApiError(400, 'class_id and fee_group_id are required');
  }
  if (req.user?.role === 'branch_admin' && !req.user.branch_id) {
    throw new ApiError(403, 'Branch access is not configured for this account');
  }

  const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
  const classWhere = { id: class_id, school_id: scope.school_id };
  if (scope.branch_id) classWhere.branch_id = scope.branch_id;
  const classRecord = await Class.findOne({ where: classWhere });
  if (!classRecord) throw new ApiError(400, 'Invalid class for this school or branch');

  const feeStructure = await FeeStructure.findOne({
    where: {
      id: fee_group_id,
      school_id: scope.school_id,
      [Op.or]: [{ branch_id: classRecord.branch_id }, { branch_id: null }]
    }
  });
  if (!feeStructure) throw new ApiError(400, 'Invalid fee structure for this school or branch');

  const applicableClasses = feeStructure.applicable_classes || [];
  const appliesToClass = applicableClasses.length
    ? applicableClasses.includes(classRecord.name)
    : feeStructure.class_id
      ? String(feeStructure.class_id) === String(classRecord.id)
      : feeStructure.class_name === classRecord.name;
  if (!appliesToClass) throw new ApiError(400, 'Fee structure does not apply to this class');

  let sectionRecord = null;
  if (section_id) {
    sectionRecord = await Section.findOne({
      where: {
        id: section_id,
        class_id,
        school_id: scope.school_id,
        branch_id: classRecord.branch_id
      }
    });
    if (!sectionRecord) throw new ApiError(400, 'Invalid section for this class or branch');
  }

  if (feeStructure.section && feeStructure.section !== sectionRecord?.name) {
    throw new ApiError(400, 'Select the section assigned to this fee structure');
  }

  const studentWhere = {
    school_id: scope.school_id,
    branch_id: classRecord.branch_id,
    class_id,
    status: 'active'
  };
  if (section_id) studentWhere.section_id = section_id;
  if (feeStructure.stream_ids?.length) {
    studentWhere.stream_id = { [Op.in]: feeStructure.stream_ids };
  }

  return { scope, classRecord, feeStructure, sectionRecord, studentWhere };
};

/**
 * Get list of students in a class/section with fee allocation status
 */
const getStudentAllocationList = async (req, res, next) => {
  try {
    const context = await getAllocationContext(req, req.query);
    const { scope, studentWhere, feeStructure } = context;

    const students = await Student.findAll({
      where: studentWhere,
      attributes: ['id', 'first_name', 'last_name', 'admission_number', 'roll_number', 'phone'],
      include: [
        { model: Class, as: 'class', attributes: ['id', 'name'], required: false },
        { model: Section, as: 'sectionInfo', attributes: ['id', 'name'], required: false }
      ],
      order: [['first_name', 'ASC']]
    });
    const invoiceTotals = await getStudentInvoiceTotals(
      students.map(student => ({ id: student.id, school_id: scope.school_id })),
      { includePaid: true }
    );

    const allocations = students.length
      ? await DynamicEntityRecord.findAll({
          where: {
            school_id: scope.school_id,
            entity_type: 'fee_allocation',
            related_id: feeStructure.id,
            class_id: req.query.class_id,
            student_id: { [Op.in]: students.map(student => student.id) },
            status: 'active'
          },
          attributes: ['id', 'student_id', 'status']
        })
      : [];

    const allocatedStudentIds = new Set(allocations.map(a => String(a.student_id)));

    const result = students.map(student => {
      const studentJson = student.toJSON();
      return {
        ...studentJson,
        ...(invoiceTotals.get(`${scope.school_id}:${student.id}`) || {
          total_billed: 0,
          total_paid: 0,
          total_due: 0
        }),
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
    const body = req.body || {};
    const { class_id, section_id, fee_group_id, student_ids } = body;
    if (!Array.isArray(student_ids)) throw new ApiError(400, 'student_ids must be an array');

    const { scope, classRecord, feeStructure, studentWhere } = await getAllocationContext(
      req,
      body
    );
    const selectedStudentSet = new Set(student_ids.map(id => String(id)));
    const roster = await Student.findAll({
      where: studentWhere,
      attributes: ['id']
    });
    const rosterIds = new Set(roster.map(student => String(student.id)));
    if ([...selectedStudentSet].some(id => !rosterIds.has(id))) {
      throw new ApiError(
        400,
        'Selected students must belong to the chosen class, section, and branch'
      );
    }

    const existingAllocations = roster.length
      ? await DynamicEntityRecord.findAll({
          where: {
            school_id: scope.school_id,
            entity_type: 'fee_allocation',
            related_id: feeStructure.id,
            class_id,
            student_id: { [Op.in]: roster.map(student => student.id) }
          }
        })
      : [];

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
          branch_id: classRecord.branch_id,
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
        where: { id: toDeleteIds, school_id: scope.school_id, entity_type: 'fee_allocation' }
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
