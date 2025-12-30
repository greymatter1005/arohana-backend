/**
 * Email Service
 * 
 * Handles all email notifications using Nodemailer
 */

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

/**
 * Create email transporter
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

/**
 * Send email
 * @param {Object} mailOptions - Email options
 * @returns {Promise<void>}
 */
const sendEmail = async (mailOptions) => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send verification email
 * @param {string} email - Recipient email
 * @param {string} firstName - User first name
 * @param {string} token - Verification token
 */
exports.sendVerificationEmail = async (email, firstName, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL || process.env.SERVER_URL}/verify-email/${token}`;
  
  const mailOptions = {
    from: `"Arohana Health" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email - Arohana Health',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Arohana Health</h1>
          </div>
          <div class="content">
            <h2>Welcome, ${firstName}!</h2>
            <p>Thank you for registering with Arohana Health. Please verify your email address to complete your registration.</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">${verificationUrl}</p>
            <p>This link will expire in 7 days.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Arohana Health. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return await sendEmail(mailOptions);
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} firstName - User first name
 * @param {string} resetToken - Password reset token
 */
exports.sendPasswordResetEmail = async (email, firstName, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || process.env.SERVER_URL}/reset-password/${resetToken}`;
  
  const mailOptions = {
    from: `"Arohana Health" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset Request - Arohana Health',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          .warning { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Arohana Health</h1>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hello ${firstName},</p>
            <p>You have requested to reset your password. Click the button below to reset it:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">${resetUrl}</p>
            <div class="warning">
              <strong>Important:</strong> This link will expire in 1 hour. If you didn't request this, please ignore this email.
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Arohana Health. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return await sendEmail(mailOptions);
};

/**
 * Send booking confirmation email
 * @param {Object} booking - Booking object with relations
 */
exports.sendBookingConfirmation = async (booking) => {
  const sessionDateTime = new Date(`${booking.sessionDate.toISOString().split('T')[0]}T${booking.sessionTime}`);
  const formattedDate = sessionDateTime.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = sessionDateTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  // Send to patient
  const patientMailOptions = {
    from: `"Arohana Health" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: booking.patient.email,
    subject: 'Booking Confirmation - Arohana Health',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Confirmed</h1>
          </div>
          <div class="content">
            <h2>Hello ${booking.patient.firstName},</h2>
            <p>Your therapy session has been confirmed!</p>
            <div class="info-box">
              <h3>Session Details</h3>
              <p><strong>Therapist:</strong> ${booking.therapist.user.firstName} ${booking.therapist.user.lastName}</p>
              <p><strong>Date:</strong> ${formattedDate}</p>
              <p><strong>Time:</strong> ${formattedTime}</p>
              <p><strong>Duration:</strong> ${booking.duration} minutes</p>
              <p><strong>Type:</strong> ${booking.sessionType}</p>
              ${booking.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${booking.meetingLink}">${booking.meetingLink}</a></p>` : ''}
            </div>
            <p>We look forward to seeing you!</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Arohana Health. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  // Send to therapist
  const therapistMailOptions = {
    from: `"Arohana Health" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: booking.therapist.user.email,
    subject: 'New Booking - Arohana Health',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Booking</h1>
          </div>
          <div class="content">
            <h2>Hello ${booking.therapist.user.firstName},</h2>
            <p>You have a new booking!</p>
            <div class="info-box">
              <h3>Session Details</h3>
              <p><strong>Patient:</strong> ${booking.patient.firstName} ${booking.patient.lastName}</p>
              <p><strong>Date:</strong> ${formattedDate}</p>
              <p><strong>Time:</strong> ${formattedTime}</p>
              <p><strong>Duration:</strong> ${booking.duration} minutes</p>
              <p><strong>Type:</strong> ${booking.sessionType}</p>
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Arohana Health. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  await Promise.all([
    sendEmail(patientMailOptions),
    sendEmail(therapistMailOptions)
  ]);
};

/**
 * Send booking status update email
 * @param {Object} booking - Booking object with relations
 */
exports.sendBookingStatusUpdate = async (booking) => {
  const sessionDateTime = new Date(`${booking.sessionDate.toISOString().split('T')[0]}T${booking.sessionTime}`);
  const formattedDate = sessionDateTime.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = sessionDateTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const statusMessages = {
    confirmed: 'Your booking has been confirmed!',
    cancelled: 'Your booking has been cancelled.',
    completed: 'Your session has been completed.',
    'no-show': 'This session was marked as no-show.'
  };

  const mailOptions = {
    from: `"Arohana Health" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: booking.patient.email,
    subject: `Booking ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)} - Arohana Health`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Update</h1>
          </div>
          <div class="content">
            <h2>Hello ${booking.patient.firstName},</h2>
            <p>${statusMessages[booking.status] || 'Your booking status has been updated.'}</p>
            <div class="info-box">
              <h3>Session Details</h3>
              <p><strong>Therapist:</strong> ${booking.therapist.user.firstName} ${booking.therapist.user.lastName}</p>
              <p><strong>Date:</strong> ${formattedDate}</p>
              <p><strong>Time:</strong> ${formattedTime}</p>
              <p><strong>Status:</strong> ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</p>
              ${booking.cancellationReason ? `<p><strong>Reason:</strong> ${booking.cancellationReason}</p>` : ''}
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Arohana Health. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return await sendEmail(mailOptions);
};

/**
 * Send booking cancellation email
 * @param {Object} booking - Booking object with relations
 */
exports.sendBookingCancellation = async (booking) => {
  return await exports.sendBookingStatusUpdate(booking);
};

/**
 * Send session reminder email
 * @param {Object} booking - Booking object with relations
 */
exports.sendSessionReminder = async (booking) => {
  const sessionDateTime = new Date(`${booking.sessionDate.toISOString().split('T')[0]}T${booking.sessionTime}`);
  const formattedDate = sessionDateTime.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = sessionDateTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const mailOptions = {
    from: `"Arohana Health" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: booking.patient.email,
    subject: 'Session Reminder - Arohana Health',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Session Reminder</h1>
          </div>
          <div class="content">
            <h2>Hello ${booking.patient.firstName},</h2>
            <p>This is a reminder that you have a therapy session scheduled.</p>
            <div class="info-box">
              <h3>Session Details</h3>
              <p><strong>Therapist:</strong> ${booking.therapist.user.firstName} ${booking.therapist.user.lastName}</p>
              <p><strong>Date:</strong> ${formattedDate}</p>
              <p><strong>Time:</strong> ${formattedTime}</p>
              <p><strong>Duration:</strong> ${booking.duration} minutes</p>
              <p><strong>Type:</strong> ${booking.sessionType}</p>
              ${booking.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${booking.meetingLink}">${booking.meetingLink}</a></p>` : ''}
            </div>
            <p>We look forward to seeing you!</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Arohana Health. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return await sendEmail(mailOptions);
};

