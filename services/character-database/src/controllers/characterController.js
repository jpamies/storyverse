const Character = require('../models/character');

// Get all characters with optional filtering
exports.getAllCharacters = async (req, res) => {
  try {
    const { universe, type, ageRange, search } = req.query;
    const query = {};
    
    // Apply filters if provided
    if (universe) query.universe = universe;
    if (type) query.type = type;
    if (ageRange) {
      const [min, max] = ageRange.split('-').map(Number);
      query['ageRange.min'] = { $lte: max };
      query['ageRange.max'] = { $gte: min };
    }
    if (search) {
      query.$text = { $search: search };
    }
    
    const characters = await Character.find(query)
      .populate('universe', 'name description')
      .sort({ popularity: -1 });
    
    res.status(200).json({
      status: 'success',
      results: characters.length,
      data: {
        characters
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// Get a single character by ID
exports.getCharacter = async (req, res) => {
  try {
    const character = await Character.findById(req.params.id)
      .populate('universe', 'name description')
      .populate('relationships.character', 'name type imageUrl');
    
    if (!character) {
      return res.status(404).json({
        status: 'fail',
        message: 'Character not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        character
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// Create a new character
exports.createCharacter = async (req, res) => {
  try {
    const newCharacter = await Character.create(req.body);
    
    res.status(201).json({
      status: 'success',
      data: {
        character: newCharacter
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Update a character
exports.updateCharacter = async (req, res) => {
  try {
    const character = await Character.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!character) {
      return res.status(404).json({
        status: 'fail',
        message: 'Character not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        character
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Delete a character
exports.deleteCharacter = async (req, res) => {
  try {
    const character = await Character.findByIdAndDelete(req.params.id);
    
    if (!character) {
      return res.status(404).json({
        status: 'fail',
        message: 'Character not found'
      });
    }
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// Get characters by universe
exports.getCharactersByUniverse = async (req, res) => {
  try {
    const { universeId } = req.params;
    
    const characters = await Character.find({ universe: universeId })
      .populate('universe', 'name description');
    
    res.status(200).json({
      status: 'success',
      results: characters.length,
      data: {
        characters
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// Get compatible characters for crossovers
exports.getCompatibleCharacters = async (req, res) => {
  try {
    const { characterId } = req.params;
    
    const sourceCharacter = await Character.findById(characterId);
    
    if (!sourceCharacter) {
      return res.status(404).json({
        status: 'fail',
        message: 'Source character not found'
      });
    }
    
    // Find characters from different universes that might be compatible
    const compatibleCharacters = await Character.find({
      universe: { $ne: sourceCharacter.universe },
      // Add additional compatibility criteria as needed
      type: { $in: ['hero', 'sidekick', 'mentor'] }
    }).populate('universe', 'name description');
    
    res.status(200).json({
      status: 'success',
      results: compatibleCharacters.length,
      data: {
        compatibleCharacters
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};

// Update character popularity
exports.updatePopularity = async (req, res) => {
  try {
    const { characterId } = req.params;
    const { increment } = req.body;
    
    const character = await Character.findByIdAndUpdate(
      characterId,
      { $inc: { popularity: increment || 1 } },
      { new: true }
    );
    
    if (!character) {
      return res.status(404).json({
        status: 'fail',
        message: 'Character not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        character
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};
