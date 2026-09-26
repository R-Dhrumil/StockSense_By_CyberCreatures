import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../config/roles.js';

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required before permission check'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access denied. Role '${req.user.role}' is not authorized to access this resource. Required role(s): [${allowedRoles.join(', ')}]`
        )
      );
    }

    next();
  };
};

export const scopeData = (resourceName) => {
  return (req, res, next) => {
    if (!req.user) return next();

    let filter = {};

    switch (req.user.role) {
      case ROLES.ADMIN:
      case ROLES.INVENTORY_MANAGER:
        filter = {};
        break;
      case ROLES.STAFF:
      default:
        filter = { assignedTo: req.user.id };
        break;
    }

    req.dbFilter = filter;
    next();
  };
};
