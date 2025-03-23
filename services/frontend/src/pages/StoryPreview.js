import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import { 
  PlayArrow, 
  Pause, 
  SkipPrevious, 
  SkipNext, 
  Download, 
  Share, 
  Favorite, 
  FavoriteBorder,
  Print,
  VolumeUp,
  VolumeOff
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Sample story data
const sampleStory = {
  id: '12345',
  title: 'Goku and Woody's Space Adventure',
  universes: ['Dragon Ball', 'Toy Story'],
  characters: [
    { name: 'Goku', universe: 'Dragon Ball', image: 'https://via.placeholder.com/100?text=Goku' },
    { name: 'Woody', universe: 'Toy Story', image: 'https://via.placeholder.com/100?text=Woody' },
    { name: 'Buzz Lightyear', universe: 'Toy Story', image: 'https://via.placeholder.com/100?text=Buzz' }
  ],
  theme: 'Adventure Quest',
  moral: 'Friendship & Teamwork',
  pages: [
    {
      text: "Once upon a time, in a world where toys could talk and heroes could fly, there lived a brave cowboy doll named Woody. Woody was the favorite toy of a boy named Andy, and he took his job of making Andy happy very seriously.",
      image: 'https://via.placeholder.com/600x400?text=Page+1'
    },
    {
      text: "One day, while Andy was playing, a strange portal opened up in his room. Out stepped a man with spiky black hair and an orange gi. 'Hi there! I'm Goku!' the man said with a friendly smile. Woody was shocked – he had never seen a human so small, yet so powerful!",
      image: 'https://via.placeholder.com/600x400?text=Page+2'
    },
    {
      text: "'I'm looking for the Dragon Balls,' Goku explained. 'One of them landed in this dimension, and I need to find it before something bad happens!' Woody didn't know what Dragon Balls were, but he could tell this was important.",
      image: 'https://via.placeholder.com/600x400?text=Page+3'
    },
    {
      text: "Just then, Buzz Lightyear walked over. 'As a Space Ranger, it's my duty to help with interstellar emergencies,' Buzz declared. 'We'll help you find this Dragon Ball, Goku!'",
      image: 'https://via.placeholder.com/600x400?text=Page+4'
    },
    {
      text: "The three new friends searched all over Andy's room. They looked under the bed, in the toy chest, and even inside the board games. But the Dragon Ball was nowhere to be found.",
      image: 'https://via.placeholder.com/600x400?text=Page+5'
    },
    {
      text: "'Wait!' said Woody. 'I think I know where it might be. Andy was playing with a new marble earlier. It was orange with stars on it!' Goku's eyes lit up. 'That's it! That's the Four-Star Dragon Ball!'",
      image: 'https://via.placeholder.com/600x400?text=Page+6'
    },
    {
      text: "Working together, they devised a plan. Buzz used his wings to fly up to the shelf where Andy kept his marbles. Woody used his lasso to reach the Dragon Ball. And Goku used his energy to carefully bring it down.",
      image: 'https://via.placeholder.com/600x400?text=Page+7'
    },
    {
      text: "'We did it!' cheered Woody. 'By working together, we solved the problem!' Goku smiled. 'That's what friends do – they help each other out. I couldn't have found the Dragon Ball without you two.'",
      image: 'https://via.placeholder.com/600x400?text=Page+8'
    },
    {
      text: "Before Goku left through the portal, he taught Woody and Buzz how to do a fist bump. 'Remember,' said Goku, 'teamwork makes even the impossible possible!' And with that, he waved goodbye, promising to visit his new friends again someday.",
      image: 'https://via.placeholder.com/600x400?text=Page+9'
    },
    {
      text: "From that day on, whenever Andy played with Woody and Buzz, they remembered their adventure with Goku and the important lesson they learned: with good friends by your side, you can overcome any challenge!",
      image: 'https://via.placeholder.com/600x400?text=Page+10'
    }
  ],
  audioUrl: '#',
  createdAt: new Date().toISOString(),
  childName: 'Emma',
  ageGroup: '6-8'
};

const StoryPreview = () => {
  const [loading, setLoading] = useState(true);
  const [story, setStory] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate loading the story data
    const timer = setTimeout(() => {
      setStory(sampleStory);
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleNextPage = () => {
    if (story && currentPage < story.pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    // In a real app, this would control audio playback
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // In a real app, this would mute/unmute audio
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // In a real app, this would save to favorites
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDownload = () => {
    // In a real app, this would download the story
    alert('Downloading story...');
  };

  const handlePrint = () => {
    // In a real app, this would print the story
    alert('Preparing story for printing...');
  };

  const handleShare = () => {
    // In a real app, this would share the story
    alert('Sharing story...');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8 }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Generating your story...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {story.title}
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Story" />
          <Tab label="Details" />
        </Tabs>
      </Box>
      
      {tabValue === 0 ? (
        <Box>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              mb: 3, 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center'
            }}
          >
            <Box 
              sx={{ 
                width: { xs: '100%', md: '60%' }, 
                pr: { xs: 0, md: 2 },
                mb: { xs: 2, md: 0 }
              }}
            >
              <img 
                src={story.pages[currentPage].image} 
                alt={`Page ${currentPage + 1}`} 
                style={{ width: '100%', borderRadius: 8 }}
              />
            </Box>
            <Box sx={{ width: { xs: '100%', md: '40%' } }}>
              <Typography variant="body1" paragraph>
                {story.pages[currentPage].text}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Page {currentPage + 1} of {story.pages.length}
              </Typography>
            </Box>
          </Paper>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Button 
              startIcon={<SkipPrevious />} 
              onClick={handlePrevPage}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton onClick={togglePlayPause} color="primary">
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>
              <IconButton onClick={toggleMute}>
                {isMuted ? <VolumeOff /> : <VolumeUp />}
              </IconButton>
            </Box>
            
            <Button 
              endIcon={<SkipNext />} 
              onClick={handleNextPage}
              disabled={currentPage === story.pages.length - 1}
            >
              Next
            </Button>
          </Box>
        </Box>
      ) : (
        <Box>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Story Details
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Universes:</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {story.universes.join(', ')}
                </Typography>
                
                <Typography variant="subtitle2">Theme:</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {story.theme}
                </Typography>
                
                <Typography variant="subtitle2">Moral Lesson:</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {story.moral}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Created For:</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {story.childName}
                </Typography>
                
                <Typography variant="subtitle2">Age Group:</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {story.ageGroup}
                </Typography>
                
                <Typography variant="subtitle2">Created On:</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {new Date(story.createdAt).toLocaleDateString()}
                </Typography>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Characters
            </Typography>
            
            <Grid container spacing={2}>
              {story.characters.map((character, index) => (
                <Grid item key={index} xs={6} sm={4} md={3}>
                  <Card sx={{ height: '100%' }}>
                    <CardMedia
                      component="img"
                      height="100"
                      image={character.image}
                      alt={character.name}
                    />
                    <CardContent sx={{ p: 1 }}>
                      <Typography variant="body2" align="center">
                        {character.name}
                      </Typography>
                      <Typography variant="caption" align="center" display="block" color="text.secondary">
                        {character.universe}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
        <Button variant="outlined" onClick={() => navigate('/create')}>
          Create Another Story
        </Button>
        
        <Box>
          <Tooltip title="Save to Favorites">
            <IconButton onClick={toggleFavorite} color={isFavorite ? "primary" : "default"}>
              {isFavorite ? <Favorite /> : <FavoriteBorder />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Download">
            <IconButton onClick={handleDownload}>
              <Download />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print">
            <IconButton onClick={handlePrint}>
              <Print />
            </IconButton>
          </Tooltip>
          <Tooltip title="Share">
            <IconButton onClick={handleShare}>
              <Share />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
};

export default StoryPreview;
