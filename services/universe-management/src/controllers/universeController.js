const Universe = require('../models/universe');

// Get all universes
exports.getAllUniverses = async (req, res) => {
  try {
    const universes = await Universe.find({ active: true });
    res.status(200).json(universes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get universe by ID
exports.getUniverseById = async (req, res) => {
  try {
    const universe = await Universe.findById(req.params.id);
    if (!universe) {
      return res.status(404).json({ message: 'Universe not found' });
    }
    res.status(200).json(universe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new universe
exports.createUniverse = async (req, res) => {
  try {
    const universe = new Universe(req.body);
    const newUniverse = await universe.save();
    res.status(201).json(newUniverse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update universe
exports.updateUniverse = async (req, res) => {
  try {
    const universe = await Universe.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!universe) {
      return res.status(404).json({ message: 'Universe not found' });
    }
    res.status(200).json(universe);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete universe (soft delete)
exports.deleteUniverse = async (req, res) => {
  try {
    const universe = await Universe.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );
    if (!universe) {
      return res.status(404).json({ message: 'Universe not found' });
    }
    res.status(200).json({ message: 'Universe deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get universes by age rating
exports.getUniversesByAgeRating = async (req, res) => {
  try {
    const { ageRating } = req.params;
    const universes = await Universe.find({ 
      active: true,
      $or: [{ ageRating }, { ageRating: 'all' }]
    });
    res.status(200).json(universes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get popular universes
exports.getPopularUniverses = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const universes = await Universe.find({ active: true })
      .sort({ popularity: -1 })
      .limit(limit);
    res.status(200).json(universes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Increment universe popularity
exports.incrementPopularity = async (req, res) => {
  try {
    const universe = await Universe.findByIdAndUpdate(
      req.params.id,
      { $inc: { popularity: 1 } },
      { new: true }
    );
    if (!universe) {
      return res.status(404).json({ message: 'Universe not found' });
    }
    res.status(200).json(universe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
