const mongoose = require('mongoose');

const characterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  universe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Universe',
    required: true
  },
  type: {
    type: String,
    enum: ['hero', 'sidekick', 'rival', 'mentor', 'custom'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  traits: [{
    type: String,
    trim: true
  }],
  abilities: [{
    name: String,
    description: String
  }],
  relationships: [{
    character: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Character'
    },
    relationshipType: {
      type: String,
      enum: ['friend', 'rival', 'mentor', 'student', 'family', 'enemy']
    },
    description: String
  }],
  imageUrl: {
    type: String
  },
  ageRange: {
    min: {
      type: Number,
      min: 3,
      max: 12
    },
    max: {
      type: Number,
      min: 3,
      max: 12
    }
  },
  popularity: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add text index for search functionality
characterSchema.index({ name: 'text', description: 'text' });

// Pre-save middleware to update the updatedAt field
characterSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for character's full representation
characterSchema.virtual('fullRepresentation').get(function() {
  return `${this.name} (${this.universe.name})`;
});

// Method to check if character can interact with another character
characterSchema.methods.canInteractWith = function(otherCharacter) {
  // Characters from same universe can always interact
  if (this.universe.equals(otherCharacter.universe)) {
    return true;
  }
  
  // Check for existing relationship
  const existingRelationship = this.relationships.find(
    rel => rel.character.equals(otherCharacter._id)
  );
  
  return !!existingRelationship;
};

const Character = mongoose.model('Character', characterSchema);

module.exports = Character;
