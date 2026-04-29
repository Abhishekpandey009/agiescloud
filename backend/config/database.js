const mongoose = require('mongoose');
const GridFSBucket = require('mongodb').GridFSBucket;

// Database connection function
const connectDB = async () => {
  try {
    // Prefer a URI that actually starts with a valid Mongo scheme
    const candidates = [process.env.MONGODB_URI, process.env.MONGO_URI, 'mongodb://localhost:27017/aegiscloud'];
    const validPrefix = (s) => typeof s === 'string' && (s.startsWith('mongodb://') || s.startsWith('mongodb+srv://'));
    const uri = candidates.find(validPrefix);

    if (!uri) {
      throw new Error('No valid MongoDB URI found. Set MONGO_URI or MONGODB_URI to a full connection string.');
    }

    // Helpful warning when MONGODB_URI is defined but not expanded (e.g., "${MONGO_URI}")
    if (process.env.MONGODB_URI && !validPrefix(process.env.MONGODB_URI) && validPrefix(process.env.MONGO_URI)) {
      console.warn('MONGODB_URI is set but not a valid connection string. Using MONGO_URI instead.');
      console.warn('Tip: dotenv does not expand variables by default. Either install dotenv-expand or set MONGODB_URI directly.');
    }

    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    if (!process.env.MONGODB_URI && process.env.MONGO_URI) {
      console.warn('Using MONGO_URI. Optionally set MONGODB_URI for consistency.');
    }

    // Initialize GridFS bucket for file storage
    const db = conn.connection.db;
    global.gridfsBucket = new GridFSBucket(db, {
      bucketName: 'files'
    });

    console.log('GridFS bucket initialized');

    return conn;
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Database disconnect function
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB Disconnected');
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  }
};

// Handle database connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

module.exports = { 
  connectDB, 
  disconnectDB 
};
