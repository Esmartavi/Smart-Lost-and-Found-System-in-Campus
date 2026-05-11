const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Electronics', 'Clothing', 'ID Cards', 'Books', 'Accessories', 'Others'],
    default: 'Others'
  },
  status: {
    type: String,
    enum: ['Lost', 'Found', 'Claimed'],
    required: true
  },
  location: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  photo: {
    type: String,
    default: null
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contactEmail: {
    type: String,
    required: true
  },
  contactPhone: String,
  isResolved: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Text index for search
itemSchema.index({ name: 'text', description: 'text', location: 'text' });

module.exports = mongoose.model('Item', itemSchema);
