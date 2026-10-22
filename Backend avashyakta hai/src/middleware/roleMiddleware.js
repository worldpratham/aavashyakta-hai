/**
 * Middleware to restrict access based on user role(s)
 * @param  {...string} allowedRoles - e.g. "employer", "worker"
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of roles: [${allowedRoles.join(", ")}]`,
      });
    }

    next();
  };
};

module.exports = {
  authorizeRoles,
};
