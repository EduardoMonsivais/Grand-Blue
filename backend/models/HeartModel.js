const mongoose = require('mongoose');

const HeartSchema = new mongoose.Schema({
  bpm: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

module.exports = mongoose.model('Heart', HeartSchema);
