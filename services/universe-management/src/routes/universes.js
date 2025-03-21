const express = require('express');
const router = express.Router();
const universeController = require('../controllers/universeController');

// Get all universes
router.get('/', universeController.getAllUniverses);

// Get universe by ID
router.get('/:id', universeController.getUniverseById);

// Create a new universe
router.post('/', universeController.createUniverse);

// Update universe
router.put('/:id', universeController.updateUniverse);

// Delete universe (soft delete)
router.delete('/:id', universeController.deleteUniverse);

// Get universes by age rating
router.get('/age-rating/:ageRating', universeController.getUniversesByAgeRating);

// Get popular universes
router.get('/popular', universeController.getPopularUniverses);

// Increment universe popularity
router.post('/:id/increment-popularity', universeController.incrementPopularity);

module.exports = router;
