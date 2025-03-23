import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  CardActions,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import { Search as SearchIcon, Favorite, FavoriteBorder } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

// Sample character data
const characterData = [
  // Dragon Ball
  { 
    id: 1, 
    name: 'Goku', 
    universe: 'Dragon Ball', 
    type: 'Hero', 
    image: 'https://via.placeholder.com/300x200?text=Goku',
    description: 'A Saiyan warrior with incredible strength and a pure heart. Goku is always looking for the next challenge to become stronger.',
    abilities: ['Kamehameha', 'Super Saiyan', 'Instant Transmission'],
    traits: ['Brave', 'Kind', 'Determined']
  },
  { 
    id: 2, 
    name: 'Vegeta', 
    universe: 'Dragon Ball', 
    type: 'Rival', 
    image: 'https://via.placeholder.com/300x200?text=Vegeta',
    description: 'The proud prince of the Saiyans who constantly strives to surpass Goku. Despite his initial antagonism, he becomes a valuable ally.',
    abilities: ['Final Flash', 'Super Saiyan', 'Galick Gun'],
    traits: ['Proud', 'Determined', 'Strategic']
  },
  { 
    id: 3, 
    name: 'Piccolo', 
    universe: 'Dragon Ball', 
    type: 'Mentor', 
    image: 'https://via.placeholder.com/300x200?text=Piccolo',
    description: 'A wise Namekian warrior who started as an enemy but became one of Goku\'s closest allies and a mentor to Gohan.',
    abilities: ['Special Beam Cannon', 'Regeneration', 'Stretching Limbs'],
    traits: ['Wise', 'Calm', 'Protective']
  },
  
  // Ninja Turtles
  { 
    id: 4, 
    name: 'Leonardo', 
    universe: 'Ninja Turtles', 
    type: 'Hero', 
    image: 'https://via.placeholder.com/300x200?text=Leonardo',
    description: 'The leader of the Ninja Turtles who wields two katana swords. Leonardo is disciplined and dedicated to his ninja training.',
    abilities: ['Swordsmanship', 'Leadership', 'Strategic Planning'],
    traits: ['Disciplined', 'Loyal', 'Responsible']
  },
  { 
    id: 5, 
    name: 'Raphael', 
    universe: 'Ninja Turtles', 
    type: 'Hero', 
    image: 'https://via.placeholder.com/300x200?text=Raphael',
    description: 'The hot-headed member of the team who uses sai as his weapons. Raphael is tough and has a strong sense of justice.',
    abilities: ['Sai Fighting', 'Strength', 'Intimidation'],
    traits: ['Brave', 'Passionate', 'Protective']
  },
  { 
    id: 6, 
    name: 'Splinter', 
    universe: 'Ninja Turtles', 
    type: 'Mentor', 
    image: 'https://via.placeholder.com/300x200?text=Splinter',
    description: 'The wise rat sensei who trained the turtles in the art of ninjutsu. Splinter is a patient teacher and father figure.',
    abilities: ['Martial Arts Mastery', 'Wisdom', 'Heightened Senses'],
    traits: ['Wise', 'Patient', 'Protective']
  },
  
  // Futurama
  { 
    id: 7, 
    name: 'Fry', 
    universe: 'Futurama', 
    type: 'Hero', 
    image: 'https://via.placeholder.com/300x200?text=Fry',
    description: 'A pizza delivery boy from the 20th century who was accidentally frozen and woke up in the year 3000.',
    abilities: ['Adaptability', 'Luck', 'Immunity to Mind Reading'],
    traits: ['Loyal', 'Optimistic', 'Naive']
  },
  { 
    id: 8, 
    name: 'Leela', 
    universe: 'Futurama', 
    type: 'Hero', 
    image: 'https://via.placeholder.com/300x200?text=Leela',
    description: 'The one-eyed captain of the Planet Express ship. Leela is tough, capable, and often the voice of reason.',
    abilities: ['Martial Arts', 'Piloting', 'Marksmanship'],
    traits: ['Strong', 'Independent', 'Compassionate']
  },
  { 
    id: 9, 
    name: 'Bender', 
    universe: 'Futurama', 
    type: 'Sidekick', 
    image: 'https://via.placeholder.com/300x200?text=Bender',
    description: 'A foul-mouthed, heavy-drinking robot with a penchant for theft and mischief, but also a loyal friend.',
    abilities: ['Bending Metal', 'Extending Limbs', 'Survival in Extreme Conditions'],
    traits: ['Rebellious', 'Selfish', 'Surprisingly Loyal']
  },
  
  // Toy Story
  { 
    id: 10, 
    name: 'Woody', 
    universe: 'Toy Story', 
    type: 'Hero', 
    image: 'https://via.placeholder.com/300x200?text=Woody',
    description: 'A pull-string cowboy doll who is the leader of the toys in Andy\'s room. Woody is loyal and will do anything for his friends.',
    abilities: ['Leadership', 'Quick Thinking', 'Lasso Skills'],
    traits: ['Loyal', 'Responsible', 'Caring']
  },
  { 
    id: 11, 
    name: 'Buzz Lightyear', 
    universe: 'Toy Story', 
    type: 'Hero', 
    image: 'https://via.placeholder.com/300x200?text=Buzz+Lightyear',
    description: 'A space ranger action figure who initially believed he was a real space hero. Buzz is brave and dedicated to his mission.',
    abilities: ['Flying (Falling with Style)', 'Laser (Light)', 'Strength'],
    traits: ['Brave', 'Dedicated', 'Honorable']
  },
  { 
    id: 12, 
    name: 'Jessie', 
    universe: 'Toy Story', 
    type: 'Hero', 
    image: 'https://via.placeholder.com/300x200?text=Jessie',
    description: 'A spirited cowgirl doll who is part of the Woody\'s Roundup gang. Jessie is energetic and adventurous.',
    abilities: ['Yodeling', 'Acrobatics', 'Horse Riding'],
    traits: ['Energetic', 'Brave', 'Emotional']
  }
];

