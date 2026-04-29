const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true, trim: true },
  tokens: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const chatSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, trim: true },
  model: { type: String, default: 'gpt-3.5-turbo' },
  messages: [messageSchema],
  meta: {
    totalTokens: { type: Number, default: 0 },
    lastMessageAt: { type: Date, default: Date.now }
  }
}, { timestamps: true });

chatSessionSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
