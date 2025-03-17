import React, { useEffect } from 'react';
import { Box, Button, Card, Typography, Drawer, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import ColorPicker from "./ColorPicker";
import FileUpload from "./FileUpload";
import MusicPlayer from "./MusicPlayer";
import VolumeControl from './VolumeControl';
import SpotifyPlayer from 'react-spotify-web-playback';

// Animation for motion components
const animationVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function Dashboard({ toggleTheme }) {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const refreshToken = urlParams.get('refreshToken');
  
    if (token) {
      localStorage.setItem('spotify_token', token);
      console.log('Access token stored in localStorage');
    }
  
    if (refreshToken) {
      localStorage.setItem('spotify_refresh_token', refreshToken);
      console.log('Refresh token stored in localStorage');
    }
    if(!refreshToken){
      console.log("No refresh token found");
    }
  }, []);

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
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
        <Button href='/' sx={{ m: 2 }}>Logout</Button>
      </Drawer>

      {/* Main Content Wrapper (Vertically Stacked Items) */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'flex-start', 
          textAlign: 'center',
          px: 3,
          py: 3,
          overflowY: 'auto',
          height: '100vh',
          gap: 2
        }}
      >
        {/* About Section */}
        <Paper elevation={3} sx={{ p: 3, backgroundColor: '#1E1E1E', color: '#ffffff', width: '90%', maxWidth: 600, mb: 3 }}>
          <motion.div initial="initial" animate="animate" variants={animationVariants}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
              Pi Control Panel
            </Typography>
          </motion.div>
        </Paper>  

        {/* Cards Section */}
        <Card sx={{ p: 3, width: '90%', maxWidth: 600, mb: 3, minHeight: 350, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="h6">File Upload</Typography>
          <FileUpload />
        </Card>

        <Card sx={{ p: 3, width: '90%', maxWidth: 600, mb: 3, minHeight: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="h6">Music Controls</Typography>
          <MusicPlayer/>
        </Card>

        <Card sx={{ p: 3, width: '90%', maxWidth: 600, mb: 3, minHeight: 600, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="h6">NeoPixel Controls</Typography>
          <ColorPicker />
        </Card>

        <Card sx={{ p: 3, width: '90%', maxWidth: 600, mb: 3, minHeight: 350, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="h6">Volume Control</Typography>
          <VolumeControl />
        </Card>
      </Box>
    </Box>
  );
}

export default Dashboard;
