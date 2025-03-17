import React, { useState, useEffect } from "react";
import { Button, Box, Typography, Paper } from "@mui/material";
import { getCurrentSong } from "./apiClient"; // Import the function that handles API requests
import SpotifyPlayer from "react-spotify-web-playback";

const MusicPlayer = () => {
  const [song, setSong] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState(""); // Hold the access token state

  // Extract token from URL or localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      console.log("Extracted Token:", token);
      localStorage.setItem("authToken", token); // Store the token
      setAccessToken(token); // Update access token state
      setIsAuthenticated(true);
      window.history.replaceState({}, document.title, "/"); // Clean URL
    } else {
      const storedToken = localStorage.getItem("authToken");
      if (storedToken) {
        console.log("Stored Token:", storedToken);
        setAccessToken(storedToken); // Use the stored token
        setIsAuthenticated(true);
      }
    }
  }, []);

  const fetchSong = async () => {
    try {
      const data = await getCurrentSong(); // API call to get current song
      setSong(data); // Set the fetched song
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Token is expired or invalid
        console.log("Token expired or invalid. Redirecting to login...");
        localStorage.removeItem("authToken"); // Clear the expired token
        setIsAuthenticated(false); // Set authentication state to false
      }
      console.error("Error fetching current song:", error);
    }
  };

  // Check authentication & fetch song when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchSong(); // Fetch song only if the user is authenticated
    }
  }, [isAuthenticated]); // Dependency on authentication status

  // Login to Spotify
  const handleLogin = () => {
    window.location.href = "http://localhost:8000/spotify_login"; // Redirect to backend for login
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Paper sx={{ padding: 2, textAlign: "center" }} elevation={3}>
          <Typography variant="h6">Please log in to Spotify</Typography>
          <Button variant="contained" onClick={handleLogin}>
            Log in with Spotify
          </Button>
        </Paper>
      </Box>
    );
  }

  if (!song) return <div>
    <iframe width="560" height="315" 
    src="https://www.youtube.com/embed/jfKfPfyJRdk?si=YUJFPfgjw6_-kzhJ" 
    title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
     referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
  </div>; // Show loading until song is fetched

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Paper sx={{ padding: 2, textAlign: "center" }} elevation={3}>
        <img src={song.album_cover} alt={song.name} width={200} />
        <Typography variant="h6">{song.name}</Typography>
        <Typography variant="body1">{song.artist}</Typography>
        
        {/* Spotify Web Playback Component */}
        {/* <SpotifyPlayer
          token={accessToken} // Pass the Spotify token
          uris={[song.uri]} // Pass the song URI
          play={true} // Start playing the song
          callback={(state) => {
            if (state?.error) {
              console.error("Error playing song:", state.error);
            }
          }}
        /> */}

        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 2 }}>
          <Button variant="contained" onClick={() => { /* Implement play functionality */ }}>Play</Button>
          <Button variant="contained" onClick={() => { /* Implement pause functionality */ }}>Pause</Button>
          <Button variant="contained" onClick={() => { /* Implement skip functionality */ }}>Skip</Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default MusicPlayer;
