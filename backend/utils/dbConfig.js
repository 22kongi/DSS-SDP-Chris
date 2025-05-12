const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Log the database configuration being used
console.log('Database Configuration:');
console.log(`Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`Port: ${process.env.DB_PORT || 5500}`);
console.log(`User: ${process.env.DB_USER || 'postgres'}`);
console.log(`Database: ${process.env.DB_NAME || 'postgres'}`);
console.log(`Password: ${process.env.DB_PASSWORD ? '******' : 'not set'}`);

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'postgres',
  port: parseInt(process.env.DB_PORT) || 5500
});

// Test the database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ PostgreSQL connection error:', err.message);
    return;
  }
  console.log('✅ PostgreSQL connected successfully!');
  release();
});

// Export a query function
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};