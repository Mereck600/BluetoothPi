import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:8000", // Fixed URL (no HTTPS)
  headers: {
    "Content-Type": "application/json",
  },
});

// Function to get the token from localStorage
const getAuthToken = () => {
  return localStorage.getItem("authToken"); // Retrieve token from localStorage
};

// Function to get the refresh token from localStorage
const getRefreshToken = () => {
  return localStorage.getItem("refreshToken"); // Retrieve refresh token
};

// Function to set the new tokens in localStorage
const setTokens = (authToken, refreshToken) => {
  localStorage.setItem("authToken", authToken); // Save the access token
  localStorage.setItem("refreshToken", refreshToken); // Save the refresh token
};

// Function to refresh the access token
const refreshToken = async () => {
  try {
    const storedRefreshToken = getRefreshToken(); // Retrieve the refresh token
    if (!storedRefreshToken) {
      throw new Error("No refresh token available");
    }

    // Call the backend to refresh the token
    const response = await axios.post("http://localhost:8000/refresh_token", {
      refreshToken: storedRefreshToken,
    });

    const newAuthToken = response.data.accessToken; // Get new access token from response
    const newRefreshToken = response.data.refreshToken; // Get new refresh token from response

    // Save the new tokens
    setTokens(newAuthToken, newRefreshToken);

    return newAuthToken; // Return the new access token
  } catch (error) {
    console.error("Error refreshing token:", error);
    throw error; // Handle error (e.g., log out the user)
  }
};

// Axios request wrapper with auto-refresh
const spotifyRequest = async (url, method = "GET") => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No token available");
    }

    // Try making the request with the current token
    const response = await apiClient({
      url,
      method,
      headers: { Authorization: `Bearer ${token}` }, // Use the token from localStorage
    });

    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log("Access token expired. Refreshing...");

      // Try refreshing the token
      const newToken = await refreshToken();

      // Retry the original request with the new token
      const retryResponse = await apiClient({
        url,
        method,
        headers: { Authorization: `Bearer ${newToken}` }, // Use the new token
      });

      return retryResponse.data;
    } else {
      throw error; // Propagate other errors
    }
  }
};

// Fetch current song
export const getCurrentSong = async () => {
  try {
    const data = await spotifyRequest("/current_song");
    return data;
  } catch (error) {
    console.error("Error fetching current song:", error);
    throw error;
  }
};



// import axios from "axios";

// const CLIENT_ID = "24c09368d3394fec8a58788383ff9d60";
// const CLIENT_SECRET = "6d7b743de51b4e0498c0ce3943ba4ba3";
// const REFRESH_TOKEN = "your_refresh_token"; // Store securely, do not hardcode in production

// let accessToken = "your_initial_access_token"; // Will be updated dynamically

// const apiClient = axios.create({
//   baseURL: "http://localhost:8000", // Fixed URL (no HTTPS)
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// // Function to refresh the token
// const refreshAccessToken = async () => {
//   try {
//     const response = await axios.post(
//       "https://accounts.spotify.com/api/token", // Corrected URL
//       new URLSearchParams({
//         grant_type: "refresh_token",
//         refresh_token: REFRESH_TOKEN,
//         client_id: CLIENT_ID,
//         client_secret: CLIENT_SECRET,
//       }),
//       { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
//     );

//     accessToken = response.data.access_token;
//     console.log("New Access Token:", accessToken);

//     // Update headers in apiClient to use new token
//     apiClient.defaults.headers["Authorization"] = `Bearer ${accessToken}`;

//     return accessToken;
//   } catch (error) {
//     console.error("Error refreshing token:", error.response?.data || error.message);
//     throw error;
//   }
// };

// // Axios request wrapper with auto-refresh
// const spotifyRequest = async (url, method = "GET") => {
//   try {
//     const response = await apiClient({
//       url,
//       method,
//       headers: { Authorization: `Bearer ${accessToken}` }, // Ensure token is sent
//     });
//     return response.data;
//   } catch (error) {
//     if (error.response?.status === 401) {
//       console.log("Access token expired. Refreshing...");
//       accessToken = await refreshAccessToken();
      
//       // Retry the request with the new token
//       return spotifyRequest(url, method);
//     } else {
//       throw error;
//     }
//   }
// };

// // Fetch current song
// export const getCurrentSong = async () => {
//   try {
//     console.log("Sending token:", accessToken); // Debug log
//     const response = await apiClient.get("/current_song", {
//       headers: {
//         Authorization: `Bearer ${accessToken}`, // Ensure token is sent
//       },
//     });
//     return response.data;
//   } catch (error) {
//     console.error("Error fetching current song:", error);
//     throw error;
//   }
// };
