# Arohana Mental Health Booking System - Backend

Production-ready Node.js/Express backend for the Arohana mental health booking system (arohanahealth.com).

## Features

- 🔐 **JWT Authentication** - Secure user authentication and authorization
- 👥 **User Management** - Patient and therapist user roles
- 🏥 **Therapist Profiles** - Therapist profiles with specialization and availability
- 📅 **Booking System** - Complete booking management with status tracking
- 💬 **Session Management** - Therapy session notes, feedback, and ratings
- 📧 **Email Notifications** - Automated emails for bookings, reminders, and updates
- ⏰ **Scheduled Tasks** - Automated reminders and cleanup jobs
- 🛡️ **Security** - Rate limiting, CORS, helmet security headers
- 📊 **Logging** - Winston-based logging system
- ✅ **Validation** - Request validation using express-validator
- 🗄️ **PostgreSQL** - Robust database with Sequelize ORM

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT (jsonwebtoken)
- **Email**: Nodemailer
- **Scheduling**: node-cron
- **Logging**: Winston
- **Validation**: express-validator

## Project Structure

```
arohana-backend/
├── config/
│   └── database.js          # PostgreSQL connection configuration
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── therapistController.js # Therapist operations
│   ├── bookingController.js  # Booking operations
│   └── sessionController.js   # Session operations
├── middleware/
│   ├── auth.js               # JWT authentication middleware
│   ├── validation.js         # Request validation middleware
│   ├── errorHandler.js       # Global error handler
│   └── notFound.js           # 404 handler
├── models/
│   ├── User.js               # User model
│   ├── Therapist.js          # Therapist model
│   ├── Booking.js            # Booking model
│   └── Session.js            # Session model
├── routes/
│   ├── auth.js               # Authentication routes
│   ├── therapists.js         # Therapist routes
│   ├── bookings.js           # Booking routes
│   └── sessions.js           # Session routes
├── services/
│   ├── emailService.js       # Email notification service
│   └── schedulerService.js   # Scheduled tasks service
├── utils/
│   └── logger.js             # Winston logger configuration
├── logs/                     # Log files directory
├── server.js                 # Main application entry point
├── package.json              # Dependencies and scripts
└── .env.example              # Environment variables template
```

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- PostgreSQL (v12 or higher)
- SMTP email account (Gmail, SendGrid, etc.)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd arohana-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and fill in your configuration:
   ```env
   NODE_ENV=development
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=arohana_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   JWT_SECRET=your_super_secret_jwt_key
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   # ... other variables
   ```

4. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb arohana_db
   
   # Or using psql
   psql -U postgres
   CREATE DATABASE arohana_db;
   ```

5. **Run database migrations** (if using Sequelize CLI)
   ```bash
   npm run migrate
   ```

6. **Start the server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/verify-email/:token` - Verify email

### Therapists
- `GET /api/therapists` - Get all therapists (with filtering)
- `GET /api/therapists/:id` - Get therapist by ID
- `GET /api/therapists/:id/availability` - Get therapist availability
- `GET /api/therapists/:id/reviews` - Get therapist reviews
- `PUT /api/therapists/profile` - Update therapist profile (therapist only)

### Bookings
- `POST /api/bookings` - Create a new booking (patient only)
- `GET /api/bookings` - Get user's bookings
- `GET /api/bookings/:id` - Get booking by ID
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### Sessions
- `POST /api/sessions` - Create session from booking (therapist only)
- `GET /api/sessions` - Get user's sessions
- `GET /api/sessions/:id` - Get session by ID
- `PUT /api/sessions/:id` - Update session (therapist only)
- `PATCH /api/sessions/:id/complete` - Complete session (therapist only)
- `POST /api/sessions/:id/feedback` - Add patient feedback (patient only)

### Health Check
- `GET /health` - Server health check

## Environment Variables

See `.env.example` for all available environment variables. Key variables:

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port
- `DB_*` - Database configuration
- `JWT_SECRET` - JWT signing secret
- `EMAIL_*` - Email service configuration
- `FRONTEND_URL` - Frontend URL for CORS and email links

## Database Models

### User
- Patient, therapist, or admin users
- Email, password, profile information
- Role-based access control

### Therapist
- Therapist profile linked to User
- Specialization, availability, rates
- Ratings and reviews

### Booking
- Therapy session appointments
- Status tracking (pending, confirmed, cancelled, completed, no-show)
- Payment information

### Session
- Completed therapy sessions
- Therapist and patient notes
- Treatment plans and goals
- Patient feedback and ratings

## Scheduled Tasks

The scheduler service runs automated tasks:

- **Session Reminders** (9 AM daily) - Sends email reminders for next-day sessions
- **Token Cleanup** (Midnight daily) - Removes expired password reset tokens
- **No-Show Marking** (11 PM daily) - Marks missed bookings as no-show

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS protection
- Helmet security headers
- Input validation and sanitization
- SQL injection protection (Sequelize ORM)

## Logging

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- `logs/exceptions.log` - Uncaught exceptions
- `logs/rejections.log` - Unhandled promise rejections

## Error Handling

The application includes comprehensive error handling:
- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Server errors (500)

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name arohana-backend
   ```
3. Set up reverse proxy (nginx)
4. Configure SSL certificates
5. Set up database backups
6. Configure monitoring and logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC

## Support

For support, email support@arohanahealth.com or visit [arohanahealth.com](https://arohanahealth.com)

---

Built with ❤️ for Arohana Health

