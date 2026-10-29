require('module-alias/register');

const models = require('../src/models');
const { sequelize } = require('../src/config/database');
const Controller = require('../src/controllers/academic/student.controller');

const touchedModels = [
  'StudentImportBatch', 'StudentImportBatchRow', 'Student', 'StudentParent', 'Parent',
  'AttendanceRecord', 'ExamPosition', 'ExamResult', 'HomeworkSubmission', 'LibraryIssue',
  'OnlineExamAttempt', 'StudentPromotion', 'FeeInvoice', 'FeePayment', 'HostelAllocation',
  'StudentTransport', 'Alumni', 'DynamicEntityRecord', 'GatePass', 'ParentTeacherMeetingStudent'
];

describe('guarded student import undo', () => {
  const originals = Object.fromEntries(
    touchedModels.map(name => [name, Object.fromEntries(['findOne', 'findAll', 'destroy'].map(method => [method, models[name][method]]))])
  );
  const originalTransaction = sequelize.transaction;
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  const timestamp = new Date('2026-01-01T00:00:00Z');
  let batch;

  beforeEach(() => {
    batch = {
      id: 'batch-a', school_id: 'school-a', branch_id: 'branch-a', status: 'completed',
      undo_ready: true, successful_rows: 1, update: jest.fn().mockResolvedValue(undefined)
    };
    models.StudentImportBatch.findOne = jest.fn().mockResolvedValue(batch);
    models.StudentImportBatchRow.findAll = jest.fn().mockResolvedValue([{
      student_id: 'student-a', student_parent_id: 'link-a', parent_id: 'parent-a', parent_created: true
    }]);
    models.Student.findAll = jest.fn().mockResolvedValue([{
      id: 'student-a', created_at: timestamp, updated_at: timestamp
    }]);
    models.Student.destroy = jest.fn().mockResolvedValue(1);
    models.StudentParent.findAll = jest.fn()
      .mockResolvedValueOnce([{ id: 'link-a', created_at: timestamp, updated_at: timestamp }])
      .mockResolvedValueOnce([]);
    models.StudentParent.destroy = jest.fn().mockResolvedValue(1);
    models.Parent.findAll = jest.fn().mockResolvedValue([{
      id: 'parent-a', user_id: null, created_at: timestamp, updated_at: timestamp
    }]);
    models.Parent.destroy = jest.fn().mockResolvedValue(1);
    for (const name of touchedModels.slice(5)) models[name].findOne = jest.fn().mockResolvedValue(null);
    sequelize.transaction = jest.fn((options, callback) => callback(transaction));
  });

  afterAll(() => {
    for (const name of touchedModels) {
      for (const method of ['findOne', 'findAll', 'destroy']) {
        models[name][method] = originals[name][method];
      }
    }
    sequelize.transaction = originalTransaction;
  });

  const request = (overrides = {}) => ({
    params: { id: 'batch-a' }, body: {}, query: {}, schoolId: 'school-a',
    user: { id: 'user-a', role: 'branch_admin', school_id: 'school-a', branch_id: 'branch-a' },
    ...overrides
  });
  const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

  it('removes only a complete, unchanged import with no downstream records', async () => {
    const res = response();
    const next = jest.fn();
    await Controller.undoStudentImportBatch(request(), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(models.StudentImportBatch.findOne.mock.calls[0][0].where).toEqual({
      id: 'batch-a', school_id: 'school-a', branch_id: 'branch-a'
    });
    expect(models.StudentParent.destroy).toHaveBeenCalled();
    expect(models.Student.destroy).toHaveBeenCalled();
    expect(models.Parent.destroy).toHaveBeenCalled();
    expect(batch.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'undone' }), { transaction });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: { batch_id: 'batch-a', students_removed: 1, parents_removed: 1, parents_preserved: 0 }
    }));
  });

  it('does not delete anything if an imported student has downstream records', async () => {
    models.ExamResult.findOne = jest.fn().mockResolvedValue({ id: 'result-a' });
    const next = jest.fn();
    await Controller.undoStudentImportBatch(request(), response(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 409 }));
    expect(models.StudentParent.destroy).not.toHaveBeenCalled();
    expect(models.Student.destroy).not.toHaveBeenCalled();
    expect(batch.update).not.toHaveBeenCalled();
  });

  it.each([
    ['GatePass', 'gate passes'],
    ['ParentTeacherMeetingStudent', 'parent-teacher meetings']
  ])('blocks undo when imported students have %s', async (modelName, label) => {
    models[modelName].findOne = jest.fn().mockResolvedValue({ id: `${modelName}-a` });
    const next = jest.fn();

    await Controller.undoStudentImportBatch(request(), response(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 409,
      message: `Undo blocked: imported students have ${label}.`
    }));
    expect(models.StudentParent.destroy).not.toHaveBeenCalled();
    expect(models.Student.destroy).not.toHaveBeenCalled();
    expect(batch.update).not.toHaveBeenCalled();
  });

  it('does not expose another branch batch to a Branch Admin', async () => {
    models.StudentImportBatch.findOne = jest.fn().mockResolvedValue(null);
    const next = jest.fn();
    await Controller.undoStudentImportBatch(request({
      user: { id: 'user-a', role: 'branch_admin', school_id: 'school-a', branch_id: 'branch-a' },
      body: { branch_id: 'branch-b' }
    }), response(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    expect(models.StudentImportBatch.findOne).not.toHaveBeenCalled();
  });
});
