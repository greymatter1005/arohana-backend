/**
 * Therapist Controller
 * 
 * Handles therapist-related operations:
 * - Get all therapists
 * - Get therapist by ID
 * - Update therapist profile
 * - Get therapist availability
 */

const { Op } = require('sequelize');
const Therapist = require('../models/Therapist');
const User = require('../models/User');
const Booking = require('../models/Booking');
const logger = require('../utils/logger');

/**
 * Get all therapists with filtering and pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getTherapists = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      specialization,
      minRating,
      maxRate,
      search
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = { isVerified: true };

    // Filter by specialization
    if (specialization) {
      where.specialization = {
        [Op.contains]: [specialization]
      };
    }

    // Filter by minimum rating
    if (minRating) {
      where.rating = {
        [Op.gte]: parseFloat(minRating)
      };
    }

    // Filter by maximum rate
    if (maxRate) {
      where.hourlyRate = {
        [Op.lte]: parseFloat(maxRate)
      };
    }

    // Search by name
    const userWhere = {};
    if (search) {
      userWhere[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Therapist.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        where: userWhere,
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
      }],
      attributes: {
        exclude: ['userId']
      },
      limit: parseInt(limit),
      offset,
      order: [['rating', 'DESC'], ['totalReviews', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        therapists: rows,
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
 * Get therapist by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getTherapistById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const therapist = await Therapist.findByPk(id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
      }],
      attributes: {
        exclude: ['userId']
      }
    });

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found'
      });
    }

    res.json({
      success: true,
      data: { therapist }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update therapist profile (therapist only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateTherapistProfile = async (req, res, next) => {
  try {
    const therapist = await Therapist.findOne({
      where: { userId: req.user.id }
    });

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist profile not found'
      });
    }

    const {
      specialization,
      bio,
      yearsOfExperience,
      hourlyRate,
      availability,
      profileImage
    } = req.body;

    const allowedUpdates = {
      specialization,
      bio,
      yearsOfExperience,
      hourlyRate,
      availability,
      profileImage
    };

    // Remove undefined fields
    Object.keys(allowedUpdates).forEach(key => 
      allowedUpdates[key] === undefined && delete allowedUpdates[key]
    );

    await therapist.update(allowedUpdates);

    const updatedTherapist = await Therapist.findByPk(therapist.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
      }]
    });

    res.json({
      success: true,
      message: 'Therapist profile updated successfully',
      data: { therapist: updatedTherapist }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get therapist availability for a specific date
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getTherapistAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required (YYYY-MM-DD)'
      });
    }

    const therapist = await Therapist.findByPk(id);
    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found'
      });
    }

    const requestedDate = new Date(date);
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][requestedDate.getDay()];
    const availability = therapist.availability[dayOfWeek];

    if (!availability || !availability.available) {
      return res.json({
        success: true,
        data: {
          available: false,
          message: 'Therapist is not available on this day'
        }
      });
    }

    // Get existing bookings for this date
    const existingBookings = await Booking.findAll({
      where: {
        therapistId: id,
        sessionDate: {
          [Op.between]: [
            new Date(requestedDate.setHours(0, 0, 0, 0)),
            new Date(requestedDate.setHours(23, 59, 59, 999))
          ]
        },
        status: {
          [Op.in]: ['pending', 'confirmed']
        }
      },
      attributes: ['sessionTime', 'duration']
    });

    // Generate available time slots
    const [startHour, startMinute] = availability.start.split(':').map(Number);
    const [endHour, endMinute] = availability.end.split(':').map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    const slotDuration = 60; // 60 minutes per slot
    const availableSlots = [];

    for (let time = startTime; time + slotDuration <= endTime; time += slotDuration) {
      const hours = Math.floor(time / 60);
      const minutes = time % 60;
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      // Check if slot is already booked
      const isBooked = existingBookings.some(booking => {
        const [bookedHour, bookedMinute] = booking.sessionTime.split(':').map(Number);
        const bookedStart = bookedHour * 60 + bookedMinute;
        const bookedEnd = bookedStart + booking.duration;
        return time < bookedEnd && time + slotDuration > bookedStart;
      });

      if (!isBooked) {
        availableSlots.push(timeString);
      }
    }

    res.json({
      success: true,
      data: {
        available: true,
        date,
        dayOfWeek,
        availableSlots,
        workingHours: {
          start: availability.start,
          end: availability.end
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get therapist reviews/ratings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getTherapistReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const therapist = await Therapist.findByPk(id);
    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found'
      });
    }

    // Get sessions with ratings
    const Session = require('../models/Session');
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Session.findAndCountAll({
      where: {
        therapistId: id,
        patientRating: {
          [Op.not]: null
        }
      },
      include: [{
        model: User,
        as: 'patient',
        attributes: ['id', 'firstName', 'lastName']
      }],
      attributes: ['id', 'patientRating', 'patientFeedback', 'startTime', 'createdAt'],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        therapist: {
          id: therapist.id,
          rating: therapist.rating,
          totalReviews: therapist.totalReviews
        },
        reviews: rows,
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

