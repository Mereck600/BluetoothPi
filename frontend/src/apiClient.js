import axios from "axios";

const CLIENT_ID = "24c09368d3394fec8a58788383ff9d60";
const CLIENT_SECRET = "6d7b743de51b4e0498c0ce3943ba4ba3";
const REFRESH_TOKEN = "your_refresh_token"; // Store securely, do not hardcode in production

let accessToken = "your_initial_access_token"; // Update with new token when refreshed

const apiClient = axios.create({
  baseURL: "https://api.spotify.com/v1/",
  headers: {
    "Content-Type": "application/json",
  },
});

// Function to refresh the token
const refreshAccessToken = async () => {
  try {
    const response = await axios.post("https://accounts.spotify.com/api/token", 
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: REFRESH_TOKEN,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    
    accessToken = response.data.access_token;
    console.log("New Access Token:", accessToken);
    
    return accessToken;
  } catch (error) {
    console.error("Error refreshing token:", error.response?.data || error.message);
    throw error;
  }
};

// Axios request wrapper with auto-refresh
const spotifyRequest = async (url, method = "GET") => {
  try {
    const response = await apiClient({
      url,
      method,
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log("Access token expired. Refreshing...");
      accessToken = await refreshAccessToken();
      
      // Retry the request with the new token
      return spotifyRequest(url, method);
    } else {
      throw error;
    }
  }
};





export const getCurrentSong = async (token) => {
  try {
    console.log("Sending token:", token);  // Add this line to debug
    const response = await apiClient.get("/current_song", {
      headers: {
        Authorization: `Bearer ${token}`, // Ensure token is sent
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching current song:", error);
    throw error;
  }
};

