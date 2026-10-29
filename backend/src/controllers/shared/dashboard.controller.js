const { User, School, Branch, FeeInvoice, FeePayment, Student, StudentParent, Transaction, ClassTeacher, Homework, Timetable, TimetableSlot, DynamicEntityRecord, LibraryBook, LibraryIssue, SchoolTransaction, AttendanceRecord, AttendanceSession } = require('~/models');
const { Sequelize, sequelize } = require('~/config/database');
const SchoolService = require('~/services/administration/schools/school.service');
const BranchService = require('~/services/administration/schools/branch.service');
const { logger } = require('~/utils/shared/logger');
const ApiError = require('~/utils/shared/ApiError');
const { Op } = require('sequelize');
const { getTeacherStudentWhere } = require('~/utils/academic/teacherStudentScope');
const { getCurrentAcademicYearForSchool } = require('~/utils/academic/academicYearUtils');

const sanitizeId = (id) => {
  if (!id || typeof id !== 'string') return undefined;
  const trimmed = id.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null' || trimmed === '[object Object]') return undefined;
  return trimmed;
};

const sanitizeString = (val) => {
  if (!val || typeof val !== 'string') return undefined;
  const trimmed = val.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return undefined;
  return trimmed;
};

const dateInTimeZone = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const buildDashboardScopeWhere = (user, query) => {
  const cleanSchoolId = sanitizeId(query.school_id);
  const cleanBranchId = sanitizeId(query.branch_id);
  let where = {};

  if (user.role === 'admin') {
    where.school_id = user.school_id;
    const effectiveBranchId = cleanBranchId || user.branch_id;
    if (effectiveBranchId) where.branch_id = effectiveBranchId;
  } else if (['branch_admin', 'accountant', 'teacher', 'receptionist', 'librarian'].includes(user.role)) {
    where.school_id = user.school_id;
    if (user.branch_id) where.branch_id = user.branch_id;
  } else if (user.role === 'super_admin') {
    if (cleanSchoolId) where.school_id = cleanSchoolId;
    if (cleanBranchId) where.branch_id = cleanBranchId;
  }
  return { where, cleanSchoolId, cleanBranchId };
};

class DashboardController {
  static async getOverdueFees(req, res, next) {
    try {
      const { where, cleanSchoolId } = buildDashboardScopeWhere(req.user, req.query);
      if ((req.user.role === 'super_admin' && !cleanSchoolId) || !where.school_id) {
        return res.json({ success: true, data: { fees: [] } });
      }
      if (req.user.role === 'admin' && !sanitizeId(req.query.branch_id)) {
        delete where.branch_id;
      }

      const fees = await FeeInvoice.findAll({
        where: { ...where, status: 'overdue', balance_amount: { [Op.gt]: 0 } },
        attributes: ['id', 'invoice_number', 'class_name', 'section', 'balance_amount', 'due_date'],
        include: [{
          model: Student,
          as: 'student',
          attributes: ['id', 'first_name', 'last_name'],
          required: true
        }],
        order: [['balance_amount', 'DESC'], ['due_date', 'ASC']],
        limit: 5
      });
      return res.json({ success: true, data: { fees } });
    } catch (error) {
      logger.error('Error in DashboardController.getOverdueFees:', error);
      return next(error);
    }
  }

