/**
 * Not Found Middleware
 * 
 * Handles 404 errors for undefined routes
 */

/**
 * 404 handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
};

module.exports = notFound;

