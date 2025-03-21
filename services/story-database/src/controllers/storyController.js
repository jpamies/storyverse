const Story = require('../models/story');
const { v4: uuidv4 } = require('uuid');
const { metrics } = require('../server');

// Get all stories for a user
exports.getUserStories = async (req, res) => {
  try {
    const { userId } = req.params;
    const stories = await Story.find({ userId })
      .sort({ updatedAt: -1 })
      .select('-content'); // Exclude content for performance
    
    res.status(200).json(stories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get story by ID
exports.getStoryById = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    
    // Increment view count
    story.viewCount += 1;
    await story.save();
    
    // Track story access
    metrics.storyAccessCounter.inc({ story_id: req.params.id });
    
    res.status(200).json(story);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new story
exports.createStory = async (req, res) => {
  try {
    const storyData = req.body;
    
    // Create new story
    const story = new Story(storyData);
    const savedStory = await story.save();
    
    // Track story creation
    const primaryUniverse = storyData.universes && storyData.universes.length > 0 
      ? storyData.universes[0] 
      : 'unknown';
    
    metrics.storyCreationCounter.inc({ 
      universe: primaryUniverse,
      age_group: storyData.ageGroup || 'unknown'
    });
    
    res.status(201).json(savedStory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update story
exports.updateStory = async (req, res) => {
  try {
    const story = await Story.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    
    res.status(200).json(story);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete story
exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findByIdAndDelete(req.params.id);
    
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    
    res.status(200).json({ message: 'Story deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update story content
exports.updateStoryContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }
    
    const story = await Story.findById(id);
    
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    
    story.content = content;
    story.status = 'completed';
    story.generationProgress = 100;
    
    await story.save();
    
    res.status(200).json({ message: 'Story content updated successfully', story });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update story generation progress
exports.updateGenerationProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress, status } = req.body;
    
    const story = await Story.findById(id);
    
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    
    if (progress !== undefined) {
      story.generationProgress = progress;
    }
    
    if (status) {
      story.status = status;
    }
    
    await story.save();
    
    res.status(200).json({ message: 'Story progress updated', story });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get popular stories
exports.getPopularStories = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const stories = await Story.find({ isPublic: true })
      .sort({ viewCount: -1 })
      .limit(limit)
      .select('-content'); // Exclude content for performance
    
    res.status(200).json(stories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get stories by theme
exports.getStoriesByTheme = async (req, res) => {
  try {
    const { theme } = req.params;
    
    const stories = await Story.find({ 
      theme,
      isPublic: true
    })
    .sort({ createdAt: -1 })
    .select('-content'); // Exclude content for performance
    
    res.status(200).json(stories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get stories by universe
exports.getStoriesByUniverse = async (req, res) => {
  try {
    const { universeId } = req.params;
    
    const stories = await Story.find({ 
      universes: universeId,
      isPublic: true
    })
    .sort({ createdAt: -1 })
    .select('-content'); // Exclude content for performance
    
    res.status(200).json(stories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
