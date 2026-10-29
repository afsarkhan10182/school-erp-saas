require('module-alias/register');
jest.mock('~/utils/shared/requestScope', () => ({
  resolveSchoolBranchScope: jest.fn()
}));

const { Exam } = require('../src/models');
const { resolveSchoolBranchScope } = require('../src/utils/shared/requestScope');
const controller = require('../src/controllers/academic/exam-publication/exam-publication.controller');

describe('Exam publication scope and delivery behavior', () => {
  const originals = [Exam.findAll, Exam.findOne, Exam.count, Exam.update];

  const response = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  });

  beforeEach(() => {
    jest.clearAllMocks();
    resolveSchoolBranchScope.mockResolvedValue({ school_id: 'school-a', branch_id: 'branch-a' });
  });

  afterAll(() => {
    [Exam.findAll, Exam.findOne, Exam.count, Exam.update] = originals;
  });

  it('lists only the resolved school and branch, ignoring raw query scope overrides', async () => {
    Exam.findAll = jest.fn().mockResolvedValue([]);
    const req = {
      user: { role: 'branch_admin', school_id: 'school-a', branch_id: 'branch-a' },
      query: { school_id: 'school-b', branch_id: 'branch-b' }
    };

    await controller.getPublicationStatus(req, response());

    expect(resolveSchoolBranchScope).toHaveBeenCalledWith(req, { allowSchoolWide: true });
    expect(Exam.findAll.mock.calls[0][0].where).toMatchObject({
      school_id: 'school-a', branch_id: 'branch-a', is_active: true
    });
  });

  it('requires explicit booleans and never turns an incomplete request into an unpublish', async () => {
    Exam.update = jest.fn();
    const res = response();

    await controller.publishExam({ user: { id: 'admin' }, body: { exam_id: 'exam-a' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(Exam.update).not.toHaveBeenCalled();
  });

  it('updates publication state only within the resolved tenant and clears publish metadata on unpublish', async () => {
    Exam.update = jest.fn().mockResolvedValue([1]);
    const res = response();

    await controller.publishExam({
      user: { id: 'admin' },
      body: { exam_id: 'exam-a', publish_status: false, result_status: false, school_id: 'school-b' }
    }, res);

    expect(Exam.update.mock.calls[0][0]).toMatchObject({
      publish_status: false, result_status: false, published_at: null, published_by: null
    });
    expect(Exam.update.mock.calls[0][1].where).toEqual({
      id: 'exam-a', school_id: 'school-a', branch_id: 'branch-a'
    });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('does not claim exam notifications were sent when no delivery provider exists', async () => {
    Exam.findOne = jest.fn().mockResolvedValue({ publish_status: true });
    const res = response();

    await controller.sendNotifications({ params: { examId: 'exam-a' }, user: {}, body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(501);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Exam-result notification delivery is not configured.'
    }));
  });

  it('returns no fabricated notification history and scopes the exam lookup', async () => {
    Exam.findOne = jest.fn().mockResolvedValue({ id: 'exam-a' });
    const res = response();

    await controller.getNotificationHistory({ params: { examId: 'exam-a' }, user: {}, query: {} }, res);

    expect(Exam.findOne).toHaveBeenCalledWith({
      where: { id: 'exam-a', school_id: 'school-a', branch_id: 'branch-a' }
    });
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
  });

  it('uses the same resolved tenant and branch for publication statistics', async () => {
    Exam.count = jest.fn()
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);
    const res = response();

    await controller.getStats({ user: {}, query: { school_id: 'school-b', branch_id: 'branch-b' } }, res);

    expect(Exam.count.mock.calls.map(([options]) => options.where)).toEqual([
      { school_id: 'school-a', branch_id: 'branch-a', is_active: true },
      { school_id: 'school-a', branch_id: 'branch-a', is_active: true, publish_status: true },
      { school_id: 'school-a', branch_id: 'branch-a', is_active: true, result_status: true }
    ]);
  });
});
