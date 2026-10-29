require('module-alias/register');
jest.mock('../src/utils/communication/email', () => ({ sendEmail: jest.fn() }));
const { Op } = require('sequelize');
const {
  Student,
  Parent,
  AcademicCalendar,
  Homework,
  FeeInvoice,
  AttendanceRecord,
  AttendanceSession,
  Exam,
  ExamResult,
  Timetable,
  LibraryBook,
  LibraryIssue,
  StudentTransport,
  HostelAllocation,
  Hostel,
  HostelRoom,
  DynamicEntityRecord,
  ReportCardSetup,
  Branch
} = require('../src/models');
const {
  portalDashboard,
  portalFeeInvoices,
  portalLibraryCatalog,
  portalReportCard,
  portalReportCardSetups,
  parentSchoolVisits,
  createParentSchoolVisit,
  runAction,
  list
} = require('../src/controllers/shared/dynamic-entities.controller');
const ReportCardService = require('../src/services/academic/report-card.service');

describe('student and parent portal homework scope', () => {
  const methods = [
    [Student, 'findOne'],
    [Parent, 'findOne'],
    [DynamicEntityRecord, 'create'],
    [DynamicEntityRecord, 'findOne'],
    [DynamicEntityRecord, 'findAll'],
    [DynamicEntityRecord, 'findAndCountAll'],
    [Branch, 'findOne'],
    [AcademicCalendar, 'findAll'],
    [Homework, 'findAll'],
    [FeeInvoice, 'findAll'],
    [FeeInvoice, 'findAndCountAll'],
    [FeeInvoice, 'findOne'],
    [FeeInvoice, 'count'],
    [LibraryBook, 'findAll'],
    [LibraryBook, 'findAndCountAll'],
    [AttendanceRecord, 'findAll'],
    [ExamResult, 'findAll'],
    [Timetable, 'findOne'],
    [Exam, 'findAll'],
    [LibraryIssue, 'findAll'],
    [StudentTransport, 'findOne'],
    [HostelAllocation, 'findOne'],
    [DynamicEntityRecord, 'findAll'],
    [ReportCardSetup, 'findAll'],
    [ReportCardSetup, 'findOne']
  ];
  const originals = methods.map(([model, method]) => [model, method, model[method]]);
  const reportCardOriginals = [
    'generateReportCard',
    'generatePDFReportCard',
    'calculateGrade',
    'getGradingSystem'
  ].map(method => [method, ReportCardService.prototype[method]]);

  afterEach(() => {
    originals.forEach(([model, method, original]) => {
      model[method] = original;
    });
    reportCardOriginals.forEach(([method, original]) => {
      ReportCardService.prototype[method] = original;
    });
    jest.clearAllMocks();
  });

  it('limits student portal homework to the student academic year and legacy assignments', async () => {
    Student.findOne = jest.fn().mockResolvedValue({
      id: 'student-1',
      user_id: 'user-1',
      school_id: 'school-1',
      branch_id: 'branch-1',
      class_id: 'class-1',
      section_id: 'section-1',
      academic_year: '2026-2027',
      setDataValue: jest.fn()
    });
    [
      Homework,
      AcademicCalendar,
      FeeInvoice,
      ExamResult,
      LibraryBook,
      LibraryIssue,
      DynamicEntityRecord
    ].forEach(model => {
      model.findAll = jest.fn().mockResolvedValue([]);
    });
    DynamicEntityRecord.findAll = jest.fn().mockResolvedValue([]);
    FeeInvoice.findOne = jest.fn().mockResolvedValue({
      total_assigned: '45500.00',
      total_paid: '24000.00',
      due_balance: '21500.00'
    });
    FeeInvoice.count = jest.fn().mockResolvedValue(3);
    AttendanceRecord.findAll = jest.fn().mockResolvedValue([
      { id: 'attendance-late', status: 'late' },
      { id: 'attendance-absent', status: 'absent' }
    ]);
    Timetable.findOne = jest.fn().mockResolvedValue(null);
    StudentTransport.findOne = jest.fn().mockResolvedValue(null);
    HostelAllocation.findOne = jest.fn().mockResolvedValue(null);
    const res = {
      status: jest.fn(function (statusCode) {
        res.statusCode = statusCode;
        return res;
      }),
      json: jest.fn(body => {
        res.body = body;
        return res;
      })
    };

    await portalDashboard({ user: { id: 'user-1', role: 'student' } }, res);

    expect(res.body).toEqual(expect.objectContaining({ success: true }));
    expect(res.body.success).toBe(true);
    expect(res.body.data.feeSummary).toEqual({
      total_assigned: '45500.00',
      total_paid: '24000.00',
      due_balance: '21500.00'
    });
    expect(res.body.data.dueInvoiceCount).toBe(3);
    expect(res.body.data).not.toHaveProperty('studyMaterials');
    expect(res.body.data.attendance).toMatchObject({
      total: 2,
      present: 0,
      absent: 1,
      late: 1,
      rate: 50
    });
    expect(Homework.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          school_id: 'school-1',
          branch_id: 'branch-1',
          class_id: 'class-1',
          [Op.and]: [
            { [Op.or]: [{ section_id: null }, { section_id: 'section-1' }] },
            { [Op.or]: [{ academic_year: '2026-2027' }, { academic_year: null }] }
          ]
        }),
        attributes: expect.arrayContaining(['academic_year'])
      })
    );
    expect(LibraryIssue.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { student_id: 'student-1' },
        include: [
          expect.objectContaining({
            model: LibraryBook,
            as: 'book',
            attributes: ['title'],
            required: false
          })
        ]
      })
    );
    expect(FeeInvoice.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          student_id: 'student-1',
          status: { [Op.notIn]: ['draft', 'cancelled'] }
        },
        raw: true
      })
    );
    expect(FeeInvoice.count).toHaveBeenCalledWith({
      where: {
        student_id: 'student-1',
        status: { [Op.notIn]: ['draft', 'cancelled'] },
        balance_amount: { [Op.gt]: 0 }
      }
    });
    expect(Timetable.findOne).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: {
          school_id: 'school-1',
          branch_id: 'branch-1',
          class_id: 'class-1',
          academic_year: '2026-2027',
          is_active: true,
          section_id: 'section-1'
        }
      })
    );
    expect(Timetable.findOne).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: {
          school_id: 'school-1',
          branch_id: 'branch-1',
          class_id: 'class-1',
          academic_year: '2026-2027',
          is_active: true,
          section_id: null
        }
      })
    );
    expect(AcademicCalendar.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          school_id: 'school-1',
          branch_id: 'branch-1',
          day_type: { [Op.ne]: 'working' },
          academic_year: '2026-2027'
        },
        attributes: ['id', 'date', 'day_type', 'description', 'academic_year'],
        order: [['date', 'ASC']],
        limit: 100
      })
    );
    expect(AttendanceRecord.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { student_id: 'student-1', school_id: 'school-1', branch_id: 'branch-1' },
        attributes: ['id', 'date', 'status', 'remarks'],
        include: [
          expect.objectContaining({
            model: AttendanceSession,
            as: 'session',
            attributes: ['id', 'attendance_type', 'period_number'],
            where: {
              status: 'published',
              [Op.or]: [{ academic_year: '2026-2027' }, { academic_year: null }]
            },
            required: true
          })
        ],
        order: [['date', 'DESC']],
        limit: 2000
      })
    );
    expect(ExamResult.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { student_id: 'student-1' },
        include: [
          {
            model: Exam,
            as: 'exam',
            attributes: ['id', 'name', 'max_marks', 'result_status'],
            where: { result_status: true },
            required: true
          }
        ]
      })
    );
    expect(DynamicEntityRecord.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          school_id: 'school-1',
          entity_type: ['school_notice', 'notice', 'announcement'],
          [Op.or]: [{ branch_id: 'branch-1' }, { branch_id: null }]
        },
        attributes: ['id', 'title', 'date_value', 'created_at', 'notes'],
        limit: 10
      })
    );
    expect(LibraryBook.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          school_id: 'school-1',
          [Op.or]: [{ branch_id: 'branch-1' }, { branch_id: null }]
        },
        attributes: ['id', 'title', 'author', 'category', 'available', 'quantity'],
        limit: 24
      })
    );
    expect(HostelAllocation.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { student_id: 'student-1' },
        include: [
          expect.objectContaining({ model: Hostel, as: 'hostel', attributes: ['hostel_name'] }),
          expect.objectContaining({ model: HostelRoom, as: 'room', attributes: ['room_number'] })
        ]
      })
    );

    const sectionSlot = { id: 'section-slot' };
    Timetable.findOne.mockReset().mockResolvedValueOnce({ slots: [sectionSlot] });
    const sectionScheduleResponse = { json: jest.fn() };
    await portalDashboard({ user: { id: 'user-1', role: 'student' } }, sectionScheduleResponse);
    expect(sectionScheduleResponse.json.mock.calls[0][0].data.timetable).toEqual([sectionSlot]);
    expect(Timetable.findOne).toHaveBeenCalledTimes(1);
  });

  it('returns only parent identity/contact fields instead of the full household record', async () => {
    Parent.findOne = jest.fn().mockResolvedValue({
      id: 'parent-1',
      guardian_name: 'Demo Guardian',
      guardian_phone: '+91 90000 00002',
      guardian_relation: 'Parent',
      guardian_income: '250000.00',
      father_income: '200000.00',
      students: []
    });
    const res = {
      json: jest.fn(body => {
        res.body = body;
      })
    };

    await portalDashboard({ user: { id: 'parent-user-1', role: 'parent' }, query: {} }, res);

    expect(res.body.data.parent).toEqual({
      id: 'parent-1',
      guardian_name: 'Demo Guardian',
      guardian_phone: '+91 90000 00002',
      guardian_relation: 'Parent'
    });
    expect(res.body.data.parent).not.toHaveProperty('guardian_income');
    expect(res.body.data.parent).not.toHaveProperty('father_income');
    expect(res.body.data).toMatchObject({
      kind: 'parent',
      students: [],
      activeStudent: null
    });
    expect(res.body.data).not.toHaveProperty('student');
  });

  it('paginates the linked Parent library catalog using the child branch, not a forged branch query', async () => {
    Parent.findOne = jest.fn().mockResolvedValue({
      students: [{ id: 'student-1', school_id: 'school-1', branch_id: 'branch-1' }]
    });
    LibraryBook.findAndCountAll = jest
      .fn()
      .mockResolvedValue({ count: 63, rows: [{ id: 'book-13' }] });
    LibraryBook.findAll = jest
      .fn()
      .mockResolvedValue([{ category: 'Reference' }, { category: null }]);
    const res = {
      json: jest.fn(body => {
        res.body = body;
      })
    };

    await portalLibraryCatalog(
      {
        user: { id: 'parent-user-1', role: 'parent', school_id: 'school-1' },
        schoolId: 'school-1',
        query: {
          student_id: 'student-1',
          branch_id: 'branch-forged',
          search: 'math',
          category: 'Reference',
          page: '2',
          limit: '1000'
        }
      },
      res
    );

    const query = LibraryBook.findAndCountAll.mock.calls[0][0];
    expect(query.where.school_id).toBe('school-1');
    expect(query.where[Op.and][0][Op.or]).toEqual([{ branch_id: 'branch-1' }, { branch_id: null }]);
    expect(query.where[Op.and]).toContainEqual({ category: 'Reference' });
    expect(query.where[Op.and].some(filter => filter[Op.or]?.some(term => term.title))).toBe(true);
    expect(query).toMatchObject({ limit: 50, offset: 50 });
    expect(res.body).toMatchObject({
      success: true,
      data: [{ id: 'book-13' }],
      categories: ['Reference'],
      pagination: { total: 63, page: 2, limit: 50, totalPages: 2 }
    });
  });

  it('does not expose catalog data for an unlinked child or an unscoped student account', async () => {
    Parent.findOne = jest.fn().mockResolvedValue({
      students: [{ id: 'student-1', school_id: 'school-1', branch_id: 'branch-1' }]
    });
    LibraryBook.findAndCountAll = jest.fn();
    const response = () => ({
      status: jest.fn(function () {
        return this;
      }),
      json: jest.fn()
    });
    const foreignChild = response();
    await portalLibraryCatalog(
      {
        user: { id: 'parent-user-1', role: 'parent', school_id: 'school-1' },
        schoolId: 'school-1',
        query: { student_id: 'foreign-student' }
      },
      foreignChild
    );
    expect(foreignChild.status).toHaveBeenCalledWith(404);
    expect(LibraryBook.findAndCountAll).not.toHaveBeenCalled();

    const unscopedStudent = response();
    await portalLibraryCatalog(
      { user: { id: 'student-user', role: 'student' }, query: {} },
      unscopedStudent
    );
    expect(unscopedStudent.status).toHaveBeenCalledWith(403);
    expect(LibraryBook.findAndCountAll).not.toHaveBeenCalled();
  });

  it('returns a controlled not-found response when a Parent account has no linked students', async () => {
    Parent.findOne = jest.fn().mockResolvedValue({ students: [] });
    LibraryBook.findAndCountAll = jest.fn();
    const res = {
      status: jest.fn(function () {
        return this;
      }),
      json: jest.fn()
    };

    await portalLibraryCatalog(
      {
        user: { id: 'parent-user-1', role: 'parent', school_id: 'school-1' },
        schoolId: 'school-1',
        query: {}
      },
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Student not found' });
    expect(LibraryBook.findAndCountAll).not.toHaveBeenCalled();
  });

  it('generates a published-only PDF for a linked parent child', async () => {
    Parent.findOne = jest.fn().mockResolvedValue({
      students: [
        {
          id: 'student-1',
          school_id: 'school-1',
          branch_id: 'branch-1',
          academic_year: '2026-2027',
          admission_number: 'DEMO-001'
        }
      ]
    });
    ReportCardService.prototype.generateReportCard = jest
      .fn()
      .mockResolvedValue({ results: [{ id: 'result-1' }] });
    ReportCardService.prototype.generatePDFReportCard = jest
      .fn()
      .mockResolvedValue(Buffer.from('%PDF'));
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(body => {
        res.body = body;
        return res;
      }),
      setHeader: jest.fn(),
      send: jest.fn(body => {
        res.body = body;
        return res;
      })
    };

    await portalReportCard(
      {
        user: { id: 'parent-user-1', role: 'parent' },
        schoolId: 'school-1',
        params: { studentId: 'student-1' },
        query: {}
      },
      res
    );

    expect(Parent.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user_id: 'parent-user-1' },
        include: [
          expect.objectContaining({
            model: Student,
            as: 'students',
            required: true,
            where: { id: 'student-1', school_id: 'school-1' },
            through: { attributes: [] }
          })
        ]
      })
    );
    expect(ReportCardService.prototype.generateReportCard).toHaveBeenCalledWith(
      'student-1',
      '2026-2027',
      null,
      {
        schoolId: 'school-1',
        branchId: 'branch-1',
        publishedOnly: true
      }
    );
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    expect(res.send).toHaveBeenCalledWith(Buffer.from('%PDF'));
  });

  it('generates a student PDF only for the authenticated student profile', async () => {
    Student.findOne = jest.fn().mockResolvedValue({
      id: 'student-1',
      school_id: 'school-1',
      branch_id: 'branch-1',
      academic_year: '2026-2027',
      admission_number: 'DEMO-001'
    });
    ReportCardService.prototype.generateReportCard = jest
      .fn()
      .mockResolvedValue({ results: [{ id: 'result-1' }] });
    ReportCardService.prototype.generatePDFReportCard = jest
      .fn()
      .mockResolvedValue(Buffer.from('%PDF'));
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
      setHeader: jest.fn(),
      send: jest.fn()
    };

    await portalReportCard(
      {
        user: { id: 'student-user-1', role: 'student' },
        schoolId: 'school-1',
        params: { studentId: 'student-1' },
        query: {}
      },
      res
    );

    expect(Student.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'student-1', user_id: 'student-user-1', school_id: 'school-1' }
      })
    );
    expect(ReportCardService.prototype.generateReportCard).toHaveBeenCalledWith(
      'student-1',
      '2026-2027',
      null,
      expect.objectContaining({ publishedOnly: true })
    );
    expect(res.send).toHaveBeenCalledWith(Buffer.from('%PDF'));
  });

  it('does not generate a family PDF for an unlinked child or without released results', async () => {
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(body => {
        res.body = body;
        return res;
      }),
      setHeader: jest.fn(),
      send: jest.fn()
    };
    Parent.findOne = jest.fn().mockResolvedValue(null);
    ReportCardService.prototype.generateReportCard = jest.fn();
    await portalReportCard(
      {
        user: { id: 'parent-user-1', role: 'parent' },
        schoolId: 'school-1',
        params: { studentId: 'other' },
        query: {}
      },
      res
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect(ReportCardService.prototype.generateReportCard).not.toHaveBeenCalled();

    Parent.findOne = jest.fn().mockResolvedValue({
      students: [
        {
          id: 'student-1',
          school_id: 'school-1',
          branch_id: 'branch-1',
          academic_year: '2026-2027',
          admission_number: 'DEMO-001'
        }
      ]
    });
    ReportCardService.prototype.generateReportCard = jest.fn().mockResolvedValue({ results: [] });
    await portalReportCard(
      {
        user: { id: 'parent-user-1', role: 'parent' },
        schoolId: 'school-1',
        params: { studentId: 'student-1' },
        query: {}
      },
      res
    );
    expect(res.status).toHaveBeenLastCalledWith(404);
    expect(res.body.message).toBe('No published exam results found');
    expect(res.send).not.toHaveBeenCalled();
  });

  it('scopes the report-card service to released exams when requested', async () => {
    Student.findOne = jest.fn().mockResolvedValue({
      class_id: 'class-1',
      section_id: 'section-1',
      school_id: 'school-1',
      branch_id: 'branch-1'
    });
    Exam.findAll = jest.fn().mockResolvedValue([]);
    ExamResult.findAll = jest.fn().mockResolvedValue([]);
    await new ReportCardService().getAcademicData('student-1', '2026-2027', null, {
      schoolId: 'school-1',
      branchId: 'branch-1',
      publishedOnly: true
    });
    expect(Exam.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          school_id: 'school-1',
          branch_id: 'branch-1',
          result_status: true
        })
      })
    );
  });

  it('lists only released published report-card setups for the linked student branch', async () => {
    Parent.findOne = jest.fn().mockResolvedValue({
      students: [{ id: 'student-1', school_id: 'school-1', branch_id: 'branch-1' }]
    });
    ReportCardSetup.findAll = jest.fn().mockResolvedValue([
      {
        id: 'setup-1',
        template: { school_id: 'school-1', is_active: true, report_type: 'student_wise' },
        examEntries: [
          {
            exam: {
              is_active: true,
              result_status: true,
              school_id: 'school-1',
              branch_id: 'branch-1'
            }
          }
        ]
      },
      {
        id: 'setup-2',
        template: { school_id: 'school-1', is_active: true, report_type: 'student_wise' },
        examEntries: [
          {
            exam: {
              is_active: true,
              result_status: false,
              school_id: 'school-1',
              branch_id: 'branch-1'
            }
          }
        ]
      }
    ]);
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(body => {
        res.body = body;
        return res;
      })
    };

    await portalReportCardSetups(
      {
        user: { id: 'parent-user-1', role: 'parent' },
        schoolId: 'school-1',
        params: { studentId: 'student-1' }
      },
      res
    );

    expect(ReportCardSetup.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { school_id: 'school-1', branch_id: 'branch-1', is_published: true }
      })
    );
    expect(res.body.data.map(setup => setup.id)).toEqual(['setup-1']);
  });

  it('renders a published weighted report only for the linked child and branch', async () => {
    const student = {
      id: 'student-1',
      school_id: 'school-1',
      branch_id: 'branch-1',
      admission_number: 'DEMO-001',
      first_name: 'Sarah',
      last_name: 'Demo',
      roll_number: '1',
      class: { name: 'Class 1' },
      sectionInfo: { name: 'A' }
    };
    Parent.findOne = jest.fn().mockResolvedValue({ students: [student] });
    const exams = [
      {
        id: 'exam-1',
        name: 'Term 1',
        school_id: 'school-1',
        branch_id: 'branch-1',
        is_active: true,
        result_status: true,
        school: { name: 'Demo School' },
        branch: { name: 'Main' },
        toJSON() {
          return this;
        }
      },
      {
        id: 'exam-2',
        name: 'Term 2',
        school_id: 'school-1',
        branch_id: 'branch-1',
        is_active: true,
        result_status: true,
        school: { name: 'Demo School' },
        branch: { name: 'Main' },
        toJSON() {
          return this;
        }
      }
    ];
    ReportCardSetup.findOne = jest.fn().mockResolvedValue({
      id: 'setup-1',
      name: 'Annual Report',
      is_published: true,
      orientation: 'portrait',
      school_id: 'school-1',
      branch_id: 'branch-1',
      template: {
        id: 'template-1',
        name: 'Student Report',
        school_id: 'school-1',
        is_active: true,
        report_type: 'student_wise'
      },
      examEntries: exams.map((exam, index) => ({ exam_id: exam.id, weightage: 50, exam }))
    });
    ExamResult.findAll = jest.fn().mockResolvedValue([
      { exam_id: 'exam-1', percentage: 86, is_absent: false },
      { exam_id: 'exam-2', percentage: 80, is_absent: false }
    ]);
    AttendanceRecord.findAll = jest.fn().mockResolvedValue([
      { student_id: 'student-1', status: 'present', record_count: 10 },
      { student_id: 'student-1', status: 'absent', record_count: 2 }
    ]);
    ReportCardService.prototype.getGradingSystem = jest.fn().mockResolvedValue({});
    ReportCardService.prototype.calculateGrade = jest.fn().mockReturnValue('A');
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(body => {
        res.body = body;
        return res;
      }),
      setHeader: jest.fn(),
      send: jest.fn(body => {
        res.body = body;
        return res;
      })
    };

    await portalReportCard(
      {
        user: { id: 'parent-user-1', role: 'parent' },
        schoolId: 'school-1',
        params: { studentId: 'student-1' },
        query: { setup_id: 'setup-1' }
      },
      res
    );

    expect(ReportCardSetup.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'setup-1', school_id: 'school-1', branch_id: 'branch-1', is_published: true }
      })
    );
    expect(ExamResult.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          student_id: 'student-1',
          school_id: 'school-1',
          branch_id: 'branch-1'
        })
      })
    );
    expect(AttendanceRecord.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          student_id: { [Op.in]: ['student-1'] },
          school_id: 'school-1',
          branch_id: 'branch-1'
        }),
        include: [
          expect.objectContaining({
            where: expect.objectContaining({ status: 'published', branch_id: 'branch-1' })
          })
        ]
      })
    );
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    expect(Buffer.isBuffer(res.body)).toBe(true);
  });

  it('creates a parent visit request only for a linked child and derives tenant/branch from that child', async () => {
    Parent.findOne = jest.fn().mockResolvedValue({
      guardian_name: 'Demo Guardian',
      guardian_phone: '+91 90000 00002',
      guardian_relation: 'Parent',
      students: [{ id: 'student-1', school_id: 'school-1', branch_id: 'branch-1' }]
    });
    DynamicEntityRecord.create = jest.fn().mockResolvedValue({
      id: 'visit-1',
      title: 'Demo Guardian',
      status: 'pending',
      date_value: '2026-11-02',
      toJSON() {
        return this;
      }
    });
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(body => {
        res.body = body;
        return res;
      })
    };

    await createParentSchoolVisit(
      {
        user: { id: 'parent-user-1' },
        schoolId: 'school-1',
        body: {
          student_id: 'student-1',
          date: '2026-11-02',
          time: '14:30',
          person_to_meet: 'Class Teacher',
          purpose: 'Discuss term progress',
          school_id: 'forged-school',
          branch_id: 'forged-branch',
          user_id: 'forged-user'
        }
      },
      res
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(Parent.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user_id: 'parent-user-1' },
        include: [
          expect.objectContaining({
            model: Student,
            as: 'students',
            where: { id: 'student-1', school_id: 'school-1' },
            required: true
          })
        ]
      })
    );
    expect(DynamicEntityRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        entity_type: 'visitor',
        status: 'pending',
        school_id: 'school-1',
        branch_id: 'branch-1',
        student_id: 'student-1',
        user_id: 'parent-user-1',
        reference_no: '+91 90000 00002',
        payload: expect.objectContaining({
          appointment_time: '14:30',
          person_to_meet: 'Class Teacher'
        })
      })
    );
    expect(DynamicEntityRecord.create.mock.calls[0][0]).not.toHaveProperty('forged-school');
  });

  it('lists only the current parent’s visit requests for a linked child', async () => {
    Parent.findOne = jest.fn().mockResolvedValue({
      students: [{ id: 'student-1', school_id: 'school-1', branch_id: 'branch-1' }]
    });
    DynamicEntityRecord.findAll = jest.fn().mockResolvedValue([
      {
        id: 'visit-1',
        title: 'Demo Guardian',
        status: 'pending',
        date_value: '2026-11-02',
        created_at: '2026-10-27T00:00:00.000Z',
        notes: 'Progress meeting',
        payload: {
          appointment_time: '14:30',
          purpose: 'Progress meeting',
          person_to_meet: 'Teacher',
          private_extra: 'omit'
        },
        toJSON() {
          return this;
        }
      }
    ]);
    const res = {
      json: jest.fn(body => {
        res.body = body;
      })
    };

    await parentSchoolVisits(
      { user: { id: 'parent-user-1' }, schoolId: 'school-1', query: { student_id: 'student-1' } },
      res
    );

    expect(DynamicEntityRecord.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          entity_type: 'visitor',
          school_id: 'school-1',
          branch_id: 'branch-1',
          student_id: 'student-1',
          user_id: 'parent-user-1'
        },
        limit: 50
      })
    );
    expect(res.body.data.records[0]).toEqual(
      expect.objectContaining({
        appointment_time: '14:30',
        person_to_meet: 'Teacher',
        purpose: 'Progress meeting'
      })
    );
    expect(res.body.data.records[0]).not.toHaveProperty('private_extra');
  });

  it('rejects invalid visit inputs and does not create a record for an unlinked student', async () => {
    DynamicEntityRecord.create = jest.fn();
    const invalidRes = {
      status: jest.fn(() => invalidRes),
      json: jest.fn(body => {
        invalidRes.body = body;
      })
    };
    await createParentSchoolVisit(
      { user: { id: 'parent-user-1' }, body: { date: '2026-02-30', time: '25:00', purpose: '' } },
      invalidRes
    );
    expect(invalidRes.status).toHaveBeenCalledWith(400);

    Parent.findOne = jest.fn().mockResolvedValue(null);
    const unlinkedRes = {
      status: jest.fn(() => unlinkedRes),
      json: jest.fn(body => {
        unlinkedRes.body = body;
      })
    };
    await createParentSchoolVisit(
      {
        user: { id: 'parent-user-1' },
        schoolId: 'school-1',
        body: { student_id: 'other-student', date: '2026-11-02', time: '14:30', purpose: 'Meeting' }
      },
      unlinkedRes
    );
    expect(unlinkedRes.status).toHaveBeenCalledWith(404);
    expect(DynamicEntityRecord.create).not.toHaveBeenCalled();
  });

  it('keeps the first visitor checkout timestamp on repeated checkout', async () => {
    const record = {
      id: 'visitor-1',
      entity_type: 'visitor',
      status: 'active',
      school_id: 'school-1',
      payload: { purpose: 'Delivery' },
      update: jest.fn(async changes => Object.assign(record, changes)),
      toJSON() {
        return this;
      }
    };
    DynamicEntityRecord.findOne = jest.fn().mockResolvedValue(record);
    const makeResponse = () => {
      const response = {
        json: jest.fn(body => {
          response.body = body;
          return response;
        })
      };
      return response;
    };
    const req = {
      params: { entity: 'visitor', id: 'visitor-1', action: 'checkout' },
      query: { branch_id: 'forged-branch' },
      schoolId: 'school-1',
      user: {
        id: 'receptionist-1',
        role: 'receptionist',
        school_id: 'school-1',
        branch_id: 'branch-1'
      }
    };

    const firstResponse = makeResponse();
    await runAction(req, firstResponse);
    expect(DynamicEntityRecord.findOne).toHaveBeenCalledWith({
      where: {
        id: 'visitor-1',
        school_id: 'school-1',
        branch_id: 'branch-1',
        entity_type: 'visitor'
      }
    });
    const firstExitTime = record.payload.exit_time;
    expect(Number.isNaN(Date.parse(firstExitTime))).toBe(false);
    expect(firstResponse.body.data.record).toMatchObject({
      status: 'exited',
      purpose: 'Delivery',
      exit_time: firstExitTime
    });

    const secondResponse = makeResponse();
    await runAction(req, secondResponse);
    expect(record.update).toHaveBeenCalledTimes(1);
    expect(secondResponse.body.data.record.exit_time).toBe(firstExitTime);
  });

  it('searches visitor logs across name, phone, and purpose within the resolved school scope', async () => {
    DynamicEntityRecord.findAndCountAll = jest.fn().mockResolvedValue({ count: 0, rows: [] });
    Branch.findOne = jest.fn().mockResolvedValue({ id: 'branch-1', school_id: 'school-1' });
    const res = {
      json: jest.fn(body => {
        res.body = body;
      })
    };

    await list(
      {
        params: { entity: 'visitor' },
        query: { search: 'Parent meeting', branch_id: 'forged-branch' },
        user: { id: 'receptionist-1', role: 'receptionist', branch_id: 'branch-1' },
        schoolId: 'school-1'
      },
      res
    );

    const [{ where }] = DynamicEntityRecord.findAndCountAll.mock.calls[0];
    expect(where).toMatchObject({
      school_id: 'school-1',
      branch_id: 'branch-1',
      entity_type: 'visitor'
    });
    expect(Branch.findOne).toHaveBeenCalledWith({
      where: { id: 'branch-1', school_id: 'school-1', status: 'active' }
    });
    expect(where[Op.or]).toEqual(
      ['title', 'reference_no', 'notes'].map(field => ({
        [field]: { [Op.iLike]: '%Parent meeting%' }
      }))
    );
    expect(res.body.data.pagination).toMatchObject({ page: 1, limit: 10 });
  });

  it('searches admission enquiries across contact, follow-up, status and payload within Receptionist branch scope', async () => {
    DynamicEntityRecord.findAndCountAll = jest.fn().mockResolvedValue({ count: 0, rows: [] });
    Branch.findOne = jest.fn().mockResolvedValue({ id: 'branch-1', school_id: 'school-1' });
    const res = { json: jest.fn(body => { res.body = body; }) };

    await list(
      {
        params: { entity: 'enquiry' },
        query: { search: 'Guardian', branch_id: 'forged-branch' },
        user: { id: 'receptionist-1', role: 'receptionist', branch_id: 'branch-1' },
        schoolId: 'school-1'
      },
      res
    );

    const [{ where }] = DynamicEntityRecord.findAndCountAll.mock.calls[0];
    expect(where).toMatchObject({
      school_id: 'school-1',
      branch_id: 'branch-1',
      entity_type: 'enquiry'
    });
    expect(where[Op.or]).toHaveLength(5);
    expect(where[Op.or].slice(0, 4)).toEqual(
      ['title', 'reference_no', 'notes', 'status'].map(field => ({
        [field]: { [Op.iLike]: '%Guardian%' }
      }))
    );
    expect(res.body.data.pagination).toMatchObject({ page: 1, limit: 10 });
  });

  it('requires a branch assignment before a receptionist can list dynamic registers', async () => {
    DynamicEntityRecord.findAndCountAll = jest.fn();
    const status = jest.fn(() => res);
    const res = {
      status,
      json: jest.fn(body => {
        res.body = body;
      })
    };

    await list(
      {
        params: { entity: 'visitor' },
        query: {},
        user: { id: 'receptionist-1', role: 'receptionist' },
        schoolId: 'school-1'
      },
      res
    );

    expect(status).toHaveBeenCalledWith(403);
    expect(DynamicEntityRecord.findAndCountAll).not.toHaveBeenCalled();
  });

  it('does not let legacy payload fields hide the related class in entity lists', async () => {
    DynamicEntityRecord.findAndCountAll = jest.fn().mockResolvedValue({
      count: 1,
      rows: [
        {
          toJSON: () => ({
            id: 'enquiry-1',
            entity_type: 'enquiry',
            title: 'Jordan Lee',
            class_id: 'class-1',
            class: { id: 'class-1', name: 'Class 1' },
            payload: { title: 'Jordan Lee', class: null }
          })
        }
      ]
    });
    Branch.findOne = jest.fn().mockResolvedValue({ id: 'branch-1', school_id: 'school-1' });
    const res = {
      json: jest.fn(body => {
        res.body = body;
        return res;
      })
    };

    await list(
      {
        params: { entity: 'enquiry' },
        query: {},
        user: {
          id: 'receptionist-1',
          role: 'receptionist',
          school_id: 'school-1',
          branch_id: 'branch-1'
        }
      },
      res
    );

    expect(res.body.data.records[0].class).toEqual({ id: 'class-1', name: 'Class 1' });
  });

  it('paginates only invoices for the requested linked child and school', async () => {
    Parent.findOne = jest.fn().mockResolvedValue({
      students: [
        { id: 'student-1', school_id: 'school-1' },
        { id: 'student-2', school_id: 'school-1' }
      ]
    });
    FeeInvoice.findAndCountAll = jest.fn().mockResolvedValue({ count: 24, rows: [{ id: 'invoice-11' }] });
    const res = {
      json: jest.fn(body => {
        res.body = body;
        return res;
      })
    };

    await portalFeeInvoices({
      user: { id: 'parent-user-1', role: 'parent' },
      schoolId: 'school-1',
      query: { student_id: 'student-2', page: '2', limit: '10' }
    }, res);

    expect(FeeInvoice.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { student_id: 'student-2', school_id: 'school-1' },
      limit: 10,
      offset: 10,
      distinct: true
    }));
    expect(res.body).toMatchObject({
      success: true,
      data: [{ id: 'invoice-11' }],
      pagination: { total: 24, page: 2, limit: 10, totalPages: 3 }
    });
  });

  it('rejects a parent request for an unlinked child without querying invoices', async () => {
    Parent.findOne = jest.fn().mockResolvedValue({ students: [{ id: 'student-1', school_id: 'school-1' }] });
    FeeInvoice.findAndCountAll = jest.fn();
    const res = {
      status: jest.fn(function (statusCode) {
        res.statusCode = statusCode;
        return res;
      }),
      json: jest.fn(body => {
        res.body = body;
        return res;
      })
    };

    await portalFeeInvoices({
      user: { id: 'parent-user-1', role: 'parent' },
      schoolId: 'school-1',
      query: { student_id: 'other-student' }
    }, res);

    expect(res.statusCode).toBe(404);
    expect(FeeInvoice.findAndCountAll).not.toHaveBeenCalled();
  });
});
