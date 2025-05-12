-- Create user_login table
CREATE TABLE IF NOT EXISTS user_login (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    uses_2fa BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);

-- Create user_profile table
CREATE TABLE IF NOT EXISTS user_profile (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(50),
    surname VARCHAR(50),
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

-- Add a test user (username: testuser, password: Password123!)
-- Password hash is for 'Password123!' using bcrypt with 10 rounds
INSERT INTO user_login (username, password_hash, email, role)
VALUES 
    ('testuser', '$2b$10$j6fwg5O1bQHYTIHDIKPgSeLUZnZj5eG6EtbcMLWq5MxBcAw.mN0gm', 'test@example.com', 'user')
ON CONFLICT (username) DO NOTHING;

-- Add a test admin to whitelist
INSERT INTO admin_whitelist (email, added_by)
VALUES 
    ('admin@example.com', 'system')
ON CONFLICT (email) DO NOTHING;