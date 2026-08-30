const { Op } = require('sequelize');
const { ExamSeating, ExamHall, Exam, ExamSchedule, Student, Class } = require('~/models');
const { logger } = require('~/utils/shared/logger');
const { schoolWhere, resolveSchoolBranchScope } = require('~/utils/shared/requestScope');

const list = async (req, res) => {
  try {
    const scope = await resolveSchoolBranchScope(req, { allowSchoolWide: true });
    const where = { school_id: scope.school_id };
    if (scope.branch_id) where.branch_id = scope.branch_id;
    if (req.query.exam_id) where.exam_id = req.query.exam_id;
    const rows = await ExamSeating.findAll({
      where,
      include: [
        { model: ExamHall, as: 'hall', attributes: ['id', 'name', 'capacity'], required: false },
        { model: Exam, as: 'exam', attributes: ['id', 'name'], required: false },
        { model: Class, as: 'class', attributes: ['id', 'name'], required: false }
      ],
      order: [['created_at', 'DESC']]
    });
    return res.json({ success: true, data: { seatings: rows } });
  } catch (error) {
    logger.error('exam seating list', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Build bench-wise seating plan from hall capacity, students per bench, and class roster.
 */
const buildPlan = (students, capacity, studentsPerBench) => {
  const spb = Math.max(1, Math.min(3, Number(studentsPerBench) || 2));
  const benches = Math.max(1, Math.ceil(capacity / spb));
  const plan = [];
  let idx = 0;
  for (let b = 1; b <= benches && idx < students.length; b++) {
    const seats = [];
    for (let s = 1; s <= spb && idx < students.length; s++) {
      const st = students[idx++];
      seats.push({
        seat: s,
        student_id: st.id,
        name: `${st.first_name} ${st.last_name || ''}`.trim(),
        admission_number: st.admission_number,
        roll_number: st.roll_number
      });
    }
    plan.push({ bench: b, seats });
  }
  return { plan, assigned: idx, unassigned: students.slice(idx).map(st => ({
    student_id: st.id,
    name: `${st.first_name} ${st.last_name || ''}`.trim(),
    admission_number: st.admission_number
  })) };
};

const scheduleMeta = schedule => schedule ? {
  id: schedule.id,
  exam_date: schedule.exam_date,
  start_time: schedule.start_time,
  end_time: schedule.end_time
} : null;

const benchesFrom = planJson => Array.isArray(planJson) ? planJson : planJson?.benches || [];

const preview = async (req, res) => {
  try {
    const { exam_hall_id, exam_schedule_id, class_id, section_id, students_per_bench } = req.body;
    if (!exam_hall_id && !exam_schedule_id) {
      return res.status(400).json({ success: false, message: 'exam_hall_id required' });
    }
    const scope = await resolveSchoolBranchScope(req, { branchRequired: true });
    let schedule = null;
    if (exam_schedule_id) {
      schedule = await ExamSchedule.findOne({
        where: { id: exam_schedule_id, school_id: scope.school_id, branch_id: scope.branch_id }
      });
      if (!schedule) return res.status(404).json({ success: false, message: 'Schedule slot not found' });
    }
    const finalHallId = schedule?.exam_hall_id || exam_hall_id;
    const finalClassId = schedule?.class_id || class_id;
    const finalSectionId = schedule?.section_id || section_id;
    const hall = await ExamHall.findOne({
      where: { id: finalHallId, school_id: scope.school_id, branch_id: scope.branch_id }
    });
    if (!hall) return res.status(404).json({ success: false, message: 'Hall not found' });

    const studentWhere = {
      school_id: scope.school_id,
      branch_id: scope.branch_id,
      status: { [Op.ne]: 'deleted' }
    };
    if (finalClassId) studentWhere.class_id = finalClassId;
    if (finalSectionId) studentWhere.section_id = finalSectionId;

    const students = await Student.findAll({
      where: studentWhere,
      attributes: ['id', 'first_name', 'last_name', 'admission_number', 'roll_number'],
      order: [
        ['roll_number', 'ASC'],
        ['first_name', 'ASC']
      ],
      limit: 500
    });

    const result = buildPlan(students, hall.capacity, students_per_bench);
    return res.json({
      success: true,
      data: {
        hall: { id: hall.id, name: hall.name, capacity: hall.capacity },
        students_count: students.length,
        students_per_bench: Math.max(1, Math.min(3, Number(students_per_bench) || 2)),
        ...result
      }
    });
  } catch (error) {
    logger.error('exam seating preview', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const apply = async (req, res) => {
  try {
    const {
      exam_id,
      exam_hall_id,
      exam_schedule_id,
      class_id,
      section_id,
      students_per_bench
    } = req.body;
    if (!exam_schedule_id && (!exam_id || !exam_hall_id)) {
      return res.status(400).json({ success: false, message: 'exam_id and exam_hall_id required' });
    }

    const scope = await resolveSchoolBranchScope(req, { branchRequired: true });
    let schedule = null;
    if (exam_schedule_id) {
      schedule = await ExamSchedule.findOne({
        where: { id: exam_schedule_id, school_id: scope.school_id, branch_id: scope.branch_id }
      });
      if (!schedule) return res.status(404).json({ success: false, message: 'Schedule slot not found' });
    }
    const finalExamId = schedule?.exam_id || exam_id;
    const finalHallId = schedule?.exam_hall_id || exam_hall_id;
    const finalClassId = schedule?.class_id || class_id;
    const finalSectionId = schedule?.section_id || section_id;
    const exam = await Exam.findOne({ where: { id: finalExamId, school_id: scope.school_id, branch_id: scope.branch_id } });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    const hall = await ExamHall.findOne({
      where: { id: finalHallId, school_id: scope.school_id, branch_id: scope.branch_id }
    });
    if (!hall) return res.status(404).json({ success: false, message: 'Hall not found' });

    const studentWhere = {
      school_id: scope.school_id,
      branch_id: scope.branch_id,
      status: { [Op.ne]: 'deleted' }
    };
    if (finalClassId) studentWhere.class_id = finalClassId;
    if (finalSectionId) studentWhere.section_id = finalSectionId;
    const students = await Student.findAll({
      where: studentWhere,
      attributes: ['id', 'first_name', 'last_name', 'admission_number', 'roll_number'],
      order: [
        ['roll_number', 'ASC'],
        ['first_name', 'ASC']
      ],
      limit: 500
    });
    const plan = buildPlan(students, hall.capacity, students_per_bench).plan;
    const planJson = schedule ? { schedule: scheduleMeta(schedule), benches: plan } : plan;

    const existing = await ExamSeating.findOne({
      where: {
        school_id: scope.school_id,
        branch_id: scope.branch_id,
        exam_id: finalExamId,
        exam_hall_id: finalHallId,
        class_id: finalClassId || { [Op.is]: null },
        section_id: finalSectionId || { [Op.is]: null },
        status: 'active'
      }
    });

    let row;
    if (existing) {
      await existing.update({
        plan_json: planJson,
        students_per_bench: Number(students_per_bench) || 2,
        updated_by: req.user.id
      });
      row = existing;
    } else {
      row = await ExamSeating.create({
        exam_id: finalExamId,
        exam_hall_id: finalHallId,
        class_id: finalClassId || null,
        section_id: finalSectionId || null,
        students_per_bench: Number(students_per_bench) || 2,
        plan_json: planJson,
        status: 'active',
        school_id: scope.school_id,
        branch_id: scope.branch_id,
        created_by: req.user.id
      });
    }

    return res.json({ success: true, data: { seating: row } });
  } catch (error) {
    logger.error('exam seating apply', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const overview = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await ExamSeating.findOne({
      where: { id, ...schoolWhere(req) },
      include: [
        { model: ExamHall, as: 'hall', attributes: ['id', 'name', 'capacity'] },
        { model: Exam, as: 'exam', attributes: ['id', 'name'] },
        { model: Class, as: 'class', attributes: ['id', 'name'] }
      ]
    });
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });

    const stickers = [];
    benchesFrom(row.plan_json).forEach(bench => {
      (bench.seats || []).forEach(seat => {
        stickers.push({
          bench: bench.bench,
          seat: seat.seat,
          name: seat.name,
          admission_number: seat.admission_number,
          hall: row.hall?.name,
          exam: row.exam?.name
        });
      });
    });

    return res.json({
      success: true,
      data: { seating: row, stickers }
    });
  } catch (error) {
    logger.error('exam seating overview', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const reset = async (req, res) => {
  try {
    const row = await ExamSeating.findOne({ where: { id: req.params.id, ...schoolWhere(req) } });
    if (!row) return res.status(404).json({ success: false, message: 'Not found' });
    await row.update({ status: 'reset', plan_json: [], updated_by: req.user.id });
    return res.json({ success: true, data: { seating: row } });
  } catch (error) {
    logger.error('exam seating reset', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { list, preview, apply, overview, reset };
