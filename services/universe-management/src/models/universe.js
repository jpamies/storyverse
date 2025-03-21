const mongoose = require('mongoose');

const universeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  primaryColor: {
    type: String,
    default: '#3498db'
  },
  secondaryColor: {
    type: String,
    default: '#2980b9'
  },
  settings: [{
    name: String,
    description: String,
    imageUrl: String
  }],
  themes: [{
    name: String,
    description: String
  }],
  ageRating: {
    type: String,
    enum: ['3-5', '6-8', '9-12', 'all'],
    default: 'all'
  },
  popularity: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
universeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Universe', universeSchema);
