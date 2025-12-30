/**
 * Validation Middleware
 * 
 * Request validation using express-validator
 */

const { validationResult } = require('express-validator');

/**
 * Check validation results and return errors if any
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  
  next();
};

module.exports = validate;

