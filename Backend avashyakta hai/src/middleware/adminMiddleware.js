const protect = require("./authMiddleware");

/**
 * Middleware ensuring only Manager / Admin can access the route
 */
const adminOnly = (req, res, next) => {
  protect(req, res, () => {
    const userRole = req.user?.role;
    const userEmail = (req.user?.email || "").toLowerCase();

    if (userRole === "admin" || userEmail === "manager@gmail.com") {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Access Denied: Only Platform Manager / Owner can access this resource",
    });
  });
};

module.exports = adminOnly;