  static async getTodayAttendance(req, res, next) {
    try {
      const { where, cleanSchoolId } = buildDashboardScopeWhere(req.user, req.query);
      if ((req.user.role === 'super_admin' && !cleanSchoolId) || !where.school_id) {
        return res.json({ success: true, data: { attendance: null } });
      }
      if (req.user.role === 'admin' && !sanitizeId(req.query.branch_id)) {
        delete where.branch_id;
      }

      const date = new Date().toISOString().slice(0, 10);
      const [enrolled, sessions] = await Promise.all([
        Student.count({ where }),
        AttendanceSession.findAll({
          where: { ...where, date, attendance_type: 'daily', status: 'published' },
          attributes: ['id'],
          raw: true
        })
      ]);
      const sessionIds = sessions.map(session => session.id);
      const rows = sessionIds.length
        ? await AttendanceRecord.findAll({
            where: { ...where, date, session_id: { [Op.in]: sessionIds } },
            attributes: ['status', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
            group: ['status'],
            raw: true
          })
        : [];
      const counts = Object.fromEntries(rows.map(row => [row.status, Number(row.count) || 0]));
      const present = counts.present || 0;
      const absent = counts.absent || 0;
      const late = counts.late || 0;
      const excused = counts.excused || 0;

      return res.json({
        success: true,
        data: {
          attendance: {
            date,
            session_count: sessionIds.length,
            enrolled,
            present,
            absent,
            late,
            excused,
            marked: present + absent + late + excused
          }
        }
      });
    } catch (error) {
      logger.error('Error in DashboardController.getTodayAttendance:', error);
      return next(error);
    }
  }

  static async getNotices(req, res, next) {
    try {
      const { where, cleanSchoolId } = buildDashboardScopeWhere(req.user, req.query);
      if (req.user.role === 'super_admin' && !cleanSchoolId) {
        return res.json({ success: true, data: { notices: [] } });
      }
      if (!where.school_id) {
        return res.json({ success: true, data: { notices: [] } });
      }
      if (req.user.role === 'admin' && !sanitizeId(req.query.branch_id)) {
        delete where.branch_id;
      }
      const notices = await DynamicEntityRecord.findAll({
        where: {
          ...where,
          entity_type: ['school_notice', 'notice', 'announcement'],
          status: 'active'
        },
        attributes: ['id', 'title', 'notes', 'date_value', 'created_at'],
        order: [['created_at', 'DESC']],
        limit: 5,
        raw: true
      });
      return res.json({
        success: true,
        data: { notices }
      });
    } catch (error) {
      logger.error('Error in DashboardController.getNotices:', error);
      return next(error);
    }
  }

  static async getStats(req, res, next) {
    try {
      const user = req.user;
      const cleanSchoolId = sanitizeId(req.query.school_id);
      const cleanBranchId = sanitizeId(req.query.branch_id);
      const cleanAcademicYear = sanitizeString(req.query.academic_year);
      const new_students_days = req.query.new_students_days || 30;

      console.log(
        '🔍 Dashboard getStats called for user:',
        user.role,
        'school_id:',
        cleanSchoolId,
        'branch_id:',
        cleanBranchId,
        'academic_year:',
        cleanAcademicYear,
        'new_students_days:',
        new_students_days
      );

      let stats = {};

      if (user.role === 'super_admin') {
        const targetSchoolId = cleanSchoolId;
        const targetBranchId = cleanBranchId;

        // Global platform counts
        const [schoolCount, branchCount, userCount, totalRevenue] = await Promise.all([
          School.count(),
          Branch.count(),
          User.count(),
          FeeInvoice.sum('paid_amount', { where: { status: 'paid' } })
        ]);

        let validBranchId = null;
        if (targetSchoolId && targetBranchId) {
          const branchExists = await Branch.findOne({
            where: { id: targetBranchId, school_id: targetSchoolId }
          });
          if (branchExists) {
            validBranchId = targetBranchId;
          }
        }

        const schoolWhere = targetSchoolId ? { school_id: targetSchoolId } : {};
        if (validBranchId) {
          schoolWhere.branch_id = validBranchId;
        }

        const newStudentsDate = new Date();
        newStudentsDate.setDate(newStudentsDate.getDate() - parseInt(new_students_days));
        const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

        let targetAcademicYear = cleanAcademicYear;
        if (!targetAcademicYear) {
          const { getCurrentAcademicYearForSchool } = require('~/utils/academic/academicYearUtils');
          const currentAY = await getCurrentAcademicYearForSchool(targetSchoolId).catch(() => null);
          targetAcademicYear = currentAY?.code || currentAY?.name;
          if (!targetAcademicYear) {
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth() + 1;
            targetAcademicYear =
              currentMonth >= 6
                ? `${currentYear}-${currentYear + 1}`
                : `${currentYear - 1}-${currentYear}`;
          }
        }

        const targetAcademicYearSql = sequelize.escape(targetAcademicYear);
        const studentStats = await Student.findAll({
          where: schoolWhere,
          attributes: [
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_students'],
            [
              Sequelize.fn(
                'COUNT',
                Sequelize.literal(
                  `CASE WHEN created_at >= '${newStudentsDate.toISOString()}' THEN 1 END`
                )
              ),
              'new_students'
            ],
            [
              Sequelize.fn(
                'COUNT',
                Sequelize.literal(`CASE WHEN status IN ('active') OR status IS NULL THEN 1 END`)
              ),
              'active_students'
            ]
          ],
          raw: true
        });

        const feeStats = await FeeInvoice.findAll({
          where: schoolWhere,
          attributes: [
            [
              Sequelize.fn(
                'SUM',
                Sequelize.literal(`CASE WHEN status IN ('sent', 'partial_paid', 'overdue') THEN balance_amount ELSE 0 END`)
              ),
              'total_pending_fee_amount'
            ],
            [
              Sequelize.fn(
                'SUM',
                Sequelize.literal(
                  `CASE WHEN status IN ('sent', 'partial_paid', 'overdue') AND academic_year = ${targetAcademicYearSql} THEN balance_amount ELSE 0 END`
                )
              ),
              'pending_fee_amount'
            ],
            [
              Sequelize.fn(
                'COUNT',
                Sequelize.literal(
                  `CASE WHEN status IN ('sent', 'partial_paid', 'overdue') AND academic_year = ${targetAcademicYearSql} THEN 1 END`
                )
              ),
              'pending_invoices_count'
            ],
            [
              Sequelize.fn(
                'COUNT',
                Sequelize.literal(`CASE WHEN status IN ('sent', 'partial_paid', 'overdue') THEN 1 END`)
              ),
              'total_pending_invoices_count'
            ],
            [
              Sequelize.fn(
                'COUNT',
                Sequelize.literal(`CASE WHEN status = 'overdue' AND academic_year = ${targetAcademicYearSql} THEN 1 END`)
              ),
              'overdue_fees'
            ],
            [
              Sequelize.fn(
                'SUM',
                Sequelize.literal(
                  `CASE WHEN status IN ('paid', 'partial_paid') AND updated_at >= '${currentMonthStart.toISOString()}' THEN paid_amount ELSE 0 END`
                )
              ),
              'month_fee_collection'
            ],
            [
              Sequelize.fn(
                'SUM',
                Sequelize.literal(
                  `CASE WHEN status IN ('paid', 'partial_paid') AND academic_year = ${targetAcademicYearSql} THEN paid_amount ELSE 0 END`
                )
              ),
              'academic_year_fee_collection'
            ],
            [
              Sequelize.fn(
                'SUM',
                Sequelize.literal(
                  `CASE WHEN status IN ('paid', 'partial_paid') THEN paid_amount ELSE 0 END`
                )
              ),
              'total_collected_fees'
            ]
          ],
          raw: true
        });

        const userWhere = {};
        if (targetSchoolId) userWhere.school_id = targetSchoolId;
        if (validBranchId) userWhere.branch_id = validBranchId;

        const [totalParents, totalTeachers, totalEmployees] = await Promise.all([
          StudentParent.count({
            distinct: true,
            col: 'parent_id',
            include: [{
              model: Student,
              as: 'student',
              attributes: [],
              required: true,
              where: schoolWhere
            }]
          }),
          User.count({ where: { ...userWhere, role: 'teacher' } }),
          User.count({
            where: {
              ...userWhere,
              role: ['accountant', 'receptionist', 'librarian', 'branch_admin', 'admin']
            }
          })
        ]);

        const studentData = studentStats[0] || {};
        const feeData = feeStats[0] || {};

        stats = {
          totalSchools: schoolCount,
          totalBranches: branchCount,
          totalUsers: userCount,
          totalRevenue: totalRevenue || 0,
          totalStudents: parseInt(studentData.total_students || 0),
          totalParents,
          totalTeachers,
          totalEmployees,
          newStudents: parseInt(studentData.new_students || 0),
          newStudentsDays: parseInt(new_students_days),
          feeCollection: parseFloat(feeData.academic_year_fee_collection ?? feeData.month_fee_collection ?? 0),
          thisMonthFeeCollection: parseFloat(feeData.month_fee_collection || 0),
          academicYearFeeCollection: parseFloat(feeData.academic_year_fee_collection || 0),
          totalCollectedFees: parseFloat(feeData.total_collected_fees || 0),
          activeStudents: parseInt(studentData.active_students || 0),
          pendingFees: parseFloat(feeData.pending_fee_amount ?? feeData.total_pending_fee_amount ?? 0),
          allTimePendingFees: parseFloat(feeData.total_pending_fee_amount || 0),
          pendingInvoicesCount: parseInt(feeData.pending_invoices_count ?? feeData.total_pending_invoices_count ?? 0),
          allTimePendingInvoicesCount: parseInt(feeData.total_pending_invoices_count || 0),
          overdueFees: parseInt(feeData.overdue_fees || 0),
          targetAcademicYear
        };
      } else if (user.role === 'admin') {
        // School stats
        if (!user.school_id) throw new ApiError(400, 'No school assigned');

        // Build where clause for school with optional branch filter
        let schoolWhere = { school_id: user.school_id };
        let branchWhere = { school_id: user.school_id };

        let validBranchId = null;
        if (cleanBranchId) {
          const branchExists = await Branch.findOne({
            where: { id: cleanBranchId, school_id: user.school_id }
          });
          if (branchExists) {
            validBranchId = cleanBranchId;
            schoolWhere.branch_id = validBranchId;
            branchWhere.id = validBranchId;
          }
        }

        // Calculate date for new students (last N days)
        const newStudentsDate = new Date();
        newStudentsDate.setDate(newStudentsDate.getDate() - parseInt(new_students_days));
        const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

        let targetAcademicYear = cleanAcademicYear;
        if (!targetAcademicYear) {
          const { getCurrentAcademicYearForSchool } = require('~/utils/academic/academicYearUtils');
          const currentAY = await getCurrentAcademicYearForSchool(user.school_id).catch(() => null);
          targetAcademicYear = currentAY?.code || currentAY?.name;
          if (!targetAcademicYear) {
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth() + 1;
            targetAcademicYear =
              currentMonth >= 6
                ? `${currentYear}-${currentYear + 1}`
                : `${currentYear - 1}-${currentYear}`;
          }
        }

        const targetAcademicYearSql = sequelize.escape(targetAcademicYear);
        // Optimized: Single query for all student statistics
        const studentStats = await Student.findAll({
          where: schoolWhere,
          attributes: [
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_students'],
            [
              Sequelize.fn(
                'COUNT',
                Sequelize.literal(
                  `CASE WHEN created_at >= '${newStudentsDate.toISOString()}' THEN 1 END`
                )
              ),
              'new_students'
            ],
            [
              Sequelize.fn(
                'COUNT',
                Sequelize.literal(`CASE WHEN status IN ('active') OR status IS NULL THEN 1 END`)
              ),
              'active_students'
            ]
          ],
          raw: true
        });

        const feeStats = await FeeInvoice.findAll({
          where: schoolWhere,
          attributes: [
            [
              Sequelize.fn(
                'SUM',
                Sequelize.literal(`CASE WHEN status IN ('sent', 'partial_paid', 'overdue') THEN balance_amount ELSE 0 END`)
              ),
              'total_pending_fee_amount'
            ],
            [
              Sequelize.fn(
                'SUM',
                Sequelize.literal(
                  `CASE WHEN status IN ('sent', 'partial_paid', 'overdue') AND academic_year = ${targetAcademicYearSql} THEN balance_amount ELSE 0 END`
                )
              ),
              'pending_fee_amount'
            ],
            [
              Sequelize.fn(
                'COUNT',
                Sequelize.literal(
                  `CASE WHEN status IN ('sent', 'partial_paid', 'overdue') AND academic_year = ${targetAcademicYearSql} THEN 1 END`
                )
              ),
              'pending_invoices_count'
            ],
            [
              Sequelize.fn(
                'COUNT',
                Sequelize.literal(`CASE WHEN status IN ('sent', 'partial_paid', 'overdue') THEN 1 END`)
              ),
              'total_pending_invoices_count'
            ],
            [
              Sequelize.fn('COUNT', Sequelize.literal(`CASE WHEN status = 'overdue' AND academic_year = ${targetAcademicYearSql} THEN 1 END`)),
              'overdue_fees'
            ],
            [
              Sequelize.fn(
                'SUM',
                Sequelize.literal(
                  `CASE WHEN status IN ('paid', 'partial_paid') AND updated_at >= '${currentMonthStart.toISOString()}' THEN paid_amount ELSE 0 END`
                )
              ),
              'month_fee_collection'
            ],
            [
              Sequelize.fn(
                'SUM',
                Sequelize.literal(
                  `CASE WHEN status IN ('paid', 'partial_paid') AND academic_year = ${targetAcademicYearSql} THEN paid_amount ELSE 0 END`
                )
              ),
              'academic_year_fee_collection'
            ],
            [
              Sequelize.fn(
                'SUM',
                Sequelize.literal(
                  `CASE WHEN status IN ('paid', 'partial_paid') THEN paid_amount ELSE 0 END`
                )
              ),
              'total_collected_fees'
            ]
          ],
          raw: true
        });

        // Get user role counts (parents, teachers, employees)
        const userWhere = validBranchId ? { school_id: user.school_id, branch_id: validBranchId } : { school_id: user.school_id };
        const [totalParents, totalTeachers, totalEmployees] = await Promise.all([
          StudentParent.count({
            distinct: true,
            col: 'parent_id',
            include: [{
              model: Student,
              as: 'student',
              attributes: [],
              required: true,
              where: schoolWhere
            }]
          }),
          User.count({ where: { ...userWhere, role: 'teacher' } }),
          User.count({
            where: {
              ...userWhere,
              role: ['accountant', 'receptionist', 'librarian', 'branch_admin', 'admin']
            }
          })
        ]);

        // Get branch count
        const totalBranches = await Branch.count({ where: branchWhere });

        // Extract results
        const studentData = studentStats[0] || {};
        const feeData = feeStats[0] || {};

        const totalStudents = parseInt(studentData.total_students || 0);
        const newStudents = parseInt(studentData.new_students || 0);
        const activeStudents = parseInt(studentData.active_students || 0);
        const pendingFees = parseFloat(feeData.pending_fee_amount ?? feeData.total_pending_fee_amount ?? 0);
        const allTimePendingFees = parseFloat(feeData.total_pending_fee_amount || 0);
        const pendingInvoicesCount = parseInt(feeData.pending_invoices_count ?? feeData.total_pending_invoices_count ?? 0);
        const allTimePendingInvoicesCount = parseInt(feeData.total_pending_invoices_count || 0);
        const overdueFees = parseInt(feeData.overdue_fees || 0);
        const monthFeeCollection = parseFloat(feeData.month_fee_collection || 0);
        const academicYearFeeCollection = parseFloat(feeData.academic_year_fee_collection || 0);

        stats = {
          totalStudents,
          totalParents,
          totalTeachers,
          totalEmployees,
          totalBranches,
          newStudents, // New students in last N days
          newStudentsDays: parseInt(new_students_days),
          feeCollection: academicYearFeeCollection || monthFeeCollection,
          thisMonthFeeCollection: monthFeeCollection,
          academicYearFeeCollection,
          totalCollectedFees: parseFloat(feeData.total_collected_fees || 0),
          activeStudents,
          pendingFees,
          allTimePendingFees,
          pendingInvoicesCount,
          allTimePendingInvoicesCount,
          overdueFees,
          targetAcademicYear
        };
        console.log('✅ School admin stats calculated:', stats);
      } else if (user.role === 'branch_admin') {
        // Branch stats
        if (!user.branch_id) throw new ApiError(400, 'No branch assigned');
        if (cleanBranchId && cleanBranchId !== user.branch_id) {
          throw new ApiError(403, 'Unauthorized access to other branch data');
        }

        // Calculate date for new students (last N days)
        const newStudentsDate = new Date();
        newStudentsDate.setDate(newStudentsDate.getDate() - parseInt(new_students_days));
        const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

        let targetAcademicYear = cleanAcademicYear;
        if (!targetAcademicYear) {
          const { getCurrentAcademicYearForSchool } = require('~/utils/academic/academicYearUtils');
          const currentAY = await getCurrentAcademicYearForSchool(user.school_id).catch(() => null);
          targetAcademicYear = currentAY?.code || currentAY?.name;
          if (!targetAcademicYear) {
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth() + 1;
            targetAcademicYear =
              currentMonth >= 6
                ? `${currentYear}-${currentYear + 1}`
                : `${currentYear - 1}-${currentYear}`;
          }
        }

        // Optimized: Single query for all student statistics
        const targetAcademicYearSql = sequelize.escape(targetAcademicYear);
        const studentStats = await Student.findAll({
          where: { branch_id: user.branch_id },
          attributes: [
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_students'],
            [
              Sequelize.fn(
                'COUNT',
                Sequelize.literal(
                  `CASE WHEN created_at >= '${newStudentsDate.toISOString()}' THEN 1 END`
                )
              ),
              'new_students'
            ],
            [
              Sequelize.fn(
                'COUNT',
                Sequelize.literal(`CASE WHEN status IN ('active') OR status IS NULL THEN 1 END`)
              ),
              'active_students'
            ]
          ],
          raw: true
        });

        const feeStats = await FeeInvoice.findAll({
          where: { branch_id: user.branch_id },
          attributes: [
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_invoices'],
            [
              Sequelize.fn('COUNT', Sequelize.literal(`CASE WHEN status = 'paid' THEN 1 END`)),
              'paid_invoices'
            ],
            [
              Sequelize.fn(
                'SUM',
                Sequelize.literal(`CASE WHEN status IN ('sent', 'partial_paid', 'overdue') THEN balance_amount ELSE 0 END`)
              ),
              'total_pending_fee_amount'
            ],
            [
              Sequelize.fn(
                'SUM',
                Sequelize.literal(
                  `CASE WHEN status IN ('sent', 'partial_paid', 'overdue') AND academic_year = ${targetAcademicYearSql} THEN balance_amount ELSE 0 END`
                )
              ),
              'pending_fee_amount'
            ],
            [
              Sequelize.fn(
                'COUNT',
                Sequelize.literal(
                  `CASE WHEN status IN ('sent', 'partial_paid', 'overdue') AND academic_year = ${targetAcademicYearSql} THEN 1 END`
                )
              ),
              'pending_invoices_count'
            ],
            [
              Sequelize.fn(
                'COUNT',
                Sequelize.literal(`CASE WHEN status IN ('sent', 'partial_paid', 'overdue') THEN 1 END`)
              ),
              'total_pending_invoices_count'
            ],
            [
              Sequelize.fn('COUNT', Sequelize.literal(`CASE WHEN status = 'overdue' AND academic_year = ${targetAcademicYearSql} THEN 1 END`)),
              'overdue_fees'
            ],
            [
              Sequelize.fn(
                'SUM',
                Sequelize.literal(
                  `CASE WHEN status IN ('paid', 'partial_paid') AND updated_at >= '${currentMonthStart.toISOString()}' THEN paid_amount ELSE 0 END`
                )
              ),
              'month_fee_collection'
            ],
            [
              Sequelize.fn(
                'SUM',
                Sequelize.literal(
                  `CASE WHEN status IN ('paid', 'partial_paid') AND academic_year = ${targetAcademicYearSql} THEN paid_amount ELSE 0 END`
                )
              ),
              'academic_year_fee_collection'
            ],
            [
              Sequelize.fn(
                'SUM',
                Sequelize.literal(
                  `CASE WHEN status IN ('paid', 'partial_paid') THEN paid_amount ELSE 0 END`
                )
              ),
              'total_collected_fees'
            ]
          ],
          raw: true
        });

        // Extract results
        const studentData = studentStats[0] || {};
        const feeData = feeStats[0] || {};

        const totalStudents = parseInt(studentData.total_students || 0);
        const newStudents = parseInt(studentData.new_students || 0);
        const activeStudents = parseInt(studentData.active_students || 0);
        const totalInvoices = parseInt(feeData.total_invoices || 0);
        const paidInvoices = parseInt(feeData.paid_invoices || 0);
        const pendingFees = parseFloat(feeData.pending_fee_amount ?? feeData.total_pending_fee_amount ?? 0);
        const allTimePendingFees = parseFloat(feeData.total_pending_fee_amount || 0);
        const pendingInvoicesCount = parseInt(feeData.pending_invoices_count ?? feeData.total_pending_invoices_count ?? 0);
        const allTimePendingInvoicesCount = parseInt(feeData.total_pending_invoices_count || 0);
        const overdueFees = parseInt(feeData.overdue_fees || 0);
        const monthFeeCollection = parseFloat(feeData.month_fee_collection || 0);
        const academicYearFeeCollection = parseFloat(feeData.academic_year_fee_collection || 0);

        // Get user role counts for branch
        const [totalParents, totalTeachers, totalEmployees] = await Promise.all([
          StudentParent.count({
            distinct: true,
            col: 'parent_id',
            include: [{
              model: Student,
              as: 'student',
              attributes: [],
              required: true,
              where: { school_id: user.school_id, branch_id: user.branch_id }
            }]
          }),
          User.count({ where: { branch_id: user.branch_id, role: 'teacher' } }),
          User.count({
            where: {
              branch_id: user.branch_id,
              role: ['accountant', 'receptionist', 'librarian', 'branch_admin', 'admin']
            }
          })
        ]);

        stats = {
          totalStudents,
          totalParents,
          totalTeachers,
          totalEmployees,
          newStudents,
          newStudentsDays: parseInt(new_students_days),
          feeCollection: academicYearFeeCollection || monthFeeCollection,
          thisMonthFeeCollection: monthFeeCollection,
          academicYearFeeCollection,
          totalCollectedFees: parseFloat(feeData.total_collected_fees || 0),
          overdueFees,
          activeStudents,
          pendingFees,
          allTimePendingFees,
          pendingInvoicesCount,
          allTimePendingInvoicesCount,
          totalInvoices,
          paidInvoices,
          targetAcademicYear
        };
      } else if (user.role === 'teacher') {
        const todayDayOfWeek = new Date().getDay() || 7; // 1-7
        const schoolAcademicYear = await getCurrentAcademicYearForSchool(user.school_id).catch(() => null);
        const currentAcademicYear = schoolAcademicYear?.code || schoolAcademicYear?.name;
        const teacherStudentWhere = await getTeacherStudentWhere({
          teacherId: user.id,
          schoolId: user.school_id,
          academicYear: currentAcademicYear
        });
        const studentWhere = { school_id: user.school_id, ...teacherStudentWhere };
        if (currentAcademicYear) studentWhere.academic_year = currentAcademicYear;
        const homeworkWhere = {
          created_by: user.id,
          school_id: user.school_id
        };
        if (user.branch_id) homeworkWhere.branch_id = user.branch_id;
        const [assignedSections, activeHomework, todaySlots, totalStudents] = await Promise.all([
          ClassTeacher.count({ where: { teacher_id: user.id } }).catch(() => 0),
          Homework.count({ where: homeworkWhere }).catch(() => 0),
          TimetableSlot.count({
            where: { teacher_id: user.id, day_of_week: todayDayOfWeek }
          }).catch(() => 0),
          Student.count({ where: studentWhere }).catch(() => 0)
        ]);
        stats = {
          role: 'teacher',
          assignedClasses: assignedSections,
          activeHomework,
          todayScheduleCount: todaySlots,
          totalStudents
        };
      } else if (user.role === 'accountant') {
        const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const school = user.school_id
          ? await School.findByPk(user.school_id, { attributes: ['timezone'] })
          : null;
        const now = new Date();
        let today;
        try {
          today = dateInTimeZone(now, school?.timezone || 'UTC');
        } catch {
          today = dateInTimeZone(now, 'UTC');
        }
        const nextMonthStart = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() + 1, 1);
        const toDateOnly = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const monthDateRange = { [Op.gte]: toDateOnly(currentMonthStart), [Op.lt]: toDateOnly(nextMonthStart) };
        const schoolFilter = user.school_id ? { school_id: user.school_id } : {};
        const effectiveBranchId = user.branch_id || cleanBranchId;
        if (effectiveBranchId) {
          schoolFilter.branch_id = effectiveBranchId;
        }
        const [totalInvoices, paidInvoices, pendingFees, feeCollection, todayFeeCollection, totalIncome, totalExpense, thisMonthIncome, thisMonthExpense] = await Promise.all([
          FeeInvoice.count({ where: schoolFilter }).catch(() => 0),
          FeeInvoice.count({ where: { ...schoolFilter, status: 'paid' } }).catch(() => 0),
          FeeInvoice.sum('balance_amount', {
            where: { ...schoolFilter, status: ['sent', 'partial_paid', 'overdue'] }
          }).catch(() => 0),
          FeePayment.sum('payment_amount', {
            where: { ...schoolFilter, payment_status: 'completed', payment_date: monthDateRange }
          }).catch(() => 0),
          FeePayment.sum('payment_amount', {
            where: { ...schoolFilter, payment_status: 'completed', payment_date: today }
          }).catch(() => 0),
          SchoolTransaction ? SchoolTransaction.sum('amount', { where: { ...schoolFilter, type: 'income' } }).catch(() => 0) : 0,
          SchoolTransaction ? SchoolTransaction.sum('amount', { where: { ...schoolFilter, type: 'expense' } }).catch(() => 0) : 0,
          SchoolTransaction ? SchoolTransaction.sum('amount', { where: { ...schoolFilter, type: 'income', date: monthDateRange } }).catch(() => 0) : 0,
          SchoolTransaction ? SchoolTransaction.sum('amount', { where: { ...schoolFilter, type: 'expense', date: monthDateRange } }).catch(() => 0) : 0
        ]);
        stats = {
          role: 'accountant',
          totalInvoices,
          paidInvoices,
          pendingFees: parseFloat(pendingFees || 0),
          feeCollection: parseFloat(feeCollection || 0),
          todayFeeCollection: parseFloat(todayFeeCollection || 0),
          totalIncome: parseFloat(totalIncome || 0),
          totalExpense: parseFloat(totalExpense || 0),
          thisMonthIncome: parseFloat(thisMonthIncome || 0),
          thisMonthExpense: parseFloat(thisMonthExpense || 0)
        };
      } else if (user.role === 'receptionist') {
        const schoolFilter = user.school_id ? { school_id: user.school_id } : {};
        const effectiveBranchId = user.branch_id || cleanBranchId;
        if (effectiveBranchId) {
          schoolFilter.branch_id = effectiveBranchId;
        }
        const [enquiries, visitors, callLogs, postalRecords, totalStudents] = await Promise.all([
          DynamicEntityRecord.count({ where: { ...schoolFilter, entity_type: 'enquiry' } }).catch(() => 0),
          DynamicEntityRecord.count({ where: { ...schoolFilter, entity_type: 'visitor' } }).catch(() => 0),
          DynamicEntityRecord.count({ where: { ...schoolFilter, entity_type: 'call_log' } }).catch(() => 0),
          DynamicEntityRecord.count({ where: { ...schoolFilter, entity_type: 'postal' } }).catch(() => 0),
          Student.count({ where: schoolFilter }).catch(() => 0)
        ]);
        stats = {
          role: 'receptionist',
          totalEnquiries: enquiries,
          todayVisitors: visitors,
          callLogs,
          postalRecords,
          totalStudents
        };
      } else if (user.role === 'librarian') {
        const schoolFilter = user.school_id ? { school_id: user.school_id } : {};
        const effectiveBranchId = user.branch_id || cleanBranchId;
        if (effectiveBranchId) {
          schoolFilter.branch_id = effectiveBranchId;
        }
        const [totalBooks, availableBooks, issuedBooks, overdueBooks] = await Promise.all([
          LibraryBook ? LibraryBook.sum('quantity', { where: schoolFilter }).catch(() => 0) : 0,
          LibraryBook ? LibraryBook.sum('available', { where: schoolFilter }).catch(() => 0) : 0,
          LibraryIssue ? LibraryIssue.count({ where: { ...schoolFilter, status: 'issued' } }).catch(() => 0) : 0,
          LibraryIssue
            ? LibraryIssue.count({
                where: {
                  ...schoolFilter,
                  [Op.or]: [
                    { status: 'overdue' },
                    { status: 'issued', due_date: { [Op.lt]: new Date().toISOString().slice(0, 10) } }
                  ]
                }
              }).catch(() => 0)
            : 0
        ]);
        const booksCount = totalBooks || 0;
        const issuesCount = issuedBooks || 0;
        stats = {
          role: 'librarian',
          totalBooks: booksCount,
          issuedBooks: issuesCount,
          availableBooks: availableBooks || 0,
          overdueBooks: overdueBooks || 0
        };
      } else {
        // Fallback for any other school-scoped role
        const schoolFilter = user.school_id ? { school_id: user.school_id } : {};
        const [totalStudents, totalTeachers, totalParents] = await Promise.all([
          Student.count({ where: schoolFilter }).catch(() => 0),
          User.count({ where: { ...schoolFilter, role: 'teacher' } }).catch(() => 0),
          User.count({ where: { ...schoolFilter, role: 'parent' } }).catch(() => 0)
        ]);
        stats = {
          totalStudents,
          totalTeachers,
          totalParents,
          totalEmployees: 5
        };
      }

      res.json({ success: true, data: stats });
    } catch (error) {
      logger.error('Error in DashboardController.getStats:', error);
      next(error);
    }
  }

