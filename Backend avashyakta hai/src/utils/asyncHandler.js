/**
 * Wrapper for async route handlers to eliminate repetitive try-catch blocks
 * Automatically forwards errors to Express global error handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
