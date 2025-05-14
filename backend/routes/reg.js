const express = require('express');
const router = express.Router();
require('dotenv').config();
const PEPPER = process.env.PEPPER;

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../utils/dbConfig');
const sendVerificationCode = require('../utils/emailService');
const twoFAManager = require('../utils/twoFAManager');
const { csrfProtection } = require('../utils/csrfUtils');

// Load Blacklist
const passwordBlacklist = fs.readFileSync(
  path.join(__dirname, '../data/common-passwords.txt'),'utf-8'
).split('\n').map(p => p.trim().toLowerCase());

console.log("Blacklist loaded with", passwordBlacklist.length, "common passwords");

// === Registration handler ===
router.post('/', csrfProtection, async (req, res) => {
  console.log('Registration request received:');
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Body:', req.body);

  // Check if body parsing middleware is working correctly
  if (!req.body || Object.keys(req.body).length === 0) {
    console.error('⚠️ Empty request body received - possible middleware issue');
    console.error('Headers:', req.headers);
    return res.status(400).send('⚠️ Request body empty. Please ensure the form is submitted correctly.');
  }

  const { first_name, surname, email, username, password: rawPassword, role = 'user' } =
req.body;

  console.log('Extracted fields:', {
    first_name,
    surname,
    email,
    username,
    password_length: rawPassword?.length
  });

  // Check if any fields are missing
  if (!first_name) console.log('⚠️ Missing field: first_name');
  if (!surname) console.log('⚠️ Missing field: surname');
  if (!email) console.log('⚠️ Missing field: email');
  if (!username) console.log('⚠️ Missing field: username');
  if (!rawPassword) console.log('⚠️ Missing field: password');

  const password = rawPassword?.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Validation
  if (!first_name || !surname || !email || !username || !password) {
    return res.status(400).send('⚠️ All fields are required.');
  }

  // Username validation (3-30 characters, alphanumeric plus some special chars)
  if (username.length < 3 || username.length > 30) {
    return res.status(400).send('⚠️ Username must be 3-30 characters.');
  }

  // Username character validation (alphanumeric, underscore, dash, period)
  if (!/^[a-zA-Z0-9_\-\.]+$/.test(username)) {
    return res.status(400).send('⚠️ Username can only contain letters, numbers, underscores, dashes, and periods.');
  }

  // Name validation
  if (first_name.length > 50) {
    return res.status(400).send('⚠️ First name must be under 50 characters.');
  }

  if (surname.length > 50) {
    return res.status(400).send('⚠️ Surname must be under 50 characters.');
  }

  // Email validation
  if (!emailRegex.test(email)) {
    return res.status(400).send('⚠️ Invalid email format.');
  }

  if (email.length > 100) {
    return res.status(400).send('⚠️ Email must be under 100 characters.');
  }

  // NIST-compliant password validation
  if (password.length < 8 || password.length > 64) {
    return res.status(400).send('⚠️ Password must be 8–64 characters.');
  }

  if (passwordBlacklist.includes(password.toLowerCase())) {
    return res.status(400).send('⚠️ Password is too common.');
  }

  if (/^\d+$/.test(password)) {
    return res.status(400).send('⚠️ Password cannot be all numbers.');
  }

  // Check if password contains username
  if (password.toLowerCase().includes(username.toLowerCase())) {
    return res.status(400).send('⚠️ Password cannot contain your username.');
  }

  try {
    // Check if username or email already exists
    const userCheck = await db.query(
      'SELECT * FROM user_login WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (userCheck.rows.length > 0) {
      return res.status(409).send('⚠️ Username or email already taken.');
    }

    // Check if the email is in the admin whitelist
    const whitelistCheck = await db.query(
      'SELECT * FROM admin_whitelist WHERE email = $1',
      [email]
    );

    const isAdmin = whitelistCheck.rows.length > 0;
    const finalRole = isAdmin ? 'admin' : role;
    const uses2FA = isAdmin ? true : false;

    // Hash the password
    const hash = await bcrypt.hash(password + PEPPER, 10);

    // Handle admin registration differently - store temporarily until 2FA verified
    if (isAdmin) {
      // Generate a verification code
      const code = twoFAManager.generateCode();
      console.log(`📧 Sending 2FA code to ${email}: ${code}`);

      try {
        // Store the admin data temporarily with the verification code
        await twoFAManager.storeCode(username, email, code, {
          first_name,
          surname,
          password_hash: hash
        });

        // Send the verification code
        await sendVerificationCode(email, code);

        // Respond with success, but note that registration isn't complete until 2FA
        return res.status(200).json({
          message: '! Verification code sent. Please check your email.',
          role: finalRole,
          isAdmin,
          username,
          needs2FA: true
        });
      } catch (emailError) {
        console.error('⚠️ Failed to send verification email:', emailError);
        return res.status(500).send('⚠️ Failed to send verification email. Please try again.');
      }
    }

    // Regular user registration (non-admin) - proceed directly
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      // Insert into user_login
      await client.query(
        'INSERT INTO user_login (username, email, password_hash, role, uses_2fa) VALUES ($1, $2, $3, $4, $5)',
        [username, email, hash, finalRole, uses2FA]
      );

      // Insert into user_profile
      await client.query(
        'INSERT INTO user_profile (username, first_name, surname) VALUES ($1, $2, $3)',
        [username, first_name, surname]
      );

      await client.query('COMMIT');
      console.log('! Registration successful for:', username);

      // Update the response to include a token
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET;

      // Generate token (similar to login process)
      const token = jwt.sign(
        {
          // Don't use client.rows - it doesn't have the inserted user's ID
          // This will be properly filled by the login process
          id: 0,
          username: username,
          role: finalRole
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        message: '! Registration successful.',
        role: finalRole,
        isAdmin: false,
        username,
        token: token  // Include token in response
      });
    } catch (dbError) {
      await client.query('ROLLBACK');
      console.error('⚠️ Database error during registration:', dbError);
      return res.status(500).send('⚠️ Registration failed due to a database error.');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('⚠️ Server error during registration:', error);
    return res.status(500).send('⚠️ Server error during registration.');
  }
});