const universes = [
  'All Universes',
  'Dragon Ball',
  'Ninja Turtles',
  'Futurama',
  'Toy Story',
  'Lion King',
  'Monsters Inc'
];

const characterTypes = [
  'All Types',
  'Hero',
  'Sidekick',
  'Rival',
  'Mentor',
  'Villain'
];

const CharacterSelection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [universeFilter, setUniverseFilter] = useState('All Universes');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [favorites, setFavorites] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  useEffect(() => {
    // Simulate loading character data
    const timer = setTimeout(() => {
      setCharacters(characterData);
      setLoading(false);
      
      // If a universe was passed in the location state, set it as the filter
      if (location.state && location.state.universe) {
        const universe = universes.find(u => u === location.state.universe) || 
                        universes.find(u => parseInt(u) === location.state.universe);
        if (universe) {
          setUniverseFilter(universe);
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [location.state]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleUniverseFilterChange = (event) => {
    setUniverseFilter(event.target.value);
  };

  const handleTypeFilterChange = (event) => {
    setTypeFilter(event.target.value);
  };

  const toggleFavorite = (characterId) => {
    if (favorites.includes(characterId)) {
      setFavorites(favorites.filter(id => id !== characterId));
    } else {
      setFavorites([...favorites, characterId]);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCharacterClick = (character) => {
    setSelectedCharacter(character);
  };

  const handleBackToList = () => {
    setSelectedCharacter(null);
  };

  const handleAddToStory = (character) => {
    // In a real app, this would add the character to the story creation process
    navigate('/create', { state: { selectedCharacter: character.id } });
  };

  const filteredCharacters = characters.filter(character => {
    const matchesSearch = character.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUniverse = universeFilter === 'All Universes' || character.universe === universeFilter;
    const matchesType = typeFilter === 'All Types' || character.type === typeFilter;
    return matchesSearch && matchesUniverse && matchesType;
  });

  const favoriteCharacters = characters.filter(character => favorites.includes(character.id));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (selectedCharacter) {
    return (
      <Box>
        <Button variant="outlined" onClick={handleBackToList} sx={{ mb: 2 }}>
          Back to Characters
        </Button>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <img 
              src={selectedCharacter.image} 
              alt={selectedCharacter.name} 
              style={{ width: '100%', borderRadius: 8 }}
            />
          </Grid>
          <Grid item xs={12} md={7}>
            <Typography variant="h4" component="h1" gutterBottom>
              {selectedCharacter.name}
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Chip label={selectedCharacter.universe} color="primary" sx={{ mr: 1 }} />
              <Chip label={selectedCharacter.type} />
            </Box>
            
            <Typography variant="body1" paragraph>
              {selectedCharacter.description}
            </Typography>
            
            <Typography variant="h6" gutterBottom>
              Abilities
            </Typography>
            <Box sx={{ mb: 2 }}>
              {selectedCharacter.abilities.map((ability, index) => (
                <Chip key={index} label={ability} variant="outlined" sx={{ mr: 1, mb: 1 }} />
              ))}
            </Box>
            
            <Typography variant="h6" gutterBottom>
              Character Traits
            </Typography>
            <Box sx={{ mb: 3 }}>
              {selectedCharacter.traits.map((trait, index) => (
                <Chip key={index} label={trait} variant="outlined" sx={{ mr: 1, mb: 1 }} />
              ))}
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="contained" 
                onClick={() => handleAddToStory(selectedCharacter)}
              >
                Add to Story
              </Button>
              <Button 
                variant="outlined" 
                startIcon={favorites.includes(selectedCharacter.id) ? <Favorite /> : <FavoriteBorder />}
                onClick={() => toggleFavorite(selectedCharacter.id)}
              >
                {favorites.includes(selectedCharacter.id) ? 'Remove from Favorites' : 'Add to Favorites'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Character Selection
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search Characters"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Universe</InputLabel>
              <Select
                value={universeFilter}
                label="Universe"
                onChange={handleUniverseFilterChange}
              >
                {universes.map((universe) => (
                  <MenuItem key={universe} value={universe}>
                    {universe}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Character Type</InputLabel>
              <Select
                value={typeFilter}
                label="Character Type"
                onChange={handleTypeFilterChange}
              >
                {characterTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>
      
      <Box sx={{ width: '100%', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="All Characters" />
          <Tab label={`Favorites (${favorites.length})`} />
        </Tabs>
      </Box>
      
      {tabValue === 0 ? (
        <Grid container spacing={3}>
          {filteredCharacters.length > 0 ? (
            filteredCharacters.map((character) => (
              <Grid item key={character.id} xs={12} sm={6} md={4}>
                <Card 
                  sx={{ 
                    height: '100%',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 6
                    }
                  }}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={character.image}
                    alt={character.name}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleCharacterClick(character)}
                  />
                  <CardContent>
                    <Typography gutterBottom variant="h6" component="div">
                      {character.name}
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                      <Chip label={character.universe} size="small" color="primary" sx={{ mr: 1 }} />
                      <Chip label={character.type} size="small" />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ height: 60, overflow: 'hidden' }}>
                      {character.description}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => handleCharacterClick(character)}>
                      Learn More
                    </Button>
                    <Button 
                      size="small" 
                      startIcon={favorites.includes(character.id) ? <Favorite color="primary" /> : <FavoriteBorder />}
                      onClick={() => toggleFavorite(character.id)}
                    >
                      {favorites.includes(character.id) ? 'Favorited' : 'Favorite'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          ) : (
            <Box sx={{ width: '100%', textAlign: 'center', py: 4 }}>
              <Typography variant="h6">
                No characters match your search criteria.
              </Typography>
            </Box>
          )}
        </Grid>
      ) : (
        <Grid container spacing={3}>
          {favoriteCharacters.length > 0 ? (
            favoriteCharacters.map((character) => (
              <Grid item key={character.id} xs={12} sm={6} md={4}>
                <Card 
                  sx={{ 
                    height: '100%',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 6
                    }
                  }}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={character.image}
                    alt={character.name}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleCharacterClick(character)}
                  />
                  <CardContent>
                    <Typography gutterBottom variant="h6" component="div">
                      {character.name}
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                      <Chip label={character.universe} size="small" color="primary" sx={{ mr: 1 }} />
                      <Chip label={character.type} size="small" />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ height: 60, overflow: 'hidden' }}>
                      {character.description}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => handleCharacterClick(character)}>
                      Learn More
                    </Button>
                    <Button 
                      size="small" 
                      startIcon={<Favorite color="primary" />}
                      onClick={() => toggleFavorite(character.id)}
                    >
                      Remove
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          ) : (
            <Box sx={{ width: '100%', textAlign: 'center', py: 4 }}>
              <Typography variant="h6">
                You haven't added any characters to your favorites yet.
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => setTabValue(0)}
                sx={{ mt: 2 }}
              >
                Browse Characters
              </Button>
            </Box>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default CharacterSelection;
