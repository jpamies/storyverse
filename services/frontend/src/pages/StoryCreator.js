import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Stepper, 
  Step, 
  StepLabel, 
  Button, 
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Chip,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const steps = ['Universe Selection', 'Character Options', 'Story Theme', 'Moral Lesson', 'Customization'];

// Sample data
const universes = [
  { id: 1, name: 'Single Universe', description: 'Set your story in one universe' },
  { id: 2, name: 'Crossover Adventure', description: 'Characters from different universes meet' },
  { id: 3, name: 'Fusion World', description: 'A blended setting combining elements from multiple universes' },
  { id: 4, name: 'Universe Hopping', description: 'Characters travel between different worlds' }
];

const availableUniverses = [
  { id: 1, name: 'Dragon Ball', image: 'https://via.placeholder.com/150?text=Dragon+Ball' },
  { id: 2, name: 'Ninja Turtles', image: 'https://via.placeholder.com/150?text=Ninja+Turtles' },
  { id: 3, name: 'Futurama', image: 'https://via.placeholder.com/150?text=Futurama' },
  { id: 4, name: 'Toy Story', image: 'https://via.placeholder.com/150?text=Toy+Story' },
  { id: 5, name: 'Lion King', image: 'https://via.placeholder.com/150?text=Lion+King' },
  { id: 6, name: 'Monsters Inc', image: 'https://via.placeholder.com/150?text=Monsters+Inc' }
];

const characters = [
  { id: 1, name: 'Goku', universe: 'Dragon Ball', type: 'Hero', image: 'https://via.placeholder.com/100?text=Goku' },
  { id: 2, name: 'Leonardo', universe: 'Ninja Turtles', type: 'Hero', image: 'https://via.placeholder.com/100?text=Leonardo' },
  { id: 3, name: 'Fry', universe: 'Futurama', type: 'Hero', image: 'https://via.placeholder.com/100?text=Fry' },
  { id: 4, name: 'Woody', universe: 'Toy Story', type: 'Hero', image: 'https://via.placeholder.com/100?text=Woody' },
  { id: 5, name: 'Simba', universe: 'Lion King', type: 'Hero', image: 'https://via.placeholder.com/100?text=Simba' },
  { id: 6, name: 'Sulley', universe: 'Monsters Inc', type: 'Hero', image: 'https://via.placeholder.com/100?text=Sulley' },
  { id: 7, name: 'Vegeta', universe: 'Dragon Ball', type: 'Rival', image: 'https://via.placeholder.com/100?text=Vegeta' },
  { id: 8, name: 'Shredder', universe: 'Ninja Turtles', type: 'Villain', image: 'https://via.placeholder.com/100?text=Shredder' },
  { id: 9, name: 'Bender', universe: 'Futurama', type: 'Sidekick', image: 'https://via.placeholder.com/100?text=Bender' },
  { id: 10, name: 'Buzz', universe: 'Toy Story', type: 'Sidekick', image: 'https://via.placeholder.com/100?text=Buzz' },
  { id: 11, name: 'Timon', universe: 'Lion King', type: 'Sidekick', image: 'https://via.placeholder.com/100?text=Timon' },
  { id: 12, name: 'Mike', universe: 'Monsters Inc', type: 'Sidekick', image: 'https://via.placeholder.com/100?text=Mike' }
];

const themes = [
  { id: 1, name: 'Adventure Quest', description: 'Characters seek an important object or person' },
  { id: 2, name: 'Friendship Tale', description: 'Story about building relationships and teamwork' },
  { id: 3, name: 'Overcoming Fears', description: 'Characters help each other face their anxieties' },
  { id: 4, name: 'Learning New Skills', description: 'Characters teach each other abilities from their universes' },
  { id: 5, name: 'Helping Others', description: 'Focus on community service and assistance' },
  { id: 6, name: 'Mystery Solving', description: 'Characters work together to solve a puzzle or mystery' }
];

