const { Student, Class, Section, StudentPromotion, AcademicYear } = require('~/models');
const { sequelize } = require('~/config/database');
const { logger } = require('~/utils/shared/logger');
const { Op } = require('sequelize');
const { schoolWhere } = require('~/utils/shared/requestScope');

const schoolScope = req => schoolWhere(req);

const getPromotionStudents = async (req, res) => {
  try {
    const { class_id, section_id } = req.query;
    const scope = schoolScope(req);
    if (!class_id || !scope.school_id) {
      return res
        .status(400)
        .json({ success: false, message: 'school context and class_id are required' });
    }

    const sourceClass = await Class.findOne({ where: { id: class_id, ...scope } });
    if (!sourceClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    if (section_id) {
      const section = await Section.findOne({
        where: {
          id: section_id,
          class_id,
          school_id: sourceClass.school_id,
          branch_id: sourceClass.branch_id
        }
      });
      if (!section) {
        return res
          .status(404)
          .json({ success: false, message: 'Section not found for this class' });
      }
    }

    const students = await Student.findAll({
      where: {
        ...scope,
        status: { [Op.ne]: 'deleted' },
        branch_id: sourceClass.branch_id,
        class_id,
        ...(section_id ? { section_id } : {})
      },
      include: [
        { model: Class, as: 'class', attributes: ['id', 'name'] },
        { model: Section, as: 'sectionInfo', attributes: ['id', 'name'], required: false }
      ],
      order: [
        ['roll_number', 'ASC'],
        ['first_name', 'ASC']
      ]
    });

    return res.json({ success: true, data: { students } });
  } catch (error) {
    logger.error('getPromotionStudents', error);
    return res.status(500).json({ success: false, message: 'Failed to load promotion students' });
  }
};

const promoteStudents = async (req, res) => {
  try {
    const {
      from_class_id,
      from_section_id,
      to_class_id,
      to_section_id,
      to_academic_year,
      students
    } = req.body;
    const scope = schoolScope(req);

    if (
      !scope.school_id ||
      !from_class_id ||
      !to_class_id ||
      !to_academic_year ||
      !Array.isArray(students) ||
      students.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'school context, source/target class, target academic year and students are required'
      });
    }

    const studentIds = students.map(item => item?.student_id);
    if (
      studentIds.some(id => typeof id !== 'string' || !id) ||
      new Set(studentIds).size !== studentIds.length ||
      students.some(
        item => !item || (item.action !== undefined && !['promote', 'repeat'].includes(item.action))
      )
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid or duplicate student promotion entries' });
    }

    const [sourceClass, targetClass, targetYear] = await Promise.all([
      Class.findOne({ where: { id: from_class_id, ...scope } }),
      Class.findOne({ where: { id: to_class_id, ...scope, is_active: true } }),
      AcademicYear.findOne({ where: { name: to_academic_year } })
    ]);
    if (!sourceClass || !targetClass) {
      return res.status(404).json({ success: false, message: 'Source or target class not found' });
    }
    if (!targetYear) {
      return res.status(400).json({ success: false, message: 'Target academic year not found' });
    }
    if (sourceClass.branch_id !== targetClass.branch_id) {
      return res
        .status(400)
        .json({ success: false, message: 'Promotion must stay within the same branch' });
    }

    if (from_section_id) {
      const sourceSection = await Section.findOne({
        where: {
          id: from_section_id,
          class_id: sourceClass.id,
          school_id: sourceClass.school_id,
          branch_id: sourceClass.branch_id
        }
      });
      if (!sourceSection) {
        return res
          .status(400)
          .json({ success: false, message: 'Source section does not belong to this class' });
      }
    }
    let targetSection = null;
    if (to_section_id) {
      targetSection = await Section.findOne({
        where: {
          id: to_section_id,
          class_id: targetClass.id,
          school_id: targetClass.school_id,
          branch_id: targetClass.branch_id,
          is_active: true
        }
      });
      if (!targetSection) {
        return res
          .status(400)
          .json({ success: false, message: 'Target section does not belong to this class' });
      }
    }

    const result = await sequelize.transaction(async transaction => {
      const classStudents = await Student.findAll({
        where: {
          ...scope,
          status: { [Op.ne]: 'deleted' },
          branch_id: sourceClass.branch_id,
          class_id: sourceClass.id,
          id: { [Op.in]: studentIds },
          ...(from_section_id ? { section_id: from_section_id } : {})
        },
        order: [['id', 'ASC']],
        transaction,
        lock: { level: transaction.LOCK.UPDATE, of: Student }
      });

      if (classStudents.length !== studentIds.length) {
        const error = new Error('One or more students are outside the selected class or scope');
        error.status = 404;
        throw error;
      }
      if (classStudents.some(student => student.academic_year === to_academic_year)) {
        const error = new Error('One or more students are already in the target academic year');
        error.status = 409;
        throw error;
      }

      const studentsById = new Map(classStudents.map(student => [student.id, student]));
      const promoted = [];
      for (const item of students) {
        const student = studentsById.get(item.student_id);
        const action = item.action || 'promote';
        await StudentPromotion.create(
          {
            student_id: student.id,
            from_class_id: sourceClass.id,
            from_section_id: from_section_id || student.section_id,
            to_class_id: action === 'promote' ? targetClass.id : student.class_id,
            to_section_id: action === 'promote' ? to_section_id || null : student.section_id,
            from_academic_year: student.academic_year,
            to_academic_year,
            action,
            school_id: student.school_id,
            branch_id: student.branch_id,
            created_by: req.user.id
          },
          { transaction }
        );

        await student.update(
          action === 'promote'
            ? {
                class_id: targetClass.id,
                section_id: to_section_id || null,
                current_class: targetClass.name,
                section: targetSection?.name || null,
                academic_year: to_academic_year
              }
            : { academic_year: to_academic_year },
          { transaction }
        );
        promoted.push({ id: student.id, action });
      }

      return { count: promoted.length, students: promoted };
    });

    return res.json({ success: true, message: 'Promotion saved', data: result });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    logger.error('promoteStudents', error);
    return res.status(500).json({ success: false, message: 'Failed to save student promotion' });
  }
};

module.exports = { getPromotionStudents, promoteStudents };
