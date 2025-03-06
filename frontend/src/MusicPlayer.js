
import React, { useEffect, useState } from "react";
import { apiClient, getCurrentSong } from "./apiClient"; // Import API functions
import { Button, Box, Typography, Paper } from "@mui/material";

const MusicPlayer = () => {
  const [song, setSong] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Extract token from URL on first load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
  
    if (token) {
      console.log("Extracted Token:", token); // Debugging
      localStorage.setItem("authToken", token); // Store token in localStorage
      window.history.replaceState({}, document.title, "/"); // Remove token from URL
      setIsAuthenticated(true); // Set authenticated state
    } else {
      const storedToken = localStorage.getItem("authToken");
      if (storedToken) {
        console.log("Stored Token:", storedToken); // Debugging
        setIsAuthenticated(true); // User is authenticated if token exists
      }
    }
  }, []);

  const fetchSong = async () => {
    try {
      const token = localStorage.getItem("authToken"); // Retrieve token from localStorage
      if (!token) {
        console.log("No token found in localStorage");
        setIsAuthenticated(false);
        return;
      }
      console.log("Token being sent to backend:", token); // Debugging
      const data = await getCurrentSong(token); // API call to get current song
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

  if (!song) return <div>Loading...</div>; // Show loading until song is fetched

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Paper sx={{ padding: 2, textAlign: "center" }} elevation={3}>
        <img src={song.album_cover} alt={song.name} width={200} />
        <Typography variant="h6">{song.name}</Typography>
        <Typography variant="body1">{song.artist}</Typography>
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 2 }}>
          <Button variant="contained">Play</Button>
          <Button variant="contained">Pause</Button>
          <Button variant="contained">Skip</Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default MusicPlayer;
