import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  CardActions,
  Container,
  Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const universes = [
  { 
    id: 1, 
    name: 'Dragon Ball', 
    image: 'https://via.placeholder.com/300x200?text=Dragon+Ball',
    description: 'Join Goku and friends in exciting adventures with powerful martial arts and energy blasts.'
  },
  { 
    id: 2, 
    name: 'Ninja Turtles', 
    image: 'https://via.placeholder.com/300x200?text=Ninja+Turtles',
    description: 'Team up with the pizza-loving turtle heroes who protect the city from evil.'
  },
  { 
    id: 3, 
    name: 'Futurama', 
    image: 'https://via.placeholder.com/300x200?text=Futurama',
    description: 'Travel to the year 3000 with Fry, Leela, and Bender for futuristic fun.'
  },
  { 
    id: 4, 
    name: 'Toy Story', 
    image: 'https://via.placeholder.com/300x200?text=Toy+Story',
    description: 'Experience the secret life of toys with Woody, Buzz, and their friends.'
  },
  { 
    id: 5, 
    name: 'Lion King', 
    image: 'https://via.placeholder.com/300x200?text=Lion+King',
    description: 'Roam the Pride Lands with Simba and discover what it means to be a true king.'
  },
  { 
    id: 6, 
    name: 'Monsters Inc', 
    image: 'https://via.placeholder.com/300x200?text=Monsters+Inc',
    description: 'Meet friendly monsters Sulley and Mike as they discover the power of laughter.'
  }
];

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Hero Section */}
      <Paper 
        sx={{ 
          position: 'relative',
          backgroundColor: 'grey.800',
          color: '#fff',
          mb: 4,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundImage: 'url(https://via.placeholder.com/1200x400?text=StoryVerse)',
          p: 6
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            left: 0,
            backgroundColor: 'rgba(0,0,0,.3)',
          }}
        />
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography component="h1" variant="h2" color="inherit" gutterBottom>
            Create Custom Tales for Kids
          </Typography>
          <Typography variant="h5" color="inherit" paragraph>
            Combine characters, settings, and themes from your child's favorite universes to create personalized stories with meaningful lessons.
          </Typography>
          <Button variant="contained" size="large" onClick={() => navigate('/create')}>
            Start Creating
          </Button>
        </Container>
      </Paper>

      {/* Featured Universes */}
      <Container maxWidth="lg">
        <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 4 }}>
          Featured Universes
        </Typography>
        <Grid container spacing={4}>
          {universes.map((universe) => (
            <Grid item key={universe.id} xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
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
                  image={universe.image}
                  alt={universe.name}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h2">
                    {universe.name}
                  </Typography>
                  <Typography>
                    {universe.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => navigate('/characters', { state: { universe: universe.id } })}>
                    Explore Characters
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* How It Works */}
        <Box sx={{ my: 8 }}>
          <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 4 }}>
            How It Works
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Box sx={{ 
                  backgroundColor: 'primary.main', 
                  color: 'white', 
                  width: 60, 
                  height: 60, 
                  borderRadius: '50%', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  margin: '0 auto',
                  mb: 2,
                  fontSize: 24,
                  fontWeight: 'bold'
                }}>
                  1
                </Box>
                <Typography variant="h6" gutterBottom>Choose Characters & Settings</Typography>
                <Typography>
                  Select characters from different universes and decide where your story will take place.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Box sx={{ 
                  backgroundColor: 'primary.main', 
                  color: 'white', 
                  width: 60, 
                  height: 60, 
                  borderRadius: '50%', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  margin: '0 auto',
                  mb: 2,
                  fontSize: 24,
                  fontWeight: 'bold'
                }}>
                  2
                </Box>
                <Typography variant="h6" gutterBottom>Pick a Theme & Moral</Typography>
                <Typography>
                  Choose a story theme and the moral lesson you want your child to learn.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Box sx={{ 
                  backgroundColor: 'primary.main', 
                  color: 'white', 
                  width: 60, 
                  height: 60, 
                  borderRadius: '50%', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  margin: '0 auto',
                  mb: 2,
                  fontSize: 24,
                  fontWeight: 'bold'
                }}>
                  3
                </Box>
                <Typography variant="h6" gutterBottom>Generate Your Story</Typography>
                <Typography>
                  Our AI creates a personalized story with text, illustrations, and optional audio narration.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Call to Action */}
        <Box sx={{ my: 8, textAlign: 'center' }}>
          <Typography variant="h4" component="h2" gutterBottom>
            Ready to Create Your Child's Next Favorite Story?
          </Typography>
          <Button 
            variant="contained" 
            size="large" 
            onClick={() => navigate('/create')}
            sx={{ mt: 2 }}
          >
            Start Creating Now
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage;
