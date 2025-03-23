import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Grid, 
  Link, 
  Divider,
  InputAdornment,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  FormControlLabel,
  Checkbox,
  Alert
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Google as GoogleIcon, 
  Facebook as FacebookIcon 
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

const steps = ['Account Information', 'Parent Details', 'Preferences'];

const Register = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    childrenCount: '',
    agreeTerms: false,
    receiveUpdates: false
  });
  const [errors, setErrors] = useState({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const navigate = useNavigate();

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear errors when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 0) {
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      }
      
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else if (step === 1) {
      if (!formData.firstName) {
        newErrors.firstName = 'First name is required';
      }
      
      if (!formData.lastName) {
        newErrors.lastName = 'Last name is required';
      }
      
      if (!formData.childrenCount) {
        newErrors.childrenCount = 'Please enter the number of children';
      }
    } else if (step === 2) {
      if (!formData.agreeTerms) {
        newErrors.agreeTerms = 'You must agree to the terms and conditions';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateStep(activeStep)) {
      // Simulate registration - in a real app, this would call an API
      setRegistrationSuccess(true);
      
      // Redirect to login after a delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  };

  const handleGoogleSignup = () => {
    // In a real app, this would initiate Google OAuth
    alert('Google signup would be initiated here');
  };

  const handleFacebookSignup = () => {
    // In a real app, this would initiate Facebook OAuth
    alert('Facebook signup would be initiated here');
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <>
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              error={!!errors.email}
              helperText={errors.email}
              required
            />
            
            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              error={!!errors.password}
              helperText={errors.password}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              margin="normal"
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              required
            />
          </>
        );
      case 1:
        return (
          <>
            <TextField
              fullWidth
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              margin="normal"
              error={!!errors.firstName}
              helperText={errors.firstName}
              required
            />
            
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              margin="normal"
              error={!!errors.lastName}
              helperText={errors.lastName}
              required
            />
            
            <TextField
              fullWidth
              label="Number of Children"
              name="childrenCount"
              type="number"
              value={formData.childrenCount}
              onChange={handleChange}
              margin="normal"
              error={!!errors.childrenCount}
              helperText={errors.childrenCount}
              required
              InputProps={{ inputProps: { min: 1 } }}
            />
          </>
        );
      case 2:
        return (
          <>
            <Typography variant="subtitle1" gutterBottom>
              Almost done! Just a few more preferences:
            </Typography>
            
            <FormControlLabel
              control={
                <Checkbox
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  color="primary"
                />
              }
              label="I agree to the Terms of Service and Privacy Policy"
            />
            {errors.agreeTerms && (
              <Typography color="error" variant="caption">
                {errors.agreeTerms}
              </Typography>
            )}
            
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="receiveUpdates"
                    checked={formData.receiveUpdates}
                    onChange={handleChange}
                    color="primary"
                  />
                }
                label="I would like to receive updates about new features and stories (optional)"
              />
            </Box>
          </>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Grid container justifyContent="center">
      <Grid item xs={12} sm={8} md={6}>
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            Create Account
          </Typography>
          
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Join StoryVerse to create personalized stories for your children
          </Typography>
          
          {registrationSuccess ? (
            <Alert severity="success" sx={{ mb: 3 }}>
              Registration successful! Redirecting to login page...
            </Alert>
          ) : (
            <>
              <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              
              <form onSubmit={activeStep === steps.length - 1 ? handleSubmit : handleNext}>
                {getStepContent(activeStep)}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    type={activeStep === steps.length - 1 ? 'submit' : 'button'}
                    onClick={activeStep === steps.length - 1 ? undefined : handleNext}
                  >
                    {activeStep === steps.length - 1 ? 'Create Account' : 'Next'}
                  </Button>
                </Box>
              </form>
              
              {activeStep === 0 && (
                <>
                  <Divider sx={{ my: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      OR
                    </Typography>
                  </Divider>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<GoogleIcon />}
                    onClick={handleGoogleSignup}
                    sx={{ mb: 2 }}
                  >
                    Sign up with Google
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FacebookIcon />}
                    onClick={handleFacebookSignup}
                  >
                    Sign up with Facebook
                  </Button>
                </>
              )}
            </>
          )}
          
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login">
                Log in
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Register;
