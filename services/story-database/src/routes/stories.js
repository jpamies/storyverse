const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');

// Get all stories for a user
router.get('/user/:userId', storyController.getUserStories);

// Get story by ID
router.get('/:id', storyController.getStoryById);

// Create a new story
router.post('/', storyController.createStory);

// Update story
router.put('/:id', storyController.updateStory);

// Delete story
router.delete('/:id', storyController.deleteStory);

// Update story content
router.put('/:id/content', storyController.updateStoryContent);

// Update story generation progress
router.put('/:id/progress', storyController.updateGenerationProgress);

// Get popular stories
router.get('/popular', storyController.getPopularStories);

// Get stories by theme
router.get('/theme/:theme', storyController.getStoriesByTheme);

// Get stories by universe
router.get('/universe/:universeId', storyController.getStoriesByUniverse);

module.exports = router;
