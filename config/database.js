/**
 * Database Configuration
 * 
 * This module handles PostgreSQL database connection using Sequelize ORM.
 * It exports a configured Sequelize instance and connection test function.
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

/**
 * Create Sequelize instance with database credentials from environment variables
 */
const sequelize = new Sequelize(
  process.env.DB_NAME || 'arohana_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10, // Maximum number of connections in pool
      min: 0,  // Minimum number of connections in pool
      acquire: 30000, // Maximum time (ms) to wait for a connection
      idle: 10000 // Maximum time (ms) a connection can be idle
    },
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  }
);

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