// === Live username availability check ===
router.get('/check-username', async (req, res) => {
  const username = req.query.username;
  console.log("check-username route hit:", username);

  if (!username) {
    return res.status(400).send('Username is required');
  }

  // Validate username format before checking database
  if (username.length < 3 || username.length > 30) {
    return res.json({
      available: false,
      message: 'Username must be 3-30 characters'
    });
  }

  // Username character validation (alphanumeric, underscore, dash, period)
  if (!/^[a-zA-Z0-9_\-\.]+$/.test(username)) {
    return res.json({
      available: false,
      message: 'Username can only contain letters, numbers, underscores, dashes, and periods'
    });
  }

  try {
    const result = await db.query(
      'SELECT * FROM user_login WHERE username = $1',
      [username]
    );

    // Also check temp_admin_registration for usernames in verification
    const tempResult = await db.query(
      'SELECT * FROM temp_admin_registration WHERE username = $1',
      [username]
    );

    const available = (result.rows.length === 0 && tempResult.rows.length === 0);
    return res.json({ available });
  } catch (error) {
    console.error('⚠️ Username check error:', error.message);
    return res.status(500).send('⚠️ Server error');
  }
});

// === Live email availability check ===
router.get('/check-email', async (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).send('Email is required');
  }

  // Validate email format before checking database
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.json({
      available: false,
      message: 'Invalid email format'
    });
  }

  // Check email length
  if (email.length > 100) {
    return res.json({
      available: false,
      message: 'Email must be under 100 characters'
    });
  }

  try {
    const result = await db.query(
      'SELECT * FROM user_login WHERE email = $1',
      [email]
    );

    // Also check temp_admin_registration for emails in verification
    const tempResult = await db.query(
      'SELECT * FROM temp_admin_registration WHERE email = $1',
      [email]
    );

    const available = (result.rows.length === 0 && tempResult.rows.length === 0);
    return res.json({ available });
  } catch (error) {
    console.error('⚠️ Email check error:', error.message);
    return res.status(500).send('⚠️ Server error');
  }
});

module.exports = router;