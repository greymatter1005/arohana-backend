/**
 * Booking Controller
 * 
 * Handles booking-related operations:
 * - Create booking
 * - Get bookings
 * - Update booking
 * - Cancel booking
 */

const { Op } = require('sequelize');
const Booking = require('../models/Booking');
const Therapist = require('../models/Therapist');
const User = require('../models/User');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

/**
 * Create a new booking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createBooking = async (req, res, next) => {
  try {
    const {
      therapistId,
      sessionDate,
      sessionTime,
      duration = 60,
      sessionType = 'video',
      notes
    } = req.body;

    // Validate therapist exists
    const therapist = await Therapist.findByPk(therapistId, {
      include: [{
        model: User,
        as: 'user'
      }]
    });

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found'
      });
    }

    if (!therapist.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Therapist is not verified'
      });
    }

    // Check if time slot is available
    const sessionDateTime = new Date(`${sessionDate}T${sessionTime}`);
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][sessionDateTime.getDay()];
    const availability = therapist.availability[dayOfWeek];

    if (!availability || !availability.available) {
      return res.status(400).json({
        success: false,
        message: 'Therapist is not available on this day'
      });
    }

    // Check for conflicting bookings
    const conflictingBooking = await Booking.findOne({
      where: {
        therapistId,
        sessionDate: {
          [Op.between]: [
            new Date(sessionDateTime.setHours(0, 0, 0, 0)),
            new Date(sessionDateTime.setHours(23, 59, 59, 999))
          ]
        },
        sessionTime,
        status: {
          [Op.in]: ['pending', 'confirmed']
        }
      }
    });

    if (conflictingBooking) {
      return res.status(400).json({
        success: false,
        message: 'Time slot is already booked'
      });
    }

    // Calculate total amount
    const totalAmount = (parseFloat(therapist.hourlyRate) * duration) / 60;

    // Create booking
    const booking = await Booking.create({
      patientId: req.user.id,
      therapistId,
      sessionDate: new Date(sessionDate),
      sessionTime,
      duration,
      sessionType,
      notes,
      totalAmount,
      status: 'pending'
    });

    // Load booking with relations
    const bookingWithDetails = await Booking.findByPk(booking.id, {
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: Therapist,
          as: 'therapist',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }]
        }
      ]
    });

    // Send confirmation emails
    try {
      await emailService.sendBookingConfirmation(bookingWithDetails);
    } catch (emailError) {
      logger.error('Failed to send booking confirmation email:', emailError);
      // Don't fail booking creation if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { booking: bookingWithDetails }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's bookings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getMyBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    
    // Filter by user role
    if (req.user.role === 'patient') {
      where.patientId = req.user.id;
    } else if (req.user.role === 'therapist') {
      const therapist = await Therapist.findOne({ where: { userId: req.user.id } });
      if (therapist) {
        where.therapistId = therapist.id;
      } else {
        return res.json({
          success: true,
          data: { bookings: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }
        });
      }
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    const { count, rows } = await Booking.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        },
        {
          model: Therapist,
          as: 'therapist',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
          }]
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['sessionDate', 'DESC'], ['sessionTime', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        bookings: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get booking by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findByPk(id, {
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        },
        {
          model: Therapist,
          as: 'therapist',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
          }]
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization
    const therapist = await Therapist.findOne({ where: { userId: req.user.id } });
    if (req.user.role !== 'admin' && 
        booking.patientId !== req.user.id && 
        (!therapist || booking.therapistId !== therapist.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.json({
      success: true,
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update booking status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes, meetingLink } = req.body;

    const booking = await Booking.findByPk(id, {
      include: [
        {
          model: User,
          as: 'patient'
        },
        {
          model: Therapist,
          as: 'therapist',
          include: [{
            model: User,
            as: 'user'
          }]
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization
    const therapist = await Therapist.findOne({ where: { userId: req.user.id } });
    if (req.user.role !== 'admin' && 
        booking.patientId !== req.user.id && 
        (!therapist || booking.therapistId !== therapist.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    // Update allowed fields
    const allowedUpdates = { notes, meetingLink };
    if (status && ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'].includes(status)) {
      allowedUpdates.status = status;
      
      if (status === 'cancelled') {
        allowedUpdates.cancelledAt = new Date();
        allowedUpdates.cancelledBy = req.user.id;
        if (req.body.cancellationReason) {
          allowedUpdates.cancellationReason = req.body.cancellationReason;
        }
      }
    }

    // Remove undefined fields
    Object.keys(allowedUpdates).forEach(key => 
      allowedUpdates[key] === undefined && delete allowedUpdates[key]
    );

    await booking.update(allowedUpdates);

    // Send notification email if status changed
    if (status && status !== booking.status) {
      try {
        await emailService.sendBookingStatusUpdate(booking);
      } catch (emailError) {
        logger.error('Failed to send booking status update email:', emailError);
      }
    }

    const updatedBooking = await Booking.findByPk(id, {
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: Therapist,
          as: 'therapist',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }]
        }
      ]
    });

    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: { booking: updatedBooking }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel booking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    const booking = await Booking.findByPk(id, {
      include: [
        {
          model: User,
          as: 'patient'
        },
        {
          model: Therapist,
          as: 'therapist',
          include: [{
            model: User,
            as: 'user'
          }]
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization
    const therapist = await Therapist.findOne({ where: { userId: req.user.id } });
    if (req.user.role !== 'admin' && 
        booking.patientId !== req.user.id && 
        (!therapist || booking.therapistId !== therapist.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed booking'
      });
    }

    // Cancel booking
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelledBy = req.user.id;
    if (cancellationReason) {
      booking.cancellationReason = cancellationReason;
    }
    await booking.save();

    // Send cancellation email
    try {
      await emailService.sendBookingCancellation(booking);
    } catch (emailError) {
      logger.error('Failed to send booking cancellation email:', emailError);
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};

