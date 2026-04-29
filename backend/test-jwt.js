const jwt = require('jsonwebtoken');
const User = require('./models/User');
require('dotenv').config();

// Test JWT functionality
async function testJWT() {
  try {
    console.log('JWT_SECRET:', process.env.JWT_SECRET);
    
    // Create a test token
    const testId = '507f1f77bcf86cd799439011'; // Sample ObjectId
    const token = jwt.sign({ id: testId }, process.env.JWT_SECRET || 'fallback_secret_key', {
      expiresIn: '30d'
    });
    
    console.log('Generated token:', token);
    
    // Try to verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    console.log('Decoded token:', decoded);
    
    // Test with a real user ID if possible
    console.log('JWT test completed successfully');
    
  } catch (error) {
    console.error('JWT test failed:', error);
  }
}

testJWT();