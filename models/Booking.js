/**
 * Booking Model
 * 
 * Defines the Booking schema for therapy session appointments
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const Therapist = require('./Therapist');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
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
  sessionDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  sessionTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 60, // Duration in minutes
    validate: {
      min: 30,
      max: 180
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no-show'),
    defaultValue: 'pending',
    allowNull: false
  },
  sessionType: {
    type: DataTypes.ENUM('in-person', 'video', 'phone'),
    allowNull: false,
    defaultValue: 'video'
  },
  meetingLink: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cancellationReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelledBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'refunded', 'failed'),
    defaultValue: 'pending',
    allowNull: false
  },
  paymentId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reminderSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'bookings',
  timestamps: true,
  indexes: [
    {
      fields: ['patientId']
    },
    {
      fields: ['therapistId']
    },
    {
      fields: ['sessionDate', 'sessionTime']
    },
    {
      fields: ['status']
    }
  ]
});

// Define associations
Booking.belongsTo(User, { foreignKey: 'patientId', as: 'patient' });
Booking.belongsTo(Therapist, { foreignKey: 'therapistId', as: 'therapist' });
Booking.belongsTo(User, { foreignKey: 'cancelledBy', as: 'canceller' });

User.hasMany(Booking, { foreignKey: 'patientId', as: 'bookings' });
Therapist.hasMany(Booking, { foreignKey: 'therapistId', as: 'bookings' });

module.exports = Booking;

