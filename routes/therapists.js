/**
 * Therapist Routes
 * 
 * Therapist-related endpoints
 */

const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const therapistController = require('../controllers/therapistController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validation');

/**
 * @route   GET /api/therapists
 * @desc    Get all therapists with filtering
 * @access  Public
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('specialization').optional().isString(),
    query('minRating').optional().isFloat({ min: 0, max: 5 }),
    query('maxRate').optional().isFloat({ min: 0 }),
    query('search').optional().isString()
  ],
  validate,
  optionalAuth,
  therapistController.getTherapists
);

/**
 * @route   GET /api/therapists/:id
 * @desc    Get therapist by ID
 * @access  Public
 */
router.get('/:id', therapistController.getTherapistById);

/**
 * @route   GET /api/therapists/:id/availability
 * @desc    Get therapist availability for a date
 * @access  Public
 */
router.get(
  '/:id/availability',
  [
    query('date').isISO8601().toDate()
  ],
  validate,
  therapistController.getTherapistAvailability
);

/**
 * @route   GET /api/therapists/:id/reviews
 * @desc    Get therapist reviews
 * @access  Public
 */
router.get(
  '/:id/reviews',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validate,
  therapistController.getTherapistReviews
);

/**
 * @route   PUT /api/therapists/profile
 * @desc    Update therapist profile
 * @access  Private (Therapist only)
 */
router.put(
  '/profile',
  authenticate,
  authorize('therapist'),
  [
    body('specialization').optional().isArray(),
    body('bio').optional().isString().isLength({ max: 2000 }),
    body('yearsOfExperience').optional().isInt({ min: 0 }),
    body('hourlyRate').optional().isFloat({ min: 0 }),
    body('availability').optional().isObject(),
    body('profileImage').optional().isURL()
  ],
  validate,
  therapistController.updateTherapistProfile
);

module.exports = router;

