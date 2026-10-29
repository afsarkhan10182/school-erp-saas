const { Op, literal } = require('sequelize');
const {
  sequelize,
  LiveClass,
  LiveClassAttendance,
  Student,
  Class,
  Section,
  Subject,
  User,
  ClassTeacher,
  SubjectTeacher
} = require('~/models');
const { resolveSchoolBranchScope } = require('~/utils/shared/requestScope');
const { logger } = require('~/utils/shared/logger');
const { getCurrentAcademicYearForSchool } = require('~/utils/academic/academicYearUtils');

const attendanceStatuses = ['present', 'late', 'left_early', 'insufficient', 'absent'];
const httpStatusFor = error =>
  Number.isInteger(error.statusCode)
    ? error.statusCode
    : Number.isInteger(error.status)
      ? error.status
      : 500;
const validUrl = value => {
  try {
    const url = new URL(String(value || '').trim());
    return url.protocol === 'https:' && !url.username && !url.password && url.href.length <= 1000
      ? url.href
      : null;
  } catch {
    return null;
  }
};
const scopeFor = (req, required = true) => {
  if (['branch_admin', 'teacher'].includes(req.user.role) && !req.user.branch_id) {
    throw Object.assign(new Error('Branch assignment is required'), { status: 403 });
  }
  const requestedBranch = req.query?.branch_id || req.body?.branch_id || req.branchId;
  const schoolWideManagerRead =
    !required && !requestedBranch && ['admin', 'super_admin'].includes(req.user.role);
  const request = schoolWideManagerRead
    ? { ...req, user: { ...req.user, branch_id: null } }
    : ['branch_admin', 'teacher'].includes(req.user.role)
      ? {
          ...req,
          query: { ...req.query, branch_id: req.user.branch_id },
          body: { ...req.body, branch_id: req.user.branch_id }
        }
      : req;
  return resolveSchoolBranchScope(request, {
    branchRequired: required,
    allowSchoolWide: !required,
    lockAssignedBranch: ['branch_admin', 'teacher'].includes(req.user.role)
  });
};
const canTeachPlacement = async ({
  teacherId,
  schoolId,
  branchId,
  classId,
  sectionId,
  subjectId
}) => {
  const year = await getCurrentAcademicYearForSchool(schoolId);
  const academicYear = year?.code || year?.name;
  if (!academicYear) return false;
  const where = {
    teacher_id: teacherId,
    school_id: schoolId,
    branch_id: branchId,
    class_id: classId,
    academic_year: academicYear,
    ...(sectionId
      ? { [Op.or]: [{ section_id: null }, { section_id: sectionId }] }
      : { section_id: null })
  };
  if (subjectId)
    return Boolean(await SubjectTeacher.findOne({ where: { ...where, subject_id: subjectId } }));
  return Boolean(await ClassTeacher.findOne({ where: { ...where, is_active: true } }));
};
const sessionWhere = (scope, id) => ({
  id,
  school_id: scope.school_id,
  ...(scope.branch_id ? { branch_id: scope.branch_id } : {})
});
const assertTeacherSession = async (req, session) =>
  req.user.role !== 'teacher' ||
  (session.teacher_id === req.user.id &&
    (await canTeachPlacement({
      teacherId: req.user.id,
      schoolId: session.school_id,
      branchId: session.branch_id,
      classId: session.class_id,
      sectionId: session.section_id,
      subjectId: session.subject_id
    })));
const includes = [
  { model: Class, as: 'class', attributes: ['id', 'name'] },
  { model: Section, as: 'section', attributes: ['id', 'name'] },
  { model: Subject, as: 'subject', attributes: ['id', 'name'] },
  { model: User, as: 'teacher', attributes: ['id', 'first_name', 'last_name', 'email'] }
];

