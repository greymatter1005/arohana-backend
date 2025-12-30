/**
 * Therapist Model
 * 
 * Defines the Therapist profile schema with specialization and availability
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Therapist = sequelize.define('Therapist', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  licenseNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  specialization: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: []
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  yearsOfExperience: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  hourlyRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  availability: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: '09:00', end: '13:00', available: false },
      sunday: { start: '09:00', end: '13:00', available: false }
    }
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  totalReviews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  profileImage: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'therapists',
  timestamps: true
});

// Define associations
Therapist.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Therapist, { foreignKey: 'userId', as: 'therapist' });

module.exports = Therapist;

