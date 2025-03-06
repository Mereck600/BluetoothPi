import React, { useEffect } from 'react';
import { Box, Button, Card, Typography, Grid, Drawer, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import ColorPicker from "./ColorPicker";
import FileUpload from "./FileUpload";
import MusicPlayer from "./MusicPlayer";
import VolumeControl from './VolumeControl';
// Animation for motion components
const animationVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function Dashboard({ toggleTheme }) {
  useEffect(() => {
    // Check if the URL contains a 'token' query parameter and store it in localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');  // Get the token from URL

    if (token) {
      // Store the token in localStorage
      localStorage.setItem('spotify_token', token);
      console.log('Token stored in localStorage');
    }
  }, []);  // Empty dependency array means this will run once when the component mounts

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
          },
        }}
      >
        <Typography variant="h6" sx={{ p: 2 }}>Control Panel</Typography>
        <Button onClick={toggleTheme} sx={{ m: 2 }}>Toggle Dark Mode</Button>
        <Button onClick={toggleTheme} sx={{ m: 2 }}>Logout</Button>
      </Drawer>

      {/* Main Content Wrapper (Centered Vertically & Horizontally) */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          textAlign: 'center',
          px: 3 
        }}
      >
        {/* About Section */}
        <Paper elevation={3} sx={{ p: 2, mb: 4, backgroundColor: '#1E1E1E', color: '#ffffff' }}>
          <motion.div initial="initial" animate="animate" variants={animationVariants}>
            <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 2 }}>
              Pi Control Panel
            </Typography>
          </motion.div>
        </Paper>  

        {/* Cards Section */}
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} sm={4}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h6">File Upload</Typography>
              {/* File upload component here */}
              <FileUpload />
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h6">Music Controls</Typography>
              <MusicPlayer/>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h6">NeoPixel Controls</Typography>
              {/* NeoPixel component here */}
              <ColorPicker />
            </Card>

          </Grid>
          
        </Grid>
        <Grid item xs={12} sm={4}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h6">Volume Control</Typography>
              {/* File upload component here */}
              <VolumeControl />
            </Card>
          </Grid>
      </Box>
    </Box>
  );
}

export default Dashboard;