const list = async (req, res) => {
  try {
    const scope = await scopeFor(req, false);
    const where = {
      school_id: scope.school_id,
      ...(scope.branch_id ? { branch_id: scope.branch_id } : {})
    };
    if (req.user.role === 'teacher') where.teacher_id = req.user.id;
    const now = new Date();
    if (req.query.status === 'cancelled') where.status = 'cancelled';
    if (req.query.status === 'scheduled') {
      where.status = 'scheduled';
      where.scheduled_at = { [Op.gt]: now };
    }
    if (req.query.status === 'live') {
      where.status = 'scheduled';
      where.scheduled_at = { [Op.lte]: now };
      where[Op.and] = [
        literal(
          '"LiveClass"."scheduled_at" + ("LiveClass"."duration_minutes" * INTERVAL \'1 minute\') > NOW()'
        )
      ];
    }
    if (req.query.status === 'past') {
      where.status = 'scheduled';
      where[Op.and] = [
        literal(
          '"LiveClass"."scheduled_at" + ("LiveClass"."duration_minutes" * INTERVAL \'1 minute\') <= NOW()'
        )
      ];
    }
    const search = String(req.query.search || '')
      .trim()
      .slice(0, 100);
    if (search) where.title = { [Op.iLike]: `%${search}%` };
    const { date_from: dateFrom, date_to: dateTo } = req.query;
    if (dateFrom || dateTo) {
      const start = new Date(dateFrom);
      const end = new Date(dateTo);
      if (
        !dateFrom ||
        !dateTo ||
        !Number.isFinite(start.getTime()) ||
        !Number.isFinite(end.getTime()) ||
        start.toISOString() !== dateFrom ||
        end.toISOString() !== dateTo ||
        end <= start ||
        end - start > 32 * 24 * 60 * 60 * 1000
      ) {
        return res.status(400).json({ success: false, message: 'Choose a valid date range up to 32 days.' });
      }
      where.scheduled_at = {
        ...(where.scheduled_at || {}),
        [Op.gte]: start,
        [Op.lt]: end
      };
    }
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
    const { rows, count } = await LiveClass.findAndCountAll({
      where,
      include: includes,
      order: [['scheduled_at', 'DESC']],
      limit,
      offset: (page - 1) * limit
    });
    return res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) }
    });
  } catch (error) {
    logger.error('live class list', error);
    return res.status(httpStatusFor(error)).json({ success: false, message: error.message });
  }
};

const placement = async (req, scope) => {
  const {
    title,
    class_id: classId,
    section_id: sectionId,
    subject_id: subjectId,
    teacher_id: requestedTeacher,
    scheduled_at: scheduledAt,
    duration_minutes: duration,
    meeting_url: rawUrl
  } = req.body || {};
  const teacherId = req.user.role === 'teacher' ? req.user.id : requestedTeacher;
  const url = validUrl(rawUrl);
  const start = new Date(scheduledAt);
  if (
    !String(title || '').trim() ||
    String(title).trim().length > 180 ||
    !classId ||
    !teacherId ||
    !scheduledAt ||
    Number.isNaN(start.valueOf()) ||
    !Number.isInteger(Number(duration)) ||
    Number(duration) < 5 ||
    Number(duration) > 600 ||
    !url
  ) {
    return {
      error:
        'Enter a title, class, teacher, valid start time, duration (5–600 minutes), and HTTPS meeting link.'
    };
  }
  const classroom = await Class.findOne({
    where: { id: classId, school_id: scope.school_id, branch_id: scope.branch_id }
  });
  if (!classroom) return { error: 'Class is not in the selected branch.' };
  if (
    sectionId &&
    !(await Section.findOne({
      where: {
        id: sectionId,
        class_id: classId,
        school_id: scope.school_id,
        branch_id: scope.branch_id
      }
    }))
  ) {
    return { error: 'Section is not part of the selected class.' };
  }
  if (
    subjectId &&
    !(await Subject.findOne({
      where: {
        id: subjectId,
        school_id: scope.school_id,
        [Op.and]: [
          { [Op.or]: [{ class_id: classId }, { class_id: null }] },
          { [Op.or]: [{ branch_id: scope.branch_id }, { branch_id: null }] }
        ]
      }
    }))
  ) {
    return { error: 'Subject is not available for the selected class and branch.' };
  }
  const teacher = await User.findOne({
    where: { id: teacherId, school_id: scope.school_id, role: 'teacher', status: 'active' }
  });
  if (!teacher || teacher.branch_id !== scope.branch_id)
    return { error: 'Select an active teacher assigned to this branch.' };
  if (
    !(await canTeachPlacement({
      teacherId,
      schoolId: scope.school_id,
      branchId: scope.branch_id,
      classId,
      sectionId,
      subjectId
    }))
  ) {
    return { error: 'Teacher is not assigned to this class, section, and subject.' };
  }
  return {
    values: {
      title: String(title).trim(),
      description: String(req.body.description || '').trim() || null,
      scheduled_at: start,
      duration_minutes: Number(duration),
      provider: 'external_link',
      meeting_url: url,
      school_id: scope.school_id,
      branch_id: scope.branch_id,
      class_id: classId,
      section_id: sectionId || null,
      subject_id: subjectId || null,
      teacher_id: teacherId
    }
  };
};