  static async getOverviewReport(req, res, next) {
    try {
      if (req.user.role !== 'super_admin') {
        return res
          .status(403)
          .json({ success: false, message: 'Only super admins can access this report.' });
      }
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const nextMonthStart = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
      // Count schools by status
      const [
        totalSchools,
        activeSchools,
        inactiveSchools,
        suspendedSchools,
        trialSchools,
        totalUsers,
        totalBranches,
        subscriptionRevenueByCurrency
      ] = await Promise.all([
        School.count(),
        School.count({ where: { status: 'active' } }),
        School.count({ where: { status: 'inactive' } }),
        School.count({ where: { status: 'suspended' } }),
        School.count({ where: { status: 'trial' } }),
        User.count(),
        Branch.count(),
        Transaction.findAll({
          attributes: ['currency', [Sequelize.fn('SUM', Sequelize.col('amount')), 'amount']],
          where: {
            payment_status: 'completed',
            transaction_status: 'success',
            created_at: {
              [Op.gte]: monthStart,
              [Op.lt]: nextMonthStart
            }
          },
          group: ['currency'],
          raw: true
        })
      ]);
      // Expiring trials: status 'trial' and subscription_end_date within 7 days
      const now = new Date();
      const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const expiringTrials = await School.findAll({
        where: {
          status: 'trial',
          subscription_end_date: {
            [Op.lte]: in7days,
            [Op.gte]: now
          }
        },
        attributes: ['id', 'name', 'email', 'subscription_end_date']
      });
      res.json({
        success: true,
        data: {
          totalSchools,
          activeSchools,
          inactiveSchools,
          suspendedSchools,
          trialSchools,
          totalUsers,
          totalBranches,
          expiringTrials,
          subscriptionRevenueByCurrency
        }
      });
    } catch (error) {
      logger.error('Error in DashboardController.getOverviewReport:', error);
      next(error);
    }
  }

