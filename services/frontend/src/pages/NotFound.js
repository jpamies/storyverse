import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh'
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 500
        }}
      >
        <Typography variant="h1" sx={{ fontSize: '6rem', fontWeight: 'bold', color: 'primary.main' }}>
          404
        </Typography>
        
        <Typography variant="h4" gutterBottom>
          Page Not Found
        </Typography>
        
        <Typography variant="body1" align="center" paragraph>
          Oops! It seems like the page you're looking for has wandered off on its own adventure.
        </Typography>
        
        <Typography variant="body1" align="center" paragraph>
          Maybe it's exploring the Dragon Ball universe, or having tea with the characters from Toy Story.
        </Typography>
        
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={() => navigate('/')}>
            Go Home
          </Button>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default NotFound;