const create = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const scope = await scopeFor(req);
    const result = await placement(req, scope);
    if (result.error) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: result.error });
    }
    const session = await LiveClass.create(
      { ...result.values, created_by: req.user.id },
      { transaction }
    );
    const students = await Student.findAll({
      where: {
        school_id: scope.school_id,
        branch_id: scope.branch_id,
        class_id: session.class_id,
        ...(session.section_id ? { section_id: session.section_id } : {}),
        status: 'active'
      },
      attributes: ['id'],
      transaction
    });
    await LiveClassAttendance.bulkCreate(
      students.map(student => ({ live_class_id: session.id, student_id: student.id })),
      { transaction }
    );
    await transaction.commit();
    return res.status(201).json({ success: true, data: session, roster_count: students.length });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    logger.error('live class create', error);
    return res.status(httpStatusFor(error)).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const scope = await scopeFor(req);
    const session = await LiveClass.findOne({ where: sessionWhere(scope, req.params.id) });
    if (!session) return res.status(404).json({ success: false, message: 'Live class not found.' });
    if (!(await assertTeacherSession(req, session)))
      return res
        .status(403)
        .json({ success: false, message: 'You cannot manage this live class.' });
    if (session.status !== 'scheduled')
      return res
        .status(409)
        .json({ success: false, message: 'Cancelled sessions cannot be edited.' });
    const merged = { ...session.toJSON(), ...req.body };
    const result = await placement({ ...req, body: merged }, scope);
    if (result.error) return res.status(400).json({ success: false, message: result.error });
    if (
      result.values.class_id !== session.class_id ||
      result.values.section_id !== session.section_id
    ) {
      const attendanceCount = await LiveClassAttendance.count({
        where: { live_class_id: session.id }
      });
      if (attendanceCount)
        return res.status(409).json({
          success: false,
          message: 'Class or section cannot change after the attendance roster is created.'
        });
    }
    await session.update({ ...result.values, updated_by: req.user.id });
    return res.json({ success: true, data: session });
  } catch (error) {
    logger.error('live class update', error);
    return res.status(httpStatusFor(error)).json({ success: false, message: error.message });
  }
};

const cancel = async (req, res) => {
  try {
    const scope = await scopeFor(req);
    const session = await LiveClass.findOne({ where: sessionWhere(scope, req.params.id) });
    if (!session) return res.status(404).json({ success: false, message: 'Live class not found.' });
    if (!(await assertTeacherSession(req, session)))
      return res
        .status(403)
        .json({ success: false, message: 'You cannot manage this live class.' });
    await session.update({ status: 'cancelled', updated_by: req.user.id });
    return res.json({ success: true, data: session });
  } catch (error) {
    logger.error('live class cancel', error);
    return res.status(httpStatusFor(error)).json({ success: false, message: error.message });
  }
};

const getAttendance = async (req, res) => {
  try {
    const scope = await scopeFor(req, false);
    const session = await LiveClass.findOne({
      where: sessionWhere(scope, req.params.id),
      include: includes
    });
    if (!session) return res.status(404).json({ success: false, message: 'Live class not found.' });
    if (!(await assertTeacherSession(req, session)))
      return res.status(403).json({ success: false, message: 'You cannot view this attendance.' });
    const rows = await LiveClassAttendance.findAll({
      where: { live_class_id: session.id },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'first_name', 'last_name', 'admission_number']
        }
      ],
      order: [[{ model: Student, as: 'student' }, 'first_name', 'ASC']]
    });
    const counts = Object.fromEntries(attendanceStatuses.map(status => [status, 0]));
    rows.forEach(row => {
      counts[row.status] += 1;
    });
    return res.json({
      success: true,
      data: { session, attendance: rows, counts, total: rows.length }
    });
  } catch (error) {
    logger.error('live class attendance', error);
    return res.status(httpStatusFor(error)).json({ success: false, message: error.message });
  }
};

