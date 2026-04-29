const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZDJiY2I2MzYzNWU4ZGM3Zjc5MjJhZSIsImlhdCI6MTc1ODY0MjE4NywiZXhwIjoxNzYxMjM0MTg3fQ.Qy9NvJ9vq_rHtSsVklwEYaWzRhO3T_JKCcVQJb4n-W8";

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('🔑 Token user ID:', decoded.id);
  console.log('📁 Files owner ID: 68d192856d6442c35dbb449c');
  console.log('✅ Match:', decoded.id === '68d192856d6442c35dbb449c');
} catch (error) {
  console.error('❌ Token error:', error.message);
}