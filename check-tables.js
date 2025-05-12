const { Pool } = require('pg');
require('dotenv').config();

// Log the database configuration being used
console.log('\n===== DATABASE CONFIGURATION =====');
console.log(`Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`Port: ${process.env.DB_PORT || 5500}`);
console.log(`User: ${process.env.DB_USER || 'postgres'}`);
console.log(`Database: ${process.env.DB_NAME || 'postgres'}`);
console.log(`Password: ${process.env.DB_PASSWORD ? '******' : 'not set'}`);
console.log('====================================\n');

// Configure the PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5500,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'postgres',
});

async function checkTablesExist() {
  const client = await pool.connect();
  try {
    console.log('🔌 Successfully connected to PostgreSQL database!\n');

    // Get all tables in the database
    console.log('📋 Listing all tables in the database:');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    if (tablesResult.rows.length === 0) {
      console.log('❌ No tables found in the public schema.');
    } else {
      console.log('✅ Tables found in the database:');
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    }
    console.log('');

    // Check for specific required tables
    const requiredTables = ['user_login', 'user_profile', 'admin_whitelist', 'temp_admin_registration'];
    console.log('🔍 Checking for required tables:');
    
    for (const tableName of requiredTables) {
      const checkResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [tableName]);
      
      const exists = checkResult.rows[0].exists;
      console.log(`  - ${tableName}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
      
      if (exists) {
        // Show table structure
        console.log(`    📊 Table structure for ${tableName}:`);
        const columnsResult = await client.query(`
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = $1
          ORDER BY ordinal_position;
        `, [tableName]);
        
        columnsResult.rows.forEach(column => {
          console.log(`      ${column.column_name} (${column.data_type}, ${column.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
        
        // Count rows in the table
        const countResult = await client.query(`SELECT COUNT(*) FROM ${tableName};`);
        console.log(`    📝 Row count: ${countResult.rows[0].count}`);
        
        // Show a sample of data if any exists
        if (parseInt(countResult.rows[0].count) > 0) {
          const sampleResult = await client.query(`
            SELECT * FROM ${tableName} LIMIT 3;
          `);
          console.log(`    🔎 Sample data (up to 3 rows):`);
          sampleResult.rows.forEach((row, index) => {
            console.log(`      Row ${index + 1}:`, JSON.stringify(row));
          });
        }
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error(`
📢 Connection refused. Please check:
   1. Is PostgreSQL running on ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5500}?
   2. Are your .env file settings correct?
   3. If using Docker, is the container running?`);
    } else if (error.code === '28P01') {
      console.error(`
📢 Authentication failed. Please check:
   1. Is the DB_PASSWORD in your .env file correct?
   2. Does the DB_USER have permission to access the database?`);
    } else if (error.code === '3D000') {
      console.error(`
📢 Database does not exist. Please check:
   1. Is the DB_NAME in your .env file correct?
   2. Have you created the database "${process.env.DB_NAME || 'postgres'}"?`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

checkTablesExist().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});