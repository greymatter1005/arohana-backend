/**
 * Session Controller
 * 
 * Handles session-related operations:
 * - Create session from booking
 * - Get sessions
 * - Update session notes
 * - Complete session
 * - Add patient feedback
 */

const { Op } = require('sequelize');
const Session = require('../models/Session');
const Booking = require('../models/Booking');
const Therapist = require('../models/Therapist');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Create session from completed booking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createSession = async (req, res, next) => {
  try {
    const { bookingId, startTime, therapistNotes, treatmentPlan, goals } = req.body;

    // Verify booking exists and is confirmed
    const booking = await Booking.findByPk(bookingId, {
      include: [
        {
          model: Therapist,
          as: 'therapist'
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization (only therapist can create session)
    const therapist = await Therapist.findOne({ where: { userId: req.user.id } });
    if (!therapist || booking.therapistId !== therapist.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned therapist can create a session'
      });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Booking must be confirmed to create a session'
      });
    }

    // Check if session already exists
    const existingSession = await Session.findOne({ where: { bookingId } });
    if (existingSession) {
      return res.status(400).json({
        success: false,
        message: 'Session already exists for this booking'
      });
    }

    // Create session
    const session = await Session.create({
      bookingId,
      patientId: booking.patientId,
      therapistId: booking.therapistId,
      startTime: startTime || new Date(),
      therapistNotes,
      treatmentPlan,
      goals: goals || []
    });

    // Update booking status
    booking.status = 'completed';
    await booking.save();

    // Load session with relations
    const sessionWithDetails = await Session.findByPk(session.id, {
      include: [
        {
          model: Booking,
          as: 'booking'
        },
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

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: { session: sessionWithDetails }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's sessions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getMySessions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, isCompleted } = req.query;
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
          data: { sessions: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }
        });
      }
    }

    // Filter by completion status
    if (isCompleted !== undefined) {
      where.isCompleted = isCompleted === 'true';
    }

    const { count, rows } = await Session.findAndCountAll({
      where,
      include: [
        {
          model: Booking,
          as: 'booking',
          attributes: ['id', 'sessionDate', 'sessionTime', 'sessionType', 'status']
        },
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
      ],
      limit: parseInt(limit),
      offset,
      order: [['startTime', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        sessions: rows,
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
 * Get session by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const session = await Session.findByPk(id, {
      include: [
        {
          model: Booking,
          as: 'booking'
        },
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

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check authorization
    const therapist = await Therapist.findOne({ where: { userId: req.user.id } });
    if (req.user.role !== 'admin' && 
        session.patientId !== req.user.id && 
        (!therapist || session.therapistId !== therapist.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this session'
      });
    }

    res.json({
      success: true,
      data: { session }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update session (therapist notes, treatment plan, etc.)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { therapistNotes, treatmentPlan, goals, moodRating, nextSessionDate } = req.body;

    const session = await Session.findByPk(id, {
      include: [{
        model: Therapist,
        as: 'therapist'
      }]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check authorization (only therapist can update)
    const therapist = await Therapist.findOne({ where: { userId: req.user.id } });
    if (!therapist || session.therapistId !== therapist.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned therapist can update session notes'
      });
    }

    // Update allowed fields
    const allowedUpdates = {
      therapistNotes,
      treatmentPlan,
      goals,
      moodRating,
      nextSessionDate
    };

    // Remove undefined fields
    Object.keys(allowedUpdates).forEach(key => 
      allowedUpdates[key] === undefined && delete allowedUpdates[key]
    );

    await session.update(allowedUpdates);

    const updatedSession = await Session.findByPk(id, {
      include: [
        {
          model: Booking,
          as: 'booking'
        },
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
      message: 'Session updated successfully',
      data: { session: updatedSession }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.completeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { endTime } = req.body;

    const session = await Session.findByPk(id, {
      include: [{
        model: Therapist,
        as: 'therapist'
      }]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check authorization (only therapist can complete)
    const therapist = await Therapist.findOne({ where: { userId: req.user.id } });
    if (!therapist || session.therapistId !== therapist.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned therapist can complete a session'
      });
    }

    if (session.isCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Session is already completed'
      });
    }

    // Calculate actual duration
    const end = endTime ? new Date(endTime) : new Date();
    const start = new Date(session.startTime);
    const actualDuration = Math.round((end - start) / 60000); // Convert to minutes

    // Complete session
    session.endTime = end;
    session.actualDuration = actualDuration;
    session.isCompleted = true;
    await session.save();

    const completedSession = await Session.findByPk(id, {
      include: [
        {
          model: Booking,
          as: 'booking'
        },
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
      message: 'Session completed successfully',
      data: { session: completedSession }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add patient feedback and rating
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.addPatientFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { patientRating, patientFeedback, patientNotes } = req.body;

    if (!patientRating || patientRating < 1 || patientRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Patient rating is required and must be between 1 and 5'
      });
    }

    const session = await Session.findByPk(id, {
      include: [{
        model: Therapist,
        as: 'therapist'
      }]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check authorization (only patient can add feedback)
    if (session.patientId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the patient can add feedback'
      });
    }

    if (!session.isCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Session must be completed before adding feedback'
      });
    }

    // Update session with feedback
    session.patientRating = patientRating;
    session.patientFeedback = patientFeedback;
    if (patientNotes) {
      session.patientNotes = patientNotes;
    }
    await session.save();

    // Update therapist rating
    const therapist = await Therapist.findByPk(session.therapistId);
    const allSessions = await Session.findAll({
      where: {
        therapistId: therapist.id,
        patientRating: { [Op.not]: null }
      }
    });

    const totalRating = allSessions.reduce((sum, s) => sum + s.patientRating, 0);
    therapist.rating = totalRating / allSessions.length;
    therapist.totalReviews = allSessions.length;
    await therapist.save();

    const updatedSession = await Session.findByPk(id, {
      include: [
        {
          model: Booking,
          as: 'booking'
        },
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
      message: 'Feedback added successfully',
      data: { session: updatedSession }
    });
  } catch (error) {
    next(error);
  }
};

