const { Op } = require('sequelize');
const {
  sequelize,
  Parent,
  StudentParent,
  Student,
  Class,
  Section,
  ClassTeacher,
  ParentTeacherMeeting,
  ParentTeacherMeetingStudent
} = require('~/models');
const { resolveSchoolBranchScope } = require('~/utils/shared/requestScope');
const { logger } = require('~/utils/shared/logger');

const staffRoles = ['super_admin', 'admin', 'branch_admin', 'teacher'];
const managers = ['super_admin', 'admin', 'branch_admin'];
const attendanceStates = ['pending', 'present', 'absent', 'rescheduled'];
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const validDate = value =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
  new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
const normalizeHttpsUrl = value => {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && url.hostname && !url.username && !url.password
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
};

const resolveManagerScope = async (req, { branchRequired = true } = {}) => {
  if (req.user.role === 'branch_admin' && !req.user.branch_id) {
    throw Object.assign(new Error('Branch assignment is required'), { statusCode: 403 });
  }
  if (req.user.role === 'teacher') {
    if (!req.user.branch_id)
      throw Object.assign(new Error('Branch assignment is required'), { statusCode: 403 });
    return resolveSchoolBranchScope(
      {
        ...req,
        query: { ...req.query, branch_id: req.user.branch_id },
        body: { ...req.body, branch_id: req.user.branch_id }
      },
      { branchRequired: true }
    );
  }
  const scopeRequest = !branchRequired &&
    ['super_admin', 'admin'].includes(req.user.role) &&
    !req.query.branch_id &&
    !req.body?.branch_id
    ? { ...req, user: { ...req.user, branch_id: null } }
    : req;
  return resolveSchoolBranchScope(scopeRequest, { branchRequired });
};

const validateTeacherAccess = async (req, meeting, studentIds = []) => {
  const assignments = await ClassTeacher.findAll({
    where: {
      teacher_id: req.user.id,
      school_id: meeting.school_id,
      branch_id: meeting.branch_id,
      class_id: meeting.class_id || { [Op.ne]: null },
      is_active: true
    },
    attributes: ['class_id', 'section_id']
  });
  const eligibleAssignments = assignments.filter(assignment =>
    meeting.class_id
      ? assignment.class_id === meeting.class_id &&
        (!meeting.section_id ||
          !assignment.section_id ||
          assignment.section_id === meeting.section_id)
      : true
  );
  if (!eligibleAssignments.length) return null;
  const unrestricted = eligibleAssignments.some(assignment => !assignment.section_id);
  const assignedSections = new Set(
    eligibleAssignments.map(assignment => assignment.section_id).filter(Boolean)
  );
  const allowedStudents = await Student.findAll({
    where: {
      school_id: meeting.school_id,
      branch_id: meeting.branch_id,
      ...(meeting.class_id ? { class_id: meeting.class_id } : {}),
      ...(meeting.section_id
        ? { section_id: meeting.section_id }
        : unrestricted
          ? {}
          : { section_id: [...assignedSections] }),
      status: 'active',
      ...(studentIds.length ? { id: studentIds } : {})
    },
    attributes: ['id']
  });
  return new Set(allowedStudents.map(student => student.id));
};

