require('module-alias/register');

const User = require('../src/models/core/user.model');
const Branch = require('../src/models/administration/branch.model');
const UserService = require('../src/services/core/users/user.service');
const BaseService = require('../src/services/shared/base.service');

describe('users-by-branch scope', () => {
  beforeEach(() => {
    jest.spyOn(BaseService, 'getFromCache').mockImplementation((_key, load) => load());
    jest.spyOn(User, 'findAndCountAll').mockResolvedValue({ count: 0, rows: [] });
    jest.spyOn(Branch, 'findOne').mockResolvedValue({ id: 'branch-2' });
  });

  afterEach(() => jest.restoreAllMocks());

  it('allows a Branch Admin to list users in their assigned branch', async () => {
    await UserService.getUsersByBranch('branch-2', { role: 'teacher' }, {
      role: 'branch_admin', school_id: 'school-1', branch_id: 'branch-2'
    });

    expect(User.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ branch_id: 'branch-2', role: 'teacher' })
    }));
  });

  it('rejects a Branch Admin trying to list another branch', async () => {
    await expect(UserService.getUsersByBranch('branch-1', {}, {
      role: 'branch_admin', school_id: 'school-1', branch_id: 'branch-2'
    })).rejects.toMatchObject({ statusCode: 403 });

    expect(User.findAndCountAll).not.toHaveBeenCalled();
  });

  it('rejects a School Admin branch outside their school', async () => {
    Branch.findOne.mockResolvedValue(null);

    await expect(UserService.getUsersByBranch('branch-foreign', {}, {
      role: 'admin', school_id: 'school-1'
    })).rejects.toMatchObject({ statusCode: 403 });

    expect(User.findAndCountAll).not.toHaveBeenCalled();
  });
});
