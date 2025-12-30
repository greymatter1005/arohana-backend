/**
 * Session Model
 * 
 * Defines the Session schema for completed therapy sessions with notes and outcomes
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Booking = require('./Booking');
const User = require('./User');
const Therapist = require('./Therapist');

const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  bookingId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: Booking,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  therapistId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Therapist,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actualDuration: {
    type: DataTypes.INTEGER,
    allowNull: true, // Duration in minutes
    validate: {
      min: 0
    }
  },
  therapistNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  patientNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  treatmentPlan: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  goals: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: []
  },
  moodRating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 10
    }
  },
  patientRating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  patientFeedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  nextSessionDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'sessions',
  timestamps: true,
  indexes: [
    {
      fields: ['patientId']
    },
    {
      fields: ['therapistId']
    },
    {
      fields: ['bookingId']
    },
    {
      fields: ['startTime']
    }
  ]
});

// Define associations
Session.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });
Session.belongsTo(User, { foreignKey: 'patientId', as: 'patient' });
Session.belongsTo(Therapist, { foreignKey: 'therapistId', as: 'therapist' });

Booking.hasOne(Session, { foreignKey: 'bookingId', as: 'session' });
User.hasMany(Session, { foreignKey: 'patientId', as: 'sessions' });
Therapist.hasMany(Session, { foreignKey: 'therapistId', as: 'sessions' });

module.exports = Session;

