require('module-alias/register');

const {
  Branch,
  Class,
  DynamicEntityRecord,
  FeeStructure,
  FeeInvoice,
  Section,
  Student
} = require('../src/models');
const {
  getStudentAllocationList,
  saveFeeAllocation
} = require('../src/controllers/financial/fee-allocation.controller');

describe('fee allocation scope', () => {
  const originals = {
    branchFindOne: Branch.findOne,
    classFindOne: Class.findOne,
    sectionFindOne: Section.findOne,
    feeStructureFindOne: FeeStructure.findOne,
    invoiceFindAll: FeeInvoice.findAll,
    studentFindAll: Student.findAll,
    allocationFindAll: DynamicEntityRecord.findAll,
    allocationBulkCreate: DynamicEntityRecord.bulkCreate,
    allocationDestroy: DynamicEntityRecord.destroy
  };

  const branchAdmin = {
    schoolId: 'school-1',
    user: { id: 'user-1', role: 'branch_admin', branch_id: 'branch-1' }
  };

  beforeEach(() => {
    Branch.findOne = jest.fn().mockResolvedValue({ id: 'branch-1', school_id: 'school-1' });
    Class.findOne = jest.fn().mockResolvedValue({
      id: 'class-1',
      school_id: 'school-1',
      branch_id: 'branch-1',
      name: 'Class 1'
    });
    Section.findOne = jest.fn();
    FeeStructure.findOne = jest.fn().mockResolvedValue({
      id: 'structure-1',
      school_id: 'school-1',
      branch_id: 'branch-1',
      class_id: 'class-1',
      class_name: 'Class 1',
      applicable_classes: [],
      stream_ids: []
    });
    FeeInvoice.findAll = jest.fn().mockResolvedValue([
      {
        school_id: 'school-1',
        student_id: 'student-1',
        total_billed: '2000',
        total_paid: '500',
        total_due: '1500'
      }
    ]);
    Student.findAll = jest.fn().mockResolvedValue([{ id: 'student-1' }]);
    DynamicEntityRecord.findAll = jest.fn().mockResolvedValue([]);
    DynamicEntityRecord.bulkCreate = jest.fn().mockResolvedValue([]);
    DynamicEntityRecord.destroy = jest.fn().mockResolvedValue(0);
  });

  afterAll(() => {
    Branch.findOne = originals.branchFindOne;
    Class.findOne = originals.classFindOne;
    Section.findOne = originals.sectionFindOne;
    FeeStructure.findOne = originals.feeStructureFindOne;
    FeeInvoice.findAll = originals.invoiceFindAll;
    Student.findAll = originals.studentFindAll;
    DynamicEntityRecord.findAll = originals.allocationFindAll;
    DynamicEntityRecord.bulkCreate = originals.allocationBulkCreate;
    DynamicEntityRecord.destroy = originals.allocationDestroy;
  });

  it('lists only active students and allocations in the assigned branch', async () => {
    Student.findAll.mockResolvedValue([{ id: 'student-1', toJSON: () => ({ id: 'student-1' }) }]);
    DynamicEntityRecord.findAll.mockResolvedValue([{ student_id: 'student-1' }]);
    const res = { json: jest.fn() };

    await getStudentAllocationList(
      {
        ...branchAdmin,
        query: {
          class_id: 'class-1',
          fee_group_id: 'structure-1',
          branch_id: 'branch-2'
        }
      },
      res,
      jest.fn()
    );

    expect(Student.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          school_id: 'school-1',
          branch_id: 'branch-1',
          class_id: 'class-1',
          status: 'active'
        }
      })
    );
    expect(DynamicEntityRecord.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          school_id: 'school-1',
          related_id: 'structure-1',
          student_id: { [require('sequelize').Op.in]: ['student-1'] }
        })
      })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          students: [
            {
              id: 'student-1',
              is_allocated: true,
              total_billed: 2000,
              total_paid: 500,
              total_due: 1500
            }
          ]
        })
      })
    );
  });

  it('rejects a submitted student outside the assigned branch roster before writing', async () => {
    const next = jest.fn();

    await saveFeeAllocation(
      {
        ...branchAdmin,
        body: {
          class_id: 'class-1',
          fee_group_id: 'structure-1',
          branch_id: 'branch-2',
          student_ids: ['student-from-branch-2']
        }
      },
      {},
      next
    );

    expect(Class.findOne).toHaveBeenCalledWith({
      where: { id: 'class-1', school_id: 'school-1', branch_id: 'branch-1' }
    });
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(DynamicEntityRecord.bulkCreate).not.toHaveBeenCalled();
    expect(DynamicEntityRecord.destroy).not.toHaveBeenCalled();
  });

  it('rejects a fee structure that is not available to the selected school and branch', async () => {
    FeeStructure.findOne.mockResolvedValue(null);
    const next = jest.fn();

    await saveFeeAllocation(
      {
        ...branchAdmin,
        body: { class_id: 'class-1', fee_group_id: 'foreign-structure', student_ids: [] }
      },
      {},
      next
    );

    expect(FeeStructure.findOne).toHaveBeenCalledWith({
      where: expect.objectContaining({ id: 'foreign-structure', school_id: 'school-1' })
    });
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(Student.findAll).not.toHaveBeenCalled();
    expect(DynamicEntityRecord.findAll).not.toHaveBeenCalled();
  });

  it('stores a valid allocation under the class branch even with a spoofed branch in the request', async () => {
    const res = { json: jest.fn() };

    await saveFeeAllocation(
      {
        ...branchAdmin,
        body: {
          class_id: 'class-1',
          fee_group_id: 'structure-1',
          branch_id: 'branch-2',
          student_ids: ['student-1']
        }
      },
      res,
      jest.fn()
    );

    expect(DynamicEntityRecord.bulkCreate).toHaveBeenCalledWith([
      expect.objectContaining({
        school_id: 'school-1',
        branch_id: 'branch-1',
        student_id: 'student-1',
        related_id: 'structure-1',
        class_id: 'class-1'
      })
    ]);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ created_count: 1 })
      })
    );
  });

  it('rejects malformed student_ids instead of failing during iteration', async () => {
    const next = jest.fn();

    await saveFeeAllocation(
      {
        ...branchAdmin,
        body: { class_id: 'class-1', fee_group_id: 'structure-1', student_ids: 'student-1' }
      },
      {},
      next
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(Class.findOne).not.toHaveBeenCalled();
  });

  it('fails closed when a Branch Admin has no assigned branch', async () => {
    const next = jest.fn();

    await saveFeeAllocation(
      {
        schoolId: 'school-1',
        user: { id: 'user-1', role: 'branch_admin' },
        body: { class_id: 'class-1', fee_group_id: 'structure-1', student_ids: [] }
      },
      {},
      next
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    expect(Class.findOne).not.toHaveBeenCalled();
    expect(DynamicEntityRecord.findAll).not.toHaveBeenCalled();
  });
});
