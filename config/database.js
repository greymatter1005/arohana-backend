/**
 * Database Configuration
 * 
 * This module handles PostgreSQL database connection using Sequelize ORM.
 * It exports a configured Sequelize instance and connection test function.
 * Supports both DATABASE_URL (Render) and individual env variables
 */
const { Sequelize } = require('sequelize');
require('dotenv').config();

/**
 * Create Sequelize instance with database credentials from environment variables
 * Supports both DATABASE_URL (production) and individual env vars (development)
 */
let sequelize;

if (process.env.DATABASE_URL) {
  // Use DATABASE_URL if available (Render, Railway, etc)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
ssl: { require: true, rejectUnauthorized: false }
  });
} else {
  // Fallback to individual environment variables
  sequelize = new Sequelize(
    process.env.DB_NAME || 'arohana_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      dialectOptions: {
ssl: { require: true, rejectUnauthorized: false }
    }
  );
}

/**
 * Test database connection
 * @returns {Promise<boolean>} True if connection successful
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    return false;
  }
};

/**
 * Sync database models (use with caution in production)
 * @param {boolean} force - Force sync (drops tables if true)
 * @param {boolean} alter - Alter tables to match models
 */
const syncDatabase = async (force = false, alter = false) => {
  try {
    await sequelize.sync({ force, alter });
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
};
