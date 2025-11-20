const mongoose = require('mongoose');

const HeartSchema = new mongoose.Schema({
  bpm: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Heart', HeartSchema);
