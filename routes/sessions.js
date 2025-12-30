/**
 * Session Routes
 * 
 * Session-related endpoints
 */

const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const sessionController = require('../controllers/sessionController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validation');

/**
 * @route   POST /api/sessions
 * @desc    Create session from booking
 * @access  Private (Therapist)
 */
router.post(
  '/',
  authenticate,
  authorize('therapist', 'admin'),
  [
    body('bookingId').isUUID(),
    body('startTime').optional().isISO8601().toDate(),
    body('therapistNotes').optional().isString(),
    body('treatmentPlan').optional().isString(),
    body('goals').optional().isArray()
  ],
  validate,
  sessionController.createSession
);

/**
 * @route   GET /api/sessions
 * @desc    Get user's sessions
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('isCompleted').optional().isBoolean()
  ],
  validate,
  sessionController.getMySessions
);

/**
 * @route   GET /api/sessions/:id
 * @desc    Get session by ID
 * @access  Private
 */
router.get('/:id', authenticate, sessionController.getSessionById);

/**
 * @route   PUT /api/sessions/:id
 * @desc    Update session
 * @access  Private (Therapist)
 */
router.put(
  '/:id',
  authenticate,
  authorize('therapist', 'admin'),
  [
    body('therapistNotes').optional().isString(),
    body('treatmentPlan').optional().isString(),
    body('goals').optional().isArray(),
    body('moodRating').optional().isInt({ min: 1, max: 10 }),
    body('nextSessionDate').optional().isISO8601().toDate()
  ],
  validate,
  sessionController.updateSession
);

/**
 * @route   PATCH /api/sessions/:id/complete
 * @desc    Complete session
 * @access  Private (Therapist)
 */
router.patch(
  '/:id/complete',
  authenticate,
  authorize('therapist', 'admin'),
  [
    body('endTime').optional().isISO8601().toDate()
  ],
  validate,
  sessionController.completeSession
);

/**
 * @route   POST /api/sessions/:id/feedback
 * @desc    Add patient feedback
 * @access  Private (Patient)
 */
router.post(
  '/:id/feedback',
  authenticate,
  authorize('patient', 'admin'),
  [
    body('patientRating').isInt({ min: 1, max: 5 }),
    body('patientFeedback').optional().isString().isLength({ max: 1000 }),
    body('patientNotes').optional().isString().isLength({ max: 1000 })
  ],
  validate,
  sessionController.addPatientFeedback
);

module.exports = router;

