// =========================
// 🌩️ AegisCloud Server.js
// =========================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

dotenv.config();

// =========================
// 📦 Database
// =========================
const { connectDB } = require('./config/database');

// =========================
// 🚏 Routes
// =========================
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const aiFeatureRoutes = require('./routes/ai');   // FILE AI FEATURES
const aiChatRoutes = require('./routes/chat');    // CHATBOT AI
const pdfRoutes = require('./routes/pdf');
// =========================
// 🚀 App Init
// =========================
const app = express();

// DB Connection: ensure we connect before starting the server
async function startApp() {
  if (process.env.ALLOW_NO_DB !== 'true') {
    try {
      await connectDB();
    } catch (err) {
      console.error('Failed to connect to DB:', err);
      process.exit(1);
    }
  } else {
    // When skipping DB connect, disable mongoose buffering so operations fail fast
    mongoose.set('bufferCommands', false);
    mongoose.set('bufferTimeoutMS', 0);
    console.warn("⚠️ MongoDB connection skipped (ALLOW_NO_DB=true). Mongoose buffering disabled; DB ops will error immediately.");
  }

  tryListen(basePort);
}

// =========================
// 🔐 Security
// =========================
app.use(helmet());
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// =========================
// 🚦 Global Rate Limit
// =========================
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: { success: false, message: "Too many requests, try again later." },
  })
);

// =========================
// 🩺 Health Check
// =========================
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: "Server running",
    time: new Date().toISOString(),
  });
});

// =========================
// 🧠 API ROUTES
// =========================

// AUTH
app.use('/api/auth', authRoutes);

// FILE MANAGEMENT
app.use('/api/files', fileRoutes);

// FILE AI FEATURES
app.use('/api/ai/features', aiFeatureRoutes);

// PDF AI FEATURES (separate route)
app.use('/api/ai/pdf', pdfRoutes);

// CHATBOT AI
app.use('/api/chat', aiChatRoutes);       // legacy/fallback path used by frontend fallbacks
app.use('/api/ai/chat', aiChatRoutes);

// =========================
// ❌ 404 Handler
// =========================
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// =========================
// 🏭 Serve Frontend in Production
// =========================
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// =========================
// ⚠ Global Error Handler
// =========================
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: err.message,
  });
});

// =========================
// 🚀 Start Server
// =========================
const basePort = parseInt(process.env.PORT, 10) || 5000;
const MAX_PORT_TRIES = 5;

function tryListen(port, attempt = 1) {
  const server = app.listen(port, () => {
    console.log(`\n🚀 AegisCloud API Running!\n📍 PORT: ${port}\n\n🤖 Aegis AI Chatbot:\nPOST http://localhost:${port}/api/ai/chat\n\n🧠 File AI Features:\nhttp://localhost:${port}/api/ai/features/*\n\n📊 Health Check:\nhttp://localhost:${port}/health\n`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      if (attempt < MAX_PORT_TRIES) {
        const nextPort = port + 1;
        console.warn(`Port ${port} in use. Retrying on ${nextPort} (attempt ${attempt + 1}/${MAX_PORT_TRIES})`);
        tryListen(nextPort, attempt + 1);
      } else {
        console.error(`Failed to bind after ${MAX_PORT_TRIES} attempts. Last port tried: ${port}`);
        process.exit(1);
      }
    } else {
      console.error('Server listen error:', err);
      process.exit(1);
    }
  });
}

// Start the app after all variables and functions are defined
startApp();

module.exports = app;
