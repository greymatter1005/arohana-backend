/**
 * Booking Routes
 * 
 * Booking-related endpoints
 */

const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const bookingController = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validation');

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking
 * @access  Private (Patient)
 */
router.post(
  '/',
  authenticate,
  authorize('patient', 'admin'),
  [
    body('therapistId').isUUID(),
    body('sessionDate').isISO8601().toDate(),
    body('sessionTime').matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
    body('duration').optional().isInt({ min: 30, max: 180 }),
    body('sessionType').optional().isIn(['in-person', 'video', 'phone']),
    body('notes').optional().isString().isLength({ max: 1000 })
  ],
  validate,
  bookingController.createBooking
);

/**
 * @route   GET /api/bookings
 * @desc    Get user's bookings
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  [
    query('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'completed', 'no-show']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validate,
  bookingController.getMyBookings
);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get booking by ID
 * @access  Private
 */
router.get('/:id', authenticate, bookingController.getBookingById);

/**
 * @route   PUT /api/bookings/:id
 * @desc    Update booking
 * @access  Private
 */
router.put(
  '/:id',
  authenticate,
  [
    body('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'completed', 'no-show']),
    body('notes').optional().isString().isLength({ max: 1000 }),
    body('meetingLink').optional().isURL(),
    body('cancellationReason').optional().isString().isLength({ max: 500 })
  ],
  validate,
  bookingController.updateBooking
);

/**
 * @route   DELETE /api/bookings/:id
 * @desc    Cancel booking
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  [
    body('cancellationReason').optional().isString().isLength({ max: 500 })
  ],
  validate,
  bookingController.cancelBooking
);

module.exports = router;

