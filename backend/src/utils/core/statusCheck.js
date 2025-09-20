const ApiError = require('../shared/ApiError');

function checkSchoolActive(school) {
  if (!school || school.status !== 'active') {
    throw new ApiError(403, 'School is not active. Please contact support.');
  }
}

function checkBranchActive(branch) {
  if (!branch || branch.status !== 'active') {
    throw new ApiError(403, 'Branch is not active. Please contact support.');
  }
}

module.exports = {
  checkSchoolActive,
  checkBranchActive
};