const updateAttendance = async (req, res) => {
  try {
    const scope = await scopeFor(req);
    const session = await LiveClass.findOne({ where: sessionWhere(scope, req.params.id) });
    if (!session) return res.status(404).json({ success: false, message: 'Live class not found.' });
    if (!(await assertTeacherSession(req, session)))
      return res
        .status(403)
        .json({ success: false, message: 'You cannot override this attendance.' });
    const status = req.body.status;
    if (!attendanceStatuses.includes(status))
      return res.status(400).json({ success: false, message: 'Choose a valid attendance status.' });
    const values = {
      status,
      overridden_by: req.user.id,
      remarks:
        String(req.body.remarks || '')
          .trim()
          .slice(0, 500) || null
    };
    for (const key of ['first_joined_at', 'last_left_at']) {
      if (req.body[key] !== undefined) {
        const date =
          req.body[key] === null || req.body[key] === '' ? null : new Date(req.body[key]);
        if (date && Number.isNaN(date.valueOf()))
          return res.status(400).json({ success: false, message: `Invalid ${key}.` });
        values[key] = date;
      }
    }
    if (req.body.duration_minutes !== undefined) {
      const duration =
        req.body.duration_minutes === null || req.body.duration_minutes === ''
          ? null
          : Number(req.body.duration_minutes);
      if (duration !== null && (!Number.isInteger(duration) || duration < 0 || duration > 600))
        return res
          .status(400)
          .json({ success: false, message: 'Duration must be between 0 and 600 minutes.' });
      values.duration_minutes = duration;
    }
    const [updated] = await LiveClassAttendance.update(values, {
      where: { live_class_id: session.id, student_id: req.params.studentId }
    });
    if (!updated)
      return res.status(404).json({ success: false, message: 'Student attendance row not found.' });
    const row = await LiveClassAttendance.findOne({
      where: { live_class_id: session.id, student_id: req.params.studentId },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'first_name', 'last_name', 'admission_number']
        }
      ]
    });
    return res.json({ success: true, data: row });
  } catch (error) {
    logger.error('live class attendance override', error);
    return res.status(httpStatusFor(error)).json({ success: false, message: error.message });
  }
};

const exportAttendance = async (req, res) => {
  try {
    const response = await getAttendanceData(req);
    if (response.error)
      return res
        .status(response.error.status)
        .json({ success: false, message: response.error.message });
    const quote = value =>
      `"${String(value ?? '')
        .replace(/^[=+@-]/, "'$&")
        .replace(/"/g, '""')}"`;
    const csv = [
      ['Student', 'Admission No.', 'Status', 'First joined', 'Last left', 'Minutes', 'Remarks'],
      ...response.rows.map(row => [
        `${row.student?.first_name || ''} ${row.student?.last_name || ''}`.trim(),
        row.student?.admission_number,
        row.status,
        row.first_joined_at?.toISOString(),
        row.last_left_at?.toISOString(),
        row.duration_minutes,
        row.remarks
      ])
    ]
      .map(row => row.map(quote).join(','))
      .join('\r\n');
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="live-class-${response.session.id}-attendance.csv"`,
      'Cache-Control': 'private, no-store'
    });
    return res.send(`\uFEFF${csv}`);
  } catch (error) {
    logger.error('live class attendance export', error);
    return res.status(httpStatusFor(error)).json({ success: false, message: error.message });
  }
};

const getAttendanceData = async req => {
  const scope = await scopeFor(req, false);
  const session = await LiveClass.findOne({ where: sessionWhere(scope, req.params.id) });
  if (!session) return { error: { status: 404, message: 'Live class not found.' } };
  if (!(await assertTeacherSession(req, session)))
    return { error: { status: 403, message: 'You cannot view this attendance.' } };
  const rows = await LiveClassAttendance.findAll({
    where: { live_class_id: session.id },
    include: [
      {
        model: Student,
        as: 'student',
        attributes: ['id', 'first_name', 'last_name', 'admission_number']
      }
    ],
    order: [[{ model: Student, as: 'student' }, 'first_name', 'ASC']]
  });
  return { session, rows };
};

module.exports = {
  list,
  create,
  update,
  cancel,
  getAttendance,
  updateAttendance,
  exportAttendance
};
