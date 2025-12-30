/**
 * Scheduler Service
 * 
 * Handles scheduled tasks using node-cron:
 * - Send session reminders
 * - Clean up expired tokens
 * - Generate reports
 */

const cron = require('node-cron');
const { Op } = require('sequelize');
const Booking = require('../models/Booking');
const User = require('../models/User');
const emailService = require('./emailService');
const logger = require('../utils/logger');

/**
 * Send session reminders for upcoming bookings
 * Runs daily at 9 AM
 */
const sendSessionReminders = async () => {
  try {
    logger.info('Starting session reminder job...');
    
    // Get bookings for tomorrow that haven't been reminded
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfter = new Date(tomorrow);
    dayAfter.setHours(23, 59, 59, 999);

    const bookings = await Booking.findAll({
      where: {
        sessionDate: {
          [Op.between]: [tomorrow, dayAfter]
        },
        status: {
          [Op.in]: ['pending', 'confirmed']
        },
        reminderSent: false
      },
      include: [
        {
          model: require('../models/User'),
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: require('../models/Therapist'),
          as: 'therapist',
          include: [{
            model: require('../models/User'),
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }]
        }
      ]
    });

    logger.info(`Found ${bookings.length} bookings to remind`);

    for (const booking of bookings) {
      try {
        await emailService.sendSessionReminder(booking);
        booking.reminderSent = true;
        await booking.save();
        logger.info(`Reminder sent for booking ${booking.id}`);
      } catch (error) {
        logger.error(`Failed to send reminder for booking ${booking.id}:`, error);
      }
    }

    logger.info('Session reminder job completed');
  } catch (error) {
    logger.error('Error in session reminder job:', error);
  }
};

/**
 * Clean up expired password reset tokens
 * Runs daily at midnight
 */
const cleanupExpiredTokens = async () => {
  try {
    logger.info('Starting token cleanup job...');
    
    const result = await User.update(
      {
        resetPasswordToken: null,
        resetPasswordExpire: null
      },
      {
        where: {
          resetPasswordExpire: {
            [Op.lt]: new Date()
          }
        }
      }
    );

    logger.info(`Cleaned up ${result[0]} expired tokens`);
  } catch (error) {
    logger.error('Error in token cleanup job:', error);
  }
};

/**
 * Mark no-show bookings
 * Runs daily at 11 PM
 */
const markNoShows = async () => {
  try {
    logger.info('Starting no-show marking job...');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    const result = await Booking.update(
      {
        status: 'no-show'
      },
      {
        where: {
          sessionDate: {
            [Op.lt]: yesterday
          },
          status: {
            [Op.in]: ['pending', 'confirmed']
          }
        }
      }
    );

    logger.info(`Marked ${result[0]} bookings as no-show`);
  } catch (error) {
    logger.error('Error in no-show marking job:', error);
  }
};

/**
 * Initialize all scheduled tasks
 */
const initializeScheduler = () => {
  // Send session reminders daily at 9 AM
  cron.schedule('0 9 * * *', sendSessionReminders, {
    scheduled: true,
    timezone: 'America/New_York' // Adjust to your timezone
  });

  // Clean up expired tokens daily at midnight
  cron.schedule('0 0 * * *', cleanupExpiredTokens, {
    scheduled: true,
    timezone: 'America/New_York'
  });

  // Mark no-shows daily at 11 PM
  cron.schedule('0 23 * * *', markNoShows, {
    scheduled: true,
    timezone: 'America/New_York'
  });

  logger.info('Scheduler initialized');
};

/**
 * Note: Scheduler is initialized from server.js
 * This allows better control over when scheduled tasks start
 */

module.exports = {
  sendSessionReminders,
  cleanupExpiredTokens,
  markNoShows,
  initializeScheduler
};

