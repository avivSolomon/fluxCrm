const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const adminSchema = new Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: false,
  },

  email: {
    type: String,
    lowercase: true,
    trim: true,
    required: true,
  },
  name: { type: String, required: true },
  surname: { type: String },
  photo: {
    type: String,
    trim: true,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  // Preferred UI language, saved per user (Ram's end-to-end flow).
  language: {
    type: String,
    default: 'en_us',
    enum: ['en_us', 'he_il'],
  },
  role: {
    type: String,
    default: 'owner',
    enum: ['owner'],
  },
});

module.exports = mongoose.model('Admin', adminSchema);
