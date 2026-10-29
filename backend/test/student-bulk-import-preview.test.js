require('module-alias/register');

const {
  AcademicYear,
  Branch,
  Class,
  Parent,
  Section,
  Stream,
  Student,
  StudentCategory,
  StudentImportBatch,
  StudentImportBatchRow,
  StudentParent
} = require('../src/models');
const { sequelize } = require('../src/config/database');
const Controller = require('../src/controllers/academic/student.controller');

describe('student bulk import preview', () => {
  let importBatchUpdate;
  const originals = {
    academicYearFindByPk: AcademicYear.findByPk,
    branchFindOne: Branch.findOne,
    classFindOne: Class.findOne,
    sectionFindOne: Section.findOne,
    streamFindOne: Stream.findOne,
    studentFindOne: Student.findOne,
    studentBuild: Student.build,
    studentCreate: Student.create,
    studentCapacity: Student.validateSubscriptionCapacity,
    categoryFindOne: StudentCategory.findOne,
    parentFindOne: Parent.findOne,
    parentBuild: Parent.build,
    parentCreate: Parent.create,
    studentParentCreate: StudentParent.create,
    importBatchCreate: StudentImportBatch.create,
    importBatchRowCreate: StudentImportBatchRow.create,
    transaction: sequelize.transaction
  };

  beforeEach(() => {
    AcademicYear.findByPk = jest.fn().mockResolvedValue({ name: '2026-2027' });
    Branch.findOne = jest.fn().mockResolvedValue({ id: 'branch-a' });
    Class.findOne = jest.fn().mockResolvedValue({ id: 'class-a', name: 'Class 1' });
    Section.findOne = jest.fn();
    Stream.findOne = jest.fn();
    Student.findOne = jest.fn().mockResolvedValue(null);
    Student.build = jest.fn(() => ({ validate: jest.fn().mockResolvedValue(undefined) }));
    Student.create = jest.fn();
    Student.validateSubscriptionCapacity = jest.fn().mockResolvedValue(undefined);
    StudentCategory.findOne = jest.fn().mockResolvedValue(null);
    Parent.findOne = jest.fn().mockResolvedValue(null);
    Parent.build = jest.fn(() => ({ validate: jest.fn().mockResolvedValue(undefined) }));
    Parent.create = jest.fn();
    StudentParent.create = jest.fn();
    importBatchUpdate = jest.fn().mockResolvedValue(undefined);
    StudentImportBatch.create = jest.fn().mockResolvedValue({ update: importBatchUpdate });
    StudentImportBatchRow.create = jest.fn().mockResolvedValue({ id: 'batch-row-a' });
    sequelize.transaction = jest.fn().mockResolvedValue({
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined)
    });
    Student.create.mockResolvedValue({ id: 'student-a' });
    Parent.create.mockResolvedValue({ id: 'parent-a' });
    StudentParent.create.mockResolvedValue({ id: 'link-a' });
  });

  afterAll(() => {
    AcademicYear.findByPk = originals.academicYearFindByPk;
    Branch.findOne = originals.branchFindOne;
    Class.findOne = originals.classFindOne;
    Section.findOne = originals.sectionFindOne;
    Stream.findOne = originals.streamFindOne;
    Student.findOne = originals.studentFindOne;
    Student.build = originals.studentBuild;
    Student.create = originals.studentCreate;
    if (originals.studentCapacity) {
      Student.validateSubscriptionCapacity = originals.studentCapacity;
    } else {
      delete Student.validateSubscriptionCapacity;
    }
    StudentCategory.findOne = originals.categoryFindOne;
    Parent.findOne = originals.parentFindOne;
    Parent.build = originals.parentBuild;
    Parent.create = originals.parentCreate;
    StudentParent.create = originals.studentParentCreate;
    StudentImportBatch.create = originals.importBatchCreate;
    StudentImportBatchRow.create = originals.importBatchRowCreate;
    sequelize.transaction = originals.transaction;
  });

  const csvRow = (admissionNumber = 'DEMO-001') =>
    `Sarah,Female,2015-01-01,2026-04-01,${admissionNumber},Guardian,Mother,9000000000,Address`;
  const csv = (...rows) =>
    [
      'FirstName,Gender,Birthday,AdmissionDate,AdmissionNumber,GuardianName,GuardianRelation,GuardianMobileNo,GuardianAddress',
      ...rows
    ].join('\n');
  const request = (content, preview = true, options = {}) => ({
    user: { id: 'admin-a', role: 'admin', school_id: 'school-a' },
    schoolId: 'school-a',
    query: options.discover ? { discover: 'true' } : preview ? { preview: 'true' } : {},
    body: {
      branch_id: 'branch-a',
      class_id: 'class-a',
      academic_year_id: 'year-a',
      ...(options.mapping ? { column_mapping: JSON.stringify(options.mapping) } : {})
    },
    file: { buffer: Buffer.from(content), originalname: options.filename || 'students.csv' }
  });
  const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

  it('returns row-level preview results without creating records or opening transactions', async () => {
    const res = response();
    const next = jest.fn();

    await Controller.bulkImportStudents(request(csv(csvRow())), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        previewOnly: true,
        data: expect.objectContaining({ total: 1, successful: 1, failed: 0 })
      })
    );
    expect(Student.validateSubscriptionCapacity).toHaveBeenCalledWith('school-a', 0);
    expect(Student.create).not.toHaveBeenCalled();
    expect(StudentImportBatch.create).not.toHaveBeenCalled();
    expect(Parent.create).not.toHaveBeenCalled();
    expect(StudentParent.create).not.toHaveBeenCalled();
    expect(sequelize.transaction).not.toHaveBeenCalled();
    const preview = res.json.mock.calls[0][0].data.previewRows[0];
    expect(preview).toEqual({
      row: 1,
      admission_number: 'DEMO-001',
      student_name: 'Sarah',
      class: 'Class 1',
      section: null
    });
    expect(preview).not.toHaveProperty('guardian_phone');
  });

  it('flags duplicate admission numbers within the same preview batch', async () => {
    const res = response();
    const next = jest.fn();

    await Controller.bulkImportStudents(
      request(csv(csvRow(), csvRow())),
      res,
      next
    );

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ total: 2, successful: 1, failed: 1 })
      })
    );
  });

  it('does not return raw row data in preview validation errors', async () => {
    const res = response();
    const next = jest.fn();
    const invalidRow = csvRow().replace('Female', 'Unknown');

    await Controller.bulkImportStudents(request(csv(invalidRow)), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json.mock.calls[0][0].data.errors).toEqual([
      expect.objectContaining({ row: 1, error: expect.stringContaining('Invalid gender') })
    ]);
    expect(res.json.mock.calls[0][0].data.errors[0]).not.toHaveProperty('data');
    expect(Student.create).not.toHaveBeenCalled();
  });

  it('discovers headings without validating or writing student rows', async () => {
    const res = response();
    const next = jest.fn();
    const source = 'School roster\nStudent,Sex,DOB,Joined,Adm No,Parent,Relation,Mobile,Address\nSarah,Female,2015-01-01,2026-04-01,DEMO-001,Guardian,Mother,9000000000,Address';

    await Controller.bulkImportStudents(request(source, true, { discover: true }), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json.mock.calls[0][0].data).toMatchObject({
      header_row: 2,
      total_rows: 1,
      headers: expect.arrayContaining([expect.objectContaining({ index: 4, label: 'Adm No' })]),
      fields: expect.arrayContaining([expect.objectContaining({ field: 'AdmissionNumber', required: true })])
    });
    expect(Student.create).not.toHaveBeenCalled();
    expect(sequelize.transaction).not.toHaveBeenCalled();
  });

  it('previews alternate CSV headings using the submitted column mapping', async () => {
    const res = response();
    const next = jest.fn();
    const source = 'Student,Sex,DOB,Joined,Adm No,Parent,Relation,Mobile,Address\nSarah,Female,2015-01-01,2026-04-01,DEMO-001,Guardian,Mother,9000000000,Address';
    const mapping = {
      FirstName: 0,
      Gender: 1,
      Birthday: 2,
      AdmissionDate: 3,
      AdmissionNumber: 4,
      GuardianName: 5,
      GuardianRelation: 6,
      GuardianMobileNo: 7,
      GuardianAddress: 8
    };

    await Controller.bulkImportStudents(request(source, true, { mapping }), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json.mock.calls[0][0].data.previewRows[0]).toMatchObject({
      admission_number: 'DEMO-001',
      student_name: 'Sarah'
    });
    expect(Student.create).not.toHaveBeenCalled();
  });

  it('keeps the existing endpoint on the write path and response contract', async () => {
    const res = response();
    const next = jest.fn();

    await Controller.bulkImportStudents(request(csv(csvRow()), false), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(Student.create).toHaveBeenCalledTimes(1);
    expect(StudentImportBatch.create).toHaveBeenCalledWith(
      expect.objectContaining({
        school_id: 'school-a',
        branch_id: 'branch-a',
        imported_by: 'admin-a',
        total_rows: 1,
        status: 'in_progress'
      })
    );
    expect(importBatchUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        successful_rows: 1,
        failed_rows: 0,
        row_errors: [],
        completed_at: expect.any(Date)
      })
    );
    expect(Parent.create).toHaveBeenCalledTimes(1);
    expect(Parent.create.mock.calls[0][0]).toMatchObject({
      guardian_name: 'Guardian',
      guardian_phone: '9000000000',
      guardian_relation: 'mother',
      mother_name: 'Guardian',
      mother_phone: '9000000000',
      branch_id: 'branch-a'
    });
    expect(StudentParent.create).toHaveBeenCalledTimes(1);
    expect(sequelize.transaction).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        history_saved: true,
        data: expect.objectContaining({ total: 1, successful: 1, failed: 0 }),
        message: 'Import completed. 1 students imported successfully, 0 failed.'
      })
    );
    expect(res.json.mock.calls[0][0]).not.toHaveProperty('previewOnly');
  });

  it('imports schema-backed profile and separate parent fields', async () => {
    const csv = [
      'FirstName,MiddleName,LastName,Gender,Birthday,AdmissionDate,AdmissionNumber,Nationality,PostalCode,Country,EmergencyContact,Category,PlaceOfBirth,Height,Weight,MedicalHistory,GuardianName,GuardianRelation,GuardianMobileNo,GuardianAddress,FatherPhone,FatherEmail,FatherOccupation,FatherQualification,FatherIncome,MotherName,MotherPhone,MotherEmail,MotherOccupation,MotherQualification,MotherIncome,House,PEN,APAARID,SRNo,PreviousSoftwareID',
      'Aarav,Kumar,Sharma,male,2015-08-15,2026-04-01,DEMO-010,Indian,560001,India,9000000001,OBC,Delhi,140,35,None,Parent,other,9000000000,Address,9000000002,father@example.test,Engineer,Graduate,500000,Sita Sharma,9000000003,mother@example.test,Doctor,MBBS,700000,Blue,pen-10,apaar-10,sr-10,legacy-10'
    ].join('\n');
    const res = response();
    const next = jest.fn();

    await Controller.bulkImportStudents(request(csv, false), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(Student.create.mock.calls[0][0]).toMatchObject({
      first_name: 'Aarav', middle_name: 'Kumar', last_name: 'Sharma', category: 'obc',
      nationality: 'Indian', postal_code: '560001', country: 'India',
      emergency_contact: '9000000001',
      documents: { admission_extras: {
        house: 'Blue', pen: 'pen-10', apaar_id: 'apaar-10', sr_no: 'sr-10',
        previous_software_id: 'legacy-10'
      } },
      medical_info: { place_of_birth: 'Delhi', height: '140', weight: '35', medical_history: 'None' }
    });
    expect(Parent.create.mock.calls[0][0]).toMatchObject({
      father_phone: '9000000002', father_email: 'father@example.test',
      father_occupation: 'Engineer', father_qualification: 'Graduate', father_income: '500000',
      mother_name: 'Sita Sharma', mother_phone: '9000000003',
      mother_email: 'mother@example.test', mother_occupation: 'Doctor',
      mother_qualification: 'MBBS', mother_income: '700000'
    });
  });

  it('splits a mapped full name when no first name column is provided', async () => {
    const csv = [
      'FullName,Gender,Birthday,AdmissionDate,AdmissionNumber,GuardianName,GuardianRelation,GuardianMobileNo,GuardianAddress',
      'Aarav Kumar Sharma,male,2015-08-15,2026-04-01,DEMO-011,Parent,father,9000000000,Address'
    ].join('\n');
    const next = jest.fn();

    await Controller.bulkImportStudents(
      request(csv, false, {
        mapping: {
          FullName: 0, Gender: 1, Birthday: 2, AdmissionDate: 3, AdmissionNumber: 4,
          GuardianName: 5, GuardianRelation: 6, GuardianMobileNo: 7, GuardianAddress: 8
        }
      }),
      response(),
      next
    );

    expect(next).not.toHaveBeenCalled();
    expect(Student.create.mock.calls[0][0]).toMatchObject({
      first_name: 'Aarav', middle_name: 'Kumar', last_name: 'Sharma'
    });
  });

  it('resolves custom category names within the selected branch', async () => {
    const csv = [
      'FirstName,Gender,Birthday,AdmissionDate,AdmissionNumber,Category,GuardianName,GuardianRelation,GuardianMobileNo,GuardianAddress',
      'Aarav,male,2015-08-15,2026-04-01,DEMO-012,Demo General,Parent,father,9000000000,Address'
    ].join('\n');
    StudentCategory.findOne.mockResolvedValue({ id: 'category-a' });
    const next = jest.fn();

    await Controller.bulkImportStudents(request(csv, false), response(), next);

    expect(next).not.toHaveBeenCalled();
    expect(StudentCategory.findOne).toHaveBeenCalledWith({
      where: { school_id: 'school-a', is_active: true, name: { [require('sequelize').Op.iLike]: 'Demo General' }, branch_id: 'branch-a' }
    });
    expect(Student.create.mock.calls[0][0]).toMatchObject({ category: 'other', category_id: 'category-a' });
  });

  it('persists row errors without storing the source row contents', async () => {
    const res = response();
    const next = jest.fn();
    const sensitiveCsvRow = csv(csvRow().replace('Female', 'Unknown'));

    await Controller.bulkImportStudents(request(sensitiveCsvRow, false), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(importBatchUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        successful_rows: 0,
        failed_rows: 1,
        row_errors: [expect.objectContaining({ row: 1, error: expect.stringContaining('Invalid gender') })]
      })
    );
    const savedErrors = importBatchUpdate.mock.calls[0][0].row_errors;
    expect(savedErrors[0]).not.toHaveProperty('data');
    expect(JSON.stringify(savedErrors)).not.toContain('9000000000');
  });
});
