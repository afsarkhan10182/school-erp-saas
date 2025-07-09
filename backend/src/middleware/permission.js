const ApiError = require('../utils/ApiError');

function hasPermission(user, permission) {
  if (!user || !Array.isArray(user.permissions)) return false;
  return user.permissions.includes(permission);
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user || !hasPermission(req.user, permission)) {
      return res.status(403).json({
        success: false,
        message: `You do not have permission: ${permission}`
      });
    }
    next();
  };
}

module.exports = {
  hasPermission,
  requirePermission,
}; 