# Secure Wellbeing Blog

A secure, privacy-focused platform with role-based access (users, admins, super-admins).

## 🔍 Database Troubleshooting

If you're experiencing database connectivity issues, we've created diagnostic tools to help:

1. Check database connection and tables:
   ```bash
   npm run check-db
   ```

2. See detailed troubleshooting guides:
   ```
   DATABASE.md         # Database setup and configuration guide
   README-DB-TEST.md   # Step-by-step testing instructions
   ```

3. Test direct database operations:
   ```bash
   node test-db-write.js
   ```

## Features

- Secure user authentication with role-based access control
- Two-factor authentication (2FA) for admin users
- Email verification for account security
- PostgreSQL database for secure data storage
- NIST-style password validation
- Protection against common security vulnerabilities

## Technology Stack

- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Security**: bcrypt for password hashing with pepper, email-based 2FA
- **Email**: Nodemailer with Gmail SMTP

## Setup Instructions

### Prerequisites

- Node.js (v20+)
- PostgreSQL (v13+)
- Gmail account for sending emails (with App Password if 2FA is enabled)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/22kongi/DSS-SDP-Chris.git
   cd DSS-SDP-Chris
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Configure environment variables
   - Create a `.env` file in the root directory based on the following template:
   ```
   PEPPER=your_secret_pepper_string
   EMAIL_USER=your_gmail_address@gmail.com
   EMAIL_PASS=your_gmail_app_password

   # PostgreSQL Configuration
   DB_HOST=localhost
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   DB_NAME=postgres
   DB_PORT=5500

   # Session Configuration
   SESSION_SECRET=your_session_secret
   ```

   > **IMPORTANT**: The PostgreSQL port has changed to 5500, and we now use the default 'postgres' database.

4. Set up PostgreSQL database and email delivery
   ```
   # Check database connection first
   npm run check-db

   # Create required tables
   psql -U postgres -d postgres -p 5500 -f create-tables.sql

   # Or if using a different client, run the SQL from create-tables.sql
   ```

   Alternatively, you can run the setup script:
   ```
   npm run setup
   ```
   This interactive script will:
   - Create the PostgreSQL database
   - Run migrations to create tables
   - Add an initial admin to the whitelist
   - Test email delivery

### Running the Application

1. Create a test admin user (for easy login)
   ```
   node simple-login-fix.js
   ```
   This creates an admin account with:
   - Username: admin
   - Password: Admin123!

2. Start the server
   ```
   npm start
   ```
   Or for development with automatic restart:
   ```
   npm run dev
   ```

3. Access the application at http://localhost:8000

   Important URLs:
   - Home page: http://localhost:8000/
   - Login page: http://localhost:8000/itslogin.html
   - Register page: http://localhost:8000/register.html

## Authentication Flow

1. **Regular Users**:
   - Register with email, username, and password
   - Login with username and password

2. **Admin Users**:
   - Email must be whitelisted before registration
   - 2FA required during registration
   - Email verification code sent for 2FA
   - Account only created after successful 2FA verification

## Database Schema

- **user_login**: Authentication data (username, email, hashed_pw, role, uses_2fa)
- **user_profile**: User information (username, first/last name, created_at)
- **admin_whitelist**: Pre-approved admin emails (email, approved_by)
- **temp_admin_registration**: Temporary storage for admin registrations during 2FA verification

## Security Features

- PEPPERED password hashing (bcrypt + .env secret)
- Common password blacklist enforcement
- Email + username availability checks
- Regex-based email validation
- Role-based redirect logic
- Admin-only access to sensitive areas
- Two-Factor Authentication (2FA) for admins
- Temporary data storage until 2FA verification is complete

## License

ISC