const morals = [
  { id: 1, name: 'Friendship & Teamwork', description: 'Working together achieves more than working alone' },
  { id: 2, name: 'Courage & Bravery', description: 'Standing up for what\'s right even when it\'s difficult' },
  { id: 3, name: 'Honesty & Truth', description: 'The importance of being truthful' },
  { id: 4, name: 'Kindness & Compassion', description: 'Helping others without expecting rewards' },
  { id: 5, name: 'Perseverance', description: 'Continuing to try despite difficulties' },
  { id: 6, name: 'Respect for Differences', description: 'Appreciating unique qualities in others' },
  { id: 7, name: 'Responsibility', description: 'Taking care of duties and obligations' }
];

const StoryCreator = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [storyData, setStoryData] = useState({
    universeType: '',
    selectedUniverses: [],
    mainCharacter: null,
    supportingCharacters: [],
    theme: '',
    moral: '',
    childName: '',
    ageGroup: '',
    readingLevel: '',
    storyLength: '',
    mediaOptions: []
  });
  const navigate = useNavigate();

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    if (activeStep === steps.length - 1) {
      // Submit the story creation request
      navigate('/preview');
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleUniverseTypeChange = (event) => {
    setStoryData({
      ...storyData,
      universeType: event.target.value,
      selectedUniverses: []
    });
  };

  const handleUniverseSelection = (universeId) => {
    const universe = availableUniverses.find(u => u.id === universeId);
    
    if (storyData.universeType === 1) {
      // Single universe mode - replace the selection
      setStoryData({
        ...storyData,
        selectedUniverses: [universe]
      });
    } else {
      // Multi-universe modes
      const isSelected = storyData.selectedUniverses.some(u => u.id === universeId);
      
      if (isSelected) {
        setStoryData({
          ...storyData,
          selectedUniverses: storyData.selectedUniverses.filter(u => u.id !== universeId)
        });
      } else {
        setStoryData({
          ...storyData,
          selectedUniverses: [...storyData.selectedUniverses, universe]
        });
      }
    }
  };

  const handleCharacterSelection = (character, type) => {
    if (type === 'main') {
      setStoryData({
        ...storyData,
        mainCharacter: character
      });
    } else {
      const isSelected = storyData.supportingCharacters.some(c => c.id === character.id);
      
      if (isSelected) {
        setStoryData({
          ...storyData,
          supportingCharacters: storyData.supportingCharacters.filter(c => c.id !== character.id)
        });
      } else {
        setStoryData({
          ...storyData,
          supportingCharacters: [...storyData.supportingCharacters, character]
        });
      }
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setStoryData({
      ...storyData,
      [name]: value
    });
  };

  const handleMediaOptionToggle = (option) => {
    const currentOptions = storyData.mediaOptions;
    
    if (currentOptions.includes(option)) {
      setStoryData({
        ...storyData,
        mediaOptions: currentOptions.filter(o => o !== option)
      });
    } else {
      setStoryData({
        ...storyData,
        mediaOptions: [...currentOptions, option]
      });
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Choose your universe type
            </Typography>
            <FormControl fullWidth sx={{ mb: 4 }}>
              <InputLabel>Universe Type</InputLabel>
              <Select
                value={storyData.universeType}
                label="Universe Type"
                onChange={handleUniverseTypeChange}
              >
                {universes.map((universe) => (
                  <MenuItem key={universe.id} value={universe.id}>
                    {universe.name} - {universe.description}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {storyData.universeType && (
              <>
                <Typography variant="h6" gutterBottom>
                  Select {storyData.universeType === 1 ? 'a universe' : 'universes'}
                </Typography>
                <Grid container spacing={2}>
                  {availableUniverses.map((universe) => (
                    <Grid item xs={6} sm={4} md={2} key={universe.id}>
                      <Card 
                        sx={{ 
                          border: storyData.selectedUniverses.some(u => u.id === universe.id) 
                            ? '2px solid #2196f3' 
                            : '2px solid transparent',
                          height: '100%'
                        }}
                        onClick={() => handleUniverseSelection(universe.id)}
                      >
                        <CardActionArea>
                          <CardMedia
                            component="img"
                            height="100"
                            image={universe.image}
                            alt={universe.name}
                          />
                          <CardContent sx={{ p: 1 }}>
                            <Typography variant="body2" align="center">
                              {universe.name}
                            </Typography>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Choose your main character
            </Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {characters
                .filter(character => 
                  storyData.selectedUniverses.length === 0 || 
                  storyData.selectedUniverses.some(u => u.name === character.universe)
                )
                .map((character) => (
                  <Grid item xs={6} sm={4} md={2} key={character.id}>
                    <Card 
                      sx={{ 
                        border: storyData.mainCharacter?.id === character.id 
                          ? '2px solid #2196f3' 
                          : '2px solid transparent',
                        height: '100%'
                      }}
                      onClick={() => handleCharacterSelection(character, 'main')}
                    >
                      <CardActionArea>
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
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom>
              Select supporting characters
            </Typography>
            <Grid container spacing={2}>
              {characters
                .filter(character => 
                  character.id !== storyData.mainCharacter?.id &&
                  (storyData.selectedUniverses.length === 0 || 
                   storyData.selectedUniverses.some(u => u.name === character.universe))
                )
                .map((character) => (
                  <Grid item xs={6} sm={4} md={2} key={character.id}>
                    <Card 
                      sx={{ 
                        border: storyData.supportingCharacters.some(c => c.id === character.id)
                          ? '2px solid #2196f3' 
                          : '2px solid transparent',
                        height: '100%'
                      }}
                      onClick={() => handleCharacterSelection(character, 'supporting')}
                    >
                      <CardActionArea>
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
                            {character.universe} - {character.type}
                          </Typography>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Choose a story theme
            </Typography>
            <Grid container spacing={2}>
              {themes.map((theme) => (
                <Grid item xs={12} sm={6} md={4} key={theme.id}>
                  <Card 
                    sx={{ 
                      border: storyData.theme === theme.id 
                        ? '2px solid #2196f3' 
                        : '2px solid transparent',
                      height: '100%',
                      cursor: 'pointer'
                    }}
                    onClick={() => setStoryData({...storyData, theme: theme.id})}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {theme.name}
                      </Typography>
                      <Typography variant="body2">
                        {theme.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Choose a moral lesson
            </Typography>
            <Grid container spacing={2}>
              {morals.map((moral) => (
                <Grid item xs={12} sm={6} md={4} key={moral.id}>
                  <Card 
                    sx={{ 
                      border: storyData.moral === moral.id 
                        ? '2px solid #2196f3' 
                        : '2px solid transparent',
                      height: '100%',
                      cursor: 'pointer'
                    }}
                    onClick={() => setStoryData({...storyData, moral: moral.id})}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {moral.name}
                      </Typography>
                      <Typography variant="body2">
                        {moral.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );
      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Customize your story
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Child's Name (for personalization)"
                  name="childName"
                  value={storyData.childName}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Age Group</InputLabel>
                  <Select
                    value={storyData.ageGroup}
                    name="ageGroup"
                    label="Age Group"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="3-5">3-5 years</MenuItem>
                    <MenuItem value="6-8">6-8 years</MenuItem>
                    <MenuItem value="9-12">9-12 years</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Reading Level</InputLabel>
                  <Select
                    value={storyData.readingLevel}
                    name="readingLevel"
                    label="Reading Level"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="beginner">Beginner</MenuItem>
                    <MenuItem value="intermediate">Intermediate</MenuItem>
                    <MenuItem value="advanced">Advanced</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Story Length</InputLabel>
                  <Select
                    value={storyData.storyLength}
                    name="storyLength"
                    label="Story Length"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="bedtime">Bedtime Short (5-7 minutes)</MenuItem>
                    <MenuItem value="chapter">Chapter Adventure</MenuItem>
                    <MenuItem value="mini-epic">Mini Epic</MenuItem>
                    <MenuItem value="series">Series Creator</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  Media Options
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {['Illustrated Storybook', 'Audio Narration', 'Character Voice Matching', 'Background Music', 'Interactive Elements', 'Print-Ready Format'].map((option) => (
                    <Chip
                      key={option}
                      label={option}
                      onClick={() => handleMediaOptionToggle(option)}
                      color={storyData.mediaOptions.includes(option) ? "primary" : "default"}
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Create Your Story
      </Typography>
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        {getStepContent(activeStep)}
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
        >
          {activeStep === steps.length - 1 ? 'Create Story' : 'Next'}
        </Button>
      </Box>
    </Box>
  );
};

export default StoryCreator;
