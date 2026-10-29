require('module-alias/register');

const { Branch, Class, Section, Stream } = require('../src/models');
const Controller = require('../src/controllers/academic/student.controller');

describe('student bulk import tenant and branch scope', () => {
  const originals = {
    branchFindOne: Branch.findOne,
    classFindOne: Class.findOne,
    sectionFindOne: Section.findOne,
    streamFindOne: Stream.findOne
  };

  beforeEach(() => {
    Branch.findOne = jest.fn();
    Class.findOne = jest.fn();
    Section.findOne = jest.fn();
    Stream.findOne = jest.fn();
  });

  afterAll(() => {
    Branch.findOne = originals.branchFindOne;
    Class.findOne = originals.classFindOne;
    Section.findOne = originals.sectionFindOne;
    Stream.findOne = originals.streamFindOne;
  });

  const request = ({
    role = 'branch_admin',
    branchId = 'branch-a',
    bodyBranchId = 'branch-a',
    sectionId,
    streamId,
    csv = ''
  } = {}) => ({
      user: { id: 'user-a', role, school_id: 'school-a', branch_id: branchId },
      schoolId: 'school-a',
      body: {
        branch_id: bodyBranchId,
        class_id: 'class-a',
        ...(sectionId && { section_id: sectionId }),
        ...(streamId && { stream_id: streamId })
      },
      file: { buffer: Buffer.from(csv) }
    });

  it('rejects a Branch Admin upload targeting another branch before database reads', async () => {
    const next = jest.fn();

    await Controller.bulkImportStudents(request({ bodyBranchId: 'branch-b' }), {}, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    expect(Branch.findOne).not.toHaveBeenCalled();
    expect(Class.findOne).not.toHaveBeenCalled();
  });

  it('fails closed when a Branch Admin has no assigned branch', async () => {
    const next = jest.fn();

    await Controller.bulkImportStudents(
      request({ branchId: null, bodyBranchId: 'branch-a' }),
      {},
      next
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    expect(Branch.findOne).not.toHaveBeenCalled();
    expect(Class.findOne).not.toHaveBeenCalled();
  });

  it('validates the chosen class against the resolved school and branch', async () => {
    Branch.findOne.mockResolvedValue({ id: 'branch-a' });
    Class.findOne.mockResolvedValue(null);
    const next = jest.fn();
    const csv = [
      'FirstName,Gender,Birthday,AdmissionDate,AdmissionNumber,GuardianName,GuardianRelation,GuardianMobileNo,GuardianAddress',
      'Demo,Female,2015-01-01,2026-04-01,DEMO-001,Guardian,Mother,9000000000,Address'
    ].join('\n');

    await Controller.bulkImportStudents(request({ csv }), {}, next);

    expect(Branch.findOne).toHaveBeenCalledWith({
      where: { id: 'branch-a', school_id: 'school-a', status: 'active' }
    });
    expect(Class.findOne).toHaveBeenCalledWith({
      where: { id: 'class-a', school_id: 'school-a', branch_id: 'branch-a', is_active: true }
    });
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });

  it('rejects a section that does not belong to the selected class and branch', async () => {
    Branch.findOne.mockResolvedValue({ id: 'branch-a' });
    Class.findOne.mockResolvedValue({ id: 'class-a', name: 'Class 1' });
    Section.findOne.mockResolvedValue(null);
    const next = jest.fn();
    const csv = [
      'FirstName,Gender,Birthday,AdmissionDate,AdmissionNumber,GuardianName,GuardianRelation,GuardianMobileNo,GuardianAddress',
      'Demo,Female,2015-01-01,2026-04-01,DEMO-001,Guardian,Mother,9000000000,Address'
    ].join('\n');

    await Controller.bulkImportStudents(request({ sectionId: 'section-other', csv }), {}, next);

    expect(Section.findOne).toHaveBeenCalledWith({
      where: {
        id: 'section-other',
        class_id: 'class-a',
        school_id: 'school-a',
        branch_id: 'branch-a',
        is_active: true
      }
    });
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });

  it('rejects a stream that does not belong to the selected class and branch', async () => {
    Branch.findOne.mockResolvedValue({ id: 'branch-a' });
    Class.findOne.mockResolvedValue({ id: 'class-a', name: 'Class 1' });
    Stream.findOne.mockResolvedValue(null);
    const next = jest.fn();
    const csv = [
      'FirstName,Gender,Birthday,AdmissionDate,AdmissionNumber,GuardianName,GuardianRelation,GuardianMobileNo,GuardianAddress',
      'Demo,Female,2015-01-01,2026-04-01,DEMO-001,Guardian,Mother,9000000000,Address'
    ].join('\n');

    await Controller.bulkImportStudents(request({ streamId: 'stream-other', csv }), {}, next);

    expect(Stream.findOne).toHaveBeenCalledWith({
      where: {
        id: 'stream-other',
        class_id: 'class-a',
        school_id: 'school-a',
        branch_id: 'branch-a',
        is_active: true
      }
    });
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });
});
