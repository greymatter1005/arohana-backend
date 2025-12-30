/**
 * Models Index
 * 
 * Initializes all models and their associations
 */

const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const Therapist = require('./Therapist');
const Booking = require('./Booking');
const Session = require('./Session');

// Associations are defined in individual model files
// This file ensures all models are loaded and associations are established

module.exports = {
  sequelize,
  User,
  Therapist,
  Booking,
  Session
};

