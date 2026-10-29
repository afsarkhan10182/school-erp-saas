/**
 * Shared school/branch scope for controllers (DRY).
 */
const ApiError = require('~/utils/shared/ApiError');

const schoolWhere = (req, extra = {}) => {
  const schoolId = req.schoolId || req.user?.school_id;
  const where = { ...extra };
  if (schoolId) where.school_id = schoolId;
  if (req.user?.role === 'branch_admin' && req.user.branch_id) {
    where.branch_id = req.user.branch_id;
  } else if (req.query?.branch_id || req.body?.branch_id || req.branchId) {
    where.branch_id = req.query?.branch_id || req.body?.branch_id || req.branchId;
  }
  return where;
};

const schoolIdOf = req => req.schoolId || req.user?.school_id || req.query?.school_id || req.body?.school_id || null;

const branchIdOf = req =>
  req.branchId || req.body?.branch_id || req.query?.branch_id || req.user?.branch_id || null;

const resolveSchoolBranchScope = async (req, options = {}) => {
  const {
    branchRequired = false,
    allowSchoolWide = !branchRequired,
    lockAssignedBranch = false
  } = options;
  const schoolId = schoolIdOf(req);
  if (!schoolId) throw new ApiError(400, 'school_id is required');

  const userBranchId = req.user?.branch_id;
  const requestedBranchId = req.body?.branch_id || req.query?.branch_id || req.params?.branch_id || req.branchId;
  const branchId = req.user?.role === 'branch_admin' || (lockAssignedBranch && userBranchId)
    ? userBranchId
    : requestedBranchId || userBranchId || null;

  const Branch = require('~/models/administration/branch.model');

  if (branchId) {
    const branch = await Branch.findOne({
      where: { id: branchId, school_id: schoolId, status: 'active' }
    });
    if (!branch) throw new ApiError(400, 'Invalid branch for this school');
    return { school_id: schoolId, branch_id: branch.id, branch };
  }

  if (allowSchoolWide) return { school_id: schoolId, branch_id: null, branch: null };

  const branches = await Branch.findAll({
    where: { school_id: schoolId, status: 'active' },
    order: [
      ['is_main_branch', 'DESC'],
      ['created_at', 'ASC']
    ],
    limit: 2
  });

  if (branches.length === 1 || branches[0]?.is_main_branch) {
    return { school_id: schoolId, branch_id: branches[0].id, branch: branches[0] };
  }

  throw new ApiError(400, 'branch_id is required');
};

module.exports = { schoolWhere, schoolIdOf, branchIdOf, resolveSchoolBranchScope };