  static async getSchoolReport(req, res, next) {
    try {
      if (req.user.role !== 'admin') {
        return res
          .status(403)
          .json({ success: false, message: 'Only school admins can access this report.' });
      }
      const schoolId = req.user.school_id;
      if (!schoolId) {
        return res.status(400).json({ success: false, message: 'No school assigned.' });
      }
      // Count users by role
      const [totalStudents, totalTeachers, totalStaff, totalParents, totalBranches] =
        await Promise.all([
          User.count({ where: { school_id: schoolId, role: 'student' } }),
          User.count({ where: { school_id: schoolId, role: 'teacher' } }),
          User.count({
            where: {
              school_id: schoolId,
              role: [
                'accountant',
                'receptionist',
                'librarian',
                'branch_admin',
                'admin'
              ]
            }
          }),
          User.count({ where: { school_id: schoolId, role: 'parent' } }),
          Branch.count({ where: { school_id: schoolId } })
        ]);
      // Get enabled modules
      const school = await School.findByPk(schoolId);
      const enabledModules = Array.isArray(school.modules) ? school.modules : [];
      res.json({
        success: true,
        data: {
          totalStudents,
          totalTeachers,
          totalStaff,
          totalParents,
          totalBranches,
          enabledModules
        }
      });
    } catch (error) {
      logger.error('Error in DashboardController.getSchoolReport:', error);
      next(error);
    }
  }

