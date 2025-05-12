# Database Connectivity Guide

## Quick Database Check

We've created a utility script to help diagnose database connection issues and verify table structures.

### Running the check-tables.js script

1. Make sure your `.env` file is properly configured with your PostgreSQL settings:
   ```
   DB_HOST=localhost
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=postgres
   DB_PORT=5500
   ```

2. Run the script:
   ```bash
   node check-tables.js
   ```

3. The script will:
   - Verify the connection to your PostgreSQL database
   - List all tables in the database
   - Check for the required tables:
     - user_login
     - user_profile
     - admin_whitelist
     - temp_admin_registration
   - Show the structure of each existing table
   - Show sample data from each table (up to 3 rows)

4. If connection fails, the script will provide helpful diagnostics based on the error.

### Required Tables

If your tables don't exist, you'll need to create them. Here's a quick SQL script to create the required tables:

```sql
-- Create user_login table
CREATE TABLE IF NOT EXISTS user_login (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);

-- Create user_profile table
CREATE TABLE IF NOT EXISTS user_profile (
    profile_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES user_login(user_id),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    bio TEXT,
    profile_picture VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create admin_whitelist table
CREATE TABLE IF NOT EXISTS admin_whitelist (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    added_by VARCHAR(50),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create temp_admin_registration table
CREATE TABLE IF NOT EXISTS temp_admin_registration (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

You can run this SQL script directly in pgAdmin or using any PostgreSQL client.

## Troubleshooting Common Issues

1. **Connection Refused**
   - Ensure PostgreSQL is running on the specified host and port
   - Check if any firewall is blocking the connection
   - If using Docker, make sure the container is running

2. **Authentication Failed**
   - Verify the DB_PASSWORD in your .env file is correct
   - Make sure the DB_USER exists and has permissions to access the database

3. **Database Does Not Exist**
   - Create the database if it doesn't exist: 
     ```sql
     CREATE DATABASE your_database_name;
     ```

4. **Table Structure Issues**
   - If tables exist but with wrong structure, use ALTER TABLE commands to modify them
   - If you prefer to start fresh, you can drop and recreate the tables