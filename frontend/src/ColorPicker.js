import React, { useState, useEffect, useRef } from "react";
import { SketchPicker } from "react-color";
import { Button, Box, Paper, Grid } from "@mui/material";

const ColorPicker = () => {
  const [color, setColor] = useState("#ff0000");
  const [socketStatus, setSocketStatus] = useState("Disconnected"); // Track WebSocket connection status
  const ws = useRef(null); // Use a ref instead of state

  useEffect(() => {
    const connectWebSocket = () => {
      ws.current = new WebSocket("ws://localhost:8000/ws");

    ws.onmessage = (event) => {
    try {
      // Try to parse the response as JSON
      const response = JSON.parse(event.data);
      console.log("Received response:", response);
      // Use response.message (which will contain the color info)
    } catch (error) {
      // If the message is not JSON, log the error
      console.error("Error parsing JSON:", error);
    }};

      ws.current.onopen = () => {
        console.log("WebSocket connected");
        setSocketStatus("Connected"); // Update socket status to connected
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        console.log("Error details:", error.message); // Log detailed error message
        setSocketStatus("Error"); // Update socket status to error on WebSocket error
      };

      ws.current.onclose = (event) => {
        console.log("WebSocket closed:", event);
        setSocketStatus("Disconnected"); // Update socket status to disconnected when WebSocket closes
        if (ws.current.readyState === WebSocket.CLOSED) {
          setTimeout(connectWebSocket, 3000); // Reconnect after 3 seconds
        }
      };
    };

    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const handleColorChange = (newColor) => {
    setColor(newColor.hex);
  };
  const sendColor = () => {
    console.log("WebSocket readyState:", ws.current.readyState); // Log the readyState
  
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const colorData = JSON.stringify({ color }); // Wrap the color in a JSON object
      console.log("Sending data:", colorData); // Log the data being sent
      ws.current.send(colorData); // Send the JSON string
    } else {
      console.error("WebSocket not connected");
    }
  };
  

  return (
    <Grid container spacing={2} justifyContent="center">
      {/* Color Picker */}
      <Grid item>
        <Box sx={{ textAlign: "center", padding: 2 }}>
          <SketchPicker color={color} onChange={handleColorChange} />
          <Button
            variant="contained"
            color="primary"
            onClick={sendColor}
            sx={{ marginTop: 2 }}
          >
            Send Color
          </Button>
        </Box>
      </Grid>

      {/* Control Panel with Buttons */}
      <Grid item>
        <Paper
          sx={{
            padding: 2,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
          elevation={3}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Button variant="contained" color="secondary">
              Loop
            </Button>
            <Button variant="contained" color="warning">
              Fade
            </Button>
            <Button variant="contained" color="success">
              Multi Color
            </Button>
            
            <Button variant="contained" color="error">
              Multi-Fade
            </Button>
          </Box>
        </Paper>
      </Grid>

      {/* Display WebSocket Status */}
      <Grid item>
        <Box sx={{ textAlign: "center", padding: 2 }}>
          <h3>WebSocket Status: {socketStatus}</h3>
        </Box>
      </Grid>
    </Grid>
  );
};

export default ColorPicker;