const list = async (req, res) => {
  try {
    const scope = await resolveManagerScope(req, { branchRequired: false });
    const where = {
      school_id: scope.school_id,
      ...(scope.branch_id ? { branch_id: scope.branch_id } : {})
    };
    if (req.query.status && ['scheduled', 'completed', 'cancelled'].includes(req.query.status)) {
      where.status = req.query.status;
    }
    const meetings = await ParentTeacherMeeting.findAll({
      where,
      include: [
        { model: Class, as: 'class', attributes: ['id', 'name'], required: false },
        { model: Section, as: 'section', attributes: ['id', 'name'], required: false },
        {
          model: ParentTeacherMeetingStudent,
          as: 'attendees',
          attributes: [
            'id',
            'student_id',
            'attendance_status',
            'teacher_remarks',
            'parent_rating',
            'parent_feedback'
          ],
          include: [
            {
              model: Student,
              as: 'student',
              attributes: [
                'id',
                'first_name',
                'middle_name',
                'last_name',
                'admission_number',
                'roll_number',
                'class_id',
                'section_id'
              ]
            }
          ]
        }
      ],
      order: [
        ['meeting_date', 'DESC'],
        ['start_time', 'ASC']
      ]
    });
    if (req.user.role !== 'teacher') return res.json({ success: true, data: meetings });

    const scoped = [];
    for (const meeting of meetings) {
      const allowed = await validateTeacherAccess(req, meeting);
      if (!allowed) continue;
      const row = meeting.toJSON();
      row.attendees = row.attendees
        .filter(attendee => allowed.has(attendee.student_id))
        .map(({ parent_rating, parent_feedback, ...attendee }) => attendee);
      scoped.push(row);
    }
    return res.json({ success: true, data: scoped });
  } catch (error) {
    logger.error('PTM list', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const {
      title,
      agenda,
      meeting_date: meetingDate,
      start_time: startTime,
      end_time: endTime,
      mode = 'in_person',
      venue,
      online_url: onlineUrl,
      class_id: classId,
      section_id: sectionId
    } = req.body || {};
    const cleanTitle = typeof title === 'string' ? title.trim() : '';
    const cleanAgenda = typeof agenda === 'string' ? agenda.trim() : '';
    const cleanVenue = typeof venue === 'string' ? venue.trim() : '';
    const cleanUrl = typeof onlineUrl === 'string' ? onlineUrl.trim() : '';
    const normalizedUrl = cleanUrl ? normalizeHttpsUrl(cleanUrl) : null;
    const modes = ['in_person', 'online', 'hybrid'];
    if (
      !cleanTitle ||
      cleanTitle.length > 160 ||
      (cleanAgenda && cleanAgenda.length > 5000) ||
      !validDate(meetingDate) ||
      !timePattern.test(startTime || '') ||
      !timePattern.test(endTime || '') ||
      startTime >= endTime ||
      !modes.includes(mode) ||
      cleanVenue.length > 200 ||
      cleanUrl.length > 1000 ||
      (onlineUrl != null && typeof onlineUrl !== 'string') ||
      (cleanUrl && normalizedUrl === undefined) ||
      (mode !== 'in_person' && !normalizedUrl)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Provide valid meeting details and an HTTPS link for online meetings.'
      });
    }
    const scope = await resolveManagerScope(req);
    if (sectionId && !classId)
      return res.status(400).json({ success: false, message: 'A section requires a class.' });
    if (
      classId &&
      !(await Class.findOne({
        where: {
          id: classId,
          school_id: scope.school_id,
          branch_id: scope.branch_id,
          is_active: true
        }
      }))
    ) {
      return res.status(400).json({ success: false, message: 'Invalid class for this branch.' });
    }
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
      return res.status(400).json({ success: false, message: 'Invalid section for this class.' });
    }
    const students = await Student.findAll({
      where: {
        school_id: scope.school_id,
        branch_id: scope.branch_id,
        status: 'active',
        ...(classId ? { class_id: classId } : {}),
        ...(sectionId ? { section_id: sectionId } : {})
      },
      attributes: ['id']
    });
    if (!students.length)
      return res
        .status(400)
        .json({ success: false, message: 'No active students match this meeting audience.' });

    const meeting = await sequelize.transaction(async transaction => {
      const created = await ParentTeacherMeeting.create(
        {
          school_id: scope.school_id,
          branch_id: scope.branch_id,
          class_id: classId || null,
          section_id: sectionId || null,
          title: cleanTitle,
          agenda: cleanAgenda || null,
          meeting_date: meetingDate,
          start_time: startTime,
          end_time: endTime,
          mode,
          venue: cleanVenue || null,
          online_url: normalizedUrl,
          created_by: req.user.id
        },
        { transaction }
      );
      await ParentTeacherMeetingStudent.bulkCreate(
        students.map(student => ({ meeting_id: created.id, student_id: student.id })),
        { transaction }
      );
      return created;
    });
    return res
      .status(201)
      .json({ success: true, data: { meeting, invited_count: students.length } });
  } catch (error) {
    logger.error('PTM create', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const recordAttendance = async (req, res) => {
  try {
    const scope = await resolveManagerScope(req);
    const meeting = await ParentTeacherMeeting.findOne({
      where: { id: req.params.id, school_id: scope.school_id, branch_id: scope.branch_id }
    });
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found.' });
    if (meeting.status !== 'scheduled')
      return res
        .status(409)
        .json({ success: false, message: 'This meeting is not open for attendance updates.' });
    const entries = req.body?.attendees;
    if (
      !Array.isArray(entries) ||
      !entries.length ||
      entries.length > 1000 ||
      entries.some(
        row =>
          !row?.student_id ||
          !attendanceStates.includes(row.attendance_status) ||
          (row.teacher_remarks != null &&
            (typeof row.teacher_remarks !== 'string' || row.teacher_remarks.length > 2000))
      )
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'Provide valid attendee attendance and remarks.' });
    }
    const ids = [...new Set(entries.map(row => row.student_id))];
    if (ids.length !== entries.length)
      return res
        .status(400)
        .json({ success: false, message: 'Each student can appear only once.' });
    let allowedIds = new Set(ids);
    if (req.user.role === 'teacher') {
      const allowed = await validateTeacherAccess(req, meeting, ids);
      if (!allowed)
        return res
          .status(403)
          .json({ success: false, message: 'You are not assigned to this meeting audience.' });
      if (ids.some(id => !allowed.has(id))) {
        return res
          .status(404)
          .json({ success: false, message: 'One or more students are outside your assignment.' });
      }
      allowedIds = allowed;
    }
    const participants = await ParentTeacherMeetingStudent.findAll({
      where: { meeting_id: meeting.id, student_id: ids },
      attributes: ['student_id']
    });
    if (
      participants.length !== ids.length ||
      participants.some(row => !allowedIds.has(row.student_id))
    ) {
      return res.status(404).json({
        success: false,
        message: 'One or more students are outside this meeting or your assignment.'
      });
    }
    await sequelize.transaction(async transaction => {
      for (const entry of entries) {
        await ParentTeacherMeetingStudent.update(
          {
            attendance_status: entry.attendance_status,
            teacher_remarks: entry.teacher_remarks?.trim() || null,
            recorded_by: req.user.id
          },
          { where: { meeting_id: meeting.id, student_id: entry.student_id }, transaction }
        );
      }
    });
    return res.json({ success: true, updated_count: entries.length });
  } catch (error) {
    logger.error('PTM attendance', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const listForParent = async (req, res) => {
  try {
    const parent = await Parent.findOne({ where: { user_id: req.user.id }, attributes: ['id'] });
    if (!parent) return res.json({ success: true, data: [] });
    const links = await StudentParent.findAll({
      where: { parent_id: parent.id },
      attributes: ['student_id']
    });
    let studentIds = links.map(link => link.student_id);
    if (req.query.student_id) {
      if (!studentIds.includes(req.query.student_id)) {
        return res.status(404).json({ success: false, message: 'Linked student not found.' });
      }
      studentIds = [req.query.student_id];
    }
    if (!studentIds.length) return res.json({ success: true, data: [] });
    const records = await ParentTeacherMeetingStudent.findAll({
      where: { student_id: studentIds },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: [
            'id',
            'first_name',
            'middle_name',
            'last_name',
            'class_id',
            'section_id',
            'school_id',
            'branch_id'
          ]
        },
        {
          model: ParentTeacherMeeting,
          as: 'meeting',
          where: {
            status: { [Op.ne]: 'cancelled' },
            ...(req.schoolId ? { school_id: req.schoolId } : {})
          },
          required: true
        }
      ],
      order: [[{ model: ParentTeacherMeeting, as: 'meeting' }, 'meeting_date', 'DESC']]
    });
    return res.json({ success: true, data: records });
  } catch (error) {
    logger.error('PTM parent list', error);
    return res
      .status(500)
      .json({ success: false, message: 'Unable to load parent-teacher meetings.' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const scope = await resolveManagerScope(req);
    const { status } = req.body || {};
    if (!['completed', 'cancelled'].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: 'Status must be completed or cancelled.' });
    }
    const meeting = await ParentTeacherMeeting.findOne({
      where: { id: req.params.id, school_id: scope.school_id, branch_id: scope.branch_id }
    });
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found.' });
    if (meeting.status !== 'scheduled') {
      return res
        .status(409)
        .json({ success: false, message: 'Only scheduled meetings can change status.' });
    }
    if (status === 'completed' && meeting.meeting_date > new Date().toISOString().slice(0, 10)) {
      return res
        .status(409)
        .json({ success: false, message: 'A future meeting cannot be marked completed.' });
    }
    await meeting.update({ status });
    return res.json({ success: true, data: { id: meeting.id, status } });
  } catch (error) {
    logger.error('PTM status', error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const submitFeedback = async (req, res) => {
  try {
    const studentId = req.body?.student_id;
    const rating = Number(req.body?.rating);
    const feedback = typeof req.body?.feedback === 'string' ? req.body.feedback.trim() : '';
    if (
      !studentId ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5 ||
      feedback.length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message: 'A 1–5 rating and feedback up to 2,000 characters are required.'
      });
    }
    const parent = await Parent.findOne({ where: { user_id: req.user.id }, attributes: ['id'] });
    if (
      !parent ||
      !(await StudentParent.findOne({ where: { parent_id: parent.id, student_id: studentId } }))
    ) {
      return res.status(404).json({ success: false, message: 'Linked student not found.' });
    }
    const student = await Student.findOne({
      where: { id: studentId, ...(req.schoolId ? { school_id: req.schoolId } : {}) },
      attributes: ['id', 'school_id', 'branch_id']
    });
    if (!student)
      return res.status(404).json({ success: false, message: 'Linked student not found.' });
    const participant = await ParentTeacherMeetingStudent.findOne({
      where: { meeting_id: req.params.id, student_id: student.id },
      include: [
        {
          model: ParentTeacherMeeting,
          as: 'meeting',
          where: {
            school_id: student.school_id,
            branch_id: student.branch_id,
            status: { [Op.ne]: 'cancelled' }
          },
          required: true
        }
      ]
    });
    if (!participant)
      return res
        .status(404)
        .json({ success: false, message: 'Meeting not found for this student.' });
    if (participant.meeting.meeting_date > new Date().toISOString().slice(0, 10)) {
      return res.status(409).json({ success: false, message: 'Feedback opens after the meeting date.' });
    }
    await participant.update({
      parent_rating: rating,
      parent_feedback: feedback || null,
      parent_responded_at: new Date(),
      feedback_parent_id: parent.id
    });
    return res.json({
      success: true,
      data: { id: participant.id, parent_rating: rating, parent_feedback: feedback || null }
    });
  } catch (error) {
    logger.error('PTM parent feedback', error);
    return res.status(500).json({ success: false, message: 'Unable to save meeting feedback.' });
  }
};

module.exports = { list, create, recordAttendance, listForParent, submitFeedback, updateStatus };
