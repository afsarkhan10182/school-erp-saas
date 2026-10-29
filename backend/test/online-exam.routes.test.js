require('module-alias/register');
const router = require('../src/routes/academic/online-exam.routes');
const { setBranchContext } = require('../src/middleware/core/auth');
const controller = require('../src/controllers/academic/online-exam.controller');
const auditContext = require('../src/utils/shared/auditContext');
const { Branch } = require('../src/models');

const handlers = (path, method) => {
  const layer = router.stack.find(entry => entry.route?.path === path && entry.route.methods[method]);
  return layer?.route.stack.map(entry => entry.handle) || [];
};

describe('online exam branch route context', () => {
  it('exposes parent progress only through the parent progress handler', () => {
    expect(handlers('/parent/progress', 'get').at(-1)).toBe(controller.parentProgress);
  });

  it.each([['/', 'get'], ['/', 'post'], ['/:id', 'get'], ['/:id', 'put'], ['/:id', 'delete'], ['/:id/questions', 'post'], ['/:id/questions/:questionId', 'delete'], ['/:id/results', 'get']])(
    'applies branch context to staff route %s %s',
    (path, method) => {
      expect(handlers(path, method)).toContain(setBranchContext);
    }
  );

  it.each([['/:id/take', 'get'], ['/:id/attempt', 'patch'], ['/:id/submit', 'post']])(
    'applies conditional staff branch context to mixed portal route %s %s',
    (path, method) => {
      expect(handlers(path, method).some(handler => handler.name === 'setStaffBranchContext')).toBe(true);
    }
  );

  it('pins a Teacher to the assigned branch and rejects a branch override', async () => {
    const allowedReq = { user: { role: 'teacher', branch_id: 'main-branch' }, query: {}, params: {}, body: {} };
    const allowedNext = jest.fn();
    await setBranchContext(allowedReq, {}, allowedNext);
    expect(allowedReq.branchId).toBe('main-branch');
    expect(allowedNext).toHaveBeenCalledWith();

    const deniedNext = jest.fn();
    await setBranchContext({
      user: { role: 'teacher', branch_id: 'main-branch' },
      query: { branch_id: 'second-branch' },
      params: {},
      body: {}
    }, {}, deniedNext);
    expect(deniedNext).toHaveBeenCalledWith(expect.objectContaining({ message: 'Not authorized to access this branch context' }));
  });

  it('records the inferred school in audit context for a Super Admin branch-only scope', async () => {
    const findBranch = jest.spyOn(Branch, 'findByPk').mockResolvedValue({ id: 'branch-1', school_id: 'school-1' });
    const req = { user: { id: 'owner-1', role: 'super_admin' }, query: { branch_id: 'branch-1' }, params: {}, body: {} };
    const next = jest.fn();

    try {
      await auditContext.run({ actor_id: 'owner-1', school_id: null, branch_id: null }, async () => {
        await setBranchContext(req, {}, next);
        expect(req.schoolId).toBe('school-1');
        expect(auditContext.get()).toMatchObject({ school_id: 'school-1', branch_id: 'branch-1' });
      });
      expect(next).toHaveBeenCalledWith();
    } finally {
      findBranch.mockRestore();
    }
  });
});