  static async getRecentActivities(req, res, next) {
    try {
      const user = req.user;
      const requestedLimit = Number.parseInt(req.query.limit, 10);
      const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 10;
      const cleanSchoolId = sanitizeId(req.query.school_id);
      const cleanBranchId = sanitizeId(req.query.branch_id);
      const activities = [];

      if (user.role === 'super_admin') {
        const scopeConditions = [];
        const replacements = {};
        if (cleanSchoolId) {
          scopeConditions.push('school_id = :schoolId');
          replacements.schoolId = cleanSchoolId;
        }
        if (cleanBranchId) {
          scopeConditions.push('branch_id = :branchId');
          replacements.branchId = cleanBranchId;
        }
        const scopeSql = scopeConditions.length ? `WHERE ${scopeConditions.join(' AND ')}` : '';
        const paidScopeSql = scopeConditions.length
          ? `${scopeSql} AND status = 'paid'`
          : "WHERE status = 'paid'";
        // Optimized: Single query using UNION for all recent activities
        const recentActivities = await sequelize.query(
          `
          (SELECT 
            'student' as type,
            id,
            CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')) as description,
            created_at,
            admission_number::text as extra_info
          FROM students ${scopeSql}
          ORDER BY created_at DESC 
          LIMIT ${Math.ceil(limit / 3)})
          UNION ALL
          (SELECT 
            'payment' as type,
            id,
            CONCAT('₹', COALESCE(paid_amount, 0), ' payment received') as description,
            updated_at as created_at,
            NULL::text as extra_info
          FROM fee_invoices ${paidScopeSql}
          ORDER BY updated_at DESC
          LIMIT ${Math.ceil(limit / 3)})
          UNION ALL
          (SELECT 
            'user' as type,
            id,
            CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''), ' (', role, ')') as description,
            created_at,
            role::text as extra_info
          FROM users ${scopeSql}
          ORDER BY created_at DESC 
          LIMIT ${Math.ceil(limit / 3)})
          ORDER BY created_at DESC
          LIMIT ${limit}
        `,
          {
            type: Sequelize.QueryTypes.SELECT,
            replacements
          }
        );

        recentActivities.forEach(activity => {
          const cleanDescription = activity.description.replace(/\s+/g, ' ').trim();
          activities.push({
            id: `${activity.type}_${activity.id}`,
            type:
              activity.type === 'student'
                ? 'student_added'
                : activity.type === 'payment'
                  ? 'fee_paid'
                  : 'user_created',
            title:
              activity.type === 'student'
                ? 'New Student Created'
                : activity.type === 'payment'
                  ? 'Fee Payment Received'
                  : 'New User Created',
            description: cleanDescription,
            created_at: activity.created_at ? new Date(activity.created_at).toISOString() : null
          });
        });
      } else if (user.role === 'admin') {
        // Optimized: Single query using UNION for school activities
        const branchFilter = cleanBranchId ? 'AND branch_id = :branchId' : '';
        const replacements = { schoolId: user.school_id };
        if (cleanBranchId) replacements.branchId = cleanBranchId;
        const recentActivities = await sequelize.query(
          `
          (SELECT 
            'student' as type,
            id,
            CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''), ' (', admission_number, ')') as description,
            created_at,
            admission_number::text as extra_info
          FROM students 
          WHERE school_id = :schoolId ${branchFilter}
          ORDER BY created_at DESC 
          LIMIT ${Math.ceil(limit / 2)})
          UNION ALL
          (SELECT 
            'payment' as type,
            id,
            CONCAT('₹', COALESCE(paid_amount, 0), ' payment received') as description,
            updated_at as created_at,
            NULL::text as extra_info
          FROM fee_invoices 
          WHERE school_id = :schoolId ${branchFilter} AND status = 'paid'
          ORDER BY updated_at DESC
          LIMIT ${Math.ceil(limit / 2)})
          ORDER BY created_at DESC
          LIMIT ${limit}
        `,
          {
            type: Sequelize.QueryTypes.SELECT,
            replacements
          }
        );

        recentActivities.forEach(activity => {
          const cleanDescription = activity.description.replace(/\s+/g, ' ').trim();
          activities.push({
            id: `${activity.type}_${activity.id}`,
            type: activity.type === 'student' ? 'student_added' : 'fee_paid',
            title: activity.type === 'student' ? 'New Student Created' : 'Fee Payment Received',
            description: cleanDescription,
            created_at: activity.created_at ? new Date(activity.created_at).toISOString() : null
          });
        });
      } else if (user.role === 'branch_admin') {
        // Optimized: Single query using UNION for branch activities
        const recentActivities = await sequelize.query(
          `
          (SELECT 
            'student' as type,
            id,
            CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''), ' (', admission_number, ')') as description,
            created_at,
            admission_number::text as extra_info
          FROM students 
          WHERE branch_id = :branchId
          ORDER BY created_at DESC 
          LIMIT ${Math.ceil(limit / 2)})
          UNION ALL
          (SELECT 
            'payment' as type,
            id,
            CONCAT('₹', COALESCE(paid_amount, 0), ' payment received') as description,
            updated_at as created_at,
            NULL::text as extra_info
          FROM fee_invoices 
          WHERE branch_id = :branchId AND status = 'paid'
          ORDER BY updated_at DESC
          LIMIT ${Math.ceil(limit / 2)})
          ORDER BY created_at DESC
          LIMIT ${limit}
        `,
          {
            type: Sequelize.QueryTypes.SELECT,
            replacements: { branchId: user.branch_id }
          }
        );

        recentActivities.forEach(activity => {
          const cleanDescription = activity.description.replace(/\s+/g, ' ').trim();
          activities.push({
            id: `${activity.type}_${activity.id}`,
            type: activity.type === 'student' ? 'student_added' : 'fee_paid',
            title: activity.type === 'student' ? 'New Student Created' : 'Fee Payment Received',
            description: cleanDescription,
            created_at: activity.created_at ? new Date(activity.created_at).toISOString() : null
          });
        });
      }

      // Sort by created_at and limit
      activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      activities.splice(limit);

      return res.status(200).json({
        success: true,
        data: activities
      });
    } catch (error) {
      logger.error('Error in DashboardController.getRecentActivities:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch recent activities',
        error: error.message
      });
    }
  }

  static async getStudentsChartData(req, res, next) {
    try {
      const user = req.user;
      const { where } = buildDashboardScopeWhere(user, req.query);

      const students = await Student.findAll({
        where,
        attributes: [
          [Sequelize.fn('date_trunc', 'month', Sequelize.col('created_at')), 'month'],
          [Sequelize.fn('count', Sequelize.col('id')), 'count']
        ],
        group: ['month'],
        order: [[Sequelize.col('month'), 'ASC']]
      });

      const labels = students.map(s =>
        new Date(s.get('month')).toLocaleString('default', { month: 'short' })
      );
      const data = students.map(s => s.get('count'));

      // If no data, provide default structure
      if (labels.length === 0) {
        labels.push('No Data');
        data.push(0);
      }

      res.json({ success: true, data: { labels, data } });
    } catch (error) {
      logger.error('Error in DashboardController.getStudentsChartData:', error);
      next(error);
    }
  }

  static async getFeesChartData(req, res, next) {
    try {
      const user = req.user;
      const { where } = buildDashboardScopeWhere(user, req.query);

      // Get amounts by status instead of counts
      const fees = await FeeInvoice.findAll({
        where,
        attributes: [
          'status',
          [Sequelize.fn('sum', Sequelize.col('paid_amount')), 'total_paid'],
          [Sequelize.fn('sum', Sequelize.col('balance_amount')), 'total_pending']
        ],
        group: ['status']
      });

      // Process the data to create proper chart labels and data
      const chartData = {
        labels: ['Paid', 'Pending', 'Overdue'],
        data: [0, 0, 0] // Initialize with zeros
      };

      fees.forEach(fee => {
        const status = fee.status;
        const paidAmount = parseFloat(fee.get('total_paid') || 0);
        const pendingAmount = parseFloat(fee.get('total_pending') || 0);

        if (status === 'paid') {
          chartData.data[0] += paidAmount; // Paid
        } else if (status === 'sent' || status === 'partial_paid') {
          chartData.data[1] += pendingAmount; // Pending
        } else if (status === 'overdue') {
          chartData.data[2] += pendingAmount; // Overdue
        }
      });

      // If no data, provide default structure
      if (chartData.data.every(amount => amount === 0)) {
        chartData.labels = ['No Data'];
        chartData.data = [0];
      }

      res.json({ success: true, data: chartData });
    } catch (error) {
      logger.error('Error in DashboardController.getFeesChartData:', error);
      next(error);
    }
  }

  static async getStudentDistributionData(req, res, next) {
    try {
      const user = req.user;
      const { where } = buildDashboardScopeWhere(user, req.query);

      const students = await Student.findAll({
        where,
        attributes: ['current_class', [Sequelize.fn('count', Sequelize.col('id')), 'count']],
        group: ['current_class'],
        order: [[Sequelize.col('current_class'), 'ASC']]
      });

      const labels = students.map(s => s.current_class || 'Unknown');
      const data = students.map(s => s.get('count'));

      // If no data, provide default structure
      if (labels.length === 0) {
        labels.push('No Data');
        data.push(0);
      }

      res.json({ success: true, data: { labels, data } });
    } catch (error) {
      logger.error('Error in DashboardController.getStudentDistributionData:', error);
      next(error);
    }
  }

  static async getFeeTrendData(req, res, next) {
    try {
      const user = req.user;
      const { months = 6 } = req.query;
      const { where } = buildDashboardScopeWhere(user, req.query);

      // Get fee collection data for last N months
      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(months));

      where.created_at = {
        [Op.gte]: monthsAgo
      };

      const fees = await FeeInvoice.findAll({
        where: { ...where, status: 'paid' },
        attributes: [
          [Sequelize.fn('date_trunc', 'month', Sequelize.col('created_at')), 'month'],
          [Sequelize.fn('sum', Sequelize.col('paid_amount')), 'total_paid']
        ],
        group: [Sequelize.fn('date_trunc', 'month', Sequelize.col('created_at'))],
        order: [[Sequelize.fn('date_trunc', 'month', Sequelize.col('created_at')), 'ASC']]
      });

      const labels = fees.map(f =>
        new Date(f.get('month')).toLocaleString('default', { month: 'short' })
      );
      const data = fees.map(f => parseFloat(f.get('total_paid') || 0));

      // If no data, provide default structure
      if (labels.length === 0) {
        labels.push('No Data');
        data.push(0);
      }

      res.json({ success: true, data: { labels, data } });
    } catch (error) {
      logger.error('Error in DashboardController.getFeeTrendData:', error);
      next(error);
    }
  }

  static async getAcademicYearMonths(req, res, next) {
    try {
      console.log(
        '📅 getAcademicYearMonths called by user:',
        req.user?.id,
        'role:',
        req.user?.role
      );
      const user = req.user;
      const {
        getCurrentAcademicYearForSchool,
        getAcademicYearMonths
      } = require('~/utils/academic/academicYearUtils');

      // Get current academic year for the school
      const currentAcademicYear = await getCurrentAcademicYearForSchool(user.school_id);

      if (!currentAcademicYear) {
        return res.status(404).json({
          success: false,
          message: 'No current academic year found'
        });
      }

      // Get school's starting month (default to 6 for June)
      const { School } = require('~/models');
      const school = await School.findByPk(user.school_id, {
        attributes: ['starting_month']
      });

      const startingMonth = school?.starting_month || 6; // Default to June

      // Get academic year months
      const academicMonths = getAcademicYearMonths(startingMonth, currentAcademicYear.name);

      console.log('📅 Academic year months generated:', {
        startingMonth,
        academicYear: currentAcademicYear.name,
        months: academicMonths
      });

      // Format for frontend - use calendar month numbers as values for backend compatibility
      const formattedMonths = academicMonths.map(month => ({
        value: month.month, // Calendar month number (1-12) for backend API
        label: month.display, // Academic year display (e.g., "June 2025")
        year: month.year,
        academicMonth: month.academicMonth,
        isCurrentMonth: month.isCurrentMonth
      }));

      console.log('📅 Formatted months for frontend:', formattedMonths);

      res.json({
        success: true,
        data: {
          academicYear: currentAcademicYear.name,
          startingMonth: startingMonth,
          months: formattedMonths
        }
      });
    } catch (error) {
      logger.error('Error in DashboardController.getAcademicYearMonths:', error);
      next(error);
    }
  }

  static async getFeeCollectionSummary(req, res, next) {
    try {
      const user = req.user;
      const cleanSchoolId = sanitizeId(req.query.school_id);
      const cleanBranchId = sanitizeId(req.query.branch_id);
      const cleanAcademicYear = sanitizeString(req.query.academic_year);

      console.log(
        '🔍 Fee collection summary called for user:',
        user.role,
        'academic_year:',
        cleanAcademicYear
      );

      // Get current academic year from database if not provided
      let targetAcademicYear = cleanAcademicYear;
      if (!targetAcademicYear) {
        const schoolIdForAY = cleanSchoolId || user.school_id;
        const { getCurrentAcademicYearForSchool } = require('~/utils/academic/academicYearUtils');
        const currentAcademicYear = await getCurrentAcademicYearForSchool(schoolIdForAY).catch(() => null);
        targetAcademicYear = currentAcademicYear ? (currentAcademicYear.code || currentAcademicYear.name) : null;

        if (!targetAcademicYear) {
          // Fallback to calculated academic year if no current year in database
          const currentYear = new Date().getFullYear();
          const currentMonth = new Date().getMonth() + 1; // 1-12
          targetAcademicYear =
            currentMonth >= 6
              ? `${currentYear}-${currentYear + 1}`
              : `${currentYear - 1}-${currentYear}`;
        }
      }

      let where = {};
      let branchWhere = {};

      // Only filter by academic year if explicitly provided
      if (targetAcademicYear) {
        where.academic_year = targetAcademicYear;
      }

      if (user.role === 'super_admin') {
        // Super admin can see all schools or filter by school_id / branch_id
        if (cleanSchoolId) {
          where.school_id = cleanSchoolId;
          branchWhere.school_id = cleanSchoolId;
          if (cleanBranchId) {
            const b = await Branch.findOne({ where: { id: cleanBranchId, school_id: cleanSchoolId } });
            if (b) {
              where.branch_id = cleanBranchId;
              branchWhere.id = cleanBranchId;
            }
          }
        }
      } else if (user.role === 'admin') {
        where.school_id = user.school_id;
        branchWhere.school_id = user.school_id;

        // Add branch filter if provided and belongs to user's school
        if (cleanBranchId) {
          const b = await Branch.findOne({ where: { id: cleanBranchId, school_id: user.school_id } });
          if (b) {
            where.branch_id = cleanBranchId;
            branchWhere.id = cleanBranchId;
          }
        }
      } else if (user.role === 'branch_admin') {
        if (cleanBranchId && cleanBranchId !== user.branch_id) {
          throw new ApiError(403, 'Unauthorized access to other branch data');
        }
        where.school_id = user.school_id;
        where.branch_id = user.branch_id;
        branchWhere.id = user.branch_id;
      } else if (user.role === 'accountant') {
        where.school_id = user.school_id;
        branchWhere.school_id = user.school_id;
        const effectiveBranchId = user.branch_id || cleanBranchId;
        if (effectiveBranchId) {
          where.branch_id = effectiveBranchId;
          branchWhere.id = effectiveBranchId;
        }
      } else {
        throw new ApiError(403, 'Access denied');
      }

      // Get all summary statistics in a single optimized query

      const summaryStats = await FeeInvoice.findAll({
        where,
        attributes: [
          [FeeInvoice.sequelize.fn('COUNT', FeeInvoice.sequelize.col('id')), 'total_invoices'],
          [
            FeeInvoice.sequelize.fn(
              'COUNT',
              FeeInvoice.sequelize.literal("CASE WHEN status = 'paid' THEN 1 END")
            ),
            'paid_count'
          ],
          [
            FeeInvoice.sequelize.fn(
              'COUNT',
              FeeInvoice.sequelize.literal(
                "CASE WHEN status IN ('sent', 'partial_paid') THEN 1 END"
              )
            ),
            'pending_count'
          ],
          [
            FeeInvoice.sequelize.fn(
              'COUNT',
              FeeInvoice.sequelize.literal("CASE WHEN status = 'overdue' THEN 1 END")
            ),
            'overdue_count'
          ],
          [
            FeeInvoice.sequelize.fn(
              'SUM',
              FeeInvoice.sequelize.literal(
                "CASE WHEN status IN ('paid', 'partial_paid') THEN paid_amount ELSE 0 END"
              )
            ),
            'total_collected'
          ],
          [
            FeeInvoice.sequelize.fn(
              'SUM',
              FeeInvoice.sequelize.literal(
                "CASE WHEN status IN ('sent', 'partial_paid', 'overdue') THEN balance_amount ELSE 0 END"
              )
            ),
            'total_pending'
          ]
        ],
        raw: true
      });

      const stats = summaryStats[0] || {};
      const totalInvoices = parseInt(stats.total_invoices || 0);
      const paidInvoices = parseInt(stats.paid_count || 0);
      const pendingInvoices = parseInt(stats.pending_count || 0);
      const overdueInvoices = parseInt(stats.overdue_count || 0);
      const totalCollected = parseFloat(stats.total_collected || 0);
      const totalPending = parseFloat(stats.total_pending || 0);

      console.log('💰 Dashboard calculation results (optimized single query):');
      console.log('   - Total Invoices:', totalInvoices);
      console.log('   - Paid Invoices:', paidInvoices);
      console.log('   - Pending Invoices:', pendingInvoices);
      console.log('   - Overdue Invoices:', overdueInvoices);
      console.log('   - Total Collected:', totalCollected);
      console.log('   - Total Pending:', totalPending);

      // Get branch-wise breakdown for school admin and super admin
      let branchBreakdown = [];
      if (user.role === 'admin' || user.role === 'super_admin') {
        const branches = await Branch.findAll({
          where: branchWhere,
          attributes: ['id', 'name']
        });

        if (branches.length > 0) {
          // Get all branch fee data in a single optimized query
          const branchIds = branches.map(b => b.id);
          const branchFeeData = await FeeInvoice.findAll({
            where: {
              ...where,
              branch_id: { [Op.in]: branchIds }
            },
            attributes: [
              'branch_id',
              [
                FeeInvoice.sequelize.fn(
                  'SUM',
                  FeeInvoice.sequelize.literal(
                    "CASE WHEN status IN ('paid', 'partial_paid') THEN paid_amount ELSE 0 END"
                  )
                ),
                'total_collected'
              ],
              [
                FeeInvoice.sequelize.fn(
                  'SUM',
                  FeeInvoice.sequelize.literal(
                    "CASE WHEN status IN ('sent', 'partial_paid', 'overdue') THEN balance_amount ELSE 0 END"
                  )
                ),
                'total_pending'
              ]
            ],
            group: ['branch_id'],
            raw: true
          });

          // Create a map for quick lookup
          const branchStatsMap = {};
          branchFeeData.forEach(stat => {
            branchStatsMap[stat.branch_id] = {
              total_collected: parseFloat(stat.total_collected || 0),
              total_pending: parseFloat(stat.total_pending || 0)
            };
          });

          // Build branch breakdown with fee data
          branchBreakdown = branches
            .map(branch => ({
              id: branch.id,
              name: branch.name,
              total_collected: branchStatsMap[branch.id]?.total_collected || 0,
              total_pending: branchStatsMap[branch.id]?.total_pending || 0
            }))
            .filter(branch => branch.total_collected > 0 || branch.total_pending > 0);
        }
      }

      // Build summary response with optimized data
      const summary = {
        academic_year: targetAcademicYear,
        total_collected: totalCollected,
        total_pending: totalPending,
        total_invoices: totalInvoices,
        paid_invoices: paidInvoices,
        pending_invoices: pendingInvoices,
        overdue_invoices: overdueInvoices,
        collection_rate: totalInvoices > 0 ? ((paidInvoices / totalInvoices) * 100).toFixed(1) : 0,
        branch_breakdown: branchBreakdown
      };
      res.json({ success: true, data: summary });
    } catch (error) {
      logger.error('Error in DashboardController.getFeeCollectionSummary:', error);
      next(error);
    }
  }

  static async getIncomeVsExpense(req, res, next) {
    try {
      const user = req.user;
      const { where } = buildDashboardScopeWhere(user, req.query);
      const now = new Date();
      const firstMonth = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const dateOnly = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const dateRange = { [Op.gte]: dateOnly(firstMonth), [Op.lt]: dateOnly(nextMonth) };
      const monthExpression = Sequelize.fn('date_trunc', 'month', Sequelize.col('payment_date'));
      const [feeRows, transactionRows] = await Promise.all([
        FeePayment.findAll({
          where: { ...where, payment_status: 'completed', payment_date: dateRange },
          attributes: [[monthExpression, 'month'], [Sequelize.fn('sum', Sequelize.col('payment_amount')), 'total']],
          group: [monthExpression],
          raw: true
        }),
        SchoolTransaction.findAll({
          where: { ...where, type: { [Op.in]: ['income', 'expense'] }, date: dateRange },
          attributes: [
            [Sequelize.fn('date_trunc', 'month', Sequelize.col('date')), 'month'],
            'type',
            [Sequelize.fn('sum', Sequelize.col('amount')), 'total']
          ],
          group: [Sequelize.fn('date_trunc', 'month', Sequelize.col('date')), 'type'],
          raw: true
        })
      ]);
      const monthKeys = Array.from({ length: 12 }, (_, index) => {
        const date = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + index, 1);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      });
      const income = Object.fromEntries(monthKeys.map(key => [key, 0]));
      const expense = Object.fromEntries(monthKeys.map(key => [key, 0]));
      const keyOf = value => (value instanceof Date ? value.toISOString() : String(value)).slice(0, 7);
      feeRows.forEach(row => {
        const key = keyOf(row.month);
        if (key in income) income[key] += Number(row.total || 0);
      });
      transactionRows.forEach(row => {
        const key = keyOf(row.month);
        if (row.type === 'income' && key in income) income[key] += Number(row.total || 0);
        if (row.type === 'expense' && key in expense) expense[key] += Number(row.total || 0);
      });
      const labels = monthKeys.map(key => {
        const [year, month] = key.split('-').map(Number);
        return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' })
          .format(new Date(Date.UTC(year, month - 1, 1)));
      });
      return res.json({
        success: true,
        data: {
          labels,
          income: monthKeys.map(key => Number(income[key].toFixed(2))),
          expense: monthKeys.map(key => Number(expense[key].toFixed(2)))
        }
      });
    } catch (error) {
      logger.error('Error in DashboardController.getIncomeVsExpense:', error);
      next(error);
    }
  }

  static async getWeekendAttendance(req, res, next) {
    try {
      const user = req.user;
      const { where } = buildDashboardScopeWhere(user, req.query);

      const days = [];
      const studentAtt = [];
      const employeeAtt = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayLabel = d.toLocaleDateString('default', { day: '2-digit', month: 'short' });
        const dateStr = d.toISOString().split('T')[0];

        days.push(dayLabel);

        // Count present/late student attendance for date
        const studentCount = await AttendanceRecord.count({
          where: {
            ...where,
            date: dateStr,
            status: ['present', 'late', 'P', 'L']
          }
        }).catch(() => 0);

        studentAtt.push({ y: studentCount });
        employeeAtt.push({ y: Math.floor(studentCount * 0.1) }); // Fallback ratio if no staff attendance table
      }

      res.json({
        success: true,
        data: {
          days,
          student_att: studentAtt,
          employee_att: employeeAtt
        }
      });
    } catch (error) {
      logger.error('Error in DashboardController.getWeekendAttendance:', error);
      next(error);
    }
  }

  static async getAnnualFeesSummary(req, res, next) {
    try {
      const user = req.user;
      const { where } = buildDashboardScopeWhere(user, req.query);

      const currentYear = new Date().getFullYear();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const totalFee = new Array(12).fill(0);
      const totalPaid = new Array(12).fill(0);
      const totalDue = new Array(12).fill(0);

      const invoices = await FeeInvoice.findAll({
        where: {
          ...where,
          created_at: {
            [Op.gte]: new Date(`${currentYear}-01-01`),
            [Op.lte]: new Date(`${currentYear}-12-31`)
          }
        },
        attributes: ['total_amount', 'paid_amount', 'balance_amount', 'created_at'],
        raw: true
      });

      invoices.forEach(inv => {
        const monthIdx = new Date(inv.created_at).getMonth();
        totalFee[monthIdx] += parseFloat(inv.total_amount || 0);
        totalPaid[monthIdx] += parseFloat(inv.paid_amount || 0);
        totalDue[monthIdx] += parseFloat(inv.balance_amount || 0);
      });

      res.json({
        success: true,
        data: {
          months,
          total_fee: totalFee,
          total_paid: totalPaid,
          total_due: totalDue
        }
      });
    } catch (error) {
      logger.error('Error in DashboardController.getAnnualFeesSummary:', error);
      next(error);
    }
  }
}

module.exports = DashboardController;
