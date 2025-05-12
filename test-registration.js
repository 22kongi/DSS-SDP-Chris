const http = require('http');

// Test registration data
const registrationData = {
  first_name: 'Test',
  surname: 'User',
  email: 'test@example.com',
  username: 'testuser123',
  password: 'SecurePassword123!'
};

// Options for the HTTP request
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(JSON.stringify(registrationData))
  }
};

console.log('Sending registration request to:', options.hostname, options.port, options.path);
console.log('Registration data:', registrationData);

// Make the HTTP request
const req = http.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let data = '';
  
  // Collect response data
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  // Process the complete response
  res.on('end', () => {
    console.log('Response Body:', data);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Registration successful!');
    } else {
      console.log('❌ Registration failed.');
      if (data.includes('Username or email already taken')) {
        console.log('Try using a different username and email.');
      }
    }
  });
});

// Handle request errors
req.on('error', (e) => {
  console.error('❌ Request Error:', e.message);
  console.log('Make sure the server is running on port 3000.');
});

// Send the request body
req.write(JSON.stringify(registrationData));
req.end();

console.log('Request sent. Waiting for response...');