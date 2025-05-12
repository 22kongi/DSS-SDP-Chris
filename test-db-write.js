const { Pool } = require('pg');
require('dotenv').config();
const bcrypt = require('bcrypt');

// Configure the PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5500,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'postgres',
});

async function testDatabaseWrite() {
  const client = await pool.connect();
  try {
    console.log('🔌 Successfully connected to PostgreSQL database!\n');

    // First check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('user_login', 'user_profile');
    `);

    const existingTables = tablesResult.rows.map(row => row.table_name);
    console.log('📊 Existing tables:', existingTables);

    // If tables don't exist, create them
    if (!existingTables.includes('user_login')) {
      console.log('📝 Creating user_login table...');
      await client.query(`
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
      `);
      console.log('✅ user_login table created!');
    }

    if (!existingTables.includes('user_profile')) {
      console.log('📝 Creating user_profile table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_profile (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          first_name VARCHAR(50),
          surname VARCHAR(50),
          bio TEXT,
          profile_picture VARCHAR(255),
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ user_profile table created!');
    }

    // Generate a test password hash
    const password = 'TestPassword123!';
    const hash = await bcrypt.hash(password, 10);
    
    // Try to insert a test user
    console.log('📝 Attempting to insert test user...');
    try {
      await client.query('BEGIN');
      
      // Insert into user_login
      const userResult = await client.query(`
        INSERT INTO user_login (username, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (username) 
        DO UPDATE SET email = $2, password_hash = $3, role = $4
        RETURNING id, username
      `, ['testuser', 'test@example.com', hash, 'user']);
      
      console.log('✅ User inserted/updated:', userResult.rows[0]);
      
      // Insert into user_profile
      const profileResult = await client.query(`
        INSERT INTO user_profile (username, first_name, surname)
        VALUES ($1, $2, $3)
        ON CONFLICT (username)
        DO UPDATE SET first_name = $2, surname = $3
        RETURNING id, username
      `, ['testuser', 'Test', 'User']);
      
      console.log('✅ Profile inserted/updated:', profileResult.rows[0]);
      
      await client.query('COMMIT');
      console.log('✅ Transaction committed!');
      
      // Fetch the user to verify
      const verifyResult = await client.query(`
        SELECT u.id, u.username, u.email, u.role, p.first_name, p.surname
        FROM user_login u
        JOIN user_profile p ON u.username = p.username
        WHERE u.username = 'testuser'
      `);
      
      console.log('📊 Inserted user data:', verifyResult.rows[0]);
      
      // Verify the password
      const storedHash = await client.query(`
        SELECT password_hash FROM user_login WHERE username = 'testuser'
      `);
      
      const isMatch = await bcrypt.compare(password, storedHash.rows[0].password_hash);
      console.log(`🔐 Password verification: ${isMatch ? 'SUCCESS' : 'FAILED'}`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error during test insert:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testDatabaseWrite().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});