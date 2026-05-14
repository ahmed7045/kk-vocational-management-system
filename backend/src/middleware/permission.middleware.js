const ApiError = require("../utils/ApiError");

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions) {
      return next(new ApiError(401, "User permissions missing"));
    }

    if (!req.user.permissions.includes(permission)) {
      return next(new ApiError(403, "Access denied. Permission required: " + permission));
    }

    next();
  };
};

module.exports = requirePermission;