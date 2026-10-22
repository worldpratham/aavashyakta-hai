const jwt = require("jsonwebtoken");
const env = require("../config/env");

/**
 * Generate JWT token for an authenticated user
 * @param {Object} user - User document or payload object
 * @returns {string} - Signed JWT token
 */
const generateToken = (user) => {
  const payload = {
    id: user._id || user.id,
    role: user.role,
    email: user.email,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

module.exports = {
  generateToken,
};
