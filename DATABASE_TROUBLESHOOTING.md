# Database Connection Troubleshooting Guide

## Current Status (January 3, 2026)

**Issue**: Backend failing to connect to PostgreSQL database on Render
**Error**: "password authentication failed" / "Unable to connect to the database"
**Deployment Status**: Multiple failed attempts with database connection errors

## Root Cause Analysis

### Problem
The backend application was written to expect individual environment variables:
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_HOST` - Database host
- `DB_PORT` - Database port

However, **Render provides a single `DATABASE_URL` environment variable** that contains the complete PostgreSQL connection string:
```
postgresql://username:password@host:port/database
```

### Solution Applied

Updated `config/database.js` to support **both** connection methods:

1. **Primary method** (Render): Uses `DATABASE_URL` if available
2. **Fallback method** (Development): Uses individual env variables if `DATABASE_URL` is not set

```javascript
if (process.env.DATABASE_URL) {
  // Use DATABASE_URL if available (Render, Railway, etc)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    // SSL configuration for production
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  });
} else {
  // Fallback to individual environment variables
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    { host, port, dialect: 'postgres' }
  );
}
```

## Next Steps to Complete Fix

### 1. Verify DATABASE_URL Format

The DATABASE_URL should follow this format:
```
postgresql://username:password@host:port/database
```

**Current observed format in Render**:
```
postgresql://arohana_db_user:$0qyVKVLJk9Ey2HojPkC...@
```

This appears correct but password authentication is still failing.

### 2. Check Database User Permissions

The database user (`arohana_db_user`) must have proper permissions:

```sql
-- Connect to Render PostgreSQL as admin/superuser
GRANT ALL PRIVILEGES ON DATABASE arohana_db TO arohana_db_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO arohana_db_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO arohana_db_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO arohana_db_user;
```

### 3. Test Database Connection Manually

On Render Shell tab, test direct connection:

```bash
# Extract connection details from DATABASE_URL
psql "$DATABASE_URL"

# Or test with explicit credentials
psql -h hostname -U username -d database_name -W
```

### 4. Check for SSL Issues

Render PostgreSQL requires SSL. The code now includes:

```javascript
dialectOptions: {
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false  // Accepts self-signed certs
  } : false
}
```

### 5. Verify Environment Variables

In Render dashboard > Environment:
- ✅ `DATABASE_URL` should be set
- ✅ `DB_PASSWORD` can be removed (legacy, not used anymore)
- ✅ Ensure no typos or special characters in credentials

## Alternative Solutions

### Solution 1: Parse DATABASE_URL Manually

If connection still fails, try parsing the URL:

```javascript
const url = require('url');
const dbUrl = new url.URL(process.env.DATABASE_URL);

const sequelize = new Sequelize({
  database: dbUrl.pathname.slice(1),  // Remove leading '/'
  username: dbUrl.username,
  password: dbUrl.password,
  host: dbUrl.hostname,
  port: dbUrl.port,
  dialect: 'postgres'
});
```

### Solution 2: Use Connection Pooling

Add connection pooling configuration:

```javascript
pool: {
  max: 5,  // Reduced for free tier
  min: 0,
  acquire: 30000,
  idle: 10000,
  evict: 10000  // Evict idle connections
}
```

## Error Messages & Solutions

### "password authentication failed"
- **Cause**: Incorrect password or user doesn't exist
- **Fix**: Verify DATABASE_URL in Render dashboard
- **Check**: Test with `psql` command in Render Shell

### "could not connect to server"
- **Cause**: Wrong host or port
- **Fix**: Ensure DATABASE_URL has correct host:port
- **Check**: `ping` the host from Render Shell

### "database does not exist"
- **Cause**: Database name wrong or not created
- **Fix**: Create database with correct name
- **Check**: `\l` in psql to list databases

### "permission denied"
- **Cause**: User lacks required permissions
- **Fix**: Grant permissions to user (see step 2 above)
- **Check**: `\dp` in psql to check permissions

## Debugging Steps

1. **Enable Debug Logging**:
   ```javascript
   // In database.js
   logging: true  // Log all SQL queries
   ```

2. **Test Connection in isolation**:
   ```bash
   # In Render Shell
   node -e "require('./config/database').testConnection()"
   ```

3. **Check Render Logs**:
   - Navigate to Logs tab
   - Search for "database" or "connection"
   - Look for specific error messages

4. **Verify Build Process**:
   - Ensure `npm install` completes successfully
   - Check for dependency conflicts
   - Review build output for warnings

## Testing After Fix

Once database connects successfully:

1. **API Health Check**:
   ```bash
   curl https://api.arohanahealth.com/health
   ```

2. **Test Auth Endpoint**:
   ```bash
   curl -X POST https://api.arohanahealth.com/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'
   ```

3. **Test Therapists Endpoint**:
   ```bash
   curl https://api.arohanahealth.com/api/therapists
   ```

## Summary

✅ **Fixed**: Database configuration to support DATABASE_URL
⏳ **Pending**: Verify database credentials and connectivity
⏳ **Next**: Deploy and test live API endpoints

The code is now ready for production Render deployment. The remaining issue is verifying that the DATABASE_URL credentials are correct and the database is accessible from the backend service.
