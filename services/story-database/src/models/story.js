const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  childName: {
    type: String,
    trim: true
  },
  ageGroup: {
    type: String,
    enum: ['3-5', '6-8', '9-12'],
    required: true
  },
  readingLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  universes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Universe'
  }],
  characters: [{
    universeId: mongoose.Schema.Types.ObjectId,
    characterId: String,
    name: String,
    role: {
      type: String,
      enum: ['hero', 'sidekick', 'mentor', 'rival', 'custom']
    }
  }],
  storyType: {
    type: String,
    enum: ['single_universe', 'crossover', 'fusion_world', 'universe_hopping'],
    required: true
  },
  theme: {
    type: String,
    enum: [
      'adventure_quest',
      'friendship_tale',
      'overcoming_fears',
      'learning_skills',
      'helping_others',
      'mystery_solving'
    ],
    required: true
  },
  moralLesson: {
    type: String,
    enum: [
      'friendship_teamwork',
      'courage_bravery',
      'honesty_truth',
      'kindness_compassion',
      'perseverance',
      'respect_differences',
      'responsibility'
    ],
    required: true
  },
  storyLength: {
    type: String,
    enum: ['bedtime_short', 'chapter_adventure', 'mini_epic', 'series_creator'],
    required: true
  },
  culturalElements: {
    type: String,
    trim: true
  },
  content: {
    text: String,
    summary: String,
    pages: [{
      pageNumber: Number,
      text: String,
      imageUrl: String
    }]
  },
  mediaOptions: {
    hasAudio: {
      type: Boolean,
      default: false
    },
    audioUrl: String,
    hasBackgroundMusic: {
      type: Boolean,
      default: false
    },
    musicUrl: String,
    hasInteractiveElements: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['draft', 'generating', 'completed', 'failed'],
    default: 'draft'
  },
  generationProgress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: false
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
storySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for story URL
storySchema.virtual('url').get(function() {
  return `/stories/${this._id}`;
});

module.exports = mongoose.model('Story', storySchema);
