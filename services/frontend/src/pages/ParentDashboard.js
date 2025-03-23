import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Button, 
  Tabs, 
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Switch,
  FormControlLabel,
  Slider,
  TextField,
  InputAdornment,
  IconButton,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon, 
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Sample data for saved stories
const savedStories = [
  {
    id: '12345',
    title: 'Goku and Woody's Space Adventure',
    createdAt: '2023-05-15T14:30:00Z',
    universes: ['Dragon Ball', 'Toy Story'],
    theme: 'Adventure Quest',
    moral: 'Friendship & Teamwork',
    childName: 'Emma',
    ageGroup: '6-8',
    thumbnail: 'https://via.placeholder.com/300x200?text=Story+1'
  },
  {
    id: '12346',
    title: 'Leonardo and Simba Save the Day',
    createdAt: '2023-05-10T09:15:00Z',
    universes: ['Ninja Turtles', 'Lion King'],
    theme: 'Helping Others',
    moral: 'Courage & Bravery',
    childName: 'Noah',
    ageGroup: '6-8',
    thumbnail: 'https://via.placeholder.com/300x200?text=Story+2'
  },
  {
    id: '12347',
    title: 'Bender and Mike's Mischief',
    createdAt: '2023-05-05T16:45:00Z',
    universes: ['Futurama', 'Monsters Inc'],
    theme: 'Mystery Solving',
    moral: 'Honesty & Truth',
    childName: 'Olivia',
    ageGroup: '9-12',
    thumbnail: 'https://via.placeholder.com/300x200?text=Story+3'
  }
];

// Sample data for child profiles
const childProfiles = [
  {
    id: 1,
    name: 'Emma',
    age: 7,
    readingLevel: 'Intermediate',
    favoriteUniverses: ['Toy Story', 'Lion King'],
    contentFilters: {
      maxComplexity: 3,
      allowScaryContent: false,
      allowSadEndings: false
    }
  },
  {
    id: 2,
    name: 'Noah',
    age: 8,
    readingLevel: 'Advanced',
    favoriteUniverses: ['Dragon Ball', 'Ninja Turtles'],
    contentFilters: {
      maxComplexity: 4,
      allowScaryContent: true,
      allowSadEndings: false
    }
  },
  {
    id: 3,
    name: 'Olivia',
    age: 10,
    readingLevel: 'Advanced',
    favoriteUniverses: ['Futurama', 'Monsters Inc'],
    contentFilters: {
      maxComplexity: 5,
      allowScaryContent: true,
      allowSadEndings: true
    }
  }
];

// Sample usage statistics
const usageStats = {
  totalStories: 15,
  thisMonth: 5,
  favoriteUniverse: 'Toy Story',
  favoriteTheme: 'Adventure Quest',
  favoriteMoral: 'Friendship & Teamwork',
  averageLength: 'Bedtime Short',
  mostUsedCharacters: ['Woody', 'Goku', 'Leonardo']
};

const ParentDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleViewStory = (storyId) => {
    navigate('/preview', { state: { storyId } });
  };

  const handleDeleteStory = (storyId) => {
    // In a real app, this would delete the story
    alert(`Deleting story ${storyId}`);
  };

  const handleEditProfile = (profile) => {
    setSelectedProfile(profile);
    setEditedProfile({...profile});
    setEditMode(true);
  };

  const handleProfileChange = (field, value) => {
    setEditedProfile({
      ...editedProfile,
      [field]: value
    });
  };

  const handleContentFilterChange = (filter, value) => {
    setEditedProfile({
      ...editedProfile,
      contentFilters: {
        ...editedProfile.contentFilters,
        [filter]: value
      }
    });
  };

  const handleSaveProfile = () => {
    // In a real app, this would save the profile changes
    setSelectedProfile(editedProfile);
    setEditMode(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedProfile(null);
  };

  const handleCreateProfile = () => {
    // In a real app, this would open a form to create a new profile
    alert('Creating new child profile');
  };

  const filteredStories = savedStories.filter(story => 
    story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    story.universes.some(universe => universe.toLowerCase().includes(searchTerm.toLowerCase())) ||
    story.childName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Parent Dashboard
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
          <Tab label="Saved Stories" />
          <Tab label="Child Profiles" />
          <Tab label="Usage Statistics" />
          <Tab label="Settings" />
        </Tabs>
      </Box>
      
      {/* Saved Stories Tab */}
      {tabValue === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <TextField
              placeholder="Search stories..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 300 }}
            />
            <Button 
              variant="contained" 
              onClick={() => navigate('/create')}
            >
              Create New Story
            </Button>
          </Box>
          
          {filteredStories.length > 0 ? (
            <Grid container spacing={3}>
              {filteredStories.map((story) => (
                <Grid item key={story.id} xs={12} sm={6} md={4}>
                  <Card>
                    <CardMedia
                      component="img"
                      height="160"
                      image={story.thumbnail}
                      alt={story.title}
                    />
                    <CardContent>
                      <Typography gutterBottom variant="h6" component="div">
                        {story.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Created for: {story.childName} ({story.ageGroup})
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Universes: {story.universes.join(', ')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Theme: {story.theme}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Created: {new Date(story.createdAt).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewStory(story.id)}
                      >
                        View
                      </Button>
                      <Button 
                        size="small" 
                        startIcon={<DownloadIcon />}
                      >
                        Download
                      </Button>
                      <Button 
                        size="small" 
                        startIcon={<ShareIcon />}
                      >
                        Share
                      </Button>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteStory(story.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                No stories found
              </Typography>
              <Typography variant="body1" paragraph>
                {searchTerm ? 'Try a different search term.' : 'You haven\'t created any stories yet.'}
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => navigate('/create')}
              >
                Create Your First Story
              </Button>
            </Paper>
          )}
        </Box>
      )}
      
      {/* Child Profiles Tab */}
      {tabValue === 1 && (
        <Box>
          {saveSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Profile updated successfully!
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Child Profiles
            </Typography>
            <Button 
              variant="contained" 
              onClick={handleCreateProfile}
            >
              Add New Profile
            </Button>
          </Box>
          
          <Grid container spacing={3}>
            {childProfiles.map((profile) => (
              <Grid item key={profile.id} xs={12} md={6}>
                <Paper 
                  sx={{ 
                    p: 3,
                    border: selectedProfile?.id === profile.id ? '2px solid #2196f3' : 'none'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      {profile.name}
                    </Typography>
                    <Button 
                      startIcon={<EditIcon />}
                      onClick={() => handleEditProfile(profile)}
                    >
                      Edit
                    </Button>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Age:
                      </Typography>
                      <Typography variant="body1">
                        {profile.age} years
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Reading Level:
                      </Typography>
                      <Typography variant="body1">
                        {profile.readingLevel}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Favorite Universes:
                      </Typography>
                      <Typography variant="body1">
                        {profile.favoriteUniverses.join(', ')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Content Filters:
                      </Typography>
                      <Typography variant="body1">
                        Max Complexity: {profile.contentFilters.maxComplexity}/5
                      </Typography>
                      <Typography variant="body1">
                        Allow Scary Content: {profile.contentFilters.allowScaryContent ? 'Yes' : 'No'}
                      </Typography>
                      <Typography variant="body1">
                        Allow Sad Endings: {profile.contentFilters.allowSadEndings ? 'Yes' : 'No'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            ))}
          </Grid>
          
          {/* Edit Profile Modal */}
          {editMode && editedProfile && (
            <Paper sx={{ mt: 4, p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Edit Profile: {editedProfile.name}
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={editedProfile.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Age"
                    type="number"
                    value={editedProfile.age}
                    onChange={(e) => handleProfileChange('age', parseInt(e.target.value))}
                    margin="normal"
                    InputProps={{ inputProps: { min: 3, max: 12 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Reading Level"
                    value={editedProfile.readingLevel}
                    onChange={(e) => handleProfileChange('readingLevel', e.target.value)}
                    margin="normal"
                    SelectProps={{
                      native: true,
                    }}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </TextField>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Content Filters
                  </Typography>
                  <Typography gutterBottom>
                    Story Complexity: {editedProfile.contentFilters.maxComplexity}
                  </Typography>
                  <Slider
                    value={editedProfile.contentFilters.maxComplexity}
                    onChange={(e, newValue) => handleContentFilterChange('maxComplexity', newValue)}
                    step={1}
                    marks
                    min={1}
                    max={5}
                    valueLabelDisplay="auto"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editedProfile.contentFilters.allowScaryContent}
                        onChange={(e) => handleContentFilterChange('allowScaryContent', e.target.checked)}
                      />
                    }
                    label="Allow Scary Content"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editedProfile.contentFilters.allowSadEndings}
                        onChange={(e) => handleContentFilterChange('allowSadEndings', e.target.checked)}
                      />
                    }
                    label="Allow Sad Endings"
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button variant="outlined" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button variant="contained" onClick={handleSaveProfile}>
                  Save Changes
                </Button>
              </Box>
            </Paper>
          )}
        </Box>
      )}
      
      {/* Usage Statistics Tab */}
      {tabValue === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Usage Statistics
            </Typography>
            <Button 
              startIcon={<RefreshIcon />}
              onClick={() => alert('Refreshing statistics...')}
            >
              Refresh
            </Button>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Story Creation
                </Typography>
                <TableContainer>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell>Total Stories Created</TableCell>
                        <TableCell align="right">{usageStats.totalStories}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Stories Created This Month</TableCell>
                        <TableCell align="right">{usageStats.thisMonth}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Favorite Universe</TableCell>
                        <TableCell align="right">{usageStats.favoriteUniverse}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Favorite Theme</TableCell>
                        <TableCell align="right">{usageStats.favoriteTheme}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Favorite Moral Lesson</TableCell>
                        <TableCell align="right">{usageStats.favoriteMoral}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Average Story Length</TableCell>
                        <TableCell align="right">{usageStats.averageLength}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Most Used Characters
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Character</TableCell>
                        <TableCell align="right">Times Used</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {usageStats.mostUsedCharacters.map((character, index) => (
                        <TableRow key={character}>
                          <TableCell>{character}</TableCell>
                          <TableCell align="right">{10 - index * 2}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Story Creation by Child
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Child</TableCell>
                        <TableCell align="right">Stories Created</TableCell>
                        <TableCell align="right">Favorite Universe</TableCell>
                        <TableCell align="right">Favorite Theme</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {childProfiles.map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell>{profile.name}</TableCell>
                          <TableCell align="right">{Math.floor(Math.random() * 10) + 1}</TableCell>
                          <TableCell align="right">{profile.favoriteUniverses[0]}</TableCell>
                          <TableCell align="right">
                            {['Adventure Quest', 'Friendship Tale', 'Mystery Solving'][Math.floor(Math.random() * 3)]}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}
      
      {/* Settings Tab */}
      {tabValue === 3 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Account Settings
          </Typography>
          
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Notification Preferences
            </Typography>
            
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Email notifications for new features"
            />
            <br />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Story completion notifications"
            />
            <br />
            <FormControlLabel
              control={<Switch />}
              label="Marketing communications"
            />
          </Paper>
          
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Content Preferences
            </Typography>
            
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Always moderate generated content"
            />
            <br />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Apply age restrictions based on child profiles"
            />
            <br />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Allow crossover stories between universes"
            />
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Data & Privacy
            </Typography>
            
            <Button variant="outlined" sx={{ mr: 2 }}>
              Download My Data
            </Button>
            <Button variant="outlined" color="error">
              Delete Account
            </Button>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default ParentDashboard;
