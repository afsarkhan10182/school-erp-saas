const { Student, Class, Section, StudentPromotion } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { Op } = require('sequelize');
const { schoolWhere } = require('~/utils/shared/requestScope');

const schoolScope = req => schoolWhere(req, { status: { [Op.ne]: 'deleted' } });

const getPromotionStudents = async (req, res) => {
  try {
    const { class_id, section_id } = req.query;
    if (!class_id) {
      return res.status(400).json({ success: false, message: 'class_id is required' });
    }
    const where = { ...schoolScope(req), class_id };
    if (section_id) where.section_id = section_id;

    const students = await Student.findAll({
      where,
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
    return res.status(500).json({ success: false, message: error.message });
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

    if (!from_class_id || !to_class_id || !to_academic_year || !Array.isArray(students)) {
      return res.status(400).json({
        success: false,
        message: 'from_class_id, to_class_id, to_academic_year and students are required'
      });
    }

    const toClass = await Class.findByPk(to_class_id);
    if (!toClass) {
      return res.status(404).json({ success: false, message: 'Target class not found' });
    }

    const promoted = [];
    for (const item of students) {
      const student = await Student.findOne({
        where: { id: item.student_id, ...schoolScope(req) }
      });
      if (!student) continue;

      const action = item.action === 'repeat' ? 'repeat' : 'promote';
      await StudentPromotion.create({
        student_id: student.id,
        from_class_id,
        from_section_id: from_section_id || student.section_id,
        to_class_id: action === 'promote' ? to_class_id : student.class_id,
        to_section_id: action === 'promote' ? to_section_id || null : student.section_id,
        from_academic_year: student.academic_year,
        to_academic_year,
        action,
        school_id: student.school_id,
        branch_id: student.branch_id,
        created_by: req.user.id
      });

      if (action === 'promote') {
        await student.update({
          class_id: to_class_id,
          section_id: to_section_id || null,
          current_class: toClass.name,
          academic_year: to_academic_year
        });
      } else {
        await student.update({ academic_year: to_academic_year });
      }
      promoted.push({ id: student.id, action });
    }

    return res.json({
      success: true,
      message: 'Promotion saved',
      data: { count: promoted.length, students: promoted }
    });
  } catch (error) {
    logger.error('promoteStudents', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getPromotionStudents, promoteStudents };
