const mongoose = require('mongoose');

const thoughtSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true
  },
  mood: {
    type: String,
    required: false,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Thought', thoughtSchema);
